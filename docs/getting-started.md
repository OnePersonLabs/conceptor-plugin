# Use Conceptor for a first change

Conceptor helps your agent preserve why a change matters and compare its result with that intent. It works inside your existing coding workflow. Start with one change whose result you can recognize.

## Prepare and install

You need Git, Node.js 24 or newer, npm, `tar`, and the Codex CLI. Clone the [repository](https://github.com/OnePersonLabs/conceptor-plugin) into a permanent directory, then follow the [installation commands](../README.md#install-the-plugin). Preparation creates the local bundle used by the marketplace. These instructions describe the source workflow; they are not a prebuilt remote installation.

After installation, start a fresh Codex session in the repository you want to change. Conceptor is active when `.conceptor/` exists at that repository root. A nested repository or worktree has a separate root. No separate activation command is needed.

For a project that has no Conceptor meaning yet, explicitly ask the agent to create its first meaning record under `.conceptor/meaning/`, capturing an agreed requirement and its reasons without changing the implementation. A tracked meaning file preserves the directory when the project is cloned; Git does not preserve empty directories.

## Plan or apply a change

Use `$conceptor:plan-change` when you want to investigate before implementation. The agent reads relevant meaning and code, asks questions when an answer could change the design, and returns a proposal. The proposal can cover architecture, algorithms, interfaces, failure behavior, implementation order, and acceptance evidence. Planning leaves accepted meaning and implementation unchanged.

Use `$conceptor:apply-change` when you want implementation. It accepts a direct request or a prior proposal; an issue, proposal, and separate approval step are not prerequisites. For example:

```text
Improve the export error message. Preserve the existing file if a write fails.
Check the failure path and explain what the evidence establishes. Keep the
change local; do not push it.
```

The skill should recover relevant meaning, inspect the export path, implement the authorized change, and compare the result with its actual consumer. Your host's permissions and Plan Mode remain in control. If a material choice is unresolved in an unattended run, the agent returns that choice to its caller.

## Project and task state

Conceptor stores accepted meaning in `.conceptor/meaning/`. The caller's selected workflow owns task identity, acceptance criteria, dependencies, progress, and recovery. After interruption, continue from that task context and inspect current meaning, source changes, staged changes, commits, and applicable evidence. Conceptor does not create a local task ledger or promise replay protection. Git history preserves committed execution history.

Optional discovery and checks have explicit coverage limits. A recorded claim is not proof that the implementation satisfies it. Missing evidence stays unknown. See [applying Conceptor](../plugins/conceptor/references/applying-conceptor.md) for the shared reasoning procedure and [the reference guide](../plugins/conceptor/references/guide.md) for helper contracts.

## If something does not work

- **Preparation failed:** read the first reported dependency, npm, or archive error. The build uses one fixed preparation directory. If it remains after an interruption, confirm that no preparation process owns it and remove that incomplete build before retrying. A failure during bundle replacement can leave no prepared bundle; rerun preparation after resolving the reported error.
- **A skill is missing:** confirm installation and start a fresh Codex session. Ordinary skill selection is supported, but a caller that requires a specific step should name `$conceptor:plan-change` or `$conceptor:apply-change` explicitly.
- **The project seems inactive:** confirm that `.conceptor/` exists at the selected repository root. Check the root when a nested repository or worktree is involved.
- **A check is unresolved:** inspect its stated scope, coverage, and missing evidence. Missing runtime or language-provider support is not a passing result. Continue only work whose premises remain supported.

The commands and runtime paths are checked deterministically. This guide does not claim that native skill selection or product benefit was measured in an AI trial.
