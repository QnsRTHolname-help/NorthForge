import { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Play, RotateCw, Loader2, Activity, Lock } from 'lucide-react';
import { PageHeader, Badge } from '@/components/ui/primitives';
import { runPreflight, runSecurityAudit, type PreflightReport, type TestResult } from '@/services/preflight';
import { useToast } from '@/hooks/useToast';
import { cx } from '@/utils/format';

const icon: Record<TestResult, any> = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle };
const color: Record<TestResult, string> = { pass: 'text-clay-success', warn: 'text-amber-500', fail: 'text-rose-500' };

export default function SystemHealth() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'workflows' | 'security'>('workflows');
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      // yield a frame so the spinner paints before the (synchronous-ish) suite runs
      await new Promise((r) => setTimeout(r, 60));
      const r = tab === 'workflows' ? await runPreflight() : await runSecurityAudit();
      setReport(r);
      toast(r.failed === 0 ? `${tab === 'workflows' ? 'Preflight' : 'Security audit'} complete — ${r.passed} passed` : `Found ${r.failed} failure${r.failed > 1 ? 's' : ''}`, r.failed === 0 ? 'success' : 'error');
    } catch { toast('The audit could not complete.', 'error'); }
    finally { setRunning(false); }
  };

  const switchTab = (t: 'workflows' | 'security') => { setTab(t); setReport(null); };

  const groups = report ? Array.from(new Set(report.cases.map((c) => c.group))) : [];
  const intro = tab === 'workflows'
    ? 'This runs real workflows — auth, client requests, payments, projects, notifications, WhatsApp URLs and more — then restores the database. Nothing is faked and no real data is changed.'
    : 'This verifies enforceable controls — password hiding, role integrity, payment authorization, client isolation, input validation, XSS-safe rendering, honeypot & rate limiting — and honestly flags infrastructure (RLS, headers, CORS) that is provided as config but not yet connected.';

  return (
    <div>
      <PageHeader title="System Health & Security" subtitle="Verify core workflows and security controls — safely, against the live data layer"
        actions={<button className="btn-primary" disabled={running} onClick={run}>{running ? <><Loader2 size={16} className="animate-spin-slow" /> Running…</> : report ? <><RotateCw size={16} /> Run Again</> : <><Play size={16} /> {`Run ${tab === 'workflows' ? 'Preflight' : 'Security Audit'}`}</>}</button>} />

      {/* Tabs */}
      <div className="inline-flex rounded-2xl bg-sunken shadow-clay-inset p-1 mb-5">
        {([['workflows', 'Workflows', Activity], ['security', 'Security', Lock]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => switchTab(id)}
            className={cx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold font-display transition-all', tab === id ? 'bg-panel text-brand shadow-clay-sm' : 'text-muted hover:text-content')}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {!report && !running && (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 rounded-4xl bg-brand/12 shadow-clay-inset flex items-center justify-center mx-auto mb-4 animate-clay-float">{tab === 'workflows' ? <ShieldCheck size={28} className="text-brand" /> : <Lock size={28} className="text-brand" />}</div>
          <h3 className="font-display font-extrabold text-content text-lg">{tab === 'workflows' ? 'Preflight ready' : 'Security audit ready'}</h3>
          <p className="text-sm text-muted mt-1.5 max-w-md mx-auto">{intro}</p>
          <button className="btn-primary mt-5" onClick={run}><Play size={16} /> Run {tab === 'workflows' ? 'Full Preflight' : 'Security Audit'}</button>
        </div>
      )}

      {running && !report && (
        <div className="card p-12 text-center">
          <Loader2 size={32} className="animate-spin-slow text-brand mx-auto" />
          <p className="text-sm text-muted mt-4">Executing test workflows…</p>
        </div>
      )}

      {report && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Summary label="Passed" value={report.passed} tone="pass" />
            <Summary label="Warnings" value={report.warned} tone="warn" />
            <Summary label="Failed" value={report.failed} tone="fail" />
            <div className="card p-5"><p className="text-xs font-bold text-muted">Run time</p><p className="font-display text-[26px] font-black text-content mt-1">{report.ms}<span className="text-base text-faint">ms</span></p><p className="text-xs text-muted">{report.total} checks</p></div>
          </div>

          <div className={cx('card p-4 flex items-center gap-3', report.failed === 0 ? 'ring-1 ring-clay-success/30' : 'ring-1 ring-rose-500/30')}>
            {report.failed === 0
              ? <><CheckCircle2 size={20} className="text-clay-success" /><p className="text-sm font-bold text-content">All critical workflows passed. {report.warned > 0 && <span className="text-muted font-medium">{report.warned} warning{report.warned > 1 ? 's' : ''} relate to external integrations that aren't connected yet.</span>}</p></>
              : <><XCircle size={20} className="text-rose-500" /><p className="text-sm font-bold text-content">{report.failed} check{report.failed > 1 ? 's' : ''} failed — review below.</p></>}
          </div>

          {/* Grouped results */}
          {groups.map((g) => {
            const cases = report.cases.filter((c) => c.group === g);
            return (
              <div key={g} className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-line/60">
                  <h3 className="font-display font-extrabold text-content">{g}</h3>
                  <div className="flex gap-1.5">
                    {(['pass', 'warn', 'fail'] as TestResult[]).map((r) => {
                      const n = cases.filter((c) => c.result === r).length;
                      return n > 0 ? <Badge key={r} tone={r === 'pass' ? 'success' : r === 'warn' ? 'warning' : 'danger'}>{n}</Badge> : null;
                    })}
                  </div>
                </div>
                <div className="divide-y divide-line/50">
                  {cases.map((c, i) => {
                    const Icon = icon[c.result];
                    return (
                      <div key={i} className="flex items-start gap-3 px-5 py-3">
                        <Icon size={17} className={cx('mt-0.5 shrink-0', color[c.result])} />
                        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-content">{c.name}</p><p className="text-xs text-muted mt-0.5">{c.detail}</p></div>
                        <span className={cx('text-[11px] font-black uppercase tracking-wide', color[c.result])}>{c.result}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone: TestResult }) {
  const Icon = icon[tone];
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between"><p className="text-xs font-bold text-muted">{label}</p><Icon size={16} className={color[tone]} /></div>
      <p className={cx('font-display text-[26px] font-black mt-1', color[tone])}>{value}</p>
    </div>
  );
}
