import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { hash, writeJson } from './state.mjs';

export const CACHE_LIMITS = Object.freeze({ entries: 128, bytes: 32 * 1024 * 1024, ageMs: 7 * 24 * 60 * 60 * 1000 });
const pluginVersion = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8')).version;
const cacheVersion = `conceptor-evidence-2/${pluginVersion}`;
const contains = (parent, child) => { const relative = path.relative(parent, child); return !relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); };

export async function canonicalRoot(root) {
  const resolved = await fs.realpath(root);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function homeDirectory() {
  if (process.env.CONCEPTOR_HOME) {
    if (!path.isAbsolute(process.env.CONCEPTOR_HOME)) throw new Error('CONCEPTOR_HOME must be an absolute directory outside the project');
    return process.env.CONCEPTOR_HOME;
  }
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Conceptor');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'Conceptor');
  const state = process.env.XDG_STATE_HOME;
  return path.join(state && path.isAbsolute(state) ? state : path.join(os.homedir(), '.local', 'state'), 'conceptor');
}

// Resolve the nearest existing ancestor, including a redirected user directory.
async function physicalPath(target) {
  let existing = target;
  while (true) {
    try { return path.resolve(await fs.realpath(existing), path.relative(existing, target)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; existing = path.dirname(existing); }
  }
}

export async function storagePaths(root) {
  const project = await canonicalRoot(root);
  const home = await physicalPath(path.resolve(homeDirectory()));
  return { project, home, activation: path.join(home, 'projects', hash(project) + '.json'), cache: path.join(home, 'cache') };
}

export async function storageDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
  if ((await fs.lstat(directory)).isSymbolicLink()) throw new Error(`Conceptor storage directory must not be a link: ${directory}`);
}

async function regularJson(file) {
  try {
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Expected a regular Conceptor state file: ${file}`);
    return { value: JSON.parse(await fs.readFile(file, 'utf8')), stat };
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function readActivation(root) {
  const locations = await storagePaths(root);
  const record = await regularJson(locations.activation);
  if (record && record.value.root !== locations.project) throw new Error('Conceptor activation identity does not match this project');
  return { ...locations, active: Boolean(record) };
}

export async function saveActivation(root) {
  const locations = await storagePaths(root);
  if (contains(locations.project, locations.home)) throw new Error('Conceptor state must be outside the project');
  await storageDirectory(path.dirname(locations.activation));
  await writeJson(locations.activation, { root: locations.project });
  if (!(await readActivation(root)).active) throw new Error('Could not verify saved activation');
  return locations;
}

async function cacheFile(root, key) {
  const locations = await storagePaths(root);
  if (contains(locations.project, locations.home)) throw new Error('Conceptor state must be outside the project');
  return { ...locations, file: path.join(locations.cache, hash({ version: cacheVersion, root: locations.project, key }) + '.json') };
}

// Only this flat, owned cache is pruned. Activation and authored meaning are not cache.
export async function pruneCache(root, now = Date.now()) {
  const { cache } = await storagePaths(root);
  let entries;
  try {
    if ((await fs.lstat(cache)).isSymbolicLink()) throw new Error('Conceptor cache directory must not be a link');
    entries = await fs.readdir(cache, { withFileTypes: true });
  } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  const retained = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const file = path.join(cache, entry.name);
    if (!/^[a-f0-9]{64}\.json(?:\.[a-f0-9-]+\.tmp)?$/.test(entry.name)) continue;
    let stat;
    try { stat = await fs.lstat(file); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (!stat.isFile()) continue;
    if (now - stat.mtimeMs > CACHE_LIMITS.ageMs) { await fs.rm(file, { force: true }); continue; }
    if (entry.name.endsWith('.json')) retained.push({ file, size: stat.size, time: stat.mtimeMs });
  }
  retained.sort((a, b) => b.time - a.time || a.file.localeCompare(b.file));
  let bytes = 0;
  for (let index = 0; index < retained.length; index++) {
    const item = retained[index];
    if (index >= CACHE_LIMITS.entries || bytes + item.size > CACHE_LIMITS.bytes) await fs.rm(item.file, { force: true });
    else bytes += item.size;
  }
}

export async function readCache(root, key) {
  await pruneCache(root);
  const { file } = await cacheFile(root, key);
  const saved = await regularJson(file);
  return saved?.value ?? null;
}

export async function writeCache(root, key, value) {
  const { cache, file } = await cacheFile(root, key);
  // Oversized observations still return to the caller; they do not enter reusable storage.
  if (Buffer.byteLength(JSON.stringify(value)) > CACHE_LIMITS.bytes / 2) return false;
  await storageDirectory(cache);
  await writeJson(file, value);
  await pruneCache(root);
  return true;
}
