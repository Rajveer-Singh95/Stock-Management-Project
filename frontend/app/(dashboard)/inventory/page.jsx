'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { Plus, Search, Filter, Edit, PackageMinus, PackagePlus, Trash2 } from 'lucide-react';
import { formatCurrency, getStockStatus } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import ProductForm from '@/components/inventory/ProductForm';
import AdjustStockForm from '@/components/inventory/AdjustStockForm';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, stockStatusFilter],
    queryFn: () => productsApi.getAll({ page, limit: 15, search, stockStatus: stockStatusFilter }).then(r => r.data),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess: () => {
      toast('Product deleted', 'success');
      queryClient.invalidateQueries(['products']);
    },
    onError: () => toast('Failed to delete product', 'error'),
  });

  function handleEdit(product) {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  }

  function handleAdjustStock(product) {
    setEditingProduct(product);
    setIsAdjustModalOpen(true);
  }

  function closeModals() {
    setIsProductModalOpen(false);
    setIsAdjustModalOpen(false);
    setTimeout(() => setEditingProduct(null), 300); // clear after animation
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Inventory</h1>
          <p className="text-slate-400 text-sm">Manage your product catalog and stock levels.</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="glass-card border-white/10 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select 
                className="select-field pl-9"
                value={stockStatusFilter}
                onChange={(e) => { setStockStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Stock Status</option>
                <option value="healthy">Healthy</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">Loading products...</td></tr>
              ) : data?.products?.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">No products found</td></tr>
              ) : (
                data?.products?.map((p) => {
                  const status = getStockStatus(p.current_stock, p.min_stock_level);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="font-medium text-slate-200">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.sku}</div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                          style={{ backgroundColor: `${p.category_color}20`, color: p.category_color || '#a78bfa' }}>
                          {p.category_name || 'Uncategorized'}
                        </span>
                      </td>
                      <td>{formatCurrency(p.unit_price)}</td>
                      <td>
                        <div className="font-medium text-slate-200">{p.current_stock} <span className="text-slate-500 text-xs font-normal">{p.unit}</span></div>
                      </td>
                      <td>
                        <span className={`badge-${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleAdjustStock(p)} className="p-1.5 text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 rounded-lg transition-all" title="Adjust Stock">
                            <PackagePlus className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-cyan-400 bg-white/5 hover:bg-cyan-500/10 rounded-lg transition-all" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { if(confirm('Are you sure you want to delete this product?')) deleteMutation.mutate(p.id) }} 
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm">
            <div className="text-slate-400">
              Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total}
            </div>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50">Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isProductModalOpen} onClose={closeModals} title={editingProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <ProductForm product={editingProduct} onSuccess={closeModals} />
      </Modal>

      <Modal isOpen={isAdjustModalOpen} onClose={closeModals} title={`Adjust Stock: ${editingProduct?.name}`}>
        <AdjustStockForm product={editingProduct} onSuccess={closeModals} />
      </Modal>
    </div>
  );
}
