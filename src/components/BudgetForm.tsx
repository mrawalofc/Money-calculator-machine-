import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Plus, Trash2 } from 'lucide-react';
import { Category, CATEGORIES, Budget, CATEGORY_COLORS, Language, SUPPORTED_CURRENCIES } from '../types';
import { getTranslation } from '../translations';
import { CategoryIcon } from './CategoryIcon';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  onUpdateBudget: (budget: Budget) => void;
  onDeleteBudget: (category: Category) => void;
  language: Language;
  currencySymbol: string;
}

export const BudgetForm = ({ 
  isOpen, 
  onClose, 
  budgets, 
  onUpdateBudget, 
  onDeleteBudget, 
  language, 
  currencySymbol 
}: BudgetFormProps) => {
  const t = (key: any) => getTranslation(language, key);
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [currency, setCurrency] = useState(SUPPORTED_CURRENCIES[0].code);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) return;

    onUpdateBudget({
      category: selectedCategory,
      limit: Number(limit),
      currency: currency,
      period: 'monthly'
    });
    setLimit('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#1C1C1E] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Target size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-medium text-white">{t('budgets')}</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">{t('setBudget')}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/30 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 mb-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Category</label>
                    <div className="relative flex items-center">
                      <div 
                        className="absolute left-3 w-6 h-6 rounded-lg flex items-center justify-center pointer-events-none"
                        style={{ backgroundColor: `${CATEGORY_COLORS[selectedCategory]}20`, color: CATEGORY_COLORS[selectedCategory] }}
                      >
                        <CategoryIcon category={selectedCategory} size={14} />
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as Category)}
                        className="glass-input w-full appearance-none pl-11 pr-8 text-xs"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className="bg-[#1C1C1E]">{cat}</option>
                        ) )}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="glass-input w-full text-xs"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code} className="bg-[#1C1C1E] font-sans">{curr.code}</option>
                      ) )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">{t('budgetLimit')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">
                        {SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol}
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        className="glass-input w-full pl-9 text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  <Plus size={16} />
                  {t('setBudget')}
                </button>
              </form>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {budgets.length === 0 ? (
                  <p className="text-[10px] text-white/20 text-center py-8">{t('noBudgets')}</p>
                ) : (
                  budgets.map((budget) => (
                    <div key={budget.category} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[budget.category]}20`, color: CATEGORY_COLORS[budget.category] }}>
                           <CategoryIcon category={budget.category} size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{budget.category}</p>
                          <p className="text-[10px] text-white/40">
                             {SUPPORTED_CURRENCIES.find(c => c.code === (budget.currency || 'USD'))?.symbol}
                             {budget.limit.toLocaleString()} / month
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onDeleteBudget(budget.category)}
                        className="p-2 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
