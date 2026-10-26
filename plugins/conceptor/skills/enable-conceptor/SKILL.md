---
name: enable-conceptor
description: Enable, disable, or check Conceptor for a local project when the user asks. Other Conceptor skills apply only to enabled projects.
---

# Enable Conceptor

Resolve the project from the user's request and working directory. Resolve the installed plugin root two directories above this skill directory. Use that installation's `runtime/cli.mjs`.

For an explicit enable request, run `node PLUGIN_ROOT/runtime/cli.mjs activate`. Pass `--root PROJECT` for an explicitly selected directory. The default is the nearest Git root. Check the returned root and `active` status.

Activation saves one local user setting outside the checkout. It creates no meaning, task files or hooks. Windows and WSL have independent settings. An empty legacy `.conceptor/active` marker is removed only after the external setting is saved and verified. Existing meaning and legacy recovery files remain untouched.

After activation, recover relevant meaning for the current request. Native skill discovery selects the other skills; no instruction file is injected. Activation does not change the user's issue, Git or delivery policy. See the [reference](../../references/guide.md#activation) for storage and migration details.

For a disable request, run `node PLUGIN_ROOT/runtime/cli.mjs deactivate --root PROJECT` at the active project root. Check the returned `inactive` status. This removes local opt-in and any empty legacy marker; it preserves authored meaning and source files. Continue ordinary native work.

For a status request, run `node PLUGIN_ROOT/runtime/cli.mjs status --root PROJECT`. Status does not create state. A legacy marker alone reports inactive with migration guidance. Enable only when the user requests it.
