import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DemoStore } from './store/demoStore.js';
import type { ReviewerActionInput } from './store/demoStore.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4200);
const store = new DemoStore();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ---------- helpers
function ok<T>(data: T) { return { ok: true as const, data }; }
function fail(message: string, code = 400) { return { ok: false as const, error: { message, code } }; }
function send<T>(res: Response, r: { ok: true; data: T } | { ok: false; error: { message: string; code: number } }) {
  res.status(r.ok ? 200 : r.error.code).json(r);
}
function handleError(res: Response) {
  return (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json(fail(msg, 500));
  };
}

// ---------- health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json(store.health());
});

// ---------- meta
app.get('/api/meta/scenarios', (_req, res) => {
  res.json(ok(store.scenarios));
});

// ---------- demo reset
app.post('/api/demo/reset', (_req, res) => {
  store.reset();
  res.json(ok({ message: 'Demo store re-seeded.' }));
});

// ---------- applications
app.get('/api/applications', (req: Request, res: Response) => {
  const apps = store.listApplications({
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    scenario: req.query.scenario as string | undefined,
    issueType: req.query.issueType as string | undefined,
    reviewer: req.query.reviewer as string | undefined,
    confidenceMin: req.query.confidenceMin ? Number(req.query.confidenceMin) : undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortDir: req.query.sortDir as 'asc' | 'desc' | undefined,
  });
  res.json(ok(apps));
});

app.post('/api/applications', (req: Request, res: Response) => {
  try {
    const { scenarioKey, applicant, claims, submitted } = req.body;
    const r = store.createApplication({ scenarioKey, applicant, claims, submitted: !!submitted });
    res.status(201).json(ok(r.app));
  } catch (e) { handleError(res)(e); }
});

app.get('/api/applications/:id', (req: Request, res: Response) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app));
});

app.post('/api/applications/:id/analyze', (req: Request, res: Response) => {
  try {
    const app = store.analyze(req.params.id);
    res.json(ok(app));
  } catch (e) { handleError(res)(e); }
});

// ---------- evidence
app.get('/api/applications/:id/evidence', (req, res) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app.evidence));
});

app.get('/api/applications/:id/evidence-versions', (req, res) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app.evidenceVersions));
});

app.post(
  '/api/applications/:id/evidence',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const requirement = req.body.requirement as string;
      const seed = (req.body.seed as string) || file?.originalname || '';
      const fileType = file?.mimetype?.includes('pdf') ? 'pdf' : (file?.mimetype?.split('/')[1] ?? 'pdf');
      const uploadedBy = (req.body.uploadedBy as string) ?? 'Salman';
      const note = (req.body.note as string) ?? undefined;
      const r = store.addEvidence(req.params.id, {
        requirement,
        fileName: file?.originalname ?? seed,
        fileType,
        fileSize: file?.size ?? 0,
        seed,
        uploadedBy,
        note,
      });
      res.status(201).json(ok(r));
    } catch (e) { handleError(res)(e); }
  },
);

// ---------- assessment & case page endpoints
app.get('/api/applications/:id/assessment', (req, res) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app.assessments));
});

app.get('/api/applications/:id/issues', (req, res) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app.issues));
});

app.get('/api/applications/:id/decision', (req, res) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app.decision));
});

app.get('/api/applications/:id/next-actions', (req, res) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app.nextActions));
});

app.get('/api/applications/:id/human-review', (req, res) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app.humanReview));
});

// ---------- reviewer
app.get('/api/reviewer/queue', (req, res) => {
  const queue = store.reviewerQueue({
    q: req.query.q as string | undefined,
    filter: (req.query.filter as string | undefined)?.toLowerCase() ?? 'all',
  });
  res.json(ok(queue));
});

app.get('/api/reviewer/applications/:id', (req, res) => {
  const { ok: found, app, error } = store.getApplicationByRef(req.params.id);
  if (!found) return res.status(404).json(fail(error ?? 'Not found', 404));
  res.json(ok(app));
});

app.post('/api/reviewer/applications/:id/action', (req: Request, res: Response) => {
  try {
    const { action, issueId, note, reason, actor } = req.body as ReviewerActionInput;
    const r = store.reviewerAction(req.params.id, { action, issueId, note, reason, actor });
    res.json(ok(r));
  } catch (e) { handleError(res)(e); }
});

// ---------- audit
app.get('/api/audit/:applicationId?', (req, res) => {
  const trail = store.auditTrail(req.params.applicationId);
  res.json(ok(trail));
});

// ---------- notifications
app.get('/api/notifications', (req, res) => {
  const userId = (req.query.userId as string) ?? 'u-citizen';
  res.json(ok(store.notificationsFor(userId)));
});

app.post('/api/notifications/:id/read', (req, res) => {
  const r = store.markNotificationRead(req.params.id);
  res.json(ok(r));
});

// ---------- analytics
app.get('/api/analytics', (_req, res) => {
  res.json(ok(store.analytics()));
});

// ---------- privacy
app.get('/api/privacy', (_req, res) => {
  res.json(ok({
    dataCollected: [
      { purpose: 'Identity verification', evidence: 'Identity document', type: 'Mandatory' },
      { purpose: 'Academic eligibility', evidence: 'Marksheet', type: 'Mandatory' },
      { purpose: 'Income verification', evidence: 'Income certificate', type: 'Mandatory' },
      { purpose: 'Residence verification', evidence: 'Residence proof', type: 'Mandatory' },
      { purpose: 'Disbursement details', evidence: 'Bank proof', type: 'Mandatory' },
    ],
    aiProcessing: [
      'Optical character recognition (OCR) extracts text from uploaded documents.',
      'Cross-document comparison detects inconsistencies between documents.',
      'Rule evaluation compares extracted facts against policy thresholds.',
      'No personal data is sent to external AI services in demo mode.',
    ],
    humanReview: [
      'Human review is required when AI detects conflicts or low-confidence extractions.',
      'Authorized reviewers may override or clarify AI-generated assessments.',
      'All reviewer actions are permanently logged in the audit trail.',
    ],
    dataRetention: [
      'Application data is retained for the duration of the case lifecycle.',
      'Audit logs are retained permanently for accountability.',
      'Evidence files may be purged 30 days after a case is closed.',
    ],
  }));
});

// ---------- static / SPA fallback
const CLIENT_DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist');

if (!process.env.VERCEL && existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
}

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.method || req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return res.status(404).json(fail('Endpoint not found', 404));
  const index = join(CLIENT_DIST, 'index.html');
  if (existsSync(index)) return res.type('html').send(readFileSync(index));
  return res.status(200).send('ClearGov API — GET /api/health');
});

// ---------- error handler
app.use((e: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (e.message?.includes('Only PDF')) return res.status(415).json(fail(e.message));
  if (e.message?.includes('Unexpected field')) return res.status(400).json(fail('Invalid field in multipart upload.'));
  console.error('[unhandled]', e);
  res.status(500).json(fail('Internal server error', 500));
});

// ---------- export (Vercel serverless) + start (local)
export default app;

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`[cleargov] API server listening on http://localhost:${PORT}`);
    if (existsSync(CLIENT_DIST)) console.log('[cleargov] SPA mounted from', CLIENT_DIST);
  });
  process.on('SIGTERM', () => server.close());
}