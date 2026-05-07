import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { getSpendingInsights } from '../services/geminiService';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AIInsightsCardProps {
  transactions: Transaction[];
  userName: string;
  currencySymbol?: string;
}

export const AIInsightsCard = ({ transactions, userName, currencySymbol = '$' }: AIInsightsCardProps) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    setLoading(true);
    const result = await getSpendingInsights(transactions, userName, currencySymbol);
    setInsight(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsight();
  }, [transactions.length]); // Re-fetch only when transaction count changes

  return (
    <GlassCard className="p-8 relative overflow-hidden group border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Sparkles size={160} className="text-indigo-400" />
      </div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-base tracking-tight">AI Insights</h3>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Personalized Financial Advisor</p>
          </div>
        </div>
        <button 
          onClick={fetchInsight}
          disabled={loading}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all disabled:opacity-30 border border-white/5"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 relative z-10"
          >
            <div className="h-4 w-3/4 bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-5/6 bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-2/3 bg-white/5 rounded-full animate-pulse" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/70 leading-relaxed text-sm relative z-10 font-medium"
          >
            <div className="prose prose-invert prose-sm max-w-none">
              {insight.split('\n').map((line, i) => (
                <p key={i} className="mb-4 last:mb-0 border-l-2 border-indigo-500/20 pl-4 py-1 hover:border-indigo-500/50 transition-colors">
                  {line.replace(/^[•\-\d\.]+\s*/, '')}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};
