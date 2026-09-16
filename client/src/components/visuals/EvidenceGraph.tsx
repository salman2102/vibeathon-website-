import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ApplicationRecord, Evidence, ExtractedFact, RequirementStatusRecord } from '../../types';
import { cn } from '../../lib/utils';

type NodeKind = 'applicant' | 'claim' | 'requirement' | 'evidence' | 'fact' | 'rule' | 'assessment' | 'decision';

interface GNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  state: 'established' | 'uncertain' | 'conflict' | 'missing' | 'neutral';
  confidence?: number;
  targetId: string;
}

interface PanelData {
  kind: string;
  label: string;
  state: GNode['state'];
  confidence?: number;
  rows: Array<[string, string]>;
  note?: string;
}

const STATE_COLOR: Record<GNode['state'], string> = {
  established: '#10B981',
  uncertain: '#F59E0B',
  conflict: '#EF4444',
  missing: '#94A3B8',
  neutral: '#64748B',
};

const STATE_FILL: Record<GNode['state'], string> = {
  established: '#ECFDF5',
  uncertain: '#FFFBEB',
  conflict: '#FEF2F2',
  missing: '#F1F5F9',
  neutral: '#F8FAFC',
};

const KIND_LABEL: Record<NodeKind, string> = {
  applicant: 'Applicant',
  claim: 'Claim',
  requirement: 'Requirement',
  evidence: 'Evidence',
  fact: 'Extracted Fact',
  rule: 'Rule',
  assessment: 'Assessment',
  decision: 'Decision',
};

interface Edge { from: string; to: string; }

function graphStateFor(req: RequirementStatusRecord): GNode['state'] {
  switch (req.status) {
    case 'ESTABLISHED': return 'established';
    case 'CONFLICT': return 'conflict';
    case 'MISSING_EVIDENCE': return 'missing';
    case 'LOW_CONFIDENCE':
    case 'HUMAN_REVIEW': return 'uncertain';
    default: return 'conflict';
  }
}

function buildGraph(app: ApplicationRecord) {
  const nodes: GNode[] = [];
  const edges: Edge[] = [];

  nodes.push({ id: 'applicant', kind: 'applicant', label: app.applicant.name, sub: app.applicationId, state: 'neutral', targetId: 'applicant' });

  for (const c of app.claims ?? []) {
    nodes.push({ id: `claim:${c.key}`, kind: 'claim', label: c.label, state: 'neutral', targetId: c.key });
    edges.push({ from: 'applicant', to: `claim:${c.key}` });
  }

  for (const r of app.requirements) {
    nodes.push({ id: `req:${r.key}`, kind: 'requirement', label: r.label, sub: `${Math.round(r.confidence)}%`, state: graphStateFor(r), confidence: r.confidence, targetId: r.key });
    edges.push({ from: `claim:${r.key}`, to: `req:${r.key}` });
  }

  const EVIDENCE_NAMES: Record<string, string> = {
    identity: 'Identity Document', academic: 'Marksheet', income: 'Income Certificate', residence: 'Residence Proof',
    bank: 'Bank Proof', plot: 'Land Records', enrollment: 'Enrollment', fee: 'Fee Receipt', medical: 'Medical Report',
    route: 'Route Declaration', self_declaration: 'Self Declaration', supporting: 'Supporting Record',
  };
  for (const e of app.evidence.filter((x) => x.status === 'PROCESSED' && !x.superseded)) {
    const reqOk = app.requirements.find((r) => r.key === e.requirementKey)?.established;
    nodes.push({ id: `ev:${e.id}`, kind: 'evidence', label: EVIDENCE_NAMES[e.requirementKey] ?? e.fileName, sub: `${e.givesConfidence}% confident`, state: reqOk ? 'established' : 'uncertain', confidence: e.givesConfidence, targetId: e.id });
    edges.push({ from: `req:${e.requirementKey}`, to: `ev:${e.id}` });
  }

  const activeIds = new Set(app.evidence.filter((x) => x.status === 'PROCESSED' && !x.superseded).map((x) => x.id));
  for (const f of app.facts.filter((x) => activeIds.has(x.evidenceId))) {
    nodes.push({
      id: `fact:${f.id}`, kind: 'fact', label: f.label, sub: `${f.value} · ${Math.round(f.confidence)}%`,
      state: f.confidence >= 85 ? 'established' : f.confidence >= 70 ? 'uncertain' : 'conflict',
      confidence: f.confidence, targetId: f.id,
    });
    edges.push({ from: `ev:${f.evidenceId}`, to: `fact:${f.id}` });
    edges.push({ from: `fact:${f.id}`, to: `req:${f.requirementKey}` });
  }

  for (const r of app.requirements) {
    nodes.push({ id: `rule:${r.key}`, kind: 'rule', label: ruleShort(r), state: 'neutral', targetId: r.key });
    edges.push({ from: `req:${r.key}`, to: `rule:${r.key}` });
  }

  for (const a of app.assessments) {
    const st: GNode['state'] = a.result === 'ESTABLISHED' ? 'established' : a.result === 'CONFLICT' || a.result === 'NOT_ESTABLISHED' ? 'conflict' : a.result === 'MISSING_EVIDENCE' ? 'missing' : 'uncertain';
    nodes.push({ id: `as:${a.requirementKey}`, kind: 'assessment', label: a.requirementLabel, sub: a.result, state: st, confidence: a.confidence, targetId: a.requirementKey });
    edges.push({ from: `rule:${a.requirementKey}`, to: `as:${a.requirementKey}` });
  }

  if (app.decision) {
    const st: GNode['state'] = app.decision.status === 'READY_TO_PROCEED' || app.decision.status === 'RESOLVED' ? 'established' : app.decision.status === 'ADDITIONAL_EVIDENCE_REQUIRED' ? 'uncertain' : 'conflict';
    nodes.push({ id: 'decision', kind: 'decision', label: app.decision.title, sub: `${app.decision.aiConfidence}% confidence`, state: st, confidence: app.decision.aiConfidence, targetId: 'decision' });
    for (const a of app.assessments) edges.push({ from: `as:${a.requirementKey}`, to: 'decision' });
  }

  return { nodes, edges };
}

