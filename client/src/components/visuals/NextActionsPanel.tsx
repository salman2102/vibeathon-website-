import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Circle, FilePlus2, Info, LockOpen, Scale, Sparkles, UploadCloud } from 'lucide-react';
import type { ApplicationRecord, NextAction } from '../../types';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

const CAT: Record<NextAction['category'], { label: string; icon: React.ReactNode; cls: string }> = {
  evidence: { label: 'Evidence', icon: <UploadCloud className="h-3.5 w-3.5" />, cls: 'border-accent-200 bg-accent-50 text-accent-700' },
  resolution: { label: 'Resolution', icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: 'border-verified-200 bg-verified-50 text-verified-700' },
  information: { label: 'Information', icon: <Info className="h-3.5 w-3.5" />, cls: 'border-slate-200 bg-slate-50 text-charcoal-600' },
  review: { label: 'Review', icon: <Scale className="h-3.5 w-3.5" />, cls: 'border-warn-100 bg-warn-50 text-warn-700' },
  proceed: { label: 'Proceed', icon: <LockOpen className="h-3.5 w-3.5" />, cls: 'border-verified-200 bg-verified-50 text-verified-700' },
};

export function NextActionsPanel({ app }: { app: ApplicationRecord }) {
  const actions = app.nextActions ?? [];
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
          <Sparkles className="h-3.5 w-3.5 text-accent-500" /> Next best action
        </p>
        <span className="text-[10px] text-charcoal-400">{actions.filter((a) => a.done).length}/{actions.length} cleared</span>
      </div>
      <ul>
        {actions.map((a, i) => {
          const c = CAT[a.category];
          return (
            <motion.li
              key={a.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn('flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0', a.done && 'opacity-60')}
            >
              <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center', a.done ? 'text-verified-600' : 'text-charcoal-300')}>
                {a.done ? <CheckCircle2 className="h-5 w-5" /> : i === 0 && !a.done ? <ArrowRight className="h-5 w-5 text-accent-600" /> : <Circle className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn('text-[13px] font-semibold text-charcoal-900', a.done && 'line-through')}>{a.title}</p>
                  <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px] font-bold uppercase', c.cls)}>{c.icon} {c.label}</span>
                  {a.priority === 1 && !a.done && <span className="text-[10px] font-bold text-conflict-500">PRIORITY</span>}
                </div>
                <p className="mt-0.5 text-xs leading-5 text-charcoal-500">{a.reason}</p>
                <p className="mt-1 rounded-md bg-slate-50 px-2 py-1.5 text-[11px] leading-4 text-charcoal-600">AI prompt for you: “{a.prompt}”</p>
              </div>
            </motion.li>
          );
        })}
      </ul>
      {actions.some((a) => a.category === 'evidence' && !a.done) && (
        <div className="border-t border-slate-100 bg-accent-50/60 px-4 py-3">
          <Link to="/evidence" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700 hover:underline">
            <FilePlus2 className="h-3.5 w-3.5" /> Upload the missing evidence →
          </Link>
        </div>
      )}
    </div>
  );
}