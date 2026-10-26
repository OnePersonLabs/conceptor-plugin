import './user-state.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { activate, deactivate, activeRoot, projectRoot, activationStatus } from '../plugins/conceptor/runtime/activation.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-activation-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('local activation is explicit, canonical and independent of project files', async t => {
  const root = await fixture(t);
  const child = path.join(root, 'src');
  await fs.mkdir(child);
  assert.equal(await activeRoot(child), undefined);
  assert.equal(await projectRoot(child), child);
  const status = await activationStatus(root);
  await assert.rejects(fs.access(status.stateFile), { code: 'ENOENT' });
  const result = await activate(root);
  assert.equal(await activeRoot(child), root);
  assert.equal(await projectRoot(child), root);
  assert.deepEqual(await fs.readdir(root), ['src']);
  const alias = path.join(await fixture(t), 'alias');
  await fs.symlink(root, alias, 'junction');
  assert.equal((await activationStatus(alias)).stateFile, result.stateFile);
  await fs.writeFile(path.join(root, 'meaning.md'), 'authored meaning');
  await deactivate(alias);
  await deactivate(root);
  assert.equal(await activeRoot(child), undefined);
  assert.equal(await fs.readFile(path.join(root, 'meaning.md'), 'utf8'), 'authored meaning');
});

test('nested repositories and worktree roots require separate activation', async t => {
  const root = await fixture(t);
  await activate(root);
  for (const kind of ['directory', 'file']) {
    const nested = path.join(root, kind);
    const child = path.join(nested, 'src');
    await fs.mkdir(child, { recursive: true });
    if (kind === 'directory') await fs.mkdir(path.join(nested, '.git'));
    else await fs.writeFile(path.join(nested, '.git'), 'gitdir: ../worktree');
    assert.equal(await activeRoot(child), undefined);
    assert.equal(await projectRoot(child), nested);
    const separate = await activate(nested);
    assert.notEqual(separate.stateFile, (await activationStatus(root)).stateFile);
    assert.equal(await activeRoot(child), nested);
    await deactivate(nested);
    assert.equal(await activeRoot(child), undefined);
  }
});

test('legacy opt-in is migrated explicitly without touching meaning or recovery', async t => {
  const root = await fixture(t);
  const legacy = path.join(root, '.conceptor');
  await fs.mkdir(path.join(legacy, 'work'), { recursive: true });
  await fs.writeFile(path.join(legacy, 'work', 'unresolved.json'), 'recovery bytes');
  await fs.writeFile(path.join(legacy, 'active'), '');
  const status = await activationStatus(root);
  assert.equal(status.status, 'inactive');
  assert.equal(status.legacyMarker, true);
  assert.equal(await fs.readFile(path.join(legacy, 'active'), 'utf8'), '');
  await assert.rejects(fs.access(status.stateFile), { code: 'ENOENT' });
  assert.equal((await activate(root)).migrated, true);
  await assert.rejects(fs.access(path.join(legacy, 'active')), { code: 'ENOENT' });
  assert.equal(await fs.readFile(path.join(legacy, 'work', 'unresolved.json'), 'utf8'), 'recovery bytes');
  await deactivate(root);
  assert.equal(await fs.readFile(path.join(legacy, 'work', 'unresolved.json'), 'utf8'), 'recovery bytes');
});

test('activation rejects invalid state and an unexpected legacy marker', async t => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, '.conceptor'));
  await fs.writeFile(path.join(root, '.conceptor', 'active'), 'user data');
  await assert.rejects(activate(root), /not an empty file/);
  await fs.unlink(path.join(root, '.conceptor', 'active'));
  await activate(root);
  await fs.writeFile(path.join(root, '.conceptor', 'active'), 'user data');
  await assert.rejects(deactivate(root), /not an empty file/);
  assert.equal((await activationStatus(root)).status, 'active');
  await fs.unlink(path.join(root, '.conceptor', 'active'));
  const savedHome = process.env.CONCEPTOR_HOME;
  process.env.CONCEPTOR_HOME = root;
  try { await assert.rejects(activate(root), /outside the project/); }
  finally { process.env.CONCEPTOR_HOME = savedHome; }
  await assert.rejects(activeRoot(path.join(root, '\0')), { code: 'ERR_INVALID_ARG_VALUE' });
});
