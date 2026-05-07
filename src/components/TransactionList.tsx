import React, { useState } from 'react';
import { Transaction, CATEGORY_COLORS, Category, TransactionType, Language, SUPPORTED_CURRENCIES } from '../types';
import { getTranslation } from '../translations';
import { CategoryIcon } from './CategoryIcon';
import { 
  Trash2, 
  Pencil, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  Square, 
  CheckSquare,
  User,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onEdit?: (transaction: Transaction) => void;
  currencySymbol?: string;
  language?: Language;
  search: string;
  setSearch: (s: string) => void;
  filter: string;
  setFilter: (f: string) => void;
  showFilters?: boolean;
  setShowFilters?: (s: boolean) => void;
  startDate?: string;
  setStartDate?: (d: string) => void;
  endDate?: string;
  setEndDate?: (d: string) => void;
  personSearch: string;
  setPersonSearch: (s: string) => void;
  lastDeleted?: Transaction[] | null;
  onUndo?: () => void;
}

export const TransactionList = ({ 
  transactions, 
  onDelete, 
  onBulkDelete, 
  onEdit, 
  currencySymbol = '$', 
  language = 'en', 
  search, 
  setSearch, 
  filter, 
  setFilter,
  showFilters: showFiltersProp,
  setShowFilters: setShowFiltersProp,
  startDate = '',
  setStartDate,
  endDate = '',
  setEndDate,
  personSearch,
  setPersonSearch,
  lastDeleted,
  onUndo
}: TransactionListProps) => {
  const t = (key: any) => getTranslation(language, key);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localShowFilters, setLocalShowFilters] = useState(false);
  
  const showFilters = showFiltersProp !== undefined ? showFiltersProp : localShowFilters;
  const setShowFilters = setShowFiltersProp || setLocalShowFilters;
  
  const filtered = transactions.filter(t => {
    const matchesSearch = t.note.toLowerCase().includes(search.toLowerCase()) || 
                         t.category.toLowerCase().includes(search.toLowerCase()) ||
                         (t.personName && t.personName.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filter === 'all' || t.type === filter;
    const matchesPerson = !personSearch || (t.personName && t.personName.toLowerCase().includes(personSearch.toLowerCase()));
    const matchesStartDate = !startDate || t.date >= startDate;
    const matchesEndDate = !endDate || t.date <= endDate;
    return matchesSearch && matchesType && matchesPerson && matchesStartDate && matchesEndDate;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(t => t.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      onBulkDelete?.(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkEdit = () => {
    if (selectedIds.length === 1) {
      const transaction = transactions.find(t => t.id === selectedIds[0]);
      if (transaction) {
        onEdit?.(transaction);
        setSelectedIds([]);
      }
    }
  };

  const setQuickRange = (range: 'today' | '7days' | 'month') => {
    const now = new Date();
    const endStr = format(now, 'yyyy-MM-dd');
    let startStr = '';

    if (range === 'today') {
      startStr = endStr;
    } else if (range === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      startStr = format(sevenDaysAgo, 'yyyy-MM-dd');
    } else if (range === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startStr = format(monthStart, 'yyyy-MM-dd');
    }

    setStartDate?.(startStr);
    setEndDate?.(endStr);
  };

  const filteredTotal = filtered.reduce((acc, curr) => {
    if (curr.type === 'income' || curr.type === 'borrowed' || curr.type === 'lent_repayment') {
      return acc + curr.amount;
    }
    return acc - curr.amount;
  }, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-left">
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{filtered.length} {t('logs')}</p>
             <p className={`text-sm font-display font-bold ${filteredTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {filteredTotal >= 0 ? '+' : ''}{currencySymbol}{Math.abs(filteredTotal).toLocaleString()}
             </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg border transition-all ${showFilters || startDate || endDate || personSearch || filter !== 'all' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-white/20'}`}
            >
              <Filter size={16} />
            </button>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="glass-input text-[10px] uppercase font-bold tracking-widest py-1.5 px-2 border-white/10 min-w-[100px]"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
              <option value="lent">Lent</option>
              <option value="lent_repayment">Repayments</option>
              <option value="borrowed">Borrowed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleSelectAll}
              className={`p-2 rounded-xl border transition-all ${selectedIds.length > 0 ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-white/20'}`}
            >
              {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                {selectedIds.length === 1 && (
                  <button 
                    onClick={handleBulkEdit}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all inline-flex items-center gap-2"
                  >
                    <Pencil size={12} />
                    {t('rewrite')}
                  </button>
                )}
                <button 
                  onClick={handleBulkDelete}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all inline-flex items-center gap-2"
                >
                  <Trash2 size={12} />
                  {t('deleteSelected')}
                </button>
              </motion.div>
            )}
          </div>
          
          <div className="relative flex-1 max-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input 
              type="text"
              placeholder={t('search')}
              className="glass-input w-full pl-9 py-2 text-[10px] border-white/5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              {/* Quick Ranges */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Quick Ranges</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setQuickRange('today')}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {t('today')}
                  </button>
                  <button 
                    onClick={() => setQuickRange('7days')}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {t('last7Days')}
                  </button>
                  <button 
                    onClick={() => setQuickRange('month')}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {t('thisMonth')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">{t('personName')}</label>
                  <div className="relative">
                    <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      type="text"
                      placeholder="Filter by person..."
                      value={personSearch}
                      onChange={(e) => setPersonSearch(e.target.value)}
                      className="glass-input text-xs w-full pl-9 py-2 border-white/5"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">{t('startDate')}</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate?.(e.target.value)}
                    className="glass-input text-[11px] w-full py-2 px-3 border-white/5 [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">{t('endDate')}</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate?.(e.target.value)}
                    className="glass-input text-[11px] w-full py-2 px-3 border-white/5 [color-scheme:dark]"
                  />
                </div>
              </div>

              {(startDate || endDate || personSearch || filter !== 'all') && (
                <div className="flex justify-end pt-2 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setStartDate?.('');
                      setEndDate?.('');
                      setPersonSearch('');
                      setFilter('all');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                  >
                    <RotateCcw size={14} />
                    {t('clearFilters')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        <AnimatePresence>
          {lastDeleted && lastDeleted.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-indigo-500/20">
                     <Trash2 size={14} className="text-indigo-400" />
                   </div>
                   <div>
                     <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                       {lastDeleted.length === 1 
                         ? t('transactionDeleted') 
                         : t('bulkItemsDeleted').replace('{count}', lastDeleted.length.toString())}
                     </p>
                     <p className="text-[9px] text-white/40 font-medium uppercase tracking-[0.1em]">
                        {lastDeleted.length === 1 
                          ? `${lastDeleted[0].category} • ${currencySymbol}${lastDeleted[0].amount.toLocaleString()}` 
                          : `${lastDeleted.length} items removed`}
                     </p>
                   </div>
                </div>
                <button 
                  onClick={onUndo}
                  className="bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest active:scale-95 shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {t('undo')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {filtered.map((transaction) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={transaction.id}
              className="relative overflow-hidden rounded-[20px]"
            >
              {/* Swipe Background Actions */}
              <div className="absolute inset-0 flex justify-between items-center px-6">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest">
                  <Trash2 size={16} />
                  <span>{t('delete')}</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                  <span>{t('rewrite')}</span>
                  <Pencil size={16} />
                </div>
              </div>

              <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                dragElastic={0.1}
                dragSnapToOrigin
                onDragEnd={(_, info) => {
                  if (info.offset.x > 80) {
                    onDelete(transaction.id);
                  } else if (info.offset.x < -80) {
                    onEdit?.(transaction);
                  }
                }}
                onClick={() => toggleSelect(transaction.id)}
                className={`relative z-10 group flex items-center justify-between p-4 bg-[#121214] hover:bg-white/[0.05] rounded-[20px] transition-all duration-300 border ${selectedIds.includes(transaction.id) ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/[0.03]'} cursor-pointer active:scale-[0.98] select-none`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-inner"
                      style={{ backgroundColor: `${CATEGORY_COLORS[transaction.category]}10`, color: CATEGORY_COLORS[transaction.category] }}
                    >
                      <CategoryIcon category={transaction.category} type={transaction.type} />
                    </div>
                    {selectedIds.includes(transaction.id) && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-indigo-500 text-white w-5 h-5 rounded-lg flex items-center justify-center shadow-lg border-2 border-[#121214]"
                      >
                        <Check size={12} strokeWidth={4} />
                      </motion.div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <div 
                         className="w-4 h-4 rounded-md flex items-center justify-center"
                         style={{ backgroundColor: `${CATEGORY_COLORS[transaction.category]}15`, color: CATEGORY_COLORS[transaction.category] }}
                       >
                         <CategoryIcon category={transaction.category} type={transaction.type} size={10} />
                       </div>
                       <h4 className="font-semibold text-slate-100 text-sm tracking-tight">{transaction.category}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/20">{format(new Date(transaction.date), 'MMM dd')}</span>
                      {transaction.personName && (
                        <>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span className="text-[10px] font-medium text-indigo-400 truncate max-w-[100px]">{transaction.personName}</span>
                        </>
                      )}
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="text-[10px] font-medium text-white/40 truncate max-w-[120px]">{transaction.note || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`font-display font-semibold text-base tracking-tight ${
                    (transaction.type === 'income' || transaction.type === 'borrowed' || transaction.type === 'lent_repayment') ? 'text-emerald-400' : 
                    (transaction.type === 'lent' || transaction.type === 'expense' || transaction.type === 'borrowed_repayment') ? 'text-rose-400' : 'text-slate-100'
                  }`}>
                    {(transaction.type === 'income' || transaction.type === 'borrowed' || transaction.type === 'lent_repayment') ? '+' : '-'}
                    {SUPPORTED_CURRENCIES.find(c => c.code === transaction.currency)?.symbol || currencySymbol}
                    {transaction.amount.toLocaleString()}
                  </span>
                  <div className="w-6 flex items-center justify-center">
                     <div className={`w-2 h-2 rounded-full transition-all ${selectedIds.includes(transaction.id) ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] scale-125' : 'bg-white/5'}`} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <Filter size={48} className="mx-auto mb-4 opacity-50" />
            <p>{language === 'bn' ? 'কোন লেনদেন পাওয়া যায়নি' : 'No transactions found'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
