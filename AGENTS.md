# Conceptor development

The approved design and later activation/publication amendment are in docs/approved-plan.md. Keep implementation in this workspace. Preserve other checkouts. The plugin is conceptor; use it only in activated projects.

Use native execution and delegation. Keep one writer per mutable surface. Contracts are in docs/interfaces.md; runtime source is in plugins/conceptor/runtime/. Do not add a second scheduler, implicit global semantic indexing, architecture quotas, or unrequested repository-wide guards.

Use $simplified-technical-english for instructions and implementation guidance. Use $de-ai-writing for human explanations. Write -- instead of an em dash.

Use deterministic checks for behavior. Do not run AI-consuming trials without explicit user authorization. Do not test skill invocation. Preserve supported evidence when another observation fails. Report incomplete coverage as unresolved.

## After a local plugin refresh

After a successful `$opl:refresh-local-plugins` refresh, run the OPL checks used
at session startup. Check configuration and global instructions in each refreshed
user-level Codex home. The user has approved the update question: apply required
OPL agent TOML configuration and documented defaults with the installed
`scripts/codex-config-check.py fix`, and update outdated global instructions with
`$opl:update-instructions`. Do not ask for that approval again.

Keep the safety checks and dated backups from the update helpers. Do not downgrade.
If homes share an instruction file, update its resolved target once. After a
global-instruction replacement, restore this user-requested post-refresh rule in
the user-level file. Keep the rule in this repository's `AGENTS.md` and the
user-level file; do not add it to `plugins/opl/AGENTS.md`.
