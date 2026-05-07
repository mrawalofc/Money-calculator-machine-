import React from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

interface BudgetHistoryCardProps {
  performance: any[];
  currencySymbol: string;
}

export const BudgetHistoryCard = ({ performance, currencySymbol }: BudgetHistoryCardProps) => {
  if (performance.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {performance.slice(1).map((month, idx) => (
        <GlassCard key={month.label} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-white/40 border border-white/10">
                <Calendar size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">{month.label}</h4>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Monthly Summary</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Total Spent</p>
                <p className="text-base font-bold text-white tracking-tight">{currencySymbol}{month.totalSpent.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Target</p>
                <p className="text-sm font-medium text-white/60 tabular-nums">{currencySymbol}{month.totalLimit.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Top Exceptions</p>
              {month.performance.map((item: any) => {
                const isOver = item.percent > 100;
                if (!isOver) return null;
                return (
                  <div key={item.category} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-rose-400" />
                      <span className="text-[11px] font-bold text-white/80">{item.category}</span>
                    </div>
                    <span className="text-[11px] font-bold text-rose-400">+{((item.percent - 100)).toFixed(0)}%</span>
                  </div>
                );
              })}
              {month.performance.every((item: any) => item.percent <= 100) && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span className="text-[11px] font-bold tracking-tight">On track in all categories</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};
