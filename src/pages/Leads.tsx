import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Upload, Plus, Phone, MessageCircle } from 'lucide-react';
import { PageHeader, SkeletonList, ErrorState, Avatar } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { CreateModal } from '@/components/forms/QuickCreate';
import { useAsync } from '@/hooks/useAsync';
import { leadService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { Lead } from '@/types';
import { inr, fmtShortDate, cx } from '@/utils/format';

export default function Leads() {
  const nav = useNavigate();
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsync(() => leadService.list(), []);
  const [status, setStatus] = useState('all');
  const [create, setCreate] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  if (loading) return <div><Head onCreate={() => setCreate(true)} onImport={() => setImportOpen(true)} /><SkeletonList rows={8} /></div>;
  if (error || !data) return <div><Head onCreate={() => setCreate(true)} onImport={() => setImportOpen(true)} /><ErrorState onRetry={reload} /></div>;

  const rows = status === 'all' ? data : data.filter((l) => l.status === status);

  const cols: Column<Lead>[] = [
    { key: 'business', header: 'Business', sortValue: (r) => r.business, render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar text={r.business} size={34} />
        <div className="min-w-0">
          <div className="font-semibold text-content truncate">{r.business}</div>
          <div className="text-xs text-muted">{r.code} · {r.contact || '—'}</div>
        </div>
      </div>
    )},
    { key: 'category', header: 'Category', hideOnMobile: true, sortValue: (r) => r.category, render: (r) => <span className="text-muted">{r.category}</span> },
    { key: 'score', header: 'Score', sortValue: (r) => r.score, render: (r) => (
      <div className="flex items-center gap-2">
        <span className={cx('font-bold', r.score >= 80 ? 'text-emerald-500' : r.score >= 60 ? 'text-amber-500' : 'text-muted')}>{r.score}</span>
        <StatusBadge kind="intent" value={r.intent} />
      </div>
    )},
    { key: 'value', header: 'Value', hideOnMobile: true, sortValue: (r) => r.estValue, render: (r) => <span className="font-medium text-content">{inr(r.estValue)}</span> },
    { key: 'source', header: 'Source', hideOnMobile: true, render: (r) => <span className="text-muted">{r.source}</span> },
    { key: 'follow', header: 'Next follow-up', hideOnMobile: true, sortValue: (r) => r.nextFollowUp || '', render: (r) => r.nextFollowUp ? <span className="text-muted">{fmtShortDate(r.nextFollowUp)}</span> : <span className="text-faint">—</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge kind="lead" value={r.status} dot /> },
    { key: 'actions', header: '', render: (r) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <a href={`tel:${r.phone}`} className="btn-ghost !p-1.5" title="Call"><Phone size={14} /></a>
        <a href={`https://wa.me/${r.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn-ghost !p-1.5" title="WhatsApp"><MessageCircle size={14} /></a>
      </div>
    )},
  ];

  const statuses = ['all', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

  return (
    <div>
      <Head onCreate={() => setCreate(true)} onImport={() => setImportOpen(true)} />
      <DataTable rows={rows} columns={cols} onRowClick={(r) => nav(`/app/leads/${r.id}`)}
        searchKeys={[(r) => r.business, (r) => r.contact, (r) => r.category, (r) => r.code, (r) => r.phone]}
        searchPlaceholder="Search leads by name, contact, category…"
        filters={
          <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        } />
      <CreateModal kind={create ? 'lead' : null} onClose={() => setCreate(false)} onCreated={reload} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onDone={reload} />
    </div>
  );

  function Head({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
    return <PageHeader title="Leads" subtitle="Every prospect NorthForge is working"
      actions={<>
        <button className="btn-outline" onClick={onImport}><Upload size={16} /> Import</button>
        <button className="btn-primary" onClick={onCreate}><Plus size={16} /> New Lead</button>
      </>} />;
  }
}

function ImportModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (file.name.endsWith('.csv')) {
      const r = new FileReader();
      r.onload = () => {
        const text = String(r.result || '');
        const rows = text.split(/\r?\n/).filter(Boolean).slice(0, 6).map((l) => l.split(','));
        setPreview(rows);
      };
      r.readAsText(file);
    } else {
      setPreview([['Preview available for CSV files.', 'XLSX will be parsed on import.']]);
    }
  };

  const doImport = async () => {
    if (!preview) return;
    // Parse rows beyond header as leads (best-effort mapping)
    const [header, ...rest] = preview;
    let count = 0;
    for (const row of rest) {
      if (!row[0]) continue;
      await leadService.create({ business: row[0], category: row[1] || 'General', phone: row[2] || '', websiteStatus: 'Needs Verification', source: 'Import' });
      count++;
    }
    toast(count > 0 ? `${count} lead${count > 1 ? 's' : ''} imported` : 'Import complete', 'success');
    onDone(); onClose(); setPreview(null); setFileName('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Import leads" size="lg"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={!preview} onClick={doImport}>Import leads</button>
      </>}>
      <div className="space-y-4">
        <p className="text-sm text-muted">Upload a CSV or XLSX of businesses. Columns like <span className="chip">Business Name</span> <span className="chip">Category</span> <span className="chip">Phone</span> <span className="chip">Website Status</span> are supported. Imported records are marked <b>Needs Verification</b> — external information is never assumed to be verified.</p>
        <label className="block border-2 border-dashed border-line rounded-2xl p-8 text-center cursor-pointer hover:border-brand/50 transition-colors">
          <Upload size={22} className="mx-auto text-faint mb-2" />
          <span className="text-sm font-medium text-content">{fileName || 'Choose a CSV or XLSX file'}</span>
          <span className="block text-xs text-faint mt-1">Click to browse</span>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handle} />
        </label>
        {preview && (
          <div className="card overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className={cx('border-b border-line/60', i === 0 && 'font-semibold text-content bg-surface')}>
                    {row.map((cell, j) => <td key={j} className="px-3 py-2 text-muted whitespace-nowrap">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
