import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { stringify } from 'yaml';
import { focus, revisit, reconcile } from '../plugins/conceptor/runtime/conceptor.mjs';
import { hash, projectPath } from '../plugins/conceptor/runtime/state.mjs';
const run = promisify(execFile);
const cli = path.resolve('plugins/conceptor/runtime/cli.mjs');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'v5-core-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, '.conceptor'), {recursive:true});
  await fs.mkdir(path.join(root, 'src'));
  await fs.mkdir(path.join(root, 'checks'));
  await fs.writeFile(path.join(root, 'src/a.mjs'), 'export const answer = 42;\n');
  await fs.writeFile(path.join(root, 'checks/pass.mjs'), 'console.log("verified");\n');
  await meaning(root, 'concept', { id: 'idea', kind: 'concept', title: 'Distinctive Idea', status: 'accepted', conditions: [{ id: 'behavior', text: 'Preserve the intended behavior, including its exception.', evidence: 'runtime' }] }, 'Reason: preserve the exception.\nReopen if the user changes the purpose.');
  const lens = { id: 'lens', kind: 'lens', title: 'Observe the idea', status: 'accepted', conditions: ['idea#behavior'], selectors: [{ id: 'population', patterns: ['src/*.mjs'] }], checks: [{ id: 'native', command: process.execPath, args: ['checks/pass.mjs'], selectors: ['population'], conditions: ['idea#behavior'], evidence: 'runtime', coverage: ['src/a.mjs'], inputs: ['checks/*.mjs'] }] };
  await meaning(root, 'lens', lens);
  return { root, lens };
}
async function meaning(root, name, metadata, body = 'Reasons and examples remain readable without Conceptor.') {
  await fs.mkdir(path.join(root, '.conceptor/meaning'), { recursive:true });
  await fs.writeFile(path.join(root, `.conceptor/meaning/${name}.md`), `---\n${stringify(metadata)}---\n${body}\n`);
}
test('inactive entrypoints bypass invalid requests and preserve project data', async t => {
  const { root } = await fixture(t);
  await fs.rename(path.join(root, '.conceptor'), path.join(root, 'saved-meaning'));
  const before = await fs.readFile(path.join(root, 'saved-meaning/meaning/concept.md'));
  for (const operation of [focus, revisit, reconcile]) assert.equal((await operation(root, undefined)).status, 'inactive');
  assert.deepEqual(await fs.readFile(path.join(root, 'saved-meaning/meaning/concept.md')), before);
  const result = await run(process.execPath, [cli, 'focus', '--root', root, '--request', path.join(root, 'does-not-exist.json')]);
  assert.equal(JSON.parse(result.stdout).status, 'inactive');
});

test('focus selects meaning without hydrating unrelated records', async t => {
  const { root } = await fixture(t);
  await meaning(root, 'other', { id: 'other', kind: 'concept', title: 'Another idea', status: 'candidate', relations: [{ type: 'depends-on', target: 'idea', status: 'observed' }] });
  await meaning(root, 'distant', { id: 'distant', kind: 'concept', title: 'Distant idea', status: 'accepted', relations: [{ type: 'depends-on', target: 'other', status: 'accepted' }] });
  const index = await focus(root);
  assert.ok(index.index.every(item => !Object.hasOwn(item, 'body')));
  assert.equal(index.index.find(item => item.id === 'other').status, 'candidate');
  const packet = await focus(root, { concepts: ['idea'] });
  assert.deepEqual(packet.meaning.map(item => item.id), ['idea']);
  assert.ok(packet.related.some(item => item.id === 'lens'));
  assert.equal(packet.related.find(item => item.id === 'other').status, 'candidate');
  assert.ok(!packet.related.some(item => item.id === 'distant'));
  const incoming = await focus(root, { concepts: ['other'] });
  assert.equal(incoming.meaning[0].relations[0].status, 'observed');
  const lensPacket = await focus(root, { lenses: ['lens'] });
  assert.deepEqual(lensPacket.meaning.map(item => item.id), ['lens']);
  assert.equal(lensPacket.related.find(item => item.id === 'idea').status, 'accepted');
  const queryPacket = await focus(root, { query: 'Observe' });
  assert.ok(queryPacket.meaning.some(item => item.id === 'lens'));
  assert.ok(queryPacket.related.some(item => item.id === 'idea'));
});

