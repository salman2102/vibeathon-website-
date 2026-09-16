import { DemoStore } from '../src/store/demoStore.js';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'cleargov-'));
const store = new DemoStore(join(dir, 'store.json'));

const flags = store.getApplication('CG-2026-0148')!;
console.log('before:', flags.status, 'coverage', flags.coverage, 'blocking', flags.blockingIssues);

store.addEvidence('CG-2026-0148', { requirement: 'residence', fileName: 'Salman_Residence_Proof_Corrected.pdf', seed: 'residence', uploadedBy: 'Salman' });
const afterRes = store.getApplication('CG-2026-0148')!;
console.log('after residence correction:', afterRes.status, afterRes.requirements.map((r) => `${r.key}=${r.status}`).join(' '));
console.log('  versions:', afterRes.evidenceVersions.map((v) => `#${v.version} changed=[${v.changedFields.join(',')}] resolved=[${v.issuesResolved.join(',')}]`).join(' | '));

store.addEvidence('CG-2026-0148', { requirement: 'bank', fileName: 'Salman_Bank_Passbook.pdf', seed: 'bank', uploadedBy: 'Salman' });
const afterBank = store.getApplication('CG-2026-0148')!;
console.log('after bank upload:', afterBank.status, 'coverage', afterBank.coverage, 'health', afterBank.health, 'blocking', afterBank.blockingIssues);
console.log('  versions:', afterBank.evidenceVersions.map((v) => `#${v.version} resolved=[${v.issuesResolved.join(',')}]`).join(' | '));
console.log('  next actions:', afterBank.nextActions.map((a) => `${a.priority}. ${a.title}`).join(' | '));

const audit = store.auditTrail('CG-2026-0148');
console.log('audit tail:', audit.slice(0, 3).map((e) => `${e.action}`).join(', '));

// reviewer escalation to HUMAN_REVIEW then allow proceed
store.reviewerAction('CG-2026-0148', { action: 'REQUEST_EVIDENCE', note: 'Hold while double-checking.', reason: 'Second opinion on address normalization.', actor: 'R. Priya' });
const afterReq = store.getApplication('CG-2026-0148')!;
console.log('after REQUEST_EVIDENCE on READY case:', afterReq.status);

const all = store.listApplications({});
console.log('list count:', all.length);
console.log('health:', JSON.stringify(store.health().checks));
console.log('analytics sample:', JSON.stringify(store.analytics().statusDist));
console.log('done');