import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ApplicationRecord } from '../../types';
import { SeverityBadge } from '../shared/StatusBadge';
import { cn } from '../../lib/utils';

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function ConflictRadar({ app }: { app: ApplicationRecord }) {
  const active = app.evidence.filter((e) => e.status === 'PROCESSED' && !e.superseded);
  const openIssues = app.issues.filter((i) => i.status === 'OPEN');
  const [hovered, setHovered] = useState<string | null>(null);

  const layout = useMemo(() => {
    const size = 380;
    const cx = size / 2;
    const cy = size / 2;
    const inner = 118;
    const outer = 168;
    const n = active.length || 1;
    const pos = new Map<string, { x: number; y: number }>();
    active.forEach((e, i) => {
      const a = (360 / n) * i;
      pos.set(e.id, polar(cx, cy, inner + (i % 2) * 26, a));
    });
    // conflicts connect evidence of the same requirement when a CONFLICT/CRITICAL issue references them
    const chords: Array<{ from: string; to: string; issueId: string; lvl: 'CONFLICT' | 'CRITICAL' }> = [];
    const severe = openIssues.filter((i) => i.severity === 'CONFLICT' || i.severity === 'CRITICAL');
    severe.forEach((issue) => {
      const linked = active.filter((e) => e.requirementKey === issue.requirementKey || e.id === issue.evidenceId);
      for (let a = 0; a < linked.length; a++) {
        for (let b = a + 1; b < linked.length; b++) {
          chords.push({ from: linked[a].id, to: linked[b].id, issueId: issue.id, lvl: issue.severity as 'CONFLICT' | 'CRITICAL' });
        }
      }
    });
    return { pos, chords, cx, cy, outer, size };
  }, [active, openIssues]);

  const stateColor = (reqKey: string) => {
    const req = app.requirements.find((r) => r.key === reqKey);
    if (!req) return '#94A3B8';
    if (req.status === 'ESTABLISHED') return '#10B981';
    if (req.status === 'CONFLICT') return '#EF4444';
    if (req.status === 'MISSING_EVIDENCE' || req.status === 'NOT_ESTABLISHED') return '#94A3B8';
    return '#F59E0B';
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Conflict radar</p>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', openIssues.length ? 'bg-conflict-50 text-conflict-700' : 'bg-verified-50 text-verified-700')}>
            {openIssues.length} open issue{openIssues.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="grid-hero">
          <svg viewBox={`0 0 ${layout.size} ${layout.size}`} className="w-full" role="img" aria-label="Evidence conflict radar">
            {[74, 108, 145, 174].map((r) => (
              <circle key={r} cx={layout.cx} cy={layout.cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth="1" opacity="0.6" />
            ))}
            {layout.chords.map((c, i) => {
              const a = layout.pos.get(c.from);
              const b = layout.pos.get(c.to);
              if (!a || !b) return null;
              return (
                <motion.path
                  key={i}
                  d={`M ${a.x} ${a.y} Q ${layout.cx} ${layout.cy} ${b.x} ${b.y}`}
                  fill="none"
                  stroke={c.lvl === 'CRITICAL' ? '#B91C1C' : '#EF4444'}
                  strokeWidth={c.lvl === 'CRITICAL' ? 2 : 1.4}
                  strokeDasharray="5 4"
                  className="conflict-path"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hovered && hovered !== c.from && hovered !== c.to ? 0.15 : 0.85 }}
                />
              );
            })}
            {active.map((e) => {
              const p = layout.pos.get(e.id)!;
              const color = stateColor(e.requirementKey);
              const txt = e.fileName.replace(/\.[^.]+$/, '');
              return (
                <motion.g
                  key={e.id}
                  transform={`translate(${p.x} ${p.y})`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: hovered === e.id ? 1.18 : 1, opacity: hovered && hovered !== e.id ? 0.3 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onMouseEnter={() => setHovered(e.id)}
                  onMouseLeave={() => setHovered(null)}
                  cursor="pointer"
                >
                  <circle r={hovered === e.id ? 22 : 16} fill={color} fillOpacity={0.14} stroke={color} strokeWidth={1.5} />
                  <text textAnchor="middle" dy="4" fontSize={hovered === e.id ? 8 : 7} fontWeight={600} fill="#334155">{trunc(txt, hovered === e.id ? 16 : 10)}</text>
                </motion.g>
              );
            })}
          </svg>
        </div>
        <div className="flex items-center justify-center gap-4 border-t border-slate-100 px-4 py-2 text-[10px] text-charcoal-400">
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-verified-500" /> Established</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-warn-500" /> Low confidence</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-conflict-500" /> Conflict</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-miss-500" /> Missing</span>
        </div>
      </div>

      <div className="space-y-2">
        {openIssues.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-verified-200 bg-verified-50 p-8 text-center">
            <p className="text-sm font-semibold text-verified-700">No open conflicts</p>
            <p className="text-xs text-charcoal-500">All evidence is consistent. The case is ready for official review.</p>
          </div>
        )}
        {openIssues.map((i) => (
          <motion.div key={i.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={i.severity} />
                <p className="text-[13px] font-semibold text-charcoal-900">{i.title}</p>
              </div>
              <span className="text-[10px] text-charcoal-400">confidence {Math.round(i.confidence)}%</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-charcoal-600">{i.explanation}</p>
            {i.comparison && (
              <p className="mt-1 rounded-md bg-slate-50 px-2 py-1.5 font-mono text-[11px] text-charcoal-600">{i.comparison}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-charcoal-400">Source: {i.source ?? '—'} · {i.requirementKey ?? ''}</span>
              <span className="rounded bg-accent-50 px-2 py-0.5 font-medium text-accent-700">{i.recommendation}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}