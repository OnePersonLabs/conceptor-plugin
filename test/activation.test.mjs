import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { activeRoot, projectRoot } from '../plugins/conceptor/runtime/activation.mjs';

const run = promisify(execFile);
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-activation-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('directory activation follows the repository root, not a nested example', async t => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, '.git'));
  const child = path.join(root, 'examples', 'demo');
  await fs.mkdir(path.join(child, '.conceptor'), { recursive:true });
  assert.equal(await projectRoot(child), root);
  assert.equal(await activeRoot(child), undefined);
  await fs.mkdir(path.join(root, '.conceptor'));
  assert.equal(await activeRoot(child), root);
  const alias = path.join(await fixture(t), 'alias');
  await fs.symlink(root, alias, 'junction');
  assert.equal(await activeRoot(alias), root);
});

test('standalone explicit roots work while invalid directories report errors', async t => {
  const root = await fixture(t);
  const child = path.join(root, 'src');
  await fs.mkdir(child);
  assert.equal(await activeRoot(child), undefined);
  await fs.writeFile(path.join(root, '.conceptor'), 'not a directory');
  assert.equal(await activeRoot(root), undefined);
  await fs.unlink(path.join(root, '.conceptor'));
  await fs.mkdir(path.join(root, '.conceptor'));
  assert.equal(await projectRoot(child), root);
  assert.equal(await activeRoot(child), root);
  await assert.rejects(activeRoot(path.join(root, '\0')), { code:'ERR_INVALID_ARG_VALUE' });
});

test('nested repositories and linked worktree boundaries do not inherit activation', async t => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, '.conceptor'));
  for (const kind of ['directory', 'file']) {
    const nested = path.join(root, kind);
    const child = path.join(nested, 'src');
    await fs.mkdir(child, { recursive:true });
    if (kind === 'directory') await fs.mkdir(path.join(nested, '.git'));
    else await fs.writeFile(path.join(nested, '.git'), 'gitdir: ../worktree');
    assert.equal(await activeRoot(child), undefined);
    assert.equal(await projectRoot(child), nested);
    await fs.mkdir(path.join(nested, '.conceptor'));
    assert.equal(await activeRoot(child), nested);
  }
});

test('an actual Git worktree uses its own checked-out meaning', async t => {
  const root = await fixture(t);
  await run('git', ['init', '-q', root]);
  await fs.mkdir(path.join(root, '.conceptor'));
  await fs.writeFile(path.join(root, '.conceptor', 'meaning.md'), 'accepted project content');
  await run('git', ['-C', root, 'add', '.conceptor/meaning.md']);
  await run('git', ['-C', root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Initial meaning']);
  const worktree = path.join(root, 'other');
  await run('git', ['-C', root, 'worktree', 'add', '--detach', worktree, 'HEAD']);
  assert.equal(await activeRoot(worktree), worktree);
  await fs.rename(path.join(worktree, '.conceptor'), path.join(worktree, 'saved'));
  assert.equal(await activeRoot(worktree), undefined);
  assert.equal(await activeRoot(root), root);
});

test('an escaping Conceptor directory cannot activate outside project content', async t => {
  const root = await fixture(t);
  const external = await fixture(t);
  await fs.symlink(external, path.join(root, '.conceptor'), 'junction');
  await assert.rejects(activeRoot(root), /Symlink escapes/);
});
