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
  | 'NAME_MISMATCH' | 'ADDRESS_MISMATCH' | 'INCOME_MISMATCH' | 'DATE_MISMATCH' | 'EXPIRED_DOCUMENT'
  | 'DUPLICATE_EVIDENCE' | 'MISSING_FIELD' | 'UNREADABLE_EVIDENCE' | 'UNSUPPORTED_DOCUMENT_TYPE'
  | 'CONFLICTING_INFORMATION' | 'MISSING_EVIDENCE' | 'INVALID_DOCUMENT' | 'LOW_QUALITY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
}

export interface RequirementDef {
  key: string;
  label: string;
  description: string;
  evidenceLabel: string;
  minConfidence: number;
  helpText: string;
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

export interface AssessmentExplanation {
  claim: string;
  evidence: string;
  extractedFact: string;
  rule: string;
  comparison: string;
  result: RequirementStatus;
  whatItProves: string[];
  whatItDoesNotProve: string[];
  nextAction: string;
}

export interface Assessment {
  requirementKey: string;
  requirementLabel: string;
  result: RequirementStatus;
  confidence: number;
  explanation: AssessmentExplanation;
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

export interface RequirementStatusRecord {
  key: string;
  label: string;
  status: RequirementStatus;
  confidence: number;
  explanation: string;
  evidenceIds: string[];
  established: boolean;
}

export interface HumanReview {
  needed: boolean;
  reasons: Issue[];
  whatIsEstablished: string[];
  whatIsUncertain: string[];
  evidenceToInspect: string[];
  recommendedAction: string;
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

export interface ExtractedFact {
  id: string;
  evidenceId: string;
  requirementKey: string;
  key: string;
  label: string;
  value: string;
  confidence: number;
  category: string;
  source: string;
}

export interface ApplicationRecord {
  id: string;
  applicationId: string;
  scenarioKey: string;
  applicant: Applicant;
  claims: Array<{ key: string; label: string; value: string }>;
  status: AppStatus;
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
  humanReview: HumanReview;
  correctionHistory: Array<{ id: string; evidenceKey: string; uploadedBy: string; timestamp: string; note: string }>;
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

export interface ApiEnvelope<T> {
  ok: true;
  data: T;
}

export interface ReviewerQueueItem extends ApplicationRecord {
  queueTag: string;
}

export interface Analytics {
  total: number;
  active: number;
  needsEvidence: number;
  conflicts: number;
  humanReviews: number;
  resolved: number;
  evidenceCoverage: number;
  averageResolutionDays: number;
  humanReviewRate: number;
  statusDist: Array<{ name: string; value: number }>;
  issueTrends: Array<{ day: string; submitted: number; assessed: number; conflicts: number; resolved: number }>;
  missingDocumentFrequency: Array<{ name: string; value: number }>;
  conflictCategories: Array<{ name: string; value: number }>;
  healthDist: Array<{ name: string; value: number }>;
  stageTime: Array<{ name: string; value: number }>;
}

export interface Health {
  status: string;
  service: string;
  timestamp: string;
  checks: Record<string, { status: string; detail: string }>;
  counts: { applications: number; users: number; auditEvents: number };
}

export const DEMO_ROLES: Array<{ id: Role; name: string; color: string; department: string }> = [
  { id: 'CITIZEN', name: 'Citizen', color: '#10B981', department: 'Applicant view' },
  { id: 'REVIEWER', name: 'Reviewer', color: '#0EA5E9', department: 'Government operations' },
  { id: 'ADMIN', name: 'Administrator', color: '#8B5CF6', department: 'System operations' },
];

export const STATUS_META: Record<AppStatus, { label: string; color: string; bg: string; dot: string; desc: string }> = {
  DRAFT: { label: 'Draft', color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8', desc: 'Application in progress, not yet submitted.' },
  SUBMITTED: { label: 'Submitted', color: '#0284C7', bg: '#E0F2FE', dot: '#38BDF8', desc: 'Submitted and queued for analysis.' },
  ANALYZING: { label: 'Analyzing', color: '#7C3AED', bg: '#EDE9FE', dot: '#A78BFA', desc: 'ClearGov is processing the evidence.' },
  ADDITIONAL_EVIDENCE_REQUIRED: { label: 'Additional Evidence Required', color: '#B45309', bg: '#FEF3C7', dot: '#F59E0B', desc: 'Blocking evidence or conflicts must be resolved.' },
  HUMAN_REVIEW_REQUIRED: { label: 'Human Review Required', color: '#C2410C', bg: '#FFEDD5', dot: '#FB923C', desc: 'AI stopped — authorized reviewer judgment needed.' },
  CONDITION_NOT_ESTABLISHED: { label: 'Condition Not Established', color: '#B91C1C', bg: '#FEE2E2', dot: '#F87171', desc: 'A core condition could not be satisfied.' },
  READY_TO_PROCEED: { label: 'Ready To Proceed', color: '#047857', bg: '#D1FAE5', dot: '#34D399', desc: 'All conditions established. Ready for official review.' },
  RESOLVED: { label: 'Resolved', color: '#1F2937', bg: '#E5E7EB', dot: '#9CA3AF', desc: 'Final decision recorded by a reviewer.' },
};

export const REQ_STATUS_META: Record<RequirementStatus, { label: string; color: string; bg: string }> = {
  ESTABLISHED: { label: 'Established', color: '#047857', bg: '#D1FAE5' },
  NOT_ESTABLISHED: { label: 'Not Established', color: '#B91C1C', bg: '#FEE2E2' },
  MISSING_EVIDENCE: { label: 'Missing Evidence', color: '#475569', bg: '#E2E8F0' },
  CONFLICT: { label: 'Conflict', color: '#B91C1C', bg: '#FEE2E2' },
  LOW_CONFIDENCE: { label: 'Low Confidence', color: '#B45309', bg: '#FEF3C7' },
  HUMAN_REVIEW: { label: 'Human Review', color: '#C2410C', bg: '#FFEDD5' },
};