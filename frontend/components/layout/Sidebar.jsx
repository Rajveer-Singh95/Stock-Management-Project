'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Truck, ShoppingCart,
  Bell, BarChart2, LogOut, X, ChevronRight, Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/orders', label: 'Purchase Orders', icon: ShoppingCart },
  { href: '/alerts', label: 'Alerts', icon: Bell, badge: true },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
];

export default function Sidebar({ isOpen, onClose, currentPath, user, onLogout }) {
  const { data: alertSummary } = useQuery({
    queryKey: ['alertSummary'],
    queryFn: () => alertsApi.getSummary().then(r => r.data.summary),
    refetchInterval: 60000,
  });

  const unreadAlerts = parseInt(alertSummary?.unread || 0);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 z-30">
        <SidebarContent currentPath={currentPath} user={user} onLogout={onLogout} unreadAlerts={unreadAlerts} />
      </aside>

      {/* Mobile sidebar */}
      <aside className={`flex lg:hidden flex-col fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-white/10 z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent currentPath={currentPath} user={user} onLogout={onLogout} unreadAlerts={unreadAlerts} />
      </aside>
    </>
  );
}

function SidebarContent({ currentPath, user, onLogout, unreadAlerts }) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-slate-100 leading-none">StockFlow</div>
          <div className="text-xs text-slate-500 mt-0.5">Inventory Manager</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath?.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}>
              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
              <span className="flex-1">{item.label}</span>
              {item.badge && unreadAlerts > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="pt-4 mt-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ backgroundColor: user?.avatar_color || '#6366f1' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{user?.name || 'User'}</div>
            <div className="text-xs text-slate-500 truncate capitalize">{user?.role || 'staff'}</div>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
