---
id: current-work
goal: Remove redundant root instructions and stale planning documentation
status: complete
concepts: []
lenses: []
ownership:
  - owner: root
    paths: [AGENTS.md, README.md, docs, .conceptor/work]
boundaries: [README.md, docs/**, .conceptor/work/**]
completed:
  - Removed the root AGENTS.md and seven completed planning/report files.
questions: []
uncertainMutations: []
issues:
  - https://github.com/OnePersonLabs/conceptor-plugin/issues/8
---
# Current work

The user requested deletion of redundant root instructions and transient docs.
The root AGENTS.md is removed: its operational rules already come from user-level
instructions and the existing GitHub workflow. Its requirement to keep the root
file is superseded by this explicit removal request; global instructions remain
unchanged. No replacement instruction file or archive was created.

The seven retired docs were the approved plan, implementation report, verification
snapshot, Railgun trial, Psychord workflow review, and both October 9 trial reports.
Original content remains in Git at `f9e916d`; it is no longer live planning authority.
The [first-use guide](../../docs/getting-started.md) and
[current interface contract](../../docs/interfaces.md) remain. README navigation
now points to current contracts and packaged guidance.

The [packaged AGENTS.md](../../plugins/conceptor/AGENTS.md) remains because
Conceptor's context hook reads it and the plugin ships it. Runtime, hooks, tests,
installation and other projects are unchanged. Historical GitHub trial citations
pin existing commits and still resolve. Removed historical evidence does not
establish new product qualification or authorize renewed experiments.

Root owns all writes. Two read-only helpers checked docs and instruction consumers,
with zero reported compactions. Root resolved their retention disagreement against
actual global inheritance and the user's deletion request. The [comparison](transient-cleanup-comparison.json)
records that decision. All 61 deterministic tests and 40 local Markdown file links
pass. The final scoped review found no actionable issue; runtime and test sources
are unchanged. The documentation checker flags project-created `.conceptor/meaning/`
and package-relative `runtime/cli.mjs` in the README; both are correctly explained
in their existing context. No failed repair cycle or AI-consuming trial occurred.
This documentation cleanup is committed locally; no push or refresh was requested.
