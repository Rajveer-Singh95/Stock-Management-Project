'use client';
import { Menu, Bell, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import Link from 'next/link';

export default function Navbar({ onMenuClick, user, onLogout }) {
  const { data: alertSummary } = useQuery({
    queryKey: ['alertSummary'],
    queryFn: () => alertsApi.getSummary().then(r => r.data.summary),
    refetchInterval: 60000,
  });

  const unread = parseInt(alertSummary?.unread || 0);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-3.5 bg-slate-900/60 backdrop-blur-xl border-b border-white/10">
      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Quick search..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Alerts bell */}
        <Link href="/alerts" className="relative p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          )}
        </Link>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: user?.avatar_color || '#6366f1' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-200">{user?.name}</div>
            <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
