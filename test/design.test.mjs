import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stringify } from 'yaml';
import { prepareDesign, checkDesign, handoff } from '../plugins/conceptor/runtime/conceptor.mjs';

const run = promisify(execFile);
const identity = { sourceIdentity: 'native-request:ensemble', requestRevision: 'request-v1' };
async function writeMeaning(root, id, metadata, body) {
  await fs.writeFile(path.join(root, '.conceptor/meaning', `${id}.md`), `---\n${stringify({ id, kind: 'concept', title: id, status: 'accepted', ...metadata })}---\n${body}\n`);
}
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-design-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const root = path.join(dir, 'source');
  await fs.mkdir(path.join(root, '.conceptor/meaning'), { recursive: true });
  await fs.writeFile(path.join(root, 'history.md'), '# Historical source\n\n## Decisions\nKeep the whole ensemble capability.\n\n## Example\nA four-bar loop is one example.\n');
  await writeMeaning(root, 'product', { capability: { root: true, includes: ['continuation', 'assessment'], obligations: [{ id: 'purpose', section: 'Whole capability', sources: [{ path: 'history.md', section: 'Decisions' }] }], scenarios: [{ id: 'ensemble', section: 'Ensemble' }] } }, '# Product\n\n## Whole capability\nPreserve recognition, assessment, configurable continuation and prediction.\n\n## Ensemble\nEach listener hears attributed parts without borrowing skill credit.');
  await writeMeaning(root, 'continuation', { capability: { includes: ['product'], obligations: [{ id: 'roles', section: 'Musical roles' }], scenarios: [{ id: 'listening', section: 'Contextual listening' }] } }, '# Continuation\n\n## Musical roles\nContinue, accompany or develop a part.\n\n```md\n## Contextual listening\nThis fenced heading is an example, not an anchor.\n```\n\n## Contextual listening\nHear the same material sequentially or simultaneously as its role requires.');
  await writeMeaning(root, 'assessment', { capability: { obligations: [{ id: 'evidence', section: 'Evidence' }] } }, '# Assessment\n\n## Evidence\nOnly attributed player performance establishes player ability.');
  await writeMeaning(root, 'prediction', { capability: { obligations: [{ id: 'deadlines', section: 'Deadlines' }] } }, '# Prediction\n\n## Deadlines\nReceiver-specific prediction has playback deadlines and recovery.');
  await writeMeaning(root, 'spatial', { status: 'candidate', capability: { scenarios: [{ id: 'room', section: 'Room' }] } }, '# Candidate\n\n## Room\nA possible shared room remains undecided.');
  await fs.writeFile(path.join(root, 'implementation.mjs'), 'export const version = 1;\n');
  return { root, dir };
}
function proposed(scope) {
  return {
    summary: 'A coherent musical system implemented in bounded portions.',
    contracts: [{ id: 'musical-runtime', responsibility: 'Keep musical role and performance provenance through inference and listening.', consumers: ['workbench', 'games', 'receiver'] }],
    coverage: scope.refs.map(ref => ({ ref, disposition: ref === 'spatial' ? 'unresolved' : ref.startsWith('prediction') ? 'deferred' : 'delivered', rationale: ref === 'spatial' ? 'Candidate remains a choice.' : 'The shared contract preserves this responsibility.', compatibility: 'The workbench role contract does not supply receiver deadline behavior; receiver execution remains deferred and is not claimed by this increment.', contractIds: ref === 'spatial' ? [] : ['musical-runtime'], verification: 'Exercise each claimed role through its consuming interaction.', trace: 'Captured player material -> contextual inference -> selected role -> listener presentation; retain provenance.' })),
  };
}
async function requestFor(root) {
  const prepared = await prepareDesign(root, identity);
  assert.equal(prepared.status, 'ready', JSON.stringify(prepared));
  return { ...identity, plannerId: 'planner-host', scope: prepared.scope, proposal: proposed(prepared.scope), increment: { id: 'roles-first', summary: 'Expose the shared role contract in the workbench.', refs: ['continuation#roles'], verification: ['Play a phrase and consume an attributed continuation.'] } };
}
async function reviewed(root, request) {
  const checked = await checkDesign(root, request);
  assert.equal(checked.status, 'review-required', JSON.stringify(checked));
  return { ...request, review: { format: 'conceptor-design-review/1', bindings: checked.bindings, reviewerId: 'independent-review-host', reviewedRefs: request.scope.refs, verdict: 'clear', summary: 'Sources, cross-scenario fit, and safe deferrals examined.', findings: [] } };
}

