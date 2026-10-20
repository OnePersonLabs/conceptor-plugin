import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { activate } from '../plugins/conceptor/runtime/activation.mjs';
import { assessment } from '../plugins/conceptor/runtime/reassessment.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-reassessment-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await activate(root);
  await fs.mkdir(path.join(root, '.conceptor', 'work'));
  await fs.writeFile(path.join(root, '.conceptor/work/comparison.json'), JSON.stringify(Object.fromEntries(['governing', 'cleanCandidate', 'comparison', 'decision', 'boundary', 'validation', 'review'].map(field => [field, `Narrative for ${field}.`]))));
  return { root, run: request => assessment(root, { sessionId: 'root-session', comparison: '.conceptor/work/comparison.json', ...request }) };
}

test('cadence uses completed assessment costs and changes to due exactly at its interval', async t => {
  const { run } = await fixture(t);
  assert.equal((await run({})).status, 'due');
  await run({ action: 'begin', id: 'a', checkpoint: '.conceptor/work/task.json' });
  assert.equal((await run({ compact: true })).state.assessment.rootAssessmentCompactions, 1);
  const repeated = await run({ action: 'begin', id: 'a' });
  assert.equal(repeated.state.assessment.rootAssessmentCompactions, 1);
  assert.equal(repeated.status, 'assessing');
  const completed = await run({ action: 'complete', id: 'a', extraWindows: 2 });
  assert.equal(completed.state.interval, 27);
  assert.equal(completed.state.candidate.checkpoint, '.conceptor/work/task.json');
  assert.equal(completed.status, 'working');
  for (let count = 1; count < 27; count++) assert.equal((await run({ compact: true })).status, 'working');
  assert.equal((await run({ compact: true })).status, 'due');
  const duplicate = await run({ action: 'complete', id: 'a', extraWindows: 99 });
  assert.deepEqual(duplicate.state, (await run({})).state);
  assert.equal(duplicate.state.interval, 27);
  assert.equal(duplicate.state.workingCompactions, 27);
});

test('abandon invalidates the candidate and carries spent assessment contexts into the next completion', async t => {
  const { run } = await fixture(t);
  await run({ action: 'begin', id: 'a' });
  assert.equal((await run({ action: 'complete', id: 'a' })).state.interval, 1);
  await run({ action: 'begin', id: 'b' });
  await assert.rejects(run({ action: 'complete', id: 'a' }), /does not match/);
  await assert.rejects(run({ action: 'begin', id: 'c' }), /Another assessment/);
  await run({ compact: true });
  const abandoned = await run({ action: 'abandon', id: 'b', extraWindows: 3 });
  assert.equal(abandoned.status, 'due');
  assert.equal(abandoned.state.candidate, null);
  assert.equal(abandoned.state.carriedCosts, 4);
  await run({ action: 'begin', id: 'c' });
  assert.equal((await run({ action: 'complete', id: 'c' })).state.interval, 36);
  assert.equal((await run({})).state.carriedCosts, 0);
});

test('session state survives resume, stays isolated, and read-only transitions do not write', async t => {
  const { root, run } = await fixture(t);
  await run({ action: 'begin', id: 'a', checkpoint: 'task' });
  const current = await run({ compact: true });
  const bytes = await fs.readFile(path.join(root, current.cache), 'utf8');
  const readonly = await run({ compact: true, permissionMode: 'plan' });
  assert.equal(readonly.saved, false);
  assert.equal(readonly.state.assessment.rootAssessmentCompactions, 2);
  assert.equal(await fs.readFile(path.join(root, current.cache), 'utf8'), bytes);
  const resume = await assessment(root, { sessionId: 'root-session' });
  assert.equal(resume.status, 'assessing');
  assert.equal(resume.state.assessment.rootAssessmentCompactions, 1);
  const other = await assessment(root, { sessionId: 'other', readOnly: true });
  assert.equal(other.status, 'due');
  await assert.rejects(fs.stat(path.join(root, other.cache)), { code: 'ENOENT' });
  const untracked = await assessment(root, { sessionId: null, compact: true });
  assert.equal(untracked.saved, false);
  assert.equal(untracked.tracked, false);
  await assert.rejects(run({ action: 'complete', id: 'a', extraWindows: -1 }), /nonnegative/);
  assert.equal(await fs.readFile(path.join(root, current.cache), 'utf8'), bytes);
});

