# Conceptor reference

Use [Applying Conceptor](applying-conceptor.md) to turn meaning, participant selection, and evidence into implementation decisions and maintain affected Lenses. This guide owns artifact syntax and helper operation details.

## Project state

Conceptor is active when `.conceptor/` exists at the selected repository root. Resolve the nearest repository root; a nested repository or a worktree has its own `.conceptor/` and target. The CLI does not activate, deactivate, or report activation. There is no marker file, external activation registry, lifecycle hook, or injected instruction file.

## Authority and storage

Store authored Markdown with YAML frontmatter under `.conceptor/meaning/`. Concepts, typed Relations, Projection Units, Pattern Candidates, and Projection Lenses supply navigation and scoped evidence. Authoritative meaning remains usable without this plugin. Use Git history instead of archive directories.

Every meaning file has `id`, `kind` (`concept`, `lens`, or `pattern`), `title`, and `status` (`accepted`, `candidate`, or `retired`). Put reasons, exceptions, examples, alternatives, and reopening assumptions in the Markdown body. Keep summaries linked to these files.

Keep current source lineage in the owning meaning record, including opaque request identities and revisions when they govern an accepted decision. Explain relevant supersession there so an older repeated request cannot silently restore obsolete meaning. Preserve this rationale before deleting the live apply plan; use Git for execution history.

Concept `conditions` contain `id`, `text`, `evidence` (`runtime` or `static`), and optional `allowsAbsence`. Typed `relations` contain `type`, `target`, and `status` (`observed` or `accepted`). Pattern Candidates contain `concepts`, `examples`, `counterexamples`, `alternatives`, and optional `lens`. Set a Pattern to `accepted` only through an explicit meaning decision.

### Apply plan and bounded recovery

While implementation remains, `.conceptor/APPLY_PLAN.md` records accepted request identities and revisions, a concise intent summary, the affected target and starting state, remaining implementation units in dependency order, and essential reasons, decisions, uncertainties, and recovery information. It contains no completed-task history, transcript, raw logs, or duplicate meaning. Remove a unit in the commit that completes it; remove the whole plan in the final verified completion commit. The runner or native workflow owns GitHub issues, branches, commits, and publication.

The plan is limited to 64 KiB. Atomic replacement may use exactly one fixed sibling, `.conceptor/APPLY_PLAN.md.pending`, with a 64 KiB limit. This path is ignored by Git. A pending file requires ownership checks and reconciliation before another write. Do not delete unresolved state by age. No `work/`, `archive/`, `cache/`, verification-output, or assessment-report directory is created.

#### Apply-plan API

The runtime exports `applyPlan(root, request)` from `runtime/apply-plan.mjs`. The CLI runs the same API:

```text
node PLUGIN_ROOT/runtime/cli.mjs apply-plan --root PROJECT_ROOT --request -
```

It reads one JSON object from standard input and writes one JSON result to standard output. Use `--request REQUEST.json` if a request file already exists. No request file is needed. `--root` accepts a path from the current directory; the CLI resolves it to the selected repository or worktree root. That root must contain a physical `.conceptor/` directory. The ESM API requires the absolute selected root. The pending-file path must already be ignored by Git before mutation. The CLI does not infer Codex permissions. For a mutating API call, pass `readOnly: true` or `permissionMode: "plan"` when the host is read-only or in Plan Mode. The caller remains responsible for respecting the host's actual permissions.

An ESM caller passes the same JSON object directly and receives the result object without parsing stdout:

```js
import path from "node:path";
import { pathToFileURL } from "node:url";

const pluginRoot = "ABSOLUTE_PLUGIN_ROOT";
const projectRoot = "ABSOLUTE_PROJECT_ROOT";
const { applyPlan } = await import(pathToFileURL(path.join(pluginRoot, "runtime/apply-plan.mjs")));
const result = await applyPlan(projectRoot, { action: "read" });
```

The `read` action is the default. It returns `{status, revision, plan, pending}`. `status` is `active`, `absent`, or `recovery-required`. `revision` is the SHA-256 hash of the exact plan bytes, or `null` when no plan exists. `plan` contains `metadata`, ordered `units`, `revision`, and serialized Markdown. A pending result reports validity, base and pending revisions, byte size, and a parse error when invalid.

