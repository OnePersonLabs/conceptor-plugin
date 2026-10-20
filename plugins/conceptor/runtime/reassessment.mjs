import path from 'node:path';
import { readComparison, comparisonProblem } from './comparison.mjs';
import { activeRoot, inactive } from './activation.mjs';
import { hash, optionalJson, projectPath, writeJson } from './state.mjs';

const initialState = () => ({ phase: 'working', candidate: null, assessment: null, interval: 1, workingCompactions: 0, carriedCosts: 0, lastCompletedId: null });

function nonnegative(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} must be a nonnegative safe integer.`);
  return value;
}

/** The root is the sole writer for its session. Semantic decisions stay in its checkpoint. */
export async function assessment(root, request = {}) {
  const activated = await activeRoot(root);
  if (!activated) return inactive(root);
  root = activated;
  const sessionId = request.sessionId === null ? undefined : request.sessionId ?? process.env.CODEX_THREAD_ID;
  if (sessionId !== undefined && (typeof sessionId !== 'string' || !sessionId.trim())) throw new TypeError('sessionId must be a nonempty string.');
  const action = request.action ?? 'status';
  if (!['status', 'begin', 'complete', 'abandon'].includes(action)) throw new TypeError(`Unknown assessment action: ${action}`);
  const readOnly = request.readOnly === true || request.permissionMode === 'plan';
  const file = sessionId ? await projectPath(root, `.conceptor/cache/reassessment/${hash(sessionId)}.json`) : null;
  const stored = file ? await optionalJson(file) : null;
  const baseline = stored === null ? null : hash(stored);
  if (request.handoff !== undefined) {
    const handoff = request.handoff;
    if (!handoff || handoff.root !== root || handoff.sessionId !== (sessionId ?? null)) throw new Error('Assessment handoff belongs to a different root or session.');
    if (handoff.baseline !== baseline) throw new Error('Assessment handoff is stale: the persisted session cache changed. Recover current state before continuing.');
    const pending = handoff.state;
    if (!pending || !['working', 'assessing'].includes(pending.phase)
      || (pending.phase === 'assessing') !== Boolean(pending.assessment)) throw new TypeError('Assessment handoff has an invalid phase or assessment.');
    for (const name of ['interval', 'workingCompactions', 'carriedCosts']) nonnegative(pending[name], `handoff.state.${name}`);
    if (pending.interval < 1) throw new TypeError('Assessment handoff interval must be positive.');
    if (pending.assessment) {
      if (typeof pending.assessment.id !== 'string' || !pending.assessment.id.trim()) throw new TypeError('Assessment handoff requires an assessment id.');
      nonnegative(pending.assessment.rootAssessmentCompactions, 'handoff.state.assessment.rootAssessmentCompactions');
    }
  }
  // Clone caller-owned handoffs so repeated reads do not mutate their recovery input.
  const state = structuredClone(request.handoff?.state ?? stored ?? initialState());
  if (action !== 'status') {
    if (!sessionId) throw new TypeError('Assessment mutations require sessionId or CODEX_THREAD_ID.');
    if (typeof request.id !== 'string' || !request.id.trim()) throw new TypeError('Assessment mutations require a nonempty id.');
    if (request.checkpoint !== undefined && (typeof request.checkpoint !== 'string' || !request.checkpoint.trim())) throw new TypeError('checkpoint must be a nonempty string.');
  }
  if (action === 'begin') {
    if (state.assessment) {
      if (state.assessment.id !== request.id) throw new Error('Another assessment is active. Resume or abandon it before beginning another.');
    } else if (state.lastCompletedId !== request.id) {
      state.phase = 'assessing';
      state.assessment = { id: request.id, checkpoint: request.checkpoint ?? null, rootAssessmentCompactions: 0 };
    }
  } else if (action === 'complete' || action === 'abandon') {
    // A repeated receipt cannot close a newer assessment or change its cadence.
    if (state.assessment?.id !== request.id) {
      if (!(action === 'complete' && !state.assessment && state.lastCompletedId === request.id)) throw new Error('Assessment id does not match the active assessment.');
      // Duplicate receipts cannot bind replacement bytes or reset the cadence.
      if (request.comparison !== undefined) {
        const repeated = await readComparison(root, request.comparison);
        if (JSON.stringify(repeated) !== JSON.stringify(state.candidate?.comparison)) throw new Error('Duplicate completion cannot rebind the comparison account. Begin a new assessment.');
      }
    } else {
      const comparison = action === 'complete' ? await readComparison(root, request.comparison) : null;
      const extraWindows = nonnegative(request.extraWindows ?? 0, 'extraWindows');
      const checkpoint = request.checkpoint ?? state.assessment.checkpoint;
      const cost = state.carriedCosts + state.assessment.rootAssessmentCompactions + extraWindows;
      if (!Number.isSafeInteger(9 * cost)) throw new RangeError('Assessment cost exceeds the supported cadence range.');
      state.phase = 'working';
      state.assessment = null;
      state.workingCompactions = 0;
      if (action === 'complete') {
        state.interval = Math.max(1, Math.ceil(9 * cost));
        state.candidate = { id: request.id, checkpoint, comparison };
        state.lastCompletedId = request.id;
        state.carriedCosts = 0;
      } else {
        state.candidate = null;
        state.carriedCosts = cost;
      }
    }
  }
  // Only the existing compact hook advances the approximation of context use.
  if (request.compact === true) {
    if (state.phase === 'assessing') state.assessment.rootAssessmentCompactions += 1;
    else state.workingCompactions += 1;
  }
  // Passive startup/resume must not create a baseline that invalidates a
  // read-only handoff. Only an explicit transition or handoff save creates it.
  const transition = action !== 'status' || request.compact === true || request.handoff !== undefined;
  const saved = Boolean(file) && !readOnly && (stored !== null || transition);
  if (saved && JSON.stringify(stored) !== JSON.stringify(state)) await writeJson(file, state);
  const reason = state.candidate ? await comparisonProblem(root, state.candidate) : 'No completed comparison account. Begin an assessment and complete it with a saved comparison JSON path.';
  const status = state.phase === 'assessing' ? 'assessing'
    : reason || state.workingCompactions >= state.interval ? 'due' : 'working';
  return {
    status, saved, tracked: Boolean(file), state,
    ...(reason ? { reason } : {}),
    ...(file ? { cache: path.relative(root, file).replaceAll('\\', '/') } : {}),
    heuristic: 'Compaction cadence approximates context cost; it is not a token or time bound.',
    ...(!saved ? {
      handoff: { root, sessionId: sessionId ?? null, baseline, state },
      instruction: 'State is unsaved. Retain this handoff and pass it as request.handoff for the next transition. An authorized status request can save it.',
    } : {}),
  };
}
