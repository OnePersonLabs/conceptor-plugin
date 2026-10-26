import { activeRoot, inactive } from './activation.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { hash, projectPath, discover, captureScope } from './state.mjs';
import { readCache, writeCache } from './storage.mjs';
import { loadMeaning, conditionOf, selectLenses } from './meaning.mjs';
import { observe } from './providers/index.mjs';

export async function focus(root, request = {}) {
  const activatedProject = await activeRoot(root);
  if (!activatedProject) return inactive(root);
  root = activatedProject;
  if (request.work !== undefined) throw new Error("Conceptor task checkpoints were removed; keep task state in the native workflow and omit work");
  const records = await loadMeaning(root);
  const active = records.filter(item => item.status !== 'retired');
  if (!request.concepts?.length && !request.query && !request.paths?.length && !request.lenses?.length) return { index: active.map(({ id, kind, title, file }) => ({ id, kind, title, file })), instruction: 'Select relevant identities, words, or paths; no global graph was loaded into the packet' };
  const words = request.query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  const selected = active.filter(item => request.concepts?.includes(item.id) || request.lenses?.includes(item.id) || words.some(word => `${item.title} ${item.id} ${item.body}`.toLowerCase().includes(word)));
  for (const id of request.concepts ?? []) if (!active.some(record => record.id === id)) throw new Error(`Unknown active meaning: ${id}`);
  if (request.paths?.length) {
    for (const lens of active.filter(item => item.kind === 'lens')) {
      const population = await discover(root, (lens.selectors ?? []).flatMap(selector => selector.patterns));
      if (request.paths.some(file => population.includes(file))) {
        if (!selected.includes(lens)) selected.push(lens);
        for (const ref of lens.conditions ?? []) { const concept = active.find(item => item.id === ref.split('#')[0]); if (concept && !selected.includes(concept)) selected.push(concept); }
      }
    }
  }
  const ids = new Set(selected.map(record => record.id));
  const related = active.filter(item => !ids.has(item.id) && ((item.kind === 'lens' && item.conditions?.some(ref => ids.has(ref.split('#')[0]))) || item.concepts?.some(id => ids.has(id)) || selected.some(record => record.relations?.some(link => link.target === item.id))));
  return { meaning: selected, related: related.map(({ id, kind, title, file }) => ({ id, kind, title, file })), observations: 'Request a provider explicitly when current code facts would help' };
}

async function selections(root, lens) {
  const result = [];
  for (const selector of lens.selectors) {
    try {
      const scope = await captureScope(root, selector.patterns);
      result.push({ ...selector, status: scope.inputs.length ? 'populated' : 'empty', scope, units: scope.inputs.map(input => ({ id: `${lens.id}/${selector.id}/${input.path}`, path: input.path, sourceHash: input.hash, role: selector.role, participatesIn: lens.conditions })) });
    } catch (error) { result.push({ ...selector, status: 'unresolved', units: [], reason: error.message }); }
  }
  return result;
}