Use `accept` to admit a request or revision and plan the combined remaining work. It requires `expectedRevision`, `request`, `target`, and `units`. `expectedRevision` is the value returned by `read`, or `null` for an empty plan. `request` has nonempty `content` and optional `id`, `revision`, and `source`. Only `accept` can generate missing ID and revision values; it assigns a local ID and hashes the content when those fields are absent. When a plan already exists, a new request or changed revision requires `reassessed: true`. Reusing the same ID, revision, content, and source is a no-write resume. Conflicting content or source for that unchanged identity is an error.

Each unit has an `id`, one-line `text`, and optional `dependsOn` array. IDs must be unique. Every dependency must name a unit that appears earlier in the list. The API stores each as a remaining task and writes dependencies on a separate line:

```markdown
- [ ] `inspect-export` -- Trace the current export path
- [ ] `preserve-file` -- Keep the old file on write failure
  depends-on: ["inspect-export"]
```

Remove a completed unit in the commit that completes it. Do not mark it `[x]`. An accepted request identity cannot be rewritten by `update`; accept a new revision instead. `update` requires an existing plan and its current `expectedRevision`. It can replace `target`, `baseline`, `decisions`, `uncertainties`, or the remaining `units`. Changing `target` or `baseline` also requires `reassessed: true`. To remove a canceled request, include the remaining `requests` and set both `reassessed: true` and `cancellationReconciled: true`. Preserve work that other accepted requests still need.

This PowerShell example admits a request without creating a transport file. Read first and supply that result's revision when a plan already exists. This example assumes the plan is empty and the project has the required `.gitignore` entry:

```powershell
$planRequest = @{
    action = "accept"
    expectedRevision = $null
    request = @{
        id = "export-preservation"
        revision = "1"
        content = "Keep the existing export file if writing the replacement fails."
    }
    target = "Preserve exported data on write failure."
    units = @(
        @{ id = "inspect-export"; text = "Trace the current export and write-failure paths" },
        @{ id = "preserve-file"; text = "Preserve the old file when a replacement write fails"; dependsOn = @("inspect-export") }
    )
}
$planRequest | ConvertTo-Json -Depth 8 | node PLUGIN_ROOT/runtime/cli.mjs apply-plan --root PROJECT_ROOT --request -
```

On success, `accept` and `update` return `{revision, plan}`; an idempotent same-request acceptance also returns `unchanged: true`. A stale revision fails without replacing the current plan. An oversized candidate also fails before replacement. The CLI writes errors to stderr and exits with code 2; ESM calls throw. Re-read and reconcile before retrying.

Use `recover` only after inspecting the actual checkout and both records. It requires `mode: "install"` or `"discard"`, matching `expectedRevision` and `expectedPendingRevision`, and all three confirmations: `ownedCheckout: true`, `soleRecoveryActor: true`, and `reconciled: true`. The runtime has no recovery lock; confirm there is no other recovery actor. Installing requires a valid pending record based on the current plan. The result is `{revision, recovered: "installed"|"discarded"}`.

Use `finish` to remove the plan after verification or reconciled cancellation. It requires the current `expectedRevision` and either `verified: true` (with no remaining units) or `cancellationReconciled: true`. Clear all uncertainties first. It returns `{revision: null, finished: true}`. A mutation refuses an existing pending file until `recover` resolves it. Writers create the fixed pending file exclusively and remove their owned pending file after replacement or a recoverable write failure. An interruption or cleanup failure can leave the pending file for explicit recovery.

The runtime does not persist evidence in a cache. Results are returned directly with bounded check output. A caller may supply prior observations or receipts; revalidate their project, source, and meaning bindings before reuse. A missing baseline reports `baseline: missing`; added/removed history remains unknown. Missing evidence is not support or permission to run a check. Keep original mismatches and unresolved evidence in the live apply plan or caller handoff when they affect remaining work.

## Projection Lenses

A Lens names conditions as `concept-id#condition-id`. A selector contains `id`, project-relative glob `patterns`, optional `role`. Select the relevant population independently of the property under test.

Each check has `id`, `command`, `args`, `selectors`, `conditions`, and `evidence`. Optional fields are `target`, additional input glob `inputs`, and `env`. Commands execute without a shell. Pass arguments separately. Name a real executable available to the native host.

Declare `coverage` as the explicit participant paths that the command tests. Use `coverage: selection` only when the command evaluates every current selected participant. Wildcard selection does not make a check cover every discovered file. Without `coverage`, only literal selector paths establish coverage. A new consumer stays unresolved until a check covers it.

