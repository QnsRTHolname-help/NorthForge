import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/utils/format';

export function Modal({ open, onClose, title, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-clay-ink/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title}
        className={cx('relative w-full bg-elevated shadow-clay-xl animate-scale-in',
          'rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col', w)}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line/60 shrink-0">
            <h2 className="font-display font-extrabold text-content text-lg">{title}</h2>
            <button onClick={onClose} className="btn-ghost btn-sm -mr-2" aria-label="Close"><X size={18} /></button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-line/60 flex items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-clay-ink/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title}
        className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-elevated shadow-clay-xl animate-slide-in-right flex flex-col rounded-l-3xl">
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line/60 shrink-0">
            <h2 className="font-display font-extrabold text-content text-lg">{title}</h2>
            <button onClick={onClose} className="btn-ghost btn-sm -mr-2" aria-label="Close"><X size={18} /></button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-line/60 flex items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string;
  confirmLabel?: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </>}>
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
