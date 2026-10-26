---
name: plan-change
description: Investigate and interactively plan a proposed change to a Conceptor project without changing its accepted meaning or implementation.
---

# Plan a change

Use this skill when the user wants to think through a change before implementation. Make a useful proposal through conversation. Do not switch the host into native Plan Mode; if native Plan Mode is already active, follow its rules.

## Investigate the starting point

Resolve the selected repository root. Conceptor is active when that root contains `.conceptor/`. A nested repository and each worktree have their own root. If the selected root is not active, use the native planning workflow.

Read applicable repository instructions and the relevant authored meaning in `.conceptor/meaning/`. Inspect related implementation and evidence when they can change the design. Read `.conceptor/APPLY_PLAN.md` if present. This helps fit the proposal to the current target in the checkout. Do not modify accepted meaning, the apply plan, or implementation while planning.

Use [the shared reasoning procedure](../../references/applying-conceptor.md) to trace the requested outcome, current responsibilities, consumers, state transitions, and assumptions. Match investigation depth to the decision. Use current code as evidence, not as proof that its design is right.

## Ask and design

Ask focused questions when an answer could change the outcome, architecture, algorithm, interfaces, failure behavior, sequencing, or acceptance evidence. Ask them interactively, like native planning, and explain the concrete choice when that helps. In an unattended session, return the exact unresolved decision to the caller instead of guessing.

Develop enough detail for the change at hand. A proposal can cover:

- user-visible result and constraints;
- architecture, ownership, and affected consumers;
- algorithms, data flow, and important state transitions;
- interfaces and compatibility;
- normal, failure, retry, cancellation, and recovery behavior;
- implementation units and dependency order;
- evidence needed to accept the result and known limits.

Compare a simple coherent design with the current design when the request changes accepted purpose or exposes a questionable premise. Identify material tradeoffs and unresolved choices. Do not invent requirements to fill gaps.

## Return a self-contained proposal

Summarize the accepted request as understood, relevant starting state, proposed design, ordered implementation units, acceptance evidence, and unresolved decisions. Include enough source references and reasons that the proposal can be used in another session without relying on this conversation.

Planning does not update accepted project meaning or `.conceptor/APPLY_PLAN.md`, start implementation, or create an issue. Use authorized checks or bounded probes when they can resolve a design uncertainty without changing accepted meaning or implementation. Planning alone grants no additional execution authority. The user may ask a separate issue-creation skill to publish the proposal. Creating an issue does not accept the proposal into the project model. When the user asks to implement, invoke `$conceptor:apply-change`; that skill accepts the authorized target and updates the apply plan before dependent edits.