test('inactive and nested Git operations do not read or create cadence cache', async t => {
  const { root } = await fixture(t);
  const nested = path.join(root, 'nested');
  await fs.mkdir(path.join(nested, '.git'), { recursive: true });
  assert.equal((await assessment(nested, { action: 'begin', id: 'x', sessionId: 's' })).status, 'inactive');
  await assert.rejects(fs.stat(path.join(nested, '.conceptor')), { code: 'ENOENT' });
});

test('CLI assessment JSON transport uses environment session and honors read-only status', async t => {
  const { root } = await fixture(t);
  const cli = fileURLToPath(new URL('../plugins/conceptor/runtime/cli.mjs', import.meta.url));
  const requestFile = path.join(root, 'request.json');
  await fs.writeFile(requestFile, JSON.stringify({ action: 'begin', id: 'cli-assessment', checkpoint: 'work' }));
  const invoke = () => spawnSync(process.execPath, [cli, 'assessment', '--root', root, '--request', requestFile], {
    encoding: 'utf8', env: { ...process.env, CODEX_THREAD_ID: 'cli-session' },
  });
  const begin = invoke();
  assert.equal(begin.status, 0, begin.stderr);
  assert.equal(JSON.parse(begin.stdout).status, 'assessing');
  const hook = fileURLToPath(new URL('../plugins/conceptor/hooks/conceptor-context.mjs', import.meta.url));
  const compact = spawnSync(process.execPath, [hook], {
    encoding: 'utf8', input: JSON.stringify({ cwd: root, hook_event_name: 'SessionStart', source: 'compact', session_id: 'cli-session', permission_mode: 'acceptEdits' }),
  });
  assert.equal(compact.status, 0, compact.stderr);
  assert.match(JSON.parse(compact.stdout).hookSpecificOutput.additionalContext, /Resume assessment "cli-assessment"/);
  await fs.writeFile(requestFile, JSON.stringify({ action: 'complete', comparison: '.conceptor/work/comparison.json', id: 'cli-assessment', readOnly: true }));
  const complete = invoke();
  assert.equal(complete.status, 0, complete.stderr);
  assert.equal(JSON.parse(complete.stdout).saved, false);
  assert.equal((await assessment(root, { sessionId: 'cli-session' })).status, 'assessing');
  await fs.writeFile(requestFile, JSON.stringify({ action: 'complete', comparison: '.conceptor/work/comparison.json', id: 'cli-assessment' }));
  const saved = invoke();
  assert.equal(saved.status, 0, saved.stderr);
  assert.equal(JSON.parse(saved.stdout).state.interval, 9);
});

test('read-only lifecycle carries pending state through compacts and completion into an authorized save', async t => {
  const { root, run } = await fixture(t);
  let result = await run({ action: 'begin', id: 'planned', checkpoint: 'work', permissionMode: 'plan' });
  const original = JSON.stringify(result.handoff);
  const hook = fileURLToPath(new URL('../plugins/conceptor/hooks/conceptor-context.mjs', import.meta.url));
  for (let count = 1; count <= 2; count++) {
    const compact = spawnSync(process.execPath, [hook], {
      encoding: 'utf8', input: JSON.stringify({ cwd: root, hook_event_name: 'SessionStart', source: 'compact', session_id: 'root-session', permission_mode: 'plan' }),
    });
    assert.equal(compact.status, 0, compact.stderr);
    const guidance = JSON.parse(compact.stdout).hookSpecificOutput.additionalContext;
    assert.match(guidance, /Unsaved compact delta: 1/);
    assert.match(guidance, /apply compact:true exactly once/);
    assert.match(guidance, /Cache-based status is provisional; an existing unsaved handoff takes precedence/);
    const previous = result.handoff;
    result = await run({ handoff: previous, compact: true, permissionMode: 'plan' });
    assert.equal(previous.state.assessment.rootAssessmentCompactions, count - 1);
    assert.equal(result.state.assessment.rootAssessmentCompactions, count);
    assert.equal(result.handoff.baseline, null);
  }
  assert.equal(JSON.parse(original).state.assessment.rootAssessmentCompactions, 0);
  result = await run({ action: 'complete', id: 'planned', extraWindows: 1, handoff: result.handoff, readOnly: true });
  assert.equal(result.status, 'working');
  assert.equal(result.state.interval, 27);
  await assert.rejects(fs.stat(path.join(root, result.cache)), { code: 'ENOENT' });
  const resume = spawnSync(process.execPath, [hook], {
    encoding: 'utf8', input: JSON.stringify({ cwd: root, hook_event_name: 'SessionStart', source: 'resume', session_id: 'root-session', permission_mode: 'acceptEdits' }),
  });
  assert.equal(resume.status, 0, resume.stderr);
  await assert.rejects(fs.stat(path.join(root, result.cache)), { code: 'ENOENT' });
  const saved = await run({ action: 'status', handoff: result.handoff });
  assert.equal(saved.saved, true);
  assert.deepEqual((await run({})).state, result.state);
});

