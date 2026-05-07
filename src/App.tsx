/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, type ReactNode, type ChangeEvent } from 'react';
import { useExpenses } from './hooks/useExpenses';
import { useAuth } from './hooks/useAuth';
import { GlassCard } from './components/ui/GlassCard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { ChartsSection } from './components/ChartsSection';
import { AIInsightsCard } from './components/AIInsightsCard';
import { NetworkStatus } from './components/NetworkStatus';
import { BudgetCard } from './components/BudgetCard';
import { BudgetHistoryCard } from './components/BudgetHistoryCard';
import { BudgetTrends } from './components/BudgetTrends';
import { ScientificCalculator } from './components/ScientificCalculator';
import { BudgetForm } from './components/BudgetForm';
import { CurrencyConverter } from './components/CurrencyConverter';
import { Transaction, SUPPORTED_CURRENCIES, CATEGORIES, Language, Budget } from './types';
import { translations, getTranslation } from './translations';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Settings2,
  Calendar,
  Download,
  LayoutDashboard,
  PieChart as PieChartIcon,
  Zap,
  Settings,
  CircleDollarSign,
  Sun,
  Moon,
  User,
  X,
  Upload,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Plus,
  BarChart3,
  BarChart2,
  Cloud,
  Database,
  Share2,
  ShieldCheck,
  WifiOff,
  FileText,
  ChevronRight,
  Target,
  Calculator,
  FileDown,
  Coins,
  ArrowRightLeft
} from 'lucide-react';

