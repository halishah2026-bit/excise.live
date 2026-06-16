"use client";
import { useEffect, useState, useRef } from 'react';
import { getUser, isAdmin } from '@/lib/auth';
import API from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const user = getUser();
  const admin = isAdmin();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const prevUnread = useRef(0);

  useEffect(() => {
    let mounted = true;
    const fetchNotifs = async () => {
      if (!admin) return;
      try {
        const { data } = await API.get('/admin/notifications?page=1&limit=6');
        if (!mounted) return;
        setNotifications(data.notifications || []);
        const u = (data.notifications || []).filter((n: any) => !n.isRead).length;
        setUnread(u);
        if (u > prevUnread.current) {
          // play simple alert tone
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = 880;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.value = 0.02;
            o.start();
            setTimeout(() => { o.stop(); ctx.close(); }, 400);
          } catch (err) {
            console.warn('Audio play failed', err);
          }
        }
        prevUnread.current = u;
      } catch (err) {
        // ignore
      }
    };
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 15000);
    return () => { mounted = false; clearInterval(iv); };
  }, [admin]);

  const markRead = async (id: string) => {
    try {
      await API.patch(`/admin/notifications/${id}/read`);
      setNotifications((prev) => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread((u) => Math.max(0, u - 1));
    } catch (err) { console.warn(err); }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden mt-0.5 w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {admin && (
          <div className="relative">
            <button onClick={() => setOpen(o => !o)} aria-label="Notifications" className="relative w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              {unread > 0 && <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{unread}</span>}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50">
                <div className="p-3 border-b border-gray-100 font-semibold">Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 && <div className="p-4 text-sm text-gray-500">No notifications</div>}
                  {notifications.map((n) => (
                    <div key={n._id} className={`p-3 hover:bg-gray-50 flex items-start justify-between gap-3 ${n.isRead ? 'opacity-80' : 'bg-white'}`}>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{n.message}</div>
                        <div className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!n.isRead && <button onClick={() => markRead(n._id)} className="text-xs text-blue-600">Mark read</button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100 text-center"><a href="/admin/notifications" className="text-xs text-blue-600 font-semibold">View all</a></div>
              </div>
            )}
          </div>
        )}

        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-gray-700">{user?.name}</p>
          <p className="text-xs text-gray-400">{dateStr}</p>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
        </div>
      </div>
    </header>
  );
}
