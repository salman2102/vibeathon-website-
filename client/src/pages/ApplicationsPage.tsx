import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Search } from 'lucide-react';
import { useApplications } from '../lib/useCaseData';
import { DataState } from '../components/shared/DataState';
import { AppStatusBadge } from '../components/shared/StatusBadge';
import { STATUS_META, type AppStatus } from '../types';
import { cn } from '../lib/utils';

const FILTERS: Array<AppStatus | 'ALL'> = ['ALL', 'ADDITIONAL_EVIDENCE_REQUIRED', 'READY_TO_PROCEED', 'HUMAN_REVIEW_REQUIRED', 'RESOLVED', 'CONDITION_NOT_ESTABLISHED', 'SUBMITTED'];

export default function ApplicationsPage() {
  const [status, setStatus] = useState<AppStatus | 'ALL'>('ALL');
  const [q, setQ] = useState('');
  const { apps, loading, refresh } = useApplications();

  const filtered = apps.filter((a) => {
    if (status !== 'ALL' && a.status !== status) return false;
    if (q && !`${a.applicationId} ${a.applicant.name} ${a.scenarioKey}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-navy-900">Applications</h1>
          <p className="text-[12px] text-charcoal-500">{filtered.length} of {apps.length} fictional cases match</p>
        </div>
        <Link to="/apply" className="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accent-500">
          <ArrowUpRight className="h-3.5 w-3.5" /> New application
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID, name or scenario…"
            className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-[13px] text-charcoal-800 placeholder:text-charcoal-400 focus-visible:ring-2 focus-visible:ring-accent-500/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn(
                'rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                status === f ? 'border-navy-800 bg-navy-800 text-white' : 'border-slate-300 bg-white text-charcoal-600 hover:bg-slate-50',
              )}
            >
              {f === 'ALL' ? 'All' : STATUS_META[f as AppStatus].label}
            </button>
          ))}
        </div>
      </div>

      {loading && !apps.length ? (
        <DataState.Loading label="Loading applications…" />
      ) : filtered.length === 0 ? (
        <DataState.Empty title="No matching cases" hint="Try another status or search term." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.5) }}>
              <Link to={`/applications/${a.applicationId}`} className="block rounded-lg border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-charcoal-400">{a.applicationId}</span>
                  <AppStatusBadge status={a.status} size="sm" />
                </div>
                <p className="mt-2 text-sm font-bold text-charcoal-900">{a.applicant.name}</p>
                <p className="text-[11px] text-charcoal-500">{a.claims?.[0]?.label ?? a.scenarioKey}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                  <div>
                    <p className="stat-number text-sm font-bold text-charcoal-900">{Math.round(a.coverage)}%</p>
                    <p className="text-[10px] text-charcoal-400">coverage</p>
                  </div>
                  <div>
                    <p className="stat-number text-sm font-bold text-charcoal-900">{Math.round(a.health)}/100</p>
                    <p className="text-[10px] text-charcoal-400">health</p>
                  </div>
                  <div>
                    <p className="stat-number text-sm font-bold text-charcoal-900">{a.blockingIssues}</p>
                    <p className="text-[10px] text-charcoal-400">blockers</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}