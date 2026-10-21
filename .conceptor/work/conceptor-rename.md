# Conceptor rename -- 2026-10-20

Status: complete. User selected Conceptor, expanded as Concept Projector, and authorized the repository rename, direct data-directory rename, source publication and Windows/WSL installed-copy replacement. Governing meaning: docs/approved-plan.md amendment 11. The [saved comparison](conceptor-direct-rename-comparison.json) preceded source edits; its bytes retain the original assessment context.

Delivery: OnePersonLabs/conceptor uses main as its default. Public plugin, package, executable, marketplace and source folder use conceptor. The private tooling package is conceptor-workspace. This active checkout remains C:/dev/projects/projector-v5. No runtime migration or old-name alias was added.

The one-shot shell operation renamed 74 physical .projector directories under C:/dev/projects to .conceptor, with collision and containment checks. It skipped links and junctions. Directory contents were preserved. The local recovery receipt is %TEMP%/conceptor-directory-renames.json. Dated reports and their source identities remain historical; earlier untracked personal files remain unpublished.

Evidence: all 61 deterministic tests passed; the portable conceptor@0.1.0 archive passed isolated CLI/status and active-project hook checks. Independent staged-source review found no blocking issues. Both installed copies are enabled, all three hooks in each home are trusted, and direct installed CLI checks recognize this existing .conceptor project. The old plugin identity, marketplace registration and version cache are absent in both homes. The new marketplace registrations were explicitly verified after retiring the old source registration. A fresh session is still needed to load the renamed plugin.

Post-refresh checks: Windows and WSL global instructions are current at 57. WSL OPL configuration is compliant. The required Windows fix refused an existing name-only skills.config entry, leaving seven stale OPL role registrations unresolved. The helper did not apply the repair. Track that independent blocker at https://github.com/OnePersonLabs/opl/issues/12; do not alter the unrelated disabled-skill preference as part of this rename.

Tracker: https://github.com/OnePersonLabs/conceptor/issues/4. Git identifies the source commit that contains this record. No AI-consuming trial or skill-invocation test was run.

## Workflow adoption follow-up -- 2026-10-21

The source/plugin rename above remains delivered. The separately requested physical
checkout move from `C:/dev/projects/projector-v5` to `C:/dev/projects/conceptor` is
blocked: two native move/rename attempts received Windows sharing violations. The
source directory and its nested worktrees remain in place; marketplace/project
registrations still correctly target that existing directory. No forced process
termination or copied replacement checkout is an accepted workaround.

The root asked the user to close the window or process holding the directory.
Wait for changed evidence before another move. Then verify the resolved destination,
move once, repair the two nested Git worktree registrations, and update Windows/WSL
marketplace source paths and the app's saved project path through supported controls.
If the app cannot update its saved path, reopen the moved folder as the project.
The adoption comparison is [saved here](workflow-adoption-comparison.json).

Cleanup completed only for clean `kerf` and `projector-v1` checkouts. Kerf's HEAD
matched live origin/main; the v1 commit is retained in the main Projector checkout's
`v1` branch. Small ignored Kerf context snapshots were preserved before removal.
Dirty versions, linked worktrees, archives and rehearsal folders remain untouched.
Exact prechecks and recovery receipts are in `%TEMP%/opl-adoption-20261021/`.

OPL follow-up is published at `0408c32`; Windows and WSL installed copies and hook
trust passed, configuration is compliant, and shared global instructions are now
revision 59. This supersedes the dated configuration observations above. Full
refreshed-plugin loading still requires a fresh session. Product setup checkpoints
remain local and do not authorize product continuation or publication.
