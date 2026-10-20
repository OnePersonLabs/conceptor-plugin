# Skill invocations

Type these names in Codex chat. They are not terminal commands. See the [CLI reference](reference/cli.md) for exact shell operations.

## `$conceptor`

Use the main skill to initialize a repository, retrieve accepted meaning, plan a change, implement an authorized task, check consequences, and resume actual retained context. In Codex Plan mode, it presents proposed record contents, stable identities, paths, reasons, and implementation consequences for discussion and revision. Plan mode does not write, capture, or accept canonical changes or implement code. On authorized execution, it handles model acceptance through the lifecycle and proceeds to implementation and verification.

## `$conceptor-verify`

Use this to examine actual code against accepted concepts, requirements, and scenarios. It traces producers, persistence, consumers, registrations, and behavior checks where relevant; tries concrete counterexamples; and separates demonstrated violations from changed assumptions and unavailable evidence. The result names what was checked and what remains unknown.

## `$conceptor-reconcile`

Use this after a pull, direct edit, new consumer, or changed assumption outside the current Conceptor task. It compares actual source and retained meaning before deciding whether a code repair or model revision is needed.

## `$conceptor-assimilate`

Use this when the source set is large or branches across chats, documents, research, or repository history. The result is a separate working synthesis in `.assimilate/`. Ground mature intent in current accepted meaning before proposing it through `$conceptor`; synthesis notes are not canonical Conceptor records.

Earlier documentation called model revision `$conceptor-change` and consequential code review `$conceptor-review`. Use `$conceptor` and `$conceptor-verify` for those tasks now. Historical records may still contain the former names.

See [Getting started](getting-started.md), the [worked example](examples/clip-use.md), or [Workflows](workflows.md).
