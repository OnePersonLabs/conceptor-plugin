import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

export const APPLY_PLAN_LIMIT_BYTES = 64 * 1024;
export const APPLY_PLAN_PATH = '.conceptor/APPLY_PLAN.md';
export const APPLY_PLAN_PENDING_PATH = '.conceptor/APPLY_PLAN.md.pending';

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const isSha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => structuredClone(value);

function fail(message) { throw new Error(message); }

function validateText(value, name, { optional = false } = {}) {
  if (optional && value === undefined) return;
  if (typeof value !== 'string' || !value.trim()) fail(`${name} must be non-empty text`);
}

function normalizeRequest(request) {
  if (!isObject(request)) fail('request must be an object');
  validateText(request.content, 'request.content');
  const id = request.id === undefined ? `local-${crypto.randomUUID()}` : request.id;
  validateText(id, 'request.id');
  const revision = request.revision === undefined ? sha256(request.content) : request.revision;
  validateText(revision, 'request.revision');
  const normalized = { id, revision, content: request.content };
  if (request.source !== undefined) {
    validateText(request.source, 'request.source');
    normalized.source = request.source;
  }
  return normalized;
}

function normalizeUnits(units) {
  if (!Array.isArray(units)) fail('units must be an array');
  const ids = new Set();
  const normalized = units.map((unit, index) => {
    if (!isObject(unit)) fail(`units[${index}] must be an object`);
    validateText(unit.id, `units[${index}].id`);
    validateText(unit.text, `units[${index}].text`);
    if (/[\r\n]/.test(unit.text)) fail(`units[${index}].text must fit on one Markdown task line`);
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(unit.id)) fail(`Invalid task id: ${unit.id}`);
    if (ids.has(unit.id)) fail(`Duplicate task id: ${unit.id}`);
    ids.add(unit.id);
    const dependsOn = unit.dependsOn ?? [];
    if (!Array.isArray(dependsOn) || dependsOn.some(id => typeof id !== 'string')) fail(`units[${index}].dependsOn must be an array of task ids`);
    return { id: unit.id, text: unit.text, dependsOn: [...new Set(dependsOn)] };
  });
  const positions = new Map(normalized.map((unit, index) => [unit.id, index]));
  for (const unit of normalized) for (const dependency of unit.dependsOn) {
    const position = positions.get(dependency);
    if (position === undefined) fail(`Task ${unit.id} depends on missing task ${dependency}`);
    if (position >= positions.get(unit.id)) fail(`Task ${unit.id} must follow dependency ${dependency}`);
  }
  return normalized;
}

function normalizeStringList(value, name) {
  if (!Array.isArray(value)) fail(`${name} must be an array`);
  return value.map((entry, index) => {
    validateText(entry, `${name}[${index}]`);
    return entry;
  });
}

function validateMetadata(metadata) {
  if (!isObject(metadata) || metadata.schema !== 1) fail('Unsupported APPLY_PLAN.md metadata');
  if (metadata.basedOn !== null && metadata.basedOn !== undefined && !isSha256(metadata.basedOn)) fail('Plan basedOn must be a SHA-256 revision or null');
  if (!Array.isArray(metadata.requests) || metadata.requests.length < 1) fail('Plan must contain at least one current accepted request');
  const ids = new Set();
  for (const request of metadata.requests) {
    if (!isObject(request) || typeof request.id !== 'string' || typeof request.revision !== 'string') fail('Stored requests must include explicit id and revision values');
    const normalized = normalizeRequest(request);
    if (normalized.id !== request.id || normalized.revision !== request.revision) fail('Stored request identity is invalid');
    if (ids.has(normalized.id)) fail(`Duplicate active request id: ${normalized.id}`);
    ids.add(normalized.id);
  }
  validateText(metadata.target, 'target');
  if (metadata.baseline !== undefined) validateText(metadata.baseline, 'baseline');
  if (metadata.decisions !== undefined) normalizeStringList(metadata.decisions, 'decisions');
  if (metadata.uncertainties !== undefined) normalizeStringList(metadata.uncertainties, 'uncertainties');
}

