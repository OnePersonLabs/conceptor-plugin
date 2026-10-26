import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';

const cli = path.resolve('plugins/conceptor/runtime/cli.mjs');
function invoke(root, command, request, source = '-') {
  return new Promise((resolve, reject) => {
    const child = execFile(process.execPath, [cli, command, '--root', root, '--request', source], { windowsHide: true }, (error, stdout, stderr) => {
      if (error) reject(Object.assign(error, { stdout, stderr }));
      else resolve(JSON.parse(stdout));
    });
    child.stdin.on('error', error => { if (error.code !== 'EPIPE') reject(error); });
    child.stdin.end(typeof request === 'string' ? request : JSON.stringify(request));
  });
}
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-cli-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, '.conceptor/meaning'), { recursive: true });
  await fs.writeFile(path.join(root, '.conceptor/meaning/export.md'), '---\nid: export\nkind: concept\ntitle: Export\nstatus: accepted\n---\nFailed exports preserve existing files.\n');
  return root;
}

test('CLI accepts stdin and explicit files while inactive projects ignore malformed input', async t => {
  const root = await fixture(t);
  const request = { concepts: ['export'] };
  assert.equal((await invoke(root, 'focus', request)).meaning[0].id, 'export');
  const file = path.join(root, 'request.json');
  await fs.writeFile(file, JSON.stringify(request));
  assert.equal((await invoke(root, 'focus', '', file)).meaning[0].id, 'export');
  await assert.rejects(invoke(root, 'focus', 'null'), error => error.code === 2 && /JSON object/.test(error.stderr));
  await fs.rename(path.join(root, '.conceptor'), path.join(root, 'saved'));
  assert.equal((await invoke(root, 'focus', 'not json')).status, 'inactive');
});

test('CLI apply-plan persists replay identity across fresh processes and finishes without a request file', async t => {
  const root = await fixture(t);
  const accepted = {
    action: 'accept', expectedRevision: null,
    request: { id: 'request-66', revision: '1', content: 'Preserve files after export failure.' },
    target: 'Export failure preserves the existing file.',
    units: [{ id: 'export', text: 'Implement and verify failure preservation.' }]
  };
  const first = await invoke(root, 'apply-plan', accepted);
  const resumed = await invoke(root, 'apply-plan', { action: 'read' });
  assert.equal(resumed.revision, first.revision);
  assert.equal(resumed.plan.metadata.requests[0].id, 'request-66');
  assert.equal((await invoke(root, 'apply-plan', { ...accepted, expectedRevision: first.revision })).unchanged, true);
  await assert.rejects(invoke(root, 'apply-plan', { action: 'update', expectedRevision: first.revision, units: [], permissionMode: 'plan' }), error => error.code === 2 && /Plan Mode/.test(error.stderr));
  const done = await invoke(root, 'apply-plan', { action: 'update', expectedRevision: first.revision, units: [] });
  assert.equal((await invoke(root, 'apply-plan', { action: 'finish', expectedRevision: done.revision, verified: true })).finished, true);
  assert.equal((await invoke(root, 'apply-plan', { action: 'read' })).status, 'absent');
});
