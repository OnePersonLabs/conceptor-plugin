# Conceptor implementation interfaces

Runtime uses Node.js 24 ESM. Runtime source and these interfaces own helper contracts. The native root owns integration and shared meaning. Assign one writer per mutable surface and preserve concurrent edits.

## Activation

`activeRoot(start)` returns the nearest locally activated canonical ancestor inside the nearest Git boundary, or undefined. A `.git` directory or worktree file stops search after its own activation check. `projectRoot(start)` returns that active root, the nearest Git root, or the original directory.

`activate(root)` writes and verifies external per-user state keyed by canonical physical root, then removes an empty legacy `.conceptor/active` marker. Other project files are untouched. `deactivate(root)` removes only local opt-in and any empty legacy marker. `activationStatus(start)` returns status, root, stateFile and legacyMarker; it creates no state. CLI defaults to `projectRoot(cwd)`; `--root` selects an explicit root. Windows and WSL activation are independent.

Focus, revisit, reconciliation and providers check activation before reading project data. Inactive CLI calls do not read their request files. The plugin uses native skill discovery and has no hooks or injected instruction file.

## Meaning files

Use Markdown with YAML frontmatter. Required fields: id, kind (concept, lens, pattern), title, status (accepted, candidate, retired). The body holds reasons, examples, alternatives, and reopening assumptions. Concept conditions are objects with id, text, evidence (runtime or static), and optional allowsAbsence. Relations are objects with type, target, and status (observed or accepted).

A Lens has conditions expressed as concept-id#condition-id. Its selectors are objects with id, patterns (project-relative globs), optional role. Selection describes the relevant population, not the property being checked. Checks have id, command, args, selectors (IDs), conditions (references), evidence (runtime or static), optional target, inputs (additional project-relative globs), and optional env. Native commands run without a shell. Lens observations are provider requests. A Pattern has concepts, examples, counterexamples, alternatives, and optional lens; promotion is an explicit edit, not automatic inference.

## Helper functions and CLI

Export focus(root, request), revisit(root, request), reconcile(root, request) from runtime/conceptor.mjs. Requests may select concepts, lenses, paths and query. reconcile runs checks only when runChecks=true; otherwise it reuses applicable receipts. CLI accepts: COMMAND --root PATH --request REQUEST.json. Commands: activate, deactivate, status, focus, revisit, reconcile, observe. Retired work requests fail explicitly. There is no automatic provider installation or semantic indexing.

Every verdict names condition, selector/participants, selection status, evidence, status (supported, mismatch, unresolved), and reason. Reconcile returns full original failures in observedMismatches, even if a later check invalidates current applicability. The caller owns cross-call retention.

## External state and evidence cache

`runtime/storage.mjs` owns canonical project identity, local activation files and disposable cache operations. `storagePaths(root)` reports project, home, activation and cache paths without creating them. Defaults and lifecycle are in the [storage reference](../plugins/conceptor/references/guide.md#local-settings-and-disposable-evidence).

Activation is durable user configuration under `projects/`. The flat cache is shared across projects under `cache/`; keys bind cache/plugin version, canonical project and semantic identity. Each cache access prunes entries older than seven days and keeps at most 128 completed entries and 32 MiB. Entries larger than half the cache budget are returned without persistence. Concurrent writers atomically replace entries; eviction can discard reusable evidence but must not turn missing evidence into support. Observations do not create provider caches.

A check receipt includes its source/environment binding, exit outcome and `output` with bounded stdout/stderr strings and truncation flags. Capture retains up to 64 KiB of raw bytes per stream and continues draining after truncation. Receipts are replaced by Lens/check key, with no UUID log folders. Reuse still requires matching meaning, Lens, check, source membership, configuration, execution environment and target.

Selection and boundary results report `baseline: available|missing`. Without a valid prior snapshot, added, removed and changed lists are empty because change history is unknown. Current scope and participant selection remain available.

Conceptor does not own task state, automatic source repair, rollback, compaction cadence, issue tracking or commit policy. Those belong to the native host. Removing disposable evidence cannot remove authored meaning.

## Shared filesystem functions

runtime/state.mjs exports projectPath(root, relative), hash(value), captureInputs(root, paths), discover(root, patterns), captureScope(root, patterns, extraPaths=[]), readJson(path), writeJson(path,value), and writeText(path,text). Inputs are objects {path, hash}; missing files have hash=null. captureScope returns {patterns, inputs, fingerprint}; fingerprint covers membership and contents. Atomically replace individual metadata files. No global observation lock.

discover returns sorted, unique project-relative file paths with forward slashes and refuses outside-root targets. Glob arrays support exclusions, brace alternatives and ranges, and extglobs. Matching includes dotfiles and is case-sensitive. Missing paths can produce an empty population. Other filesystem errors reject the scan; a partial scan must not establish an empty population.

## Provider boundary

runtime/providers/index.mjs exports observe(root, request). Request provider is inventory, lsp, html, css, or index. Operations include symbols, definitions, references, diagnostics, relationships. files and patterns identify scope; position is {line,character}; config contains explicit server command/args for lsp, or index path for index. Inventory may use literal text to locate framework names without claiming resolved semantics.

Return {provider:{id,adapterVersion,engine:{name,version}}, requestBinding, operation, status:complete|partial|unavailable, facts, inputs, capabilities, gaps, scope}. inputs use captureInputs. Facts identify path/range and native fact kind. Capture relevant scope before and after analysis; changed scope makes currentness unresolved. Failures retain available source facts and explicit gaps. LSP results are scoped navigation evidence, not a completeness proof. Do not invent a custom parser, type checker, or cross-language graph.

LSP config may include experimentalCapabilities, an object sent only as initialize capabilities.experimental. Optional readiness is {notification, equals}, where notification is a nonempty server notification name and equals is a nonempty map of top-level primitive values (string, finite number, boolean, or null). This gate requires an explicit positive request.timeoutMs. Register it before initialize; retain early notifications and let every later notification supersede the earlier status. Before each semantic request, the latest observed parameters must match every expected field. The same caller budget, cancellation, failure, and child cleanup apply; there is no new timeout, sleep, retry, or bypass.

A configured gate adds readiness:{notification, equals, status:matched|unconfirmed, observed} to the result. observed is the latest received parameters or null when none arrived. An unmet gate adds lsp-readiness-unconfirmed and retains independent source evidence. A matched status is a persistent observation, not an acknowledgment of the current source version or proof of complete discovery. Requests without a gate keep their existing behavior and make no readiness claim. Operation status and scope.semanticCompleteness remain separate; semantic completeness is unclaimed even after a match. Definitions can verify candidate identities in Python, Rust, and TypeScript; reference results need not traverse renamed imports or re-exports, and no provider result establishes runtime callback targets or cross-language protocol edges.

Checks may declare coverage as explicit participant paths, or coverage: selection when the command genuinely evaluates the current selected population. Default coverage includes only literal selector paths. Wildcard members do not inherit support from a check unless coverage includes them. Check scope is authored evidence applicability, not a proof that arbitrary check code is complete.

These are cooperative integrity conventions, not a sandbox or universal certificate.
