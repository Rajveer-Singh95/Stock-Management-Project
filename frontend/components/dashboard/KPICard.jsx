'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({ title, value, subtitle, icon: Icon, color = 'indigo', trend, trendLabel }) {
  const colorMap = {
    indigo: { bg: 'from-indigo-500/20 to-indigo-600/10', icon: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'glow-indigo' },
    cyan: { bg: 'from-cyan-500/20 to-cyan-600/10', icon: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'glow-cyan' },
    emerald: { bg: 'from-emerald-500/20 to-emerald-600/10', icon: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'glow-emerald' },
    amber: { bg: 'from-amber-500/20 to-amber-600/10', icon: 'text-amber-400', border: 'border-amber-500/20', glow: 'glow-amber' },
    rose: { bg: 'from-rose-500/20 to-rose-600/10', icon: 'text-rose-400', border: 'border-rose-500/20', glow: 'glow-rose' },
    violet: { bg: 'from-violet-500/20 to-violet-600/10', icon: 'text-violet-400', border: 'border-violet-500/20', glow: 'glow-indigo' },
  };

  const c = colorMap[color] || colorMap.indigo;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-500';

  return (
    <div className={`relative overflow-hidden glass-card-hover p-5 border ${c.border} ${c.glow} animate-fade-in`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} opacity-50`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center border ${c.border}`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendLabel}</span>
            </div>
          )}
        </div>

        <div className="space-y-0.5">
          <div className="text-2xl font-bold text-slate-100">{value}</div>
          <div className="text-sm font-medium text-slate-300">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
