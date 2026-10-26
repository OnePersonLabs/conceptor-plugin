import fs from 'node:fs/promises';
import path from 'node:path';
import { projectPath } from './state.mjs';

async function statIfPresent(file) {
  try { return await fs.stat(file); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}

async function hasMeaningDirectory(root) {
  return (await statIfPresent(await projectPath(root, '.conceptor')))?.isDirectory() ?? false;
}

export async function projectRoot(start) {
  const original = await fs.realpath(start);
  let current = original;
  let standalone;
  while (true) {
    const git = await statIfPresent(path.join(current, '.git'));
    // A nested repository or linked worktree never inherits its parent's model.
    if (git?.isFile() || git?.isDirectory()) return current;
    standalone ??= await hasMeaningDirectory(current) ? current : undefined;
    const parent = path.dirname(current);
    if (parent === current) return standalone ?? original;
    current = parent;
  }
}

export async function activeRoot(start) {
  const root = await projectRoot(start);
  return await hasMeaningDirectory(root) ? root : undefined;
}

export function inactive(root) {
  return { status: 'inactive', root: path.resolve(root), instruction: 'This project has no root .conceptor directory. Continue through the caller ordinary workflow.' };
}
