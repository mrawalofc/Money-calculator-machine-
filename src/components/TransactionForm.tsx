import React, { useState, useEffect } from 'react';
import { TransactionType, Category, CATEGORIES, Transaction, Language } from '../types';
import { getTranslation } from '../translations';
import { GlassCard } from './ui/GlassCard';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { CategoryIcon } from './CategoryIcon';
import { CATEGORY_COLORS, SUPPORTED_CURRENCIES } from '../types';

export interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    amount: number;
    currency?: string;
    type: TransactionType;
    category: Category;
    personName?: string;
    date: string;
    note: string;
  }) => void;
  onUpdate?: (id: string, data: Partial<Transaction>) => void;
  onDelete?: (id: string) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
  currencySymbol?: string;
  language?: Language;
  prefilledData?: any;
}

export const TransactionForm = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  onUpdate, 
  onDelete, 
  editingTransaction, 
  onCancelEdit, 
  currencySymbol = '$', 
  language = 'en',
  prefilledData
}: TransactionFormProps) => {
  const t = (key: any) => getTranslation(language, key);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(SUPPORTED_CURRENCIES.find(c => c.symbol === currencySymbol)?.code || 'USD');
  const [personName, setPersonName] = useState('');
  const [category, setCategory] = useState<Category>('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCurrency(editingTransaction.currency || 'USD');
      setPersonName(editingTransaction.personName || '');
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note);
      setErrors({});
    } else if (isOpen) {
      // Reset to defaults when opening for a new transaction
      setType('expense');
      setAmount('');
      setPersonName('');
      setCategory('Food & Dining');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setErrors({});
    }
    
    if (prefilledData && isOpen && !editingTransaction) {
      if (prefilledData.type) setType(prefilledData.type);
      if (prefilledData.amount) setAmount(String(prefilledData.amount));
      if (prefilledData.currency) setCurrency(prefilledData.currency);
      if (prefilledData.personName) setPersonName(prefilledData.personName);
      if (prefilledData.category) setCategory(prefilledData.category);
    }
  }, [editingTransaction, isOpen, prefilledData]);

  const handleClose = () => {
    setErrors({});
    onClose();
    onCancelEdit?.();
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!amount) {
      newErrors.amount = t('errAmountRequired');
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = t('errAmountInvalid');
    }

    if ((type === 'lent' || type === 'borrowed' || type === 'lent_repayment' || type === 'borrowed_repayment') && !personName.trim()) {
      newErrors.personName = t('errPersonRequired');
    }

    if (!date) {
      newErrors.date = t('errDateRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      amount: Math.abs(Number(amount)),
      currency,
      type,
      category,
      personName: personName.trim() || undefined,
      date,
      note
    };

    if (editingTransaction && onUpdate) {
      onUpdate(editingTransaction.id, data);
    } else {
      onAdd(data);
    }

    handleClose();
  };

  const handleSaveAsNew = () => {
    if (!validate()) return;
    const data = {
      amount: Math.abs(Number(amount)),
      currency,
      type,
      category,
      personName: personName.trim() || undefined,
      date,
      note
    };
    onAdd(data);
    handleClose();
  };

  const handleDelete = () => {
    if (editingTransaction && onDelete) {
      onDelete(editingTransaction.id);
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 1.02, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: 10 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg z-50 focus:outline-none max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl"
          >
              <GlassCard className="p-8 sm:p-10 border-white/10 bg-[#1C1C1E] shadow-[0_32px_64px_rgba(0,0,0,0.8)]">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-display font-semibold tracking-tight">
                    {editingTransaction ? 'Edit Entry' : 'New Entry'}
                  </h2>
                  <button onClick={handleClose} className="text-white/20 hover:text-white transition-colors p-2 -mr-2 bg-white/5 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-3 p-1.5 bg-black/40 rounded-2xl border border-white/5 gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setType('expense'); setCategory('Food & Dining'); }}
                      className={activeTabStyle(type === 'expense', 'rose')}
                    >
                      {t('expense')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('income'); setCategory('Salary'); }}
                      className={activeTabStyle(type === 'income', 'emerald')}
                    >
                      {t('income')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('lent'); setCategory('Lending'); }}
                      className={activeTabStyle(type === 'lent', 'orange')}
                    >
                      {t('lent')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('lent_repayment'); setCategory('Lending'); }}
                      className={activeTabStyle(type === 'lent_repayment', 'emerald')}
                    >
                      {t('lentRepayment' as any)}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('borrowed'); setCategory('Borrowing'); }}
                      className={activeTabStyle(type === 'borrowed', 'cyan')}
                    >
                      {t('borrowed')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('borrowed_repayment'); setCategory('Borrowing'); }}
                      className={activeTabStyle(type === 'borrowed_repayment', 'rose')}
                    >
                      {t('borrowedRepayment' as any)}
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="text-center py-4 relative">
                      <label className="text-[11px] font-bold text-white/30 mb-2 block uppercase tracking-widest">{t('amount')}</label>
                      <div className="relative flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center gap-3">
                           <select 
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="bg-white/5 border border-white/5 text-[10px] font-bold rounded-lg px-2 py-1 outline-none appearance-none hover:bg-white/10 transition-colors"
                          >
                            {SUPPORTED_CURRENCIES.map(c => (
                              <option key={c.code} value={c.code} className="bg-[#1C1C1E]">{c.code}</option>
                            ))}
                          </select>
                          <div className="flex items-center">
                            <span className="text-2xl font-display font-medium text-white/20 mr-2">
                              {SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol}
                            </span>
                            <input
                              autoFocus
                              required
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={amount}
                              onChange={(e) => {
                                setAmount(e.target.value);
                                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                              }}
                              className={`bg-transparent text-5xl font-display font-medium outline-none placeholder:text-white/5 w-auto max-w-[200px] text-center transition-colors ${errors.amount ? 'text-rose-400' : 'text-white'}`}
                            />
                          </div>
                        </div>
                        {errors.amount && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] font-bold text-rose-400 mt-2 uppercase tracking-wider"
                          >
                            {errors.amount}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    {(type === 'lent' || type === 'borrowed' || type === 'lent_repayment' || type === 'borrowed_repayment') && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-white/30 block uppercase tracking-widest">{t('personName')}</label>
                        <input
                          placeholder={language === 'bn' ? 'ব্যক্তি বা প্রতিষ্ঠানের নাম' : "Name of person or entity"}
                          value={personName}
                          onChange={(e) => {
                            setPersonName(e.target.value);
                            if (errors.personName) setErrors(prev => ({ ...prev, personName: '' }));
                          }}
                          className={`glass-input w-full ${errors.personName ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
                        />
                        {errors.personName && (
                          <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest pl-1">{errors.personName}</p>
                        )}
                      </div>
                    )}

                      <div className="space-y-4">
                        <label className="text-[11px] font-bold text-white/30 block uppercase tracking-widest">{t('category')}</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar p-1">
                          {CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategory(cat)}
                              className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all gap-1.5 ${
                                category === cat 
                                  ? 'bg-white/10 border-white/20 scale-[0.98]' 
                                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div 
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform ${category === cat ? 'scale-110' : ''}`}
                                style={{ 
                                  backgroundColor: category === cat ? CATEGORY_COLORS[cat] : `${CATEGORY_COLORS[cat]}15`,
                                  color: category === cat ? 'white' : CATEGORY_COLORS[cat]
                                }}
                              >
                                <CategoryIcon category={cat} type={type} size={18} />
                              </div>
                              <span className={`text-[9px] font-bold text-center leading-tight transition-colors ${category === cat ? 'text-white' : 'text-white/30'}`}>
                                {cat}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pb-2">
                        <label className="text-[11px] font-bold text-white/30 block uppercase tracking-widest">{t('date')}</label>
                        <input
                          required
                          type="date"
                          value={date}
                          onChange={(e) => {
                            setDate(e.target.value);
                            if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                          }}
                          className={`glass-input w-full [color-scheme:dark] ${errors.date ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
                        />
                        {errors.date && (
                          <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest pl-1">{errors.date}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-white/30 block uppercase tracking-widest">{t('note')}</label>
                        <input
                          placeholder={language === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : "Description (optional)"}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="glass-input w-full"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                      <button type="submit" className="glass-button w-full py-4 text-sm font-bold uppercase tracking-widest">
                        {editingTransaction ? t('updateTransaction') : t('addTransaction')}
                      </button>
                      
                      {editingTransaction && (
                        <div className="flex gap-3">
                          <button 
                            type="button" 
                            onClick={handleSaveAsNew}
                            className="glass-button-ghost flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border-white/5"
                          >
                            Add as New
                          </button>
                          <button 
                            type="button" 
                            onClick={handleDelete}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                </form>
              </GlassCard>
            </motion.div>
          </>
        )}
    </AnimatePresence>
  );
};

const activeTabStyle = (active: boolean, color: 'rose' | 'emerald' | 'orange' | 'cyan') => {
  const activeClasses = 
    color === 'rose' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 
    color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
    color === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20';
  
  return `flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
    active ? activeClasses : 'text-white/40 border border-transparent'
  }`;
};
