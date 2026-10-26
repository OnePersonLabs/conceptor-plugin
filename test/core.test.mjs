import './user-state.mjs';
import { activate, deactivate } from '../plugins/conceptor/runtime/activation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { stringify } from 'yaml';
import { focus, revisit, reconcile } from '../plugins/conceptor/runtime/conceptor.mjs';
import { hash, projectPath, writeText } from '../plugins/conceptor/runtime/state.mjs';
import { storagePaths } from '../plugins/conceptor/runtime/storage.mjs';
const run = promisify(execFile);
const cli = path.resolve('plugins/conceptor/runtime/cli.mjs');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'v5-core-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await activate(root);
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
  await writeText(path.join(root, `.conceptor/meaning/${name}.md`), `---\n${stringify(metadata)}---\n${body}\n`);
}
test('inactive entrypoints bypass invalid requests and preserve project data', async t => {
  const { root } = await fixture(t);
  await deactivate(root);
  const before = await fs.readFile(path.join(root, '.conceptor/meaning/concept.md'));
  for (const operation of [focus, revisit, reconcile]) assert.equal((await operation(root, undefined)).status, 'inactive');
  assert.deepEqual(await fs.readFile(path.join(root, '.conceptor/meaning/concept.md')), before);
  const result = await run(process.execPath, [cli, 'focus', '--root', root, '--request', path.join(root, 'does-not-exist.json')]);
  assert.equal(JSON.parse(result.stdout).status, 'inactive');
});

test('focus selects meaning without hydrating unrelated records', async t => {
  const { root } = await fixture(t);
  await meaning(root, 'other', { id: 'other', kind: 'concept', title: 'Another idea', status: 'accepted', relations: [{ type: 'depends-on', target: 'idea', status: 'observed' }] });
  const index = await focus(root);
  assert.ok(index.index.every(item => !Object.hasOwn(item, 'body')));
  const packet = await focus(root, { concepts: ['idea'] });
  assert.deepEqual(packet.meaning.map(item => item.id), ['idea']);
  assert.ok(packet.related.some(item => item.id === 'lens'));
  const lensPacket = await focus(root, { lenses: ['lens'] });
  assert.deepEqual(lensPacket.meaning.map(item => item.id), ['lens']);

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
  assert.equal((await reconcile(root, { lenses: ['lens'], runChecks: true })).status, 'supported');
  await fs.writeFile(path.join(root, 'src/b.mjs'), 'export const unsafe = true;\n');
  const discovery = await revisit(root, { lenses: ['lens'] });
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
  await reconcile(root, { lenses: ['lens'], runChecks: true });
  await fs.writeFile(path.join(root, 'unrelated.txt'), 'independent native work');
  assert.equal((await reconcile(root, { lenses: ['lens'] })).status, 'supported');
  lens.checks[0].target = 'another-target';
  await meaning(root, 'lens', lens);
  assert.equal((await reconcile(root, { lenses: ['lens'] })).status, 'unresolved');
});

test('moved implementations retain meaning identity; a candidate Lens needs explicit acceptance', async t => {
  const { root, lens } = await fixture(t);
  await reconcile(root, {lenses:['lens'],runChecks:true});
  const before = (await focus(root, {concepts:['idea']})).meaning[0];
  await fs.rename(path.join(root, 'src/a.mjs'), path.join(root, 'src/moved.mjs'));
  const moved = await revisit(root, {lenses:['lens']});
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
  await fs.rm((await storagePaths(root)).cache, { recursive: true, force: true });
  const original = failed.observedMismatches.find(verdict => verdict.lens === 'lens');
  assert.equal(original.receipt.exitCode, 1);
  assert.ok(original.receipt.scope.inputs.some(input => input.path === 'settings.json' && input.hash === hash('original-again')));
});

test('revisit refreshes directive boundaries and literal queries beyond saved selectors', async t => {
  const { root, lens } = await fixture(t);
  lens.selectors[0].patterns = ['src/a.mjs'];
  await meaning(root, 'lens', lens);
  await revisit(root, { lenses: ['lens'], paths: ['src/**'] });
  await fs.writeFile(path.join(root, 'src/new-export.mjs'), 'export const useIdea = true;\n');
  const result = await revisit(root, { lenses: ['lens'], paths: ['src/**'], query: 'useIdea' });
  assert.ok(result.discoveryQuestions.some(question => question.path === 'src/new-export.mjs'));
  assert.ok(result.observations.some(observation => observation.facts.some(fact => fact.kind === 'literal-occurrence' && fact.path === 'src/new-export.mjs')));
});

test('cache deletion preserves meaning and CLI exposes unsupported results', async t => {
  const { root } = await fixture(t);
  await reconcile(root, { lenses: ['lens'], runChecks: true });
  await fs.rm((await storagePaths(root)).cache, { recursive: true, force: true });
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
  assert.equal((await reconcile(root, { lenses: ['lens'] })).receipts[0].id, receipt.id);
  await assert.rejects(focus(root, { work: 'old-task' }), /checkpoints were removed/);
});

test('outside-root paths and escaped symlinks are refused before source reads', async t => {
  const { root } = await fixture(t);
  await assert.rejects(projectPath(root, '../outside'), /escapes/);
  const external = await fs.mkdtemp(path.join(os.tmpdir(), 'v5-external-'));
  t.after(() => fs.rm(external, { recursive: true, force: true }));
  await fs.symlink(external, path.join(root, 'link'), 'junction');
  await assert.rejects(projectPath(root, 'link/source'), /Symlink escapes/);
});
