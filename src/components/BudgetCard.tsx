import React from 'react';
import { motion } from 'motion/react';
import { Target, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { Budget, Category, Language, SUPPORTED_CURRENCIES } from '../types';
import { getTranslation } from '../translations';
import { GlassCard } from './ui/GlassCard';

interface BudgetCardProps {
  budgets: Budget[];
  spendingThisMonth: Record<Category, number>;
  currencySymbol: string;
  language: Language;
  convertAmount: (amount: number, from: string, to: string) => number;
  onSetBudget: () => void;
}

export const BudgetCard = ({ 
  budgets, 
  spendingThisMonth, 
  currencySymbol, 
  language,
  convertAmount,
  onSetBudget
}: BudgetCardProps) => {
  const t = (key: any) => getTranslation(language, key);

  if (budgets.length === 0) {
    return (
      <GlassCard className="p-10 text-center flex flex-col items-center justify-center gap-6 border-dashed border-white/10 bg-white/[0.02]">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <Target size={32} />
        </div>
        <div className="max-w-xs">
          <h3 className="text-xl font-bold text-white mb-2">{t('noData')}</h3>
          <p className="text-sm text-white/40 leading-relaxed font-medium">Set monthly spending limits for each category to keep your finances under control.</p>
        </div>
        <button 
          onClick={onSetBudget}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={20} />
          {t('setBudget')}
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {budgets.map((budget, index) => {
        const spent = spendingThisMonth[budget.category] || 0;
        const budgetCurrency = budget.currency || 'USD';
        const spentInBudgetCurrency = convertAmount(spent, SUPPORTED_CURRENCIES[0].code, budgetCurrency);
        const percent = (spentInBudgetCurrency / budget.limit) * 100;
        const isOver = percent > 100;
        const isNear = percent > 85;

        return (
          <GlassCard key={budget.category} className="p-6 group relative overflow-hidden">
            <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl opacity-10 transition-colors duration-500 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`} />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${isOver ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10'}`}>
                  <Target size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{budget.category}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Target: {budget.limit.toLocaleString()} {budgetCurrency}</p>
                </div>
              </div>
              {isOver && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest border border-rose-500/20 animate-pulse">
                  <AlertTriangle size={12} />
                  Exceeded
                </div>
              )}
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                  <span className="text-lg opacity-40 font-medium mr-1">{budgetCurrency}</span>
                  {spentInBudgetCurrency.toLocaleString()}
                </div>
                <div className={`text-xs font-bold ${isOver ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-indigo-400/60'}`}>
                  {percent.toFixed(0)}%
                </div>
              </div>
              
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percent, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                  className={`h-full rounded-full ${isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]'}`}
                />
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
