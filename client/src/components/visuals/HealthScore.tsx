import { motion } from 'framer-motion';
import type { ApplicationRecord } from '../../types';

function Ring({ value, color, size = 150, stroke = 11, label }: { value: number; color: string; size?: number; stroke?: number; label: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${value}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          className="stat-number text-2xl font-bold text-charcoal-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {value}
          <span className="text-sm text-charcoal-400">%</span>
        </motion.p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">{label}</p>
      </div>
    </div>
  );
}

export function HealthScore({ app }: { app: ApplicationRecord }) {
  const d = app.decision;
  const health = app.health ?? d?.health ?? 0;
  const coverage = app.coverage ?? d?.coverage ?? 0;
  const ai = app.aiConfidence ?? d?.aiConfidence ?? 0;

  const bars = [
    { label: 'Evidence coverage', value: coverage, color: '#0EA5E9' },
    { label: 'Case health', value: health, color: '#10B981' },
    { label: 'AI confidence', value: ai, color: '#8B5CF6' },
  ];

  const healthColor = health >= 85 ? '#10B981' : health >= 70 ? '#F59E0B' : '#EF4444';
  const verdict = health >= 85 ? 'Healthy case — AI is confident' : health >= 70 ? 'Attention needed' : 'High-risk case';

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[auto_1fr]">
      <div className="flex items-center justify-center">
        <Ring value={health} color={healthColor} label="Case health" />
      </div>
      <div className="flex flex-col justify-center gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-charcoal-900">{verdict}</p>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: `${healthColor}18`, color: healthColor }}>
            {health}/100
          </span>
        </div>
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-medium text-charcoal-600">{b.label}</span>
              <span className="stat-number font-semibold" style={{ color: b.color }}>{Math.round(b.value)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: b.color }}
                initial={{ width: 0 }}
                animate={{ width: `${b.value}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
        <p className="text-[11px] leading-4 text-charcoal-400">
          Health combines coverage, conflict density and confidence. Blocking issues: <b className="text-charcoal-600">{app.blockingIssues}</b>. AI recommends {(app.nextActions?.[0]?.category ?? 'review').toUpperCase()}.
        </p>
      </div>
    </div>
  );
}