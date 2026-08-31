import { PageHeader, EmptyState } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { useClientData } from './useClient';
import { Receipt, Download } from 'lucide-react';
import { inr, fmtDate } from '@/utils/format';
import { useToast } from '@/hooks/useToast';

export default function CInvoices() {
  const { invoices } = useClientData();
  const { toast } = useToast();
  return (
    <div>
      <PageHeader title="Invoices" subtitle="Your billing history with NorthForge" />
      {invoices.length === 0 ? <EmptyState icon={Receipt} title="No invoices yet" message="Your invoices will appear here." /> : (
        <div className="card divide-y divide-line">
          {invoices.map((i) => (
            <div key={i.id} className="flex items-center gap-3 p-4">
              <span className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0"><Receipt size={16} className="text-brand" /></span>
              <div className="flex-1 min-w-0"><p className="font-semibold text-content">{i.number}</p><p className="text-xs text-muted">{fmtDate(i.date)} · due {fmtDate(i.due)}</p></div>
              <div className="text-right"><p className="font-bold text-content">{inr(i.amount)}</p><StatusBadge kind="invoice" value={i.status} /></div>
              <button className="btn-ghost !p-2" onClick={() => toast('Invoice downloaded')} title="Download"><Download size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
