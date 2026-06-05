'use client';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { BarChart2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function ReportsPage() {
  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['reportForecast'],
    queryFn: () => reportsApi.getForecast().then(r => r.data),
  });

  const { data: valData, isLoading: valLoading } = useQuery({
    queryKey: ['reportInventoryValue'],
    queryFn: () => reportsApi.getInventoryValue().then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-indigo-400" />
          Analytics & Forecasting
        </h1>
        <p className="text-slate-400 text-sm">Demand forecasting and inventory valuation reports.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Value Summary */}
        <div className="glass-card p-5 border-white/10">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Inventory Valuation
          </h2>
          
          {valLoading ? <div className="h-40 skeleton" /> : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-sm text-emerald-400/80 mb-1">Total Cost Value</div>
                  <div className="text-2xl font-bold text-emerald-400">{formatCurrency(valData?.totals?.total_cost)}</div>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <div className="text-sm text-indigo-400/80 mb-1">Retail Potential</div>
                  <div className="text-2xl font-bold text-indigo-400">{formatCurrency(valData?.totals?.total_retail)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Value by Category</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={valData?.byCategory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} formatter={(val) => formatCurrency(val)} />
                      <Bar dataKey="total_cost_value" name="Cost Value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Demand Forecasting Highlights */}
        <div className="glass-card p-5 border-white/10 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Demand Forecasting (30 Days)
          </h2>
          
          <div className="flex-1 overflow-auto max-h-[400px]">
            {forecastLoading ? <div className="h-64 skeleton" /> : (
              <div className="space-y-4">
                {forecastData?.forecasts?.filter(f => f.forecast.avgDailyDemand > 0).sort((a,b) => b.forecast.avgDailyDemand - a.forecast.avgDailyDemand).slice(0, 10).map((item) => (
                  <div key={item.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-200 truncate">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Current Stock: {item.current_stock}</div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-cyan-400">
                        ~{item.forecast.forecastedDemand30d} units
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Predicted 30d demand</div>
                    </div>

                    <div className="w-16 flex items-center justify-end">
                      {item.forecast.trend === 'increasing' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : item.forecast.trend === 'decreasing' ? (
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                      ) : (
                        <div className="w-4 h-1 bg-slate-500 rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
