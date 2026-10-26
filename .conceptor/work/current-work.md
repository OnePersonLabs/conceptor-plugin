---
id: current-work
goal: Remove obsolete temporary artifacts while preserving active resources and useful evidence
status: complete
concepts: []
lenses: []
ownership:
  - owner: root
    paths:
      - .conceptor/work/current-work.md
      - .conceptor/work/transient-cleanup-comparison.json
      - .temp/version-verification
boundaries:
  - .conceptor/work/**
  - .temp/**
  - .verification/**
completed:
  - Retired completed V3/V4 scratch worktrees and obsolete verification dependencies.
  - Retained unique release evidence and verified all 61 deterministic checks.
questions: []
uncertainMutations: []
issues:
  - https://github.com/OnePersonLabs/conceptor-plugin/issues/8
---
# Current work

## Temporary-file cleanup -- 2026-10-26

[Issue #8](https://github.com/OnePersonLabs/conceptor-plugin/issues/8) owns this
user-authorized cleanup. The [comparison](transient-cleanup-comparison.json)
records the scope and retention decision. The new request supersedes blanket
`.temp/` retention from earlier publication work only for proven obsolete material.

Removed `.temp/cn3`, `.temp/cn4`, `.verification/glob-candidate/node_modules`,
and `.verification/hoisted-node_modules`. Both worktrees were clean and their
tips matched live remote v3 `b8f9d11` and v4 `b8f281d` before native Git removal.
Their commits remain available. No external checkout was changed.

Preserved all 15 release JSON files, including the result and installed transcript,
plus the tested archive under
`.temp/version-verification/release-check-v3-e82002c/`. Each copy matched the
original bytes before deletion. The existing verification checkpoint and receipt
paths remain historical; this directory is their current local evidence location.
The old expanded package was reproducible and was removed with the worktree.

Retained `.temp/dependency-design`, `.verification/workflow-review`, other
verification scripts/manifests/receipts, main dependencies, the prepared marketplace
bundle, and the published archive. Research evidence was not proven obsolete;
the workflow report directly references its retained counter and output.

Acceptance: all four targets are absent; Git lists only the main worktree; retained
release JSON parses; active resource paths exist; all 61 deterministic tests pass.
Net logical file reduction is 745,109,652 bytes (710.6 MiB), after retaining
21,918,787 bytes of evidence. Physical disk allocation was not measured.

Root owned mutations and delivery. One read-only helper inspected evidence;
assessment cost was one helper context with zero reported compactions. Exact
aggregate tokens are unavailable. No failed deletion or repair cycle occurred.
Reconsider a retained folder only when its evidence owner no longer needs it.
Delivery ends at checked local commits; no push, installation or AI trial ran.

## Continuing boundaries

The selected checkout is `C:/dev/projects/conceptor-plugin`, branch `main`.
Plugin and marketplace identity remain `conceptor`. The first-use documentation
in local commit `716e179` belongs to [issue #7](https://github.com/OnePersonLabs/conceptor-plugin/issues/7)
and remains unpublished. Prior maintenance was published through `d0316d5`;
[issue #6](https://github.com/OnePersonLabs/conceptor-plugin/issues/6) and
[archive/](archive/README.md) retain the migration decisions and dated installed
Windows/WSL evidence. No installed-state requalification occurred in this cleanup.

Product meaning remains in `docs/approved-plan.md`. Select
[issue #2](https://github.com/OnePersonLabs/conceptor-plugin/issues/2) only under
separate product scope; cleanup does not resume its consumer work or experiments.
The previous checkpoint is recoverable from commit `716e179`.