function ruleShort(r: RequirementStatusRecord): string {
  switch (r.key) {
    case 'income': return 'Income ≤ ₹3,00,000';
    case 'academic': return 'Marks ≥ 60%';
    case 'identity': return 'Name matches';
    case 'residence': return 'Address consistent';
    case 'bank': return 'Account present';
    default: return 'Field present & legible';
  }
}

const COLUMNS: Array<{ x: number; kind: NodeKind }> = [
  { x: 26, kind: 'applicant' },
  { x: 150, kind: 'claim' },
  { x: 268, kind: 'requirement' },
  { x: 386, kind: 'evidence' },
  { x: 512, kind: 'fact' },
  { x: 640, kind: 'rule' },
  { x: 762, kind: 'assessment' },
  { x: 892, kind: 'decision' },
];

function widthFor(kind: NodeKind) {
  switch (kind) {
    case 'fact': return 158;
    case 'claim': return 150;
    case 'evidence': return 132;
    case 'decision': return 156;
    default: return 122;
  }
}

function panelFor(app: ApplicationRecord, n: GNode): PanelData {
  const base = { kind: KIND_LABEL[n.kind], label: n.label, state: n.state, confidence: n.confidence };
  const reqOf = (key?: string) => app.requirements.find((r) => r.key === key);

  if (n.kind === 'applicant') {
    return {
      ...base,
      rows: [
        ['Source', 'Application record'],
        ['Extracted value', app.applicant.name],
        ['What it proves', 'This citizen is the subject of the case'],
        ['What it does not prove', 'Any of the assessed conditions'],
        ['Related issue', 'None'],
        ['Recommended action', 'Case folder owner for ' + app.applicationId],
      ],
      note: 'Case twin root — every claim traces back to the applicant.',
    };
  }
  if (n.kind === 'claim') {
    const claim = app.claims.find((c) => c.key === n.targetId);
    return {
      ...base,
      rows: [
        ['Source', 'Application form'],
        ['Extracted value', claim?.value ?? ''],
        ['What it proves', `${claim?.label ?? ''} is asserted by the applicant`],
        ['What it does not prove', 'Evidence has not yet verified this claim'],
        ['Related issue', reqOf(n.targetId) && !reqOf(n.targetId)!.established ? 'Claim unverified' : 'None'],
        ['Recommended action', 'Establish via the required evidence'],
      ],
    };
  }
  if (n.kind === 'requirement') {
    const r = reqOf(n.targetId);
    return {
      ...base,
      rows: [
        ['Source', 'Scenario policy definition'],
        ['Extracted value', r?.status ?? ''],
        ['Confidence', `${r?.confidence ?? 0}%`],
        ['Validation rule', r?.explanation ?? ''],
        ['What it proves', r ? (r.established ? `${r.label} is established.` : `${r.label} is not yet established.`) : ''],
        ['What it does not prove', r ? (r.established ? 'Nothing beyond this condition.' : 'The condition status remains open.') : ''],
        ['Related issue', app.issues.find((i) => i.requirementKey === n.targetId)?.title ?? 'None'],
        ['Recommended action', r?.established ? 'None — proceed.' : 'Supply the required evidence.'],
      ],
    };
  }
  if (n.kind === 'evidence') {
    const e = app.evidence.find((x) => x.id === n.targetId);
    const related = app.issues.filter((i) => i.evidenceId === e?.id);
    return { ...base, rows: [
      ['Source', e?.fileName ?? ''],
      ['Extracted value', e?.extractedFields.map((f) => `${f.label}: ${f.value}`).join(', ') ?? ''],
      ['Confidence', `${e?.givesConfidence ?? 0}%`],
      ['Validation rule', related[0]?.comparison ?? 'Cross-document comparison completed'],
      ['What it proves', e?.proves.join(' · ') ?? ''],
      ['What it does not prove', e?.notProves.join(' · ') ?? ''],
      ['Related issue', related.map((i) => i.title).join(' · ') || 'None'],
      ['Recommended action', e?.superseded ? 'Superseded by a newer version.' : (related[0]?.recommendation ?? 'No action required.')],
    ] };
  }
  if (n.kind === 'fact') {
    const f = app.facts.find((x) => x.id === n.targetId) as ExtractedFact | undefined;
    const req = reqOf(f?.requirementKey);
    return { ...base, rows: [
      ['Source', f?.source ?? ''],
      ['Extracted value', `${f?.label}: ${f?.value}`],
      ['Confidence', `${f?.confidence ?? 0}%`],
      ['Validation rule', `${req?.label ?? ''} rule evaluated against this value`],
      ['What it proves', `${f?.label} reported as ${f?.value} for ${req?.label ?? 'the case'}`],
      ['What it does not prove', 'Conclusiveness — facts are only as strong as document quality.'],
      ['Related issue', app.issues.find((i) => i.requirementKey === f?.requirementKey)?.title ?? 'None'],
      ['Recommended action', f && f.confidence < 85 ? 'Upload clearer evidence to raise confidence.' : 'None required.'],
    ] };
  }
  if (n.kind === 'rule') {
    const r = reqOf(n.targetId);
    return { ...base, rows: [
      ['Source', 'Scenario policy rule set'],
      ['Extracted value', ruleShort(r ?? ({ key: n.targetId }) as RequirementStatusRecord)],
      ['Validation rule', r?.explanation ?? ''],
      ['What it proves', r?.established ? 'The rule was satisfied by the evidence.' : 'The rule is not yet satisfied.'],
      ['What it does not prove', 'Overriding human judgment — rules are advisory in official review.'],
      ['Related issue', app.issues.find((i) => i.requirementKey === n.targetId)?.title ?? 'None'],
      ['Recommended action', r?.established ? 'None.' : 'Provide evidence the rule can evaluate.'],
    ] };
  }
  if (n.kind === 'assessment') {
    const a = app.assessments.find((x) => x.requirementKey === n.targetId);
    return { ...base, rows: [
      ['Source', 'Assessment engine (rule evaluation)'],
      ['Extracted value', a?.explanation.extractedFact ?? ''],
      ['Confidence', `${a?.confidence ?? 0}%`],
      ['Validation rule', a?.explanation.rule ?? ''],
      ['Comparison', a?.explanation.comparison ?? ''],
      ['What it proves', a?.explanation.whatItProves.join(' · ') ?? ''],
      ['What it does not prove', a?.explanation.whatItDoesNotProve.join(' · ') ?? ''],
      ['Related issue', app.issues.find((i) => i.requirementKey === n.targetId)?.title ?? 'None'],
      ['Recommended action', a?.explanation.nextAction ?? ''],
    ] };
  }
  return { ...base, rows: [
    ['Source', 'Case state machine + rule evaluation'],
    ['Extracted value', app.decision?.title ?? ''],
    ['Confidence', `${app.decision?.aiConfidence ?? 0}%`],
    ['Validation rule', 'Aggregate of all requirement assessments'],
    ['What it proves', `${app.decision?.conditionsEstablished ?? 0}/${app.decision?.conditionsTotal ?? 0} conditions established`],
    ['What it does not prove', 'An official administrative decision — always requires a reviewer'],
    ['Related issue', app.blockingIssues ? `${app.blockingIssues} blocking issue(s)` : 'None'],
    ['Recommended action', app.nextActions[0]?.title ?? 'Contact reviewer'],
  ] };
}

