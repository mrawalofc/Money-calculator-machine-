import { motion } from 'motion/react';
import { CATEGORY_COLORS, CurrencyConfig, Category, SUPPORTED_CURRENCIES } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { History, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertCircle } from 'lucide-react';

interface BudgetHistoryCardProps {
  performance: any[];
  currencySymbol: string;
}

export const BudgetHistoryCard = ({ performance, currencySymbol }: BudgetHistoryCardProps) => {
  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {performance.map((month, idx) => {
        const isExceeded = month.totalSpent > month.totalLimit;
        const totalPercent = Math.min((month.totalSpent / month.totalLimit) * 100, 100);
        
        return (
          <motion.div 
            key={month.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{month.label}</h3>
                  <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Budget Overview</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  {isExceeded ? (
                    <AlertCircle size={14} className="text-rose-400" />
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isExceeded ? 'Budget Exceeded' : 'Under Limit'}
                  </span>
                </div>
                <p className="text-xs font-bold text-white">
                  {currencySymbol}{month.totalSpent.toLocaleString()} 
                  <span className="text-white/20 ml-1">/ {currencySymbol}{month.totalLimit.toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* Overall Month Progress */}
            <div className="space-y-2">
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${totalPercent}%` }}
                  className={`absolute top-0 left-0 h-full rounded-full ${
                    isExceeded ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest">
                <span>{totalPercent.toFixed(0)}% Overall Budget Cap</span>
                <span>{month.performance.length} Categories Tracked</span>
              </div>
            </div>

            {/* Category Breakdown for this month */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {month.performance.map((item: any) => (
                <div key={item.category} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${CATEGORY_COLORS[item.category as Category]}15`, color: CATEGORY_COLORS[item.category as Category] }}
                      >
                        <CategoryIcon category={item.category} size={12} />
                      </div>
                      <span className="text-[10px] font-bold text-white/80">{item.category}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${item.spent > item.limit ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {SUPPORTED_CURRENCIES.find(c => c.code === item.currency)?.symbol || currencySymbol}{item.spent.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                        item.spent > item.limit ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(item.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
