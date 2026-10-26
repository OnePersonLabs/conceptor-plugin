#!/usr/bin/env node
import path from 'node:path';
import { focus, revisit, reconcile } from './conceptor.mjs';
import { observe } from './providers/index.mjs';
import { readJson } from './state.mjs';
import { activate, deactivate, activationStatus, projectRoot, activeRoot, inactive } from './activation.mjs';

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help' || command === 'help') {
    console.log('Conceptor -- Concept Projector\nCommands: activate, deactivate, status, focus, revisit, reconcile, observe\nUsage: conceptor COMMAND [--root PATH] [--request REQUEST.json]\nConceptor runs only in activated projects. The agent handles ordinary requests through the installed skills.');
    return;
  }
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!['--root', '--request'].includes(args[index]) || !args[index + 1]) throw new Error(`Unknown or incomplete option: ${args[index]}`);
    options[args[index].slice(2)] = args[index + 1];
  }
  const root = options.root ? path.resolve(options.root) : await projectRoot(process.cwd());
  const operations = { activate, deactivate, status: activationStatus, focus, revisit, reconcile, observe };
  if (!operations[command]) throw new Error(`Unknown command: ${command}`);
  if (!['activate', 'deactivate', 'status'].includes(command) && !await activeRoot(root)) {
    console.log(JSON.stringify(inactive(root), null, 2));
    return;
  }
  const request = options.request ? await readJson(path.resolve(options.request)) : {};
  const result = await operations[command](root, request);
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'mismatch') process.exitCode = 1;
  else if (['unresolved', 'unavailable'].includes(result.status)) process.exitCode = 2;
}
main().catch(error => { console.error(`Conceptor: ${error.message}`); process.exitCode = 2; });
