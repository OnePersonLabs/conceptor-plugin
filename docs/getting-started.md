# Use Conceptor for a first change

Conceptor helps your agent preserve why a change matters and compare its result with that intent. It works inside your existing coding workflow. Start with one change whose result you can recognize.

## Prepare and install

You need Git, Node.js 24 or newer, npm, `tar`, and the Codex CLI. Clone the [repository](https://github.com/OnePersonLabs/conceptor-plugin) into a permanent directory, then follow the [installation commands](../README.md#install-the-plugin). Preparation creates the local bundle used by the marketplace. These instructions describe the source workflow; they are not a prebuilt remote installation.

After installation, start a fresh Codex session in the repository you want to change. Conceptor is active when `.conceptor/` exists at that repository root. A nested repository or worktree has a separate root. No separate activation command is needed.

For a project that has no Conceptor meaning yet, explicitly ask the agent to create its first meaning record under `.conceptor/meaning/`, capturing an agreed requirement and its reasons without changing the implementation. A tracked meaning file preserves the directory when the project is cloned; Git does not preserve empty directories.

For the design path, that record also needs an accepted capability root and references to cooperating capabilities. Declare obligations and representative scenarios by pointing to their existing prose sections. The agent must recover these from available project sources within your authorization. Missing declarations return an explicit unresolved result rather than a smaller inferred scope. See [capability declarations](../plugins/conceptor/references/design-handoff.md#prepare-the-governing-scope) for the small YAML structure.

## Plan or apply a change

Use `$conceptor:plan-change` when you want to investigate before implementation. The agent compares relevant sources and corrections with existing meaning, checks the design against the affected capability and compatible scenarios, and returns a proposal. Small implementation steps must account for what they defer and how those capabilities still fit. Planning alone leaves meaning and implementation unchanged. If you explicitly ask to record an accepted clarification, the agent can reconcile its meaning owner without starting code; host Plan Mode and write restrictions still apply.

The skill runs `prepare-design` and `check-design`, then asks the native host for an independent source review. Give that reviewer the original request and returned source context. The host's model permissions and budget still apply. A `review-required` result means structural checks succeeded; a current `ready` result from `handoff` supplies the reviewed design and selected increment that implementation consumes. [The handoff guide](../plugins/conceptor/references/design-handoff.md) describes this sequence and its recovery path.

Use `$conceptor:apply-change` when you want implementation. It accepts a direct request or a prior proposal; an issue, proposal, and separate approval step are not prerequisites. For example:

```text
Improve the export error message. Preserve the existing file if a write fails.
Check the failure path and explain what the evidence establishes. Keep the
change local; do not push it.
```

The skill recovers relevant meaning and validates the design handoff before dependent edits. For a direct request, it prepares and reviews the design inline without another approval ceremony. It then inspects the export path, implements the authorized increment, and compares the result with its actual consumer. Your host's permissions and Plan Mode remain in control. If a material choice or required independent review is unavailable, the agent reports that dependency and continues only independent safe work.

## Project and task state

Conceptor stores accepted meaning in `.conceptor/meaning/`. The caller's selected workflow owns task identity, acceptance criteria, dependencies, progress, and recovery. After interruption, continue from that task context and inspect current meaning, source changes, staged changes, commits, and applicable evidence. Conceptor does not create a local task ledger or promise replay protection. Git history preserves committed execution history.

Keep the compact reviewed input with that existing task record while implementation needs it, or retain an exact retrievable native result. On resumption, rerun `handoff` against the actual checkout. It reloads source context and rejects stale request, meaning, proposal, increment, or review bindings. Do not retain duplicate source snapshots. If the original review cannot be recovered, report the missing evidence instead of treating a chat title as clearance.

Optional discovery and checks have explicit coverage limits. A recorded claim is not proof that the implementation satisfies it. Missing evidence stays unknown. See [applying Conceptor](../plugins/conceptor/references/applying-conceptor.md) for the shared reasoning procedure and [the reference guide](../plugins/conceptor/references/guide.md) for helper contracts.

## If something does not work

- **Preparation failed:** read the first reported dependency, npm, or archive error. The build uses one fixed preparation directory. If it remains after an interruption, confirm that no preparation process owns it and remove that incomplete build before retrying. A failure during bundle replacement can leave no prepared bundle; rerun preparation after resolving the reported error.
- **A skill is missing:** confirm installation and start a fresh Codex session. Ordinary skill selection is supported, but a caller that requires a specific step should name `$conceptor:plan-change` or `$conceptor:apply-change` explicitly.
- **The project seems inactive:** confirm that `.conceptor/` exists at the selected repository root. Check the root when a nested repository or worktree is involved.
- **A check is unresolved:** inspect its stated scope, coverage, and missing evidence. Missing runtime or language-provider support is not a passing result. Continue only work whose premises remain supported.
- **A proposal lost part of the intent:** use `$conceptor:recover-meaning` with the existing source or correction pointer. The agent should distinguish missing meaning from a failure to use meaning already present, repair authorized omissions at their owner, and compare the proposal with the broader capability. A successful scoped check cannot resolve that design question.
- **Design preparation is unresolved:** inspect the reported root, include, section, or source issue. Repair the declaration at its meaning owner from existing sources within your authority, then prepare again. Do not substitute narrower discovery results.
- **A handoff is stale or lacks review:** recover the exact checked input and independent result. Reprepare and review changed authority or design under the existing model budget. Updating plugin source does not update the installed bundle or guidance already loaded in a session.

The commands and runtime paths are checked deterministically. This guide does not claim that native skill selection or product benefit was measured in an AI trial.
