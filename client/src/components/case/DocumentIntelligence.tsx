import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, FileText, Image as ImageIcon, Loader2, ScanSearch, ShieldAlert, Sparkles, UploadCloud } from 'lucide-react';
import type { ApplicationRecord } from '../../types';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

const SEED_OPTIONS: Array<{ seed: string; label: string; req: string; quality: number; desc: string }> = [
  { seed: 'identity', label: 'Identity / Aadhaar', req: 'identity', quality: 96, desc: 'Name, DOB, address in one document' },
  { seed: 'marksheet', label: 'Marksheet (PDF)', req: 'academic', quality: 94, desc: 'Board marks ≥ 60% threshold' },
  { seed: 'income', label: 'Income Certificate', req: 'income', quality: 92, desc: 'Household income ₹2,40,000 < cap' },
  { seed: 'income_high', label: 'Income Certificate (high)', req: 'income', quality: 91, desc: 'Income ₹4,50,000 — likely disqualifies' },
  { seed: 'residence', label: 'Residence Proof (correct)', req: 'residence', quality: 93, desc: 'Coimbatore — matches claim' },
  { seed: 'residence_conflict', label: 'Residence Proof (conflict)', req: 'residence', quality: 90, desc: 'Erode — inconsistent with claim' },
  { seed: 'residence_lowquality', label: 'Residence Proof (blurred)', req: 'residence', quality: 58, desc: 'Low readability, low confidence' },
  { seed: 'bank', label: 'Bank Ledger (PDF)', req: 'bank', quality: 95, desc: 'Account holder & IFSC verified' },
  { seed: 'land', label: 'Land / Plot Records', req: 'plot', quality: 89, desc: 'Property ownership records' },
  { seed: 'enrollment', label: 'Enrollment Slip', req: 'enrollment', quality: 90, desc: 'Institution enrollment proof' },
  { seed: 'fee', label: 'Fee Receipt', req: 'fee', quality: 91, desc: 'Fee payment evidence' },
  { seed: 'medical', label: 'Medical Report', req: 'medical', quality: 88, desc: 'Medical condition report' },
  { seed: 'declaration', label: 'Self Declaration', req: 'self_declaration', quality: 85, desc: 'Signed declaration form' },
];

const PIPELINE = [
  { label: 'Extract', detail: 'OCR reads fields from the document' },
  { label: 'Validate', detail: 'Document type, structure and fields checked' },
  { label: 'Compare', detail: 'Cross-document consistency scan' },
  { label: 'Assess', detail: 'Rule evaluation and confidence scoring' },
];