function serializePlan(metadata, units) {
  validateMetadata(metadata);
  const yaml = YAML.stringify(metadata, { lineWidth: 0 }).trimEnd();
  const lines = ['---', yaml, '---', '', '# Apply plan', '', 'Remaining work, in dependency order:', ''];
  for (const unit of units) {
    lines.push(`- [ ] \`${unit.id}\` -- ${unit.text}`);
    if (unit.dependsOn.length) lines.push(`  depends-on: ${JSON.stringify(unit.dependsOn)}`);
  }
  lines.push('');
  const serialized = lines.join('\n');
  if (Buffer.byteLength(serialized) > APPLY_PLAN_LIMIT_BYTES) fail(`Apply plan exceeds ${APPLY_PLAN_LIMIT_BYTES} bytes`);
  return serialized;
}

function parsePlan(serialized) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(serialized);
  if (!match) fail('APPLY_PLAN.md has invalid YAML frontmatter');
  let metadata;
  try { metadata = YAML.parse(match[1]); } catch (error) { fail(`APPLY_PLAN.md metadata is invalid: ${error.message}`); }
  validateMetadata(metadata);
  const tasks = [];
  const bodyLines = match[2].split(/\r?\n/);
  for (let index = 0; index < bodyLines.length; index++) {
    const line = bodyLines[index];
    if (/^- \[[xX]\] /.test(line)) fail('Completed tasks must be removed from the live plan');
    if (line.startsWith('  depends-on:')) fail('Dependency line must follow a task line');
    if (!line.startsWith('- [ ] `')) continue;
    const task = /^- \[ \] `([^`]+)` -- (.+)$/.exec(line);
    if (!task) fail(`Invalid remaining task line: ${line}`);
    let dependsOn = [];
    if (bodyLines[index + 1]?.startsWith('  depends-on:')) {
      try { dependsOn = JSON.parse(bodyLines[++index].slice('  depends-on:'.length).trim()); }
      catch (error) { fail(`Invalid dependency list after task ${task[1]}: ${error.message}`); }
      if (!Array.isArray(dependsOn)) fail(`Dependencies after task ${task[1]} must be an array`);
    }
    tasks.push({ id: task[1], text: task[2], dependsOn });
  }
  const units = normalizeUnits(tasks);
  const canonical = serializePlan(metadata, units);
  if (canonical !== serialized) fail('APPLY_PLAN.md is not in canonical format; reconcile it before updating');
  return { metadata: clone(metadata), units, revision: sha256(serialized), serialized };
}

function validatePermission(request, action) {
  if (['read'].includes(action)) return;
  if (request.readOnly === true || request.permissionMode === 'plan') fail(`${action} cannot change files in read-only or Plan Mode`);
}

async function validateRoot(root) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) fail('root must be an absolute repository path');
  const realRoot = await fs.realpath(root);
  const conceptor = path.join(realRoot, '.conceptor');
  const stat = await fs.lstat(conceptor).catch(error => error.code === 'ENOENT' ? null : Promise.reject(error));
  if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) fail('Expected a physical .conceptor directory at the selected repository root');
  if (await fs.realpath(conceptor) !== conceptor) fail('.conceptor must not resolve outside or away from the selected repository root');
  return { realRoot, conceptor, plan: path.join(conceptor, 'APPLY_PLAN.md'), pending: path.join(conceptor, 'APPLY_PLAN.md.pending') };
}

async function readRegular(file, label) {
  let stat;
  try { stat = await fs.lstat(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular file`);
  if (stat.size > APPLY_PLAN_LIMIT_BYTES) fail(`${label} exceeds ${APPLY_PLAN_LIMIT_BYTES} bytes`);
  const handle = await fs.open(file, 'r');
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino) fail(`${label} changed while being opened`);
    const content = await handle.readFile();
    if (content.byteLength > APPLY_PLAN_LIMIT_BYTES) fail(`${label} exceeds ${APPLY_PLAN_LIMIT_BYTES} bytes`);
    return content.toString('utf8');
  } finally { await handle.close(); }
}

