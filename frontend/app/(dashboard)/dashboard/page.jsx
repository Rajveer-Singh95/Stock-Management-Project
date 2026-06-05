'use client';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Package, AlertTriangle, XOctagon, DollarSign, Users, ShoppingCart, Activity } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import { formatCurrency, timeAgo } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats().then(res => res.data),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <div className="text-rose-400">Failed to load dashboard</div>;

  const { stats, stockHealth, movementTrend, categoryBreakdown, recentActivity } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Overview</h1>
          <p className="text-slate-400 text-sm">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div className="flex gap-2">
           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20">
             <Activity className="w-3.5 h-3.5" />
             Live Sync
           </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Inventory Value"
          value={formatCurrency(stats.totalInventoryValue)}
          icon={DollarSign}
          color="emerald"
          trend="up"
          trendLabel="+2.4%"
        />
        <KPICard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="indigo"
        />
        <KPICard
          title="Low Stock Alerts"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          color="amber"
          trend="down"
          trendLabel="Needs attention"
        />
        <KPICard
          title="Out of Stock"
          value={stats.outOfStockItems}
          icon={XOctagon}
          color="rose"
        />
        <KPICard
          title="Active Suppliers"
          value={stats.activeSuppliers}
          icon={Users}
          color="cyan"
        />
        <KPICard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={ShoppingCart}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-5 border-white/10">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Stock Movement Trend (Last 7 Days)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', {weekday: 'short'})} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="stock_in" name="Stock In" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="stock_out" name="Stock Out" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Health */}
        <div className="glass-card p-5 border-white/10">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Stock Health</h2>
          
          <div className="space-y-4 mt-6">
            <HealthBar label="Healthy" value={stockHealth.healthy} total={stats.totalProducts} color="bg-emerald-500" />
            <HealthBar label="Low Stock" value={stockHealth.low} total={stats.totalProducts} color="bg-indigo-500" />
            <HealthBar label="Critical" value={stockHealth.critical} total={stats.totalProducts} color="bg-amber-500" />
            <HealthBar label="Out of Stock" value={stockHealth.out_of_stock} total={stats.totalProducts} color="bg-rose-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card overflow-hidden border-white/10 flex flex-col">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-lg font-semibold text-slate-100">Recent Activity</h2>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-96">
            <table className="data-table w-full">
              <tbody>
                {recentActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          activity.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 
                          activity.type === 'out' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {activity.type === 'in' ? '+' : activity.type === 'out' ? '-' : '~'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {activity.type === 'in' ? 'Stock Added' : activity.type === 'out' ? 'Stock Removed' : 'Stock Adjusted'}
                            {' - '}{activity.product_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {activity.quantity} units by {activity.performed_by_name || 'System'} • {timeAgo(activity.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentActivity.length === 0 && (
                  <tr>
                    <td className="py-8 text-center text-slate-500 text-sm">No recent activity</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories */}
        <div className="glass-card p-5 border-white/10 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Top Categories</h2>
          <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="product_count" name="Products" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400">{value} <span className="text-xs">({percentage.toFixed(0)}%)</span></span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="w-48 h-8 skeleton mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 skeleton" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 skeleton" />
        <div className="h-80 skeleton" />
      </div>
    </div>
  );
}
