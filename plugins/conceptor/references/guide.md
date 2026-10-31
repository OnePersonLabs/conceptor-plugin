# Conceptor reference

Use [Applying Conceptor](applying-conceptor.md) to turn meaning, participant selection, and evidence into implementation decisions and maintain affected Lenses. This guide owns artifact syntax and helper operation details.

## Project state

Conceptor is active when `.conceptor/` exists at the selected repository root. Resolve the nearest repository root; a nested repository or a worktree has its own `.conceptor/` and target. The CLI does not activate, deactivate, or report activation. There is no marker file, external activation registry, lifecycle hook, or injected instruction file.

## Authority and storage

Store authored Markdown with YAML frontmatter under `.conceptor/meaning/`. Concepts, typed Relations, Projection Units, Pattern Candidates, and Projection Lenses supply navigation and scoped evidence. Authoritative meaning remains usable without this plugin. Use Git history instead of archive directories.

Every meaning file has `id`, `kind` (`concept`, `lens`, or `pattern`), `title`, and `status` (`accepted`, `candidate`, or `retired`). Put reasons, exceptions, examples, alternatives, and reopening assumptions in the Markdown body. Keep summaries linked to these files.

Keep current source lineage and supersession rationale in the owning meaning record when they govern an accepted decision. The caller owns task identity and status; Git preserves committed execution history.

Concept `conditions` contain `id`, `text`, `evidence` (`runtime` or `static`), and optional `allowsAbsence`. Typed `relations` contain `type`, `target`, and `status` (`observed` or `accepted`). Pattern Candidates contain `concepts`, `examples`, `counterexamples`, `alternatives`, and optional `lens`. Set a Pattern to `accepted` only through an explicit meaning decision.

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

Every verdict names condition, selector or participants, selection status, evidence, status (`supported`, `mismatch`, or `unresolved`), and reason. Required empty selection is unresolved unless the condition allows absence. A successful scoped check does not establish unobserved language behavior. Return supported and failed observations together in the current result; do not persist them merely to make them durable. Save a receipt only when a named consumer needs it to support an exact active claim or recover an interrupted operation. Bind it to the meaning, source/version, execution target, and validity conditions it supports. Remove it when that consumer completes, the evidence is superseded or invalidated, or the operation is abandoned, subject to a bounded recovery window. Reading or copying it does not renew that window. Keep accepted conclusions in authored meaning records; those records do not imply permanent retention of raw outputs.

A Lens with `checks: []` supplies navigation without behavioral support. Helper verdicts cover named conditions, not every requirement in a Concept's prose. Keep relevant prose obligations and independent evidence visible in the caller's task context when they affect remaining work. See [Lens maintenance](applying-conceptor.md#maintain-affected-lenses) for selector, binding, and evidence upkeep.

Projection Units bind meaning to participants discovered by a Lens. Treat a binding as current only when its source and membership snapshots still match. Use `revisit` after source changes or new consumers. Do not treat an inventory match as resolved cross-language semantics.

The helper returns file-based Units. They can represent coordinated functions, components, styles, or protocol declarations. Use provider symbol and location facts to investigate finer subjects within those files. Participation identifies a place to investigate; it does not establish that every symbol in the file implements the Concept.

## CLI and helper requests

The installed package needs Node.js 24 and its declared npm runtime dependencies. Resolve `PLUGIN_ROOT` from the actual installed plugin location. Runtime is packaged inside the plugin; do not resolve another Conceptor version or assume a workspace checkout.

```text
node PLUGIN_ROOT/runtime/cli.mjs focus --root PROJECT --request REQUEST.json
```

The CLI accepts `focus`, `revisit`, `reconcile`, and `observe`. Request input can be a JSON file or stdin with `--request -`. Use absolute project and request paths when the current directory differs. `focus`, `revisit`, and `reconcile` accept selective `concepts`, `lenses`, `paths` and `query`. `reconcile` runs native checks only with `runChecks: true`; otherwise it uses only explicitly supplied and still-applicable prior receipts. The helper does not install providers or build an implicit semantic index.

```json
{"concepts":["clip"],"lenses":["clip-playback"],"runChecks":true}
```

ESM callers import `focus`, `revisit`, and `reconcile` from `PLUGIN_ROOT/runtime/conceptor.mjs` and pass `(root, request)`. Provider observations are exported from `runtime/providers/index.mjs`. JSON stdin avoids a transport file when a caller does not already have a file. There is no general-purpose work journal or automatic source repair.

`focus` without selectors returns an index with identity, kind, title, status and file. Explicit `concepts` and `lenses` must name nonretired records of the correct kind; unknown, retired or wrong-kind identities are errors. A query searches authored frontmatter values and body text, not derived file paths or hashes. Matching is lexical discovery, not a ranking or proof of source coverage.

`focus.paths` matches exact project-relative files in discovered Lens populations; it is not a glob or general source search. `focus.related` returns pointers with record status, including governing Concepts of selected Lenses and direct incoming/outgoing Relation endpoints. Explicit/query Lens selection returns governing Concept pointers for the caller to retrieve; path selection also hydrates those Concepts. Read Relation status in its source record. This is one-hop navigation, not a transitive impact closure or discovery of unmodeled prose dependencies. Use [bounded source recovery](applying-conceptor.md#recover-the-governing-meaning) when governing constraints or dependents remain unclear.

`revisit` and `reconcile` require accepted Concept/Lens identities. Both return `meaningCoverage`: each explicitly requested Concept's file, meaning hash and declared conditions with the selected Lenses that name them. `uncoveredRequests` identifies conditions without selected Lenses, or a requested Concept with no declared conditions. Reconciliation leaves these gaps unresolved at the aggregate level even when individual observed verdicts are supported; a mismatch still takes precedence. Lens-only requests retain their narrower condition scope. An empty gap list does not establish completeness of prose, historical sources or a design. Use the [source and capability comparison](applying-conceptor.md#check-source-coverage) for those judgments.

For `revisit`, request `paths` supply the discovery boundary patterns. Compare with an explicitly supplied and still-bound prior observation when available. Changed paths inside those boundaries but outside current Lens selection become discovery questions. Without a valid baseline, change history is unknown. Unchanged consumers and files outside declared boundaries are not automatically discovered. A literal `query` searches selected source and these boundaries. Declared Lens observations run on demand. Ordinary `focus` does not run them. Refreshing selection does not repair an incomplete authored selector.

Check receipts bind relevant meaning/Lens records, declared input scope, check configuration, and execution dependencies. Changed membership or inputs can make a receipt unresolved. Do not silently backdate it; keep independently applicable native evidence separate while its consumer needs it. Conceptor returns receipts to the caller and does not keep an evidence cache. Callers that persist one own its consumer, validity checks, cleanup on completion/cancellation/supersession, and maximum recovery window. See [evidence reuse](applying-conceptor.md#compare-results-and-reassess-the-premise) for the distinction.

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