export default function App() {
  const { user, login, logout, isConfigured: isAuthReady, loading: authLoading } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);
  const { 
    transactions, 
    summary, 
    settings, 
    categoryData, 
    addTransaction, 
    deleteTransaction,
    deleteMultipleTransactions,
    undoDelete,
    clearLastDeleted,
    lastDeleted,
    lentPerPerson,
    borrowedPerPerson,
    updateTransaction,
    exportToExcel,
    exportToJSON,
    importFromJSON,
    convertAmount,
    updateSettings,
    updateBudget,
    deleteBudget,
    budgets,
    spendingThisMonthPerCategory,
    spendingPreviousMonthPerCategory,
    historicalBudgetPerformance,
    isCloudSyncing,
    hasPendingWrites
  } = useExpenses();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewStartDate, setViewStartDate] = useState('');
  const [viewEndDate, setViewEndDate] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'logs' | 'stats' | 'menu'>('home');
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [isAddOptionsOpen, setIsAddOptionsOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCurrencyConverterOpen, setIsCurrencyConverterOpen] = useState(false);
  const [budgetViewState, setBudgetViewState] = useState<'current' | 'history' | 'trends'>('current');
  const [detailsType, setDetailsType] = useState<'lent' | 'borrowed' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [prefilledData, setPrefilledData] = useState<any>(null);

  useEffect(() => {
    if (editingTransaction || prefilledData) {
      setIsFormOpen(true);
    }
  }, [editingTransaction, prefilledData]);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
    setPrefilledData(null);
  };
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const [exportFilter, setExportFilter] = useState({
    startDate: '',
    endDate: '',
    category: 'all'
  });

  const handleExportFiltered = () => {
    const filteredTransactions = transactions.filter(t => {
      const matchesSearch = t.note.toLowerCase().includes(search.toLowerCase()) || 
                           t.category.toLowerCase().includes(search.toLowerCase()) ||
                           (t.personName && t.personName.toLowerCase().includes(search.toLowerCase()));
      const matchesType = filter === 'all' || t.type === filter;
      const matchesPerson = !personSearch || (t.personName && t.personName.toLowerCase().includes(personSearch.toLowerCase()));
      const matchesStartDate = !viewStartDate || t.date >= viewStartDate;
      const matchesEndDate = !viewEndDate || t.date <= viewEndDate;
      return matchesSearch && matchesType && matchesPerson && matchesStartDate && matchesEndDate;
    });
    
    exportToExcel(filteredTransactions);
  };

  const getFilteredTransactionsForExport = () => {
    return transactions.filter(t => {
      const matchStart = !exportFilter.startDate || t.date >= exportFilter.startDate;
      const matchEnd = !exportFilter.endDate || t.date <= exportFilter.endDate;
      const matchCategory = exportFilter.category === 'all' || t.category === exportFilter.category;
      return matchStart && matchEnd && matchCategory;
    });
  };

  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$';
  const t = (key: any) => getTranslation(settings.language, key);

  // Auto-clear last deleted after 5 seconds
  useEffect(() => {
    if (lastDeleted) {
      const timer = setTimeout(() => {
        clearLastDeleted();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastDeleted, clearLastDeleted]);

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importFromJSON(file);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] relative overflow-hidden bg-black selection:bg-indigo-500/30">
      {/* Background Blobs */}
      <div className={`frosted-bg ${!settings.multiColorMode ? 'monochrome' : ''}`}>
        <div className="blob-1" />
        <div className="blob-2" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="w-20 glass-sidebar hidden md:flex flex-col items-center py-8 gap-10 z-20 shrink-0">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-all transition-all duration-500 ${
          settings.multiColorMode 
            ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-indigo-500/30' 
            : 'bg-white/10 border border-white/10'
        }`}>
          <CircleDollarSign size={24} className={settings.multiColorMode ? "text-white" : "text-white/60"} />
        </div>
        <nav className="flex flex-col gap-8 flex-1">
          <SidebarIcon icon={<LayoutDashboard size={22} />} active />
          <SidebarIcon icon={<PieChartIcon size={22} />} />
          <SidebarIcon icon={<Zap size={22} />} />
          <SidebarIcon icon={<Settings size={22} />} />
        </nav>
        <button 
          onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          className="text-slate-500 hover:text-white transition-colors p-2"
        >
          {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass-sidebar flex items-center justify-around px-2 z-[100] gap-2">
        <button 
          onClick={() => setActiveTab('home')}
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-300 ${activeTab === 'home' ? 'text-indigo-400' : 'text-white/40'}`}
        >
          {activeTab === 'home' && (
            <motion.div layoutId="nav-glow" className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
          )}
          <LayoutDashboard size={20} className="relative z-10" />
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">{t('home')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-300 ${activeTab === 'logs' ? 'text-indigo-400' : 'text-white/40'}`}
        >
          {activeTab === 'logs' && (
            <motion.div layoutId="nav-glow" className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
          )}
          <Calendar size={20} className="relative z-10" />
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">{t('logs')}</span>
        </button>
        <div className="relative -top-10 px-2 flex-shrink-0">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-indigo-500/40 blur-2xl rounded-full"
            />
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={() => setIsAddOptionsOpen(true)}
              className={`relative w-16 h-16 rounded-2xl flex items-center justify-center border z-[110] active:scale-95 transition-all shadow-2xl ${
                settings.multiColorMode
                  ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 border-white/30 shadow-indigo-500/40'
                  : 'bg-white text-black border-white shadow-white/20'
              }`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              <Plus size={36} className={`relative z-10 ${!settings.multiColorMode ? 'text-black' : 'text-white'}`} />
            </motion.button>
        </div>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-300 ${activeTab === 'stats' ? 'text-indigo-400' : 'text-white/40'}`}
        >
          {activeTab === 'stats' && (
            <motion.div layoutId="nav-glow" className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
          )}
          <BarChart3 size={20} className="relative z-10" />
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">{t('stats')}</span>
        </button>
        <button 
          onClick={() => setIsEditingName(true)}
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-300 ${activeTab === 'menu' ? 'text-indigo-400' : 'text-white/40'}`}
        >
          <Settings size={20} className="relative z-10" />
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">{t('menu')}</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-4 sm:p-6 lg:p-10 flex flex-col gap-6 overflow-y-auto md:overflow-hidden min-h-0 pb-32 md:pb-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0 mt-2 sm:mt-0">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => setIsEditingName(true)}>
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500/50">
                {settings.avatarUrl ? (
                  <img src={settings.avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={24} className="text-white/40" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Settings2 size={16} className="text-white" />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  {user ? user.displayName : settings.name}
                </h1>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <Calendar size={14} />
                  {format(currentTime, 'MMMM do, yyyy • hh:mm a')}
                </span>
                {!isAuthReady ? (
                  <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                    <Database size={12} />
                    Local Storage Mode (Owned)
                  </span>
                ) : user ? (
                  <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                    <Cloud size={12} />
                    {navigator.onLine ? 'Cloud Sync Active' : 'Offline Mode (Local)'}
                  </span>
                ) : (
                  <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400/60 font-bold">
                    <ShieldCheck size={12} />
                    {navigator.onLine ? 'Auto-Saved Local' : 'Offline Mode (Local)'}
                  </span>
                )}
                {!navigator.onLine && (
                  <span className="flex sm:hidden items-center gap-1 text-[9px] uppercase tracking-tighter text-rose-400 font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                    <WifiOff size={10} />
                    Offline
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 no-scrollbar">
            <select 
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value as Language })}
              className="glass-button-ghost py-2 text-xs sm:text-sm appearance-none cursor-pointer border-white/10 pr-6 pl-3 sm:pl-4 shrink-0"
            >
              <option value="en" className="bg-[#1C1C1E]">English</option>
              <option value="bn" className="bg-[#1C1C1E]">বাংলা</option>
            </select>
            <select 
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="glass-button-ghost py-2 text-xs sm:text-sm appearance-none cursor-pointer border-white/10 pr-6 pl-3 sm:pl-4 shrink-0"
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <option key={c.code} value={c.code} className="bg-[#1C1C1E]">{c.label}</option>
              ))}
            </select>
            
            <button 
              onClick={exportToExcel}
              className="p-2 sm:p-2.5 glass-button group relative bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 shrink-0"
              title={t('exportData')}
            >
              <Download size={18} />
              <span className="hidden sm:inline ml-2 text-xs font-bold uppercase tracking-widest">{t('exportData')}</span>
            </button>
            <div className="hidden sm:block">
              <button 
                onClick={() => setIsAddOptionsOpen(true)}
                className="p-2 sm:p-2.5 glass-button group relative bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 px-4 flex items-center gap-2"
              >
                <Plus size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">{t('add')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Add Options Modal */}
        <AnimatePresence>
          {isAddOptionsOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddOptionsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 bottom-32 md:bottom-auto md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-[90%] max-w-xs z-[201]"
              >
                <GlassCard className="p-4 bg-[#1C1C1E] border-white/10 shadow-2xl">
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setIsAddOptionsOpen(false);
                        setIsFormOpen(true);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
                    >
                      <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                        <Plus size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{t('addTransaction')}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">New Entry</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setIsAddOptionsOpen(false);
                        setIsBudgetFormOpen(true);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
                    >
                      <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{t('setBudget')}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Manage Goals</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setIsAddOptionsOpen(false);
                        setIsCalculatorOpen(true);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
                    >
                      <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                        <Calculator size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Scientific Calc</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Advanced Math</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setIsAddOptionsOpen(false)}
                      className="w-full py-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] hover:text-white/40 transition-colors mt-2"
                    >
                      Cancel
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Profile Edit Modal */}
        <AnimatePresence>
          {isEditingName && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditingName(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[101]"
              >
                <GlassCard className="p-8 bg-[#1C1C1E] border-white/10">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-display font-bold">{t('editProfile')}</h2>
                    <button onClick={() => setIsEditingName(false)} className="text-white/40 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                    <div className="flex flex-col items-center gap-4 mb-2">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {settings.avatarUrl ? (
                          <img src={settings.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} className="text-white/20" />
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={avatarInputRef} 
                        onChange={handleAvatarUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => avatarInputRef.current?.click()}
                        className="glass-button-ghost py-2 px-4 text-xs flex items-center gap-2"
                      >
                        <Upload size={14} />
                        {t('uploadPicture')}
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Cloud size={16} className="text-indigo-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">{t('cloudSync')}</span>
                      </div>
                      
                      {!isAuthReady ? (
                        <p className="text-[10px] text-white/50 leading-relaxed">
                          {t('cloudUnavailable')}
                        </p>
                      ) : user ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={14} className="text-indigo-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-white truncate">{user.displayName}</p>
                              <p className="text-[9px] text-white/40 truncate">{user.email}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-indigo-300/70 leading-relaxed">
                            {t('syncEnabled')}
                          </p>
                          <button 
                            onClick={logout}
                            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border border-rose-500/20"
                          >
                            {t('logout')}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[10px] text-white/50 leading-relaxed">
                            Sign in with your Google account to automatically sync your financial data across devices.
                          </p>
                          <button 
                            onClick={login}
                            disabled={authLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50"
                          >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                            {authLoading ? t('syncing') : t('loginWithGoogle')}
                          </button>
                        </div>
                      )}
                    </div>

                    {installPrompt && (
                      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Download size={16} className="text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">{t('installApp')}</span>
                        </div>
                        <p className="text-[10px] text-white/50 leading-relaxed mb-3">
                          {t('installDesc')}
                        </p>
                        <button 
                          onClick={handleInstall}
                          className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border border-emerald-500/20"
                        >
                          {t('installApp')}
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={14} className="text-white/30" />
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('budgets')}</span>
                      </div>
                      <button 
                        onClick={() => setIsBudgetFormOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors border border-indigo-500/20"
                      >
                        <Target size={16} />
                        {t('setBudget')}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRightLeft size={14} className="text-white/30" />
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Utilities</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => setIsCurrencyConverterOpen(true)}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                              <Coins size={18} />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-white">{t('currencyConverter')}</p>
                              <p className="text-[10px] text-white/30 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Quick conversion tool</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database size={14} className="text-white/30" />
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('backupRestore')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => exportToJSON()}
                          className="glass-button-ghost py-3 px-2 text-[10px] flex flex-col items-center gap-2 border-white/5"
                        >
                          <Download size={16} className="text-indigo-400" />
                          {t('exportBackup')}
                        </button>
                        <button 
                          onClick={() => importInputRef.current?.click()}
                          className="glass-button-ghost py-3 px-2 text-[10px] flex flex-col items-center gap-2 border-white/5"
                        >
                          <Upload size={16} className="text-emerald-400" />
                          {t('importBackup')}
                        </button>
                        <input 
                          type="file"
                          ref={importInputRef}
                          onChange={handleImportBackup}
                          accept=".json"
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 size={14} className="text-white/30" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{t('exportFilters')}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">{t('startDate')}</label>
                          <input 
                            type="date"
                            value={exportFilter.startDate}
                            onChange={(e) => setExportFilter(prev => ({ ...prev, startDate: e.target.value }))}
                            className="glass-input text-[11px] w-full [color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">{t('endDate')}</label>
                          <input 
                            type="date"
                            value={exportFilter.endDate}
                            onChange={(e) => setExportFilter(prev => ({ ...prev, endDate: e.target.value }))}
                            className="glass-input text-[11px] w-full [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">{t('filterCategory')}</label>
                        <select 
                          value={exportFilter.category}
                          onChange={(e) => setExportFilter(prev => ({ ...prev, category: e.target.value }))}
                          className="glass-input text-[11px] w-full appearance-none pr-8 cursor-pointer"
                        >
                          <option value="all" className="bg-[#1C1C1E]">{t('allTime')}</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-[#1C1C1E]">{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => exportToExcel(getFilteredTransactionsForExport())}
                          className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border border-emerald-500/20"
                        >
                          <FileText size={14} />
                          Excel
                        </button>
                        <button 
                          onClick={() => exportToJSON(getFilteredTransactionsForExport())}
                          className="flex items-center justify-center gap-2 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border border-indigo-500/20"
                        >
                          <Database size={14} />
                          JSON
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${settings.multiColorMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white/40'}`}>
                            <Zap size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{t('multiColorMode')}</p>
                            <p className="text-[10px] text-white/30 font-medium">Enable vibrant background effects</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => updateSettings({ multiColorMode: !settings.multiColorMode })}
                          className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${settings.multiColorMode ? 'bg-indigo-500' : 'bg-white/10'}`}
                        >
                          <motion.div 
                            animate={{ x: settings.multiColorMode ? 26 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                          />
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest block mb-2">{t('preferredCurrency')}</label>
                        <select 
                          value={settings.currency}
                          onChange={(e) => updateSettings({ currency: e.target.value })}
                          className="glass-input w-full appearance-none cursor-pointer"
                        >
                          {SUPPORTED_CURRENCIES.map(c => (
                            <option key={c.code} value={c.code} className="bg-[#1C1C1E]">{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest block mb-2">{t('displayName')}</label>
                        <input 
                          type="text"
                          value={settings.name}
                          onChange={(e) => updateSettings({ name: e.target.value })}
                          className="glass-input w-full"
                          placeholder="Your Name"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest block mb-2">{t('orAvatarUrl')}</label>
                        <input 
                          type="text"
                          value={settings.avatarUrl}
                          onChange={(e) => updateSettings({ avatarUrl: e.target.value })}
                          className="glass-input w-full"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsEditingName(false)}
                      className="glass-button w-full mt-4"
                    >
                      {t('saveChanges')}
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            </>
          )}

          {/* Details Modal (Lent/Borrowed) */}
          {detailsType && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDetailsType(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[101]"
              >
                <GlassCard className="p-8 bg-[#1C1C1E] border-white/10">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-xl font-display font-bold">
                        {detailsType === 'lent' ? t('lentTotal') : t('borrowedTotal')}
                      </h2>
                      <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">{t('byPerson')}</p>
                    </div>
                    <button onClick={() => setDetailsType(null)} className="text-white/40 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {(detailsType === 'lent' ? lentPerPerson : borrowedPerPerson).length > 0 ? (
                      (detailsType === 'lent' ? lentPerPerson : borrowedPerPerson).map(({ name, amount }) => (
                        <div key={name} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                              detailsType === 'lent' 
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            }`}>
                              <User size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-100">{name}</span>
                              <button 
                                onClick={() => {
                                  setPrefilledData({
                                    personName: name,
                                    type: detailsType === 'lent' ? 'lent_repayment' : 'borrowed_repayment',
                                    category: detailsType === 'lent' ? 'Lending' : 'Borrowing'
                                  });
                                  setDetailsType(null);
                                }}
                                className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1 hover:text-indigo-300 transition-colors"
                              >
                                {detailsType === 'lent' ? 'Record Repayment' : 'Make Repayment'}
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`font-display font-semibold ${
                              detailsType === 'lent' ? 'text-orange-400' : 'text-cyan-400'
                            }`}>
                              {currencySymbol}{amount.toLocaleString()}
                            </span>
                            <button 
                              onClick={() => {
                                setPrefilledData({
                                  personName: name,
                                  type: detailsType === 'lent' ? 'lent' : 'borrowed',
                                  category: detailsType === 'lent' ? 'Lending' : 'Borrowing'
                                });
                                setDetailsType(null);
                              }}
                              className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
                              title="Add more"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                          <CircleDollarSign size={24} className="text-white/20" />
                        </div>
                        <p className="text-white/40 text-sm">{t('noData')}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{t('total')}</span>
                    <span className={`text-2xl font-display font-bold ${
                      detailsType === 'lent' ? 'text-orange-400' : 'text-cyan-400'
                    }`}>
                      {currencySymbol}{(detailsType === 'lent' ? summary.lentTotal : summary.borrowedTotal).toLocaleString()}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Summary Row */}
        <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 shrink-0 ${activeTab !== 'home' ? 'hidden' : 'grid'}`}>
          <div className="col-span-2 md:col-span-1">
            <SummaryCard 
              title={t('totalBalance')}
              amount={summary.balance} 
              symbol={currencySymbol}
              icon={<Wallet size={20} className={settings.multiColorMode ? "text-white" : "text-white/60"} />} 
              color="indigo"
              multiColor={settings.multiColorMode}
              onClick={() => setFilter('all')}
            />
          </div>
          <SummaryCard 
            title={t('savings')} 
            amount={summary.savings} 
            symbol={currencySymbol}
            icon={<TrendingUp size={20} />} 
            progress={summary.income > 0 ? (summary.savings / summary.income) * 100 : 0}
            color="emerald"
            multiColor={settings.multiColorMode}
            onClick={() => setFilter('all')}
          />
          <SummaryCard 
            title={t('monthlyExpenses')} 
            amount={summary.expenses} 
            symbol={currencySymbol}
            icon={<TrendingDown size={20} />} 
            progress={summary.income > 0 ? (summary.expenses / summary.income) * 100 : 0}
            color="rose"
            multiColor={settings.multiColorMode}
            onClick={() => setFilter('expense')}
          />
          <SummaryCard 
            title={t('lentTotal')} 
            amount={summary.lentTotal} 
            symbol={currencySymbol}
            icon={<ArrowUpRight size={20} />} 
            color="orange"
            multiColor={settings.multiColorMode}
            onClick={() => setDetailsType('lent')}
          />
          <SummaryCard 
            title={t('borrowedTotal')} 
            amount={summary.borrowedTotal} 
            symbol={currencySymbol}
            icon={<ArrowDownLeft size={20} />} 
            color="cyan"
            multiColor={settings.multiColorMode}
            onClick={() => setDetailsType('borrowed')}
          />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Main Feed */}
          <section className={`col-span-12 ${activeTab === 'home' ? 'lg:col-span-8 flex' : activeTab === 'stats' ? 'flex' : 'hidden'} flex-col gap-6 min-h-0`}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  {budgetViewState === 'trends' ? 'Budget Trends & Analytics' : budgetViewState === 'history' ? 'Budget Performance History' : 'Monthly Budget Tracking'}
                </h3>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setBudgetViewState('current')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${budgetViewState === 'current' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    Current
                  </button>
                  <button 
                    onClick={() => setBudgetViewState('history')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${budgetViewState === 'history' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    History
                  </button>
                  <button 
                    onClick={() => setBudgetViewState('trends')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${budgetViewState === 'trends' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    Trends
                  </button>
                </div>
              </div>
              
              {budgetViewState === 'history' ? (
                <BudgetHistoryCard 
                  performance={historicalBudgetPerformance}
                  currencySymbol={currencySymbol}
                />
              ) : budgetViewState === 'trends' ? (
                <BudgetTrends 
                  historicalData={historicalBudgetPerformance}
                  currencySymbol={currencySymbol}
                />
              ) : (
                <BudgetCard 
                  budgets={budgets}
                  spendingThisMonth={spendingThisMonthPerCategory}
                  currencySymbol={currencySymbol}
                  language={settings.language}
                  convertAmount={convertAmount}
                  onSetBudget={() => setIsBudgetFormOpen(true)}
                />
              )}
            </div>
            <GlassCard className="p-6 md:p-8 flex-1 overflow-hidden flex flex-col">
              <ChartsSection 
                transactions={transactions} 
                categoryData={categoryData} 
                currencySymbol={currencySymbol} 
                language={settings.language}
                previousCategoryData={spendingPreviousMonthPerCategory}
              />
            </GlassCard>
          </section>

          {/* Side Panels - History */}
          <aside className={`col-span-12 ${activeTab === 'home' ? 'lg:col-span-4 flex' : activeTab === 'logs' ? 'flex' : 'hidden'} flex-col gap-6 min-h-0`}>
            <GlassCard className="p-6 md:p-8 flex-1 min-h-[300px] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="font-bold text-lg text-white font-display">{t('recentTransactions')}</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportFiltered}
                    title="Export filtered"
                    className="p-2 rounded-xl border bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <FileDown size={18} />
                  </button>
                  <button 
                    onClick={() => setShowTransactionFilters(!showTransactionFilters)}
                    className={`p-2 rounded-xl border transition-all ${showTransactionFilters || viewStartDate || viewEndDate || personSearch || filter !== 'all' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-white/20'}`}
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <TransactionList 
                  transactions={transactions} 
                  onDelete={deleteTransaction}
                  onBulkDelete={deleteMultipleTransactions}
                  onEdit={setEditingTransaction}
                  currencySymbol={currencySymbol}
                  language={settings.language}
                  search={search}
                  setSearch={setSearch}
                  filter={filter}
                  setFilter={setFilter}
                  showFilters={showTransactionFilters}
                  setShowFilters={setShowTransactionFilters}
                  startDate={viewStartDate}
                  setStartDate={setViewStartDate}
                  endDate={viewEndDate}
                  setEndDate={setViewEndDate}
                  personSearch={personSearch}
                  setPersonSearch={setPersonSearch}
                  lastDeleted={lastDeleted}
                  onUndo={undoDelete}
                />
              </div>
            </GlassCard>
          </aside>
        </div>
      </main>

      <BudgetForm
        isOpen={isBudgetFormOpen}
        onClose={() => setIsBudgetFormOpen(false)}
        budgets={budgets}
        onUpdateBudget={updateBudget}
        onDeleteBudget={deleteBudget}
        language={settings.language}
        currencySymbol={currencySymbol}
      />

      <ScientificCalculator 
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <CurrencyConverter 
        isOpen={isCurrencyConverterOpen}
        onClose={() => setIsCurrencyConverterOpen(false)}
        language={settings.language}
        defaultSource={settings.currency}
      />

      <TransactionForm 
        isOpen={isFormOpen}
        onClose={closeForm}
        onAdd={addTransaction} 
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
        editingTransaction={editingTransaction}
        prefilledData={prefilledData}
        onCancelEdit={() => setEditingTransaction(null)}
        currencySymbol={currencySymbol}
        language={settings.language}
      />
      <NetworkStatus isSyncing={hasPendingWrites} />
    </div>
  );
}

