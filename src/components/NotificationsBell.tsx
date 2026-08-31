import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationService } from '@/services';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo, cx } from '@/utils/format';

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const role = user?.role || 'admin';
  const clientId = user?.clientId;
  const { data, reload } = useAsync(() => notificationService.listFor(role, clientId), [role, clientId]);
  const unread = (data || []).filter((n) => !n.read).length;
  const base = role === 'admin' ? '/app/notifications' : '/portal/settings';

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  // Refresh when opened so cross-portal updates surface.
  useEffect(() => { if (open) reload(); }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button className="btn-ghost !p-2 relative" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[90vw] bg-elevated rounded-3xl shadow-clay-xl animate-scale-in origin-top-right z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line/60">
            <h3 className="font-display font-extrabold text-sm text-content">Notifications</h3>
            {unread > 0 && <button className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
              onClick={async () => { await notificationService.markAllRead(role, clientId); reload(); }}>
              <Check size={12} /> Mark all read
            </button>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {(data || []).length === 0 && <p className="text-sm text-muted text-center py-8">You're all caught up.</p>}
            {(data || []).slice(0, 8).map((n) => (
              <button key={n.id} onClick={async () => { await notificationService.markRead(n.id); reload(); }}
                className={cx('w-full text-left px-4 py-3 border-b border-line/50 last:border-0 hover:bg-sunken transition-colors flex gap-3', !n.read && 'bg-brand/[0.05]')}>
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />}
                <div className={cx('min-w-0', n.read && 'pl-[calc(0.375rem+0.75rem)]')}>
                  <p className="text-sm font-bold text-content">{n.title}</p>
                  <p className="text-xs text-muted mt-0.5">{n.body}</p>
                  <p className="text-[11px] text-faint mt-1">{timeAgo(n.at)}</p>
                </div>
              </button>
            ))}
          </div>
          {role === 'admin' && (
            <Link to={base} onClick={() => setOpen(false)}
              className="block text-center text-sm font-bold text-brand py-3 border-t border-line/60 hover:bg-sunken transition-colors">
              View all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
