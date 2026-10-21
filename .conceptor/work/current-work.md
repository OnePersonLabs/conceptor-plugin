---
id: current-work
goal: Align Conceptor maintenance with the shared issue workflow while preserving accepted product meaning
status: complete
concepts: []
lenses: []
ownership:
  - owner: root
    paths:
      - AGENTS.md
      - .conceptor/work/current-work.md
      - .conceptor/work/archive/conceptor-rename.md
boundaries:
  - AGENTS.md
  - .conceptor/work/**
completed:
  - The checkout and repository are at C:/dev/projects/conceptor-plugin; plugin identity remains conceptor.
  - The historical checkout-move blocker is resolved and its record is archived.
questions: []
uncertainMutations: []
issues:
  - https://github.com/OnePersonLabs/conceptor-plugin/issues/6
---
# Current work

## Shared workflow and live references

Completed maintenance is recorded in [issue #6](https://github.com/OnePersonLabs/conceptor-plugin/issues/6). The active root entry is `AGENTS.md`; resume from this checkpoint and inspect Git state before changes. Use `$onepersonlabs:github-workflow` for issue status. Conceptor owns accepted meaning and evidence; the issue owns actionable status.

The current repository and checkout are `OnePersonLabs/conceptor-plugin` and `C:/dev/projects/conceptor-plugin`. The plugin and marketplace slug remains `conceptor`. Workflow commands use `$onepersonlabs:*`; Conceptor commands remain `$conceptor:*`. Completed rename history is in [archive/conceptor-rename.md](archive/conceptor-rename.md); its original full text is recoverable with `git show 70cb772:.conceptor/work/conceptor-rename.md`.

The selected branch is `main`. Maintenance source and the preceding workflow-adoption commits are published; inspect Git for the exact current revision. The user clarified on 2026-10-21 that the four retained branch/naming decision records belong in the Projector-to-Conceptor migration delivery. They are preserved byte-for-byte under [archive/](archive/README.md), with historical scope and superseded proposals identified. Preserve `.temp/`, including generated probes, local Codex databases/caches and the clean nested worktrees `.temp/cn3` and `.temp/cn4`; these are local runtime artifacts, not publication inputs.

This publication follow-up uses one root and no helpers. Acceptance is exact preservation of the four records, valid JSON, reviewed documentation changes and a verified normal push to `main`. No package/runtime input changes; existing deterministic and installed evidence remains applicable. Stop and reassess if record contents, staged paths or remote ancestry differ from the inspected state. No product experiment is resumed.

Conceptor's product meaning remains in `docs/approved-plan.md`; issue [#2](https://github.com/OnePersonLabs/conceptor-plugin/issues/2) owns its separate purpose-reassessment and Steady Helm consumer work. This maintenance changes no product behavior, authorization, release, or qualification.

Delivery: the checkout/repository rename is complete. `conceptor@conceptor` 0.1.1 is installed and enabled in Windows and WSL; all three hooks are trusted in each home. Shared OnePersonLabs configuration/instructions and effective skill inventories pass in both environments. All 61 deterministic Conceptor tests passed. Restart Codex to load refreshed components; the current desktop sidebar may retain cached old folder entries until reopened.

Next: select issue #2 only under the user's separate product scope. Keep this as the sole current checkpoint; the archive supplies historical evidence. No product execution or qualification follows from completed maintenance.