```yaml
---
id: playback
kind: lens
title: Playback keeps source notes
status: accepted
conditions: [clip#playback-isolation]
selectors:
  - id: playback-source
    patterns: [js/*.mjs]
    role: playback
checks:
  - id: playback-check
    command: node
    args: [checks/playback.mjs]
    selectors: [playback-source]
    conditions: [clip#playback-isolation]
    evidence: runtime
    coverage: [js/playback.mjs, js/export.mjs]
    inputs: [checks/playback.mjs, shared/clip.json]
---
```

Every verdict names condition, selector or participants, selection status, evidence, status (`supported`, `mismatch`, or `unresolved`), and reason. Required empty selection is unresolved unless the condition allows absence. A successful scoped check does not establish unobserved language behavior. Preserve supported evidence when another observation fails.

A Lens with `checks: []` supplies navigation without behavioral support. Helper verdicts cover named conditions, not every requirement in a Concept's prose. Keep relevant prose obligations and independent evidence visible in the apply plan or caller handoff when they affect remaining work. See [Lens maintenance](applying-conceptor.md#maintain-affected-lenses) for selector, binding, and evidence upkeep.

Projection Units bind meaning to participants discovered by a Lens. Treat a binding as current only when its source and membership snapshots still match. Use `revisit` after source changes or new consumers. Do not treat an inventory match as resolved cross-language semantics.

The helper returns file-based Units. They can represent coordinated functions, components, styles, or protocol declarations. Use provider symbol and location facts to investigate finer subjects within those files. Participation identifies a place to investigate; it does not establish that every symbol in the file implements the Concept.

## CLI and helper requests

The installed package needs Node.js 24 and its declared npm runtime dependencies. Resolve `PLUGIN_ROOT` from the actual installed plugin location. Runtime is packaged inside the plugin; do not resolve another Conceptor version or assume a workspace checkout.

```text
node PLUGIN_ROOT/runtime/cli.mjs focus --root PROJECT --request REQUEST.json
```

The CLI accepts `focus`, `revisit`, `reconcile`, `observe`, and `apply-plan`. Request input can be a JSON file or stdin with `--request -`. Use absolute project and request paths when the current directory differs. `focus`, `revisit`, and `reconcile` accept selective `concepts`, `lenses`, `paths` and `query`. `reconcile` runs native checks only with `runChecks: true`; otherwise it uses only explicitly supplied and still-applicable prior receipts. The helper does not install providers or build an implicit semantic index.

```json
{"concepts":["clip"],"lenses":["clip-playback"],"runChecks":true}
```

ESM callers import `focus`, `revisit`, and `reconcile` from `PLUGIN_ROOT/runtime/conceptor.mjs` and pass `(root, request)`. Provider observations are exported from `runtime/providers/index.mjs`. JSON stdin avoids a transport file when a caller does not already have a file. There is no general-purpose work journal or automatic source repair.

