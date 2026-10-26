import './user-state.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { activate, activationStatus } from '../plugins/conceptor/runtime/activation.mjs';
import { storagePaths, writeCache, readCache, pruneCache, CACHE_LIMITS } from '../plugins/conceptor/runtime/storage.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'conceptor-storage-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('cache replacement, project isolation, expiry and count limits preserve activation', async t => {
  const root = await fixture(t);
  const other = await fixture(t);
  await activate(root);
  await writeCache(root, 'latest', { value: 1 });
  await writeCache(root, 'latest', { value: 2 });
  assert.deepEqual(await readCache(root, 'latest'), { value: 2 });
  assert.equal(await readCache(other, 'latest'), null);
  const { cache } = await storagePaths(root);
  assert.equal((await fs.readdir(cache)).length, 1);
  for (let index = 0; index <= CACHE_LIMITS.entries; index++) await writeCache(root, `key:${index}`, { index });
  assert.equal((await fs.readdir(cache)).length, CACHE_LIMITS.entries);
  await pruneCache(root, Date.now() + CACHE_LIMITS.ageMs + 1000);
  assert.equal(await readCache(root, 'latest'), null);
  assert.deepEqual(await fs.readdir(cache), []);
  assert.equal((await activationStatus(root)).status, 'active');
  assert.deepEqual(await fs.readdir(root), []);
});

test('cache bounds total bytes and refuses oversized entries', async t => {
  const root = await fixture(t);
  const { cache } = await storagePaths(root);
  for (let index = 0; index < 3; index++) await writeCache(root, `large:${index}`, 'x'.repeat(12 * 1024 * 1024));
  const entries = await fs.readdir(cache);
  const bytes = (await Promise.all(entries.map(file => fs.stat(path.join(cache, file))))).reduce((sum, stat) => sum + stat.size, 0);
  assert.ok(bytes <= CACHE_LIMITS.bytes);
  assert.equal(await writeCache(root, 'oversized', 'x'.repeat(CACHE_LIMITS.bytes)), false);
  assert.equal(await readCache(root, 'oversized'), null);
});
