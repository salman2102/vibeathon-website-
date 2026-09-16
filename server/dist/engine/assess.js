import { v4 as uuid } from 'uuid';
import { SCENARIOS } from '../scenarios.js';
/** Normalise values for comparison: lowercase, strip spaces/₹/commas. */
export function norm(v) {
    return String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function latestEvidence(app, requirementKey) {
    return app.evidence
        .filter((e) => e.requirementKey === requirementKey && e.status === 'PROCESSED' && !e.superseded)
        .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}
function reqDef(scenarioKey, key) {
    const sc = SCENARIOS.find((s) => s.key === scenarioKey);
    return sc?.requirements.find((r) => r.key === key);
}
function ruleText(req) {
    if (!req)
        return '';
    const r = req.rule;
    if (r.type === 'threshold') {
        let th = String(r.threshold);
        if (r.field === 'annual_income')
            th = `₹${Number(r.threshold).toLocaleString('en-IN')}`;
        if (r.field === 'marks_percent')
            th = `${r.threshold}%`;
        return `${r.label} must be ${r.operator === '<=' ? 'at or below' : 'at least'} ${th}`;
    }
    return `The ${r.label} on the evidence must match the applicant's claim and be legible.`;
}
function detectCrossDocumentConflicts(app) {
    const byKey = {};
    const current = app.evidence.filter((e) => e.status === 'PROCESSED' && !e.superseded);
    for (const ev of current) {
        for (const f of ev.extractedFields) {
            if (['id_number', 'account_number', 'ifsc'].includes(f.key))
                continue;
            (byKey[f.key] ??= []).push({ value: f.value, label: f.label, file: ev.fileName, evidenceId: ev.id, confidence: f.confidence });
        }
    }
    const raw = [];
    for (const [key, items] of Object.entries(byKey)) {
        const distinct = [...new Set(items.map((i) => norm(i.value)))];
        if (distinct.length > 1) {
            raw.push({
                key,
                label: items[0].label,
                pairs: items.map((i) => ({ value: i.value, file: i.file, evidenceId: i.evidenceId, confidence: i.confidence })),
            });
        }
    }
    // Merge conflicts that involve the same set of documents into a single cluster,
    // so one disputed pair of documents produces one issue (e.g. Address/District).
    const clusters = [];
    for (const c of raw) {
        const sig = [...new Set(c.pairs.map((p) => p.evidenceId))].sort().join('|');
        const existing = clusters.find((cl) => [...new Set(cl.pairs.map((p) => p.evidenceId))].sort().join('|') === sig);
        if (existing) {
            existing.keys.push(c.key);
            existing.label = existing.keys.map((k) => (k === 'address' ? 'Address' : k === 'district' ? 'District' : k)).join(' / ');
        }
        else {
            clusters.push({ keys: [c.key], label: c.key === 'address' ? 'Address' : c.key === 'district' ? 'District' : c.key, pairs: c.pairs });
        }
    }
    return clusters;
}
function assessmentConfidence(status, evidenceConf, issueConf) {
    switch (status) {
        case 'ESTABLISHED':
            return Math.round(evidenceConf - 2);
        case 'CONFLICT':
            return Math.round(issueConf - 5);
        case 'LOW_CONFIDENCE':
            return Math.round(evidenceConf - 3);
        case 'MISSING_EVIDENCE':
            return 83; // detection confidence — a missing slot is itself highly certain
        case 'NOT_ESTABLISHED':
            return Math.round(evidenceConf - 2);
        case 'HUMAN_REVIEW':
            return 70;
    }
}
export function analyzeApplication(app) {
    const conflicts = detectCrossDocumentConflicts(app);
    const meaningFulConflicts = conflicts.filter((c) => c.keys.some((k) => ['address', 'district'].includes(k)));
    const facts = [];
    for (const ev of app.evidence.filter((e) => e.status === 'PROCESSED' && !e.superseded)) {
        for (const f of ev.extractedFields) {
            facts.push({
                id: uuid(),
                evidenceId: ev.id,
                requirementKey: ev.requirementKey,
                key: f.key,
                label: f.label,
                value: f.value,
                confidence: f.confidence,
                category: 'evidence',
                source: ev.fileName,
            });
        }
    }
    app.facts = facts;
    const requirements = [];
    const assessments = [];
    const issues = [];
    for (const req of SCENARIOS.find((s) => s.key === app.scenarioKey)?.requirements ?? []) {
        const evList = latestEvidence(app, req.key);
        const evidence = evList[0];
        const evidenceConf = evidence
            ? Math.round(evidence.extractedFields.reduce((a, f) => a + f.confidence, 0) / Math.max(1, evidence.extractedFields.length))
            : 0;
        const ruleFacts = {};
        for (const f of facts)
            if (f.requirementKey === req.key)
                ruleFacts[f.key] = f;
        if (evidence)
            for (const f of evidence.extractedFields)
                ruleFacts[f.key] = { ...f, requirementKey: req.key, category: 'evidence', source: evidence.fileName };
        const ruleResult = req.rule.explain ? req.rule.explain(ruleFacts) : { passed: false, humanCheck: '' };
        const reqConflicts = meaningFulConflicts.filter((c) => c.keys.some((k) => evidence?.extractedFields.some((f) => f.key === k)));
        const conflictHere = reqConflicts.length > 0 && req.rule.type === 'field' && reqConflicts.some((c) => c.keys.includes(req.rule.field));
        let status;
        let statusReason;
        if (!evidence) {
            status = 'MISSING_EVIDENCE';
            statusReason = `No valid ${req.evidenceLabel} has been uploaded for ${req.label}.`;
            issues.push({
                id: uuid(),
                type: 'MISSING_EVIDENCE',
                severity: 'CRITICAL',
                title: `${req.label} — missing evidence`,
                explanation: `The requirement "${req.label}" needs a ${req.evidenceLabel.toLowerCase()}, but none has been provided. Nothing can be established without it.`,
                requirementKey: req.key,
                confidence: 99,
                recommendation: `Upload a valid ${req.evidenceLabel.toLowerCase()} so the ${req.label} requirement can be assessed.`,
                status: 'OPEN',
                createdAt: new Date().toISOString(),
            });
        }
        else if (conflictHere) {
            const c = reqConflicts[0];
            status = 'CONFLICT';
            statusReason = `Conflicting ${c.label.toLowerCase()} values were extracted from different documents (${c.pairs.map((p) => `"${p.value}" in ${p.file}`).join('; ')}).`;
            issues.push({
                id: uuid(),
                type: 'ADDRESS_MISMATCH',
                severity: 'CONFLICT',
                title: `${c.label} information conflicts between documents`,
                explanation: `${c.label} was extracted as ${c.pairs.map((p) => `"${p.value}" from ${p.file}`).join(' and ')}. Cross-document comparison could not reconcile the difference.`,
                evidenceId: evidence.id,
                evidenceFileName: evidence.fileName,
                requirementKey: req.key,
                source: c.pairs.map((p) => p.file).join(', '),
                comparison: c.pairs.map((p) => `"${p.value}" — ${p.file}`).join('   vs   '),
                confidence: Math.max(...c.pairs.map((p) => p.confidence)),
                recommendation: `Upload a corrected ${req.evidenceLabel.toLowerCase()} so the ${c.label.toLowerCase()} matches all other documents, or contact the reviewer to clarify the discrepancy.`,
                status: 'OPEN',
                createdAt: new Date().toISOString(),
            });
        }
        else if (!ruleResult.passed) {
            status = 'NOT_ESTABLISHED';
            statusReason = `${req.label} could not be established — the rule was not satisfied.`;
            issues.push({
                id: uuid(),
                type: 'INVALID_DOCUMENT',
                severity: 'WARNING',
                title: `${req.label} condition not met`,
                explanation: `${req.label}: ${ruleResult.humanCheck} Actual extracted value did not satisfy the rule (${ruleResult.comparison ?? 'rule failed'}).`,
                evidenceId: evidence.id,
                evidenceFileName: evidence.fileName,
                requirementKey: req.key,
                confidence: evidenceConf,
                recommendation: `Provide evidence that satisfies "${ruleText(req)}" or contact the reviewer to challenge the rule.`,
                status: 'OPEN',
                createdAt: new Date().toISOString(),
            });
        }
        else if (evidenceConf < req.minConfidence) {
            status = 'LOW_CONFIDENCE';
            statusReason = `The ${req.label} evidence passed the rule but extraction confidence (${evidenceConf}%) is below the ${req.minConfidence}% threshold.`;
            issues.push({
                id: uuid(),
                type: 'LOW_QUALITY',
                severity: 'WARNING',
                title: `${req.label} — low confidence extraction`,
                explanation: `Fields were extracted with average confidence ${evidenceConf}%, below the required ${req.minConfidence}%. The document may be blurry, truncated or non-standard.`,
                evidenceId: evidence.id,
                evidenceFileName: evidence.fileName,
                requirementKey: req.key,
                confidence: evidenceConf,
                recommendation: `Upload a clearer copy of the ${req.evidenceLabel.toLowerCase()} to raise extraction confidence.`,
                status: 'OPEN',
                createdAt: new Date().toISOString(),
            });
        }
        else {
            status = 'ESTABLISHED';
            statusReason = `${req.label} is established with confidence ${assessmentConfidence('ESTABLISHED', evidenceConf, 0)}%.`;
        }
        const confidence = assessmentConfidence(status, evidenceConf, issues.length ? Math.max(...issues.filter((i) => i.requirementKey === req.key).map((i) => i.confidence)) : 94);
        const ruleField = req.rule.field ? ruleFacts[req.rule.field] : undefined;
        const extractedFactText = ruleField
            ? `${ruleField.label}: ${ruleField.value}`
            : (evidence ? `${evidence.extractedFields.map((f) => `${f.label}: ${f.value}`).join(', ')}` : `No ${req.evidenceLabel.toLowerCase()} uploaded`);
        const assessment = {
            requirementKey: req.key,
            requirementLabel: req.label,
            result: status,
            confidence,
            explanation: {
                claim: `The applicant asserts they satisfy "${req.label}". ${req.description}`,
                evidence: evidence ? `${req.evidenceLabel} — ${evidence.fileName}` : `${req.evidenceLabel} — not uploaded`,
                extractedFact: extractedFactText,
                rule: ruleText(req),
                comparison: ruleResult.comparison ?? (status === 'ESTABLISHED' ? 'The evidence satisfied the rule' : ruleResult.humanCheck),
                result: status,
                whatItProves: status === 'ESTABLISHED' ? [req.label + ' is established.'] : (evidence?.proves ?? []),
                whatItDoesNotProve: evidence?.notProves ?? [`A ${req.evidenceLabel.toLowerCase()} is required to establish ${req.label}.`],
                nextAction: status === 'MISSING_EVIDENCE' ? `Upload a valid ${req.evidenceLabel.toLowerCase()}.` :
                    status === 'CONFLICT' ? `Resolve the address mismatch by uploading a corrected ${req.evidenceLabel.toLowerCase()}.` :
                        status === 'LOW_CONFIDENCE' ? `Upload a clearer copy of the ${req.evidenceLabel.toLowerCase()}.` :
                            status === 'NOT_ESTABLISHED' ? `Provide evidence that satisfies: ${ruleText(req)}.` :
                                'None required — condition established.',
            },
            createdAt: new Date().toISOString(),
        };
        assessments.push(assessment);
        requirements.push({
            key: req.key,
            label: req.label,
            status,
            confidence,
            explanation: statusReason,
            evidenceIds: [evidence?.id].filter(Boolean),
            established: status === 'ESTABLISHED',
        });
    }
    const openIssues = issues;
    app.issues = openIssues;
    app.assessments = assessments;
    const reqRecords = requirements;
    const establishedCount = reqRecords.filter((r) => r.status === 'ESTABLISHED').length;
    const coverageFor = (st) => st === 'ESTABLISHED' ? 100 : st === 'CONFLICT' ? 90 : st === 'LOW_CONFIDENCE' ? 55 : st === 'NOT_ESTABLISHED' ? 25 : st === 'HUMAN_REVIEW' ? 65 : 0;
    const coverage = Math.round(reqRecords.reduce((a, r) => a + coverageFor(r.status), 0) / Math.max(1, reqRecords.length));
    const allProcessed = app.evidence.filter((e) => e.status === 'PROCESSED');
    const readability = allProcessed.length ? Math.round(allProcessed.reduce((a, e) => a + e.readability, 0) / allProcessed.length) : 0;
    const validity = Math.round((reqRecords.filter((r) => r.status !== 'MISSING_EVIDENCE').length / Math.max(1, reqRecords.length)) * 100);
    const consistency = Math.max(0, 100 - 35 * meaningFulConflicts.length);
    const aiConfidence = Math.round(reqRecords.reduce((a, r) => a + r.confidence, 0) / Math.max(1, reqRecords.length));
    const blocking = reqRecords.filter((r) => ['MISSING_EVIDENCE', 'CONFLICT', 'LOW_CONFIDENCE', 'NOT_ESTABLISHED'].includes(r.status)).length;
    const health = Math.round(0.25 * coverage + 0.2 * readability + 0.2 * validity + 0.15 * consistency + 0.2 * aiConfidence);
    app.coverage = coverage;
    app.health = health;
    app.aiConfidence = aiConfidence;
    app.blockingIssues = blocking;
    app.requirements = reqRecords;
    const humanReviewNeeded = reqRecords.some((r) => r.status === 'HUMAN_REVIEW') || app.humanReview.needed;
    const evidenceToInspect = reqRecords.filter((r) => ['CONFLICT', 'LOW_CONFIDENCE'].includes(r.status)).map((r) => r.label);
    const status = app.manualStatus === 'RESOLVED'
        ? 'RESOLVED'
        : humanReviewNeeded
            ? 'HUMAN_REVIEW_REQUIRED'
            : blocking > 0
                ? 'ADDITIONAL_EVIDENCE_REQUIRED'
                : 'READY_TO_PROCEED';
    const SUMMARY = {
        DRAFT: 'Application is still a draft.',
        SUBMITTED: 'Application submitted and awaiting analysis.',
        ANALYZING: 'Analysis in progress.',
        ADDITIONAL_EVIDENCE_REQUIRED: `${blocking} blocking issue${blocking > 1 ? 's' : ''} prevent${blocking > 1 ? '' : 's'} this case from proceeding. ${establishedCount}/${reqRecords.length} conditions are established.`,
        HUMAN_REVIEW_REQUIRED: 'AI paused this case because it requires human judgment.',
        CONDITION_NOT_ESTABLISHED: 'At least one core condition could not be established. The application does not currently qualify.',
        READY_TO_PROCEED: `All ${reqRecords.length} conditions are established (${coverage}% coverage, health ${health}/100). The case is ready for official review.`,
        RESOLVED: 'This case has been resolved by an authorized reviewer.',
    };
    const TITLES = {
        DRAFT: 'DRAFT',
        SUBMITTED: 'SUBMITTED',
        ANALYZING: 'ANALYZING',
        ADDITIONAL_EVIDENCE_REQUIRED: 'ADDITIONAL EVIDENCE REQUIRED',
        HUMAN_REVIEW_REQUIRED: 'HUMAN REVIEW REQUIRED',
        CONDITION_NOT_ESTABLISHED: 'CONDITION NOT ESTABLISHED',
        READY_TO_PROCEED: 'READY TO PROCEED',
        RESOLVED: 'RESOLVED',
    };
    const decision = {
        status,
        title: TITLES[status],
        summary: SUMMARY[status],
        aiConfidence,
        conditionsEstablished: establishedCount,
        conditionsTotal: reqRecords.length,
        coverage,
        health,
        blockingIssues: blocking,
        humanReviewRequired: humanReviewNeeded,
        createdAt: new Date().toISOString(),
    };
    app.decision = decision;
    app.status = status;
    app.nextActions = buildNextActions(app, reqRecords, status);
    app.humanReview = {
        needed: humanReviewNeeded,
        reasons: reqRecords
            .filter((r) => ['CONFLICT', 'LOW_CONFIDENCE', 'HUMAN_REVIEW'].includes(r.status))
            .map((r) => issues.find((i) => i.requirementKey === r.key))
            .filter(Boolean),
        whatIsEstablished: reqRecords.filter((r) => r.status === 'ESTABLISHED').map((r) => r.label),
        whatIsUncertain: reqRecords.filter((r) => ['CONFLICT', 'LOW_CONFIDENCE', 'HUMAN_REVIEW'].includes(r.status)).map((r) => r.label),
        evidenceToInspect,
        recommendedAction: status === 'READY_TO_PROCEED'
            ? 'No human intervention required. Authorize the case to proceed to official administrative review.'
            : 'Inspect the flagged evidence, resolve the outstanding issues, and re-assess the case.',
    };
    app.updatedAt = new Date().toISOString();
    app.blockingIssues = blocking;
    return app;
}
function buildNextActions(app, reqs, status) {
    const actions = [];
    const missing = reqs.find((r) => r.status === 'MISSING_EVIDENCE');
    const conflict = reqs.find((r) => r.status === 'CONFLICT');
    const lowConf = reqs.find((r) => r.status === 'LOW_CONFIDENCE');
    const notEst = reqs.find((r) => r.status === 'NOT_ESTABLISHED');
    if (missing) {
        actions.push({
            key: 'upload_' + missing.key,
            title: `Upload valid ${missingLabel(app.scenarioKey, missing.key).toLowerCase()}`,
            priority: 1,
            reason: `${missing.label} is mandatory and currently missing. Providing it can resolve one blocking requirement.`,
            prompt: `Upload a clear, legible copy of the ${missingLabel(app.scenarioKey, missing.key).toLowerCase()} so ClearGov can extract the required fields.`,
            category: 'evidence',
            done: false,
        });
    }
    if (conflict) {
        actions.push({
            key: 'resolve_' + conflict.key,
            title: `Resolve ${conflict.label.toLowerCase()} address mismatch`,
            priority: 2,
            reason: 'Conflicting address values across documents prevent this requirement from being established.',
            prompt: 'Upload a corrected residence proof whose address matches the income certificate, or contact the reviewer to clarify.',
            category: 'resolution',
            done: false,
        });
    }
    if (lowConf) {
        actions.push({
            key: 'replace_' + lowConf.key,
            title: `Replace unreadable ${lowConf.label.toLowerCase()} evidence`,
            priority: 3,
            reason: 'Extraction confidence is below the acceptable threshold — the document may be unreadable.',
            prompt: 'Upload a higher-quality scan of the document.',
            category: 'evidence',
            done: false,
        });
    }
    if (notEst) {
        actions.push({
            key: 'remedy_' + notEst.key,
            title: `Provide additional information for ${notEst.label.toLowerCase()}`,
            priority: 3,
            reason: 'The current evidence does not satisfy the eligibility rule.',
            prompt: 'Provide an alternative document that establishes this condition.',
            category: 'information',
            done: false,
        });
    }
    if (status === 'READY_TO_PROCEED' || status === 'RESOLVED') {
        actions.push({
            key: 'proceed',
            title: 'Proceed to official review',
            priority: 1,
            reason: 'All conditions are established. Official administrative decision remains with an authorized reviewer.',
            prompt: 'Send the assembled case to a reviewer for final resolution.',
            category: 'proceed',
            done: false,
        });
    }
    actions.push({
        key: 'contact_reviewer',
        title: 'Contact reviewer',
        priority: 9,
        reason: 'If you believe the assessment is incorrect or you need clarification, the assigned reviewer can help.',
        prompt: 'Request a human review if you disagree with the automated assessment.',
        category: 'review',
        done: false,
    });
    return actions.sort((a, b) => a.priority - b.priority);
}
function missingLabel(scenarioKey, reqKey) {
    const sc = SCENARIOS.find((s) => s.key === scenarioKey);
    const req = sc?.requirements.find((r) => r.key === reqKey);
    return req?.evidenceLabel ?? 'Evidence';
}
export function decideStatus(conflicts, missing, lowConf, notEst, humanReview) {
    if (humanReview)
        return 'HUMAN_REVIEW_REQUIRED';
    if (missing > 0 || conflicts > 0 || lowConf > 0)
        return 'ADDITIONAL_EVIDENCE_REQUIRED';
    if (notEst > 0)
        return 'CONDITION_NOT_ESTABLISHED';
    return 'READY_TO_PROCEED';
}
