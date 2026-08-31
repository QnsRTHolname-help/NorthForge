import { type ReactNode } from 'react';

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-faint mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

export function Select({ value, onChange, options, ...rest }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'>) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
