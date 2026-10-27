# Conceptor -- Concept Projector

Conceptor helps an agent keep a project's reasons and constraints connected to its implementation. It provides project meaning, guided change planning, and optional scoped discovery and evidence helpers. Your coding host still controls permissions and runs the work.

## Start with a change

Use `$conceptor:plan-change` to investigate a change and develop a proposal through conversation. It can cover architecture, algorithms, interfaces, failure behavior, dependencies, and verification. Planning does not change accepted project meaning or code.

Use `$conceptor:apply-change` to implement a direct request or a proposal. A prior plan, issue, or separate approval step is not required. The skill reconciles work on resumption against actual project files and Git state.

For example, ask the agent to improve an export error while preserving the existing file when a write fails. Conceptor should trace the accepted meaning through the real export path, make the authorized change, and report the evidence and uncertainty. A stored requirement alone does not prove that the export preserves data.

## Where Conceptor is active

Conceptor is active when `.conceptor/` exists at the selected repository root. A nested repository or separate worktree has its own root and its own target. No activation command, marker file, external registry, hook, or injected `AGENTS.md` is used.

Accepted project meaning lives in `.conceptor/meaning/` as readable Markdown. The caller's selected task tracker owns task identity, progress, dependencies, and resumption. Conceptor keeps no task ledger or evidence cache. Use Git history for committed execution history. See [the first-use guide](docs/getting-started.md) and [runtime interfaces](docs/interfaces.md).

## Install the plugin

Clone the [Conceptor repository](https://github.com/OnePersonLabs/conceptor-plugin) into a permanent directory. With Node.js 24+, npm, Git, `tar`, and Codex available, run these commands in PowerShell:

```powershell
npm.cmd run plugin:prepare-local
codex plugin marketplace add .
codex plugin add conceptor@conceptor
```

Preparation installs runtime dependencies and creates `.plugin-build/conceptor`, the directory selected by the local marketplace. A raw remote checkout does not contain this generated bundle. See [first-use recovery](docs/getting-started.md#if-something-does-not-work).

Start a fresh Codex session in the project you want to change. If `.conceptor/` is present at that repository root, the Conceptor skills can apply there. Ordinary skill discovery remains enabled; a caller that needs a specific workflow should explicitly invoke `$conceptor:plan-change` or `$conceptor:apply-change`.

## Try the helper

Use Node.js 24 or newer. The Clip fixture is inside this repository, so its `.conceptor/` directory is not at the repository root. To run it, copy it to a temporary directory outside any Git checkout. The `try/finally` block removes that copy even when a command fails:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run setup:plugin
$clipProject = Join-Path $env:TEMP ("conceptor-clip-" + [guid]::NewGuid().ToString("N"))
try {
    Copy-Item -Recurse -LiteralPath examples/clip -Destination $clipProject
    $cli = "$(Get-Location)\plugins\conceptor\runtime\cli.mjs"
    node $cli focus --root $clipProject --request (Join-Path $clipProject "requests\focus.json")
    node $cli revisit --root $clipProject --request (Join-Path $clipProject "requests\focus.json")
    node $cli reconcile --root $clipProject --request (Join-Path $clipProject "requests\reconcile.json")
} finally {
    if (Test-Path -LiteralPath $clipProject) { Remove-Item -LiteralPath $clipProject -Recurse -Force }
}
```

The example request files are explicit inputs. The CLI also accepts JSON from stdin with `--request -`. The last request explicitly runs native checks. The Clip example needs Python and `rustc` for its persistence and Rust checks. It also includes frontend and C# subjects whose runtime behavior needs separate evidence. An unresolved result can therefore be correct.

Use `focus` to retrieve selected meaning, `revisit` to refresh discovery, and `reconcile` to collect scoped verdicts. Provider requests are explicit. A normal context request does not start a compiler or install a language server. See [the reference guide](plugins/conceptor/references/guide.md) for request formats, scoped checks, providers, and evidence limits.

## Plugin skills

- `$conceptor:plan-change` develops an interactive, self-contained proposal without changing the accepted model or implementation.
- `$conceptor:apply-change` accepts and implements a direct request or existing proposal.
- `$conceptor:recover-meaning` recovers governing meaning, current participants, and relevant uncertainty.
- `$conceptor:reconcile-and-learn` reconciles consequential decisions, implementation, and evidence.

An external runner or issue-tracking skill owns issue access, branch and worktree assignment, commit policy, pushes, pull requests, reviews, and publication. It can pass the selected root, request, acceptance criteria, and an opaque source identity and revision to Conceptor. Conceptor does not interpret tracker IDs. These external workflow skills are separate from this plugin's implementation.

Create a portable package with `npm.cmd run pack:plugin` after `setup:plugin`. The plugin's own lockfile and dependency directory supply the bundled runtime. The root package supplies test tooling. Unpack the archive and use its `package` directory as the plugin root. The local marketplace uses the prepared bundle under `.plugin-build/conceptor`. `$onepersonlabs:refresh-local-plugins` prepares and installs `conceptor@conceptor` in reachable Windows and WSL user homes. Preparation requires Node.js 24+, npm, and `tar`.

## Language evidence

| Subject | Available observation route | Scope of verification |
| --- | --- | --- |
| JS, TS, JSX, TSX | Explicit LSP server; native checks | Protocol tests, Clip JavaScript runtime checks, and real TS/TSX navigation with a version-provenance gap. |
| Python, Rust, C# | Explicit LSP server; native checks | Real Python navigation and Rust symbols; Clip Python/Rust runtime checks. C# runtime unrun here because no .NET SDK is installed. |
| HTML | Packaged HTML language service | Document symbols and local reference highlights. HTML diagnostics are an explicit gap. |
| CSS, SCSS | Packaged CSS language service | Symbols, definitions, references, and diagnostics. |
| Tauri, NativeScript, React Native | Source/message discovery and native checks | Example seams; full framework integration remains unverified. |
| Source-bound imported facts | Explicit JSON index import | Current source bindings and fact scope are checked. |

LSP navigation does not establish a complete cross-language graph. The provider reports its capabilities, source inputs, and gaps. Static observations cannot establish runtime delivery or timing. New consumers require applicable check coverage before they receive support.

## Development

```powershell
npm.cmd test
```

The deterministic tests make no AI calls. The [implementation interfaces](docs/interfaces.md) describe runtime contracts; [applying Conceptor](plugins/conceptor/references/applying-conceptor.md) explains how to use meaning and evidence during a change. This documentation describes the designed workflow; it does not establish that native skill selection was tested in an AI session.
