---
id: conceptor-rename
goal: Rename the Projector repository and activated data directories to Conceptor
status: complete
concepts: []
lenses: []
ownership:
  - owner: root
    paths:
      - .conceptor/work/archive/conceptor-rename.md
      - docs/approved-plan.md
boundaries:
  - .conceptor/work/archive/**
completed:
  - Repository, plugin, checkout, activation directories, and installed source paths were renamed and verified.
questions: []
uncertainMutations: []
---

# Conceptor rename -- 2026-10-20

Historical completed record. Current work and resume instructions live in
[`../current-work.md`](../current-work.md). The checkout-move blocker below was
resolved by the completion entry later in this record. Do not resume its former
wait-and-move instructions.

Status: complete. User selected Conceptor, expanded as Concept Projector, and authorized the repository rename, direct data-directory rename, source publication and Windows/WSL installed-copy replacement. Governing meaning: docs/approved-plan.md amendment 11. The [saved comparison](../conceptor-direct-rename-comparison.json) preceded source edits; its bytes retain the original assessment context.

Delivery at rename time: OnePersonLabs/conceptor used main as its default. Public plugin, package, executable, marketplace and source folder used conceptor. The private tooling package is conceptor-workspace. At this intermediate point the checkout remained C:/dev/projects/projector-v5; the later completion entry records the move to C:/dev/projects/conceptor. No runtime migration or old-name alias was added.

The one-shot shell operation renamed 74 physical .projector directories under C:/dev/projects to .conceptor, with collision and containment checks. It skipped links and junctions. Directory contents were preserved. The local recovery receipt is %TEMP%/conceptor-directory-renames.json. Dated reports and their source identities remain historical; earlier untracked personal files remain unpublished.

Evidence recorded at the rename: all 61 deterministic tests passed; the portable conceptor@0.1.0 archive passed isolated CLI/status and active-project hook checks. Independent staged-source review found no blocking issues. Both installed copies were enabled, all three hooks in each home were trusted, and direct installed CLI checks recognized this existing .conceptor project. The old plugin identity, marketplace registration and version cache were absent in both homes. The new marketplace registrations were explicitly verified after retiring the old source registration. The later completion entry below records the restart and fresh package discovery.

Historical post-refresh observation (2026-10-20): Windows and WSL global instructions were current at 57. WSL OPL configuration was compliant. The Windows fix refused an existing name-only skills.config entry and left seven stale OPL role registrations unresolved; the helper did not apply that repair. This dated observation is not a current routing instruction. Current maintenance status is tracked in [issue #6](https://github.com/OnePersonLabs/conceptor-plugin/issues/6).

Historical tracker: [issue #4](https://github.com/OnePersonLabs/conceptor-plugin/issues/4). Current maintenance tracker: [issue #6](https://github.com/OnePersonLabs/conceptor-plugin/issues/6). The original record is preserved in Git history. No AI-consuming trial or skill-invocation test was run.

## Workflow adoption follow-up -- 2026-10-21

The separately requested physical checkout move from
`C:/dev/projects/projector-v5` to `C:/dev/projects/conceptor` initially hit two
Windows sharing violations. The pause and recovery sequence are historical; the
completion section below records the successful move, nested worktree repair and
Windows/WSL marketplace path update. The adoption comparison is
[saved here](../workflow-adoption-comparison.json).

Cleanup completed only for clean `kerf` and `projector-v1` checkouts. Kerf's HEAD
matched live origin/main; the v1 commit is retained in the main Projector checkout's
`v1` branch. Small ignored Kerf context snapshots were preserved before removal.
Dirty versions, linked worktrees, archives and rehearsal folders remain untouched.
Exact prechecks and recovery receipts are in `%TEMP%/opl-adoption-20261021/`.

OnePersonLabs plugin follow-up is published at `0408c32`; Windows and WSL installed copies and hook
trust passed, configuration is compliant, and shared global instructions are now
revision 59. This supersedes the dated configuration observations above. Full
refreshed-plugin loading still requires a fresh session. Product setup checkpoints
remain local and do not authorize product continuation or publication.

### Checkout move completed

The user restarted Codex and moved the checkout to `C:/dev/projects/conceptor`.
The old directory is absent. Root verified the same HEAD and preserved dirty work,
repaired nested worktrees `.temp/cn3` and `.temp/cn4` with native `git worktree repair`,
and checked that each resolves its new root. Native marketplace add rebound the
existing `conceptor` source in Windows and WSL to the new directory. Marketplace
inventory and installed Conceptor status pass in both environments. Config backups
preceded both native updates. Codex's saved project and current project trust already
point to the new path. The earlier sharing-violation blocker is resolved.

The user-reported restart and this turn's available installed skill catalog establish
fresh discovery of the plugin packages. Exact hook invocation/complete per-session
loaded bytes are not independently observable here; no stronger claim is made.
