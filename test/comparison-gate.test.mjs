import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { activate } from '../plugins/conceptor/runtime/activation.mjs';
import { assessment } from '../plugins/conceptor/runtime/reassessment.mjs';

const script = fileURLToPath(new URL('../plugins/conceptor/hooks/conceptor-before-tool.mjs', import.meta.url));
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-gate-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await activate(root);
  const run = input => {
    const result = spawnSync(process.execPath, [script], {
      input: JSON.stringify({ cwd: root, hook_event_name: 'PreToolUse', session_id: 'parent-session', ...input }),
      encoding: 'utf8', env: { ...process.env, CODEX_THREAD_ID: 'different-child-session' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput : null;
  };
  const complete = async () => {
    await fs.mkdir(path.join(root, '.conceptor/work'), { recursive: true });
    await fs.writeFile(path.join(root, '.conceptor/work/account.json'), JSON.stringify({
      governing: 'The task outcome.', cleanCandidate: 'The clean design.', comparison: 'The existing design compared.',
      decision: 'The selected design and costs.', boundary: 'The responsible components.', validation: 'The required checks.', review: 'The independent assessment.',
    }));
    await assessment(root, { sessionId: 'parent-session', action: 'begin', id: 'comparison' });
    return assessment(root, { sessionId: 'parent-session', action: 'complete', id: 'comparison', comparison: '.conceptor/work/account.json' });
  };
  return { root, run, complete };
}

test('due gate denies the observed Python shell write and allows only declared assessment shell work', async t => {
  const { root, run } = await fixture(t);
  const denied = run({ tool_name: 'Bash', tool_input: { command: 'python -c "open(\"source.py\", \"w\").write(\"changed\")"' } });
  assert.equal(denied.permissionDecision, 'deny');
  assert.match(denied.permissionDecisionReason, /Begin or resume/);
  assert.match(denied.permissionDecisionReason, /request.comparison/);
  assert.match(denied.permissionDecisionReason, /applying-conceptor.md/);
  await assert.rejects(fs.stat(path.join(root, 'source.py')), { code: 'ENOENT' });
  for (const command of ['# conceptor-assessment: inspect dependencies\nrg useful src', '\uFEFF  # conceptor-assessment: bounded probe\nnode probe.mjs']) {
    const allowed = run({ tool_name: 'Bash', tool_input: { command } });
    assert.equal(allowed.permissionDecision, undefined);
    assert.match(allowed.additionalContext, /assessment-only/);
  }
  for (const command of ['# conceptor-assessment:  \npython change.py', '\n# conceptor-assessment: later', 'echo "# conceptor-assessment: fake"']) {
    assert.equal(run({ tool_name: 'Bash', tool_input: { command } }).permissionDecision, 'deny');
  }
});

test('assessment patches require every add, update, delete, and move target inside physical task work', async t => {
  const { root, run } = await fixture(t);
  await fs.mkdir(path.join(root, '.conceptor/work'), { recursive: true });
  const patch = command => run({ tool_name: 'apply_patch', tool_input: { command } });
  const valid = '*** Begin Patch\n*** Add File: .conceptor/work/new.json\n+{}\n*** Update File: .conceptor/work/task.json\n*** Move to: .conceptor/work/moved.json\n@@\n-a\n+b\n*** Delete File: .conceptor/work/old.json\n*** End Patch';
  assert.equal(patch(valid).permissionDecision, undefined);
  for (const command of [valid.replace('.conceptor/work/moved.json', 'src/moved.json'), valid.replace('.conceptor/work/old.json', '.conceptor/active'), valid.replace('.conceptor/work/new.json', '../outside.json'), '*** Begin Patch\n*** End Patch']) {
    assert.equal(patch(command).permissionDecision, 'deny');
  }
  await fs.mkdir(path.join(root, 'source'));
  await fs.symlink(path.join(root, 'source'), path.join(root, '.conceptor/work/source-link'), 'junction');
  assert.equal(patch('*** Begin Patch\n*** Add File: .conceptor/work/source-link/file.js\n+source\n*** End Patch').permissionDecision, 'deny');
  assert.equal(run({ cwd: path.join(root, '.conceptor'), tool_name: 'apply_patch', tool_input: { input: '*** Begin Patch\n*** Add File: work/subdir.json\n+{}\n*** End Patch' } }).permissionDecision, undefined);
});

test('assessment delegation is explicit and working state uses only the host parent session', async t => {
  const { run, complete } = await fixture(t);
  for (const tool_name of ['Agent', 'spawn_agent']) {
    assert.equal(run({ tool_name, tool_input: { message: 'Implement the feature.' } }).permissionDecision, 'deny');
    const allowed = run({ tool_name, tool_input: { message: ' Conceptor assessment: inspect the design\nRead only.' } });
    assert.equal(allowed.permissionDecision, undefined);
    assert.match(allowed.additionalContext, /Native ownership/);
    assert.equal(run({ tool_name, tool_input: { prompt: 'Conceptor assessment: review contracts' } }).permissionDecision, undefined);
  }
  await complete();
  for (const tool_name of ['Bash', 'apply_patch', 'Agent', 'spawn_agent']) assert.equal(run({ tool_name, tool_input: {} }), null);
  assert.equal(run({ session_id: undefined, tool_name: 'Bash', tool_input: { command: 'echo implementation' } }).permissionDecision, 'deny');
});

test('changed, missing, malformed, legacy, active, and broken cache states deny ordinary calls', async t => {
  const { root, run, complete } = await fixture(t);
  const completed = await complete();
  const ordinary = () => run({ tool_name: 'Bash', tool_input: { command: 'python write.py' } });
  const file = path.join(root, '.conceptor/work/account.json');
  const original = await fs.readFile(file);
  await fs.appendFile(file, ' ');
  assert.match(ordinary().permissionDecisionReason, /changed after completion/);
  await fs.writeFile(file, '{}');
  assert.equal(ordinary().permissionDecision, 'deny');
  await fs.rm(file);
  assert.equal(ordinary().permissionDecision, 'deny');
  await fs.writeFile(file, original);
  delete completed.state.candidate.comparison;
  await fs.writeFile(path.join(root, completed.cache), JSON.stringify(completed.state));
  assert.match(ordinary().permissionDecisionReason, /no bound comparison/);
  await assessment(root, { sessionId: 'parent-session', action: 'begin', id: 'next' });
  assert.match(ordinary().permissionDecisionReason, /assessment assessing/);
  await fs.writeFile(path.join(root, completed.cache), '{');
  assert.match(ordinary().permissionDecisionReason, /could not verify assessment state/);
});

test('inactive and nested repository calls emit nothing and gate reads never create session state', async t => {
  const { root, run } = await fixture(t);
  run({ tool_name: 'Bash', tool_input: { command: 'echo ordinary' } });
  await assert.rejects(fs.stat(path.join(root, '.conceptor/cache/reassessment')), { code: 'ENOENT' });
  const nested = path.join(root, 'nested');
  await fs.mkdir(path.join(nested, '.git'), { recursive: true });
  assert.equal(run({ cwd: nested, tool_name: 'Bash', tool_input: { command: 'echo ordinary' } }), null);
  await fs.rm(path.join(root, '.conceptor/active'));
  assert.equal(run({ tool_name: 'Bash', tool_input: { command: 'echo ordinary' } }), null);
});


test('the gate becomes due at the existing cadence without changing the cache on reads', async t => {
  const { root, run, complete } = await fixture(t);
  const completed = await complete();
  const file = path.join(root, completed.cache);
  const before = await fs.readFile(file, 'utf8');
  assert.equal(run({ tool_name: 'Bash', tool_input: { command: 'echo ordinary' } }), null);
  assert.equal(await fs.readFile(file, 'utf8'), before);
  await assessment(root, { sessionId: 'parent-session', compact: true });
  assert.equal(run({ tool_name: 'Bash', tool_input: { command: 'echo ordinary' } }).permissionDecision, 'deny');
});