async function inspect(locations) {
  const [serialized, pendingText] = await Promise.all([
    readRegular(locations.plan, 'APPLY_PLAN.md'),
    readRegular(locations.pending, 'APPLY_PLAN.md.pending')
  ]);
  const plan = serialized === null ? null : parsePlan(serialized);
  let pending = null;
  if (pendingText !== null) {
    try {
      const candidate = parsePlan(pendingText);
      pending = { valid: true, baseRevision: candidate.metadata.basedOn ?? null, candidateRevision: candidate.revision, pendingRevision: candidate.revision, bytes: Buffer.byteLength(pendingText) };
    } catch (error) {
      pending = { valid: false, baseRevision: null, candidateRevision: null, pendingRevision: sha256(pendingText), bytes: Buffer.byteLength(pendingText), error: error.message };
    }
  }
  return { plan, pending };
}

async function requireIgnoredPending(root) {
  const insideGit = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (insideGit.error?.code === 'ENOENT') return;
  if (insideGit.error) fail(`Could not verify Git state before changing the apply plan: ${insideGit.error.message}`);
  if (insideGit.status !== 0) return;
  const ignored = spawnSync('git', ['check-ignore', '--no-index', '--quiet', '--', APPLY_PLAN_PENDING_PATH], { cwd: root, windowsHide: true });
  if (ignored.error) fail(`Could not verify the pending-file ignore rule: ${ignored.error.message}`);
  if (ignored.status !== 0) fail(`Add ${APPLY_PLAN_PENDING_PATH} to the repository .gitignore before changing the apply plan`);
}

function makeMetadata(input, requests) {
  const metadata = { schema: 1, requests, target: input.target };
  for (const key of ['baseline', 'decisions', 'uncertainties']) if (input[key] !== undefined) {
    metadata[key] = key === 'decisions' || key === 'uncertainties' ? normalizeStringList(input[key], key) : input[key];
  }
  validateMetadata(metadata);
  return metadata;
}

function getRequestsForAccept(current, requested, reassessed) {
  if (!current) return [requested];
  const existing = current.metadata.requests.find(item => item.id === requested.id);
  if (existing) {
    if (existing.revision === requested.revision) {
      if (existing.content !== requested.content || existing.source !== requested.source) fail(`Request ${requested.id} was reused with conflicting content at revision ${requested.revision}`);
      return current.metadata.requests;
    }
    if (reassessed !== true) fail(`Request ${requested.id} changed revision; set reassessed:true after reassessing the combined target`);
    return current.metadata.requests.map(item => item.id === requested.id ? requested : item);
  }
  return [...current.metadata.requests, requested];
}

