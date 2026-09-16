import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuid } from 'uuid';
import type {
  AppStatus,
  ApplicationRecord,
  AuditEvent,
  Evidence,
  EvidenceVersion,
  Issue,
  Notification,
  RequirementStatus,
  ReviewComment,
  StoreSnapshot,
  User,
} from '../types.js';
import { SCENARIOS } from '../scenarios.js';
import { analyzeApplication } from '../engine/assess.js';
import { extractFields } from '../engine/ocr.js';
import { createSeed } from './seed.js';

export interface EvidenceUploadInput {
  requirement: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  seed?: string;
  uploadedBy?: string;
  note?: string;
}

export interface ReviewerActionInput {
  action: 'REQUEST_EVIDENCE' | 'MARK_ISSUE_RESOLVED' | 'ESCALATE' | 'ALLOW_PROCEED' | 'ADD_NOTE' | 'RECORD_REASON';
  issueId?: string;
  note?: string;
  reason?: string;
  actor?: string;
}

const DEFAULT_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../data/store.json');

export class DemoStore {
  private snapshot!: StoreSnapshot;
  private file: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(file = process.env.DEMO_STORE_FILE ? resolve(process.env.DEMO_STORE_FILE) : DEFAULT_FILE) {
    this.file = file;
    this.loadOrSeed();
  }

  private loadOrSeed() {
    try {
      if (existsSync(this.file)) {
        const raw = readFileSync(this.file, 'utf8');
        const parsed = JSON.parse(raw) as StoreSnapshot;
        if (parsed && Array.isArray(parsed.applications)) {
          this.snapshot = parsed;
          return;
        }
      }
    } catch {
      // fall through to fresh seed
    }
    this.snapshot = createSeed();
    this.persist();
  }

  reset() {
    this.snapshot = createSeed();
    this.persist();
    return this.snapshot;
  }

  get users(): User[] {
    return this.snapshot.users;
  }

  get scenarios() {
    return this.snapshot.scenarios;
  }

  dirty() {
    this.persist();
  }