function SidebarIcon({ icon, active = false }: { icon: ReactNode; active?: boolean }) {
  return (
    <div className={`${active ? 'text-indigo-400' : 'text-slate-500 hover:text-white'} cursor-pointer transition-colors p-1`}>
      {icon}
    </div>
  );
}

function SummaryCard({ title, amount, icon, progress, trend, color, symbol, onClick, multiColor }: any) {
  const getIconColor = () => {
    if (!multiColor) return 'text-indigo-400';
    if (amount < 0) return 'text-rose-400';
    switch (color) {
      case 'emerald': return 'text-emerald-400';
      case 'rose': return 'text-rose-400';
      case 'orange': return 'text-orange-400';
      case 'cyan': return 'text-cyan-400';
      case 'indigo': return 'text-indigo-400';
      default: return 'text-white/60';
    }
  };

  const getTextColor = () => {
    if (!multiColor) return 'text-white';
    if (amount < 0) return 'text-rose-400';
    switch (color) {
      case 'emerald': return 'text-emerald-400';
      case 'rose': return 'text-rose-400';
      case 'orange': return 'text-orange-400';
      case 'cyan': return 'text-cyan-400';
      case 'indigo': return 'text-indigo-400';
      default: return 'text-white';
    }
  };

  return (
    <GlassCard 
      onClick={onClick}
      className={`p-6 relative group overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-white/20 active:scale-[0.98]' : ''} hover:border-white/10`}
    >
      <div className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">{title}</p>
        <div className={`p-2.5 bg-white/5 rounded-xl transition-colors border border-white/5 ${getIconColor()}`}>
          {icon}
        </div>
      </div>
      
      <div className="space-y-1">
        <h2 className={`text-4xl font-display font-medium tracking-tight transition-colors duration-500 ${getTextColor()}`}>
          {amount < 0 ? '-' : ''}{symbol}{Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </h2>
        {trend && (
          <div className={`flex items-center text-[11px] font-semibold ${multiColor ? 'text-emerald-400/80' : 'text-indigo-400/80'}`}>
            <TrendingUp size={12} className="mr-1" /> {trend}
          </div>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-6">
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${
                amount < 0 ? 'bg-rose-400' :
                color === 'emerald' ? 'bg-emerald-400' : 
                color === 'rose' ? 'bg-rose-400' : 
                color === 'indigo' ? 'bg-indigo-500' :
                'bg-indigo-400'
              } rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
