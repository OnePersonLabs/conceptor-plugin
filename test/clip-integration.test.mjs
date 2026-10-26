import './user-state.mjs';
import { activate } from '../plugins/conceptor/runtime/activation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { parse, stringify } from 'yaml';
import { focus, revisit, reconcile } from '../plugins/conceptor/runtime/conceptor.mjs';
import { hash } from '../plugins/conceptor/runtime/state.mjs';

const run = promisify(execFile);
const fixture = new URL('../examples/clip/', import.meta.url);
const lensPath = '.conceptor/meaning/lenses/clip-playback.md';

async function copyFixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-clip-'));
  await fs.cp(fixture, root, { recursive: true });
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await activate(root);
  await editLens(root, lens => {
    for (const check of lens.checks) if (check.command === 'node') check.command = process.execPath;
  });
  return root;
}

async function editLens(root, edit) {
  const file = path.join(root, lensPath);
  const source = await fs.readFile(file, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  const lens = parse(match[1]);
  edit(lens);
  await fs.writeFile(file, `---\n${stringify(lens)}---\n${source.slice(match[0].length)}`);
}

function participant(result, condition, source) {
  return result.verdicts.find(verdict => verdict.condition === condition)
    ?.participants.find(item => item.unit?.path === source);
}

test('Clip runtime evidence preserves source meaning and distinguishes committed edits', async t => {
  const root = await copyFixture(t);
  const conceptPath = path.join(root, '.conceptor/meaning/concepts/clip.md');
  const patternPath = path.join(root, '.conceptor/meaning/patterns/read-time-transform.md');
  const before = [await fs.readFile(conceptPath, 'utf8'), await fs.readFile(patternPath, 'utf8')];
  const packet = await focus(root, { concepts: ['clip'] });
  assert.ok(packet.meaning.some(record => record.id === 'clip'));
  assert.ok(packet.related.some(record => record.id === 'read-time-transform'));
  const result = await reconcile(root, { lenses: ['clip-playback'], runChecks: true });
  assert.equal(participant(result, 'clip#playback-isolation', 'js/playback.mjs').status, 'supported');
  assert.equal(participant(result, 'clip#playback-isolation', 'js/export.mjs').status, 'supported');
  assert.equal(participant(result, 'clip#persistence-source', 'python/persistence.py').status, 'supported');
  assert.equal(participant(result, 'clip#playback-isolation', 'rust/playback.rs').status, 'supported');
  assert.equal(participant(result, 'clip#playback-isolation', 'csharp/ClipConsumer.cs').status, 'unresolved');
  assert.equal(result.status, 'unresolved');
  for (const receipt of result.receipts.filter(item => item.status === 'supported')) {
    assert.equal(receipt.exitCode, 0);
    assert.ok(receipt.output.stdout.includes('verified'));
  }
  assert.deepEqual([await fs.readFile(conceptPath, 'utf8'), await fs.readFile(patternPath, 'utf8')], before);
  const pattern = parse(before[1].split('---')[1]);
  assert.equal(pattern.status, 'candidate');
  assert.ok(pattern.counterexamples.some(item => item.includes('commitTranspose')));
});

test('new handwritten export refreshes Units and requires explicit evidence coverage', async t => {
  const root = await copyFixture(t);
  const first = await revisit(root, { lenses: ['clip-playback'] });
  const original = first.selections[0].selectors.find(item => item.id === 'js-playback').units;
  await fs.writeFile(path.join(root, 'js/handwritten-export.mjs'),
    'export function exportNotes(clip, offset) { return clip.notes.map(({pitch, ...timing}) => ({...timing, pitch: pitch + offset})); }\n');
  const refreshed = await revisit(root, { lenses: ['clip-playback'] });
  assert.ok(refreshed.selections[0].added.includes('js/handwritten-export.mjs'));
  assert.equal(refreshed.selections[0].selectors.find(item => item.id === 'js-playback').units.length, original.length + 1);
  const uncovered = await reconcile(root, { lenses: ['clip-playback'], runChecks: true });
  assert.equal(participant(uncovered, 'clip#playback-isolation', 'js/handwritten-export.mjs').status, 'unresolved');
  await fs.writeFile(path.join(root, 'checks/handwritten-export.mjs'),
    `import assert from 'node:assert/strict';
import { exportNotes } from '../js/handwritten-export.mjs';
const clip = { notes: [{pitch: 48, beat: 2, duration: 1}] };
const before = structuredClone(clip);
assert.deepEqual(exportNotes(clip, 5), [{pitch: 53, beat: 2, duration: 1}]);
assert.deepEqual(clip, before);
console.log('New handwritten export verified');\n`);
  await editLens(root, lens => lens.checks.push({ id: 'handwritten-export', command: process.execPath,
    args: ['checks/handwritten-export.mjs'], selectors: ['js-playback'], conditions: ['clip#playback-isolation'],
    evidence: 'runtime', coverage: ['js/handwritten-export.mjs'], inputs: ['checks/handwritten-export.mjs'] }));
  const covered = await reconcile(root, { lenses: ['clip-playback'], runChecks: true });
  assert.equal(participant(covered, 'clip#playback-isolation', 'js/handwritten-export.mjs').status, 'supported');
  const file = path.join(root, 'js/handwritten-export.mjs');
  await fs.appendFile(file, '// Updated source binding\n');
  const changed = await revisit(root, { lenses: ['clip-playback'] });
  const unit = changed.selections[0].selectors.flatMap(item => item.units).find(item => item.path === 'js/handwritten-export.mjs');
  assert.equal(unit.sourceHash, hash(await fs.readFile(file)));
  assert.notEqual(unit.sourceHash, covered.discovery.selections[0].selectors.flatMap(item => item.units).find(item => item.path === unit.path).sourceHash);
  const stale = await reconcile(root, { lenses: ['clip-playback'] });
  assert.equal(participant(stale, 'clip#playback-isolation', unit.path).status, 'unresolved');
});

test('failed observation retains supported evidence and original mismatch in the returned evidence', async t => {
  const root = await copyFixture(t);
  await editLens(root, lens => {
    lens.checks.find(check => check.id === 'python-save').command = 'conceptor-missing-python-executable';
    lens.observations.push({ provider: 'lsp', operation: 'references', files: ['rust/playback.rs'],
      position: { line: 15, character: 8 }, config: { command: 'conceptor-missing-lsp-executable', args: [] } });
  });
  const partial = await reconcile(root, { lenses: ['clip-playback'], runChecks: true });
  assert.equal(participant(partial, 'clip#playback-isolation', 'js/playback.mjs').status, 'supported');
  assert.equal(participant(partial, 'clip#persistence-source', 'python/persistence.py').status, 'unresolved');
  assert.ok(partial.observations.some(item => item.provider.id === 'lsp' && item.status !== 'complete' && item.gaps.length));
  await fs.appendFile(path.join(root, 'checks/playback.mjs'), '\nthrow new Error("Deliberate failing evidence");\n');
  const failed = await reconcile(root, { lenses: ['clip-playback'], runChecks: true });
  assert.equal(participant(failed, 'clip#playback-isolation', 'js/playback.mjs').status, 'mismatch');
  assert.ok(failed.observedMismatches.some(item => item.condition === 'clip#playback-isolation'));
});
