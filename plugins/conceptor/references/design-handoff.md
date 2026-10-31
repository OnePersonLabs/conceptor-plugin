# From meaning to an implementation handoff

Use this path for a design commitment or an implementation request that needs one.
It prepares the governing scope, validates a concrete proposal, obtains independent
semantic review, and returns the context that implementation consumes. A caller can
reuse a current reviewed design for another implementation turn. Conceptor runs no
models and stores no task state; the native host owns agent execution and the caller
owns the task and its review result.

## Prepare the governing scope

Resolve the actual plugin and project roots. Invoke the packaged runtime, not a
different checkout that happens to contain Conceptor:

```text
node PLUGIN_ROOT/runtime/cli.mjs prepare-design --root PROJECT --request -
```

Supply JSON on stdin with `sourceIdentity` and `requestRevision`. These are opaque
caller strings. For GitHub work, use the issue's stable identity and the caller's
current title/body revision. For a direct native request, use its native message
identity and a SHA-256 hash of the complete governing request. Include later accepted
corrections when deriving that revision; a label such as "latest" is not a revision.

Existing Concept records can declare:

```yaml
capability:
  root: true
  includes: [another-concept]
  obligations:
    - id: source-ownership
      section: Saved source and per-use state
      sources:
        - path: docs/original-requirements.md
          section: Source ownership
  scenarios:
    - id: concurrent-uses
      section: Two playback uses and a save
```

`section` is the exact Markdown heading text without its leading `#` characters.
An item uses the section's prose instead of duplicating the requirement in YAML.
Sources are project-relative local files with an optional exact heading. IDs are
unique across obligations and scenarios within a Concept. A root must be accepted.
Included Concepts must exist and must not be retired. Candidate Concepts retain
their status; inclusion cannot accept their mechanisms.

Use the project's existing purpose Concept as the root. Include the cooperating
capabilities that determine design, including consumers not changed by the next
increment. Preserve source lineage and unresolved choices. When the representation
is absent, recover it from the existing sources and reconcile it within the caller's
authority before continuing. Do not invent a smaller scope or ask the user to repeat
discoverable history. Without authority to save it, return the exact unsaved change.

The result separates a compact `scope` manifest from fresh `context`. The capability
map includes declared capabilities outside the root's include traversal so an
omission remains visible. Accepted obligation/scenario references use
`concept-id#item-id`; capability references use the Concept ID. Candidate capability
references still require a disposition, but their items do not become accepted
requirements. Missing roots, references or sections return `unresolved`.

Read the original context before designing. Metadata makes omissions inspectable;
it does not prove that all source meaning was captured. The reviewer must also
consider missing source coverage and later corrections.

## Propose contracts and a bounded increment

Call `check-design` with the manifest and the proposal:

```text
node PLUGIN_ROOT/runtime/cli.mjs check-design --root PROJECT --request -
```

The input contains `sourceIdentity`, `requestRevision`, `plannerId`, `scope`,
`proposal` and `increment`. Use the native planner's actual identity. The proposal
has a `summary`, `contracts` and `coverage`:

- Each contract has an `id`, `responsibility` and nonempty `consumers` list.
- Each coverage entry has `ref`, `disposition`, `rationale` and `contractIds`.
  Dispositions are `delivered`, `preserved`, `deferred`, `unaffected` and `unresolved`.
- Delivered, preserved and deferred entries identify real contracts and provide
  `verification`. Applicable scenarios also provide a `trace` through the responsible
  owners, transitions and consumer. A deferred feature needs a `compatibility` argument,
  not merely a promise to implement it later.
- Every required reference receives one entry. Explain an unaffected capability
  rather than omitting it. Keep unresolved matters visible.
- The increment has an `id`, `summary`, nonempty `refs` and `verification` lists.
  Its references identify the work to implement now, without changing the wider design.
  Selected references must be delivered or preserved before handoff. Deferred or
  unaffected references cannot describe the selected work. Unresolved references
  can receive review input but block implementation until resolved.

The operation rereads the project and rejects stale scope or malformed coverage.
A structurally valid result is `review-required`, not permission to implement.
It supplies exact `bindings`, `reviewInput` and a `reviewTemplate`.