test('focus searches authored conditions and alternatives while validating identity selectors', async t => {
  const { root } = await fixture(t);
  await meaning(root, 'metadata', { id: 'metadata', kind: 'concept', title: 'Metadata', status: 'candidate', conditions: [{ id: 'scope', text: 'Accompaniment must remain available.', evidence: 'runtime' }], alternatives: ['Specialist substitution'] }, 'Body has its own provenance.');
  assert.deepEqual((await focus(root, { query: 'accompaniment' })).meaning.map(item => item.id), ['metadata']);
  assert.deepEqual((await focus(root, { query: 'specialist' })).meaning.map(item => item.id), ['metadata']);
  assert.ok((await focus(root, { query: 'provenance' })).meaning[0].body.includes('provenance'));
  assert.equal((await focus(root, { concepts: ['metadata'] })).meaning[0].status, 'candidate');
  for (const request of [{ concepts: ['lens'] }, { lenses: ['idea'] }, { concepts: ['missing'] }, { lenses: ['missing'] }]) await assert.rejects(focus(root, request), /No active (concept|lens) selected/);
  await meaning(root, 'retired', { id: 'retired', kind: 'concept', title: 'Old idea', status: 'retired' });
  await assert.rejects(focus(root, { concepts: ['retired'] }), /No active concept selected/);
});

test('explicit Concept coverage exposes omitted conditions and prose without erasing supported verdicts', async t => {
  const { root } = await fixture(t);
  await meaning(root, 'concept', { id: 'idea', kind: 'concept', title: 'Idea', status: 'accepted', conditions: [{ id: 'behavior', text: 'Observed behavior', evidence: 'runtime' }, { id: 'context', text: 'Preserve wider context', evidence: 'runtime' }] });
  await meaning(root, 'unobserved', { id: 'unobserved', kind: 'concept', title: 'An unobserved need', status: 'accepted', conditions: [{ id: 'needed', text: 'Independent capability', evidence: 'runtime' }] });
  await meaning(root, 'prose', { id: 'prose', kind: 'concept', title: 'Prose authority', status: 'accepted' }, 'This accepted requirement has no machine condition.');
  const request = { concepts: ['idea', 'unobserved', 'prose'] };
  const discovery = await revisit(root, request);
  assert.deepEqual(discovery.meaningCoverage.uncoveredRequests.map(item => item.condition ?? item.concept), ['idea#context', 'unobserved#needed', 'prose']);
  assert.deepEqual(discovery.meaningCoverage.requestedConcepts.find(item => item.concept === 'idea').conditions, [{ condition: 'idea#behavior', lenses: ['lens'] }, { condition: 'idea#context', lenses: [] }]);
  const result = await reconcile(root, { ...request, runChecks: true });
  assert.equal(result.status, 'unresolved');
  assert.equal(result.verdicts[0].status, 'supported');
  assert.deepEqual(result.meaningCoverage, discovery.meaningCoverage);
  assert.match(result.meaningCoverage.scope, /prose and source completeness are not machine established/);
  const scoped = await reconcile(root, { lenses: ['lens'], runChecks: true });
  assert.equal(scoped.status, 'supported');
  assert.deepEqual(scoped.meaningCoverage.requestedConcepts, []);
});

test('revisit and reconcile reject unknown, wrong-kind, candidate and retired Concepts', async t => {
  const { root } = await fixture(t);
  await meaning(root, 'candidate', { id: 'candidate', kind: 'concept', title: 'Candidate', status: 'candidate' });
  await meaning(root, 'retired', { id: 'retired', kind: 'concept', title: 'Retired', status: 'retired' });
  for (const operation of [revisit, reconcile]) {
    for (const id of ['missing', 'lens', 'candidate', 'retired']) await assert.rejects(operation(root, { concepts: ['idea', id] }), /No accepted Concept selected/);
  }
});

test('missing Lens and missing required population are unresolved; allowed absence is explicit', async t => {
  const { root, lens } = await fixture(t);
  lens.selectors[0] = { id: 'population', patterns: ['missing/*.mjs'] };
  await meaning(root, 'lens', lens);
  assert.equal((await reconcile(root, { lenses: ['lens'], runChecks: true })).status, 'unresolved');
  await meaning(root, 'concept', { id: 'idea', kind: 'concept', title: 'Idea', status: 'accepted', conditions: [{ id: 'behavior', text: 'There may be no realizations in this scope.', evidence: 'runtime', allowsAbsence: true }] });
  assert.equal((await reconcile(root, { lenses: ['lens'] })).status, 'supported');
  lens.status = 'retired';
  await meaning(root, 'lens', lens);
  assert.equal((await reconcile(root, { concepts: ['idea'] })).status, 'unresolved');
});