export function EvidenceGraph({ app, className }: { app: ApplicationRecord; className?: string }) {
  const { nodes, edges } = useMemo(() => buildGraph(app), [app]);
  const [selected, setSelected] = useState<string | null>(app.decision ? 'decision' : null);
  const [hovered, setHovered] = useState<string | null>(null);

  const active = hovered ?? selected;
  const activeNode = active ? nodes.find((n) => n.id === active) : undefined;

  const highlightSet = useMemo(() => {
    if (!active) return null;
    const s = new Set<string>([active]);
    edges.forEach((e) => {
      if (e.from === active || e.to === active) {
        s.add(e.from);
        s.add(e.to);
      }
    });
    return s;
  }, [active, edges]);

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    const col = (k: NodeKind) => COLUMNS.find((c) => c.kind === k)?.x ?? 0;
    m.set('applicant', { x: col('applicant'), y: 240 });
    const claims = nodes.filter((x) => x.kind === 'claim');
    const reqs = nodes.filter((x) => x.kind === 'requirement');
    const evs = nodes.filter((x) => x.kind === 'evidence');
    const facts = nodes.filter((x) => x.kind === 'fact');
    const rules = nodes.filter((x) => x.kind === 'rule');
    const assess = nodes.filter((x) => x.kind === 'assessment');
    const dec = nodes.filter((x) => x.kind === 'decision');
    claims.forEach((n, i) => m.set(n.id, { x: col('claim'), y: 70 + i * 92 }));
    reqs.forEach((n, i) => m.set(n.id, { x: col('requirement'), y: 34 + i * 92 }));
    evs.forEach((n, i) => m.set(n.id, { x: col('evidence'), y: 60 + i * 92 }));
    facts.forEach((n, i) => m.set(n.id, { x: col('fact'), y: 60 + (i % 8) * 86 + Math.floor(i / 8) * 54 }));
    rules.forEach((n, i) => m.set(n.id, { x: col('rule'), y: 34 + i * 92 }));
    assess.forEach((n, i) => m.set(n.id, { x: col('assessment'), y: 34 + i * 92 }));
    dec.forEach((n) => m.set(n.id, { x: col('decision'), y: 240 }));
    const top = Math.max(reqs.length, assess.length, rules.length, claims.length);
    const h = Math.max(340, Math.max(top * 96, evs.length * 100, facts.length * 14) + 60);
    return { m, h, colTop: 240 };
  }, [nodes]);

  const width = 1030;
  const panel = activeNode ? panelFor(app, activeNode) : null;

  return (
    <div className={cn('grid gap-3 xl:grid-cols-[1fr_310px]', className)}>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
          <p className="text-xs font-semibold text-charcoal-800">Evidence → Decision graph</p>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-charcoal-400">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-verified-500" /> Established</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-warn-400" /> Uncertain</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-conflict-500" /> Conflict</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-miss-500" /> Missing</span>
          </div>
        </div>
        <div className="grid-hero overflow-x-auto" style={{ backgroundSize: '28px 28px' }}>
          <svg viewBox={`0 44 ${width} ${pos.h}`} className="min-w-[820px]" role="img" aria-label="Interactive evidence graph: how evidence becomes the decision">
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="#94A3B8" />
              </marker>
            </defs>
            {edges.map((e, i) => {
              const a = pos.m.get(e.from);
              const b = pos.m.get(e.to);
              if (!a || !b) return null;
              const lit = highlightSet ? (highlightSet.has(e.from) && highlightSet.has(e.to)) : true;
              const d = `M ${a.x} ${a.y} C ${a.x + 44} ${a.y}, ${b.x - 44} ${b.y}, ${b.x} ${b.y}`;
              return (
                <motion.path
                  key={`${e.from}-${e.to}-${i}`}
                  d={d}
                  fill="none"
                  stroke={lit ? '#94A3B8' : '#E2E8F0'}
                  strokeWidth={lit ? 1.4 : 1}
                  markerEnd="url(#arrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: lit ? 0.9 : 0.3 }}
                  transition={{ duration: 0.6, delay: i * 0.012 }}
                  className={highlightSet === null ? 'flow-path' : undefined}
                />
              );
            })}
            {nodes.map((n) => {
              const p = pos.m.get(n.id)!;
              const w = widthFor(n.kind);
              const h = n.kind === 'decision' ? 46 : n.kind === 'fact' || n.kind === 'claim' ? 34 : 40;
              const color = STATE_COLOR[n.state];
              const dim = highlightSet ? !highlightSet.has(n.id) : false;
              return (
                <motion.g
                  key={n.id}
                  transform={`translate(${p.x - w / 2}, ${p.y - h / 2})`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: dim ? 0.25 : 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  cursor="pointer"
                  onClick={() => setSelected(n.id)}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  role="button"
                  aria-label={`${KIND_LABEL[n.kind]}: ${n.label}`}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(n.id); }}
                >
                  <motion.rect
                    width={w}
                    height={h}
                    rx={n.kind === 'decision' ? 23 : 8}
                    fill={STATE_FILL[n.state]}
                    stroke={color}
                    strokeWidth={activeNode?.id === n.id ? 2.5 : 1.25}
                    whileHover={{ y: -2 }}
                    filter={activeNode?.id === n.id ? 'drop-shadow(0 4px 8px rgba(11,27,51,0.15))' : undefined}
                  />
                  {n.kind === 'decision' && (
                    <circle cx={w / 2} cy={h / 2} r={w / 2 + 10} fill={color} fillOpacity={0.1} className="pulse-ring" />
                  )}
                  <text x={w / 2} y={n.kind === 'fact' || n.kind === 'claim' ? 21 : 17} textAnchor="middle" fontSize={n.kind === 'fact' ? 9.5 : 10.5} fontWeight={600} fill="#1E242E">
                    {truncate(n.label, 20)}
                  </text>
                  {n.kind !== 'fact' && n.kind !== 'claim' && (
                    <text x={w / 2} y={n.kind === 'decision' ? 33 : 30} textAnchor="middle" fontSize={8.5} fill="#64748B">
                      {truncate(n.sub ?? '', 24)}
                    </text>
                  )}
                  <circle cx={w - 9} cy={10} r={4} fill={color} />
                </motion.g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="h-fit rounded-lg border border-slate-200 bg-white" aria-live="polite">
        {panel ? (
          <div className="p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">{panel.kind}</p>
                <p className="text-sm font-semibold leading-5 text-charcoal-900">{panel.label}</p>
              </div>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: STATE_COLOR[panel.state], backgroundColor: `${STATE_COLOR[panel.state]}18` }}>
                {panel.state}
              </span>
            </div>
            <dl className="space-y-2.5">
              {panel.rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-400">{k}</dt>
                  <dd className="text-xs leading-5 text-charcoal-700">{v}</dd>
                </div>
              ))}
            </dl>
            {panel.note && <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] italic text-charcoal-400">{panel.note}</p>}
            <button onClick={() => setSelected(null)} className="mt-3 w-full rounded-md border border-slate-200 py-1.5 text-xs text-charcoal-500 hover:bg-slate-50">
              Clear selection
            </button>
          </div>
        ) : (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-xs font-medium text-charcoal-500">Click any node</p>
            <p className="text-[11px] leading-4 text-charcoal-350">Inspect source, extracted value, confidence, validation rule, what it proves, related issues and the recommended action.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s && s.length > n ? s.slice(0, n - 1) + '…' : s;
}