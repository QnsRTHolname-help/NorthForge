import { useState } from 'react';
import { Check, Star, CreditCard, Clock, CheckCircle2, AlertTriangle, MessageCircle } from 'lucide-react';
import { PageHeader, Badge } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { Modal } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useClientData } from './useClient';
import { useAsync } from '@/hooks/useAsync';
import { PLANS, planById, formatINR } from '@/data/catalog';
import { paymentService } from '@/services';
import { useToast } from '@/hooks/useToast';
import { planWa } from '@/utils/contact';
import type { Payment, PlanId } from '@/types';
import { inr, fmtDate, cx } from '@/utils/format';

export default function CSubscription() {
  const { client, subscription } = useClientData();
  const { toast } = useToast();
  const plan = planById(client.plan);
  const { data: payments, reload } = useAsync(() => paymentService.list().then((p) => p.filter((x) => x.clientId === client.id)), [client.id]);
  const [payFor, setPayFor] = useState<PlanId | null>(null);

  // Latest payment for this client drives the visible status.
  const latest = (payments || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const openPayment = (payments || []).find((p) => ['pending', 'submitted', 'partial', 'failed'].includes(p.status));

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Your NorthForge plan & payment status" />

      {/* Current plan + payment status banner */}
      <PaymentBanner payment={latest} sub={subscription} />

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><h3 className="font-display font-black text-content text-lg">{plan.name} Plan</h3>{subscription && <StatusBadge kind="sub" value={subscription.status} dot />}</div>
            <p className="text-sm text-muted mt-1">{plan.goal}</p>
          </div>
          {subscription && <div className="text-right"><p className="font-display text-2xl font-black text-content">{inr(subscription.price)}<span className="text-sm text-faint"> / 28 days</span></p><p className="text-xs text-muted">Renews {fmtDate(subscription.renewal)}</p></div>}
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mt-5 pt-5 border-t border-line/60">
          {plan.features.map((f, i) => <div key={i} className="flex gap-2 text-sm"><Check size={15} className="text-clay-success shrink-0 mt-0.5" /><span className="text-content">{f.label}</span></div>)}
        </div>
        {openPayment && (
          <div className="mt-5 pt-5 border-t border-line/60 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted flex-1">{openPayment.status === 'submitted' ? 'Your payment reference is being verified by NorthForge.' : 'Complete your payment and submit your reference to activate your plan.'}</p>
            {openPayment.status !== 'submitted' && <button className="btn-primary btn-sm" onClick={() => setPayFor(client.plan)}><CreditCard size={14} /> Submit payment</button>}
          </div>
        )}
      </div>

      <h3 className="font-display font-extrabold text-content mb-3">Upgrade your plan</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANS.filter((p) => p.id !== 'custom' && p.price > plan.price).map((p) => (
          <div key={p.id} className={cx('card p-6', p.popular && 'ring-2 ring-brand')}>
            {p.popular && <span className="badge bg-brand text-white mb-2"><Star size={11} /> Popular</span>}
            <h4 className="font-display font-extrabold text-content">{p.name}</h4>
            <div className="mt-2 flex items-baseline gap-1"><span className="font-display text-2xl font-black text-content">{formatINR(p.price)}</span><span className="text-sm text-faint">/ 28d</span></div>
            <ul className="mt-4 space-y-2">{p.features.slice(0, 4).map((f, i) => <li key={i} className="flex gap-2 text-sm"><Check size={14} className="text-clay-success shrink-0 mt-0.5" /><span className="text-content">{f.label}</span></li>)}</ul>
            <button className="btn-primary w-full mt-5" onClick={() => setPayFor(p.id)}>Upgrade to {p.name}</button>
          </div>
        ))}
        {plan.price >= 2999 && (
          <div className="card p-6"><h4 className="font-display font-extrabold text-content">You're on our top plan</h4><p className="text-sm text-muted mt-2">Need something custom? Discuss a tailored quote with NorthForge.</p>
            <a href={planWa('custom')} target="_blank" rel="noreferrer" className="btn-outline w-full mt-4"><MessageCircle size={14} /> Request custom features</a></div>
        )}
      </div>

      {payFor && <PayModal planId={payFor} clientId={client.id} subscriptionId={subscription?.id} onClose={() => setPayFor(null)} onDone={() => { reload(); }} />}
    </div>
  );
}

