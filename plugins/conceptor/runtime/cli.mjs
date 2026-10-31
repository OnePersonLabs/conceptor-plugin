#!/usr/bin/env node
import path from 'node:path';
import { focus, revisit, reconcile, prepareDesign, checkDesign, handoff } from './conceptor.mjs';
import { observe } from './providers/index.mjs';
import { readJson } from './state.mjs';
import { projectRoot, activeRoot, inactive } from './activation.mjs';

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help' || command === 'help') {
    console.log('Conceptor\nCommands: focus, revisit, reconcile, observe, prepare-design, check-design, handoff\nUsage: conceptor COMMAND [--root PATH] [--request -|REQUEST.json]\nUse --request - for JSON on stdin. A root .conceptor directory makes a project active.');
    return;
  }
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!['--root', '--request'].includes(args[index]) || !args[index + 1]) throw new Error(`Unknown or incomplete option: ${args[index]}`);
    options[args[index].slice(2)] = args[index + 1];
  }
  const root = await projectRoot(options.root ? path.resolve(options.root) : process.cwd());
  const operations = { focus, revisit, reconcile, observe, 'prepare-design': prepareDesign, 'check-design': checkDesign, handoff };
  if (!operations[command]) throw new Error(`Unknown command: ${command}`);
  if (!['prepare-design', 'check-design', 'handoff'].includes(command) && !await activeRoot(root)) {
    console.log(JSON.stringify(inactive(root), null, 2));
    return;
  }
  let request = {};
  if (options.request === '-') {
    let input = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) input += chunk;
    request = JSON.parse(input);
  } else if (options.request) request = await readJson(path.resolve(options.request));
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('Request must be a JSON object');
  const result = await operations[command](root, request);
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'mismatch') process.exitCode = 1;
  else if (['unresolved', 'unavailable', 'recovery-required', 'blocked'].includes(result.status)) process.exitCode = 2;
}
main().catch(error => { console.error(`Conceptor: ${error.message}`); process.exitCode = 2; });
