import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { activeRoot } from './activation.mjs';
import { loadMeaning } from './meaning.mjs';
import { hash, projectPath } from './state.mjs';

const execute = promisify(execFile);
const scopeFormat = 'conceptor-design-scope/1';
const reviewFormat = 'conceptor-design-review/1';
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const stable = value => Array.isArray(value) ? value.map(stable) : object(value)
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)])) : value;
const digest = value => hash(JSON.stringify(stable(value)));
const unresolved = (issues, extra = {}) => ({ status: 'unresolved', issues, ...extra });

function identityIssues(request) {
  return ['sourceIdentity', 'requestRevision'].filter(key => !nonempty(request?.[key])).map(key => ({ reason: `${key} must be a nonempty opaque caller string` }));
}

async function repositoryIdentity(root) {
  // Only a real local Git marker selects Git identity. Broken Git metadata must
  // not downgrade a repository to a standalone directory and permit rebinding.
  try { await fs.stat(path.join(root, '.git')); }
  catch (error) { if (error.code === 'ENOENT') return { kind: 'standalone', root }; throw error; }
  const { stdout } = await execute('git', ['rev-parse', '--git-common-dir'], { cwd: root, windowsHide: true });
  return { kind: 'git', commonDir: await fs.realpath(path.resolve(root, stdout.trim())) };
}

