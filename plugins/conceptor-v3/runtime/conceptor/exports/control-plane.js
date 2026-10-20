import {
  BuiltinVerificationService,
  GeneratedOutputService,
  LifecycleApplyOutputSchema,
  LifecycleApprovalOutputSchema,
  LifecycleCaptureOutputSchema,
  LifecyclePlanOutputSchema,
  LifecycleRecoveryOutcomeSchema,
  LifecycleRecoveryOutputSchema,
  PreparedProjectInitializationResultSchema,
  RepositoryCheckOutputSchema,
  RepositoryIntentReviewSummarySchema,
  RepositoryRepresentationProfileReconciliationService,
  RepresentationProfileReconciliationOperationOutputSchema,
  RepresentationProfileReconciliationOutputSchema,
  StateBoundChangeResultSchema,
  VerificationService,
  assessGitIntegration,
  builtinCanonicalCheck,
  checkRepository,
  evaluateRepositoryArchitectureOptions,
  executeCodeOperation,
  executeCodeTestReplay,
  initializePreparedProject,
  inspectProjectReadiness,
  projectLifecycleApply,
  projectLifecycleApproval,
  projectLifecycleCapture,
  projectLifecyclePlan,
  projectLifecycleRecovery,
  projectRepresentationProfileReconciliationOperation,
  shutdownCodeIndexRuns,
  summarizeRepositoryIntentReview,
  withProjectOperationAccess
} from "../chunks/shared-NQZURG2P.js";
import {
  inspectRepositoryArchitecture
} from "../chunks/shared-VEBMHGK2.js";
import {
  CompletionQuestionSchema,
  RepositoryCleanupOutputSchema,
  RepositoryCompletionOutputSchema,
  RepositoryCoverageOutputSchema,
  inspectRepositoryCoverage,
  parseRepositoryCoverageResult
} from "../chunks/shared-DUEELWPX.js";
import {
  KnowledgeContextInspectOperationOutputSchema,
  KnowledgeContextInspectionOutputSchema,
  KnowledgeContextOperationOutputSchema,
  KnowledgeReconciliationOperationOutputSchema,
  RepositoryChangeLifecycleService,
  RepositoryKnowledgeService,
  RepositoryRepresentationArtifactStore,
  RepositoryRepresentationInspectionService,
  RepresentationInspectionOperationOutputSchema,
  RepresentationInspectionOutputSchema,
  RepresentationPendingOutputSchema,
  RepresentationRecoveryOutputSchema,
  inspectKnowledgeContext,
  projectKnowledgeContext,
  projectKnowledgeReconciliation,
  projectRepresentationInspectionOperation
} from "../chunks/shared-D47KLSX5.js";
import "../chunks/shared-OFD4MU4R.js";
import "../chunks/shared-LHKD2GMY.js";
import {
  KnowledgeApplicationEvidenceAssessmentSchema,
  KnowledgeContextResultSchema,
  KnowledgeReconciliationResultSchema
} from "../chunks/shared-TAVWM7OV.js";
import {
  buildRepositoryImpactSnapshot,
  predictRepositoryImpact,
  reconcileRepositoryImpact
} from "../chunks/shared-BLXCSKYS.js";
import "../chunks/shared-TMMS5AAN.js";
import "../chunks/shared-JNVJDF6D.js";
import "../chunks/shared-RBDP6LFA.js";
import "../chunks/shared-XIRYQBRQ.js";
import "../chunks/shared-GOCL4YYW.js";
import "../chunks/shared-HL6MCTMP.js";
import {
  ResidentObservationWorkerPool,
  runObservationTask,
  withResidentObservationWorkerPool
} from "../chunks/shared-KIG4DOII.js";
import "../chunks/shared-S26VDME2.js";
import "../chunks/shared-K5W6WSUS.js";
import "../chunks/shared-X5IENDHE.js";
import "../chunks/shared-Z5YPJGJJ.js";
import "../chunks/shared-TTCVR66Q.js";
import "../chunks/shared-6SRSD4VD.js";
import "../chunks/shared-ZDS6IOGX.js";
import "../chunks/shared-GUMNUOTD.js";
import "../chunks/shared-JK2RIYKJ.js";
import "../chunks/shared-QAVVEQAL.js";
import "../chunks/shared-72EROCIW.js";
import {
  ArchitectureEvaluationOutputSchema
} from "../chunks/shared-ZIFGP2AB.js";
import "../chunks/shared-WC2OT3WX.js";
export {
  ArchitectureEvaluationOutputSchema,
  BuiltinVerificationService,
  CompletionQuestionSchema,
  GeneratedOutputService,
  KnowledgeApplicationEvidenceAssessmentSchema,
  KnowledgeContextInspectOperationOutputSchema,
  KnowledgeContextInspectionOutputSchema,
  KnowledgeContextOperationOutputSchema,
  KnowledgeContextResultSchema,
  KnowledgeReconciliationOperationOutputSchema,
  KnowledgeReconciliationResultSchema,
  LifecycleApplyOutputSchema,
  LifecycleApprovalOutputSchema,
  LifecycleCaptureOutputSchema,
  LifecyclePlanOutputSchema,
  LifecycleRecoveryOutcomeSchema,
  LifecycleRecoveryOutputSchema,
  PreparedProjectInitializationResultSchema,
  RepositoryChangeLifecycleService,
  RepositoryCheckOutputSchema,
  RepositoryCleanupOutputSchema,
  RepositoryCompletionOutputSchema,
  RepositoryCoverageOutputSchema,
  RepositoryIntentReviewSummarySchema,
  RepositoryKnowledgeService,
  RepositoryRepresentationArtifactStore,
  RepositoryRepresentationInspectionService,
  RepositoryRepresentationProfileReconciliationService,
  RepresentationInspectionOperationOutputSchema,
  RepresentationInspectionOutputSchema,
  RepresentationPendingOutputSchema,
  RepresentationProfileReconciliationOperationOutputSchema,
  RepresentationProfileReconciliationOutputSchema,
  RepresentationRecoveryOutputSchema,
  ResidentObservationWorkerPool,
  StateBoundChangeResultSchema,
  VerificationService,
  assessGitIntegration,
  buildRepositoryImpactSnapshot,
  builtinCanonicalCheck,
  checkRepository,
  evaluateRepositoryArchitectureOptions,
  executeCodeOperation,
  executeCodeTestReplay,
  initializePreparedProject,
  inspectKnowledgeContext,
  inspectProjectReadiness,
  inspectRepositoryArchitecture,
  inspectRepositoryCoverage,
  parseRepositoryCoverageResult,
  predictRepositoryImpact,
  projectKnowledgeContext,
  projectKnowledgeReconciliation,
  projectLifecycleApply,
  projectLifecycleApproval,
  projectLifecycleCapture,
  projectLifecyclePlan,
  projectLifecycleRecovery,
  projectRepresentationInspectionOperation,
  projectRepresentationProfileReconciliationOperation,
  reconcileRepositoryImpact,
  runObservationTask,
  shutdownCodeIndexRuns,
  summarizeRepositoryIntentReview,
  withProjectOperationAccess,
  withResidentObservationWorkerPool
};
