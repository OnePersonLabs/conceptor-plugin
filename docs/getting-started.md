# Use Conceptor for a first change

Conceptor helps your agent preserve why a change matters and compare its result
with that intent. It works inside your existing coding workflow. Start with one
bounded change whose result you can recognize.

## Prepare and install

You need Git, Node.js 24 or newer, npm, `tar`, and the Codex CLI. Clone the
[repository](https://github.com/OnePersonLabs/conceptor-plugin) into a permanent
directory, then follow the [installation commands](../README.md#use-it-in-a-project).
Preparation creates the local bundle used by the marketplace. These instructions
describe the current source workflow; they are not a prebuilt remote installation.

After installation, start a fresh Codex session in the project you want to change.
Installing the plugin does not activate every project.

## Enable it in that project

Tell the agent:

```text
Enable Conceptor in this project.
```

The activation helper reports `active`, the selected project root and an external
`stateFile`. Check that the reported project is the one you intended.
You do not need to invent Concepts or prepare helper JSON. An independently
versioned nested Git repository or separate worktree needs its own activation.
Windows and WSL settings are independent. No project marker or hook is created.

## Describe a useful change

For a project that already exports files, a request could be:

```text
Improve the export error message. Preserve the existing file if a write fails.
Check the failure path and explain what the evidence establishes. Keep the
change local; do not push it.
```

The agent should recover relevant existing intent, inspect the export path,
make the authorized change, and compare the result with that intent. Expect an
explanation of the change, applicable check results, and remaining uncertainty.
Your existing workflow controls tasks, issues, commits and publication.
Conceptor supplies meaning and evidence without changing those rules.

Meaning is retained as readable Markdown in `.conceptor/meaning/`. Reusable
evidence uses a bounded external cache; task and recovery state stay with the
native host. A recorded claim is
not proof that the implementation satisfies it. Optional discovery and checks
have explicit coverage limits. See [applying Conceptor](../plugins/conceptor/references/applying-conceptor.md)
for the reasoning procedure and [the reference](../plugins/conceptor/references/guide.md)
for helper contracts.

## If something does not work

- **Preparation failed:** read the first reported dependency, npm, or archive
  error. Correct the prerequisite and rerun preparation before installing.
- **The skill is missing:** confirm installation and start a fresh Codex session.
- **The project seems inactive:** ask “Check Conceptor activation in this project.”
  Confirm the reported root and host. A legacy `.conceptor/active` marker needs
  explicit activation to migrate; installed plugin state and project opt-in differ.
- **A check is unresolved:** inspect its stated coverage and missing evidence.
  Missing runtime or language-provider support is not a passing result. Continue
  only work whose premises remain supported.

To stop using Conceptor here, say “Turn Conceptor off in this project.” The helper
reports `inactive` and removes local opt-in. It preserves authored meaning and
source files. Conceptor does not apply repairs or provide rollback.

The cache retains at most 128 completed entries and 32 MiB, with seven-day expiry
checked on access. Missing evidence requires rerunning the applicable check.
Original failures are returned to the native task context; the cache is not an
archive. See [storage and migration](../plugins/conceptor/references/guide.md#local-settings-and-disposable-evidence)
for locations and treatment of legacy recovery files.

The commands and runtime paths are checked deterministically. This guide does
not claim that native skill selection or product benefit was measured in an AI trial.