test('new consumer, stale body, changed check, and static evidence cannot inherit runtime support', async t => {
  const { root, lens } = await fixture(t);
  const first = await reconcile(root, { lenses: ['lens'], runChecks: true });
  assert.equal(first.status, 'supported');
  await fs.writeFile(path.join(root, 'src/b.mjs'), 'export const unsafe = true;\n');
  const discovery = await revisit(root, { lenses: ['lens'], previous: first });
  assert.ok(discovery.selections[0].added.includes('src/b.mjs'));
  const next = await reconcile(root, { lenses: ['lens'], runChecks: true });
  assert.equal(next.verdicts[0].participants.find(item => item.unit.path === 'src/b.mjs').status, 'unresolved');
  await fs.appendFile(path.join(root, 'src/a.mjs'), '// same declaration, changed body inputs\n');
  assert.equal((await reconcile(root, { lenses: ['lens'] })).verdicts[0].participants[0].status, 'unresolved');
  lens.checks[0].coverage = 'selection';
  lens.checks[0].evidence = 'static';
  await meaning(root, 'lens', lens);
  assert.equal((await reconcile(root, { lenses: ['lens'], runChecks: true })).status, 'unresolved');
});

test('unrelated drift retains evidence while target and meaning revisions stale it', async t => {
  const { root, lens } = await fixture(t);
  const first = await reconcile(root, { lenses: ['lens'], runChecks: true });
  await fs.writeFile(path.join(root, 'unrelated.txt'), 'independent native work');
  assert.equal((await reconcile(root, { lenses: ['lens'], previous: first })).status, 'supported');
  lens.checks[0].target = 'another-target';
  await meaning(root, 'lens', lens);
  assert.equal((await reconcile(root, { lenses: ['lens'], previous: first })).status, 'unresolved');
});

test('receipt reuse is explicit, bound to the checkout, and does not alter prior observations', async t => {
  const { root } = await fixture(t);
  await fs.writeFile(path.join(root, 'checks/pass.mjs'), 'import fs from "node:fs"; fs.appendFileSync("runs.txt", "run\\n");');
  const previous = await reconcile(root, { lenses: ['lens'], runChecks: true });
  const original = structuredClone(previous);
  assert.equal((await reconcile(root, { lenses: ['lens'] })).status, 'unresolved');
  assert.equal((await reconcile(root, { lenses: ['lens'], previous })).status, 'supported');
  const inconsistent = structuredClone(previous);
  inconsistent.receipts[0].exitCode = 1;
  assert.equal((await reconcile(root, { lenses: ['lens'], previous: inconsistent })).status, 'unresolved');
  assert.equal(await fs.readFile(path.join(root, 'runs.txt'), 'utf8'), 'run\n');
  const { root: other } = await fixture(t);
  const foreign = await reconcile(other, { lenses: ['lens'], previous });
  assert.equal(foreign.status, 'unresolved');
  const rebound = await reconcile(other, { lenses: ['lens'], previous: { ...previous, project: other } });
  assert.equal(rebound.status, 'unresolved');
  await fs.appendFile(path.join(root, 'src/a.mjs'), '// drift\n');
  assert.equal((await reconcile(root, { lenses: ['lens'], previous })).status, 'unresolved');
  assert.deepEqual(previous, original);
});

