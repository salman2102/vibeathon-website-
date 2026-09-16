import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, FileText, GitBranch, Grid3X3, ListTree, RefreshCw, ScanSearch, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { useApplication } from '../lib/useCaseData';
import { DataState } from '../components/shared/DataState';
import { AppStatusBadge } from '../components/shared/StatusBadge';
import { EvidenceGraph } from '../components/visuals/EvidenceGraph';
import { CoverageMatrix } from '../components/visuals/CoverageMatrix';
import { ExplainableDecision } from '../components/visuals/ExplainableDecision';
import { HealthScore } from '../components/visuals/HealthScore';
import { NextActionsPanel } from '../components/visuals/NextActionsPanel';
import { ConflictRadar } from '../components/case/ConflictRadar';
import { Timeline } from '../components/case/Timeline';
import { DocumentIntelligence } from '../components/case/DocumentIntelligence';
import { HumanReviewPanel } from '../components/case/HumanReviewPanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'graph', label: 'Evidence Graph', icon: GitBranch },
  { id: 'coverage', label: 'Coverage', icon: Grid3X3 },
  { id: 'intelligence', label: 'Documents', icon: ScanSearch },
  { id: 'assessment', label: 'Assessment', icon: Scale },
  { id: 'conflicts', label: 'Conflicts', icon: Sparkles },
  { id: 'decision', label: 'Decision', icon: ListTree },
  { id: 'timeline', label: 'Timeline', icon: FileText },
];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ref = id ?? 'CG-2026-0148';
  const { app, loading, error, refresh } = useApplication(ref);
  const [tab, setTab] = useState('overview');

  const verdict = useMemo(() => {
    if (!app) return null;
    return {
      established: app.requirements.filter((r) => r.established).length,
      total: app.requirements.length,
    };
  }, [app]);

  if (loading && !app) return <DataState.Loading label={`Loading case ${ref}…`} />;
  if (error || !app) return <DataState.Error message={error ?? 'Case unavailable'} onRetry={refresh} />;

  const rows: Array<[string, string]> = [
    ['Applicant', app.applicant.name],
    ['Email', app.applicant.email ?? '—'],
    ['City', app.applicant.city ?? app.applicant.address ?? '—'],
    ['Occupation', app.applicant.occupation ?? '—'],
    ['Submitted', app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '—'],
    ['Updated', new Date(app.updatedAt).toLocaleString()],
    ['Assigned reviewer', app.assignedReviewer ?? app.reviewedBy ?? 'Awaiting assignment'],
    ['AI confidence', `${Math.round(app.aiConfidence)}%`],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/applications" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-charcoal-500 hover:bg-slate-50" aria-label="Back to applications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm font-bold text-charcoal-900">{app.applicationId}</h1>
              <AppStatusBadge status={app.status} size="sm" />
            </div>
            <p className="text-[12px] text-charcoal-500">{app.applicant.name} · {app.claims?.[0]?.label ?? app.scenarioKey}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refresh()} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-700 hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link to="/reviewer" className="inline-flex items-center gap-1.5 rounded-md bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Reviewer view
          </Link>
        </div>
      </div>

      {/* stats strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Conditions established', `${verdict?.established}/${verdict?.total}`, '#10B981'],
          ['Evidence coverage', `${app.coverage}%`, '#0EA5E9'],
          ['Case health', `${app.health}/100`, app.health >= 85 ? '#10B981' : app.health >= 70 ? '#F59E0B' : '#EF4444'],
          ['Blocking issues', `${app.blockingIssues}`, app.blockingIssues >= 3 ? '#EF4444' : '#F59E0B'],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] text-charcoal-500">{l}</p>
            <p className="stat-number text-2xl font-bold" style={{ color: c }}>{v}</p>
          </div>
        ))}
      </div>

      <Tabs.Root value={tab} onValueChange={setTab} className="w-full">
        <Tabs.List className="mb-4 flex flex-wrap gap-1 border-b border-slate-200 bg-transparent">
          {TABS.map((t) => (
            <Tabs.Trigger
              key={t.id}
              value={t.id}
              className="inline-flex items-center gap-1.5 rounded-t-md border-b-2 border-transparent px-3 py-2 text-xs font-medium text-charcoal-500 transition-colors hover:text-navy-900 data-[state=active]:border-accent-500 data-[state=active]:text-navy-900"
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="animate-in space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Case record</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-400">{k}</dt>
                    <dd className="text-[13px] text-charcoal-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-4">
              <HealthScore app={app} />
              <HumanReviewPanel app={app} onRefresh={refresh} />
            </div>
          </div>
          <NextActionsPanel app={app} />
        </Tabs.Content>

        <Tabs.Content value="graph" className="animate-in">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] text-charcoal-500">Interactive — click a node to see its source, confidence and the recommended action.</p>
          </div>
          <EvidenceGraph app={app} />
        </Tabs.Content>

        <Tabs.Content value="coverage" className="animate-in">
          <CoverageMatrix app={app} />
        </Tabs.Content>

        <Tabs.Content value="intelligence" className="animate-in">
          <DocumentIntelligence app={app} onRefreshAfter={refresh} />
        </Tabs.Content>

        <Tabs.Content value="assessment" className="animate-in">
          <ExplainableDecision app={app} />
        </Tabs.Content>

        <Tabs.Content value="conflicts" className="animate-in">
          <ConflictRadar app={app} />
        </Tabs.Content>

        <Tabs.Content value="decision" className="animate-in">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <ExplainableDecision app={app} />
            <div className="space-y-4">
              <Timeline app={app} />
              <HumanReviewPanel app={app} onRefresh={refresh} />
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="timeline" className="animate-in">
          <div className="grid gap-4 lg:grid-cols-2">
            <Timeline app={app} />
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Evidence versions</p>
              <div className="space-y-2">
                {(app.evidenceVersions ?? []).map((v) => (
                  <motion.div key={v.version} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-accent-700">v{v.version} · {v.fileName}</span>
                      <span className="text-[10px] text-charcoal-400">by {v.changedBy} · {new Date(v.uploadedAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-charcoal-500">{v.note}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {v.changedFields.map((f) => (
                        <span key={f} className="rounded bg-warn-50 px-1.5 py-px text-[10px] font-medium text-warn-700">{f} changed</span>
                      ))}
                      {v.issuesResolved.map((f) => (
                        <span key={f} className="rounded bg-verified-50 px-1.5 py-px text-[10px] font-medium text-verified-700">✓ {f}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {(app.evidenceVersions ?? []).length === 0 && <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-charcoal-400">No supersession events yet.</p>}
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}