# Conceptor implementation interfaces

Runtime uses Node.js 24 ESM. Runtime source owns helper contracts. Product meaning belongs to the selected repository; task status belongs to the caller. An outer runner owns checkout assignment, issue tracking, branches, commits, and publication.

## Project root and activation

The selected repository root is active when it contains `.conceptor/`. A nested repository and each worktree have separate roots and targets. Runtime callers pass the selected root explicitly with `--root`. There is no activation API, external activation registry, or activation CLI command.

## Meaning files

Use Markdown with YAML frontmatter. Required fields: `id`, `kind` (`concept`, `lens`, `pattern`), `title`, and `status` (`accepted`, `candidate`, `retired`). The body holds reasons, examples, alternatives, and reopening assumptions. Concept `conditions` contain `id`, `text`, `evidence` (`runtime` or `static`), and optional `allowsAbsence`. Relations contain `type`, `target`, and `status` (`observed` or `accepted`).

A Lens has conditions expressed as `concept-id#condition-id`. Its selectors contain `id`, project-relative glob `patterns`, and optional `role`. Selection describes the relevant population, not the property being checked. Checks contain `id`, `command`, `args`, selector IDs, condition references, and `evidence`; optional fields include `target`, additional project-relative `inputs`, and `env`. Native commands run without a shell. Lens observations are provider requests. A Pattern has `concepts`, `examples`, `counterexamples`, `alternatives`, and optional `lens`; promotion is an explicit meaning edit, not automatic inference.

## Helper functions and CLI

Export `focus(root, request)`, `revisit(root, request)`, and `reconcile(root, request)` from `runtime/conceptor.mjs`. Requests may select concepts, lenses, paths, and query. Reconciliation runs native checks only when `runChecks: true`. A caller may pass one complete earlier revisit or reconcile result in `request.previous`. Results include `format: "conceptor-evidence/1"` and the canonical project root. A revisit can reuse `previous.selections` or `previous.discovery.selections`, and `previous.boundary.scope` or `previous.discovery.boundary.scope`. Reconciliation can reuse `previous.receipts`. The runtime revalidates format, project, source, and meaning bindings. Other-project or other-format results provide no reusable baseline or receipts. The caller packet is not modified. No evidence cache is persisted. Check stdout and stderr are returned inline with a 64 KiB bound per stream.

The CLI commands are `focus`, `revisit`, `reconcile`, and `observe`; common options are `--root PATH` and `--request REQUEST.json`. Use `--request -` to read JSON from stdin. No request transport file is required. The helper does not install providers or build an implicit semantic index.

Every verdict names condition, selector or participants, selection status, evidence, status (`supported`, `mismatch`, or `unresolved`), and reason. Original mismatches remain visible in the returned result even when a later observation makes them inapplicable. The caller retains evidence that matters to remaining work in its selected task record.

`focus` validates explicit `concepts` and `lenses` against nonretired records of the respective kind. Its lexical query searches authored metadata and body. Index and related pointers include `status`; related pointers include direct incoming/outgoing Relations and governing Concepts of selected Lenses, without transitive closure. A related pointer does not load its body or accept an observed Relation.

`revisit` and `reconcile` validate explicit Concept requests as accepted Concepts. Their `meaningCoverage` contains `requestedConcepts: [{concept, file, meaningHash, conditions: [{condition, lenses}]}]`, `uncoveredRequests: [{concept, condition?, reason}]`, and a `scope` limitation. A declared condition without a selected Lens, or a requested Concept without declared conditions, produces an uncovered request. Reconcile aggregate status is unresolved when these gaps remain, unless a mismatch takes precedence; supported individual verdicts are preserved. This compares explicit Concept requests with selected Lens condition references only. It does not establish complete source capture, prose coverage, scenario compatibility or whole-design acceptance.

Selection and boundary results report `baseline: available|missing`. Without a valid prior snapshot, added, removed, and changed lists are empty because change history is unknown. Current scope and participant selection remain available. Missing evidence is not support and does not authorize running checks.

## Shared filesystem functions

`runtime/state.mjs` exports `projectPath(root, relative)`, `hash(value)`, `captureInputs(root, paths)`, `discover(root, patterns)`, `captureScope(root, patterns, extraPaths=[])`, and `readJson(path)`. Inputs are `{path, hash}`; missing files have `hash: null`. `captureScope` returns `{patterns, inputs, fingerprint}`; the fingerprint covers membership and contents. These helpers do not write project task state.

`discover` returns sorted, unique project-relative file paths with forward slashes and refuses outside-root targets. Glob arrays support exclusions, brace alternatives and ranges, and extglobs. Matching includes dotfiles and is case-sensitive. Missing paths can produce an empty population. Other filesystem errors reject the scan; a partial scan must not establish an empty population.

## Provider boundary

`runtime/providers/index.mjs` exports `observe(root, request)`. Request `provider` is `inventory`, `lsp`, `html`, `css`, or `index`. Operations include symbols, definitions, references, diagnostics, and relationships. `files` and `patterns` identify scope; `position` is `{line,character}`; `config` contains explicit server command/args for LSP, or index path for index. Inventory may use literal text to locate framework names without claiming resolved semantics.

Return `{provider:{id,adapterVersion,engine:{name,version}}, requestBinding, operation, status:complete|partial|unavailable, facts, inputs, capabilities, gaps, scope}`. Inputs use `captureInputs`. Facts identify path/range and native fact kind. Capture relevant scope before and after analysis; changed scope makes currentness unresolved. Failures retain available source facts and explicit gaps. LSP results are scoped navigation evidence, not a completeness proof. Do not invent a custom parser, type checker, or cross-language graph.

LSP config may include `experimentalCapabilities`. This object is sent only as initialize `capabilities.experimental`. Optional readiness is `{notification, equals}`. `notification` is a nonempty server notification name. `equals` is a nonempty map of top-level primitive values (string, finite number, boolean, or null). This gate requires an explicit positive `request.timeoutMs`. Register it before initialize. Retain early notifications. Each later notification supersedes the earlier status. Before each semantic request, the latest observed parameters must match every expected field. The same caller budget, cancellation, failure, and child cleanup apply. There is no new timeout, sleep, retry, or bypass.

A configured gate adds `readiness:{notification, equals, status:matched|unconfirmed, observed}` to the result. `observed` is the latest received parameters or null when none arrived. An unmet gate adds `lsp-readiness-unconfirmed` and retains independent source evidence. A matched status is a persistent observation. It is not an acknowledgment of the current source version or proof of complete discovery. Requests without a gate keep their behavior and make no readiness claim. Operation status and `scope.semanticCompleteness` stay separate. Semantic completeness is unclaimed even after a match. Definitions can verify candidate identities in Python, Rust, and TypeScript. Reference results need not traverse renamed imports or re-exports. No provider result establishes runtime callback targets or cross-language protocol edges.

Checks may declare coverage as explicit participant paths, or `coverage: selection` when the command genuinely evaluates the current selected population. Default coverage includes only literal selector paths. Wildcard members do not inherit support from a check unless coverage includes them. Check scope is authored evidence applicability, not proof that arbitrary check code is complete.

These are cooperative integrity conventions, not a sandbox or universal certificate.
