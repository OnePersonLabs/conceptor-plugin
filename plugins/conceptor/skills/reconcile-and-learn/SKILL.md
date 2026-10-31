---
name: reconcile-and-learn
description: Reconcile consequential Conceptor decisions from discussion, planning, or work, and changed evidence, mismatches, stale receipts, new consumers, or reusable lessons.
---

# Reconcile and learn

Resolve the selected repository root. Conceptor is active when that root contains `.conceptor/`. A nested repository or worktree has its own root. If the selected root has no `.conceptor/`, continue through the native host without Conceptor.

Use this skill when a decision or source-coverage gap needs reconciliation with project meaning. Read the governing source and affected Concepts and typed Relations. Update the owning record when the user authorizes that meaning change, including an explicit request to preserve a clarification during discussion. Meaning reconciliation does not require implementation to begin and does not authorize it. Include relevant priorities, prerequisites, sequencing, constraints, and exceptions.

Keep proposals, observations, and accepted decisions distinct. A planning discussion or proposal does not change accepted meaning. Mark a candidate record or observed Relation accepted only after an explicit decision and authorization to update the model. If no existing record owns the decision, the root may create an appropriate Concept or typed Relation. Do not add a parallel decision ledger. A delegated worker routes the exact decision delta to its assigned meaning owner.

During discussion or planning, distinguish authorization to record a decision from a proposal to consider one. With authorized reconciliation, repair partial or missing meaning in its existing owner and preserve reasons and source references. Record only the accepted clarification as accepted; an agent's recommended interface or mechanism stays candidate even when it fits that clarification. An example does not establish a universal limit. Without write authority, return the exact unsaved delta and destination in the current conversation or caller's selected task record. Do not leave an authorized correction stranded solely because implementation has not started. Do not save raw evidence without a named consumer or start implementation or testing solely because this skill ran.

If host mode or write permissions block a required update, including Plan Mode, hand off the exact unsaved decision delta and its intended record destination. Do not claim it was saved.

When accepted capability scope changes, update its metadata and exact section/source references in the same owner. Preserve stable obligation/scenario IDs when the obligation remains the same. Governing changes invalidate [design handoffs](../../references/design-handoff.md) bound to earlier meaning. Reprepare and review affected designs before dependent implementation; do not rewrite the old review to appear current. A passing implementation check does not accept candidate meaning.

## Reconcile changed implementation or evidence

Use the comparison and repair steps in this section only when implementation or evidence changed, or an actual mismatch needs investigation.

Select the affected Concepts and Lenses. Read governing prose, conditions, exceptions, selectors, and check definitions. Compare actual effects with the source-grounded capability account, including deferred capabilities and scenarios outside this increment. Follow [Applying Conceptor](../../references/applying-conceptor.md#compare-results-and-reassess-the-premise) to identify missing consumers or a faulty premise. A passing subset cannot establish that the proposal preserved the complete intended outcome. Maintain affected Lens membership and evidence declarations through their assigned owner.

Use `reconcile` when reusing or checking these bindings answers a current question. Set `runChecks: true` only when native checks are needed. Batch related checks at a useful integration point; a new edit or commit alone does not invalidate every result. See [the reference guide](../../references/guide.md) for helper requests and receipt limits.

For each verdict, report the condition, participants, selection status, evidence, status, and reason in the returned result. Keep failed or unavailable observations alongside supported evidence in that result so the caller can distinguish a mismatch from a missing observation. Empty required selection is unresolved unless the condition explicitly allows absence. A Lens with no checks supplies navigation, not behavioral support. Account separately for relevant prose obligations and native evidence outside helper receipts. Persist a receipt only when a named active consumer needs it to support an exact claim or recover an interrupted operation. Bind it to that claim, source/version, target, and validity conditions; remove it when the consumer is satisfied, superseded, invalidated, or abandoned, and no later than the agreed recovery window. Reading or copying a receipt does not extend its lifetime. Conceptor does not create an evidence archive.

If there is a mismatch, return the original finding to the caller when it affects remaining work. Determine whether the defect is in the realization, selection/binding, observation/check, or accepted meaning. Repair the responsible layer. Do not narrow a selector to hide a failure or change a condition merely to obtain a pass. Refresh affected Unit bindings and evidence applicability; preserve independently valid work.

## Retain lessons and finish

When a discovery changes where future work should look, update the existing Lens, Relation, or Concept that owns it. Preserve observed versus accepted status. When a reusable approach can guide future work, record a Pattern Candidate with examples, counterexamples, alternatives, and reopening assumptions. Do not promote it automatically. An explicit meaning decision can accept it and create or revise a scoped Lens. Preserve applicability and counterexamples. Repairs produced by that Lens are not independent evidence for it.

When repeated symptoms expose a faulty premise, use [Reassess from purpose](../../references/applying-conceptor.md#reassess-from-purpose). Compare the intended outcome with the responsible design. Return the original finding and relevant evidence to the caller while it can change the next decision. Preserve accepted conclusions in their existing meaning owner, not a raw-evidence archive. Keep original evidence only while a named consumer needs it to resolve a live discrepancy; bind it to the affected source/version and delete it when that consumer is done or the finding is superseded. The caller recovers active work from its task record and the actual checkout. Conceptor adds no task ledger, repair journal, commit policy, assessment schedule, or automatic gate.
