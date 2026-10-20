# OpenSpec workflow replacement map

Conceptor replaces the local `opl-openspec` user workflow while retaining bundled OpenSpec requirement semantics.

| Previous capability | Conceptor owner |
| --- | --- |
| Explore | `$conceptor:explore` |
| New change; propose; fast-forward | `$conceptor:propose`, incremental or complete |
| Continue artifact creation | `$conceptor:continue` |
| Update a change | `$conceptor:revise` |
| Apply | `$conceptor:apply` |
| Verify | `$conceptor:verify` |
| Sync without archive | `$conceptor:sync`, specs and designs in the candidate |
| Archive; end-to-end finish | `$conceptor:finish` |
| Bulk archive | `$conceptor:finish` with explicit selection/dependency checks |
| Integrate a finished branch | `$conceptor:merge` with isolated review and conflict escalation |
| Semantic audit | `$conceptor:audit` |
| Reverse tasks | `$conceptor:reconcile` task mode |
| Reverse uncommitted edits | `$conceptor:reconcile` patch mode |
| Repository setup | `$conceptor:init` |

Sync targets the candidate instead of changing accepted requirements ahead of implementation. Finish owns validation, archive, and integrated publication; there is no second generic archive pipeline. Merge handles another selected source branch through the same recoverable publication path, preserving unrelated local edits.

Skills share artifact and lifecycle procedures. Review precedes implementation by default; explicit end-to-end requests authorize continuation. OpenSpec stores and cross-repository scheduling remain outside the qualified local runtime.
