import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Save, Trash2, AlertCircle } from 'lucide-react';
import { Category, CATEGORIES, Budget, Language, SUPPORTED_CURRENCIES } from '../types';
import { getTranslation } from '../translations';
import { GlassCard } from './ui/GlassCard';

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
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [currency, setCurrency] = useState('USD');
  const t = (key: any) => getTranslation(language, key);

  // Load existing budget if category changes
  useEffect(() => {
    const existing = budgets.find(b => b.category === selectedCategory);
    if (existing) {
      setLimit(existing.limit.toString());
      setCurrency(existing.currency || 'USD');
    } else {
      setLimit('');
    }
  }, [selectedCategory, budgets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(limit);
    if (isNaN(limitNum) || limitNum <= 0) return;

    onUpdateBudget({
      category: selectedCategory,
      limit: limitNum,
      currency,
      period: 'monthly'
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[300] p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            <GlassCard className="p-8 bg-[#1C1C1E] border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('setBudget')}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Monthly Spending Goal</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 block">
                    {t('category')}
                  </label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as Category)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-[#1C1C1E]">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 block">
                      {t('amount')}
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 block">
                      Currency
                    </label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none cursor-pointer text-center font-bold"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code} className="bg-[#1C1C1E]">{curr.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {budgets.find(b => b.category === selectedCategory) && (
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                    <AlertCircle size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-300/60 leading-relaxed font-medium">
                      You already have a budget for this category. Saving will update the existing limit.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  {budgets.find(b => b.category === selectedCategory) && (
                    <button 
                      type="button"
                      onClick={() => {
                        onDeleteBudget(selectedCategory);
                        onClose();
                      }}
                      className="p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {t('saveChanges')}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
