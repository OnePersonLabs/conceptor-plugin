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

The activation helper reports `active` and the selected project root, and creates
`.conceptor/active`. Check that the reported project is the one you intended.
You do not need to invent Concepts or prepare helper JSON. An independently
versioned nested Git repository needs its own activation.

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
Activated Git projects use coherent local commits by default, unless your
instructions say otherwise. Activation does not authorize publication.

Meaning is retained as readable Markdown in `.conceptor/meaning/`; useful active
work and recovery records can live in `.conceptor/work/`. A recorded claim is
not proof that the implementation satisfies it. Optional discovery and checks
have explicit coverage limits. See [applying Conceptor](../plugins/conceptor/references/applying-conceptor.md)
for the reasoning procedure and [the reference](../plugins/conceptor/references/guide.md)
for helper contracts.

## If something does not work

- **Preparation failed:** read the first reported dependency, npm, or archive
  error. Correct the prerequisite and rerun preparation before installing.
- **The skill is missing:** confirm installation and start a fresh Codex session.
- **The project seems inactive:** ask “Check Conceptor activation in this project.”
  Confirm the reported root; global installation and project activation differ.
- **A check is unresolved:** inspect its stated coverage and missing evidence.
  Missing runtime or language-provider support is not a passing result. Continue
  only work whose premises remain supported.

To stop using Conceptor here, say “Turn Conceptor off in this project.” The helper
reports `inactive` and removes the activation marker. It preserves meaning and
recovery records so ordinary development can continue. Owned-repair rollback is
a separate operation; disabling does not undo changes or rewind Git history.

This guide was checked against the preparation script, marketplace manifest,
activation helper, and workflow skills. The example request illustrates the
workflow; it is not a new model-driven trial or evidence of improved productivity.
