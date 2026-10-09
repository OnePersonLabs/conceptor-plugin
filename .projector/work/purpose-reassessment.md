---
id: purpose-reassessment
goal: Implement cost-adjusted purpose reassessment and evaluate it through a connected Steady Helm trial.
status: active
concepts: []
lenses: []
ownership:
  - owner: root
    paths: [docs/approved-plan.md, docs/interfaces.md, plugins/opl-projector/AGENTS.md, plugins/opl-projector/references, plugins/opl-projector/skills]
  - owner: projector_cadence_runtime
    paths: [plugins/opl-projector/runtime/reassessment.mjs, plugins/opl-projector/runtime/cli.mjs, plugins/opl-projector/runtime/projector.mjs, plugins/opl-projector/hooks/projector-context.mjs, test/activation.test.mjs, test/reassessment.test.mjs]
questions: []
uncertainMutations: []
---

Governing authority: the user's approved plan and implementation request, captured in docs/approved-plan.md amendment 9. Actionable status: https://github.com/OnePersonLabs/projector/issues/2.

Candidate: one artifact-grounded comparison procedure and the existing root compaction hook, with a small cache-backed lifecycle. Old source supplies applicable concerns; it does not fix the candidate architecture. A new scheduler, transcript parser or test of instruction wording would add cost without establishing reasoning quality.

Source boundary complete: instructions/reference, hook, lifecycle and deterministic checks. The runtime writer stopped. Independent source review accepted the integrated change after repairing read-only continuation and passive resume cache creation. All 52 tests pass; 13 affected checks also pass on the final reviewed state. Root owns integration, commits, refresh and trial. Tracked baseline 40b36a9; unrelated .temp remains untouched.

Next: commit the reviewed source, refresh the selected plugin and start one fresh supervised execution on the attached isolated Steady Helm baseline. Trial target is production sensor input through the shared scientific owner and Runtime to a real consumer. Preserve full algorithmic capabilities and resource/causal prerequisites. Review at the first integrated milestone or 60 minutes. Actual agent behavior and savings remain unmeasured.

Refresh preview: Windows is eligible. WSL is blocked by an unrelated legacy marketplace registered at a missing Docker bind-mount directory. This state and its authorization boundary are recorded on issue 2; preserve that registration. Evidence logs are in C:/Users/zethj/.codex/temp/projector-purpose-20261009/.
