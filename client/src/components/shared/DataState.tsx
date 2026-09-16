import type { ReactNode } from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-charcoal-400">
      <Loader2 className="h-6 w-6 animate-spin text-accent-600" aria-hidden />
      {label && <p className="text-xs">{label}</p>}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-14 text-center">
      <div className="text-slate-300">{icon ?? <Inbox className="h-8 w-8" />}</div>
      <p className="text-sm font-medium text-charcoal-600">{title}</p>
      {hint && <p className="max-w-sm text-xs text-charcoal-400">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-conflict-200 bg-conflict-50/60 py-12 text-center">
      <AlertTriangle className="h-7 w-7 text-conflict-500" />
      <p className="text-sm font-semibold text-conflict-700">Request failed</p>
      <p className="max-w-md text-xs text-conflict-700/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 rounded-md border border-conflict-300 bg-white px-3 py-1.5 text-xs font-medium text-conflict-700 hover:bg-conflict-50">
          Retry
        </button>
      )}
    </div>
  );
}

export function PageLoading() {
  return <Spinner label="Loading ClearGov…" />;
}

export const DataState = { Loading: Spinner, Empty: EmptyState, Error: ErrorState };