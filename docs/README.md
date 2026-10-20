# Conceptor documentation

Conceptor stores accepted project meaning in readable records, retrieves relevant context for work, and checks whether retained conclusions still fit current source and dependencies. This guide routes you by what you need to do.

## Contents

- [Choose a path](#choose-a-path)
- [Learn the model](#learn-the-model)
- [Use Conceptor](#use-conceptor)
- [Find an exact contract](#find-an-exact-contract)
- [Related projects](#related-projects)

## Choose a path

| If you want to… | Read… |
|---|---|
| Understand Conceptor's purpose and limits | [Overview](overview.md) |
| Activate a repository and complete one task | [Getting started](getting-started.md) |
| See the records behind a planned and implemented change | [clip use worked example](examples/clip-use.md) |
| See complete situations and recoveries | [Examples](examples.md) |
| Choose a workflow for a kind of change | [Workflows](workflows.md) |
| Choose the right skill invocation | [Skills](skills.md) |
| Understand accepted meaning and identity | [Concepts](concepts.md) and [Model and context](model-and-context.md) |
| Revise accepted meaning | [Changing accepted meaning](changing-accepted-meaning.md) |
| Review drift, reconcile external edits, or recover | [Review, reconcile, and recover](review-reconcile-recover.md) |
| Find CLI syntax | [CLI reference](reference/cli.md) |
| Diagnose a problem | [Troubleshooting](troubleshooting.md) or [FAQ](faq.md) |
| Work on Conceptor itself | [Development](development.md) |
| Improve these docs | [Documentation guide](documentation-guide.md) |

## Learn the model

The repository's [.conceptor/README.md](../.conceptor/README.md) is its canonical model index. Read that index when you need to inspect Conceptor's own accepted meaning. This documentation explains how to use the model; it does not replace or copy its records.

## Use Conceptor

Use `$conceptor` in Codex chat for the whole task. In native Plan mode, review concrete proposed records and implementation consequences and revise them in conversation; planning does not write or accept canonical meaning or implement code. After you authorize execution, Conceptor accepts changed meaning through its lifecycle, then implements and verifies the task. A behavior repair can preserve the accepted model. Use `$conceptor-verify` to compare actual code with concepts, requirements, and scenarios; `$conceptor-reconcile` investigates outside edits, and `$conceptor-assimilate` synthesizes large or branching source material.

Earlier guides named `$conceptor-change` and `$conceptor-review` as separate steps. Their current paths are `$conceptor` and `$conceptor-verify`. Historical evidence retains its original names.

## Find an exact contract

The [CLI reference](reference/cli.md) lists supported public operations and options. The installed skills define the user-facing workflow. The [operation contract](../plugins/conceptor-v3/references/operation-contract.md) documents integration details. For Conceptor's own implementation, source and generated contracts remain authoritative.

## Related projects

[Conceptor 4](https://github.com/OnePersonLabs/conceptor/tree/v4) centers on a reviewed proposal-to-integration lifecycle. [Kerf](https://github.com/OnePersonLabs/kerf) centers on a smaller conceptual model and bounded focus workflow.

Continue with [Getting started](getting-started.md) or return to the [Conceptor 3 README](../README.md).
