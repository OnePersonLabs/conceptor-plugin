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
  assert.equal((await invoke(root, 'focus', request, file)).meaning[0].id, 'export');
  await assert.rejects(invoke(root, 'focus', 'not json'), error => error.code === 2 && /JSON/.test(error.stderr));
  await fs.rename(path.join(root, '.conceptor'), path.join(root, 'saved'));
  assert.equal((await invoke(root, 'focus', 'not json')).status, 'inactive');
});

test('CLI carries prepared design through review-required to a bound handoff and refuses stale or absent scope', async t => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, '.conceptor/meaning/export.md'), '---\nid: export\nkind: concept\ntitle: Export\nstatus: accepted\ncapability:\n  root: true\n  obligations:\n    - id: preserve\n      section: Preserve files\n---\n# Export\n\n## Preserve files\nFailed exports preserve existing files.\n');
  const identity = { sourceIdentity: 'export-request', requestRevision: 'revision-1' };
  const prepared = await invoke(root, 'prepare-design', identity);
  assert.equal(prepared.status, 'ready');
  const request = { ...identity, plannerId: 'planner', scope: prepared.scope, proposal: { summary: 'Export commits output only after success.', contracts: [{ id: 'atomic-export', responsibility: 'Preserve the existing file when export fails.', consumers: ['export dialog'] }], coverage: prepared.scope.refs.map(ref => ({ ref, disposition: 'preserved', rationale: 'Commit only complete output.', contractIds: ['atomic-export'], verification: 'Fail an export and read the previous destination.' })) }, increment: { id: 'safe-export', summary: 'Implement the export failure path.', refs: ['export#preserve'], verification: ['Read destination after failed export.'] } };
  const checked = await invoke(root, 'check-design', request);
  assert.equal(checked.status, 'review-required');
  const review = { ...checked.reviewTemplate, reviewerId: 'reviewer', reviewedRefs: prepared.scope.refs, verdict: 'clear', summary: 'Failure and consumer behavior reviewed.', findings: [] };
  const result = await invoke(root, 'handoff', { ...request, review });
  assert.equal(result.status, 'ready');
  assert.equal(result.bindings.targetRoot, await fs.realpath(root));
  await fs.appendFile(path.join(root, '.conceptor/meaning/export.md'), '\nAn additional authored condition.\n');
  await assert.rejects(invoke(root, 'handoff', { ...request, review }), error => error.code === 2 && JSON.parse(error.stdout).status === 'unresolved');
  await fs.rename(path.join(root, '.conceptor'), path.join(root, 'saved'));
  await assert.rejects(invoke(root, 'prepare-design', identity), error => error.code === 2 && JSON.parse(error.stdout).status === 'unresolved');
});
