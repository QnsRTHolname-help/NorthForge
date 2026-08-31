import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/theme/ThemeProvider';
import { cx } from '@/utils/format';

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const opts = [
    { m: 'light' as const, icon: Sun, label: 'Light' },
    { m: 'dark' as const, icon: Moon, label: 'Dark' },
    { m: 'system' as const, icon: Monitor, label: 'System' },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl bg-sunken shadow-clay-inset p-1" role="group" aria-label="Theme">
      {opts.map(({ m, icon: Icon, label }) => (
        <button key={m} onClick={() => setMode(m)} title={label} aria-label={label} aria-pressed={mode === m}
          className={cx('w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90',
            mode === m ? 'bg-panel text-brand shadow-clay-sm' : 'text-faint hover:text-content')}>
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