Keep the authored design with its existing specification/meaning owner, or in the
caller's current proposal until saving is authorized. Do not create a repository
execution plan merely to transport these objects. The structured account supports
the design prose; contract names alone do not establish compatibility.

## Obtain independent semantic review

The native root or Conductor director starts one read-only reviewer using the host's
native agent facility. Use an independent context with the original governing request,
actual `reviewInput`, exact bindings, review template and source locations. Do not pass the planner's verdict as the review conclusion. The
reviewer must read the governing sources and compare the actual design against them.

Ask the reviewer to identify missing obligations, candidate promotion, unsupported
deferrals and incompatible scenarios. It must trace the most discriminating cases
through the proposed contracts and consumers. It should permit a legitimate small
increment when the larger contracts remain credible. Source coverage that cannot
be established remains an explicit finding or limit, not a passing assertion.

The reviewer returns `conceptor-design-review/1` with the exact bindings, its actual
`reviewerId`, all `reviewedRefs`, `verdict` (`clear`, `findings` or `blocked`), a
`summary`, and `findings` containing `ref` and `reason`. A clear result has no findings.
Planner and reviewer identities must differ. These identities are host assertions;
Conceptor does not authenticate agents or prevent a caller from fabricating evidence.

Return actionable findings to the same planner, revise the design, and reuse the
reviewer for the changed proposal. A changed design needs new bound review output.
Follow the caller's repair and model budgets. An unavailable reviewer leaves the
handoff blocked; do not substitute the planner's self-review.

## Validate and consume the handoff

Add `review` to the checked request and invoke:

```text
node PLUGIN_ROOT/runtime/cli.mjs handoff --root PROJECT --request -
```

Only `status: ready` with `format: conceptor-design-handoff/1` supplies an implementation
context. Read and use `implementation.proposal`, `implementation.increment`, its
capability map and fresh source context before edits. A result with missing or stale
bindings, unresolved review, or an unresolved reference selected by the increment
does not authorize dependent implementation. Unresolved choices outside the increment
can remain when the independent review establishes that the selected work is safe.
This result checks applicability; the user's instruction and host still own authority.

The handoff binds the request, scope, proposal, increment and review. It does not bind
every implementation byte: ordinary code repairs do not automatically invalidate a
design. The caller's normal checks and code review qualify the actual resulting code.
A new request, governing source correction or changed design requires preparation
and review against the new inputs. A different worktree can consume the result only
within the same Git repository and with matching governing inputs. An unrelated
repository cannot reuse it.

For native work, `$conceptor:apply-change` consumes this result before dependent edits.
Native editing tools are not intercepted; work that bypasses this entrypoint has not
used this handoff. For Conductor, configure the command adapter described below. Its
coordinator validates before a builder turn and before publication.

## Recovery and the Conductor adapter

Retain the checked input (`scope`, proposal, increment and normalized review) with the
caller's existing task record while it has a live implementation/recovery consumer.
Keep an exact original native result reference when available. A bare hash or chat
title cannot reconstruct a review. Do not persist fresh source snapshots from
`context`; the validator reloads them. For a public issue, retain only a sanitized
design decision and receipt suitable for that audience, never a private transcript.

On resumption, recover that input and call `handoff` again. If the exact review result
cannot be recovered, report that specific gap rather than claiming clearance or
silently spending another model run. Remove temporary recovery copies when their
consumer finishes or the claim is superseded; preserve authored design decisions.

Conductor's optional repository setting is:

```json
{
  "designHandoff": {
    "command": "node",
    "args": ["ABSOLUTE_PLUGIN_ROOT/runtime/cli.mjs", "handoff", "--request", "-"]
  }
}
```

Use the actual supported plugin path. Dispatch/resume supplies the checked input as
`designHandoff`. Conductor adds the current issue identity and request revision,
executes in the job worktree, and passes the ready implementation context to the
original builder. Missing, stale, malformed or unavailable results block that job
without starting a model turn. Resume with a repaired handoff preserves the original
owner. The director prepares the handoff; a builder is not responsible for producing
the prerequisite to its own first launch. This setting does not release interaction
gates, holds or admission restrictions, or install/activate either plugin.
