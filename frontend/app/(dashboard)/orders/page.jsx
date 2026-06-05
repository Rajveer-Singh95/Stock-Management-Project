'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { Plus, Search, Filter, ShoppingCart, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate, getOrderStatusBadge } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: () => ordersApi.getAll({ page, limit: 15, status: statusFilter }).then(r => r.data),
    keepPreviousData: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      toast('Order status updated', 'success');
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['dashboardStats']);
    },
    onError: (err) => toast(err.response?.data?.error || 'Update failed', 'error'),
  });

  function handleReceive(order) {
    if (confirm(`Mark ${order.po_number} as RECEIVED? This will automatically update product stock levels.`)) {
      updateStatusMutation.mutate({ id: order.id, status: 'received' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Purchase Orders</h1>
          <p className="text-slate-400 text-sm">Manage orders, track incoming stock, and receive deliveries.</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      <div className="glass-card border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4">
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select 
              className="select-field pl-9"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Date / Expected</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">Loading orders...</td></tr>
              ) : data?.orders?.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">No orders found</td></tr>
              ) : (
                data?.orders?.map((o) => {
                  const status = getOrderStatusBadge(o.status);
                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="font-medium text-slate-200 flex items-center gap-2">
                          <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                          {o.po_number}
                        </div>
                        <div className="text-xs text-slate-500">{o.item_count} items • By {o.created_by_name}</div>
                      </td>
                      <td>
                        <div className="font-medium text-indigo-300">{o.supplier_name}</div>
                      </td>
                      <td>
                        <div className="text-sm text-slate-300">{formatDate(o.order_date)}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {o.expected_date ? formatDate(o.expected_date) : 'N/A'}
                        </div>
                      </td>
                      <td className="font-medium">{formatCurrency(o.total_amount)}</td>
                      <td>
                        <span className={`badge-${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          {o.status !== 'received' && o.status !== 'cancelled' && (
                            <button onClick={() => handleReceive(o)} className="btn-secondary py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Receive
                            </button>
                          )}
                          <button className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
