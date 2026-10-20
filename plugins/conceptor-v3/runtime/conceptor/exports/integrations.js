import {
  FakeSurfaceAdapter,
  FileExternalOperationJournal,
  FileSurfaceSnapshotStore,
  InMemoryExternalOperationJournal,
  captureAndPersistSurfaceSnapshot,
  captureSurfaceSnapshot,
  executeSurfacePlan,
  rebuildPinnedSurfaceSnapshot
} from "../chunks/shared-TQN2VJVE.js";
import {
  InferenceFailure,
  runStructuredInference
} from "../chunks/shared-KS6YJJYG.js";
import {
  CodexExecProviderError,
  DISABLED_CODEX_EXEC_FEATURES,
  SpawnCodexProcessRunner,
  authenticateRepresentationBinding,
  createCodexExecProvider,
  createCodexExecRouter,
  createCodexHostAdapter,
  createHostAdapter,
  createHostSessionRecord,
  hostSessionSelector,
  loadAuthenticatedRepositorySession
} from "../chunks/shared-WLLQMJLQ.js";
import "../chunks/shared-ZDS6IOGX.js";
import "../chunks/shared-GUMNUOTD.js";
import "../chunks/shared-JK2RIYKJ.js";
import "../chunks/shared-QAVVEQAL.js";
import "../chunks/shared-72EROCIW.js";
import "../chunks/shared-ZIFGP2AB.js";
import "../chunks/shared-WC2OT3WX.js";

// node_modules/@conceptor/integrations/dist/claude/adapter.js
function createClaudeHostAdapter(dependencies) {
  return createHostAdapter("claude", "claude", dependencies);
}
export {
  CodexExecProviderError,
  DISABLED_CODEX_EXEC_FEATURES,
  FakeSurfaceAdapter,
  FileExternalOperationJournal,
  FileSurfaceSnapshotStore,
  InMemoryExternalOperationJournal,
  InferenceFailure,
  SpawnCodexProcessRunner,
  authenticateRepresentationBinding,
  captureAndPersistSurfaceSnapshot,
  captureSurfaceSnapshot,
  createClaudeHostAdapter,
  createCodexExecProvider,
  createCodexExecRouter,
  createCodexHostAdapter,
  createHostAdapter,
  createHostSessionRecord,
  executeSurfacePlan,
  hostSessionSelector,
  loadAuthenticatedRepositorySession,
  rebuildPinnedSurfaceSnapshot,
  runStructuredInference
};