test('moved implementations retain meaning identity; a candidate Lens needs explicit acceptance', async t => {
  const { root, lens } = await fixture(t);
  const receipt = await reconcile(root, {lenses:['lens'],runChecks:true});
  const before = (await focus(root, {concepts:['idea']})).meaning[0];
  await fs.rename(path.join(root, 'src/a.mjs'), path.join(root, 'src/moved.mjs'));
  const moved = await revisit(root, {lenses:['lens'],previous:receipt});
  assert.ok(moved.selections[0].added.includes('src/moved.mjs'));
  assert.ok(moved.selections[0].removed.includes('src/a.mjs'));
  assert.equal((await reconcile(root, {lenses:['lens']})).status, 'unresolved');
  lens.status = 'candidate';
  lens.checks[0].coverage = ['src/moved.mjs'];
  await meaning(root, 'lens', lens);
  const candidate = {id:'approach',kind:'pattern',title:'A scoped approach',status:'candidate',concepts:['idea'],lens:'lens',examples:['Observe the transient use'],counterexamples:['An explicit committed edit changes authority'],alternatives:['Use another valid handwritten implementation']};
  await meaning(root, 'pattern', candidate, 'Reason: preserve the exception.\nReopen when projection cost changes.');
  const original = (await focus(root, {query:'approach'})).meaning.find(item => item.id === 'approach');
  assert.equal((await reconcile(root, {concepts:['idea'],runChecks:true})).status, 'unresolved');
  // An explicit meaning decision changes only acceptance and the scoped Lens.
  candidate.status = 'accepted';
  lens.status = 'accepted';
  await meaning(root, 'pattern', candidate, original.body.trimEnd());
  await meaning(root, 'lens', lens);
  assert.equal((await reconcile(root, {lenses:['lens'],runChecks:true})).status, 'supported');
  const after = (await focus(root, {concepts:['idea'],query:'approach'})).meaning;
  assert.equal(after.find(item => item.id === 'idea').hash, before.hash);
  assert.equal(after.find(item => item.id === 'approach').body, original.body);
  assert.deepEqual(after.find(item => item.id === 'approach').counterexamples, original.counterexamples);
});

test('checks that mutate their observed source cannot publish current support', async t => {
  const { root } = await fixture(t);
  await fs.writeFile(path.join(root, 'checks/pass.mjs'), 'import fs from "node:fs"; fs.appendFileSync("src/a.mjs", "// changed\\n");\n');
  assert.equal((await reconcile(root, { lenses: ['lens'], runChecks: true })).status, 'unresolved');
});

test('later checks cannot leave earlier evidence current after its configuration or authority changes', async t => {
  const { root, lens } = await fixture(t);
  await fs.writeFile(path.join(root, 'settings.json'), '{"behavior":"original"}\n');
  lens.checks[0].inputs.push('settings.json');
  await fs.writeFile(path.join(root, 'checks/mutate.mjs'), 'import fs from "node:fs"; fs.writeFileSync("settings.json", "changed");\n');
  lens.checks.push({ id: 'later', command: process.execPath, args: ['checks/mutate.mjs'], selectors: ['population'], conditions: ['idea#behavior'], evidence: 'static', coverage: ['src/a.mjs'] });
  await meaning(root, 'lens', lens);
  const result = await reconcile(root, { lenses: ['lens'], runChecks: true });
  assert.equal(result.status, 'unresolved');
  assert.equal(result.receipts[0].observedStatus, 'supported');
  assert.equal(result.receipts[0].current, false);
  await fs.writeFile(path.join(root, 'checks/mutate.mjs'), 'import fs from "node:fs"; fs.appendFileSync(".conceptor/meaning/concept.md", "Changed reason.\\n");\n');
  assert.equal((await reconcile(root, { lenses: ['lens'], runChecks: true })).status, 'unresolved');
});

test('shared check runs once and returns failures for each covered condition', async t => {
  const { root, lens } = await fixture(t);
  await meaning(root, 'concept', { id: 'idea', kind: 'concept', title: 'Idea', status: 'accepted', conditions: [{ id: 'behavior', text: 'A', evidence: 'runtime' }, { id: 'other', text: 'B', evidence: 'runtime' }] });
  lens.conditions.push('idea#other');
  lens.checks[0].conditions.push('idea#other');
  await meaning(root, 'lens', lens);
  const failed = await reconcile(root, { lenses: ['lens'], runChecks: true });
  assert.equal(failed.receipts.length, 1);
  await fs.writeFile(path.join(root, 'checks/pass.mjs'), 'process.exitCode=1;\n');
  const mismatched = await reconcile(root, { lenses: ['lens'], runChecks: true });
  lens.checks = [];
  await meaning(root, 'lens', lens);
  await reconcile(root, { lenses: ['lens'] });
  assert.equal(mismatched.observedMismatches.length, 2);
  assert.ok(mismatched.observedMismatches.every(item => item.receipt.exitCode === 1));
});

