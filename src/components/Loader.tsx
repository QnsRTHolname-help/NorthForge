import { useEffect, useState } from 'react';
import { Logo } from './ui/primitives';

export function BootLoader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 26 + 8;
      if (p >= 100) { p = 100; clearInterval(t); setTimeout(onDone, 260); }
      setProgress(Math.min(100, p));
    }, 120);
    return () => clearInterval(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-surface overflow-hidden">
      <div className="clay-blobs">
        <div className="blob animate-blob-1" style={{ width: 380, height: 380, top: '10%', left: '15%', background: 'var(--blob-a)' }} />
        <div className="blob animate-blob-2" style={{ width: 340, height: 340, bottom: '8%', right: '12%', background: 'var(--blob-c)' }} />
      </div>
      <div className="relative animate-scale-in flex flex-col items-center">
        <div className="animate-clay-float"><Logo size={64} /></div>
        <div className="mt-6 font-display font-black text-content tracking-tight text-xl">NorthForge <span className="text-faint font-bold">Agency OS</span></div>
        <div className="mt-6 w-48 h-2 rounded-full bg-sunken shadow-clay-inset overflow-hidden">
          <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#a78bfa,#7C3AED,#DB2777)' }} />
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-line border-t-brand animate-spin-slow" />
    </div>
  );
}