`focus.paths` matches exact project-relative files in discovered Lens populations; it is not a glob or general source search. `focus.related` returns pointers, including outgoing Relation endpoints, not all incoming Relations or a transitive impact closure. Use the [bounded incoming-Relation search](applying-conceptor.md#recover-the-governing-meaning) when governing constraints or dependents matter.

For `revisit`, request `paths` supply the discovery boundary patterns. Compare with an explicitly supplied and still-bound prior observation when available. Changed paths inside those boundaries but outside current Lens selection become discovery questions. Without a valid baseline, change history is unknown. Unchanged consumers and files outside declared boundaries are not automatically discovered. A literal `query` searches selected source and these boundaries. Declared Lens observations run on demand. Ordinary `focus` does not run them. Refreshing selection does not repair an incomplete authored selector.

Check receipts bind relevant meaning/Lens records, declared input scope, check configuration, and execution dependencies. Changed membership or inputs can make a receipt unresolved. Do not silently backdate it; keep independently applicable native evidence separate. See [evidence reuse](applying-conceptor.md#compare-results-and-reassess-the-premise) for the distinction.

## Provider setup

An `observe` request selects `provider` (`inventory`, `lsp`, `html`, `css`, or `index`), `operation` (`symbols`, `definitions`, `references`, `diagnostics`, or `relationships`), and scoped `files` or `patterns`. Use zero-based `position: {line, character}` for navigation. Inventory can locate literal `text`, including framework names, but does not resolve semantics.

HTML and CSS providers use packaged language services. CSS supports CSS and SCSS, not indented `.sass`. LSP uses a server explicitly supplied by the repository; configure its executable `command` and separate `args`. Install and pin that server through the repository's normal tooling. Do not infer an available language server from a filename.

Run a scoped request through the native CLI, using the installed plugin location:

```text
node <plugin-root>/runtime/cli.mjs observe --root <project-root> --request <request.json>
```

For an existing semantic index, supply `config.path`. The JSON artifact has `version: 1`, a nonempty `inputs` array of `{path, hash}` source bindings, and a `facts` array. Facts identify `kind` (`symbol`, `definition`, `reference`, `diagnostic`, or `relationship`), project-relative `path`, and native range. A fact with `target.path` also needs that target in `inputs`. Compute source hashes with the runtime `hash` helper. Stale or unbound facts are rejected with gaps. The index provider reads that artifact; it does not create it.

Use only operations supported by the selected provider. HTML supports symbols and document-local reference highlights. CSS supports symbols, definitions, references, and diagnostics. Results contain provider identity, operation, `complete`, `partial`, or `unavailable` status, facts, inputs, capabilities, gaps, and scope. Read capabilities and gaps before using a fact. LSP references are scoped navigation evidence, not a proof that every consumer was found. Changed source or discovery during analysis makes currentness unresolved.

Provider metadata separates `adapterVersion` from `engine.name` and `engine.version`. Direct services report their installed package version. LSP uses the server's initialization identity. A missing engine version remains an explicit provenance gap. `requestBinding` binds the operation, scope, position, configuration, and literal query. Index artifacts can identify their producer in `provider: {name, version}`. Read all gaps before reusing evidence.

### Native observations for Python, Rust, and TypeScript

Use the same candidate-navigation procedure for each language. Find the actual import, re-export, call, or callback registration in the scoped source. Query a definition at that usage and compare its target with the changed owner. A reference query can stop at an alias; an empty result does not prove that no consumer exists. See [discovery choices and limits](applying-conceptor.md#choose-deterministic-discovery-for-the-missing-fact).

Resolve executable paths from the repository's tooling. On Windows, use the actual executable, such as Node plus a JavaScript server entry, rather than a PowerShell shim. Keep executable arguments separate and use native filesystem paths for server-specific options. The examples below assume project-local packages where shown. Adjust paths, files, and zero-based positions to the inspected project; they do not install tools or establish compatibility.

**Python.** Inspect the actual interpreter/environment, `pyrightconfig.json` or `pyproject.toml`, package roots, imports, and stubs. Pyright's [configuration](https://github.com/microsoft/pyright/blob/main/docs/configuration.md) controls project selection and environment assumptions. This request selects a candidate at line 2, character 12:

```json
{
  "provider": "lsp", "operation": "definitions",
  "files": ["src/consumer.py"], "position": {"line": 2, "character": 12},
  "timeoutMs": 30000,
  "config": {"command": "node", "args": ["./node_modules/pyright/langserver.index.js", "--stdio"]}
}
```

Exercise the actual interpreter and project before reusing the result. With Pyright 1.1.414 and a Python 3.14 package, scoped definitions resolved aliased calls and callback values; references segmented across renamed bindings. Missing reported engine version and rejected external diagnostic paths remained explicit gaps. A file diagnostic notification is not a generic workspace-readiness contract. Dynamic imports, monkey-patching, environment changes, and uninspected stubs remain outside these examples.

**Rust.** Inspect the actual Cargo workspace or `rust-project.json`, target, enabled features, generated sources, build scripts, and procedural macros. This example uses an explicit [non-Cargo project](https://github.com/rust-lang/rust-analyzer/blob/master/docs/book/src/non_cargo_based_projects.md) and rust-analyzer's [persistent server-status notification](https://github.com/rust-lang/rust-analyzer/blob/master/docs/book/src/contributing/lsp-extensions.md):

```json
{
  "provider": "lsp", "operation": "definitions",
  "files": ["src/consumer.rs"], "position": {"line": 1, "character": 26},
  "timeoutMs": 30000,
  "config": {
    "command": "rust-analyzer", "args": [],
    "initializationOptions": {
      "linkedProjects": ["rust-project.json"], "checkOnSave": false,
      "cargo": {"buildScripts": {"enable": false}}, "procMacro": {"enable": false}
    },
    "experimentalCapabilities": {"serverStatusNotification": true},
    "readiness": {"notification": "experimental/serverStatus", "equals": {"health": "ok", "quiescent": true}}
  }
}
```

A small `no_std` crate with rust-analyzer 1.98.1 resolved the candidate definitions after its status matched. The cold request without that gate returned no definitions. Ready reference queries still missed aliased consumers. This fixture does not qualify Cargo projects, macros, feature combinations, generated code, or target-specific dependencies. Disabling those mechanisms in a real project that needs them leaves coverage incomplete; do not copy these settings to hide missing dependencies.

**TypeScript.** Inspect the installed package's actual entry points, `tsconfig.json`, module resolution, and generated/declaration inputs. A missing `tsserver.js` does not establish that semantic navigation is unavailable. TypeScript 7.0.2 supplies a [native LSP entry](https://github.com/microsoft/TypeScript/blob/v7.0.2/tsc/cmd/tsgo/main.go): resolve the native compiler executable from the installed package's launcher, set it as `config.command`, and use `config.args: ["--lsp", "--stdio"]`. Use the native executable directly, not a shell shim or a substituted TypeScript 6 compiler.

That native 7.0.2 route resolved an actual TypeScript call to its imported transport function through this CLI. The native server then exited with code 1 during shutdown; the observation retained `lsp-shutdown-failed` and remained partial. This establishes that scoped navigation route, not complete project qualification or clean shutdown for that server version.

For a project that instead uses a compatible classic compiler/server pair, inspect its `tsserver.js`. The language server's [configuration](https://github.com/typescript-language-server/typescript-language-server/blob/master/docs/configuration.md#tsserver-options) permits full semantic-server routing for short-lived observations:

```json
{
  "provider": "lsp", "operation": "definitions",
  "files": ["src/consumer.ts"], "position": {"line": 1, "character": 29},
  "timeoutMs": 30000,
  "config": {
    "command": "node", "args": ["./node_modules/typescript-language-server/lib/cli.mjs", "--stdio"],
    "initializationOptions": {"disableAutomaticTypingAcquisition": true, "tsserver": {"useSyntaxServer": "never"}}
  }
}
```

An explicit `tsserver.path`, when needed, must identify the compatible compiler in the host's native path form. Language-server 6.0.1 with TypeScript 6.0.3 resolved the exercised aliases; the default syntax-server routing had returned a sparse result during startup. That separate example does not qualify TypeScript 7. Disabled automatic type acquisition prevents downloads, and missing types remain a coverage limit. Missing reported engine version remains a provenance gap.

The three examples verify candidate identities, not complete dependencies. A stored callback's invocation may resolve only to its storage binding. Read the registration and dispatch contract. Cross-language messages, foreign-function calls, and subprocess/RPC boundaries need an explicit sender/schema/receiver trace in the existing evidence; no language server here establishes that edge.

### Optional LSP readiness contract

`config.experimentalCapabilities` supplies only initialize's `capabilities.experimental`; it cannot replace the adapter's existing capabilities. `config.readiness` names a server `notification` and a nonempty `equals` map of expected top-level primitive fields. Configure it only from an actual supported server contract. A gate requires an explicit positive `timeoutMs` resource budget; the examples' 30 seconds are not a required analysis duration or correctness threshold.

The handler is active before initialize. An early match remains observable until a later notification supersedes it. Before each semantic request, the latest observed parameters must match. Cancellation, failure, or the caller's same budget ends the wait and invokes existing child cleanup. No sleep, empty-result retry, or silent bypass is used. The optional result `readiness` includes the notification, expected fields, latest `observed` parameters, and `matched` or `unconfirmed` status. An unmet gate retains source facts and reports `lsp-readiness-unconfirmed`.

A matched persistent status is not correlated to a particular `didOpen` or source version. It does not prove complete project analysis or consumer discovery. Requests without a gate make no readiness claim. Operation-level `complete`, source currentness, and semantic completeness remain separate; `scope.semanticCompleteness` stays `unclaimed`.

Conceptor captures requested and returned source files, not every environment/configuration input used by a server. Preserve relevant uncaptured inputs with a separate native source/configuration snapshot before reuse. Source-bound index artifacts can include those dependencies explicitly. No example authorizes another compiler, tool installation, implicit repository-wide indexing, or a persistent service.

## What hashes establish

Runtime hashes reject stale provider facts, invalidate inapplicable check results and identify source changes within declared scopes. They identify bytes, not behavior, coverage, user intent or human comprehension. Supplied prior evidence also needs matching project identity, meaning, scope, and relevant source bindings.

Keep accepted meaning in its owning Concept or Relation. Retain a Pattern only when it can guide a plausible future decision, with applicability and counterexamples. A repaired example alone is not independent evidence for that Pattern.
