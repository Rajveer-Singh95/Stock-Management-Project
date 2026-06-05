'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { suppliersApi } from '@/lib/api';
import { Search, Plus, MapPin, Phone, Mail, Star, ExternalLink } from 'lucide-react';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersApi.getAll({ search }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Suppliers</h1>
          <p className="text-slate-400 text-sm">Manage your supplier directory and contacts.</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search suppliers by name, contact or email..."
          className="input-field pl-9 bg-white/5 border-white/10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 skeleton" />)}
        </div>
      ) : data?.suppliers?.length === 0 ? (
        <div className="text-center py-12 glass-card border-white/10">
          <p className="text-slate-400">No suppliers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.suppliers?.map(s => (
            <div key={s.id} className="glass-card-hover p-5 border-white/10 flex flex-col relative group">
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {s.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-100 pr-16">{s.name}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-400 mt-1 mb-4">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-medium text-slate-300">{s.rating}</span>
                <span className="mx-1">•</span>
                <span>{s.lead_time_days}d avg lead time</span>
              </div>

              <div className="space-y-2.5 flex-1 text-sm">
                <div className="flex items-start gap-2.5 text-slate-300">
                  <div className="p-1.5 rounded-lg bg-white/5 text-indigo-400 mt-0.5"><ExternalLink className="w-3.5 h-3.5" /></div>
                  <div>
                    <div className="font-medium">{s.contact_person}</div>
                    <div className="text-xs text-slate-500">Primary Contact</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="p-1.5 rounded-lg bg-white/5 text-slate-400"><Mail className="w-3.5 h-3.5" /></div>
                  <a href={`mailto:${s.email}`} className="hover:text-indigo-400 transition-colors">{s.email}</a>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="p-1.5 rounded-lg bg-white/5 text-slate-400"><Phone className="w-3.5 h-3.5" /></div>
                  <a href={`tel:${s.phone}`} className="hover:text-indigo-400 transition-colors">{s.phone || 'N/A'}</a>
                </div>
                <div className="flex items-start gap-2.5 text-slate-300">
                  <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 mt-0.5"><MapPin className="w-3.5 h-3.5" /></div>
                  <span className="text-xs leading-relaxed">{s.address || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-medium">
                <div className="text-slate-400">
                  <span className="text-indigo-300">{s.product_count}</span> Linked Products
                </div>
                {Number(s.open_orders) > 0 && (
                  <div className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                    {s.open_orders} Open Orders
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
