import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, FileSearch, GitBranch, RefreshCw, Rocket, ShieldAlert, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAnalytics, useApplications } from '../lib/useCaseData';
import { DataState } from '../components/shared/DataState';
import { AppStatusBadge } from '../components/shared/StatusBadge';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#94A3B8', Submitted: '#38BDF8', 'Additional Evidence': '#F59E0B', 'Ready To Proceed': '#34D399',
  'Human Review': '#FB923C', Resolved: '#9CA3AF', 'Condition Not Established': '#F87171',
};

export default function DashboardPage() {
  const { analytics, loading, refresh } = useAnalytics();
  const { apps } = useApplications();

  if (loading || !analytics) return <DataState.Loading label="Loading command center…" />;

  const kpis = [
    { label: 'Total cases', value: analytics.total, unit: '', icon: FileSearch, color: '#0EA5E9' },
    { label: 'Needs evidence', value: analytics.needsEvidence, unit: '', icon: AlertTriangle, color: '#F59E0B' },
    { label: 'Conflicts open', value: analytics.conflicts, unit: '', icon: GitBranch, color: '#EF4444' },
    { label: 'Human reviews', value: analytics.humanReviews, unit: '', icon: ShieldAlert, color: '#FB923C' },
    { label: 'Resolved', value: analytics.resolved, unit: '', icon: Rocket, color: '#10B981' },
    { label: 'Avg resolution', value: analytics.averageResolutionDays, unit: 'd', icon: Activity, color: '#8B5CF6' },
  ];

  const pieData = (analytics.statusDist ?? []).map((d) => ({ name: d.name, value: d.value }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-navy-900">Command Center</h1>
          <p className="text-[12px] text-charcoal-500">Fictional demo data · ClearGov AI-assisted assessment across {analytics.total} cases</p>
        </div>
        <button onClick={() => refresh()} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-700 hover:bg-slate-50">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `${k.color}1a`, color: k.color }}>
                <k.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="stat-number mt-3 text-2xl font-bold text-charcoal-900">
              {k.value ?? '—'}<span className="text-sm font-semibold text-charcoal-400">{k.unit}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-charcoal-500">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* status distribution */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-1">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Status distribution</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                  {(pieData as Array<{ name: string; value: number }>).map((d) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* issue trends */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Activity over time</p>
          <p className="mb-3 text-[11px] text-charcoal-400">Submitted vs assessed vs conflicts vs resolved</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.issueTrends ?? []}>
                <defs>
                  <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} /><stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#7B8495' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7B8495' }} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#0EA5E9" fill="url(#gSub)" strokeWidth={2} />
                <Area type="monotone" dataKey="conflicts" name="Conflicts" stroke="#EF4444" fill="none" strokeWidth={2} strokeDasharray="4 3" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" fill="url(#gRes)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* recent cases */}
        <div className="rounded-lg border border-slate-200 bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Recent applications</p>
            <Link to="/applications" className="text-[11px] font-semibold text-accent-600 hover:underline">View all →</Link>
          </div>
          <ul>
            {apps.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link to={`/applications/${a.applicationId}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-charcoal-400" />
                    <span className="font-mono text-[11px] text-charcoal-500">{a.applicationId}</span>
                    <span className="text-xs font-medium text-charcoal-700">{a.applicant.name}</span>
                    <span className="hidden rounded bg-slate-100 px-1.5 py-px text-[10px] text-charcoal-500 sm:inline">{a.scenarioKey}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="stat-number hidden text-[11px] text-charcoal-400 md:inline">{Math.round(a.coverage)}% cov</span>
                    <AppStatusBadge status={a.status} size="sm" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* flagship spotlight */}
        <div className="rounded-lg border border-navy-900 bg-navy-900 p-4 lg:col-span-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-300">
            <GitBranch className="h-3.5 w-3.5 text-accent-400" /> Flagship spotlight — CG-2026-0148
          </p>
          <p className="mt-2 text-sm font-bold text-white">Salman A. · Open Merit Scholarship</p>
          <p className="mt-1 text-[11px] leading-5 text-navy-300">The demo case: a residence conflict + a missing marksheet that block a ₹1,20,000 scholarship.</p>
          <div className="mt-3 space-y-2">
            {[
              ['Identity', 'established', '#10B981'],
              ['Residence', 'conflict', '#EF4444'],
              ['Income', 'established', '#10B981'],
              ['Marksheet', 'missing', '#94A3B8'],
            ].map(([l, s, c]) => (
              <div key={l as string} className="flex items-center justify-between text-[11px]">
                <span className="text-navy-200">{l}</span>
                <span className="rounded px-1.5 py-px font-semibold uppercase" style={{ color: c as string, backgroundColor: `${c}22` }}>{s}</span>
              </div>
            ))}
          </div>
          <Link to="/applications/CG-2026-0148" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-500">
            Open the evidence twin →
          </Link>
        </div>
      </div>
    </div>
  );
}