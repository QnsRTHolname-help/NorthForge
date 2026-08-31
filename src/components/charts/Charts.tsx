import { useId } from 'react';
import { cx } from '@/utils/format';

// All charts use CSS vars & currentColor so they follow the theme automatically.

export function AreaChart({ data, height = 180, color = '#7C3AED', valueKey = 'visitors' }: {
  data: { label: string; [k: string]: any }[]; height?: number; color?: string; valueKey?: string;
}) {
  const gid = useId().replace(/:/g, '');
  const w = 600;
  const h = height;
  const pad = 8;
  const vals = data.map((d) => d[valueKey] as number);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const step = (w - pad * 2) / (data.length - 1 || 1);
  const pts = data.map((d, i) => {
    const x = pad + i * step;
    const y = pad + (1 - ((d[valueKey] - min) / range)) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  if (!pts.length) {
    return (
      <div className="flex items-center justify-center text-xs text-muted" style={{ height }}>
        No data for this period yet
      </div>
    );
  }
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`ar-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#ar-${gid})`} className="animate-fade-in" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: 'draw 1.1s cubic-bezier(0.22,1,0.36,1) forwards' }} />
      <style>{`@keyframes draw{to{stroke-dashoffset:0}}`}</style>
    </svg>
  );
}

export function MiniSpark({ data, color = '#7C3AED', height = 40 }: { data: number[]; color?: string; height?: number }) {
  const w = 100, pad = 2;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = (w - pad * 2) / (data.length - 1 || 1);
  const pts = data.map((v, i) => [pad + i * step, pad + (1 - (v - min) / range) * (height - pad * 2)]);
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  if (!pts.length) return null;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarChart({ data, height = 180, color = '#7C3AED', valueKey = 'leads' }: {
  data: { label: string; [k: string]: any }[]; height?: number; color?: string; valueKey?: string;
}) {
  const vals = data.map((d) => d[valueKey] as number);
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-[3px] w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-t-[3px] origin-bottom transition-all hover:opacity-80"
          title={`${d.label}: ${d[valueKey]}`}
          style={{ height: `${(d[valueKey] / max) * 100}%`, backgroundColor: color,
            animation: `grow-bar .6s cubic-bezier(0.22,1,0.36,1) ${i * 20}ms both` }} />
      ))}
    </div>
  );
}

export function Donut({ data, size = 140 }: { data: { source?: string; device?: string; value: number }[]; size?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const colors = ['#7C3AED', '#DB2777', '#0EA5E9', '#10B981', '#F59E0B', '#a78bfa'];
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors[i % colors.length]}
              strokeWidth="14" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset}
              className="transition-all" style={{ animation: `fade-in .5s ${i * 80}ms both` }} />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-muted">{d.source || d.device}</span>
            <span className="text-content font-semibold ml-auto">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RingProgress({ value, size = 64, color = '#7C3AED', label }: { value: number; size?: number; color?: string; label?: string }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="6" className="stroke-line" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="6" stroke={color} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <span className={cx('absolute font-bold text-content', size > 56 ? 'text-sm' : 'text-xs')}>{label ?? `${value}%`}</span>
    </div>
  );
}