function PaymentBanner({ payment, sub }: { payment?: Payment; sub?: any }) {
  if (!payment) return null;
  const map: Record<string, { icon: any; tone: string; title: string; body: string }> = {
    paid: { icon: CheckCircle2, tone: 'text-clay-success bg-clay-success/12', title: 'Payment verified', body: 'Your subscription is active. Thank you!' },
    submitted: { icon: Clock, tone: 'text-sky-500 bg-sky2/12', title: 'Payment under review', body: 'We received your reference and are verifying it.' },
    pending: { icon: Clock, tone: 'text-amber-500 bg-clay-warning/12', title: 'Payment pending', body: 'Complete your payment and submit your reference below.' },
    partial: { icon: AlertTriangle, tone: 'text-amber-500 bg-clay-warning/12', title: 'Partially paid', body: 'A partial payment was received. Please complete the balance.' },
    failed: { icon: AlertTriangle, tone: 'text-rose-500 bg-rose-500/12', title: 'Payment failed', body: 'We could not verify your payment. Please try again.' },
    refunded: { icon: AlertTriangle, tone: 'text-muted bg-sunken', title: 'Refunded', body: 'This payment has been refunded.' },
  };
  const m = map[payment.status];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <div className="card p-5 mb-4 flex items-start gap-3">
      <span className={cx('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', m.tone)}><Icon size={20} /></span>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap"><h3 className="font-display font-extrabold text-content">{m.title}</h3><StatusBadge kind="payment" value={payment.status} /></div>
        <p className="text-sm text-muted mt-1">{m.body}</p>
        {payment.reference && <p className="text-xs text-faint mt-1">Reference: <span className="font-mono">{payment.reference}</span></p>}
      </div>
    </div>
  );
}

function PayModal({ planId, clientId, subscriptionId, onClose, onDone }: {
  planId: PlanId; clientId: string; subscriptionId?: string; onClose: () => void; onDone: () => void;
}) {
  const { toast } = useToast();
  const plan = planById(planId);
  const [step, setStep] = useState<'instructions' | 'reference'>('instructions');
  const [paymentId, setPaymentId] = useState<string>('');
  const [reference, setReference] = useState('');
  const [method, setMethod] = useState('UPI');
  const [saving, setSaving] = useState(false);

  const startPayment = async () => {
    setSaving(true);
    try {
      const p = await paymentService.create({ clientId, subscriptionId, planId, amount: plan.price, status: 'pending' });
      setPaymentId(p.id);
      setStep('reference');
    } catch { toast('Unable to start payment.', 'error'); }
    finally { setSaving(false); }
  };

  const submitRef = async () => {
    if (!reference.trim()) { toast('Enter your payment reference.', 'warning'); return; }
    setSaving(true);
    try {
      await paymentService.submitReference(paymentId, reference.trim(), method as any);
      toast('Payment reference submitted — NorthForge will verify it shortly', 'success');
      onClose(); onDone();
    } catch { toast('Unable to submit reference.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`${plan.name} — ₹${plan.price.toLocaleString('en-IN')} / 28 days`} size="md"
      footer={step === 'instructions'
        ? <><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving} onClick={startPayment}>{saving ? 'Preparing…' : "I've made the payment"}</button></>
        : <><button className="btn-ghost" onClick={onClose}>Later</button><button className="btn-primary" disabled={saving} onClick={submitRef}>{saving ? 'Submitting…' : 'Submit reference'}</button></>}>
      {step === 'instructions' ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-sunken shadow-clay-inset p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Plan</span><span className="font-bold text-content">{plan.name}</span></div>
            <div className="flex justify-between"><span className="text-muted">Amount</span><span className="font-bold text-content">₹{plan.price.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted">Billing</span><span className="font-bold text-content">Every 28 days</span></div>
            <div className="flex justify-between"><span className="text-muted">Status</span><Badge tone="warning">Payment pending</Badge></div>
          </div>
          <div>
            <p className="label">How to pay</p>
            <p className="text-sm text-muted">Pay ₹{plan.price.toLocaleString('en-IN')} via UPI to <b className="text-content">northforge@upi</b> (or ask us for a payment link on WhatsApp). Then submit your payment reference so NorthForge can verify and activate your plan.</p>
          </div>
          <p className="text-[11px] text-faint">Payments are verified by NorthForge — your plan activates as soon as we confirm your reference.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <p className="text-sm text-muted">Enter the reference number from your payment so we can verify it.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Method"><Select value={method} onChange={setMethod} options={['UPI', 'Card', 'Bank Transfer'].map((m) => ({ value: m, label: m }))} /></Field>
            <Field label="Reference"><input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UPI/…/12345" /></Field>
          </div>
        </div>
      )}
    </Modal>
  );
}
