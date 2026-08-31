import { Trend } from './primitives';
import { MiniSpark } from '../charts/Charts';
import { cx } from '@/utils/format';

export function KpiCard({ label, value, trend, spark, sparkColor = '#7C3AED', icon: Icon, onClick }: {
  label: string; value: string; trend?: number; spark?: number[]; sparkColor?: string; icon?: any; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className={cx('card card-hover p-4 sm:p-5 text-left flex flex-col gap-2.5 w-full', onClick && 'cursor-pointer')}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted">{label}</span>
        {Icon && (
          <span className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-brand/12 shadow-clay-inset">
            <Icon size={16} className="text-brand" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-display text-[26px] font-black text-content tracking-tight leading-none">{value}</span>
        {trend !== undefined && <Trend value={trend} />}
      </div>
      {spark && <div className="-mb-1 mt-0.5 opacity-95"><MiniSpark data={spark} color={sparkColor} height={34} /></div>}
    </button>
  );
}