async function replaceRecord(locations, current, serialized, expectedRevision) {
  const actual = current?.revision ?? null;
  if (actual !== expectedRevision) fail(`Stale apply-plan update: expected ${expectedRevision ?? 'empty'}, found ${actual ?? 'empty'}`);
  if (await readRegular(locations.pending, 'APPLY_PLAN.md.pending') !== null) fail('An apply-plan pending file already exists; inspect it and use explicit recovery before writing');
  const candidateRevision = sha256(serialized);
  if (Buffer.byteLength(serialized) > APPLY_PLAN_LIMIT_BYTES) fail(`Pending apply-plan record exceeds ${APPLY_PLAN_LIMIT_BYTES} bytes; reduce the plan size`);
  const handle = await fs.open(locations.pending, 'wx');
  let ownsPending = true;
  let identity;
  try {
    identity = await handle.stat();
    await handle.writeFile(serialized, 'utf8');
    await handle.sync();
    await handle.close();
    const reread = await inspect(locations);
    if ((reread.plan?.revision ?? null) !== actual) fail('Apply plan changed during update; this update was rejected');
    if (reread.pending?.candidateRevision !== candidateRevision || reread.pending.baseRevision !== actual) fail('Pending candidate changed while being written');
    await fs.rename(locations.pending, locations.plan);
    ownsPending = false;
    return candidateRevision;
  } catch (error) {
    try { await handle.close(); } catch {}
    if (ownsPending) {
      // Exclusive creation establishes ownership; device/inode protects against replacement.
      try {
        const current = await fs.lstat(locations.pending);
        if (identity && current.isFile() && !current.isSymbolicLink() && current.dev === identity.dev && current.ino === identity.ino) await fs.unlink(locations.pending);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') error.message += `; cleanup of owned pending file failed: ${cleanupError.message}`;
      }
    }
    throw error;
  }
}

