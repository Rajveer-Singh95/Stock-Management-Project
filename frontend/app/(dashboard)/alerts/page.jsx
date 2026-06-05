'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import { Bell, CheckCircle2, XCircle, AlertTriangle, AlertOctagon, Package } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.getAll().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: summary } = useQuery({
    queryKey: ['alertSummary'],
    queryFn: () => alertsApi.getSummary().then(r => r.data.summary),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => alertsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['alertSummary']);
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => alertsApi.dismiss(id),
    onSuccess: () => {
      toast('Alert dismissed');
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['alertSummary']);
      queryClient.invalidateQueries(['dashboardStats']);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => {
      toast('All alerts marked as read');
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['alertSummary']);
    }
  });

  const alerts = alertsData?.alerts || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Bell className="w-6 h-6 text-indigo-400" />
            System Alerts
          </h1>
          <p className="text-slate-400 text-sm">Monitor low stock warnings and system notifications.</p>
        </div>
        {summary?.unread > 0 && (
          <button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} className="btn-secondary text-xs py-1.5">
            <CheckCircle2 className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 border-l-4 border-l-indigo-500">
          <div className="text-sm text-slate-400">Total Active</div>
          <div className="text-2xl font-bold text-slate-100">{summary?.total || 0}</div>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-amber-500">
          <div className="text-sm text-slate-400">Warnings</div>
          <div className="text-2xl font-bold text-amber-400">{summary?.warning || 0}</div>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-rose-500">
          <div className="text-sm text-slate-400">Critical</div>
          <div className="text-2xl font-bold text-rose-400">{summary?.critical || 0}</div>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-24 skeleton" />)
        ) : alerts.length === 0 ? (
          <div className="glass-card p-12 text-center border-white/10 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-3" />
            <h3 className="text-lg font-medium text-slate-200">All caught up!</h3>
            <p className="text-slate-400">There are no active alerts at the moment.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`glass-card p-4 flex gap-4 transition-all ${
              !alert.is_read ? 'border-indigo-500/30 bg-indigo-500/5 shadow-lg shadow-indigo-500/5' : 'border-white/5 opacity-70 hover:opacity-100'
            }`}>
              <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {alert.severity === 'critical' ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className={`text-sm font-medium ${!alert.is_read ? 'text-slate-100' : 'text-slate-300'}`}>
                      {alert.message}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {alert.sku}</span>
                      <span>•</span>
                      <span>{timeAgo(alert.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!alert.is_read && (
                      <button onClick={() => markReadMutation.mutate(alert.id)} className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg transition-all" title="Mark as read">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => dismissMutation.mutate(alert.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all" title="Dismiss alert">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stock context bar */}
                {alert.current_stock !== undefined && (
                  <div className="mt-3 bg-slate-900/50 rounded-lg p-2 flex items-center gap-4 border border-white/5">
                    <div className="text-xs">
                      <span className="text-slate-500">Current Stock:</span> <span className={`font-bold ${alert.current_stock === 0 ? 'text-rose-400' : 'text-amber-400'}`}>{alert.current_stock}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Min Level:</span> <span className="font-bold text-slate-300">{alert.min_stock_level}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
