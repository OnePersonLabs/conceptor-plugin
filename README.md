# Conceptor -- Concept Projector

Conceptor helps an agent recover the reason for a change, find its current implementations, and compare selected behavior with that meaning. The native harness still runs the work and coordinates agents. The plugin stores readable meaning and offers optional discovery and evidence helpers.

## Start with one change

Use Conceptor when an agent needs to carry a project's reasons and constraints
through implementation and later revisions. You describe the work in ordinary
language; the agent recovers relevant meaning, follows its implementation, and
reports what the available evidence supports.

For example, ask it to improve an export while preserving the existing file when
a write fails. The useful result is a connected change, its checks, and retained
reasoning about that failure boundary. A stored requirement alone does not prove
the export preserves data.

Follow [the first-use guide](docs/getting-started.md) to prepare and install the
plugin, enable it in one project, and make that first request. Installation is
currently a source-checkout workflow; the marketplace needs its prepared bundle.
Conceptor is experimental, and its maintenance cost and benefit still need evidence
from use. It does not establish whole-application correctness or authorize a push.

## Vocabulary when you need it

The original vocabulary has work to do:

| Term | Purpose |
| --- | --- |
| Concept | A stable idea, its conditions, reasons, exceptions, and reopening assumptions. |
| Typed Relation | A named connection, marked as observed or accepted. |
| Projection Unit | A current source participant discovered through a Lens. Several Units can realize one Concept. |
| Projection Lens | Discovery and checks for particular conditions and participants. |
| Pattern Candidate | A possible reusable approach with examples, counterexamples, and alternatives. |

Meaning lives in `.conceptor/meaning/` as Markdown with YAML frontmatter. Local activation and bounded reusable evidence live outside the checkout. Conceptor creates no task archive or session ledger. Meaning and application code remain usable after removing the plugin.

## Use it in a project

Clone the [Conceptor repository](https://github.com/OnePersonLabs/conceptor-plugin)
into a permanent directory. With Node.js 24+, npm, Git, `tar`, and Codex available,
run these commands from the checkout in PowerShell:

```powershell
npm.cmd run plugin:prepare-local
codex plugin marketplace add .
codex plugin add conceptor@conceptor
```

Keep the checkout available. Preparation installs the runtime dependencies and
creates `.plugin-build/conceptor`, the directory selected by the marketplace.
If preparation fails, resolve that error before installation; a raw remote checkout
does not contain this generated bundle. See [first-use recovery](docs/getting-started.md#if-something-does-not-work).

In a fresh Codex session opened in the project you want to work on, say **"Enable Conceptor in this project."** The agent uses `$conceptor:enable-conceptor` to save local opt-in outside the checkout. Then describe work normally. The agent selects the relevant skills and prepares helper requests; you do not need to remember a workflow or command names.

Say **"Turn Conceptor off in this project"** to remove local opt-in. Authored meaning and source files remain. A nested repository or separate worktree needs its own activation; Windows and WSL settings are independent. No Conceptor hooks inject guidance or block tools.

Conceptor supplies meaning and scoped evidence. Your native workflow owns tasks, GitHub issues, editing, recovery, commits and publication. Enabling Conceptor does not change those policies.

The evidence cache replaces entries and evicts them after seven days or when its 128-entry / 32 MiB limits are reached. Check output is bounded and returned inline. Cache loss requires fresh evidence; it cannot create a passing result. See [local state and migration](plugins/conceptor/references/guide.md#local-settings-and-disposable-evidence).

## Try the helper

Use Node.js 24 or newer. From this workspace:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run setup:plugin
node plugins/conceptor/runtime/cli.mjs activate --root examples/clip
node plugins/conceptor/runtime/cli.mjs focus --root examples/clip --request examples/clip/requests/focus.json
node plugins/conceptor/runtime/cli.mjs revisit --root examples/clip --request examples/clip/requests/focus.json
node plugins/conceptor/runtime/cli.mjs reconcile --root examples/clip --request examples/clip/requests/reconcile.json
```

The last request explicitly runs native checks. The clip example requires Python and `rustc` for its persistence and Rust checks. It also includes frontend and C# subjects whose runtime behavior needs separate evidence. An unresolved result can therefore be the correct outcome.

Use `focus` to retrieve selected meaning, `revisit` to refresh discovery, and `reconcile` to collect scoped verdicts. Provider requests are explicit. A normal context request does not start a compiler or install a language server.

The CLI also provides `observe`, `status`, and `deactivate`. Results are JSON. Reconciliation exits with `0` for supported results, `1` for a mismatch, and `2` for unresolved evidence or an error. Native checks run without a shell. See [the reference guide](plugins/conceptor/references/guide.md) for request formats, coverage declarations, provider setup and evidence retention.

## Plugin contents

The plugin is in [plugins/conceptor](plugins/conceptor). It contains a runtime, on-demand references and four native skills:

- `$conceptor:enable-conceptor`: enable, disable, or inspect activation in a project.
- `$conceptor:recover-meaning`: recover the authority, current participants, and relevant uncertainty.
- `$conceptor:carry-out-directive`: apply accepted meaning and evidence to an implementation change.
- `$conceptor:reconcile-and-learn`: investigate discrepancies and retain learning that could change future action.

Create a portable package with `npm.cmd run pack:plugin` after `setup:plugin`. The plugin's own lockfile and dependency directory supply the bundled runtime. The root package supplies test tooling. Unpack the archive and use its `package` directory as the plugin root. Its CLI is `runtime/cli.mjs`. The local marketplace uses a prepared bundle under `.plugin-build/conceptor`. `$onepersonlabs:refresh-local-plugins` runs `plugin:prepare-local`, then installs and enables `conceptor@conceptor` in reachable Windows and WSL user homes. Preparation requires Node.js 24+, npm, and `tar`. Use the source checkout for this workflow. A raw GitHub marketplace checkout needs this preparation before its plugin source is installable.

## Language evidence

| Subject | Available observation route | Scope of verification |
| --- | --- | --- |
| JS, TS, JSX, TSX | Explicit LSP server; native checks | Protocol tests, clip JavaScript runtime checks, and real TS/TSX navigation with a version-provenance gap. |
| Python, Rust, C# | Explicit LSP server; native checks | Real Python navigation and Rust symbols; clip Python/Rust runtime checks. C# runtime unrun here because no .NET SDK is installed. |
| HTML | Packaged HTML language service | Document symbols and local reference highlights. HTML diagnostics are an explicit gap. |
| CSS, SCSS | Packaged CSS language service | Symbols, definitions, references, and diagnostics. |
| Tauri, NativeScript, React Native | Source/message discovery and native checks | Example seams; full framework integration remains unverified. |
| Source-bound imported facts | Explicit JSON index import | Current source bindings and fact scope are checked. |

LSP navigation does not establish a complete cross-language graph. The provider reports its capabilities, source inputs, and gaps. Static observations cannot establish runtime delivery or timing. New consumers require applicable check coverage before they receive support.

## Development

```powershell
npm.cmd test
```

The deterministic tests cover scoped evidence, cache invalidation, discovery changes, native checks, provider failures, project activation and bounded external state, and the [shared Clip example](examples/clip/README.md). They make no AI calls. The [implementation interfaces](docs/interfaces.md) describe the current data contracts; the [application guide](plugins/conceptor/references/applying-conceptor.md) explains how to use meaning and evidence during a change.

Conceptor was previously named OPL Projector. Existing local data directories were renamed directly to `.conceptor/`; the runtime does not perform a migration.