export async function applyPlan(root, request = {}) {
  if (!isObject(request)) fail('apply-plan request must be an object');
  const action = request.action ?? 'read';
  if (!['read', 'accept', 'update', 'recover', 'finish'].includes(action)) fail(`Unknown apply-plan action: ${action}`);
  validatePermission(request, action);
  const locations = await validateRoot(root);
  const inspected = await inspect(locations);
  if (action === 'read') return {
    status: inspected.pending ? 'recovery-required' : inspected.plan ? 'active' : 'absent',
    revision: inspected.plan?.revision ?? null,
    plan: inspected.plan,
    pending: inspected.pending
  };

  if (action === 'recover') {
    if (!inspected.pending) fail('There is no pending apply-plan record to recover');
    if (request.ownedCheckout !== true || request.soleRecoveryActor !== true || request.reconciled !== true) fail('Recovery requires ownedCheckout:true, soleRecoveryActor:true, and reconciled:true after checking the checkout and pending record');
    if (request.expectedRevision !== (inspected.plan?.revision ?? null) || request.expectedPendingRevision !== inspected.pending.pendingRevision) fail('Recovery identities are stale; reread the current and pending records');
    if (!['install', 'discard'].includes(request.mode)) fail("recover mode must be 'install' or 'discard'");
    if (request.mode === 'install') await requireIgnoredPending(locations.realRoot);
    const latest = await inspect(locations);
    if ((latest.plan?.revision ?? null) !== request.expectedRevision || latest.pending?.pendingRevision !== request.expectedPendingRevision) fail('Recovery record changed before mutation; reread and reconcile both files');
    if (request.mode === 'install') {
      if (!latest.pending.valid) fail('The pending candidate is malformed and cannot be installed; discard it after reconciling the checkout');
      if (latest.pending.baseRevision !== (latest.plan?.revision ?? null)) fail('Pending candidate was based on a different plan; reconcile it manually before installation');
      await fs.rename(locations.pending, locations.plan);
      return { revision: latest.pending.candidateRevision, recovered: 'installed' };
    }
    await fs.unlink(locations.pending);
    return { revision: latest.plan?.revision ?? null, recovered: 'discarded' };
  }

  if (inspected.pending) fail('An apply-plan pending file already exists; inspect it and use explicit recovery before writing');
  const current = inspected.plan;
  const expectedRevision = request.expectedRevision ?? null;
  if (expectedRevision !== (current?.revision ?? null)) fail(`Stale apply-plan update: expected ${expectedRevision}, found ${current?.revision ?? 'empty'}`);

  if (action === 'finish') {
    if (!current) fail('There is no active apply plan to finish');
    if (request.verified !== true && request.cancellationReconciled !== true) fail('Finishing requires verified:true or cancellationReconciled:true');
    if (request.verified === true && current.units.length) fail('Cannot finish while remaining tasks are listed');
    if ((current.metadata.uncertainties ?? []).length) fail('Cannot finish while unresolved uncertainties remain');
    await requireIgnoredPending(locations.realRoot);
    // The fixed pending file also serializes finish against updates. If the process
    // stops after deleting the plan, recovery can discard this stale candidate.
    const handle = await fs.open(locations.pending, 'wx');
    let identity;
    let planRemoved = false;
    try {
      identity = await handle.stat();
      await handle.writeFile(current.serialized, 'utf8');
      await handle.sync();
      await handle.close();
      const locked = await inspect(locations);
      if (locked.plan?.revision !== current.revision || locked.pending?.candidateRevision !== current.revision) fail('Apply plan changed while finishing; this finish was rejected');
      await fs.unlink(locations.plan);
      planRemoved = true;
      await fs.unlink(locations.pending);
    } catch (error) {
      try { await handle.close(); } catch {}
      if (!planRemoved && identity) {
        try {
          const pendingStat = await fs.lstat(locations.pending);
          if (pendingStat.isFile() && !pendingStat.isSymbolicLink() && pendingStat.dev === identity.dev && pendingStat.ino === identity.ino) await fs.unlink(locations.pending);
        } catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') error.message += `; cleanup of owned pending file failed: ${cleanupError.message}`;
        }
      }
      throw error;
    }
    return { revision: null, finished: true };
  }

  await requireIgnoredPending(locations.realRoot);
  let metadata;
  let units;
  if (action === 'accept') {
    const accepted = normalizeRequest(request.request);
    const requests = getRequestsForAccept(current, accepted, request.reassessed);
    if (current && requests === current.metadata.requests) return { revision: current.revision, plan: current, unchanged: true };
    if (current && request.reassessed !== true) fail('Joining a request changes the combined target; set reassessed:true after replanning it');
    metadata = makeMetadata(request, requests);
    units = normalizeUnits(request.units);
  } else {
    if (!current) fail('Cannot update without an active plan; use accept');
    if (request.requests !== undefined && !Array.isArray(request.requests)) fail('requests must be an array');
    const nextRequests = request.requests === undefined ? current.metadata.requests : request.requests.map(normalizeRequest);
    const priorById = new Map(current.metadata.requests.map(item => [item.id, item]));
    const retained = new Map(nextRequests.map(item => [item.id, item]));
    if (nextRequests.some(item => !priorById.has(item.id))) fail('New requests must be admitted through accept with reassessed:true');
    const modified = nextRequests.some(item => JSON.stringify(priorById.get(item.id)) !== JSON.stringify(item));
    const removed = current.metadata.requests.some(item => !retained.has(item.id));
    if (modified) fail('update cannot rewrite accepted request identities or content; accept a new revision with reassessed:true');
    if (removed && (request.reassessed !== true || request.cancellationReconciled !== true)) fail('Removing accepted requests requires reassessed:true and cancellationReconciled:true');
    if (request.target !== undefined && request.target !== current.metadata.target && request.reassessed !== true) fail('Changing the combined target requires reassessed:true');
    if (request.baseline !== undefined && request.baseline !== current.metadata.baseline && request.reassessed !== true) fail('Changing the starting baseline requires reassessed:true');
    metadata = makeMetadata({
      target: request.target ?? current.metadata.target,
      ...(request.baseline !== undefined ? { baseline: request.baseline } : current.metadata.baseline !== undefined ? { baseline: current.metadata.baseline } : {}),
      decisions: request.decisions ?? current.metadata.decisions ?? [],
      uncertainties: request.uncertainties ?? current.metadata.uncertainties ?? []
    }, nextRequests.map(normalizeRequest));
    units = normalizeUnits(request.units ?? current.units);
  }
  metadata.basedOn = current?.revision ?? null;
  const serialized = serializePlan(metadata, units);
  const candidate = parsePlan(serialized);
  const revision = await replaceRecord(locations, current, serialized, expectedRevision);
  return { revision, plan: candidate };
}
