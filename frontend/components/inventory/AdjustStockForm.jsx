'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export default function AdjustStockForm({ product, onSuccess }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { type: 'in', quantity: '', reference: '', notes: '' }
  });

  const type = watch('type');
  const qty = Number(watch('quantity')) || 0;
  
  let newStock = product?.current_stock || 0;
  if (type === 'in') newStock += qty;
  if (type === 'out') newStock -= qty;
  if (type === 'adjustment') newStock = qty;

  const mutation = useMutation({
    mutationFn: (data) => productsApi.adjustStock(product.id, data),
    onSuccess: () => {
      toast('Stock adjusted successfully', 'success');
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardStats']);
      onSuccess();
    },
    onError: (err) => {
      toast(err.response?.data?.error || 'Failed to adjust stock', 'error');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate({ ...data, quantity: Number(data.quantity) });
  };

  if (!product) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between mb-4 border border-white/5">
        <div>
          <div className="text-sm text-slate-400">Current Stock</div>
          <div className="text-xl font-bold text-slate-100">{product.current_stock} <span className="text-sm font-normal text-slate-500">{product.unit}</span></div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">New Stock</div>
          <div className={`text-xl font-bold ${newStock < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {newStock} <span className="text-sm font-normal text-slate-500">{product.unit}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Adjustment Type</label>
          <select {...register('type')} className="select-field">
            <option value="in">Add Stock (In)</option>
            <option value="out">Remove Stock (Out)</option>
            <option value="adjustment">Set Exact Stock (Audit)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Quantity</label>
          <input 
            type="number" 
            {...register('quantity', { 
              required: 'Quantity is required',
              min: { value: 0, message: 'Must be positive' },
              validate: v => type !== 'out' || Number(v) <= product.current_stock || 'Exceeds current stock'
            })} 
            className="input-field" 
          />
          {errors.quantity && <span className="text-xs text-rose-400 mt-1">{errors.quantity.message}</span>}
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Reference (Optional)</label>
        <input {...register('reference')} className="input-field" placeholder="e.g. PO-1234, Audit-Oct" />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Notes</label>
        <textarea {...register('notes')} className="input-field min-h-[80px]" placeholder="Reason for adjustment..." />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
        <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={mutation.isPending || newStock < 0} className="btn-primary">
          {mutation.isPending ? 'Saving...' : 'Confirm Adjustment'}
        </button>
      </div>
    </form>
  );
}
