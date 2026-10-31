---
id: clip
kind: concept
title: Shared Clip notes
status: accepted
capability:
  root: true
  obligations:
    - { id: source-ownership, section: Saved source and per-use state }
    - { id: explicit-edit, section: Intentional source edits }
  scenarios:
    - { id: concurrent-uses, section: Two playback uses and a save }
    - { id: export-consumer, section: Adding an export consumer }
conditions:
  - id: playback-isolation
    text: Per-use playback transpose returns adjusted notes and leaves the shared Clip notes unchanged.
    evidence: runtime
  - id: persistence-source
    text: Saving after playback writes the shared Clip notes, not the transient playback notes.
    evidence: runtime
relations:
  - type: projected-by
    target: clip-playback
    status: accepted
  - type: has-candidate
    target: read-time-transform
    status: observed
---

## Saved source and per-use state

A Clip is the saved musical source. A playback use can request a different pitch without editing that source. Two simultaneous uses can therefore play the same Clip at different transpositions. Saving after playback writes the source notes, not a use's transient notes.

`shared/clip.json` is the example input. JS export, Rust playback, Python persistence, TSX rendering, and the C# consumer express this boundary with different syntax. Language navigation can help locate these seams, but a name match does not prove their behavior.

## Intentional source edits

An explicit committed edit is different: `commitTranspose` and `commit_transpose` intentionally change saved state. The playback condition does not forbid that edit. Reopen this Concept if playback is later defined as an editing action or the source ownership model changes.

## Two playback uses and a save

Two consumers use the same Clip at different transpositions. Their resulting notes
must remain independent, and a save between those uses must retain the source notes.
The design must identify the source owner, each use's transient state and the
persistence input. A passing single-use playback check does not establish this case.

## Adding an export consumer

An exporter can consume the same per-use projection without becoming a source
editor. A small exporter change can leave the other language consumers unchanged
when their source and projection contracts remain valid. Its evidence must exercise
the export and confirm that saving still receives the source notes. Requiring every
consumer to be rewritten would exceed what this change establishes.
