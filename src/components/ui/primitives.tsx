import { type ReactNode } from 'react';
import { cx } from '@/utils/format';

// ---- Brand Logo (clay NF mark) --------------------------------------------
export function Logo({ size = 40, showWord = false }: { size?: number; showWord?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{
          width: size, height: size, borderRadius: size * 0.32,
          background: 'linear-gradient(135deg, #8b5cf6, #7C3AED 55%, #6d28d9)',
          boxShadow: '5px 6px 14px rgba(124,58,237,0.42), -3px -3px 10px rgba(255,255,255,0.30), inset 2px 2px 4px rgba(255,255,255,0.45), inset -3px -3px 8px rgba(76,29,149,0.4)',
        }}
      >
        <span className="font-display font-black text-white leading-none" style={{ fontSize: size * 0.42, letterSpacing: '-0.04em' }}>NF</span>
      </div>
      {showWord && (
        <div className="leading-none">
          <div className="font-display font-black text-content tracking-tight" style={{ fontSize: size * 0.4 }}>NorthForge</div>
          <div className="text-[10px] font-bold text-faint tracking-[0.15em] uppercase mt-0.5">Agency OS</div>
        </div>
      )}
    </div>
  );
}

// ---- Status Badge ---------------------------------------------------------
type Tone = 'brand' | 'violet' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const toneMap: Record<Tone, string> = {
  brand: 'bg-brand/12 text-brand',
  violet: 'bg-brand/12 text-brand',
  success: 'bg-clay-success/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-clay-warning/18 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-500/14 text-rose-600 dark:text-rose-400',
  neutral: 'bg-sunken text-muted',
  info: 'bg-sky2/15 text-sky-600 dark:text-sky-400',
};
export function Badge({ children, tone = 'neutral', dot, className }: { children: ReactNode; tone?: Tone; dot?: boolean; className?: string }) {
  return (
    <span className={cx('badge', toneMap[tone], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// ---- Trend indicator ------------------------------------------------------
export function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cx('inline-flex items-center gap-0.5 text-xs font-bold', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
      {up ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ---- Page header ----------------------------------------------------------
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display text-[26px] sm:text-3xl font-black text-content tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ---- Empty state ----------------------------------------------------------
export function EmptyState({ icon: Icon, title, message, action }: { icon: any; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-panel flex items-center justify-center mb-4 card-sm animate-clay-float">
        <Icon size={26} className="text-brand" />
      </div>
      <h3 className="font-display font-extrabold text-content text-lg">{title}</h3>
      <p className="text-sm text-muted mt-1.5 max-w-xs">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---- Loading skeletons ----------------------------------------------------
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 h-32 flex flex-col justify-between">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-8 w-16" />
          <div className="skeleton h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card p-5 space-y-3.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton w-11 h-11 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3" />
            <div className="skeleton h-3 w-1/2" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ onRetry, label = 'Unable to load data.' }: { onRetry?: () => void; label?: string }) {
  return (
    <div className="card p-10 text-center">
      <p className="text-sm text-muted">{label}</p>
      {onRetry && <button className="btn-outline btn-sm mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

// ---- Progress bar ---------------------------------------------------------
export function Progress({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'violet' | 'success' }) {
  const bg = tone === 'success' ? 'linear-gradient(90deg,#34d399,#10B981)' : 'linear-gradient(90deg,#a78bfa,#7C3AED)';
  return (
    <div className="h-2.5 w-full rounded-full bg-sunken overflow-hidden" style={{ boxShadow: 'var(--clay-inset)' }}>
      <div className="h-full rounded-full origin-left animate-grow-bar" style={{ width: `${Math.min(100, value)}%`, background: bg }} />
    </div>
  );
}

// ---- Avatar (clay pebble) -------------------------------------------------
export function Avatar({ text, size = 40, tone = 'brand' }: { text: string; size?: number; tone?: 'brand' | 'violet' | 'ink' | 'pink' | 'sky' }) {
  const grad = tone === 'pink' ? 'linear-gradient(135deg,#f472b6,#DB2777)'
    : tone === 'sky' ? 'linear-gradient(135deg,#38bdf8,#0EA5E9)'
    : tone === 'ink' ? 'linear-gradient(135deg,#4b4552,#332F3A)'
    : 'linear-gradient(135deg,#a78bfa,#7C3AED)';
  return (
    <div
      className="text-white font-display font-black flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: size * 0.3, fontSize: size * 0.36, background: grad,
        boxShadow: '4px 5px 12px rgba(124,58,237,0.30), -2px -2px 8px rgba(255,255,255,0.25), inset 1px 1px 2px rgba(255,255,255,0.4), inset -2px -2px 6px rgba(0,0,0,0.15)',
      }}
    >
      {text.slice(0, 2).toUpperCase()}
    </div>
  );
}
