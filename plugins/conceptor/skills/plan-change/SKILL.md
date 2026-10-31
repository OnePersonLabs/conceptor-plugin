---
name: plan-change
description: Investigate and plan a change against governing sources and the whole affected capability, without authorizing implementation.
---

# Plan a change

Use this skill when the user wants to understand or plan a change before implementation. If native Plan Mode is already active, follow it; do not switch the host into Plan Mode.

## Investigate

Resolve the selected repository root. Conceptor is active when that root contains `.conceptor/`. If it is not active, use the native planning workflow.

Read the user's requested outcome, applicable repository instructions, relevant authored meaning in `.conceptor/meaning/`, and affected implementation and evidence. The caller may provide existing task context and acceptance criteria. No Conceptor task-state file exists or is required. Planning alone authorizes neither meaning edits nor implementation. An explicit request to record an accepted clarification can authorize meaning reconciliation separately; honor host Plan Mode and write restrictions.

Use [source coverage](../../references/applying-conceptor.md#check-source-coverage) to compare the relevant original statements, available extracts and current corrections with their meaning owners. Recover material gaps before relying on a shorter summary. Use current code as evidence, not proof that its design is right.

## Ask and design

Resolve discoverable facts and engineering choices first. Ask focused questions only for a consequential human dependency. Show the situation, options and consequences without asking the user to validate an example whose fit with the larger capability is still unknown. In an unattended session, return the exact unresolved decision instead of guessing.

Develop enough detail for the whole affected capability: user-visible outcome, ownership, data flow, failure and recovery behavior, compatible scenarios, implementation sequence, verification, and limits. [Compare the capability before choosing an increment](../../references/applying-conceptor.md#compare-the-capability-before-choosing-an-increment). Trace substantive omissions and deferrals to contracts, dependencies and consumers; do not let a manageable step narrow the accepted outcome. Keep proposals, examples and unresolved mechanisms distinct from accepted meaning. Do not invent requirements to fill gaps.

## Return the proposal

Return the source-grounded design comparison, useful implementation steps, acceptance evidence, and unresolved decisions. Identify missing meaning and its owning record separately from missing implementation. Include source references so the caller can continue without relying on this conversation.

The caller decides where actionable work is tracked and owns its progress. An issue or proposal does not itself accept a change into the project model. Use [reconcile-and-learn](../reconcile-and-learn/SKILL.md) for separately authorized meaning updates, preserving candidate status and unsaved deltas when writes are restricted. Use authorized checks or bounded probes only when they resolve a design uncertainty. Do not start implementation merely because planning or meaning reconciliation is complete.
