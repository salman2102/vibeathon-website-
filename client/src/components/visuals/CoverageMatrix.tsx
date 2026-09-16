import { useState } from 'react';
import { ChevronDown, FileText, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApplicationRecord } from '../../types';
import { ReqStatusBadge } from '../shared/StatusBadge';
import { cn } from '../../lib/utils';

export function CoverageMatrix({ app, defaultOpenKey }: { app: ApplicationRecord; defaultOpenKey?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpenKey ?? null);
  const rows = app.requirements.map((r) => {
    const evidence = app.evidence.filter((e) => e.requirementKey === r.key && !e.superseded);
    const superseded = app.evidence.filter((e) => e.requirementKey === r.key && e.superseded);
    const facts = app.facts.filter((f) => f.requirementKey === r.key);
    const assessment = app.assessments.find((a) => a.requirementKey === r.key);
    return { req: r, evidence, superseded, facts, assessment };
  });

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Coverage matrix</p>
        <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700">
          {rows.filter((x) => x.req.established).length}/{rows.length} conditions · {app.coverage}% coverage
        </span>
      </div>
      <ul>
        {rows.map(({ req, evidence, superseded, facts, assessment }, i) => {
          const isOpen = open === req.key;
          const statusVar: 'verified' | 'warn' | 'conflict' | 'miss' =
            req.status === 'ESTABLISHED' ? 'verified' : req.status === 'CONFLICT' ? 'conflict' : req.status === 'MISSING_EVIDENCE' || req.status === 'NOT_ESTABLISHED' ? 'miss' : 'warn';
          return (
            <li key={req.key} className={cn('border-b border-slate-100 last:border-0', i % 2 === 1 && 'bg-slate-50/40')}>
              <button
                onClick={() => setOpen(isOpen ? null : req.key)}
                className="grid w-full grid-cols-[auto_1fr_repeat(3,minmax(0,1fr))_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                aria-expanded={isOpen}
              >
                <ChevronDown className={cn('h-4 w-4 text-charcoal-400 transition-transform', isOpen && 'rotate-180')} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-charcoal-900">{req.label}</p>
                  <p className="truncate text-[11px] text-charcoal-400">{req.key}</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-charcoal-700">{evidence.length ? evidence.map((e) => shortFile(e.fileName)).join(', ') : '—'}</p>
                  {superseded.length > 0 && <p className="text-[11px] text-charcoal-400">{superseded.length} superseded version(s)</p>}
                </div>
                <div className="hidden md:block">
                  <p className="flex items-center gap-1 text-xs text-charcoal-600"><ScanLine className="h-3.5 w-3.5 text-accent-500" /> {facts.length} fact{facts.length === 1 ? '' : 's'}</p>
                </div>
                <div><ReqStatusBadge status={req.status} /></div>
                <div className="hidden w-24 lg:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      className={cn('h-full rounded-full', statusVar === 'verified' ? 'bg-verified-500' : statusVar === 'conflict' ? 'bg-conflict-500' : statusVar === 'warn' ? 'bg-warn-500' : 'bg-miss-500')}
                      initial={{ width: 0 }}
                      animate={{ width: `${req.confidence}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-[10px] font-medium text-charcoal-400">{Math.round(req.confidence)}%</p>
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <div className="grid gap-4 px-4 pb-4 pt-1 md:grid-cols-2">
                      <div className="md:pl-6">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Evidence documents</p>
                        {evidence.length === 0 && <p className="text-xs text-charcoal-400">No active evidence — upload {req.label.toLowerCase()} to establish.</p>}
                        {evidence.map((e) => (
                          <div key={e.id} className="mb-2 rounded-md border border-slate-200 bg-white p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-800"><FileText className="h-3.5 w-3.5 text-accent-500" /> {e.fileName}</p>
                              <span className="text-[10px] font-semibold text-charcoal-400">{Math.round(e.givesConfidence)}% confidence</span>
                            </div>
                            <p className="mt-1 text-[11px] text-charcoal-500">
                              QR {Math.round(e.quality)} · Readability {Math.round(e.readability)}/100 · v{versionOf(app, e.id)}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {e.extractedFields.map((f) => (
                                <span key={f.key} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-charcoal-600">{f.label}: {f.value}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                        {superseded.map((e) => (
                          <div key={e.id} className="mb-2 flex items-center justify-between rounded-md border border-dashed border-slate-300 bg-slate-50 p-2.5">
                            <p className="text-xs text-charcoal-400 line-through">{e.fileName}</p>
                            <span className="text-[10px] text-charcoal-400">superseded {day(e.uploadedAt)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Extracted facts & explanation</p>
                        {facts.length === 0 ? (
                          <p className="text-xs text-charcoal-400">No extracted facts yet.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {facts.map((f) => (
                              <li key={f.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-1.5 text-xs">
                                <span className="font-medium text-charcoal-700">{f.label}</span>
                                <span className="text-charcoal-500">{f.value} <em className={cn('ml-1 not-italic', f.confidence >= 85 ? 'text-verified-600' : f.confidence >= 70 ? 'text-warn-700' : 'text-conflict-700')}>{Math.round(f.confidence)}%</em></span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-3 rounded-md border border-accent-100 bg-accent-50 px-3 py-2">
                          <p className="text-[11px] font-semibold text-accent-700">Assessment</p>
                          <p className="mt-0.5 text-xs leading-5 text-charcoal-700">{assessment?.explanation.rule ?? req.explanation}</p>
                        </div>
                        {assessment && (
                          <div className="mt-2 rounded-md border border-slate-100 bg-white px-3 py-2 text-[11px] text-charcoal-500">
                            <p className="font-semibold text-charcoal-700">Comparison</p>
                            <p className="mt-0.5">{assessment.explanation.comparison}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function shortFile(n: string): string {
  const s = n.replace(/\.[^.]+$/, '');
  return s.length > 22 ? s.slice(0, 20) + '…' : s;
}

function day(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return ''; }
}

function versionOf(app: ApplicationRecord, id: string): number {
  const v = app.evidenceVersions.find((x) => x.evidenceId === id);
  return v?.version ?? app.evidenceVersions.filter((x) => x.evidenceId === id).length + 1;
}