test('final publication returns original failure when a later Lens invalidates its inputs', async t => {
  const { root, lens } = await fixture(t);
  await fs.writeFile(path.join(root, 'settings.json'), 'original');
  lens.checks[0].inputs.push('settings.json');
  await meaning(root, 'lens', lens);
  const other = structuredClone(lens);
  other.id = 'other-lens';
  other.checks[0].id = 'mutator';
  other.checks[0].args = ['checks/mutate.mjs'];
  other.checks[0].inputs = ['checks/mutate.mjs'];
  await fs.writeFile(path.join(root, 'checks/mutate.mjs'), 'import fs from "node:fs"; fs.writeFileSync("settings.json", "later");\n');
  await meaning(root, 'other-lens', other);
  const first = await reconcile(root, { lenses: ['lens', 'other-lens'], runChecks: true });
  assert.equal(first.verdicts.find(verdict => verdict.lens === 'lens').status, 'unresolved');
  await fs.writeFile(path.join(root, 'checks/pass.mjs'), 'process.exitCode = 1;\n');
  await fs.writeFile(path.join(root, 'settings.json'), 'original-again');
  const failed = await reconcile(root, { lenses: ['lens', 'other-lens'], runChecks: true });
  const original = failed.observedMismatches.find(verdict => verdict.lens === 'lens');
  assert.equal(original.receipt.exitCode, 1);
  assert.ok(original.receipt.scope.inputs.some(input => input.path === 'settings.json' && input.hash === hash('original-again')));
});

test('revisit refreshes directive boundaries and literal queries beyond saved selectors', async t => {
  const { root, lens } = await fixture(t);
  lens.selectors[0].patterns = ['src/a.mjs'];
  await meaning(root, 'lens', lens);
  const previous = await revisit(root, { lenses: ['lens'], paths: ['src/**'] });
  await fs.writeFile(path.join(root, 'src/new-export.mjs'), 'export const useIdea = true;\n');
  const result = await revisit(root, { lenses: ['lens'], paths: ['src/**'], query: 'useIdea', previous });
  assert.ok(result.discoveryQuestions.some(question => question.path === 'src/new-export.mjs'));
  assert.ok(result.observations.some(observation => observation.facts.some(fact => fact.kind === 'literal-occurrence' && fact.path === 'src/new-export.mjs')));
});

test('missing prior evidence preserves meaning and CLI exposes unsupported results', async t => {
  const { root } = await fixture(t);
  await reconcile(root, { lenses: ['lens'], runChecks: true });
  assert.ok((await focus(root, { concepts: ['idea'] })).meaning[0].body.includes('exception'));
  const refreshed = await revisit(root, { lenses: ['lens'] });
  assert.equal(refreshed.selections[0].baseline, 'missing');
  assert.deepEqual(refreshed.selections[0].added, []);
  const request = path.join(root, 'request.json');
  await fs.writeFile(request, JSON.stringify({ lenses: ['lens'] }));
  await assert.rejects(run(process.execPath, [cli, 'reconcile', '--root', root, '--request', request]), error => error.code === 2 && JSON.parse(error.stdout).status === 'unresolved');
});

test('noisy checks drain both streams with bounded output and reusable evidence', async t => {
  const { root } = await fixture(t);
  await fs.writeFile(path.join(root, 'checks/pass.mjs'), 'process.stdout.write("x".repeat(200000)); process.stderr.write("y".repeat(200000));');
  const first = await reconcile(root, { lenses: ['lens'], runChecks: true });
  assert.equal(first.status, 'supported');
  const receipt = first.receipts[0];
  assert.equal(Buffer.byteLength(receipt.output.stdout), 65536);
  assert.equal(Buffer.byteLength(receipt.output.stderr), 65536);
  assert.equal(receipt.output.stdoutTruncated, true);
  assert.equal(receipt.output.stderrTruncated, true);
  assert.equal((await reconcile(root, { lenses: ['lens'], previous: first })).receipts[0].id, receipt.id);
  await assert.rejects(focus(root, { work: 'old-task' }), /Task state belongs to the caller/);
});

test('outside-root paths and escaped symlinks are refused before source reads', async t => {
  const { root } = await fixture(t);
  await assert.rejects(projectPath(root, '../outside'), /escapes/);
  const external = await fs.mkdtemp(path.join(os.tmpdir(), 'v5-external-'));
  t.after(() => fs.rm(external, { recursive: true, force: true }));
  await fs.symlink(external, path.join(root, 'link'), 'junction');
  await assert.rejects(projectPath(root, 'link/source'), /Symlink escapes/);
});
