export type Role = 'CITIZEN' | 'REVIEWER' | 'ADMIN';

export type AppStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ANALYZING'
  | 'ADDITIONAL_EVIDENCE_REQUIRED'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'CONDITION_NOT_ESTABLISHED'
  | 'READY_TO_PROCEED'
  | 'RESOLVED';

export type RequirementStatus =
  | 'ESTABLISHED'
  | 'NOT_ESTABLISHED'
  | 'MISSING_EVIDENCE'
  | 'CONFLICT'
  | 'LOW_CONFIDENCE'
  | 'HUMAN_REVIEW';

export type IssueSeverity = 'INFO' | 'WARNING' | 'CONFLICT' | 'CRITICAL';
export type IssueType =
  | 'NAME_MISMATCH'
  | 'ADDRESS_MISMATCH'
  | 'INCOME_MISMATCH'
  | 'DATE_MISMATCH'
  | 'EXPIRED_DOCUMENT'
  | 'DUPLICATE_EVIDENCE'
  | 'MISSING_FIELD'
  | 'UNREADABLE_EVIDENCE'
  | 'UNSUPPORTED_DOCUMENT_TYPE'
  | 'CONFLICTING_INFORMATION'
  | 'MISSING_EVIDENCE'
  | 'INVALID_DOCUMENT'
  | 'LOW_QUALITY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
}

export interface ScenarioDef {
  key: string;
  name: string;
  description: string;
  accent: string;
}

export interface RequirementDef {
  key: string;
  label: string;
  description: string;
  evidenceLabel: string;
  minConfidence: number;
  rule: RuleDef;
  helpText: string;
}

export interface RuleDef {
  type: string;
  field?: string;
  label?: string;
  operator?: string;
  threshold?: number | string;
  test?: (facts: Record<string, ExtractedFactLike>) => boolean;
  explain?: (facts: Record<string, ExtractedFactLike>) => RuleResult;
}

export interface RuleResult {
  passed: boolean;
  comparison?: string;
  humanCheck: string;
}

export interface ExtractedFactLike {
  key: string;
  label: string;
  value: string;
  confidence: number;
}

export interface Scenario {
  key: string;
  name: string;
  description: string;
  accent: string;
  requirements: RequirementDef[];
}

export interface Applicant {
  name: string;
  dob?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  occupation?: string;
}

export interface Claim {
  key: string;
  label: string;
  value: string;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
}

export interface Evidence {
  id: string;
  applicationId: string;
  requirementKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: 'PROCESSING' | 'PROCESSED' | 'FAILED';
  superseded?: boolean;
  supersededAt?: string;
  supersededBy?: string;
  ocrText: string;
  quality: number;
  readability: number;
  extractedFields: ExtractedField[];
  givesConfidence: number;
  proves: string[];
  notProves: string[];
  uploadedBy?: string;
}

export interface EvidenceVersion {
  version: number;
  evidenceId: string;
  fileName: string;
  changedBy: string;
  note: string;
  uploadedAt: string;
  previousFields: ExtractedField[];
  newFields: ExtractedField[];
  previousConfidence: number;
  newConfidence: number;
  previousQuality: number;
  newQuality: number;
  changedFields: string[];
  issuesResolved: string[];
  issuesIntroduced: string[];
}

export interface ExtractedFact {
  id: string;
  evidenceId: string;
  requirementKey: string;
  key: string;
  label: string;
  value: string;
  confidence: number;
  category: 'claim' | 'requirement' | 'evidence' | 'fact' | 'rule' | 'assessment' | 'decision';
  source: string;
}

export interface Assessment {
  requirementKey: string;
  requirementLabel: string;
  result: RequirementStatus;
  confidence: number;
  explanation: {
    claim: string;
    evidence: string;
    extractedFact: string;
    rule: string;
    comparison: string;
    result: RequirementStatus;
    whatItProves: string[];
    whatItDoesNotProve: string[];
    nextAction: string;
  };
  createdAt: string;
}

export interface Issue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  explanation: string;
  evidenceId?: string;
  evidenceFileName?: string;
  requirementKey?: string;
  source?: string;
  comparison?: string;
  confidence: number;
  recommendation: string;
  status: 'OPEN' | 'RESOLVED';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Decision {
  status: AppStatus;
  title: string;
  summary: string;
  aiConfidence: number;
  conditionsEstablished: number;
  conditionsTotal: number;
  coverage: number;
  health: number;
  blockingIssues: number;
  humanReviewRequired: boolean;
  createdAt: string;
}

export interface NextAction {
  key: string;
  title: string;
  priority: number;
  reason: string;
  prompt: string;
  category: 'evidence' | 'resolution' | 'information' | 'review' | 'proceed';
  done: boolean;
}

export interface ReviewComment {
  id: string;
  action: string;
  note?: string;
  reason?: string;
  actor: string;
  role: Role;
  previousStatus?: AppStatus;
  newStatus?: AppStatus;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  applicationId: string;
  actor: string;
  role: string;
  action: string;
  timestamp: string;
  reason?: string;
  previousState?: string;
  newState?: string;
  details?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  userId: string;
  applicationId: string;
  applicationRef: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DemoEvidenceInput {
  name: string;
  requirement: string;
  docType: string;
  seed?: string;
}

export interface ApplicationRecord {
  id: string;
  applicationId: string;
  scenarioKey: string;
  applicant: Applicant;
  claims: Claim[];
  status: AppStatus;
  manualStatus?: AppStatus;
  coverage: number;
  health: number;
  aiConfidence: number;
  blockingIssues: number;
  createdAt: string;
  submittedAt?: string;
  updatedAt: string;
  requirements: RequirementStatusRecord[];
  evidence: Evidence[];
  facts: ExtractedFact[];
  assessments: Assessment[];
  issues: Issue[];
  decision?: Decision;
  nextActions: NextAction[];
  reviewComments: ReviewComment[];
  evidenceVersions: EvidenceVersion[];
  assignedReviewer?: string;
  reviewedBy?: string;
  suppressedIssueKeys?: string[];
  humanReview: {
    needed: boolean;
    reasons: Issue[];
    whatIsEstablished: string[];
    whatIsUncertain: string[];
    evidenceToInspect: string[];
    recommendedAction: string;
  };
  correctionHistory: CorrectionRecord[];
}

export interface RequirementStatusRecord {
  key: string;
  label: string;
  status: RequirementStatus;
  confidence: number;
  explanation: string;
  evidenceIds: string[];
  established: boolean;
}

export interface CorrectionRecord {
  id: string;
  evidenceKey: string;
  uploadedBy: string;
  timestamp: string;
  note: string;
}

export interface StoreSnapshot {
  users: User[];
  scenarios: Scenario[];
  applications: ApplicationRecord[];
  notifications: Notification[];
  audit: AuditEvent[];
  counters: Record<string, number>;
  seedDate: string;
}