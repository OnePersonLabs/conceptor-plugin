import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { applyPlan, APPLY_PLAN_PATH, APPLY_PLAN_PENDING_PATH, APPLY_PLAN_LIMIT_BYTES } from '../plugins/conceptor/runtime/apply-plan.mjs';

async function project(t, { git = true, ignorePending = true } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-apply-plan-'));
  await fs.mkdir(path.join(root, '.conceptor'));
  if (git) {
    execFileSync('git', ['init', '-q'], { cwd: root });
    if (ignorePending) await fs.writeFile(path.join(root, '.gitignore'), `${APPLY_PLAN_PENDING_PATH}\n`);
  }
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

const requestA = {
  action: 'accept', expectedRevision: null,
  request: { id: 'task-66', revision: 'r1', content: 'Add the requested endpoint', source: 'issue:66' },
  target: 'Add endpoint behavior while preserving current API semantics.',
  baseline: 'main at the checkout start',
  decisions: ['Keep response validation at the boundary.'],
  units: [
    { id: 'contract', text: 'Define endpoint contract.' },
    { id: 'implementation', text: 'Implement endpoint.', dependsOn: ['contract'] }
  ]
};

test('accept records an ordered readable plan and replay is idempotent', async t => {
  const root = await project(t);
  const first = await applyPlan(root, requestA);
  assert.match(await fs.readFile(path.join(root, APPLY_PLAN_PATH), 'utf8'), /- \[ \] `contract`/);
  assert.match(await fs.readFile(path.join(root, APPLY_PLAN_PATH), 'utf8'), /  depends-on: \["contract"\]/);
  assert.equal(first.plan.units[1].dependsOn[0], 'contract');
  assert.equal((await applyPlan(root)).status, 'active');
  const replay = await applyPlan(root, { ...structuredClone(requestA), expectedRevision: first.revision });
  assert.equal(replay.unchanged, true);
  assert.equal(replay.revision, first.revision);
  assert.deepEqual(await fs.readdir(path.join(root, '.conceptor')), ['APPLY_PLAN.md']);
});

test('same request revision conflicts; revised content requires reassessment', async t => {
  const root = await project(t);
  const first = await applyPlan(root, requestA);
  await assert.rejects(applyPlan(root, { ...requestA, expectedRevision: first.revision, request: { ...requestA.request, content: 'Different content' } }), /conflicting content/);
  await assert.rejects(applyPlan(root, {
    ...requestA, expectedRevision: first.revision,
    request: { ...requestA.request, revision: 'r2', content: 'Revise endpoint behavior' }
  }), /reassessed:true/);
  const revised = await applyPlan(root, {
    ...requestA, expectedRevision: first.revision, reassessed: true,
    request: { ...requestA.request, revision: 'r2', content: 'Revise endpoint behavior' }
  });
  assert.equal(revised.plan.metadata.requests[0].revision, 'r2');
});

test('dependency order and task identities are validated', async t => {
  const root = await project(t);
  await assert.rejects(applyPlan(root, { ...requestA, units: [
    { id: 'later', text: 'Second', dependsOn: ['earlier'] },
    { id: 'earlier', text: 'First' }
  ] }), /must follow dependency/);
  await assert.rejects(applyPlan(root, { ...requestA, units: [{ id: 'x', text: 'One' }, { id: 'x', text: 'Two' }] }), /Duplicate task id/);
});

test('dependency-like words at the end of task text stay plain task text', async t => {
  const root = await project(t);
  const result = await applyPlan(root, {
    ...requestA,
    units: [
      { id: 'contract', text: 'Document behavior (after: `this is literal text`) .' },
      { id: 'implementation', text: 'Implement the endpoint.', dependsOn: ['contract'] }
    ]
  });
  assert.equal(result.plan.units[0].text, 'Document behavior (after: `this is literal text`) .');
  assert.deepEqual(result.plan.units[1].dependsOn, ['contract']);
});

test('stored request identity is mandatory and former arbitrary field counts do not limit the bounded record', async t => {
  const root = await project(t);
  const accepted = await applyPlan(root, { ...requestA, decisions: Array.from({ length: 40 }, (_, i) => `Decision ${i}`) });
  assert.ok(accepted);
  let text = await fs.readFile(path.join(root, APPLY_PLAN_PATH), 'utf8');
  text = text.replace(/^  - id: task-66\r?\n    revision:/m, '  - revision:');
  await fs.writeFile(path.join(root, APPLY_PLAN_PATH), text);
  await assert.rejects(applyPlan(root), /explicit id and revision/);

  const large = await project(t);
  let state = await applyPlan(large, requestA);
  for (let index = 0; index < 34; index++) {
    state = await applyPlan(large, {
      action: 'accept', expectedRevision: state.revision, reassessed: true,
      request: { id: `request-${index}`, revision: '1', content: `A short request ${index}` },
      target: 'Combined evolving target.', units: [{ id: 'work', text: 'Implement the combined target.' }]
    });
  }
  assert.equal(state.plan.metadata.requests.length, 35);
  assert.ok(Buffer.byteLength(await fs.readFile(path.join(large, APPLY_PLAN_PATH))) < APPLY_PLAN_LIMIT_BYTES);
});

test('expected revisions reject stale writes and Plan Mode remains read-only', async t => {
  const root = await project(t);
  const first = await applyPlan(root, requestA);
  await assert.rejects(applyPlan(root, { action: 'update', expectedRevision: '0'.repeat(64), target: 'stale' }), /Stale apply-plan update/);
  await assert.rejects(applyPlan(root, { action: 'update', expectedRevision: first.revision, permissionMode: 'plan', target: 'mutate' }), /Plan Mode/);
  assert.equal((await applyPlan(root)).revision, first.revision);
});

test('concurrent writers cannot overwrite each other or leave multiple pending files', async t => {
  const root = await project(t);
  const results = await Promise.allSettled([
    applyPlan(root, requestA),
    applyPlan(root, { ...requestA, request: { ...requestA.request, id: 'task-67', content: 'Add another behavior' }, reassessed: true })
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  const names = await fs.readdir(path.join(root, '.conceptor'));
  assert.ok(names.length <= 2);
  const state = await applyPlan(root);
  assert.ok(['active', 'recovery-required'].includes(state.status));
});

test('rename failure preserves the original record and removes the owned pending file', async t => {
  const root = await project(t);
  const current = await applyPlan(root, requestA);
  const original = await fs.readFile(path.join(root, APPLY_PLAN_PATH), 'utf8');
  const rename = fs.rename.bind(fs);
  const failure = t.mock.method(fs, 'rename', async (source, destination) => {
    if (destination === path.join(root, APPLY_PLAN_PATH)) {
      const error = new Error('simulated rename failure');
      error.code = 'EIO';
      throw error;
    }
    return rename(source, destination);
  });
  await assert.rejects(applyPlan(root, {
    action: 'update', expectedRevision: current.revision,
    target: 'Changed target.', reassessed: true,
    units: [{ id: 'next', text: 'Finish the change.' }]
  }), /simulated rename failure/);
  t.mock.restoreAll();
  assert.equal(await fs.readFile(path.join(root, APPLY_PLAN_PATH), 'utf8'), original);
  assert.deepEqual(await fs.readdir(path.join(root, '.conceptor')), ['APPLY_PLAN.md']);
});

test('failed pending cleanup is reported and blocks future writes until recovery', async t => {
  const root = await project(t);
  const current = await applyPlan(root, requestA);
  const rename = fs.rename.bind(fs);
  const unlink = fs.unlink.bind(fs);
  const renameFailure = t.mock.method(fs, 'rename', async (source, destination) => {
    if (destination === path.join(root, APPLY_PLAN_PATH)) {
      const error = new Error('simulated rename failure');
      error.code = 'EIO';
      throw error;
    }
    return rename(source, destination);
  });
  let failedCleanup = false;
  const unlinkFailure = t.mock.method(fs, 'unlink', async target => {
    if (target === path.join(root, APPLY_PLAN_PENDING_PATH) && !failedCleanup) {
      failedCleanup = true;
      const error = new Error('simulated cleanup failure');
      error.code = 'EACCES';
      throw error;
    }
    return unlink(target);
  });
  await assert.rejects(applyPlan(root, {
    action: 'update', expectedRevision: current.revision,
    target: 'Changed target.', reassessed: true,
    units: [{ id: 'next', text: 'Finish the change.' }]
  }), /cleanup of owned pending file failed: simulated cleanup failure/);
  t.mock.restoreAll();
  const state = await applyPlan(root);
  assert.equal(state.status, 'recovery-required');
  await assert.rejects(applyPlan(root, { action: 'update', expectedRevision: current.revision, units: [] }), /pending file already exists/);
  const recovered = await applyPlan(root, {
    action: 'recover', mode: 'discard', ownedCheckout: true, soleRecoveryActor: true, reconciled: true,
    expectedRevision: current.revision, expectedPendingRevision: state.pending.pendingRevision
  });
  assert.equal(recovered.recovered, 'discarded');
  assert.equal((await applyPlan(root)).revision, current.revision);
});

test('oversized replacement leaves the valid plan intact', async t => {
  const root = await project(t);
  const first = await applyPlan(root, requestA);
  await assert.rejects(applyPlan(root, {
    action: 'update', expectedRevision: first.revision,
    target: 'Huge but valid summary', reassessed: true,
    units: Array.from({ length: 20 }, (_, index) => ({ id: `huge-${index}`, text: 'x'.repeat(4096) }))
  }), /exceeds 65536 bytes/);
  assert.equal((await applyPlan(root)).revision, first.revision);
  assert.deepEqual(await fs.readdir(path.join(root, '.conceptor')), ['APPLY_PLAN.md']);
});

test('pending recovery installs only a reconciled candidate based on current revision', async t => {
  const root = await project(t);
  const current = await applyPlan(root, requestA);
  const staging = await project(t, { git: false });
  const stagedBase = await applyPlan(staging, requestA);
  assert.equal(stagedBase.revision, current.revision);
  const candidate = await applyPlan(staging, {
    action: 'update', expectedRevision: stagedBase.revision,
    target: 'Updated target', reassessed: true,
    units: [{ id: 'remaining', text: 'Finish the verified implementation.' }]
  });
  const candidateText = await fs.readFile(path.join(staging, APPLY_PLAN_PATH), 'utf8');
  await fs.writeFile(path.join(root, APPLY_PLAN_PENDING_PATH), candidateText, { flag: 'wx' });
  const state = await applyPlan(root);
  assert.equal(state.pending.candidateRevision, candidate.revision);
  await assert.rejects(applyPlan(root, {
    action: 'recover', mode: 'install', ownedCheckout: true, soleRecoveryActor: true, reconciled: true,
    expectedRevision: '0'.repeat(64), expectedPendingRevision: candidate.revision
  }), /stale/);
  const recovered = await applyPlan(root, {
    action: 'recover', mode: 'install', ownedCheckout: true, soleRecoveryActor: true, reconciled: true,
    expectedRevision: current.revision, expectedPendingRevision: candidate.revision
  });
  assert.equal(recovered.revision, candidate.revision);
  assert.equal((await applyPlan(root)).plan.metadata.target, 'Updated target');
  assert.deepEqual(await fs.readdir(path.join(root, '.conceptor')), ['APPLY_PLAN.md']);
});

test('recovery can explicitly discard bounded pending state after reconciliation', async t => {
  const root = await project(t);
  const active = await applyPlan(root, requestA);
  const current = await fs.readFile(path.join(root, APPLY_PLAN_PATH), 'utf8');
  await fs.writeFile(path.join(root, APPLY_PLAN_PENDING_PATH), current, { flag: 'wx' });
  await assert.rejects(applyPlan(root, { action: 'recover', mode: 'discard', expectedRevision: null, expectedPendingRevision: active.revision }), /ownedCheckout/);
  const result = await applyPlan(root, {
    action: 'recover', mode: 'discard', ownedCheckout: true, soleRecoveryActor: true, reconciled: true,
    expectedRevision: active.revision, expectedPendingRevision: active.revision
  });
  assert.equal(result.recovered, 'discarded');
  assert.deepEqual(await fs.readdir(path.join(root, '.conceptor')), ['APPLY_PLAN.md']);
});

test('partial pending writes remain visible and can be explicitly discarded', async t => {
  const root = await project(t);
  const partial = '---\nschema: 1\nrequests:';
  await fs.writeFile(path.join(root, APPLY_PLAN_PENDING_PATH), partial, { flag: 'wx' });
  const state = await applyPlan(root);
  assert.equal(state.status, 'recovery-required');
  assert.equal(state.pending.valid, false);
  await assert.rejects(applyPlan(root, {
    action: 'recover', mode: 'install', ownedCheckout: true, soleRecoveryActor: true, reconciled: true,
    expectedRevision: null, expectedPendingRevision: state.pending.pendingRevision
  }), /malformed/);
  const result = await applyPlan(root, {
    action: 'recover', mode: 'discard', ownedCheckout: true, soleRecoveryActor: true, reconciled: true,
    expectedRevision: null, expectedPendingRevision: state.pending.pendingRevision
  });
  assert.equal(result.recovered, 'discarded');
  assert.deepEqual(await fs.readdir(path.join(root, '.conceptor')), []);
});

test('finish requires verified completion and removes the complete record', async t => {
  const root = await project(t);
  const first = await applyPlan(root, requestA);
  await assert.rejects(applyPlan(root, { action: 'finish', expectedRevision: first.revision, verified: true }), /remaining tasks/);
  const empty = await applyPlan(root, { action: 'update', expectedRevision: first.revision, units: [] });
  const result = await applyPlan(root, { action: 'finish', expectedRevision: empty.revision, verified: true });
  assert.equal(result.finished, true);
  assert.equal((await applyPlan(root)).revision, null);
  assert.deepEqual(await fs.readdir(path.join(root, '.conceptor')), []);
});

test('completed units and the final plan removal can share their implementation commits', async t => {
  const root = await project(t);
  execFileSync('git', ['config', 'user.name', 'Apply Plan Test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'apply-plan@example.invalid'], { cwd: root });
  await fs.writeFile(path.join(root, 'README.md'), 'fixture\n');
  execFileSync('git', ['add', '.gitignore', 'README.md'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'Initialize fixture'], { cwd: root });

  const accepted = await applyPlan(root, {
    action: 'accept', expectedRevision: null,
    request: { id: 'change-1', revision: '1', content: 'Implement one endpoint.' },
    target: 'Endpoint is implemented and verified.',
    units: [{ id: 'implement', text: 'Implement the endpoint.' }, { id: 'verify', text: 'Verify endpoint behavior.', dependsOn: ['implement'] }]
  });
  execFileSync('git', ['add', APPLY_PLAN_PATH], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'Accept endpoint change'], { cwd: root });

  await fs.writeFile(path.join(root, 'endpoint.mjs'), 'export const endpoint = true;\n');
  const remaining = await applyPlan(root, {
    action: 'update', expectedRevision: accepted.revision,
    units: [{ id: 'verify', text: 'Verify endpoint behavior.' }]
  });
  execFileSync('git', ['add', 'endpoint.mjs', APPLY_PLAN_PATH], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'Implement endpoint'], { cwd: root });
  const implementationCommit = execFileSync('git', ['show', '--pretty=format:', '--name-status', 'HEAD'], { cwd: root, encoding: 'utf8' });
  assert.match(implementationCommit, /A\s+endpoint\.mjs/);
  assert.match(implementationCommit, /M\s+\.conceptor\/APPLY_PLAN\.md/);
  assert.deepEqual((await applyPlan(root)).plan.units.map(unit => unit.id), ['verify']);

  const complete = await applyPlan(root, { action: 'update', expectedRevision: remaining.revision, units: [] });
  await fs.writeFile(path.join(root, 'verification.txt'), 'endpoint behavior verified\n');
  await applyPlan(root, { action: 'finish', expectedRevision: complete.revision, verified: true });
  execFileSync('git', ['add', '-A', '.conceptor', 'verification.txt'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'Verify endpoint and finish plan'], { cwd: root });
  const finishCommit = execFileSync('git', ['show', '--pretty=format:', '--name-status', 'HEAD'], { cwd: root, encoding: 'utf8' });
  assert.match(finishCommit, /D\s+\.conceptor\/APPLY_PLAN\.md/);
  assert.match(finishCommit, /A\s+verification\.txt/);
});

test('pending path must be ignored by Git before writes', async t => {
  const root = await project(t, { ignorePending: false });
  await assert.rejects(applyPlan(root, requestA), /Add .conceptor\/APPLY_PLAN.md.pending/);
  assert.deepEqual(await fs.readdir(path.join(root, '.conceptor')), []);
});

test('physical .conceptor root is required', async t => {
  const root = await project(t, { git: false });
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-plan-outside-'));
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  await fs.rm(path.join(root, '.conceptor'), { recursive: true });
  await fs.symlink(outside, path.join(root, '.conceptor'), 'junction');
  await assert.rejects(applyPlan(root), /physical \.conceptor directory/);
});