// Headings inside fenced code are examples, not anchors. A duplicate real
// heading is ambiguous even when the two sections happen to have equal text.
function sectionText(source, name) {
  const lines = source.split(/\r?\n/);
  const headings = [];
  let fence;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      continue;
    }
    if (marker) { fence = { character: marker[1][0], length: marker[1].length }; continue; }
    const atx = /^ {0,3}(#{1,6})(?:[ \t]+(.*?)|[ \t]*)$/.exec(line);
    if (atx) headings.push({ line: index, level: atx[1].length, name: (atx[2] ?? '').replace(/[ \t]+#+[ \t]*$/, '').trim() });
    else if (index > 0 && /^ {0,3}(=+|-+)[ \t]*$/.test(line) && lines[index - 1].trim() && !/^ {4}/.test(lines[index - 1])) {
      headings.push({ line: index - 1, level: line.trim().startsWith('=') ? 1 : 2, name: lines[index - 1].trim() });
    }
  }
  const matches = headings.filter(heading => heading.name === name);
  if (matches.length !== 1) throw new Error(`Section ${JSON.stringify(name)} is ${matches.length ? 'ambiguous' : 'missing'}`);
  const selected = matches[0];
  const end = headings.find(heading => heading.line > selected.line && heading.level <= selected.level)?.line ?? lines.length;
  return lines.slice(selected.line, end).join('\n');
}

function readCapability(record, issues) {
  const value = record.capability;
  if (record.kind !== 'concept' || !object(value) || !nonempty(record.id) || record.id.includes('#')) { issues.push({ ref: record.id, reason: 'capability metadata must be an object on a Concept with a nonempty ID that does not contain #' }); return; }
  if (value.root !== undefined && typeof value.root !== 'boolean') issues.push({ ref: record.id, reason: 'capability.root must be a boolean' });
  const includes = value.includes ?? [];
  if (!Array.isArray(includes) || includes.some(id => !nonempty(id)) || new Set(includes).size !== includes.length) issues.push({ ref: record.id, reason: 'capability.includes must contain unique Concept IDs' });
  const items = [];
  const ids = new Set();
  for (const [field, kind] of [['obligations', 'obligation'], ['scenarios', 'scenario']]) {
    if (value[field] !== undefined && !Array.isArray(value[field])) { issues.push({ ref: record.id, reason: `capability.${field} must be an array` }); continue; }
    for (const item of value[field] ?? []) {
      if (!object(item) || !nonempty(item.id) || item.id.includes('#') || ids.has(item.id) || !nonempty(item.section)) { issues.push({ ref: record.id, reason: 'Capability items need unique IDs across obligations/scenarios and exact section headings' }); continue; }
      ids.add(item.id);
      if (item.sources !== undefined && (!Array.isArray(item.sources) || item.sources.some(source => !object(source) || !nonempty(source.path) || source.section !== undefined && !nonempty(source.section)))) {
        issues.push({ ref: `${record.id}#${item.id}`, reason: 'Item sources need project-relative paths and optional exact section headings' }); continue;
      }
      items.push({ id: item.id, kind, section: item.section, sources: item.sources ?? [] });
    }
  }
  return { id: record.id, status: record.status, file: record.file, root: value.root === true, includes: Array.isArray(includes) ? includes : [], items };
}

async function collect(root, request) {
  const identity = identityIssues(request);
  if (identity.length) return unresolved(identity);
  const activated = await activeRoot(root);
  if (!activated) return unresolved([{ reason: 'Selected project has no root .conceptor directory' }]);
  root = await fs.realpath(activated);
  const records = await loadMeaning(root);
  const issues = [];
  const catalog = records.filter(record => record.capability !== undefined).map(record => readCapability(record, issues)).filter(Boolean);
  const roots = catalog.filter(capability => capability.root);
  if (!roots.length) issues.push({ reason: 'No explicit capability root is declared; a narrower fallback cannot establish project scope' });
  for (const capability of roots) if (capability.status !== 'accepted') issues.push({ ref: capability.id, reason: 'A capability root must be accepted' });
  for (const capability of catalog) {
    for (const id of capability.includes) if (!records.some(record => record.id === id && record.kind === 'concept' && record.status !== 'retired')) issues.push({ ref: capability.id, reason: `Included Concept ${id} is missing, retired, or not a Concept` });
  }
  const reached = new Set();
  const visit = id => {
    if (reached.has(id)) return;
    reached.add(id);
    for (const included of catalog.find(capability => capability.id === id)?.includes ?? []) visit(included);
  };
  for (const capability of roots) visit(capability.id);
  for (const capability of catalog) capability.reached = reached.has(capability.id);
  const governed = records.filter(record => reached.has(record.id) || catalog.some(capability => capability.id === record.id));
  const sections = [];
  const sources = new Map();
  const refs = [];
  for (const capability of catalog) {
    refs.push(capability.id);
    const record = records.find(record => record.id === capability.id);
    for (const item of capability.items) {
      const ref = `${capability.id}#${item.id}`;
      if (capability.status === 'accepted') refs.push(ref);
      try {
        const text = sectionText(record.body, item.section);
        const originalSources = [];
        for (const source of item.sources) {
          if (!sources.has(source.path)) {
            const bytes = await fs.readFile(await projectPath(root, source.path));
            sources.set(source.path, { path: source.path, hash: hash(bytes), text: bytes.toString('utf8') });
          }
          const sourceText = sources.get(source.path).text;
          originalSources.push({ ...source, text: source.section ? sectionText(sourceText, source.section) : sourceText });
        }
        sections.push({ ref, path: record.file, section: item.section, text, sources: originalSources });
      } catch (error) { issues.push({ ref, reason: error.message }); }
    }
  }
  if (issues.length) return unresolved(issues, { context: { capabilities: catalog } });
  const scope = {
    format: scopeFormat,
    repository: await repositoryIdentity(root),
    sourceIdentity: request.sourceIdentity, requestRevision: request.requestRevision,
    records: governed.map(({ id, file, hash: sourceHash, status }) => ({ id, file, hash: sourceHash, status })).sort((a, b) => a.id.localeCompare(b.id)),
    sources: [...sources.values()].map(({ path, hash: sourceHash }) => ({ path, hash: sourceHash })).sort((a, b) => a.path.localeCompare(b.path)),
    catalog, catalogHash: digest(catalog), refs: refs.sort(),
  };
  // The packet must not combine an earlier governing record with later source
  // text or miss a capability added while discovery was in progress.
  const refreshed = await loadMeaning(root);
  const capabilityInputs = input => input.filter(record => record.capability !== undefined).map(({ id, file, hash: sourceHash }) => ({ id, file, hash: sourceHash }));
  if (digest(capabilityInputs(records)) !== digest(capabilityInputs(refreshed)) || governed.some(record => !refreshed.some(item => item.id === record.id && item.file === record.file && item.hash === record.hash))) return unresolved([{ reason: 'Meaning or capability membership changed during design preparation; retry against settled authority' }]);
  for (const source of scope.sources) if (hash(await fs.readFile(await projectPath(root, source.path))) !== source.hash) return unresolved([{ reason: `Local source ${source.path} changed during design preparation; retry against settled authority` }]);
  scope.scopeHash = digest(scope);
  return { format: scopeFormat, status: 'ready', scope, context: { capabilities: catalog, sections, governing: governed.map(({ hash: sourceHash, ...record }) => record), scope: 'Authored capability declarations and local sources only. Structural completeness, hashes, and host-asserted reviewer identities do not establish semantic coverage, agent compliance, or actual product behavior.' }, targetRoot: root };
}

export async function prepareDesign(root, request = {}) {
  try { return await collect(root, request); }
  catch (error) { return unresolved([{ reason: error.message }]); }
}

function proposalIssues(scope, proposal, increment) {
  const issues = [];
  const add = (reason, ref) => issues.push({ ...(ref ? { ref } : {}), reason });
  if (!object(proposal) || !nonempty(proposal.summary) || !Array.isArray(proposal.contracts) || !Array.isArray(proposal.coverage)) return [{ reason: 'Proposal needs summary, contracts, and coverage arrays' }];
  const contracts = new Set();
  for (const contract of proposal.contracts) {
    if (!object(contract) || !nonempty(contract.id) || contracts.has(contract.id) || !nonempty(contract.responsibility) || !Array.isArray(contract.consumers) || !contract.consumers.length || contract.consumers.some(consumer => !nonempty(consumer))) add('Contracts need unique IDs, responsibilities, and nonempty consumers');
    else contracts.add(contract.id);
  }
  const expected = new Set(scope.refs);
  const covered = new Set();
  const dispositions = new Set(['delivered', 'preserved', 'deferred', 'unaffected', 'unresolved']);
  for (const entry of proposal.coverage) {
    if (!object(entry) || !nonempty(entry.ref) || !expected.has(entry.ref) || covered.has(entry.ref)) { add('Coverage ref is unknown, duplicated, or malformed', entry?.ref); continue; }
    covered.add(entry.ref);
    if (!dispositions.has(entry.disposition) || !nonempty(entry.rationale) || !Array.isArray(entry.contractIds) || entry.contractIds.some(id => !contracts.has(id)) || new Set(entry.contractIds).size !== entry.contractIds.length) { add('Coverage needs a disposition, rationale, and valid unique contractIds', entry.ref); continue; }
    if (entry.disposition === 'deferred' && !nonempty(entry.compatibility)) add('Deferred coverage needs an explicit compatibility argument for the complete design and selected increment', entry.ref);
    if (['delivered', 'preserved', 'deferred'].includes(entry.disposition)) {
      if (!entry.contractIds.length || !nonempty(entry.verification)) add('Delivered, preserved, or deferred coverage needs contracts and verification', entry.ref);
      const [concept, itemId] = entry.ref.split('#');
      const item = scope.catalog.find(capability => capability.id === concept)?.items.find(item => item.id === itemId);
      if (item?.kind === 'scenario' && !nonempty(entry.trace)) add('Scenario coverage needs a concrete trace through its contracts', entry.ref);
      if (scope.catalog.find(capability => capability.id === entry.ref)?.status !== undefined && scope.catalog.find(capability => capability.id === entry.ref).status !== 'accepted') add('Candidate or retired capabilities cannot be asserted as accepted delivered, preserved, or deferred obligations', entry.ref);
    }
  }
  for (const ref of expected) if (!covered.has(ref)) add('Required capability, obligation, or scenario has no coverage disposition', ref);
  if (!object(increment) || !nonempty(increment.id) || !nonempty(increment.summary) || !Array.isArray(increment.refs) || !increment.refs.length || increment.refs.some(ref => !expected.has(ref)) || new Set(increment.refs).size !== increment.refs.length || !Array.isArray(increment.verification) || !increment.verification.length || increment.verification.some(value => !nonempty(value))) add('Increment needs an ID, summary, unique valid refs, and nonempty verification');
  else for (const ref of increment.refs) {
    const entry = proposal.coverage.find(entry => entry.ref === ref);
    if (['deferred', 'unaffected'].includes(entry?.disposition)) add('A selected implementation ref cannot be deferred or unaffected; select work delivered or preserved by this increment', ref);
  }
  return issues;
}

const reviewInstructions = `Read the original caller request supplied by the host alongside this input; opaque identity/revision strings cannot replace that request. Independently compare the original governing and historical source context with the proposal across every required ref. Check whole-capability omissions, compatible scenarios, responsibilities and consumers, candidate versus accepted status, source exceptions, and whether each deferral's explicit compatibility argument preserves the intended design while bounding implementation. Check that the selected increment fits that design and can be verified through its consumer. A rationale, compatibility argument, trace, contract ID, or passing structural check is an assertion to examine, not proof of semantic adequacy. Return findings or blocked for missing or contradictory evidence; clear only when the source-covered design and safe deferrals are substantiated. Reviewer/planner IDs are host assertions, not authenticated independence. No model is invoked by this helper.`;

async function checked(root, request) {
  const current = await collect(root, request);
  if (current.status !== 'ready') return current;
  if (!object(request.scope) || request.scope.format !== scopeFormat || digest(request.scope) !== digest(current.scope)) return unresolved([{ reason: 'Design scope is stale, altered, or belongs to another repository/request; prepare it again against current authority' }]);
  if (!nonempty(request.plannerId)) return unresolved([{ reason: 'plannerId must identify the planning host/session' }]);
  const issues = proposalIssues(current.scope, request.proposal, request.increment);
  if (issues.length) return unresolved(issues);
  const bindings = { repository: current.scope.repository, sourceIdentity: request.sourceIdentity, requestRevision: request.requestRevision, scopeHash: current.scope.scopeHash, designHash: digest(request.proposal), incrementHash: digest(request.increment), plannerId: request.plannerId };
  return { current, bindings };
}

export async function checkDesign(root, request = {}) {
  try {
    const checkedResult = await checked(root, request);
    if (!checkedResult.current) return checkedResult;
    const { current, bindings } = checkedResult;
    return {
      status: 'review-required', bindings,
      reviewInput: { context: current.context, proposal: request.proposal, increment: request.increment, requiredRefs: current.scope.refs, instructions: reviewInstructions },
      reviewTemplate: { format: reviewFormat, bindings, reviewerId: '', reviewedRefs: [], verdict: 'blocked', summary: '', findings: [] },
    };
  } catch (error) { return unresolved([{ reason: error.message }]); }
}

export async function handoff(root, request = {}) {
  try {
    const checkedResult = await checked(root, request);
    if (!checkedResult.current) return checkedResult;
    const { current, bindings } = checkedResult;
    const review = request.review;
    const issues = [];
    if (!object(review) || review.format !== reviewFormat || digest(review.bindings) !== digest(bindings)) return unresolved([{ reason: 'Review is missing or its bindings do not match the current design, increment, planner, and authority' }]);
    if (!nonempty(review.reviewerId) || review.reviewerId.trim() === request.plannerId.trim()) issues.push({ reason: 'reviewerId must be nonempty and different from plannerId; identities are host assertions' });
    if (!Array.isArray(review.reviewedRefs) || new Set(review.reviewedRefs).size !== review.reviewedRefs.length || digest([...review.reviewedRefs].sort()) !== digest(current.scope.refs)) issues.push({ reason: 'Review must explicitly cover every required scope ref exactly once' });
    if (!['clear', 'findings', 'blocked'].includes(review.verdict) || !nonempty(review.summary) || !Array.isArray(review.findings) || review.findings.some(finding => !object(finding) || !current.scope.refs.includes(finding.ref) || !nonempty(finding.reason))) issues.push({ reason: 'Review needs a valid verdict, summary, and source-referenced findings' });
    if (review.verdict === 'clear' && review.findings?.length) issues.push({ reason: 'A clear review cannot retain findings' });
    if (review.verdict === 'findings' && !review.findings?.length) issues.push({ reason: 'A findings verdict needs at least one finding' });
    if (review.verdict !== 'clear') issues.push({ reason: `Design review remains ${review.verdict ?? 'unresolved'}` });
    for (const ref of request.increment.refs) {
      if (!['delivered', 'preserved'].includes(request.proposal.coverage.find(entry => entry.ref === ref).disposition)) issues.push({ ref, reason: 'The selected increment must deliver or preserve this ref; unresolved coverage blocks implementation' });
      const capability = current.scope.catalog.find(capability => capability.id === ref);
      if (capability && capability.status !== 'accepted') issues.push({ ref, reason: 'A selected implementation increment cannot implement a candidate or retired capability' });
    }
    if (issues.length) return unresolved(issues);
    return {
      format: 'conceptor-design-handoff/1', status: 'ready', bindings: { ...bindings, targetRoot: current.targetRoot },
      implementation: { capabilities: current.context.capabilities, sources: current.scope.refs, proposal: request.proposal, increment: request.increment, context: current.context },
      review: { reviewerId: review.reviewerId, summary: review.summary },
    };
  } catch (error) { return unresolved([{ reason: error.message }]); }
}