export function DocumentIntelligence({ app, onRefreshAfter }: { app: ApplicationRecord; onRefreshAfter?: () => void }) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const missingKeys = app.requirements.filter((r) => !r.established && !['plot', 'enrollment', 'fee', 'medical', 'self_declaration'].includes(r.key));
  const [reqKey, setReqKey] = useState<string>(missingKeys[0]?.key ?? app.requirements[0]?.key ?? 'identity');
  const options = SEED_OPTIONS.filter((o) => o.req === reqKey || file);
  const [seed, setSeed] = useState<string>(options[0]?.seed ?? '');

  const seedFor = (k: string) => SEED_OPTIONS.find((o) => o.seed === k);
  const seedLabel = seedFor(seed)?.label ?? seed;

  const simulatePipeline = async () => {
    setPendingKey(reqKey + ':' + seed);
    setPhase(0);
    for (let p = 0; p < PIPELINE.length; p++) {
      setPhase(p);
      await new Promise((r) => setTimeout(r, 520));
    }
    setPhase(0);
  };

  const doUpload = async () => {
    if (!seed && !file) return;
    const form = new FormData();
    if (file) form.append('file', file);
    form.append('requirement', reqKey);
    form.append('seed', seed);
    form.append('note', `Simulated upload — ${file?.name ?? seedLabel}`);
    await simulatePipeline();
    try {
      await api.upload<{ evidence: { fileName: string } }>(`/api/applications/${app.applicationId}/evidence`, form);
      await api.post(`/api/applications/${app.applicationId}/analyze`, {});
      setUploaded(file?.name ?? seedLabel);
      setFile(null);
      if (onRefreshAfter) onRefreshAfter();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      window.alert(msg);
    }
  };

  const filesOf = (reqKey: string) => app.evidence.filter((e) => e.requirementKey === reqKey);

  return (
    <div className="space-y-4">
      {/* upload / pipeline */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
            <ScanSearch className="h-3.5 w-3.5 text-accent-500" /> Document intelligence pipeline
          </p>
          <span className="text-[10px] text-charcoal-400">{app.evidence.length} documents · simulated OCR engine</span>
        </div>
        <div className="p-4">
          <div className="grid gap-3 md:grid-cols-[180px_1fr]">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-charcoal-600">Requirement</label>
              <select value={reqKey} onChange={(e) => { const k = e.target.value; setReqKey(k); setSeed(SEED_OPTIONS.find((o) => o.req === k)?.seed ?? ''); }} className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-[13px] text-charcoal-800 focus-visible:ring-2 focus-visible:ring-accent-500/50">
                {app.requirements.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label} {r.established ? '✓ established' : r.status === 'MISSING_EVIDENCE' ? '(missing)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-charcoal-600">Demo document (simulated OCR)</label>
              <div className="flex flex-wrap gap-1.5">
                {SEED_OPTIONS.filter((o) => o.req === reqKey).map((o) => (
                  <button
                    key={o.seed}
                    onClick={() => setSeed(o.seed)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-left text-[11px] transition-colors',
                      seed === o.seed ? 'border-accent-500 bg-accent-50 text-accent-800' : 'border-slate-200 bg-white text-charcoal-600 hover:border-slate-300',
                    )}
                  >
                    <span className="font-semibold">{o.label}</span>
                    <span className="block text-[10px] text-charcoal-400">{o.desc}</span>
                  </button>
                ))}
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-2 py-1 text-[11px] text-charcoal-500 hover:border-accent-400">
                  <UploadCloud className="h-3.5 w-3.5" />
                  {file ? file.name : 'or choose file…'}
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-charcoal-400">Uploading</span>
              <span className="rounded bg-slate-100 px-1.5 py-px font-mono text-[11px] text-charcoal-700">{file?.name ?? seedLabel}</span>
              <span className="text-[11px] text-charcoal-400">for</span>
              <span className="rounded bg-slate-100 px-1.5 py-px text-[11px] text-charcoal-700">{app.requirements.find((r) => r.key === reqKey)?.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {!pendingKey ? (
                <button onClick={doUpload} disabled={!seed && !file} className="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accent-500 disabled:opacity-40">
                  <UploadCloud className="h-3.5 w-3.5" /> Run pipeline
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analysing…
                </span>
              )}
            </div>
          </div>

          {uploaded && (
            <p className="mt-3 flex items-center gap-1.5 rounded-md border border-verified-200 bg-verified-50 px-3 py-2 text-xs font-medium text-verified-700">
              <CheckCircle2 className="h-4 w-4" /> {uploaded} processed — assessment re-run, case state updated.
            </p>
          )}

          {pendingKey && (
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {PIPELINE.map((p, i) => (
                <div key={p.label} className={cn('rounded-lg border px-3 py-2', i <= phase ? 'border-accent-300 bg-accent-50' : 'border-slate-100 bg-slate-50')}>
                  <p className={cn('flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide', i <= phase ? 'text-accent-800' : 'text-charcoal-400')}>
                    {i < phase ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />} {p.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-charcoal-500">{p.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* evidence grid */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {app.evidence.filter((e) => !e.superseded).map((e, i) => (
          <motion.article key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 px-3 py-2">
              {e.fileType === 'pdf' ? <FileText className="h-4 w-4 text-conflict-500" /> : <ImageIcon className="h-4 w-4 text-accent-500" />}
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-charcoal-800">{e.fileName}</p>
              <span className={cn('rounded-full px-1.5 py-px text-[10px] font-bold uppercase', e.givesConfidence >= 85 ? 'bg-verified-50 text-verified-700' : 'bg-warn-50 text-warn-700')}>
                {Math.round(e.givesConfidence)}%
              </span>
            </div>
            <div className="border-t border-slate-100 px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[10px] text-charcoal-400">
                <span>{e.requirementKey} · {filesOf(e.requirementKey).indexOf(e) + 1} of {filesOf(e.requirementKey).length}</span>
                <span>Quality {Math.round(e.quality)} · Readability {Math.round(e.readability)}</span>
              </div>
              <div className="mb-2 h-1 overflow-hidden rounded-full bg-slate-100">
                <motion.div className="h-full bg-accent-500" initial={{ width: 0 }} animate={{ width: `${e.quality}%` }} transition={{ duration: 0.7 }} />
              </div>
              <div className="flex flex-wrap gap-1">
                {e.extractedFields.map((f) => (
                  <span key={f.key} title={`${f.label}: ${f.value} (${Math.round(f.confidence)}%)`} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-charcoal-600">
                    {f.label}: {f.value}
                  </span>
                ))}
              </div>
              <AnimatePresence>
                {e.givesConfidence < 90 && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 flex items-start gap-1 text-[10px] leading-4 text-warn-700">
                    <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" /> {e.givesConfidence < 75 ? 'Low confidence — possible conflict' : 'Moderate confidence — a closer document is recommended'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.article>
        ))}
        {app.evidence.filter((e) => !e.superseded).length === 0 && (
          <p className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-charcoal-400">No processed documents yet — run the pipeline above.</p>
        )}
      </div>
    </div>
  );
}