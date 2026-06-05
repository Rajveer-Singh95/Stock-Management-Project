'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { productsApi, suppliersApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export default function ProductForm({ product, onSuccess }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: () => productsApi.getCategories().then(r => r.data) });
  const { data: suppliersData } = useQuery({ queryKey: ['suppliersList'], queryFn: () => suppliersApi.getAll().then(r => r.data) });

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku, name: product.name, description: product.description,
        category_id: product.category_id || '', supplier_id: product.supplier_id || '',
        unit_price: product.unit_price, cost_price: product.cost_price,
        current_stock: product.current_stock, min_stock_level: product.min_stock_level,
        max_stock_level: product.max_stock_level, reorder_quantity: product.reorder_quantity,
        unit: product.unit, location: product.location, status: product.status || 'active'
      });
    } else {
      reset({ status: 'active', current_stock: 0, min_stock_level: 10, max_stock_level: 1000, reorder_quantity: 50, unit: 'units' });
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: (data) => product ? productsApi.update(product.id, data) : productsApi.create(data),
    onSuccess: () => {
      toast(`Product ${product ? 'updated' : 'created'} successfully`, 'success');
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardStats']);
      onSuccess();
    },
    onError: (err) => {
      toast(err.response?.data?.error || 'Operation failed', 'error');
    }
  });

  const onSubmit = (data) => {
    // ensure numeric fields are converted
    const payload = { ...data };
    ['unit_price', 'cost_price', 'current_stock', 'min_stock_level', 'max_stock_level', 'reorder_quantity'].forEach(f => {
      if (payload[f]) payload[f] = Number(payload[f]);
    });
    // convert empty strings to null for fks
    if (!payload.category_id) payload.category_id = null;
    if (!payload.supplier_id) payload.supplier_id = null;
    
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">SKU *</label>
          <input {...register('sku', { required: 'SKU required' })} className="input-field" disabled={!!product} placeholder="E.g. PRD-001" />
          {errors.sku && <span className="text-xs text-rose-400 mt-1">{errors.sku.message}</span>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Product Name *</label>
          <input {...register('name', { required: 'Name required' })} className="input-field" />
          {errors.name && <span className="text-xs text-rose-400 mt-1">{errors.name.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Category</label>
          <select {...register('category_id')} className="select-field">
            <option value="">Select Category...</option>
            {categoriesData?.categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Preferred Supplier</label>
          <select {...register('supplier_id')} className="select-field">
            <option value="">Select Supplier...</option>
            {suppliersData?.suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Cost Price ($)</label>
          <input type="number" step="0.01" {...register('cost_price')} className="input-field" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Selling Price ($)</label>
          <input type="number" step="0.01" {...register('unit_price')} className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {!product && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Initial Stock</label>
            <input type="number" {...register('current_stock')} className="input-field" />
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Min Stock (Alert)</label>
          <input type="number" {...register('min_stock_level')} className="input-field" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Reorder Qty</label>
          <input type="number" {...register('reorder_quantity')} className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Unit Type</label>
          <input {...register('unit')} className="input-field" placeholder="e.g. units, kg, boxes" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Warehouse Location</label>
          <input {...register('location')} className="input-field" placeholder="e.g. Aisle 4, Shelf B" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Description</label>
        <textarea {...register('description')} className="input-field min-h-[80px]" />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
        <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
