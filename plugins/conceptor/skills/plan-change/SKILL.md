---
name: plan-change
description: Investigate and interactively plan a proposed change without changing accepted project meaning or implementation.
---

# Plan a change

Use this skill when the user wants to understand or plan a change before implementation. If native Plan Mode is already active, follow it; do not switch the host into Plan Mode.

## Investigate

Resolve the selected repository root. Conceptor is active when that root contains `.conceptor/`. If it is not active, use the native planning workflow.

Read the user's requested outcome, applicable repository instructions, relevant authored meaning in `.conceptor/meaning/`, and affected implementation and evidence. The caller may provide existing task context and acceptance criteria. No Conceptor task-state file exists or is required. Do not modify accepted meaning or implementation while planning.

Use [the shared reasoning procedure](../../references/applying-conceptor.md) to trace responsibilities, consumers, state transitions, and assumptions. Use current code as evidence, not proof that its design is right.

## Ask and design

Ask focused questions when an answer could change the outcome, architecture, algorithm, interface, failure behavior, or acceptance evidence. In an unattended session, return the exact unresolved decision instead of guessing.

Develop enough detail for the change at hand: user-visible outcome, ownership, data flow, failure and recovery behavior, implementation sequence, verification, and limits. Keep proposals distinct from accepted meaning. Compare a coherent approach with the current design when a questionable premise or changed purpose makes that useful. Do not invent requirements to fill gaps.

## Return the proposal

Summarize the request as understood, relevant starting state, proposed design, useful implementation steps, acceptance evidence, and unresolved decisions. Include source references so the caller can continue without relying on this conversation.

Planning does not update accepted meaning, implementation, or task status. The caller decides where actionable work is tracked and owns its progress. An issue or proposal does not itself accept a change into the project model. Use authorized checks or bounded probes only when they resolve a design uncertainty without changing accepted meaning or implementation.
