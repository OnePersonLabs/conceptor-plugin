---
name: apply-change
description: Apply a direct change request or an existing plan in a project whose root contains .conceptor/.
---

# Apply a change

Use this skill when the user asks to change a Conceptor project. The request can be direct or can refer to a proposal from `$conceptor:plan-change`. Neither an issue nor a separate plan or approval step is required.

## Find the project and recover work

Resolve the selected repository root. Conceptor is active when that root contains `.conceptor/`. A nested repository and each worktree have their own root and target. If the root has no `.conceptor/`, follow the caller's ordinary workflow without creating Conceptor files implicitly. Do not check activation through the CLI.

Read applicable repository instructions, `.conceptor/meaning/`, and `.conceptor/APPLY_PLAN.md` when it exists. Before acting on a resumed request, inspect the actual meaning files, source changes, staged changes, relevant commits, and current evidence. A plan describes remaining intent; it does not prove that a listed task is unfinished or that a removed task was committed. Reconcile the plan against actual state. Do not replay mutations from a checklist.

If the plan is absent, use current meaning and reachable Git history to understand earlier accepted changes. Do not claim exact replay protection after its record has been removed. If identity, authorship, or prior acceptance is unclear and affects the result, ask the caller or user for that missing decision.

## Accept and plan the target

Recover governing Concepts, Relations, Lenses, and relevant source. Keep accepted meaning separate from proposals, observations, and implementation state.

Accept the request into one evolving target in this checkout. The caller may supply an opaque source identity and revision. Do not interpret tracker identifiers. The same identity, revision, and content resumes existing work. A changed revision requires reassessment. Report conflicting content under the same unchanged identity and revision. Give a direct request a local identity. Use the active plan for re-entry. If a repeated prompt cannot be matched confidently, clarify instead of silently applying meaning twice.

Record the accepted intent in `.conceptor/APPLY_PLAN.md` before editing dependent meaning or implementation. Use the `apply-plan` interface to enforce size and revision checks. Do not edit the live plan directly. The CLI cannot infer native permissions. Follow the host's permissions and pass `readOnly: true` or `permissionMode: "plan"` when those modes apply. Keep the plan under 64 KiB. It records request identities and concise intent summaries, the affected target and starting state, and remaining implementation units in dependency order. It also records essential reasons, unresolved decisions, and recovery information. Keep only remaining tasks. Do not add transcripts, raw logs, checked-off history, or duplicate meaning. Follow the [apply-plan API and recovery contract](../../references/guide.md#apply-plan-api).

Combine new accepted requests with the current target and replan their remaining work in dependency order. Preserve useful completed work and unrelated edits. A later accepted decision supersedes earlier intent where they conflict; repeating an older request must not silently reverse that decision. For cancellation, remove the canceled intent, then retain work still needed by other accepted requests.

Each worktree owns its target and apply plan. The outer runner owns checkout assignment and integration across branches. Report conflicting meaning changes to that caller; do not silently choose a winner or write another checkout's plan.

If a materially important design choice is unresolved, ask the user. In an unattended run, return the exact decision to the caller and pause only dependent work. Respect native permissions and host Plan Mode. Do not switch the host into native Plan Mode. Planning discussion alone does not change accepted meaning, the apply plan, or implementation. Begin model and plan edits only when implementation is authorized.

## Implement and reassess

Use [the shared reasoning procedure](../../references/applying-conceptor.md) to trace changed meaning through its consumers, assess architectural or algorithmic assumptions when needed, and choose proportionate evidence. Reassess when accepted intent changes, evidence invalidates an assumption, or repeated failures challenge the approach. Do not create assessment reports, comparison files, counters, hooks, or tool gates.

Follow Git and delivery instructions from the caller. The caller or native workflow owns branches, commits, issues, pushes, pull requests, and publication. Create commits only when the caller or project instructions require them. When they require implementation commits, complete one coherent unit per commit. Retain a unit in `APPLY_PLAN.md` until its completion commit. Remove it in that same commit. If a unit spans commits, leave it listed until its completion commit.

Update accepted meaning in its owning records when an authorized decision changes it. Keep applicable Lens selectors, bindings, and checks aligned with actual consumers. Use focus, revisit, observations, and reconciliation only when they answer a current question. Checks run only when authorized and useful. Missing history or a missing baseline stays unknown; do not treat it as support or permission to run checks. Revalidate explicitly supplied prior observations and receipts against current project and meaning bindings before reuse. Conceptor does not retain an evidence cache by default.

When a request establishes or revises accepted meaning, retain its governing source identity, revision, current reasons, and relevant supersession decisions in that meaning record. Before deleting the apply plan, move any still-governing design decision to its owning meaning record. Keep completed execution history in Git. This preserves the current rationale without turning meaning into a request log.

After compaction or interruption, recover from the plan plus actual files, Git state, and applicable evidence. If a pending plan replacement exists, do not overwrite it blindly. Establish its owner and reconcile it with the current plan and checkout before continuing. The pending file is bounded recovery state, not another plan.

When all accepted work is complete and acceptance is verified, delete `.conceptor/APPLY_PLAN.md` in the final completion commit. Report the integrated behavior, evidence, remaining uncertainty, and any unresolved caller decisions. Do not create `work/`, `archive/`, `cache/`, verification-output, or assessment-report directories.
