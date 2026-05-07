import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Percent, Equal, Hash, RotateCcw } from 'lucide-react';
import { GlassCard, cn } from './ui/GlassCard';

interface ScientificCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificCalculator = ({ isOpen, onClose }: ScientificCalculatorProps) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const appendToDisplay = (value: string) => {
    if (display === '0' && value !== '.') {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const calculate = () => {
    try {
      // Basic sanitization
      let expr = display.replace(/×/g, '*').replace(/÷/g, '/');
      
      // Handle advanced functions
      expr = expr.replace(/sin\(/g, 'Math.sin(');
      expr = expr.replace(/cos\(/g, 'Math.cos(');
      expr = expr.replace(/tan\(/g, 'Math.tan(');
      expr = expr.replace(/log\(/g, 'Math.log10(');
      expr = expr.replace(/ln\(/g, 'Math.log(');
      expr = expr.replace(/√\(/g, 'Math.sqrt(');
      expr = expr.replace(/%/g, '*0.01');
      expr = expr.replace(/π/g, 'Math.PI');
      expr = expr.replace(/e/g, 'Math.E');
      
      // Safety check: count parentheses
      const openBrackets = (expr.match(/\(/g) || []).length;
      const closeBrackets = (expr.match(/\)/g) || []).length;
      if (openBrackets > closeBrackets) {
        expr += ')'.repeat(openBrackets - closeBrackets);
      }
      
      const result = eval(expr);
      const formattedResult = Number.isFinite(result) 
        ? (Number.isInteger(result) ? result.toString() : result.toFixed(4))
        : 'Error';
      
      setHistory(prev => [display + ' = ' + formattedResult, ...prev].slice(0, 5));
      setEquation(display + ' =');
      setDisplay(formattedResult);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const scientificFunc = (func: string) => {
    if (display === '0') {
      setDisplay(func + '(');
    } else {
      setDisplay(display + func + '(');
    }
  };

  const CalcButton = ({ 
    label, 
    onClick, 
    variant = 'digit',
    className = ""
  }: { 
    label: string | React.ReactNode, 
    onClick: () => void, 
    variant?: 'digit' | 'operator' | 'function' | 'action',
    className?: string
  }) => {
    const variants = {
      digit: 'bg-white/5 text-white border-white/5 hover:bg-white/10',
      operator: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/30',
      function: 'bg-indigo-500/10 text-indigo-300/70 border-indigo-500/10 hover:bg-indigo-500/20',
      action: 'bg-rose-500/20 text-rose-400 border-rose-500/20 hover:bg-rose-500/30'
    };

    return (
      <motion.button
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "flex-1 min-h-[48px] rounded-2xl flex items-center justify-center font-bold text-[11px] uppercase tracking-widest border transition-all duration-200",
          variants[variant],
          className
        )}
      >
        {label}
      </motion.button>
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
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
            className="relative w-full max-w-sm"
          >
            <div className="glass-card p-6 bg-white/[0.03] border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-2xl">
              {/* Decorative background light */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px]" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-indigo-400">
                    <Hash size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight leading-tight">Calculator</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Scientific Edition</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-white/40 transition-colors active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Display */}
              <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-black/40 rounded-3xl p-6 border border-white/5 text-right font-mono overflow-hidden shadow-inner">
                  <div className="h-4 text-[10px] font-bold text-indigo-400/40 uppercase tracking-widest truncate mb-2">
                    {equation || '\u00A0'}
                  </div>
                  <div className="text-4xl font-light text-white tracking-tighter truncate">
                    {display}
                  </div>
                </div>
              </div>

              {/* Grid with staggered animation */}
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-2 relative z-10"
              >
                <motion.div variants={item} className="grid grid-cols-4 gap-2">
                  <CalcButton label="sin" variant="function" onClick={() => scientificFunc('sin')} />
                  <CalcButton label="cos" variant="function" onClick={() => scientificFunc('cos')} />
                  <CalcButton label="tan" variant="function" onClick={() => scientificFunc('tan')} />
                  <CalcButton label={<RotateCcw size={18} />} variant="action" onClick={clear} />
                </motion.div>
                
                <motion.div variants={item} className="grid grid-cols-4 gap-2">
                  <CalcButton label="log" variant="function" onClick={() => scientificFunc('log')} />
                  <CalcButton label="ln" variant="function" onClick={() => scientificFunc('ln')} />
                  <CalcButton label="(" variant="function" onClick={() => appendToDisplay('(')} />
                  <CalcButton label=")" variant="function" onClick={() => appendToDisplay(')')} />
                </motion.div>
                
                <motion.div variants={item} className="grid grid-cols-4 gap-2">
                  <CalcButton label="√" variant="function" onClick={() => scientificFunc('√')} />
                  <CalcButton label="%" variant="function" onClick={() => appendToDisplay('%')} />
                  <CalcButton label="÷" variant="operator" onClick={() => appendToDisplay('÷')} />
                  <CalcButton label={<Delete size={18} />} onClick={backspace} />
                </motion.div>
                
                <motion.div variants={item} className="grid grid-cols-4 gap-2">
                  <CalcButton label="7" onClick={() => appendToDisplay('7')} />
                  <CalcButton label="8" onClick={() => appendToDisplay('8')} />
                  <CalcButton label="9" onClick={() => appendToDisplay('9')} />
                  <CalcButton label="×" variant="operator" onClick={() => appendToDisplay('×')} />
                </motion.div>
                
                <motion.div variants={item} className="grid grid-cols-4 gap-2">
                  <CalcButton label="4" onClick={() => appendToDisplay('4')} />
                  <CalcButton label="5" onClick={() => appendToDisplay('5')} />
                  <CalcButton label="6" onClick={() => appendToDisplay('6')} />
                  <CalcButton label="-" variant="operator" onClick={() => appendToDisplay('-')} />
                </motion.div>
                
                <motion.div variants={item} className="grid grid-cols-4 gap-2">
                  <CalcButton label="1" onClick={() => appendToDisplay('1')} />
                  <CalcButton label="2" onClick={() => appendToDisplay('2')} />
                  <CalcButton label="3" onClick={() => appendToDisplay('3')} />
                  <CalcButton label="+" variant="operator" onClick={() => appendToDisplay('+')} />
                </motion.div>
                
                <motion.div variants={item} className="grid grid-cols-4 gap-2">
                  <CalcButton label="0" className="col-span-1" onClick={() => appendToDisplay('0')} />
                  <CalcButton label="." onClick={() => appendToDisplay('.')} />
                  <CalcButton 
                    label={<Equal size={22} />} 
                    variant="operator" 
                    className="col-span-2 bg-indigo-500 text-white border-transparent hover:bg-indigo-400" 
                    onClick={calculate} 
                  />
                </motion.div>
              </motion.div>

              {/* History */}
              {history.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8 pt-6 border-t border-white/5 relative z-10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Recent History</p>
                    <button onClick={() => setHistory([])} className="text-[9px] text-indigo-400/40 hover:text-indigo-400 font-bold uppercase tracking-widest transition-colors">Clear</button>
                  </div>
                  <div className="space-y-2.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {history.map((item, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index} 
                        className="text-[11px] font-medium text-white/40 font-mono flex items-center gap-2 group cursor-pointer hover:text-white/60 transition-colors"
                        onClick={() => {
                          const result = item.split(' = ')[1];
                          if (result && result !== 'Error') setDisplay(result);
                        }}
                      >
                        <span className="w-1 h-1 rounded-full bg-indigo-500/30 group-hover:bg-indigo-500/60" />
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
