import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Eye, FileSearch, GitBranch, Landmark, PlayCircle,
  Scale, ShieldCheck, Sparkles, UserCheck, Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Analytics } from '../types';

const FEATURES = [
  {
    num: '01', title: 'Evidence Graph', icon: GitBranch, color: '#0EA5E9',
    desc: 'Every claim, requirement, document, fact and rule rendered as a living graph. Click any node to trace the exact path from raw evidence to the decision.',
  },
  {
    num: '02', title: 'Explainable Decision', icon: Scale, color: '#8B5CF6',
    desc: 'Each assessment shows CLAIM → EVIDENCE → FACT → RULE → COMPARISON → RESULT, with confidence scores and exactly what the document does — and does not — prove.',
  },
  {
    num: '03', title: 'Next Best Action', icon: Sparkles, color: '#10B981',
    desc: 'ClearGov tells the applicant precisely which document to upload and why, ranking actions by blocker impact so the case unblocks in one step.',
  },
];

const STAGES = [
  { label: 'Digitise', icon: Eye, detail: 'OCR reads documents and report any quality issues.' },
  { label: 'Extract', icon: FileSearch, detail: 'Facts become structured fields with confidence.' },
  { label: 'Compare', icon: BadgeCheck, detail: 'Cross-document checks surface conflicts early.' },
  { label: 'Assess', icon: Scale, detail: 'Rules evaluate each requirement transparently.' },
  { label: 'Resolve', icon: UserCheck, detail: 'With a clear, human-audited recommendation.' },
];

const OLD_NEW = [
  { old: '4–6 weeks of manual document handling', next: 'Assessment in seconds, corrections in one upload' },
  { old: 'Conflicting documents noticed weeks later', next: 'Conflicts flagged the moment they appear' },
  { old: 'Rejections without telling you why', next: 'Every outcome explained fact-by-fact' },
  { old: 'A black box — or a wall of paper', next: 'A graph of evidence anyone can inspect' },
  { old: 'Officers re-checking the same fields', next: 'AI does the routine reading; humans decide' },
];