test('design scope follows finite includes and keeps disconnected capabilities and candidate status visible', async t => {
  const { root } = await fixture(t);
  const result = await prepareDesign(root, identity);
  assert.equal(result.status, 'ready');
  assert.equal(result.context.capabilities.find(item => item.id === 'continuation').reached, true);
  assert.equal(result.context.capabilities.find(item => item.id === 'prediction').reached, false);
  assert.equal(result.context.capabilities.find(item => item.id === 'spatial').status, 'candidate');
  assert.ok(result.scope.refs.includes('prediction#deadlines'));
  assert.ok(result.scope.refs.includes('spatial'));
  assert.ok(!result.scope.refs.includes('spatial#room'));
  assert.match(result.context.sections.find(item => item.ref === 'product#purpose').sources[0].text, /Keep the whole ensemble/);
  const listening = result.context.sections.find(item => item.ref === 'continuation#listening');
  assert.match(listening.text, /Hear the same material/);
  assert.ok(!listening.text.includes('fenced heading'));
  assert.ok(!JSON.stringify(result.scope).includes('Keep the whole ensemble'));
  assert.match(result.context.scope, /do not establish semantic coverage/);
});

test('a proposed narrow implementation must account for the whole declared design before review', async t => {
  const { root } = await fixture(t);
  const request = await requestFor(root);
  request.proposal.coverage = request.proposal.coverage.filter(entry => entry.ref.startsWith('continuation'));
  const missing = await checkDesign(root, request);
  assert.equal(missing.status, 'unresolved');
  assert.ok(missing.issues.some(issue => issue.ref === 'prediction#deadlines'));
  assert.ok(missing.issues.some(issue => issue.ref === 'assessment#evidence'));
  const complete = await requestFor(root);
  const checked = await checkDesign(root, complete);
  assert.equal(checked.status, 'review-required');
  assert.match(checked.reviewInput.instructions, /assertion to examine, not proof/);
  const scenario = complete.proposal.coverage.find(entry => entry.ref === 'continuation#listening');
  delete scenario.trace;
  assert.ok((await checkDesign(root, complete)).issues.some(issue => issue.ref === scenario.ref && /trace/.test(issue.reason)));
});

test('coverage validates contracts, dispositions and the increment without treating text as semantic proof', async t => {
  const { root } = await fixture(t);
  const valid = await requestFor(root);
  for (const mutate of [
    request => { request.proposal.contracts[0].consumers = []; },
    request => { request.proposal.coverage[0].contractIds = ['missing']; },
    request => { request.proposal.coverage[0].verification = ''; },
    request => { request.proposal.coverage.push(structuredClone(request.proposal.coverage[0])); },
    request => { request.proposal.coverage[0].disposition = 'assumed'; },
    request => { request.increment.refs = ['unknown']; },
    request => { delete request.proposal.coverage.find(entry => entry.ref === 'prediction').compatibility; },
  ]) {
    const request = structuredClone(valid); mutate(request);
    assert.equal((await checkDesign(root, request)).status, 'unresolved');
  }
  const unaffected = structuredClone(valid);
  Object.assign(unaffected.proposal.coverage.find(entry => entry.ref === 'prediction'), { disposition: 'unaffected', contractIds: [] });
  assert.equal((await checkDesign(root, unaffected)).status, 'review-required');
});