test('handoff rejects wrong root, wrong session, and stale persisted baseline without changing cache', async t => {
  const { root, run } = await fixture(t);
  await run({});
  const pending = await run({ action: 'begin', id: 'a', readOnly: true });
  const other = await fixture(t);
  await assert.rejects(other.run({ handoff: pending.handoff }), /different root or session/);
  await assert.rejects(assessment(root, { sessionId: 'wrong', handoff: pending.handoff }), /different root or session/);
  const changed = await run({ compact: true });
  const bytes = await fs.readFile(path.join(root, changed.cache), 'utf8');
  await assert.rejects(run({ handoff: pending.handoff }), /handoff is stale/);
  assert.equal(await fs.readFile(path.join(root, changed.cache), 'utf8'), bytes);
});


test('completion requires a saved valid comparison and binds exact bytes without duplicate rebinding', async t => {
  const { root, run } = await fixture(t);
  await run({ action: 'begin', id: 'bound', checkpoint: 'retained-checkpoint' });
  await assert.rejects(run({ action: 'complete', id: 'bound', comparison: undefined }), /project-relative path/);
  await assert.rejects(run({ action: 'complete', id: 'bound', comparison: 'missing.json' }), /ENOENT/);
  assert.equal((await run({})).status, 'assessing');
  const file = path.join(root, '.conceptor/work/comparison.json');
  const original = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, JSON.stringify({ governing: 'only one field' }));
  await assert.rejects(run({ action: 'complete', id: 'bound' }), /nonempty narrative/);
  await fs.writeFile(file, original);
  const completed = await run({ action: 'complete', id: 'bound' });
  assert.equal(completed.state.candidate.checkpoint, 'retained-checkpoint');
  assert.equal(completed.state.candidate.comparison.path, '.conceptor/work/comparison.json');
  assert.match(completed.state.candidate.comparison.hash, /^[a-f0-9]{64}$/);
  await fs.writeFile(file, original + ' ');
  const changed = await run({});
  assert.equal(changed.status, 'due');
  assert.match(changed.reason, /changed after completion/);
  await assert.rejects(run({ action: 'complete', id: 'bound' }), /cannot rebind/);
  assert.deepEqual((await run({})).state, changed.state);
  await fs.writeFile(file, '{');
  assert.match((await run({})).reason, /valid JSON/);
  await fs.rm(file);
  assert.match((await run({})).reason, /unavailable or invalid/);
  await run({ action: 'begin', id: 'replacement' });
  assert.equal((await run({})).status, 'assessing');
});

test('legacy candidates remain due and comparison paths cannot escape the project', async t => {
  const { root, run } = await fixture(t);
  await run({ action: 'begin', id: 'legacy' });
  const completed = await run({ action: 'complete', id: 'legacy' });
  delete completed.state.candidate.comparison;
  await fs.writeFile(path.join(root, completed.cache), JSON.stringify(completed.state));
  assert.equal((await run({})).status, 'due');
  assert.match((await run({})).reason, /no bound comparison/);
  await run({ action: 'begin', id: 'new' });
  await assert.rejects(run({ action: 'complete', id: 'new', comparison: '../account.json' }), /escapes project/);
  assert.equal((await run({})).status, 'assessing');
});


test('an unsaved completed handoff must still match its comparison bytes before working', async t => {
  const { root, run } = await fixture(t);
  let result = await run({ action: 'begin', id: 'pending', readOnly: true });
  result = await run({ action: 'complete', id: 'pending', readOnly: true, handoff: result.handoff });
  assert.equal(result.status, 'working');
  await fs.appendFile(path.join(root, '.conceptor/work/comparison.json'), ' ');
  const changed = await run({ handoff: result.handoff, readOnly: true });
  assert.equal(changed.status, 'due');
  assert.match(changed.reason, /changed after completion/);
  await assert.rejects(fs.stat(path.join(root, result.cache)), { code: 'ENOENT' });
});
