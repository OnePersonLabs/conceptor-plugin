import fs from 'node:fs/promises';
import path from 'node:path';
import { hash, projectPath } from './state.mjs';

const fields = ['governing', 'cleanCandidate', 'comparison', 'decision', 'boundary', 'validation', 'review'];

/** Validate the saved account's shape and identity, not the quality of its judgment. */
export async function readComparison(root, relative) {
  if (typeof relative !== 'string' || !relative.trim()) throw new Error('comparison must be a nonempty project-relative path to a saved JSON account.');
  const file = await projectPath(root, relative);
  const bytes = await fs.readFile(file);
  let account;
  try { account = JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error(`Comparison account ${relative} must contain valid JSON.`); }
  if (!account || Array.isArray(account) || typeof account !== 'object'
    || fields.some(field => typeof account[field] !== 'string' || !account[field].trim())) {
    throw new Error(`Comparison account ${relative} requires nonempty narrative strings: ${fields.join(', ')}.`);
  }
  return { path: path.relative(await fs.realpath(root), file).replaceAll('\\', '/'), hash: hash(bytes) };
}

export async function comparisonProblem(root, candidate) {
  if (!candidate?.comparison?.path || !candidate.comparison.hash) {
    return 'The candidate has no bound comparison account. Begin a new assessment and complete it with a saved comparison JSON path.';
  }
  try {
    const current = await readComparison(root, candidate.comparison.path);
    if (current.hash !== candidate.comparison.hash) return 'The comparison account changed after completion. Begin a new assessment and complete it with the current saved account.';
  } catch (error) {
    return `The comparison account is unavailable or invalid: ${error.message} Restore the completed bytes or begin a new assessment with a valid saved account.`;
  }
  return null;
}
