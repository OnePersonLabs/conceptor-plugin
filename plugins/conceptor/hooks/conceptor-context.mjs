import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { activeRoot } from '../runtime/activation.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
if (typeof request.cwd !== 'string' || request.cwd.length === 0) {
  throw new TypeError('Conceptor hook input requires a nonempty cwd string.');
}
const event = request.hook_event_name ?? request.event;
if (event !== 'SessionStart' && event !== 'UserPromptSubmit') {
  throw new TypeError('Conceptor hook input requires SessionStart or UserPromptSubmit.');
}
const root = await activeRoot(request.cwd);
if (root) {
  // Full guidance belongs at session start/resume/compaction. Prompt hooks still
  // check activation, including a plugin enabled after the session began.
  const guidance = event === 'SessionStart'
    ? await fs.readFile(new URL('../AGENTS.md', import.meta.url), 'utf8')
    : `Use the Conceptor consumer guidance already loaded in this session. If it is not loaded, read ${JSON.stringify(fileURLToPath(new URL('../AGENTS.md', import.meta.url)))} before Conceptor work. Recheck this project's .conceptor/active marker before using Conceptor; ordinary native work does not require its helpers.`;
  let cadence = '';
  const guide = fileURLToPath(new URL('../references/applying-conceptor.md', import.meta.url));
  if (event === 'SessionStart') {
    const { assessment } = await import('../runtime/reassessment.mjs');
    const result = await assessment(root, {
      sessionId: request.session_id ?? null,
      permissionMode: request.permission_mode,
      readOnly: request.readOnly,
      compact: request.source === 'compact',
    });
    const state = result.state;
    const instruction = result.status === 'assessing'
      ? `Resume assessment ${JSON.stringify(state.assessment.id)} at checkpoint ${JSON.stringify(state.assessment.checkpoint)}; do not start a recursive assessment. Assessment compactions: ${state.assessment.rootAssessmentCompactions}.`
      : result.status === 'due'
        ? 'A full assessment from purpose is due before the next consequential action; routine work alone does not trigger it. Make the governing outcome, candidate, comparison and decision visible, then complete the assessment before dependent implementation.'
        : `Continue the current candidate; working compactions ${state.workingCompactions}/${state.interval}.`;
    const unsaved = !result.saved
      ? `${result.instruction} Cache-based handoff: ${JSON.stringify(result.handoff)}. ${request.source === 'compact' ? 'Unsaved compact delta: 1. If you already hold a handoff, apply compact:true exactly once to that handoff instead of replacing it with this cache-based handoff.' : 'If you already hold a handoff, continue that handoff instead of replacing it with this cache-based handoff.'}`
      : '';
    const reported = result.saved ? instruction
      : `Cache-based status is provisional; an existing unsaved handoff takes precedence. Continue that handoff first, including any compact delta below, then decide due or resume status. Cache reports: ${instruction}`;
    cadence = `Conceptor reassessment: ${reported} ${result.reason ?? ''} Read ${JSON.stringify(guide)}#reassess-from-purpose. Ordinary shell, patch, and delegation calls are blocked while assessment is due or active. Use first-line '# conceptor-assessment: <purpose>' for assessment-only shell reads/probes/planning, or 'Conceptor assessment: <purpose>' for read-only assessment delegation. Assessment patches must target only .conceptor/work/. Save the comparison account and complete with request.comparison before implementation. ${unsaved} Context delivery does not establish semantic compliance.`;
  }
  const additionalContext = [
    `Conceptor is active for project root: ${JSON.stringify(root)}.`,
    guidance,
    cadence,
  ].join('\n\n');
  process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext } })}\n`);
}
