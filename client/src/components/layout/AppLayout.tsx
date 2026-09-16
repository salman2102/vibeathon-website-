import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Files, FilePlus2, ScanSearch, Scale, Radar, ArrowRightSquare,
  ShieldCheck, ClipboardList, LineChart, Menu, X, Bell, ChevronsUpDown,
  Landmark, FileCheck2, GitBranch, KeyRound, User, ShieldAlert, PlayCircle,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AppStatusBadge } from '../shared/StatusBadge';
import { DEMO_ROLES, type Role } from '../../types';
import type { ApplicationRecord } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

function navFor(role: Role, flagship?: ApplicationRecord): Array<{ group: string; items: NavItem[] }> {
  const twinRef = flagship?.applicationId ?? 'CG-2026-0148';
  if (role === 'REVIEWER') {
    return [
      {
        group: 'Operations',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { to: '/reviewer', label: 'Application Queue', icon: <ClipboardList className="h-4 w-4" /> },
          { to: `/reviewer/applications/${twinRef}`, label: 'Case Resolution', icon: <Scale className="h-4 w-4" /> },
          { to: '/evidence', label: 'Evidence Review', icon: <ScanSearch className="h-4 w-4" /> },
          { to: '/issues', label: 'Conflict Center', icon: <Radar className="h-4 w-4" /> },
        ],
      },
      {
        group: 'Governance',
        items: [
          { to: '/decision', label: 'Decision History', icon: <FileCheck2 className="h-4 w-4" /> },
          { to: '/audit', label: 'Audit Log', icon: <ShieldCheck className="h-4 w-4" /> },
          { to: '/analytics', label: 'Analytics', icon: <LineChart className="h-4 w-4" /> },
        ],
      },
    ];
  }
  if (role === 'ADMIN') {
    return [
      {
        group: 'Command',
        items: [
          { to: '/dashboard', label: 'Command Center', icon: <LayoutDashboard className="h-4 w-4" /> },
          { to: '/applications', label: 'Applications', icon: <Files className="h-4 w-4" /> },
          { to: '/analytics', label: 'Analytics', icon: <LineChart className="h-4 w-4" /> },
          { to: '/evidence', label: 'Document Intelligence', icon: <ScanSearch className="h-4 w-4" /> },
        ],
      },
      {
        group: 'Admin',
        items: [
          { to: '/apply', label: 'Scenario Lab', icon: <GitBranch className="h-4 w-4" /> },
          { to: '/audit', label: 'Audit Log', icon: <ShieldCheck className="h-4 w-4" /> },
          { to: '/how-it-works', label: 'How ClearGov Thinks', icon: <KeyRound className="h-4 w-4" /> },
        ],
      },
    ];
  }
  return [
    {
      group: 'My Case',
      items: [
        { to: '/dashboard', label: 'Command Center', icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: '/applications', label: 'My Applications', icon: <Files className="h-4 w-4" /> },
        { to: `/applications/${twinRef}`, label: 'Digital Twin', icon: <GitBranch className="h-4 w-4" /> },
      ],
    },
    {
      group: 'Evidence & Reasoning',
      items: [
        { to: '/evidence', label: 'Document Intelligence', icon: <ScanSearch className="h-4 w-4" /> },
        { to: '/assessment', label: 'Explainable Decision', icon: <Scale className="h-4 w-4" /> },
        { to: '/issues', label: 'Conflict Radar', icon: <Radar className="h-4 w-4" /> },
        { to: '/decision', label: 'Decision & Next Steps', icon: <ArrowRightSquare className="h-4 w-4" /> },
        { to: '/audit', label: 'Audit Trail', icon: <ShieldCheck className="h-4 w-4" /> },
      ],
    },
    {
      group: 'Services',
      items: [
        { to: '/apply', label: 'New Application', icon: <FilePlus2 className="h-4 w-4" /> },
        { to: '/how-it-works', label: 'How ClearGov Thinks', icon: <KeyRound className="h-4 w-4" /> },
        { to: '/privacy', label: 'Privacy Center', icon: <ShieldCheck className="h-4 w-4" /> },
      ],
    },
  ];
}

