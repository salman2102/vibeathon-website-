import { v4 as uuid } from 'uuid';
import { SCENARIOS } from '../scenarios.js';
import { analyzeApplication } from '../engine/assess.js';
import { extractFields } from '../engine/ocr.js';
function daysAgo(days, hour = 10) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, 15, 0, 0);
    return d.toISOString();
}
const USERS = [
    { id: 'u-citizen', name: 'Salman', email: 'salman@demo.cleargov', role: 'CITIZEN' },
    { id: 'u-reviewer', name: 'R. Priya', email: 'priya@demo.cleargov', role: 'REVIEWER', department: 'Scholarship Cell' },
    { id: 'u-admin', name: 'K. Malathi', email: 'admin@demo.cleargov', role: 'ADMIN', department: 'Operations Command Center' },
];
const SCENARIO_EVIDENCE = {
    scholarship: [
        { req: 'identity', seed: 'identity' },
        { req: 'academic', seed: 'marksheet' },
        { req: 'income', seed: 'income' },
        { req: 'residence', seed: 'residence' },
        { req: 'bank', seed: 'bank' },
    ],
    housing: [
        { req: 'identity', seed: 'identity' },
        { req: 'income', seed: 'income' },
        { req: 'residence', seed: 'residence' },
        { req: 'plot', seed: 'land' },
    ],
    income_benefit: [
        { req: 'identity', seed: 'identity' },
        { req: 'income', seed: 'income' },
        { req: 'bank', seed: 'bank' },
    ],
    education_support: [
        { req: 'identity', seed: 'identity' },
        { req: 'enrollment', seed: 'enrollment' },
        { req: 'fee', seed: 'fee' },
    ],
    healthcare: [
        { req: 'identity', seed: 'identity' },
        { req: 'income', seed: 'income' },
        { req: 'medical', seed: 'medical' },
    ],
    transport: [
        { req: 'identity', seed: 'identity' },
        { req: 'enrollment', seed: 'enrollment' },
        { req: 'route', seed: 'route_a' },
    ],
    certificate: [
        { req: 'identity', seed: 'identity' },
        { req: 'self_declaration', seed: 'declaration' },
        { req: 'supporting', seed: 'supporting' },
    ],
};
function scenarioForKey(key) {
    return SCENARIOS.find((s) => s.key === key);
}
function evidenceFor(app, req, seed, fileName, days) {
    const { spec } = extractFields(req, seed, 'auto', app.applicant.name);
    return {
        id: uuid(),
        applicationId: app.id,
        requirementKey: req,
        fileName,
        fileType: 'pdf',
        fileSize: Math.round(180000 + Math.random() * 400000),
        uploadedAt: daysAgo(days),
        status: 'PROCESSED',
        ocrText: `Simulated OCR output for ${fileName}.`,
        quality: spec.quality,
        readability: spec.readability,
        extractedFields: spec.fields,
        givesConfidence: Math.round(spec.fields.reduce((a, f) => a + f.confidence, 0) / spec.fields.length),
        proves: spec.proves,
        notProves: spec.notProves,
        uploadedBy: USERS[0].name,
    };
}
export function createSeed() {
    const apps = [];
    const notifications = [];
    const audit = [];
    const counters = { applicationSeq: 161 };
    const now = new Date().toISOString();
    // ------------------------------------------------------------------ flagship
    const flagshipApp = {
        id: uuid(),
        applicationId: 'CG-2026-0148',
        scenarioKey: 'scholarship',
        applicant: {
            name: 'Salman',
            dob: '2005-04-14',
            email: 'salman@demo.cleargov',
            phone: '+91 9XXXXX4788',
            address: '12, Nehru Street, Coimbatore',
            city: 'Coimbatore',
            occupation: 'Student',
        },
        claims: [
            { key: 'identity', label: 'Applicant identity', value: 'Salman' },
            { key: 'academic', label: 'Academic merit', value: '86% aggregate' },
            { key: 'income', label: 'Family income below ceiling', value: '₹2,40,000 per annum' },
            { key: 'residence', label: 'Resides in service area', value: 'Coimbatore' },
            { key: 'bank', label: 'Valid disbursement account', value: 'HDFC account in own name' },
        ],
        status: 'SUBMITTED',
        coverage: 0,
        health: 0,
        aiConfidence: 0,
        blockingIssues: 0,
        createdAt: daysAgo(6),
        submittedAt: daysAgo(6, 11),
        updatedAt: daysAgo(4),
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
    flagshipApp.evidence = [
        evidenceFor(flagshipApp, 'identity', 'identity', 'Salman_ID_Proof.pdf', 5),
        evidenceFor(flagshipApp, 'academic', 'marksheet', 'Salman_Marksheet_2025.pdf', 5),
        evidenceFor(flagshipApp, 'income', 'income', 'Salman_Income_Certificate.pdf', 5),
        evidenceFor(flagshipApp, 'residence', 'residence_conflict', 'Salman_Residence_Proof.pdf', 5),
    ];
    analyzeApplication(flagshipApp);
    apps.push(flagshipApp);
    // flagship audit trail
    const fsAudit = (action, reason, previous, details, days = 4) => {
        audit.push({ id: uuid(), applicationId: flagshipApp.id, actor: 'System', role: 'AI', action, timestamp: daysAgo(days, 9), reason, previousState: previous, newState: details?.newState, details });
    };
    fsAudit('APPLICATION_CREATED', 'Citizen started the Digital Twin case folder.', undefined, { newState: 'DRAFT' }, 6);
    fsAudit('SUBMITTED', 'Citizen submitted the application and claims.', 'DRAFT', { newState: 'SUBMITTED' }, 6);
    fsAudit('EVIDENCE_UPLOADED', 'Identity, marksheet, income certificate and residence proof uploaded.', undefined, { newState: 'ANALYZING' }, 5);
    fsAudit('OCR_COMPLETED', 'Document intelligence extracted fields from 4 documents.', undefined, { newState: 'ANALYZING' }, 5);
    fsAudit('FACTS_EXTRACTED', '17 candidate facts extracted with per-field confidence.', undefined, { newState: 'ANALYZING' }, 5);
    fsAudit('REQUIREMENTS_CHECKED', '5 conditions evaluated against government rules.', undefined, { newState: 'ANALYZING' }, 4);
    fsAudit('CONFLICT_DETECTED', 'Address (Coimbatore vs Erode) conflict detected between income certificate and residence proof.', 'ANALYZING', { newState: 'ANALYZING' }, 4);
    fsAudit('ASSESSMENT_GENERATED', 'Conditions established 3/5, coverage 78%, evidence health 82/100, AI confidence 91%.', undefined, { newState: 'ADDITIONAL_EVIDENCE_REQUIRED' }, 4);
    fsAudit('EVIDENCE_REQUESTED', 'Bank proof is mandatory and missing. Residence proof requires correction.', 'ADDITIONAL_EVIDENCE_REQUIRED', { newState: 'ADDITIONAL_EVIDENCE_REQUIRED', actor: 'R. Priya' }, 3);
    notifications.push({ id: uuid(), userId: 'u-reviewer', applicationId: flagshipApp.id, applicationRef: 'CG-2026-0148', type: 'CONFLICT', title: 'New conflict detected', message: 'Address conflict between income certificate and residence proof for CG-2026-0148.', read: false, createdAt: daysAgo(4) }, { id: uuid(), userId: 'u-citizen', applicationId: flagshipApp.id, applicationRef: 'CG-2026-0148', type: 'MISSING_EVIDENCE', title: 'Missing evidence requested', message: 'Bank proof is missing. Upload it to end the hold.', read: false, createdAt: daysAgo(3) }, { id: uuid(), userId: 'u-citizen', applicationId: flagshipApp.id, applicationRef: 'CG-2026-0148', type: 'REVIEWER_REQUEST', title: 'Residence proof needs correction', message: 'The residence address conflicts with your income certificate. Reviewer R. Priya requested a corrected copy.', read: false, createdAt: daysAgo(3) }, { id: uuid(), userId: 'u-citizen', applicationId: flagshipApp.id, applicationRef: 'CG-2026-0148', type: 'ASSESSMENT', title: 'Assessment generated', message: 'ClearGov established 3 of 5 conditions. 2 actions are required to proceed.', read: false, createdAt: daysAgo(4) });
    // ------------------------------------------------------------------ support apps
    const seedApps = [
        { ref: 'CG-2026-0147', scenario: 'scholarship', name: 'Arjun', days: 2, submitted: true, missing: ['identity', 'academic', 'income', 'residence', 'bank'] },
        { ref: 'CG-2026-0149', scenario: 'scholarship', name: 'Divya', days: 11, submitted: true, highIncome: true },
        { ref: 'CG-2026-0150', scenario: 'scholarship', name: 'Harsha', days: 8, submitted: true },
        { ref: 'CG-2026-0151', scenario: 'housing', name: 'Ramesh', days: 13, submitted: true, humanReview: true, lowQualityResidence: true },
        { ref: 'CG-2026-0152', scenario: 'income_benefit', name: 'Karthik', days: 7, submitted: true, missing: ['bank'] },
        { ref: 'CG-2026-0153', scenario: 'education_support', name: 'Meena', days: 9, submitted: true },
        { ref: 'CG-2026-0154', scenario: 'healthcare', name: 'Anitha', days: 12, submitted: true },
        { ref: 'CG-2026-0155', scenario: 'transport', name: 'John', days: 10, submitted: true, extraRoute: true },
        { ref: 'CG-2026-0156', scenario: 'certificate', name: 'Vikas', days: 15, submitted: true, resolved: true },
        { ref: 'CG-2026-0157', scenario: 'scholarship', name: 'Priya', days: 19, submitted: true, resolved: true },
        { ref: 'CG-2026-0158', scenario: 'housing', name: 'Kavya', days: 1, submitted: false },
        { ref: 'CG-2026-0159', scenario: 'healthcare', name: 'Suresh', days: 22, submitted: true, resolved: true },
        { ref: 'CG-2026-0160', scenario: 'certificate', name: 'Mala', days: 5, submitted: true, missing: ['supporting'] },
    ];
    for (const s of seedApps) {
        const sc = scenarioForKey(s.scenario);
        const app = {
            id: uuid(),
            applicationId: s.ref,
            scenarioKey: s.scenario,
            applicant: { name: s.name, city: 'Coimbatore', occupation: 'Resident', address: `${14 + (s.days % 30)}, Demo Street, Coimbatore` },
            claims: sc.requirements.map((r) => ({ key: r.key, label: r.label, value: 'Claimed — evidence provided' })),
            status: s.submitted ? 'SUBMITTED' : 'DRAFT',
            coverage: 0, health: 0, aiConfidence: 0, blockingIssues: 0,
            createdAt: daysAgo(s.days),
            submittedAt: s.submitted ? daysAgo(s.days, 9) : undefined,
            updatedAt: daysAgo(Math.max(0, s.days - 1)),
            requirements: [],
            evidence: [],
            facts: [], assessments: [], issues: [], nextActions: [],
            reviewComments: [],
            evidenceVersions: [],
            assignedReviewer: 'u-reviewer',
            humanReview: { needed: !!s.humanReview, reasons: [], whatIsEstablished: [], whatIsUncertain: [], evidenceToInspect: [], recommendedAction: s.humanReview ? 'Land-holding record requires inspection: ownership status is ambiguous.' : '' },
            correctionHistory: [],
        };
        const base = SCENARIO_EVIDENCE[s.scenario] ?? [];
        if (s.submitted) {
            for (const e of base) {
                if (s.missing?.includes(e.req))
                    continue;
                let seed = e.seed;
                if (e.seed === 'income' && s.highIncome)
                    seed = 'income_high';
                if (e.seed === 'residence' && s.lowQualityResidence)
                    seed = 'residence_lowquality';
                app.evidence.push(evidenceFor(app, e.req, seed, `${s.name}_${seed}.pdf`, Math.max(1, s.days - 1)));
            }
            if (s.extraRoute)
                app.evidence.push(evidenceFor(app, 'route', 'route_b', `${s.name}_tertiary_declaration.pdf`, Math.max(1, s.days - 1)));
            analyzeApplication(app);
            if (s.resolved && app.status === 'READY_TO_PROCEED') {
                app.manualStatus = 'RESOLVED';
                analyzeApplication(app);
            }
            audit.push({
                id: uuid(), applicationId: app.id, actor: 'System', role: 'AI', action: 'ASSESSMENT_GENERATED',
                timestamp: app.updatedAt, reason: 'Deterministic analysis completed.', newState: app.status,
            });
        }
        apps.push(app);
    }
    // Sample analytics channel — a resolved recommendation with reviewer decision recorded
    const resolvedSample = apps.find((a) => a.applicationId === 'CG-2026-0157');
    resolvedSample.reviewComments.push({
        id: uuid(), action: 'ALLOW_PROCEED', note: 'All conditions verified. Scholarship sanctioned.', reason: 'Evidence complete and consistent.',
        actor: 'R. Priya', role: 'REVIEWER', previousStatus: 'READY_TO_PROCEED', newStatus: 'RESOLVED', createdAt: daysAgo(16),
    });
    const extraAudit = {
        id: uuid(), applicationId: flagshipApp.id, actor: 'R. Priya', role: 'REVIEWER', action: 'REQUEST_EVIDENCE',
        timestamp: daysAgo(3, 15), reason: 'Address conflict requires clarification',
        previousState: 'ADDITIONAL_EVIDENCE_REQUIRED', newState: 'ADDITIONAL_EVIDENCE_REQUIRED',
        details: { note: 'Please submit a corrected residence proof matching the income certificate address.' },
    };
    audit.push(extraAudit);
    // Some support-app notifications so the center is alive
    notifications.push({ id: uuid(), userId: 'u-reviewer', applicationId: apps.find((a) => a.applicationId === 'CG-2026-0151').id, applicationRef: 'CG-2026-0151', type: 'HUMAN_REVIEW', title: 'Human review required', message: 'Land ownership is ambiguous. Reviewer judgment required for CG-2026-0151.', read: false, createdAt: daysAgo(4) }, { id: uuid(), userId: 'u-citizen', applicationId: apps.find((a) => a.applicationId === 'CG-2026-0152').id, applicationRef: 'CG-2026-0152', type: 'MISSING_EVIDENCE', title: 'Evidence processed', message: 'Income verified for CG-2026-0152. Bank proof is still required.', read: false, createdAt: daysAgo(3) }, { id: uuid(), userId: 'u-reviewer', applicationId: apps.find((a) => a.applicationId === 'CG-2026-0155').id, applicationRef: 'CG-2026-0155', type: 'CONFLICT', title: 'New conflict detected', message: 'Commute route declarations conflict for CG-2026-0155.', read: false, createdAt: daysAgo(4) }, { id: uuid(), userId: 'u-citizen', applicationId: apps.find((a) => a.applicationId === 'CG-2026-0153').id, applicationRef: 'CG-2026-0153', type: 'RESOLVED', title: 'Issue resolved', message: 'All enrollment records verified for CG-2026-0153.', read: true, createdAt: daysAgo(2) });
    const unmatched = apps.find((a) => a.applicationId === 'CG-2026-0157');
    void unmatched;
    void resolvedSample;
    return { users: USERS, scenarios: SCENARIOS, applications: apps, notifications, audit, counters, seedDate: now };
}
