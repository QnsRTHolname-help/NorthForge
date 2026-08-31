import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeCtx { mode: ThemeMode; setMode: (m: ThemeMode) => void; resolved: 'light' | 'dark'; }

const Ctx = createContext<ThemeCtx>({ mode: 'system', setMode: () => {}, resolved: 'dark' });
const KEY = 'northforge.theme';

function apply(mode: ThemeMode): 'light' | 'dark' {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  return dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : 'light'; } catch { return 'light'; }
  });
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => apply(mode));

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(KEY, JSON.stringify(m));
    setResolved(apply(m));
  };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (mode === 'system') setResolved(apply('system')); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return <Ctx.Provider value={{ mode, setMode, resolved }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