export async function revisit(root, request = {}) {
  const activatedProject = await activeRoot(root);
  if (!activatedProject) return inactive(root);
  root = activatedProject;
  if (request.work !== undefined) throw new Error("Conceptor task checkpoints were removed; keep task state in the native workflow and omit work");
  if (!request.lenses?.length && !request.concepts?.length) throw new Error('Revisit needs explicit Lens or Concept identities');
  const records = await loadMeaning(root);
  const results = [];
  for (const lens of selectLenses(records, request)) {
    const previous = await readCache(root, `selection:${lens.id}`);
    const current = await selections(root, lens);
    const prior = new Set(previous?.selectors?.flatMap(selector => selector.units.map(unit => unit.path)) ?? []);
    const now = new Set(current.flatMap(selector => selector.units.map(unit => unit.path)));
    const baseline = previous && previous.lensHash === lens.hash ? 'available' : 'missing';
    const result = { lens: lens.id, lensHash: lens.hash, selectors: current, baseline, added: baseline === 'available' ? [...now].filter(file => !prior.has(file)) : [], removed: baseline === 'available' ? [...prior].filter(file => !now.has(file)) : [], coverage: 'Declared source population only; runtime/external completeness is unclaimed' };
    await writeCache(root, `selection:${lens.id}`, result);
    results.push(result);
  }
  const boundaryPatterns = [...new Set(request.paths ?? [])];
  const selectedPaths = new Set(results.flatMap(result => result.selectors.flatMap(selector => selector.units.map(unit => unit.path))));
  let boundary;
  const discoveryQuestions = [];
  if (boundaryPatterns.length) {
    const cacheKey = `boundary:${hash(boundaryPatterns)}`;
    const previous = await readCache(root, cacheKey);
    const current = await captureScope(root, boundaryPatterns);
    const before = new Map((previous?.inputs ?? []).map(input => [input.path, input.hash]));
    const after = new Map(current.inputs.map(input => [input.path, input.hash]));
    const changed = previous ? [...new Set([...before.keys(), ...after.keys()])].filter(file => before.get(file) !== after.get(file)) : [];
    boundary = { scope: current, baseline: previous ? 'available' : 'missing', changed };
    for (const file of changed.filter(file => !selectedPaths.has(file))) discoveryQuestions.push({ path: file, reason: 'Changed within the directive boundary but outside current Lens selection; investigate relevance and check coverage' });
    await writeCache(root, cacheKey, current);
  }
  const observations = [];
  for (const lens of selectLenses(records, request)) for (const providerRequest of lens.observations ?? []) observations.push(await observe(root, providerRequest));
  if (request.query) observations.push(await observe(root, { provider: 'inventory', operation: 'relationships', files: [...new Set([...selectedPaths, ...(boundary?.scope.inputs.map(input => input.path) ?? [])])], literal: request.query }));
  return { selections: results, boundary, discoveryQuestions, observations };
}

