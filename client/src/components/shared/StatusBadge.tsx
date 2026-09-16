import type { AppStatus, RequirementStatus } from '../../types';
import { REQ_STATUS_META, STATUS_META } from '../../types';

export function AppStatusBadge({ status, size = 'md' }: { status: AppStatus; size?: 'sm' | 'md' }) {
  const m = STATUS_META[status];
  const cls = size === 'sm' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-semibold whitespace-nowrap ${cls}`}
      style={{ color: m.color, backgroundColor: m.bg, borderColor: `${m.color}33` }}
      role="status"
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: m.dot, animation: 'pulse-dot 1.8s infinite' }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
      </span>
      {m.label}
    </span>
  );
}

export function ReqStatusBadge({ status }: { status: RequirementStatus }) {
  const m = REQ_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ color: m.color, backgroundColor: m.bg, borderColor: `${m.color}33` }}
    >
      {status === 'ESTABLISHED' && '✓'}
      {status === 'CONFLICT' && '▲'}
      {status === 'MISSING_EVIDENCE' && '✕'}
      {status === 'LOW_CONFIDENCE' && '⚠'}
      {status === 'NOT_ESTABLISHED' && '✕'}
      {status === 'HUMAN_REVIEW' && '●'}
      <span>{m.label}</span>
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: 'INFO' | 'WARNING' | 'CONFLICT' | 'CRITICAL' }) {
  const map: Record<string, string> = {
    INFO: 'bg-slate-100 text-slate-600 border-slate-200',
    WARNING: 'bg-warn-50 text-warn-700 border-warn-100',
    CONFLICT: 'bg-conflict-50 text-conflict-700 border-conflict-200',
    CRITICAL: 'bg-conflict-500 text-white border-conflict-700',
  };
  return <span className={`rounded border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide ${map[severity]}`}>{severity}</span>;
}