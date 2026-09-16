import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, CheckCircle2, Loader2, ShieldCheck, UserCog } from 'lucide-react';
import type { ApplicationRecord } from '../../types';
import { SeverityBadge } from '../shared/StatusBadge';
import { useApp } from '../../store/AppContext';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function HumanReviewPanel({ app, onRefresh }: { app: ApplicationRecord; onRefresh?: () => void }) {
  const { user, role } = useApp();
  const hr = app.humanReview;
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (action: string, issueId?: string) => {
    setBusy(action + (issueId ?? ''));
    try {
      await api.post(`/api/reviewer/applications/${app.applicationId}/action`, { action, issueId, actor: user.name });
      onRefresh?.();
    } finally {
      setBusy(null);
    }
  };

  const isReviewer = role === 'REVIEWER' || role === 'ADMIN';

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <p className={cn('flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider', hr.needed ? 'text-warn-700' : 'text-verified-700')}>
          {hr.needed ? <AlertOctagon className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />} Human-in-the-loop
        </p>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', hr.needed ? 'bg-warn-50 text-warn-700' : 'bg-verified-50 text-verified-700')}>
          {hr.needed ? 'INTERVENTION REQUIRED' : 'AI PROCEEDED'}
        </span>
      </div>

      {hr.needed ? (
        <div className="p-4">
          <p className="text-xs leading-5 text-charcoal-600">{hr.recommendedAction}</p>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Why AI stopped</p>
              <ul className="space-y-1">
                {hr.reasons.map((r) => (
                  <li key={r.id} className="flex items-start gap-1.5 rounded bg-conflict-50 px-2 py-1 text-[11px] text-conflict-700">
                    <SeverityBadge severity={r.severity} /> {r.title}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">What is established</p>
              <ul className="space-y-1">
                {hr.whatIsEstablished.map((s) => (
                  <li key={s} className="flex items-center gap-1.5 rounded bg-verified-50 px-2 py-1 text-[11px] text-verified-700">
                    <CheckCircle2 className="h-3 w-3 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">What is uncertain</p>
              <ul className="space-y-1">
                {hr.whatIsUncertain.map((s) => (
                  <li key={s} className="flex items-center gap-1.5 rounded bg-warn-50 px-2 py-1 text-[11px] text-warn-700">
                    <span className="text-[10px]">●</span> {s}
                  </li>
                ))}
              </ul>
              <p className="mb-1 mt-2 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Evidence to inspect</p>
              <ul className="space-y-1">
                {hr.evidenceToInspect.map((s) => (
                  <li key={s} className="rounded bg-slate-50 px-2 py-1 font-mono text-[10px] text-charcoal-600">{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {isReviewer ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button onClick={() => act('ALLOW_PROCEED')} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-md bg-verified-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-verified-500 disabled:opacity-50">
                {busy === 'ALLOW_PROCEED' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Allow proceed
              </button>
              {hr.reasons.map((r) => (
                <button key={r.id} onClick={() => act('MARK_ISSUE_RESOLVED', r.id)} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-700 hover:bg-slate-50 disabled:opacity-50">
                  {busy === 'MARK_ISSUE_RESOLVED' + r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-verified-600" />} Resolve “{r.title}”
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-charcoal-400">
              <UserCog className="h-3.5 w-3.5" /> Reviewer action required. <Link to="/reviewer" className="font-semibold text-accent-600 hover:underline">Open the reviewer queue →</Link>
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-10 w-10 items-center justify-center rounded-full bg-verified-50 text-verified-600">
            <ShieldCheck className="h-5 w-5" />
          </motion.span>
          <div>
            <p className="text-[13px] font-semibold text-charcoal-900">ClearGov assessed without blocking human review</p>
            <p className="text-xs text-charcoal-500">The final administrative decision still rests with an authorized reviewer.</p>
          </div>
        </div>
      )}
    </div>
  );
}