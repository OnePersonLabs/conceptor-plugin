# Conceptor rename -- 2026-10-20

Status: complete. User selected Conceptor, expanded as Concept Projector, and authorized the repository rename, direct data-directory rename, source publication and Windows/WSL installed-copy replacement. Governing meaning: docs/approved-plan.md amendment 11. The [saved comparison](conceptor-direct-rename-comparison.json) preceded source edits; its bytes retain the original assessment context.

Delivery: OnePersonLabs/conceptor uses main as its default. Public plugin, package, executable, marketplace and source folder use conceptor. The private tooling package is conceptor-workspace. This active checkout remains C:/dev/projects/projector-v5. No runtime migration or old-name alias was added.

The one-shot shell operation renamed 74 physical .projector directories under C:/dev/projects to .conceptor, with collision and containment checks. It skipped links and junctions. Directory contents were preserved. The local recovery receipt is %TEMP%/conceptor-directory-renames.json. Dated reports and their source identities remain historical; earlier untracked personal files remain unpublished.

Evidence: all 61 deterministic tests passed; the portable conceptor@0.1.0 archive passed isolated CLI/status and active-project hook checks. Independent staged-source review found no blocking issues. Both installed copies are enabled, all three hooks in each home are trusted, and direct installed CLI checks recognize this existing .conceptor project. The old plugin identity, marketplace registration and version cache are absent in both homes. The new marketplace registrations were explicitly verified after retiring the old source registration. A fresh session is still needed to load the renamed plugin.

Post-refresh checks: Windows and WSL global instructions are current at 57. WSL OPL configuration is compliant. The required Windows fix refused an existing name-only skills.config entry, leaving seven stale OPL role registrations unresolved. The helper did not apply the repair. Track that independent blocker at https://github.com/OnePersonLabs/opl/issues/12; do not alter the unrelated disabled-skill preference as part of this rename.

Tracker: https://github.com/OnePersonLabs/conceptor/issues/4. Git identifies the source commit that contains this record. No AI-consuming trial or skill-invocation test was run.