async function checkScope(root, lens, check) {
  const patterns = [...new Set([...lens.selectors.filter(selector => check.selectors.includes(selector.id)).flatMap(selector => selector.patterns), ...(check.inputs ?? []), 'package.json', 'Cargo.toml', 'pyproject.toml', '*.csproj', 'tsconfig*.json', '.conceptor/config.json'])];
  const files = [];
  for (const arg of [check.command, ...check.args]) {
    if (typeof arg !== 'string' || path.isAbsolute(arg) || arg.startsWith('-')) continue;
    try { const file = await projectPath(root, arg); if ((await fs.stat(file)).isFile()) files.push(arg); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return captureScope(root, patterns, files);
}

function checkBinding(lens, concept, check) {
  return hash({ lens: lens.hash, concept: concept.hash, check, node: process.version, platform: process.platform, environment: hash(process.env) });
}

async function executeCheck(root, lens, concept, check) {
  const before = await checkScope(root, lens, check);
  const binding = checkBinding(lens, concept, check);
  const id = randomUUID();
  const capture = () => ({ chunks: [], bytes: 0, truncated: false });
  const stdout = capture();
  const stderr = capture();
  const append = (stream, chunk) => {
    const kept = chunk.subarray(0, Math.max(0, 64 * 1024 - stream.bytes));
    if (kept.length) stream.chunks.push(Buffer.from(kept));
    stream.bytes += kept.length;
    stream.truncated ||= kept.length < chunk.length;
  };
  const outcome = await new Promise(resolve => {
    const child = spawn(check.command, check.args, { cwd: root, env: { ...process.env, ...(check.env ?? {}) }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, shell: false });
    // Keep draining both streams after the limit so noisy checks cannot deadlock.
    child.stdout.on('data', chunk => append(stdout, chunk));
    child.stderr.on('data', chunk => append(stderr, chunk));
    let failure;
    child.once('error', error => { failure = error.message; });
    child.once('close', (exitCode, signal) => resolve({ exitCode: failure ? null : exitCode, signal, ...(failure ? { error: failure } : {}) }));
  });
  const after = await checkScope(root, lens, check);
  const current = before.fingerprint === after.fingerprint;
  const receipt = { id, lens: lens.id, check: check.id, binding, scope: before, target: check.target ?? process.platform, evidence: check.evidence, conditions: check.conditions, selectors: check.selectors, coverage: check.coverage, ...outcome, current, status: !current || outcome.error || outcome.signal || outcome.exitCode === null ? 'unresolved' : outcome.exitCode === 0 ? 'supported' : 'mismatch', output: { stdout: Buffer.concat(stdout.chunks).toString('utf8'), stderr: Buffer.concat(stderr.chunks).toString('utf8'), stdoutTruncated: stdout.truncated, stderrTruncated: stderr.truncated } };
  await writeCache(root, `check:${lens.id}/${check.id}`, receipt);
  return receipt;
}

async function obtainCheck(root, lens, concept, check, run) {
  if (run) return executeCheck(root, lens, concept, check);
  const previous = await readCache(root, `check:${lens.id}/${check.id}`);
  if (!previous) return { check: check.id, status: 'unresolved', reason: 'No check receipt; use runChecks to execute an applicable native check' };
  const current = await checkScope(root, lens, check);
  if (previous.binding !== checkBinding(lens, concept, check) || previous.scope.fingerprint !== current.fingerprint || !previous.current) return { ...previous, status: 'unresolved', current: false, reason: 'Source, membership, condition, Lens/check, environment, or target changed' };
  return previous;
}

function coveragePaths(lens, check, selector) {
  if (check.coverage === 'selection') return selector.units.map(unit => unit.path);
  if (Array.isArray(check.coverage)) return check.coverage;
  return lens.selectors.filter(item => check.selectors.includes(item.id)).flatMap(item => item.patterns.filter(pattern => !/[!*?{[\]]/.test(pattern)));
}

export async function reconcile(root, request = {}) {
  const activatedProject = await activeRoot(root);
  if (!activatedProject) return inactive(root);
  root = activatedProject;
  if (request.work !== undefined) throw new Error("Conceptor task checkpoints were removed; keep task state in the native workflow and omit work");
  if (!request.lenses?.length && !request.concepts?.length) throw new Error('Reconcile needs explicit Lens or Concept identities');
  const records = await loadMeaning(root);
  const lenses = selectLenses(records, request);
  const discovery = await revisit(root, request);
  const observations = discovery.observations;
  const receipts = [];
  const verdicts = [];
  const observedMismatches = [];
  const independent = await captureScope(root, request.paths ?? lenses.flatMap(lens => lens.selectors.flatMap(selector => selector.patterns)));
  const checksByLens = new Map();
  for (const lens of lenses) {
    const lensCheckResults = [];
    for (const check of lens.checks ?? []) {
      const binding = { hash: hash(check.conditions.map(reference => conditionOf(records, reference).concept.hash)) };
      const receipt = await obtainCheck(root, lens, binding, check, request.runChecks === true);
      receipts.push(receipt);
      lensCheckResults.push({ check, receipt });
    }
    checksByLens.set(lens.id, lensCheckResults);
  }
  // Publish only after all selected Lenses have finished. A later Lens can
  // change an earlier Lens's dependency even when their selectors are disjoint.
  for (const lens of lenses) {
    const selection = discovery.selections.find(item => item.lens === lens.id);
    const lensCheckResults = checksByLens.get(lens.id);
    // Later checks can change an earlier check's inputs. Revalidate the whole
    // authored evidence scope before using any receipt in a current verdict.
    let authorityChanged = false;
    for (const record of [lens, ...lens.conditions.map(reference => conditionOf(records, reference).concept)]) {
      try { if (hash(await fs.readFile(await projectPath(root, record.file))) !== record.hash) authorityChanged = true; }
      catch (error) { if (error.code !== 'ENOENT') throw error; authorityChanged = true; }
    }
    for (const { check, receipt } of lensCheckResults) {
      const currentScope = await checkScope(root, lens, check);
      if (authorityChanged || (receipt.scope && currentScope.fingerprint !== receipt.scope.fingerprint)) {
        receipt.observedStatus ??= receipt.status;
        receipt.status = 'unresolved';
        receipt.current = false;
        receipt.reason = authorityChanged ? 'Meaning or Lens changed during reconciliation' : 'Check inputs changed after this observation';
      }
      if (receipt.status === 'mismatch' || receipt.observedStatus === 'mismatch') {
        for (const reference of check.conditions) {
          const { concept, condition } = conditionOf(records, reference);
          if (check.evidence !== condition.evidence) continue;
          const hashes = new Map((receipt.scope?.inputs ?? []).map(input => [input.path, input.hash]));
          const participants = selection.selectors.filter(selector => check.selectors.includes(selector.id)).flatMap(selector => selector.units.filter(unit => coveragePaths(lens, check, selector).includes(unit.path)).map(unit => ({selector:selector.id,unit:{...unit,sourceHash:hashes.get(unit.path)},selection:'populated',status:'mismatch',evidence:[receipt.id],reason:'Participant in the observed failing check scope; refresh current applicability separately'})));
          observedMismatches.push({condition:reference,lens:lens.id,meaningHash:concept.hash,lensHash:lens.hash,participants,status:'mismatch',receipt:{id:receipt.id,check:check.id,binding:receipt.binding,scope:receipt.scope,evidence:receipt.evidence,target:receipt.target,exitCode:receipt.exitCode},scope:'Original observed discrepancy; current verdict may be unresolved after subsequent changes'});
        }
      }
    }
    for (const reference of lens.conditions) {
      const { concept, condition } = conditionOf(records, reference);
      const checkResults = lensCheckResults.filter(item => item.check.conditions.includes(reference));
      const participants = [];
      for (const selector of selection.selectors) {
        if (selector.status !== 'populated') {
          const supported = selector.status === 'empty' && condition.allowsAbsence === true;
          participants.push({ selector: selector.id, selection: selector.status, status: supported ? 'supported' : 'unresolved', evidence: [], reason: supported ? 'Absence permitted within the discovered scope' : selector.reason ?? 'Required realization was not discovered; absence is not satisfaction' });
          continue;
        }
        for (const unit of selector.units) {
          const applicable = checkResults.filter(({ check }) => check.selectors.includes(selector.id) && check.evidence === condition.evidence && coveragePaths(lens, check, selector).includes(unit.path));
          const failed = applicable.find(({ receipt }) => receipt.status === 'mismatch');
          const passed = applicable.find(({ receipt }) => receipt.status === 'supported');
          participants.push({ selector: selector.id, unit, selection: 'populated', status: failed ? 'mismatch' : passed ? 'supported' : 'unresolved', evidence: applicable.map(item => item.receipt.id).filter(Boolean), reason: failed ? 'An applicable native check failed' : passed ? 'Applicable check supports this participant and condition in the captured scope' : 'No current check of the required evidence kind covers this participant' });
        }
      }
      // A writer may move after discovery or after an earlier check; never publish a mixed-state verdict.
      for (const selector of selection.selectors.filter(item => item.scope)) {
        const now = await captureScope(root, selector.patterns);
        if (now.fingerprint !== selector.scope.fingerprint) for (const participant of participants.filter(item => item.selector === selector.id)) { participant.status = 'unresolved'; participant.reason = 'Selected source changed during reconciliation'; }
      }
      if (authorityChanged) for (const participant of participants) { participant.status = 'unresolved'; participant.reason = 'Meaning or Lens changed during reconciliation'; }
      const status = participants.some(item => item.status === 'mismatch') ? 'mismatch' : participants.some(item => item.status === 'unresolved') ? 'unresolved' : 'supported';
      verdicts.push({ condition: reference, lens: lens.id, meaningHash: concept.hash, lensHash: lens.hash, participants, status, scope: 'Only this condition and selected participants; no whole-Concept or application certificate' });
    }
  }
  const result = { verdicts, receipts, observations, discovery, independentSource: independent, status: !verdicts.length || verdicts.some(item => item.status === 'unresolved') ? 'unresolved' : verdicts.some(item => item.status === 'mismatch') ? 'mismatch' : 'supported' };
  if (verdicts.some(item => item.status === 'mismatch')) result.status = 'mismatch';
  if (!verdicts.length) result.reason = 'No accepted Lens observes the selected meaning';
  result.observedMismatches = observedMismatches;
  return result;
}
