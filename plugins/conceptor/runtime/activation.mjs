import fs from 'node:fs/promises';
import path from 'node:path';
import { readActivation, saveActivation } from './storage.mjs';

function markerPath(root) {
  return path.join(root, '.conceptor', 'active');
}

async function statIfPresent(file) {
  try {
    return await fs.stat(file);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function isGitBoundary(root) {
  const entry = await statIfPresent(path.join(root, '.git'));
  return entry?.isFile() || entry?.isDirectory() || false;
}

export async function activeRoot(start) {
  let current = await fs.realpath(start);
  while (true) {
    if ((await readActivation(current)).active) return current;
    if (await isGitBoundary(current)) return undefined;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export async function projectRoot(start) {
  const original = path.resolve(start);
  const active = await activeRoot(original);
  if (active) return active;
  let current = original;
  while (true) {
    if (await isGitBoundary(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return original;
    current = parent;
  }
}

export async function activate(root) {
  const resolved = await fs.realpath(root);
  const marker = markerPath(resolved);
  const legacy = await statIfPresent(marker);
  if (legacy && (!legacy.isFile() || legacy.size !== 0)) throw new Error('Legacy activation marker is not an empty file; inspect it before migration');
  const locations = await saveActivation(resolved);
  if (legacy) await fs.unlink(marker);
  return { status: 'active', root: resolved, stateFile: locations.activation, migrated: Boolean(legacy) };
}

export async function deactivate(root) {
  const resolved = await fs.realpath(root);
  const marker = markerPath(resolved);
  const locations = await readActivation(resolved);
  const legacy = await statIfPresent(marker);
  if (legacy && (!legacy.isFile() || legacy.size !== 0)) throw new Error('Legacy activation marker is not an empty file; inspect it before removal');
  try {
    if (legacy) await fs.unlink(marker);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.rm(locations.activation, { force: true });
  return { status: 'inactive', root: resolved, stateFile: locations.activation };
}

export async function activationStatus(start) {
  const active = await activeRoot(start);
  const root = active ?? await projectRoot(start);
  const locations = await readActivation(root);
  const legacy = (await statIfPresent(markerPath(root)))?.isFile() ?? false;
  return { status: active ? 'active' : 'inactive', root, stateFile: locations.activation, legacyMarker: legacy,
    ...(legacy ? { instruction: 'Run activate to migrate this project opt-in to local user state. Existing meaning and recovery files are preserved.' } : {}) };
}

export function inactive(root) {
  return {
    status: 'inactive',
    root: path.resolve(root),
    instruction: 'Activate this project with $conceptor:enable-conceptor before using Conceptor.',
  };
}