test('handoff requires a distinct asserted reviewer and exact design, increment, source and ref bindings', async t => {
  const { root } = await fixture(t);
  const valid = await reviewed(root, await requestFor(root));
  assert.equal((await handoff(root, valid)).status, 'ready');
  for (const mutate of [
    request => { delete request.review; },
    request => { delete request.review.bindings; },
    request => { request.review.reviewerId = request.plannerId; },
    request => { request.review.reviewedRefs.pop(); },
    request => { request.review.reviewedRefs.push(request.review.reviewedRefs[0]); },
    request => { request.review.findings = [{ ref: 'product', reason: 'Missing compatible scenario' }]; },
    request => { request.review.verdict = 'blocked'; },
    request => { request.review.verdict = 'findings'; request.review.findings = [{ ref: 'product', reason: 'Scope omission' }]; },
    request => { request.proposal.summary += ' Changed after review.'; },
    request => { request.increment.summary += ' Changed after review.'; },
    request => { request.plannerId = 'another-planner'; },
    request => { request.requestRevision = 'different-request'; },
  ]) {
    const request = structuredClone(valid); mutate(request);
    assert.equal((await handoff(root, request)).status, 'unresolved');
  }
  const ready = await handoff(root, valid);
  assert.equal(ready.bindings.targetRoot, await fs.realpath(root));
  assert.ok(ready.implementation.context.sections.length);
  assert.equal(ready.review.reviewerId, 'independent-review-host');
});

test('unresolved work outside the increment requires review; selected unresolved coverage blocks handoff', async t => {
  const { root } = await fixture(t);
  const request = await requestFor(root);
  request.proposal.coverage.find(entry => entry.ref === 'assessment#evidence').disposition = 'unresolved';
  const valid = await reviewed(root, request);
  assert.equal((await handoff(root, valid)).status, 'ready');
  valid.increment.refs.push('assessment#evidence');
  const selected = await reviewed(root, valid);
  const result = await handoff(root, selected);
  assert.equal(result.status, 'unresolved');
  assert.ok(result.issues.some(issue => issue.ref === 'assessment#evidence'));
  const candidate = await requestFor(root);
  candidate.increment.refs = ['spatial'];
  assert.equal((await checkDesign(root, candidate)).status, 'review-required');
  assert.ok((await handoff(root, await reviewed(root, candidate))).issues.some(issue => /candidate or retired/.test(issue.reason)));
});

test('a selected increment cannot claim deferred or unaffected coverage as implementation', async t => {
  const { root } = await fixture(t);
  const valid = await requestFor(root);
  for (const disposition of ['deferred', 'unaffected']) {
    const request = structuredClone(valid);
    const entry = request.proposal.coverage.find(entry => entry.ref === 'continuation#roles');
    entry.disposition = disposition;
    if (disposition === 'unaffected') { entry.contractIds = []; delete entry.verification; }
    const result = await checkDesign(root, request);
    assert.equal(result.status, 'unresolved');
    assert.ok(result.issues.some(issue => issue.ref === entry.ref && /selected implementation ref/.test(issue.reason)));
    assert.equal((await handoff(root, request)).status, 'unresolved');
  }
  const preserved = structuredClone(valid);
  preserved.proposal.coverage.find(entry => entry.ref === 'continuation#roles').disposition = 'preserved';
  assert.equal((await handoff(root, await reviewed(root, preserved))).status, 'ready');
});

test('scope invalidates changed authority, historical sources and capability membership while implementation churn stays applicable', async t => {
  const { root } = await fixture(t);
  let request = await reviewed(root, await requestFor(root));
  await fs.appendFile(path.join(root, 'implementation.mjs'), '// independent implementation work\n');
  assert.equal((await handoff(root, request)).status, 'ready');
  await fs.appendFile(path.join(root, 'history.md'), '\nA newer authored clarification.\n');
  assert.equal((await handoff(root, request)).status, 'unresolved');
  request = await reviewed(root, await requestFor(root));
  await fs.appendFile(path.join(root, '.conceptor/meaning/assessment.md'), '\nAdditional governing exception.\n');
  assert.equal((await handoff(root, request)).status, 'unresolved');
  request = await reviewed(root, await requestFor(root));
  await writeMeaning(root, 'new-consumer', { capability: { obligations: [{ id: 'consumer', section: 'Consumer' }] } }, '# New capability\n\n## Consumer\nPreviously omitted capability.');
  assert.equal((await handoff(root, request)).status, 'unresolved');
});

