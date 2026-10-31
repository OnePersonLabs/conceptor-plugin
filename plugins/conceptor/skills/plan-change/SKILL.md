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

## Prepare scope and design

Execute `prepare-design` through the plugin's JSON CLI with the selected root and the caller's current request identity/revision. Follow [the handoff protocol](../../references/design-handoff.md) for exact inputs. Read its whole project capability map and original source context before task-specific selection. Missing roots or broken references are unresolved; do not substitute a narrower `focus` result. Reconcile missing metadata from existing sources only within the caller's authority.

Resolve discoverable facts and engineering choices first. Ask focused questions only for a consequential human dependency. Show the situation, options and consequences without asking the user to validate an example whose fit with the larger capability is still unknown. In an unattended session, return the exact unresolved decision instead of guessing.

Develop enough detail for the whole affected capability: user-visible outcome, ownership, data flow, failure and recovery behavior, compatible scenarios, implementation sequence, verification, and limits. [Compare the capability before choosing an increment](../../references/applying-conceptor.md#compare-the-capability-before-choosing-an-increment). Trace substantive omissions and deferrals to contracts, dependencies and consumers; do not let a manageable step narrow the accepted outcome. Keep proposals, examples and unresolved mechanisms distinct from accepted meaning. Do not invent requirements to fill gaps.

## Validate and review

Construct the proposal's contracts, consumers, coverage dispositions and selected increment using the handoff schema. Execute `check-design`; repair structural errors before review. A `review-required` result is reviewer input, not design clearance.

Use the native host's agent facility to obtain an independent review in a separate context. Give the reviewer the original governing request, `reviewInput`, exact bindings and review template, and retrievable source locations. Ask it to inspect missing source coverage, candidate promotion, unsupported deferrals and representative scenarios. Require the normalized review result with its actual identity and all required references. Do not replace independent review with the planner's judgment. If agent execution is unavailable or not authorized, report that specific dependency and keep the handoff unresolved.

Resolve findings with the same reviewer within the caller's repair and model budget. A changed proposal needs a newly bound result. Execute `handoff` with the reviewed input to establish applicability. Only a ready result establishes that this exact design and increment can proceed under the user's separate implementation authority.

## Return the reviewed proposal

Return the source-grounded design, selected increment, review result, validation status and unresolved decisions. Retain the compact input and normalized review with the caller's existing task record or an exact retrievable native result, as described in the handoff protocol. Include request/scope/design/increment bindings, planner and reviewer identities, verdict and findings. Keep authored design in its existing specification or meaning owner. Do not add a Conceptor receipt registry or task ledger.

The caller decides where actionable work is tracked and owns its progress. An issue or proposal does not itself accept a change into the project model. Use [reconcile-and-learn](../reconcile-and-learn/SKILL.md) for separately authorized meaning updates, preserving candidate status and unsaved deltas when writes are restricted. Use authorized checks or bounded probes only when they resolve a design uncertainty. Do not start implementation merely because planning or meaning reconciliation is complete.
