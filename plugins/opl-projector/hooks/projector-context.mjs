import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { activeRoot } from '../runtime/activation.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
if (typeof request.cwd !== 'string' || request.cwd.length === 0) {
  throw new TypeError('Projector hook input requires a nonempty cwd string.');
}
const event = request.hook_event_name ?? request.event;
if (event !== 'SessionStart' && event !== 'UserPromptSubmit') {
  throw new TypeError('Projector hook input requires SessionStart or UserPromptSubmit.');
}
const root = await activeRoot(request.cwd);
if (root) {
  // Full guidance belongs at session start/resume/compaction. Prompt hooks still
  // check activation, including a plugin enabled after the session began.
  const guidance = event === 'SessionStart'
    ? await fs.readFile(new URL('../AGENTS.md', import.meta.url), 'utf8')
    : `Use the Projector consumer guidance already loaded in this session. If it is not loaded, read ${JSON.stringify(fileURLToPath(new URL('../AGENTS.md', import.meta.url)))} before Projector work. Recheck this project's .projector/active marker before using Projector; ordinary native work does not require its helpers.`;
  let cadence = '';
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
    cadence = `Projector reassessment: ${reported} Read references/applying-projector.md#reassess-from-purpose. ${unsaved} Context delivery does not establish semantic compliance.`;
  }
  const additionalContext = [
    `Projector is active for project root: ${JSON.stringify(root)}.`,
    guidance,
    cadence,
  ].join('\n\n');
  process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext } })}\n`);
}