test('included unannotated candidate meaning retains its authority status and invalidates review when corrected', async t => {
  const { root } = await fixture(t);
  await writeMeaning(root, 'inference-candidate', { status: 'candidate' }, '# Possible inference architecture\n\nRecognition may supply revisable contextual evidence. This mechanism is not accepted.');
  const owner = path.join(root, '.conceptor/meaning/product.md');
  await fs.writeFile(owner, (await fs.readFile(owner, 'utf8')).replace('  includes:\n', '  includes:\n    - inference-candidate\n'));
  const prepared = await prepareDesign(root, identity);
  assert.equal(prepared.status, 'ready');
  const candidate = prepared.context.governing.find(record => record.id === 'inference-candidate');
  assert.equal(candidate.status, 'candidate');
  assert.match(candidate.body, /Recognition may supply revisable contextual evidence/);
  assert.match(candidate.body, /mechanism is not accepted/);
  assert.ok(prepared.scope.records.some(record => record.id === candidate.id && record.status === 'candidate'));
  assert.ok(!prepared.scope.refs.some(ref => ref === candidate.id || ref.startsWith(`${candidate.id}#`)));
  const reviewedInput = await reviewed(root, await requestFor(root));
  assert.equal((await handoff(root, reviewedInput)).status, 'ready');
  await fs.appendFile(path.join(root, '.conceptor/meaning/inference-candidate.md'), '\nThe candidate must also preserve revised interpretations.\n');
  const stale = await handoff(root, reviewedInput);
  assert.equal(stale.status, 'unresolved');
  assert.ok(stale.issues.some(issue => /scope is stale/.test(issue.reason)));
});

test('missing, ambiguous and unsafe source anchors stay unresolved and existing helpers remain independent', async t => {
  const { root } = await fixture(t);
  const original = await fs.readFile(path.join(root, '.conceptor/meaning/product.md'), 'utf8');
  for (const body of [original.replace('section: Whole capability', 'section: Missing'), original + '\n## Whole capability\nDuplicate.\n', original.replace('path: history.md', 'path: ../outside.md')]) {
    await fs.writeFile(path.join(root, '.conceptor/meaning/product.md'), body);
    assert.equal((await prepareDesign(root, identity)).status, 'unresolved');
  }
  await fs.writeFile(path.join(root, '.conceptor/meaning/product.md'), original.replace('root: true', 'root: false'));
  assert.match((await prepareDesign(root, identity)).issues[0].reason, /No explicit capability root/);
  await fs.writeFile(path.join(root, '.conceptor/meaning/product.md'), original.replace('status: accepted', 'status: candidate'));
  assert.ok((await prepareDesign(root, identity)).issues.some(issue => /root must be accepted/.test(issue.reason)));
  await fs.writeFile(path.join(root, '.conceptor/meaning/product.md'), original.replace('- continuation', '- missing'));
  assert.ok((await prepareDesign(root, identity)).issues.some(issue => /Included Concept missing/.test(issue.reason)));
  assert.equal((await prepareDesign(root, {})).status, 'unresolved');
  await fs.rename(path.join(root, '.conceptor'), path.join(root, 'saved'));
  assert.equal((await prepareDesign(root, identity)).status, 'unresolved');
});

test('a handoff transfers only to matching authority in another worktree of the same Git repository', async t => {
  const { root, dir } = await fixture(t);
  await run('git', ['init', '-q', root]);
  await run('git', ['-C', root, 'add', '.']);
  await run('git', ['-C', root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Authored capability scope']);
  const request = await reviewed(root, await requestFor(root));
  const worktree = path.join(dir, 'worktree');
  await run('git', ['-C', root, 'worktree', 'add', '--detach', worktree, 'HEAD']);
  const transferred = await handoff(worktree, request);
  assert.equal(transferred.status, 'ready', JSON.stringify(transferred));
  assert.equal(transferred.bindings.targetRoot, await fs.realpath(worktree));
  assert.deepEqual(transferred.bindings.repository, request.scope.repository);
  await fs.appendFile(path.join(worktree, '.conceptor/meaning/continuation.md'), '\nChanged target authority.\n');
  assert.equal((await handoff(worktree, request)).status, 'unresolved');
  const unrelated = await fixture(t);
  await run('git', ['init', '-q', unrelated.root]);
  assert.equal((await handoff(unrelated.root, request)).status, 'unresolved');
});
