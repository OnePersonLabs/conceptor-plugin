---
id: current-work
goal: Align Conceptor maintenance with the shared issue workflow while preserving accepted product meaning
status: in_progress
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

Maintenance is tracked in [issue #6](https://github.com/OnePersonLabs/conceptor-plugin/issues/6). The active root entry is `AGENTS.md`; resume from this checkpoint and inspect Git state before changes. Use `$onepersonlabs:github-workflow` for issue status. Conceptor owns accepted meaning and evidence; the issue owns actionable status.

The current repository and checkout are `OnePersonLabs/conceptor-plugin` and `C:/dev/projects/conceptor-plugin`. The plugin and marketplace slug remains `conceptor`. Current command namespace is `$onepersonlabs:*`. Completed rename history is in [archive/conceptor-rename.md](archive/conceptor-rename.md); its original full text is recoverable with `git show 70cb772:.conceptor/work/conceptor-rename.md`.

This checkout is `main` at `a754a1d`, three commits ahead of `origin/main`. Preserve the existing untracked `.conceptor/work/branch-consolidation.json`, `branch-consolidation.md`, `conceptor-rename-comparison.json`, `version-branch-names.md`, and `.temp/` (including nested worktrees `.temp/cn3` and `.temp/cn4`). Do not publish these records as part of maintenance.

Conceptor's product meaning remains in `docs/approved-plan.md`; issue [#2](https://github.com/OnePersonLabs/conceptor-plugin/issues/2) owns its separate purpose-reassessment and Steady Helm consumer work. This maintenance changes no product behavior, authorization, release, or qualification.

Next: root verifies the integrated live-reference and navigation changes, then reconciles issue #6. Keep this record as the sole active checkpoint; use the archive only for historical evidence. The physical checkout rename and nested-worktree repair are complete; native plugin replacement and authorized source publication remain pending. No product work is authorized.
