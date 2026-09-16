import { createSeed } from '../src/store/seed.js';

const seed = createSeed();
const flagship = seed.applications.find((a) => a.applicationId === 'CG-2026-0148')!;
console.log('== FLAGSHIP (initial) ==');
console.log('status:', flagship.status);
console.log('coverage:', flagship.coverage, '(want 78)');
console.log('health:', flagship.health, '(want 82)');
console.log('aiConfidence:', flagship.aiConfidence, '(want 91)');
console.log('blockingIssues:', flagship.blockingIssues, '(want 2)');
console.log('established:', flagship.requirements.filter((r) => r.status === 'ESTABLISHED').length, '/', flagship.requirements.length);
console.log('requirements:', flagship.requirements.map((r) => `${r.key}=${r.status}(${r.confidence}%)`).join(' '));
console.log('issues:', flagship.issues.map((i) => `${i.type}:${i.title}`).join(' | '));
console.log('nextActions:', flagship.nextActions.map((a) => `${a.priority}. ${a.title}`).join(' | '));

const dist: Record<string, number> = {};
for (const a of seed.applications) dist[a.status] = (dist[a.status] ?? 0) + 1;
console.log('\nstatus distribution:', JSON.stringify(dist));
console.log('total apps:', seed.applications.length);
console.log('notifications:', seed.notifications.length, 'audit:', seed.audit.length);