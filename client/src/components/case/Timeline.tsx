import { motion } from 'framer-motion';
import { CheckCircle2, FileCheck2, FileUp, GitBranch, RotateCcw, Scale, Send, Sparkles } from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface Ev {
  when: string;
  title: string;
  sub?: string;
  icon: 'created' | 'submitted' | 'upload' | 'supersede' | 'assess' | 'decision' | 'reviewer';
  tone: string;
}

export function Timeline({ app }: { app: ApplicationRecord }) {
  const evs: Ev[] = [];
  evs.push({ when: app.createdAt, title: 'Application drafted', sub: app.applicationId, icon: 'created', tone: '#64748B' });
  if (app.submittedAt) evs.push({ when: app.submittedAt, title: 'Submitted for assessment', sub: 'Queued for ClearGov analysis', icon: 'submitted', tone: '#0284C7' });

  for (const e of app.evidence) {
    evs.push({ when: e.uploadedAt, title: `Evidence uploaded · ${e.fileName}`, sub: `${e.requirementKey} · ${e.status}`, icon: 'upload', tone: '#0EA5E9' });
    if (e.supersededAt) evs.push({ when: e.supersededAt, title: `Evidence superseded · ${e.fileName}`, sub: 'Replaced by a corrected version', icon: 'supersede', tone: '#F59E0B' });
  }
  for (const c of app.correctionHistory ?? []) {
    evs.push({ when: c.timestamp, title: `Correction · ${c.evidenceKey}`, sub: c.note, icon: 'supersede', tone: '#8B5CF6' });
  }
  for (const a of app.assessments) {
    evs.push({ when: a.createdAt, title: `Assessment · ${a.requirementLabel}`, sub: `${a.result} · ${Math.round(a.confidence)}%`, icon: 'assess', tone: '#10B981' });
  }
  if (app.decision) evs.push({ when: app.decision.createdAt, title: `Decision proposed · ${app.decision.title}`, sub: `${app.decision.aiConfidence}% AI confidence`, icon: 'decision', tone: '#047857' });
  for (const r of app.reviewComments ?? []) {
    evs.push({ when: r.createdAt, title: `Human action · ${r.action}`, sub: r.note ?? r.reason ?? `by ${r.actor}`, icon: 'reviewer', tone: '#EA580C' });
  }

  evs.sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());

  const ICONS: Record<Ev['icon'], React.ReactNode> = {
    created: <GitBranch className="h-3.5 w-3.5" />,
    submitted: <Send className="h-3.5 w-3.5" />,
    upload: <FileUp className="h-3.5 w-3.5" />,
    supersede: <RotateCcw className="h-3.5 w-3.5" />,
    assess: <Sparkles className="h-3.5 w-3.5" />,
    decision: <FileCheck2 className="h-3.5 w-3.5" />,
    reviewer: <Scale className="h-3.5 w-3.5" />,
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
          <Scale className="h-3.5 w-3.5 text-charcoal-400" /> Case timeline
        </p>
        <span className="text-[10px] text-charcoal-400">{evs.length} events</span>
      </div>
      <ol className="relative max-h-[520px] overflow-y-auto p-4 scrollbar-thin">
        {evs.map((e, i) => (
          <motion.li
            key={`${e.when}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {i < evs.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" aria-hidden />}
            <span className="relative z-10 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 bg-white" style={{ borderColor: e.tone }}>
              <span className="flex items-center justify-center" style={{ color: e.tone }}>
                {i === evs.length - 1 ? <CheckCircle2 className="h-4 w-4" /> : ICONS[e.icon]}
              </span>
            </span>
            <div className="pt-px">
              <p className="text-xs font-semibold text-charcoal-900">{e.title}</p>
              {e.sub && <p className="text-[11px] text-charcoal-500">{e.sub}</p>}
              <p className="text-[10px] text-charcoal-400">{fmt(e.when)}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function fmt(iso: string): string {
  try { return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}