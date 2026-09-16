import { motion } from 'framer-motion';
import type { ApplicationRecord, RequirementStatus } from '../../types';
import { AppStatusBadge, ReqStatusBadge } from '../shared/StatusBadge';
import { NextActionsPanel } from './NextActionsPanel';
import { cn } from '../../lib/utils';

const RESULT_COLOR: Record<RequirementStatus, string> = {
  ESTABLISHED: '#10B981', NOT_ESTABLISHED: '#EF4444', MISSING_EVIDENCE: '#64748B',
  CONFLICT: '#EF4444', LOW_CONFIDENCE: '#F59E0B', HUMAN_REVIEW: '#EA580C',
};

function Step({ kind, value, tone }: { kind: 'CLAIM' | 'EVIDENCE' | 'FACT' | 'RULE' | 'COMPARISON' | 'RESULT' | 'NEXT'; value: string; tone: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: tone }}>{kind}</span>
      <p className="text-xs leading-5 text-charcoal-700">{value}</p>
    </div>
  );
}

export function ExplainableDecision({ app }: { app: ApplicationRecord }) {
  const d = app.decision;
  return (
    <div className="space-y-4">
      {d && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-3">
            <AppStatusBadge status={d.status} />
            <p className="text-[13px] font-semibold text-charcoal-900">{d.title}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-charcoal-500">
            <span><b className="text-charcoal-900">{d.conditionsEstablished}/{d.conditionsTotal}</b> conditions</span>
            <span><b className="text-charcoal-900">{d.coverage}%</b> coverage</span>
            <span><b className="text-charcoal-900">{d.health}/100</b> health</span>
            <span><b className="text-charcoal-900">{d.aiConfidence}%</b> AI confidence</span>
          </div>
        </motion.div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {app.assessments.map((a, i) => {
          const tone = RESULT_COLOR[a.result];
          const ex = a.explanation;
          return (
            <motion.section
              key={a.requirementKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-charcoal-900">{a.requirementLabel}</p>
                  <p className="text-[11px] text-charcoal-400">{a.requirementKey}</p>
                </div>
                <ReqStatusBadge status={a.result} />
              </header>
              <div className="space-y-1.5 px-4 py-3">
                <Step kind="CLAIM" value={ex.claim} tone={tone} />
                <Step kind="EVIDENCE" value={ex.evidence} tone={tone} />
                <Step kind="FACT" value={ex.extractedFact} tone={tone} />
                <Step kind="RULE" value={ex.rule} tone={tone} />
                <Step kind="COMPARISON" value={ex.comparison} tone={tone} />
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-dashed border-slate-200 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tone }}>What it proves</span>
                  <span className="text-xs text-charcoal-600">{ex.whatItProves.join(' · ')}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">What it does not prove</span>
                  <span className="text-xs text-charcoal-500">{ex.whatItDoesNotProve.join(' · ')}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-medium text-charcoal-600">Next action</p>
                  <p className="text-right text-[11px] text-charcoal-700">{a.explanation.nextAction}</p>
                </div>
              </div>
              <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2">
                <span className="text-[11px] text-charcoal-400">{fmtDate(a.createdAt)}</span>
                <div className="w-28">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <motion.div className={cn('h-full rounded-full', a.confidence >= 85 ? 'bg-verified-500' : a.confidence >= 70 ? 'bg-warn-500' : 'bg-conflict-500')}
                      initial={{ width: 0 }} animate={{ width: `${a.confidence}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <p className="mt-0.5 text-right text-[10px] font-medium text-charcoal-400">Confidence {Math.round(a.confidence)}%</p>
                </div>
              </footer>
            </motion.section>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-accent-200 bg-accent-50/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-accent-700">How the decision was reached</p>
          <p className="mt-1.5 text-xs leading-6 text-charcoal-700">{d?.summary}</p>
          <p className="mt-2 text-[11px] italic text-charcoal-400">AI assistance produces a recommendation. The final administrative decision always belongs to an authorized reviewer.</p>
        </div>
        <NextActionsPanel app={app} />
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}