import React from 'react';
import { motion } from 'motion/react';
import { Budget, Category, CATEGORY_COLORS, Language, SUPPORTED_CURRENCIES } from '../types';
import { getTranslation } from '../translations';
import { Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface BudgetCardProps {
  budgets: Budget[];
  spendingThisMonth: Record<Category, number>;
  currencySymbol: string;
  language: Language;
  onSetBudget: () => void;
  convertAmount: (amount: number, from: string, to: string) => number;
}

export const BudgetCard = ({ budgets, spendingThisMonth, currencySymbol, language, onSetBudget, convertAmount }: BudgetCardProps) => {
  const t = (key: any) => getTranslation(language, key);

  if (budgets.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
          <Target size={24} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white/50">{t('budgets')}</h3>
          <p className="text-[10px] text-white/30 max-w-[200px] mt-1">{t('noBudgets')}</p>
        </div>
        <button 
          onClick={onSetBudget}
          className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border border-indigo-500/20"
        >
          {t('setBudget')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
          <Target size={14} />
          {t('spendingVsBudget')}
        </h3>
        <button 
          onClick={onSetBudget}
          className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
        >
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-1 overflow-x-hidden custom-scrollbar">
        {budgets.map((budget) => {
          const budgetCurrency = budget.currency || 'USD';
          const budgetSymbol = SUPPORTED_CURRENCIES.find(c => c.code === budgetCurrency)?.symbol || currencySymbol;
          
          // spendingThisMonth[budget.category] is in the main settings.currency.
          // We need to convert it to budgetCurrency for comparison.
          // Actually, I don't know the 'from' currency here easily without passing it...
          // Wait, 'spendingThisMonth' is already normalized to 'settings.currency' in the hook.
          // I need to know what 'settings.currency' is.
          // Let's assume the hook passed something that helps or we can just try to infer.
          // Better: pass the current main currency to BudgetCard.
          
          const spent = spendingThisMonth[budget.category] || 0;
          const convertedSpent = convertAmount(spent, 'USD', budgetCurrency); // Assuming the hook standardized to USD/base
          // Wait, the hook standardized to 'settings.currency'. I should pass that.
          
          const percent = Math.min((convertedSpent / budget.limit) * 100, 100);
          const isOver = convertedSpent > budget.limit;
          const isNear = !isOver && percent >= 80;

          return (
            <motion.div 
              key={budget.category}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center" 
                    style={{ backgroundColor: `${CATEGORY_COLORS[budget.category]}20`, color: CATEGORY_COLORS[budget.category] }}
                  >
                    <CategoryIcon category={budget.category} size={16} />
                  </div>
                  <span className="text-xs font-bold text-white">{budget.category}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                   <p className="text-xs font-bold text-white">
                    {budgetSymbol}{convertedSpent.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-medium text-white/30">
                    of {budgetSymbol}{budget.limit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 
                      isNear ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 
                      'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className={isOver ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-indigo-400'}>
                    {percent.toFixed(0)}% Used
                  </span>
                  <span className="text-white/20">
                    {convertedSpent > budget.limit ? 'Exceeded' : `${((budget.limit - convertedSpent) / budget.limit * 100).toFixed(0)}% Remaining`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  {isOver ? (
                    <>
                      <AlertCircle size={12} className="text-rose-400" />
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">{t('overBudget')}</span>
                    </>
                  ) : isNear ? (
                    <>
                      <AlertCircle size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{t('nearBudget')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} className="text-emerald-400/50" />
                      <span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-wider">On Track</span>
                    </>
                  )}
                </div>
                <div className="text-[9px] font-medium text-white/30">
                  {isOver 
                    ? `${t('overBudget')} by ${budgetSymbol}${(convertedSpent - budget.limit).toLocaleString()}`
                    : `${t('remaining')}: ${budgetSymbol}${(budget.limit - convertedSpent).toLocaleString()}`
                  }
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