export default function LandingPage() {
  const [analytics, setAnalytics] = useState<Pick<Analytics, 'total' | 'evidenceCoverage' | 'averageResolutionDays' | 'humanReviewRate'> | null>(null);

  useEffect(() => {
    api.analytics().then(setAnalytics).catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-charcoal-800">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              <Landmark className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-extrabold tracking-tight text-navy-900">
                CLEAR<span className="text-accent-600">GOV</span>
              </p>
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-charcoal-400">Evidence Intelligence</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-[13px] font-medium text-charcoal-600 md:flex">
            <a href="#product" className="hover:text-navy-900">Why it matters</a>
            <a href="#pipeline" className="hover:text-navy-900">The pipeline</a>
            <a href="#transparency" className="hover:text-navy-900">Transparency</a>
            <Link to="/how-it-works" className="hover:text-navy-900">How it thinks</Link>
            <Link to="/privacy" className="hover:text-navy-900">Privacy</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/applications" className="hidden rounded-md border border-slate-300 px-3 py-2 text-[13px] font-semibold text-charcoal-700 hover:bg-slate-50 sm:inline-block">
              Live case
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-accent-500">
              <PlayCircle className="h-4 w-4" /> Watch the demo
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="grid-hero-dark relative overflow-hidden border-b border-slate-200 bg-navy-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.16),transparent_60%)]" aria-hidden />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent-400/25 bg-accent-400/10 px-3 py-1 text-[11px] font-semibold text-accent-300">
              <Zap className="h-3.5 w-3.5" /> AI-assisted case resolution for public services
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
              From evidence to
              <span className="text-transparent" style={{ background: 'linear-gradient(90deg,#22D3EE,#818CF8)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}> explainable decisions</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-4 max-w-lg text-[15px] leading-7 text-navy-200">
              ClearGov reads the documents citizens already submit, turns evidence into a verifiable fact graph, explains every assessment — and stops for a human the moment judgment is needed.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/demo" className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-semibold text-white shadow-glow hover:bg-accent-500">
                <PlayCircle className="h-4 w-4" /> Open the live demo
              </Link>
              <Link to="/applications" className="inline-flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800/60 px-5 py-3 text-sm font-semibold text-white hover:border-navy-400">
                Inspect a real case <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 flex flex-wrap gap-6">
              <div>
                <p className="stat-number text-2xl font-bold text-white">{analytics?.total ?? '—'}</p>
                <p className="text-[11px] uppercase tracking-wide text-navy-300">cases analysed</p>
              </div>
              <div>
                <p className="stat-number text-2xl font-bold text-white">{analytics?.evidenceCoverage ?? '—'}%</p>
                <p className="text-[11px] uppercase tracking-wide text-navy-300">evidence coverage</p>
              </div>
              <div>
                <p className="stat-number text-2xl font-bold text-white">{analytics?.averageResolutionDays ?? '—'}d</p>
                <p className="text-[11px] uppercase tracking-wide text-navy-300">avg. time-to-outcome</p>
              </div>
              <div>
                <p className="stat-number text-2xl font-bold text-white">{Math.round((analytics?.humanReviewRate ?? 0) * 100)}%</p>
                <p className="text-[11px] uppercase tracking-wide text-navy-300">human review rate</p>
              </div>
            </motion.div>
          </div>

          {/* live case preview card */}
          <motion.div initial={{ opacity: 0, y: 24, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.3 }} className="self-center">
            <div className="rounded-xl border border-navy-700 bg-navy-800/70 p-1 shadow-panel backdrop-blur">
              <div className="rounded-lg bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Live flagship case</p>
                    <p className="text-sm font-bold text-charcoal-900">CG-2026-0148 · Scholarship</p>
                  </div>
                  <span className="rounded-full bg-warn-50 px-2 py-0.5 text-[10px] font-bold text-warn-700">ADDITIONAL EVIDENCE</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    ['Identity — verified', 'name matches Aadhaar', '#10B981', '72'],
                    ['Residence — CONFLICT', 'Erode vs Coimbatore', '#EF4444', '42'],
                    ['Income — verified', '₹2,40,000 &lt; ₹3,00,000 cap', '#10B981', '78'],
                    ['Marksheet — missing', 'awaiting board document', '#94A3B8', '20'],
                  ].map(([l, d, c, w], i) => (
                    <div key={l as string}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold" style={{ color: c as string }}>{l}</span>
                        <span className="stat-number text-[10px] text-charcoal-400">{w}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: c as string }} initial={{ width: 0 }} animate={{ width: assertPct(Number(w)) }} transition={{ delay: 0.7 + i * 0.1, duration: 0.6 }} />
                      </div>
                      <p className="mt-0.5 text-[10px] text-charcoal-400">{d}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-[11px] font-medium text-charcoal-500">AI next action</span>
                  <span className="text-[11px] font-semibold text-accent-700">Upload clean residence proof</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-charcoal-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-verified-500" /> Final decision recorded by an authorized reviewer, never by AI alone.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section id="product" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent-600">Judged on three things</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900">Evidence people can see. Reasoning people can follow. Actions that actually unblock.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="group rounded-xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm" style={{ backgroundColor: f.color }}>
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-[11px] font-bold text-charcoal-300">{f.num}</span>
              </div>
              <h3 className="text-base font-bold text-charcoal-900">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-charcoal-500">{f.desc}</p>
              <Link to="/demo" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-accent-600 hover:underline">
                See it live <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* before / after */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div className="rounded-xl border border-conflict-100 bg-conflict-50/50 p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-conflict-700">Today</p>
            <h3 className="mt-2 text-xl font-extrabold text-charcoal-900">The paper funnel</h3>
            <ul className="mt-4 space-y-3">
              {OLD_NEW.map((x) => (
                <li key={x.old} className="flex items-start gap-2.5 text-[13px] leading-6 text-charcoal-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-conflict-500" /> {x.old}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-verified-100 bg-verified-50/40 p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-verified-700">With ClearGov</p>
            <h3 className="mt-2 text-xl font-extrabold text-charcoal-900">The evidence twin</h3>
            <ul className="mt-4 space-y-3">
              {OLD_NEW.map((x) => (
                <li key={x.next} className="flex items-start gap-2.5 text-[13px] leading-6 text-charcoal-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-verified-500" /> {x.next}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* pipeline */}
      <section id="pipeline" className="grid-hero-dark border-b border-slate-200 bg-navy-900">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent-400">The pipeline</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Five steps between a document and a decision</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STAGES.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="relative rounded-xl border border-navy-700 bg-navy-800/60 p-4">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-accent-600/20 text-accent-400">
                  <s.icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-bold text-white">{i + 1}. {s.label}</p>
                <p className="mt-1 text-[11px] leading-5 text-navy-300">{s.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* trust */}
      <section id="transparency" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: GitBranch, t: 'Evidence versioning', d: 'Every correction supersedes the old document and is preserved for audit — nothing disappears quietly.' },
            { icon: ShieldCheck, t: 'Human-in-the-loop by design', d: 'Conflicts and low-confidence extractions route a reviewer automatically. AI recommends; people decide.' },
            { icon: FileSearch, t: 'Complete audit trail', d: 'Who read what, when, and why is logged per case. Trust is a feature, not an afterthought.' },
          ].map((c, i) => (
            <motion.div key={c.t} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="rounded-xl border border-slate-200 bg-white p-6">
              <c.icon className="mb-3 h-6 w-6 text-accent-600" />
              <h3 className="text-base font-bold text-charcoal-900">{c.t}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-charcoal-500">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-navy-900">See a case go from conflict to clarity in under a minute</h2>
          <p className="max-w-xl text-sm text-charcoal-500">A 60-second guided demo: the identity graph, the conflicting residence proof, and the correction that unblocks everything.</p>
          <Link to="/demo" className="mt-1 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-accent-500">
            <PlayCircle className="h-4 w-4" /> Launch the guided demo
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-[11px] text-charcoal-400">
          <span>ClearGov AI — public-service case resolution demonstrator. All names, documents and outcomes are fictional demo data.</span>
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-verified-500" /> Fictional demo · Not an official government service</span>
        </div>
      </footer>
    </div>
  );
}

function assertPct(n: number): string {
  return `${Math.min(100, Math.max(0, n))}%`;
}