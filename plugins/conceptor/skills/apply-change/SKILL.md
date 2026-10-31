---
name: apply-change
description: Apply an authorized direct change or proposal in a project whose root contains .conceptor/.
---

# Apply a change

Use this skill when the user asks to change a Conceptor project. A prior proposal, issue, or separate planning step is optional.

## Recover the request and meaning

Resolve the selected repository root. Conceptor is active when that root contains `.conceptor/`. Nested repositories and worktrees have separate roots. If the selected root is not active, follow the caller's ordinary workflow without creating Conceptor files.

Read the caller's current request and acceptance criteria, applicable repository instructions, `.conceptor/meaning/`, and the affected source. On resumption, inspect current files, staged and unstaged changes, relevant commits, and applicable evidence. The caller owns task identity, revision, progress, cancellation, and resumption state. Do not create or expect a repository task ledger. A direct request needs no local identity. If its scope or prior acceptance is unclear and that changes the action, ask the caller or user.

Keep accepted meaning separate from proposals, observations, and implementation state. A later accepted decision supersedes earlier conflicting intent. Do not let an old request silently restore superseded meaning. When a request establishes or changes accepted meaning, preserve its governing source and reasons in that meaning owner's record.

## Decide and implement

Before choosing an implementation unit, use [source coverage](../../references/applying-conceptor.md#check-source-coverage) and [the capability comparison](../../references/applying-conceptor.md#compare-the-capability-before-choosing-an-increment). Reuse a supplied comparison while its sources, decisions and boundaries still apply. Account for substantive omissions, compatible scenarios, dependencies and consumers beyond this increment. A direct request can start this reasoning without a separate planning ceremony. Resolve engineering choices from evidence; if a consequential human dependency remains, return that exact decision and pause only dependent work.

Planning discussion alone does not authorize implementation or meaning edits. An explicit meaning correction can authorize reconciliation without authorizing code. Respect host permissions and native Plan Mode. Begin implementation edits only when implementation is authorized. Preserve useful completed work and unrelated changes. The caller owns task tracking and branch, commit, issue, and publication policy.

Use focus, revisit, observation, and reconciliation helpers only when they answer a current question. Revalidate supplied prior observations and receipts against current project and meaning bindings. Conceptor does not retain an evidence cache. Missing history or a missing baseline stays unknown; it does not support a claim or authorize a check.

When evidence invalidates an assumption, the accepted target changes, or repeated failures challenge the design, reassess at the responsible layer. Keep completed execution history in Git and durable product reasons in their meaning owners. After interruption, recover from the caller's task context plus actual files, Git history, and applicable evidence. Do not claim replay protection or exact request resumption from Conceptor state.

Compare the integrated behavior with the source-grounded capability account, including relevant prose beyond helper conditions. Report what this increment establishes, what it leaves deferred or unresolved, and the evidence for each. Do not report completion of the larger capability from a passing subset.
