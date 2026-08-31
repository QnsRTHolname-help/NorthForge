// ---------------------------------------------------------------------------
// Floating AI chat widget — the bottom-right chat bubble for customers.
//
// Behavior:
//   * Renders nothing unless an assistant is configured (plan gating holds).
//   * Sends questions to POST /api/chat (NVIDIA NIM via server-side key).
//   * Falls back to local FAQ keyword matching when the AI is not configured,
//     rate-limited or unreachable — chat keeps working either way.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, MessageCircle } from 'lucide-react';
import type { AIAssistant } from '@/types';
import { cx } from '@/utils/format';
import { AGENCY } from '@/data/catalog';
import { useToast } from '@/hooks/useToast';

type Msg = { from: 'bot' | 'user'; text: string; at: number };

interface ChatContext {
  business: string;
  greeting: string;
  tone: string;
  hours: string;
  faqs: { q: string; a: string }[];
}

// ---- Local FAQ fallback (no network, no key required) ----------------------
const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'you', 'your', 'i', 'we', 'of', 'to', 'and', 'in', 'for', 'what', 'how', 'can', 'my', 'me', 'on', 'at', 'it']);
const tokens = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t));

function faqAnswer(question: string, faqs: { q: string; a: string }[]): string | null {
  const qt = tokens(question);
  if (!qt.length) return null;
  let best: { score: number; a: string } | null = null;
  for (const f of faqs) {
    const ft = tokens(`${f.q} ${f.a}`);
    const score = qt.reduce((s, t) => s + (ft.includes(t) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, a: f.a };
  }
  return best ? best.a : null;
}

async function askAi(ctx: ChatContext, message: string, history: Msg[]): Promise<{ reply: string; ai: boolean }> {
  // Two attempts — transient hiccups (server restart, network blip) shouldn't
  // permanently degrade the conversation to FAQ mode.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: ctx.business,
          greeting: ctx.greeting,
          tone: ctx.tone,
          hours: ctx.hours,
          faqs: ctx.faqs,
          message,
          history: history.slice(-8).map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
        }),
      });
      const json = await res.json();
      if (json?.success && json.data?.reply) return { reply: json.data.reply, ai: true };
      // Server reachable but AI unavailable (no key / rate limited) — no point retrying.
      if (json?.success && json.data?.source === 'fallback') {
        console.warn('[chat] AI unavailable on server:', json.data?.code || 'unknown');
        break;
      }
    } catch (err) {
      console.warn('[chat] /api/chat unreachable (attempt ' + (attempt + 1) + '):', err);
    }
  }
  const faq = faqAnswer(message, ctx.faqs);
  return {
    reply: faq ||
      `I couldn't find an answer for that right now. You can reach ${ctx.business} at ${AGENCY.phone} or ${AGENCY.email} — or leave your name and number and the team will get back to you.`,
    ai: false,
  };
}

export function ChatWidget({ assistant }: { assistant: AIAssistant | null | undefined }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiOnline, setAiOnline] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const ctx: ChatContext | null = assistant
    ? {
        business: assistant.name,
        greeting: assistant.greeting,
        tone: assistant.tone,
        hours: assistant.hours,
        faqs: assistant.faqs || [],
      }
    : null;

  // Greet when the conversation first opens.
  useEffect(() => {
    if (open && ctx) {
      setMsgs((m) => (m.length ? m : [{ from: 'bot', text: ctx.greeting, at: Date.now() }]));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  if (!ctx) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const history = msgs;
    setMsgs((m) => [...m, { from: 'user', text, at: Date.now() }]);
    setBusy(true);
    try {
      const { reply, ai } = await askAi(ctx, text, history);
      setAiOnline(ai);
      setMsgs((m) => [...m, { from: 'bot', text: reply, at: Date.now() }]);
    } catch {
      toast('Chat is unavailable right now — please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-5 z-[70] w-[calc(100vw-2rem)] sm:w-96 max-w-sm animate-scale-in origin-bottom-right">
          <div className="rounded-3xl bg-elevated shadow-clay-xl flex flex-col overflow-hidden border border-line/60">
            <div className="flex items-center gap-2.5 px-4 py-3.5 bg-panel border-b border-line/60">
              <span className="w-9 h-9 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0"><Bot size={18} className="text-brand" /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content truncate">{ctx.business}</p>
                {aiOnline ? (
                  <p className="text-[11px] text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-current" /> Online</p>
                ) : (
                  <p className="text-[11px] text-amber-500 flex items-center gap-1" title="AI is unreachable — answering from saved FAQs"><span className="w-1.5 h-1.5 rounded-full bg-current" /> Offline · FAQ mode</p>
                )}
              </div>
              <button className="btn-ghost btn-sm ml-auto !p-1.5" onClick={() => setOpen(false)} aria-label="Close chat"><X size={16} /></button>
            </div>

            <div ref={listRef} className="h-80 overflow-y-auto px-3.5 py-3 space-y-2.5 bg-surface/60">
              {msgs.map((m, i) => (
                <div key={i} className={cx('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cx(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words',
                    m.from === 'user' ? 'bg-brand text-white rounded-tr-sm' : 'bg-panel text-content border border-line rounded-tl-sm',
                  )}>{m.text}</div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-panel border border-line rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!!ctx.faqs.length && msgs.length <= 1 && (
              <div className="px-3.5 pt-2.5 flex flex-wrap gap-1.5 bg-surface/60">
                {ctx.faqs.slice(0, 2).map((f, i) => (
                  <button key={i} className="chip text-[11px] hover:border-brand transition-colors" onClick={() => { setInput(f.q); inputRef.current?.focus(); }}>
                    {f.q}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 bg-panel border-t border-line/60 flex items-center gap-2">
              <input
                ref={inputRef}
                className="input flex-1 !py-2"
                placeholder="Type your question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                maxLength={1000}
              />
              <button className="btn-primary btn-sm !px-3 disabled:opacity-50" onClick={send} disabled={busy || !input.trim()} aria-label="Send">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
        className="fixed bottom-5 right-4 sm:right-5 z-[70] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-clay-xl transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#a78bfa,#7C3AED)' }}
      >
        {open ? <X size={22} /> : <span className="relative"><MessageCircle size={24} /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white/30" /></span>}
      </button>
    </>
  );
}

