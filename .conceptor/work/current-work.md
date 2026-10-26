---
id: current-work
goal: Remove obsolete temporary artifacts and completed work records
status: complete
concepts: []
lenses: []
ownership:
  - owner: root
    paths: [.conceptor/work]
boundaries: [.conceptor/work/**]
completed:
  - Retired temporary worktrees and dependencies, then 11 completed work records.
  - Preserved original records in Git and retained unique local release evidence.
questions: []
uncertainMutations: []
issues:
  - https://github.com/OnePersonLabs/conceptor-plugin/issues/8
---
# Current work

[Issue #8](https://github.com/OnePersonLabs/conceptor-plugin/issues/8) owns the
user-requested cleanup, including the follow-up removal of completed records.
Only this checkpoint and the [active comparison](transient-cleanup-comparison.json)
remain in this directory. The active session requires that saved comparison.

The 11 removed checkpoints/comparisons and the archive retain their original bytes
in commit `c623cee`. Recover any record with `git show c623cee:<original-path>`;
for example, `git show c623cee:.conceptor/work/archive/version-branch-names.md`.
This preserves the previously requested migration-record publication and its
conditions without retaining completed task files in the live work directory.

The earlier cleanup in `c623cee` removed 710.6 MiB of obsolete worktrees and
verification dependencies. Unique release receipts, transcript and tested archive
remain in `.temp/version-verification/release-check-v3-e82002c/`; investigation and
workflow-review evidence remain in their existing locations. Current plugin
resources and main dependencies remain intact. No external checkout was changed.

Acceptance: all retired records are recoverable from Git; live work links resolve;
native resume reads this checkpoint. The 61 passing deterministic checks from the
same session remain applicable because runtime and test inputs did not change.
Root owned both cleanup units; one read-only helper reviewed each boundary, with
zero reported compactions. Exact aggregate tokens are unavailable. No failed
repair cycle or AI trial occurred. Reopen on a concrete missing live consumer.

Current checkout: `C:/dev/projects/conceptor-plugin`, branch `main`; plugin identity
is `conceptor`. Local documentation commit `716e179` and cleanup commits remain
unpublished. Migration status and dated Windows/WSL evidence remain in issue #6
and Git history. No push, refresh or installed-state requalification ran.

Product authority remains in [the approved plan](../../docs/approved-plan.md).
[Issue #2](https://github.com/OnePersonLabs/conceptor-plugin/issues/2) is separate:
the [first trial](../../docs/purpose-reassessment-trial-20261009.md) and
[repeat trial](../../docs/comparison-before-code-trial-20261009.md) retain failures,
cost and unresolved acceptance. The isolated Steady Helm candidate remains
unaccepted; its raw evidence and both trial worktrees stay preserved. Cleanup
does not resume that product work or its experiments.