  private persist() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      try {
        mkdirSync(dirname(this.file), { recursive: true });
        writeFileSync(this.file, JSON.stringify(this.snapshot, null, 2), 'utf8');
      } catch (e) {
        console.warn('[demo-store] persist failed (running from memory only):', e);
      }
    }, 200);
  }

  private audit(appId: string, actor: string, role: string, action: string, reason?: string, previousState?: string, newState?: string, details?: Record<string, unknown>): AuditEvent {
    const ev: AuditEvent = {
      id: uuid(),
      applicationId: appId,
      actor,
      role,
      action,
      timestamp: new Date().toISOString(),
      reason,
      previousState,
      newState,
      details,
    };
    this.snapshot.audit.push(ev);
    this.persist();
    return ev;
  }

  private notify(userId: string, applicationId: string, applicationRef: string, type: string, title: string, message: string): Notification {
    const n: Notification = { id: uuid(), userId, applicationId, applicationRef, type, title, message, read: false, createdAt: new Date().toISOString() };
    this.snapshot.notifications.push(n);
    this.persist();
    return n;
  }

  // ================================================================ applications
  listApplications(filters: {
    search?: string;
    status?: string;
    scenario?: string;
    confidenceMin?: number;
    issueType?: string;
    reviewer?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): ApplicationRecord[] {
    let rows = [...this.snapshot.applications];
    const { confidenceMin, dateFrom, dateTo } = filters;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((a) =>
        a.applicationId.toLowerCase().includes(q) ||
        a.applicant.name.toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q) ||
        a.issues.some((i) => i.title.toLowerCase().includes(q)) ||
        a.evidence.some((e) => e.fileName.toLowerCase().includes(q)) ||
        (a.scenarioKey || '').toLowerCase().includes(q),
      );
    }
    if (filters.status) rows = rows.filter((a) => a.status === filters.status);
    if (filters.scenario) rows = rows.filter((a) => a.scenarioKey === filters.scenario);
    if (filters.issueType) rows = rows.filter((a) => a.issues.some((i) => i.type === filters.issueType));
    if (filters.reviewer) rows = rows.filter((a) => (a.assignedReviewer ?? a.reviewedBy) === filters.reviewer);
    if (confidenceMin) rows = rows.filter((a) => a.aiConfidence >= confidenceMin);
    if (dateFrom) rows = rows.filter((a) => a.createdAt >= dateFrom);
    if (dateTo) rows = rows.filter((a) => a.createdAt <= dateTo);
    const sortKey = (filters.sortBy ?? 'updatedAt') as keyof ApplicationRecord;
    const dir = filters.sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
    });
    return rows;
  }

  getApplication(ref: string): ApplicationRecord | undefined {
    return this.snapshot.applications.find((a) => a.id === ref || a.applicationId === ref);
  }

  createApplication(input: {
    scenarioKey: string;
    applicant: { name: string; dob?: string; email?: string; phone?: string; address?: string; city?: string; occupation?: string };
    claims?: Array<{ key: string; label: string; value: string }>;
    submitted?: boolean;
  }): { app: ApplicationRecord; audit: AuditEvent } {
    const seq = this.snapshot.counters.applicationSeq ?? 160;
    const year = new Date().getFullYear();
    const applicationId = `CG-${year}-0${seq}`;
    this.snapshot.counters.applicationSeq = seq + 1;
    const sc = SCENARIOS.find((s) => s.key === input.scenarioKey);
    const app: ApplicationRecord = {
      id: uuid(),
      applicationId,
      scenarioKey: input.scenarioKey,
      applicant: input.applicant,
      claims: input.claims ?? sc?.requirements.map((r) => ({ key: r.key, label: r.label, value: 'Claimed by applicant' })) ?? [],
      status: input.submitted ? 'SUBMITTED' : 'DRAFT',
      coverage: 0,
      health: 0,
      aiConfidence: 0,
      blockingIssues: 0,
      createdAt: new Date().toISOString(),
      submittedAt: input.submitted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
      requirements: [],
      evidence: [],
      facts: [],
      assessments: [],
      issues: [],
      nextActions: [],
      reviewComments: [],
      evidenceVersions: [],
      assignedReviewer: 'u-reviewer',
      humanReview: { needed: false, reasons: [], whatIsEstablished: [], whatIsUncertain: [], evidenceToInspect: [], recommendedAction: '' },
      correctionHistory: [],
    };
    this.snapshot.applications.push(app);
    const ev = this.audit(app.id, input.applicant.name, 'CITIZEN', 'APPLICATION_CREATED', input.submitted ? 'Submitted' : 'Draft started', !input.submitted ? undefined : 'DRAFT', input.submitted ? 'SUBMITTED' : 'DRAFT');
    this.persist();
    return { app, audit: ev };
  }

  submitApplication(ref: string): ApplicationRecord {
    const app = this.getApplication(ref);
    if (!app) throw new Error('Application not found');
    app.status = 'SUBMITTED';
    app.submittedAt = new Date().toISOString();
    app.updatedAt = new Date().toISOString();
    this.audit(app.id, app.applicant.name, 'CITIZEN', 'SUBMITTED', 'Citizen submitted the application.', 'DRAFT', 'SUBMITTED');
    this.persist();
    return app;
  }

  analyze(ref: string): ApplicationRecord {
    const app = this.getApplication(ref);
    if (!app) throw new Error('Application not found');
    const prev = app.status;
    analyzeApplication(app);
    if (prev !== app.status) {
      this.audit(app.id, 'System', 'AI', 'ASSESSMENT_GENERATED', `Case state changed to ${app.status}.`, prev, app.status, {
        coverage: app.coverage, health: app.health, aiConfidence: app.aiConfidence,
      });
    }
    this.persist();
    return app;
  }

  getApplicationByRef(ref: string): { app: ApplicationRecord; ok: boolean; error?: string } {
    const app = this.getApplication(ref);
    if (!app) return { app: undefined as never, ok: false, error: 'Application not found' };
    return { app, ok: true };
  }

  // ================================================================ evidence
  addEvidence(ref: string, input: EvidenceUploadInput): { app: ApplicationRecord; evidence: Evidence; versions: EvidenceVersion[] } {
    const app = this.getApplication(ref);
    if (!app) throw new Error('Application not found');
    const req = SCENARIOS.find((s) => s.key === app.scenarioKey)?.requirements.find((r) => r.key === input.requirement);
    if (!req) throw new Error(`Unknown requirement "${input.requirement}" for scenario ${app.scenarioKey}`);

    const seed = input.seed || input.fileName;
    const { spec } = extractFields(input.requirement, seed, input.fileType ?? 'pdf', app.applicant.name);
    const evidence: Evidence = {
      id: uuid(),
      applicationId: app.id,
      requirementKey: input.requirement,
      fileName: input.fileName,
      fileType: input.fileType ?? (input.fileName.toLowerCase().endsWith('.png') || input.fileName.toLowerCase().endsWith('.jpg') || input.fileName.toLowerCase().endsWith('.jpeg') ? input.fileName.slice(-4) : 'pdf'),
      fileSize: input.fileSize ?? Math.round(180000 + Math.random() * 400000),
      uploadedAt: new Date().toISOString(),
      status: 'PROCESSED',
      ocrText: `Simulated OCR output for ${input.fileName}.`,
      quality: spec.quality,
      readability: spec.readability,
      extractedFields: spec.fields,
      givesConfidence: Math.round(spec.fields.reduce((a, f) => a + f.confidence, 0) / spec.fields.length),
      proves: spec.proves,
      notProves: spec.notProves,
      uploadedBy: input.uploadedBy ?? app.applicant.name,
    };
    app.evidence.push(evidence);

    const versions: EvidenceVersion[] = [];
    const prior = app.evidence
      .filter((e) => e.requirementKey === input.requirement && e.status === 'PROCESSED' && !e.superseded && e.id !== evidence.id)
      .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))[0];
    if (prior) {
      app.evidence.forEach((e) => {
        if (e.requirementKey === input.requirement && e.status === 'PROCESSED' && !e.superseded && e.id !== evidence.id) {
          e.superseded = true;
          e.supersededAt = new Date().toISOString();
          e.supersededBy = evidence.id;
        }
      });
    }

    const openTitlesBefore = app.issues.filter((i) => i.status === 'OPEN').map((i) => i.title);
    if (prior) {
      const changedFields = spec.fields.filter((f) => {
        const oldF = prior.extractedFields.find((of) => of.key === f.key);
        return oldF && oldF.value !== f.value;
      }).map((f) => f.label);
      app.evidenceVersions.unshift({
        version: app.evidenceVersions.length + 1,
        evidenceId: evidence.id,
        fileName: input.fileName,
        changedBy: input.uploadedBy ?? app.applicant.name,
        note: input.note ?? 'Corrected evidence submitted',
        uploadedAt: new Date().toISOString(),
        previousFields: prior.extractedFields,
        newFields: spec.fields,
        previousConfidence: prior.givesConfidence,
        newConfidence: evidence.givesConfidence,
        previousQuality: prior.quality,
        newQuality: spec.quality,
        changedFields,
        issuesResolved: [],
        issuesIntroduced: [],
      });
      versions.push(app.evidenceVersions[0]);
    }

    analyzeApplication(app);

    if (app.evidenceVersions[0] && app.evidenceVersions[0].evidenceId === evidence.id) {
      const openTitlesAfter = new Set(app.issues.filter((i) => i.status === 'OPEN').map((i) => i.title));
      app.evidenceVersions[0].issuesResolved = openTitlesBefore.filter((t) => !openTitlesAfter.has(t));
      app.evidenceVersions[0].issuesIntroduced = app.issues.filter((i) => i.requirementKey === input.requirement).map((i) => i.title);
    }

    this.audit(app.id, input.uploadedBy ?? app.applicant.name, 'CITIZEN', 'EVIDENCE_UPLOADED', `Evidence "${input.fileName}" uploaded and processed.`, undefined, app.status, {
      requirement: input.requirement,
    });
    this.audit(app.id, 'System', 'AI', 'CASE_REASSESSED', 'Application was re-analysed after new evidence.', undefined, app.status, {
      coverage: app.coverage, health: app.health, blockingIssues: app.blockingIssues,
    });
    this.notify('u-citizen', app.id, app.applicationId, 'EVIDENCE_PROCESSED', 'Evidence processed', `${input.fileName} was analysed. Coverage ${app.coverage}%, health ${app.health}/100.`);
    if (app.status === 'ADDITIONAL_EVIDENCE_REQUIRED') {
      this.notify('u-citizen', app.id, app.applicationId, 'MISSING_EVIDENCE', 'Additional evidence required', `${app.blockingIssues} blocking issue(s) remain on ${app.applicationId}.`);
    }
    this.persist();
    return { app, evidence, versions };
  }

  // ================================================================ reviewer
  reviewerQueue(filters: { q?: string; filter?: string }) {
    const apps = this.listApplications({ search: filters.q });
    const withLabels = apps.map((a) => {
      const needsEvidence = a.issues.some((i) => i.status === 'OPEN' && i.type === 'MISSING_EVIDENCE');
      const conflict = a.issues.some((i) => i.status === 'OPEN' && i.severity === 'CONFLICT');
      const lowConf = a.issues.some((i) => i.status === 'OPEN' && i.type === 'LOW_QUALITY');
      const human = a.humanReview.needed || a.status === 'HUMAN_REVIEW_REQUIRED';
      return { ...a, queueTag: needsEvidence ? 'Needs Evidence' : conflict ? 'Conflict' : lowConf ? 'Low Confidence' : human ? 'Human Review' : a.status };
    });
    const f = filters.filter;
    if (f && f !== 'all') {
      return withLabels.filter((a) => a.queueTag.toLowerCase().replace(/ /g, '_') === f);
    }
    return withLabels;
  }

  reviewerAction(ref: string, input: ReviewerActionInput): { app: ApplicationRecord; comment: ReviewComment } {
    const app = this.getApplication(ref);
    if (!app) throw new Error('Application not found');
    const actor = input.actor ?? 'R. Priya';
    const prev = app.status;
    let newStatus: AppStatus = prev;

    if (input.action === 'MARK_ISSUE_RESOLVED' && input.issueId) {
      app.suppressedIssueKeys = app.suppressedIssueKeys ?? [];
      const issue = app.issues.find((i) => i.id === input.issueId);
      if (issue?.requirementKey) app.suppressedIssueKeys.push(issue.requirementKey);
      analyzeApplication(app);
      newStatus = app.status;
    } else if (input.action === 'ESCALATE') {
      app.humanReview.needed = true;
      analyzeApplication(app);
      newStatus = app.status;
      this.notify('u-reviewer', app.id, app.applicationId, 'HUMAN_REVIEW', 'Human review required', `${app.applicationId} escalated for reviewer judgment.`);
    } else if (input.action === 'ALLOW_PROCEED') {
      app.manualStatus = 'RESOLVED';
      analyzeApplication(app);
      newStatus = 'RESOLVED';
      this.notify('u-citizen', app.id, app.applicationId, 'RESOLVED', 'Case resolved', `An authorized reviewer resolved ${app.applicationId}.`);
    } else if (input.action === 'REQUEST_EVIDENCE') {
      app.manualStatus = undefined;
      analyzeApplication(app);
      newStatus = app.status === 'READY_TO_PROCEED' ? 'ADDITIONAL_EVIDENCE_REQUIRED' : app.status;
      app.status = newStatus;
      this.notify('u-citizen', app.id, app.applicationId, 'REVIEWER_REQUEST', 'Reviewer requested evidence', input.reason ?? 'The reviewer has requested additional evidence.');
    }

    const comment: ReviewComment = {
      id: uuid(),
      action: input.action,
      note: input.note,
      reason: input.reason,
      actor,
      role: 'REVIEWER',
      previousStatus: prev,
      newStatus,
      createdAt: new Date().toISOString(),
    };
    app.reviewComments.push(comment);
    app.updatedAt = new Date().toISOString();
    this.audit(app.id, actor, 'REVIEWER', input.action, input.reason, prev, newStatus, input.note ? { note: input.note } : undefined);
    this.persist();
    return { app, comment };
  }

  // ================================================================ notifications
  notificationsFor(userId: string): Notification[] {
    return this.snapshot.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  markNotificationRead(id: string) {
    const n = this.snapshot.notifications.find((x) => x.id === id);
    if (n) n.read = true;
    this.persist();
    return n;
  }

  markAllRead(userId: string) {
    this.snapshot.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === 'u-citizen') n.read = true;
    });
    this.persist();
  }

  // ================================================================ audit
  auditTrail(applicationId?: string): AuditEvent[] {
    const rows = applicationId
      ? this.snapshot.audit.filter((a) => a.applicationId === applicationId || this.snapshot.applications.find((app) => app.applicationId === applicationId)?.id === a.applicationId)
      : this.snapshot.audit;
    return rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }

  // ================================================================ analytics
  analytics() {
    const apps = this.snapshot.applications;
    const active = apps.filter((a) => !['RESOLVED', 'DRAFT'].includes(a.status)).length;
    const needsEvidence = apps.filter((a) => a.issues.some((i) => i.status === 'OPEN' && i.type === 'MISSING_EVIDENCE')).length;
    const conflicts = apps.filter((a) => a.issues.some((i) => i.status === 'OPEN' && i.severity === 'CONFLICT')).length;
    const humanReviews = apps.filter((a) => a.humanReview.needed || a.status === 'HUMAN_REVIEW_REQUIRED').length;
    const resolved = apps.filter((a) => a.status === 'RESOLVED').length;
    const avgCoverage = Math.round(apps.reduce((a, x) => a + x.coverage, 0) / Math.max(1, apps.length));
    const avgResolutionMs = apps
      .filter((a) => a.submittedAt && (a.reviewedBy || a.status === 'RESOLVED'))
      .reduce((sum, a) => sum + (new Date(a.updatedAt).getTime() - new Date(a.submittedAt!).getTime()), 0);

    const statusDist = ([] as Array<{ name: string; value: number }>);
    const order: AppStatus[] = ['DRAFT', 'SUBMITTED', 'ADDITIONAL_EVIDENCE_REQUIRED', 'HUMAN_REVIEW_REQUIRED', 'CONDITION_NOT_ESTABLISHED', 'READY_TO_PROCEED', 'RESOLVED'];
    for (const s of order) statusDist.push({ name: s, value: apps.filter((a) => a.status === s).length });

    const issueTypes = new Map<string, number>();
    apps.forEach((a) => a.issues.filter((i) => i.status === 'OPEN').forEach((i) => issueTypes.set(i.type, (issueTypes.get(i.type) ?? 0) + 1)));
    const conflictCategories = [...issueTypes.entries()].map(([name, value]: [string, number]) => ({ name, value }));

    const healthDist = [
      { name: 'Healthy (85-100)', value: apps.filter((a) => a.health >= 85).length },
      { name: 'Needs attention (60-84)', value: apps.filter((a) => a.health >= 60 && a.health < 85).length },
      { name: 'Critical (<60)', value: apps.filter((a) => a.health > 0 && a.health < 60).length },
    ];

    // deterministic 14-day trends
    const { mulberry } = rng('cleargov-trends');
    const days: Array<{ day: string; submitted: number; assessed: number; conflicts: number; resolved: number }> = [];
    for (let d = 13; d >= 0; d--) {
      const day = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
      days.push({
        day: day.slice(5),
        submitted: Math.round(1 + mulberry() * 3),
        assessed: Math.round(1 + mulberry() * 3),
        conflicts: Math.round(mulberry() * 3),
        resolved: Math.round(mulberry() * 2),
      });
    }

    const stageTime = [
      { name: 'Application → Submission', value: 1.2 },
      { name: 'Submission → Analysis', value: 0.4 },
      { name: 'Evidence loop', value: 4.6 },
      { name: 'Conflict resolution', value: 3.1 },
      { name: 'Human review', value: 2.4 },
      { name: 'Final decision', value: 1.8 },
    ];

    return {
      total: apps.length,
      active,
      needsEvidence,
      conflicts,
      humanReviews,
      resolved,
      evidenceCoverage: avgCoverage,
      averageResolutionDays: Math.round((avgResolutionMs / 86400000) * 10) / 10,
      humanReviewRate: Math.round((humanReviews / Math.max(1, apps.length)) * 100),
      statusDist,
      issueTrends: days,
      missingDocumentFrequency: conflictCategories.filter((c) => ['MISSING_EVIDENCE', 'LOW_QUALITY', 'ADDRESS_MISMATCH'].includes(c.name)),
      conflictCategories,
      humanReviewDenominator: apps.length,
      healthDist,
      stageTime,
    };
  }

  // ================================================================ health
  health() {
    const dbStatus = existsSync(this.file) ? 'ok' : 'memory-only';
    return {
      status: 'ok',
      service: 'cleargov-api',
      timestamp: new Date().toISOString(),
      checks: {
        frontend: { status: 'ok', detail: 'Vite SPA served at /' },
        backend: { status: 'ok', detail: 'Express engine responding' },
        database: { status: 'ok', detail: `Demo Store (JSON file: ${dbStatus})` },
        assessmentEngine: { status: 'ok', detail: 'Rule evaluation + simulated OCR operational' },
      },
      counts: {
        applications: this.snapshot.applications.length,
        users: this.snapshot.users.length,
        auditEvents: this.snapshot.audit.length,
      },
    };
  }

  scenarioHealthCheck(): { engine: 'assess' | { ok: boolean }; sample: Record<string, RequirementStatus> } {
    const flagship = this.getApplication('CG-2026-0148');
    if (!flagship) return { engine: { ok: false }, sample: {} };
    return { engine: 'assess', sample: Object.fromEntries(flagship.requirements.map((r) => [r.key, r.status])) };
  }
}

function rng(seed: string) {
  let a = 1 << 14;
  for (let i = 0; i < seed.length; i++) a = (a ^ seed.charCodeAt(i)) * 33;
  return {
    mulberry() {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export type { Issue, AppStatus };