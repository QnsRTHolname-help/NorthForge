import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'info' | 'warning' | 'error';
interface Toast { id: number; type: ToastType; message: string; }
interface ToastCtx { toast: (message: string, type?: ToastType) => void; }

const Ctx = createContext<ToastCtx>({ toast: () => {} });

const icons = {
  success: CheckCircle2, info: Info, warning: AlertTriangle, error: XCircle,
};
const colors = {
  success: 'text-emerald-500', info: 'text-brand', warning: 'text-amber-500', error: 'text-rose-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} role="status"
              className="animate-toast-in flex items-start gap-3 bg-elevated rounded-2xl shadow-clay-xl px-4 py-3.5">
              <Icon size={18} className={`${colors[t.type]} mt-0.5 shrink-0`} />
              <p className="text-sm text-content flex-1">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-faint hover:text-content transition-colors" aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
