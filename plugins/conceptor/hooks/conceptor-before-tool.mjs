import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { activeRoot } from '../runtime/activation.mjs';
import { assessment } from '../runtime/reassessment.mjs';
import { physicalProjectPath } from '../runtime/state.mjs';

const guide = fileURLToPath(new URL('../references/applying-conceptor.md', import.meta.url));
const recovery = `Read ${JSON.stringify(guide)}#reassess-from-purpose. Begin or resume the assessment, save the comparison account, then complete it with request.comparison before implementation. For assessment-only shell work, put "# conceptor-assessment: <purpose>" on the first line. For assessment delegation, put "Conceptor assessment: <purpose>" on the first line of the message. Patches during assessment must target only .conceptor/work/ files.`;
const firstLine = text => typeof text === 'string' ? text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0].trim() : '';
const insideWork = (work, target) => {
  const relative = path.relative(work, target);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

async function taskPatch(root, cwd, input) {
  const patch = typeof input === 'string' ? input : input?.command ?? input?.patch ?? input?.input;
  if (typeof patch !== 'string') return false;
  const lines = patch.trim().split(/\r?\n/);
  if (lines[0] !== '*** Begin Patch' || lines.at(-1) !== '*** End Patch') return false;
  const targets = [];
  for (const line of lines.slice(1, -1)) {
    const header = /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/.exec(line);
    if (header) targets.push(header[1]);
    else if (line.startsWith('*** ') && line !== '*** End of File') return false;
  }
  if (!targets.length) return false;
  const physicalRoot = await fs.realpath(root);
  const work = path.join(physicalRoot, '.conceptor', 'work');
  for (const target of targets) {
    const relative = path.relative(root, path.resolve(cwd, target));
    const physical = await physicalProjectPath(root, relative);
    if (!insideWork(work, physical)) return false;
  }
  return true;
}

function output(values) {
  process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', ...values } })}\n`);
}

let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const request = JSON.parse(input);
  if (typeof request.cwd !== 'string' || !request.cwd.trim()) throw new Error('Hook input requires cwd.');
  const root = await activeRoot(request.cwd);
  if (root && ['Bash', 'apply_patch', 'Agent', 'spawn_agent'].includes(request.tool_name)) {
    // Hooks use only the host's parent session id, never process environment identity.
    const result = await assessment(root, { sessionId: request.session_id ?? null, readOnly: true });
    if (result.status !== 'working' || !result.tracked) {
      const tool = request.tool_name;
      const payload = request.tool_input;
      let permitted = tool === 'Bash' && /^# conceptor-assessment:\s*\S/.test(firstLine(payload?.command));
      if (tool === 'Agent' || tool === 'spawn_agent') permitted = /^Conceptor assessment:\s*\S/.test(firstLine(payload?.prompt ?? payload?.message));
      if (tool === 'apply_patch') permitted = await taskPatch(root, request.cwd, payload);
      if (permitted) output({ additionalContext: 'This route is assessment-only: reads, bounded probes, planning, and independent review. Source changes must wait for a completed comparison account. Native ownership and delegation budgets still apply.' });
      else output({ permissionDecision: 'deny', permissionDecisionReason: `Conceptor assessment ${result.tracked ? result.status : 'untracked'}: ${result.reason?.slice(0, 1200) ?? (result.status === 'assessing' ? 'Resume the active assessment.' : 'The working compaction interval is exhausted. Begin a new assessment.')} ${recovery}` });
    }
  }
} catch (error) {
  // A host hook failure can fail open. Return an explicit denial instead.
  output({ permissionDecision: 'deny', permissionDecisionReason: `Conceptor could not verify assessment state: ${String(error.message).slice(0, 1200)} ${recovery}` });
}
