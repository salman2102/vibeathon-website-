import { Link } from 'react-router-dom';
import { useApplication } from '../lib/useCaseData';
import { DataState } from '../components/shared/DataState';
import { ConflictRadar } from '../components/case/ConflictRadar';
import { ArrowUpRight } from 'lucide-react';

export default function IssuesPage() {
  const { app, loading, error, refresh } = useApplication('CG-2026-0148');
  if (loading && !app) return <DataState.Loading label="Loading conflict radar…" />;
  if (error || !app) return <DataState.Error message={error ?? 'Unavailable'} onRetry={refresh} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-navy-900">Conflict Radar</h1>
          <p className="text-[12px] text-charcoal-500">Inconsistencies between evidence for {app.applicationId}</p>
        </div>
        <Link to={`/applications/${app.applicationId}`} className="inline-flex items-center gap-1 text-xs font-semibold text-accent-600 hover:underline">
          Open full case <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ConflictRadar app={app} />
    </div>
  );
}