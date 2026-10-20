# Conceptor 3

With Conceptor, you develop software by shaping a readable model of its concepts, relationships, requirements, scenarios and decisions. Codex turns authorized changes to that model into code and verifies the result. The model remains the authority as the implementation changes, and can retain future capabilities before they are built.

## Contents

- [See it in action](#see-it-in-action)
- [Install and start](#install-and-start)
- [How the model relates to code](#how-the-model-relates-to-code)
- [Documentation](#documentation)
- [Develop Conceptor](#develop-conceptor)
- [Related projects](#related-projects)
- [License](#license)

## See it in action

Suppose you are building a music app with reusable clips. One clip can appear several times on a timeline. You want each use of a clip to transpose the shared notes independently. Start in Codex Plan mode to work through the design. This conversation illustrates the workflow; the linked JSON contains the complete example model proposal.

```text
You: Use $conceptor. Let one clip be used more than once in an arrangement,
     with a separate transpose value for each use. Save and reload must preserve
     the shared clip reference.

Codex: I propose concept:clip at
       .conceptor/model/concepts/clip.md:
       "A clip owns reusable notes and timing."
       requirement:independent-transposition-per-use at
       .conceptor/model/requirements/transpose-each-clip-use-independently--independent-transposition-per-use.md
       says each use stores its own semitone value and save/reload preserves the
       shared clip reference.
       scenario:two-uses-of-one-clip-save-reload at
       .conceptor/model/scenarios/save-and-reload-two-uses-of-one-clip--two-uses-of-one-clip-save-reload.md
       exercises one C4 clip used twice. I would add the Clip -> Requirement
       and Requirement -> Scenario relations under .conceptor/model/relations/.
       The linked JSON is the complete proposal; these Markdown and TOML records
       are where the accepted model lives. The app needs to store a clip
       reference, position, and transpose value for each use and preserve them
       through playback and save/reload.

You: Make the reload case cover two uses of the same clip. Keep the clip's
     original notes unchanged.

Codex: I revise scenario:two-uses-of-one-clip-save-reload in
       .conceptor/model/scenarios/save-and-reload-two-uses-of-one-clip--two-uses-of-one-clip-save-reload.md:
       transpose 0 plays C4, and +2 plays D4 before and after reload. Both
       uses still reference the same clip, whose note remains C4. I will add
       the Clip -> Requirement and Requirement -> Scenario relations. The proposed
       contents are linked in the worked example.

     [After leaving Codex Plan mode]
You: Go ahead and implement that.

Codex: Conceptor accepted the model change, then I changed the app and ran the
       playback and persistence checks. Two clip uses of one C4 clip played
       C4 and D4 before and after reload without changing the clip. Older
       arrangement import has not been checked.
```

In Codex Plan mode, the conversation stays a plan: Codex shows proposed record contents, identities, paths, reasons, and implementation consequences, then revises them with you. Questions and discussion do not accept or write the model or start implementation. Leave Plan mode and authorize execution; `$conceptor` then runs the model lifecycle and implements and verifies the task. There is no separate skill to invoke for each phase. Read the [worked clip use example](docs/examples/clip-use.md) for complete illustrative artifacts and a later revision that reuses their identities.

You can also ask for the whole change in one shot, outside Plan mode:

```text
$conceptor Limit clip use transpose to integer semitones from -24 to 24.
Reject invalid values without changing the clip use or clip. Implement it
and keep the existing save/reload behavior.
```

Codex updates the relevant model records, implements the change, runs its checks, and reports the actual artifact changes with links. You can follow up with a revision such as “Make that -48 to 48.” A request like “Reload loses the second clip use's transpose; fix it” can instead repair code under the existing model and report that the model was unchanged.

## Install and start

Conceptor V3 needs Node 24 or later. Install **Conceptor V3** (`conceptor-v3@conceptor-v3`) from this repository's Codex marketplace. For a local checkout:

```text
codex plugin marketplace add <checkout-path>
codex plugin add conceptor-v3@conceptor-v3
```

Open a repository in Codex and say: “Use `$conceptor` to initialize this repository.” Installation does not activate a repository. For a new app, describe the behavior and boundaries you want to keep. For an existing app, ask Conceptor to inspect current code and decisions before proposing accepted meaning; code alone is evidence, not automatic intent.

`$conceptor` is a Codex skill invocation typed in chat, including Plan mode. It is not a shell command. The bundled terminal entry point is `node <plugin>/scripts/conceptor.mjs`; a bare `conceptor` command requires the separately packaged CLI on `PATH`. See [Getting started](docs/getting-started.md) for the first task and [CLI reference](docs/reference/cli.md) for lower-level operations.

## How the model relates to code

The accepted model under `.conceptor/` uses Markdown records with TOML metadata for concepts, requirements, scenarios, decisions, and reasons. Independent relationships and policies use TOML. A stable record ID is independent of its filename. Code is a revisable realization of the model: a repair can leave accepted meaning unchanged, and a future commitment can be accepted before its code exists.

Conceptor reports which context and dependencies it inspected, plus omissions and unavailable evidence. A successful model operation does not prove application behavior. `$conceptor-verify` examines actual code against concepts, requirements, and scenarios, tries concrete counterexamples, and reports checks and missing evidence. Use `$conceptor-reconcile` for edits made outside the current Conceptor work and `$conceptor-assimilate` when a large or branching source set needs a separate working synthesis.

## Documentation

Start at the [documentation home](docs/README.md). The [worked example](docs/examples/clip-use.md) shows the records behind the conversation; [Workflows](docs/workflows.md) explains planning, execution, repair, and outside changes; [Model and context](docs/model-and-context.md) explains identity and evidence. The [CLI reference](docs/reference/cli.md) is for terminal use and integrations.

Earlier documentation used `$projector-change` for model revisions and `$projector-review` for consequential code review. Their work now runs through `$conceptor` and `$conceptor-verify`. Historical records and command receipts keep their original names.

## Develop Conceptor

Contributors run `pnpm install` and `pnpm plugin:prepare-local` after runtime changes. The latter stages the plugin under `.build/local-marketplace/plugins/conceptor-v3` and updates the shipping runtime under `plugins/conceptor-v3/runtime`. Include that runtime with source changes so installed copies receive the current code. `pnpm verify` runs package checks and tests; `pnpm release:check` exercises an installed distribution. See [Development](docs/development.md).

## Related projects

[Conceptor 4](https://github.com/OnePersonLabs/conceptor/tree/v4) manages a reviewed change through isolated implementation and integration. [Kerf](https://github.com/OnePersonLabs/kerf) uses a smaller conceptual model and bounded focus workflow.

## License

See [LICENSE](LICENSE).

## Naming on this version branch

This branch presents Conceptor V3. The plugin is `conceptor-v3`; public package imports use `@conceptor/*`. Internal source API symbols, environment variable names, versioned schema IDs, released representation payloads and SQL migration identities retain their original spellings and bytes. Project storage uses `.conceptor/`. This naming change adds no data migration or compatibility aliases; historical evidence remains historical.