function RoleSwitcher() {
  const { role, setRole, user } = useApp();
  const [open, setOpen] = useState(false);
  const current = DEMO_ROLES.find((r) => r.id === role)!;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left shadow-sm transition-colors hover:border-slate-300"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md text-white" style={{ backgroundColor: current.color }}>
          <User className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-charcoal-900">{user.name}</span>
          <span className="block text-[10px] uppercase tracking-wide text-charcoal-400">{current.name} · Demo</span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-charcoal-400" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel" role="menu">
          {DEMO_ROLES.map((r) => (
            <button
              key={r.id}
              role="menuitemradio"
              aria-checked={role === r.id}
              onClick={() => {
                setRole(r.id);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50',
                role === r.id && 'bg-slate-50',
              )}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-charcoal-800">{r.name}</span>
                <span className="block text-[10px] text-charcoal-400">{r.department}</span>
              </span>
              {role === r.id && <span className="text-xs text-accent-600">✓</span>}
            </button>
          ))}
          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[10px] leading-4 text-charcoal-400">
            Demo role switching simulates login. Reviewer & Admin actions are recorded to the audit trail.
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { notifications, unread, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const iconColor = notifications.some((n) => !n.read && ['CONFLICT', 'HUMAN_REVIEW', 'MISSING_EVIDENCE', 'REVIEWER_REQUEST'].includes(n.type)) ? 'text-warn-500' : 'text-charcoal-400';
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen((o) => !o)} aria-label={`Notifications (${unread} unread)`}>
        <Bell className={cn('h-4.5 w-4.5', iconColor)} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-conflict-500 text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <p className="text-xs font-semibold text-charcoal-800">Notifications</p>
              <button onClick={markAllRead} className="text-[11px] font-medium text-accent-600 hover:underline">
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 && <p className="px-3 py-6 text-center text-xs text-charcoal-400">No notifications.</p>}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    navigate(`/applications/${n.applicationRef}`);
                  }}
                  className={cn(
                    'block w-full border-b border-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-50',
                    !n.read && 'bg-accent-50/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        n.type === 'CONFLICT' || n.type === 'HUMAN_REVIEW' ? 'bg-conflict-500' : n.type === 'MISSING_EVIDENCE' || n.type === 'REVIEWER_REQUEST' ? 'bg-warn-500' : 'bg-verified-500',
                      )}
                    />
                    <span className="text-xs font-semibold text-charcoal-800">{n.title}</span>
                  </div>
                  <p className="mt-0.5 pl-3.5 text-[11px] leading-4 text-charcoal-500">{n.message}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AppLayout() {
  const { role } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const flagship = useMemo<ApplicationRecord | undefined>(() => {
    const raw = localStorage.getItem('cleargov.flagship-sample');
    try {
      return raw ? (JSON.parse(raw) as ApplicationRecord) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const groups = navFor(role, flagship);
  const twinRef = flagship?.applicationId ?? 'CG-2026-0148';
  const isGov = role === 'REVIEWER' || role === 'ADMIN';

  // role-gate protected areas
  const onProtected = isGov || location.pathname.startsWith('/applications') || location.pathname.startsWith('/audit') || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/evidence') || location.pathname.startsWith('/assessment') || location.pathname.startsWith('/issues') || location.pathname.startsWith('/decision') || location.pathname.startsWith('/analytics') || location.pathname.startsWith('/apply');

  if (!onProtected && location.pathname !== '/' && location.pathname !== '/how-it-works' && location.pathname !== '/privacy' && location.pathname !== '/demo') {
    // citizen exploring reviewer zone: not rendered here because router decides; safe fallback
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-navy-700/60 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-600 text-white shadow-glow">
          <Landmark className="h-4.5 w-4.5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight text-white">
            CLEAR<span className="text-accent-400">GOV</span>
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-navy-300">Evidence Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Main navigation">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-navy-400">{g.group}</p>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard' || item.to === '/reviewer'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-navy-200 transition-colors hover:bg-navy-700/60 hover:text-white',
                      isActive && 'bg-accent-600/15 text-white ring-1 ring-inset ring-accent-500/30',
                    )
                  }
                >
                  <span className={cn('text-navy-400 group-hover:text-accent-400', location.pathname === item.to && 'text-accent-400')}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-navy-700/60 p-3">
        <div className="rounded-lg bg-navy-700/40 p-2.5">
          <div className="flex items-center gap-2 text-navy-200">
            <GitBranch className="h-3.5 w-3.5 text-accent-400" />
            <NavLink to={`/applications/${twinRef}`} className="text-[11px] font-semibold text-white hover:underline">
              CG-2026-0148
            </NavLink>
          </div>
          <NavLink to={`/applications/${twinRef}`} className="mt-1.5 block">
            <AppStatusBadge status={flagship?.status ?? 'ADDITIONAL_EVIDENCE_REQUIRED'} size="sm" />
          </NavLink>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-navy-900 lg:flex">
        {sidebar}
      </aside>

      {/* mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/50" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-64 bg-navy-900 shadow-panel">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 text-navy-300" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-charcoal-600" />
          </button>
          <NavLink to="/" className="flex items-center gap-1.5 lg:hidden">
            <span className="text-sm font-extrabold text-navy-800">CLEARGOV</span>
          </NavLink>
          <div className="hidden items-center gap-2 text-xs text-charcoal-400 sm:flex">
            <span className="rounded border border-verified-200 bg-verified-50 px-1.5 py-px text-[10px] font-bold text-verified-700">LIVE DEMO</span>
            <span>AI-assisted assessment · final decisions remain with authorized reviewers</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => navigate('/demo')}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Demo / Judge Mode
            </Button>
            <div className="ml-1 hidden w-44 md:block">
              <RoleSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 px-4 py-3 text-[11px] text-charcoal-400 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>ClearGov AI — From Evidence to Explainable Case Resolution · Fictional demo data only</span>
            <NavLink to="/api/health" className="hover:text-accent-600"><span className="inline-block h-1.5 w-1.5 rounded-full bg-verified-500 align-middle" /> System operational</NavLink>
          </div>
        </footer>
      </div>
    </div>
  );
}