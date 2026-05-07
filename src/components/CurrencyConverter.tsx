import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowRightLeft, 
  Coins, 
  ArrowRight
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { getTranslation } from '../translations';
import { Language, SUPPORTED_CURRENCIES, CONVERSION_RATES } from '../types';

interface CurrencyConverterProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  defaultSource?: string;
}

export function CurrencyConverter({ isOpen, onClose, language, defaultSource = 'USD' }: CurrencyConverterProps) {
  const t = (key: any) => getTranslation(language, key);
  
  const [amount, setAmount] = useState<string>('1');
  const [sourceCurrency, setSourceCurrency] = useState(defaultSource);
  const [targetCurrency, setTargetCurrency] = useState('BDT');
  const [result, setResult] = useState<number | null>(null);

  const convert = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    const rateFrom = CONVERSION_RATES[sourceCurrency] || 1;
    const rateTo = CONVERSION_RATES[targetCurrency] || 1;
    const converted = (numAmount / rateFrom) * rateTo;
    setResult(converted);
  };

  const swapCurrencies = () => {
    setSourceCurrency(targetCurrency);
    setTargetCurrency(sourceCurrency);
    setResult(null);
  };

  const sourceSymbol = SUPPORTED_CURRENCIES.find(c => c.code === sourceCurrency)?.symbol || '';
  const targetSymbol = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrency)?.symbol || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md"
          >
            <GlassCard className="p-6 md:p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                    <Coins size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white font-display tracking-tight">
                      {t('currencyConverter')}
                    </h3>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                      Real-time Rates
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                    {t('amount')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-display font-medium text-white/30">
                      {sourceSymbol}
                    </span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setResult(null);
                      }}
                      className="glass-input w-full pl-10 pr-4 py-4 text-2xl font-display font-medium text-white placeholder-white/10 border-white/10"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                  {/* From Currency */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                      {t('sourceCurrency')}
                    </label>
                    <select 
                      value={sourceCurrency}
                      onChange={(e) => {
                        setSourceCurrency(e.target.value);
                        setResult(null);
                      }}
                      className="glass-input w-full px-3 py-3 text-sm font-bold text-white bg-transparent border-white/10"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                          {curr.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={swapCurrencies}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white hover:rotate-180 transition-all duration-500"
                    >
                      <ArrowRightLeft size={18} />
                    </button>
                  </div>

                  {/* To Currency */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                      {t('targetCurrency')}
                    </label>
                    <select 
                      value={targetCurrency}
                      onChange={(e) => {
                        setTargetCurrency(e.target.value);
                        setResult(null);
                      }}
                      className="glass-input w-full px-3 py-3 text-sm font-bold text-white bg-transparent border-white/10"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                          {curr.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={convert}
                  className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/25 hover:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  {t('convert')}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Result */}
                <AnimatePresence>
                  {result !== null && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 border-t border-white/5 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                          {t('conversionResult')}
                        </span>
                        <div className="text-4xl font-display font-bold text-emerald-400 tracking-tight">
                          {targetSymbol} {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] font-medium text-white/20 mt-2">
                          1 {sourceCurrency} = {(CONVERSION_RATES[targetCurrency] / CONVERSION_RATES[sourceCurrency]).toFixed(4)} {targetCurrency}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
