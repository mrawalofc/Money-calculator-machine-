import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Percent, Equal, Hash, RotateCcw } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

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
    variant = 'digit' 
  }: { 
    label: string | React.ReactNode, 
    onClick: () => void, 
    variant?: 'digit' | 'operator' | 'function' | 'action' 
  }) => {
    const bgColor = useMemo(() => {
      switch(variant) {
        case 'operator': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20';
        case 'function': return 'bg-white/5 text-white/60 border-white/5';
        case 'action': return 'bg-rose-500/20 text-rose-400 border-rose-500/20';
        default: return 'bg-white/5 text-white border-white/5';
      }
    }, [variant]);

    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className={`flex-1 min-h-[44px] rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-widest border transition-colors hover:bg-white/10 ${bgColor}`}
      >
        {label}
      </motion.button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-sm z-[301]"
          >
            <GlassCard className="p-6 bg-[#1C1C1E] border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Hash size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">Advanced Tools</h3>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Scientific Calculator</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Display */}
              <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-white/5 text-right overflow-hidden shadow-inner font-mono">
                <div className="h-4 text-[10px] font-bold text-indigo-400/50 uppercase tracking-widest truncate mb-1">
                  {equation}
                </div>
                <div className="text-3xl font-medium text-white tracking-tighter truncate">
                  {display}
                </div>
              </div>

              {/* Grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <CalcButton label="sin" variant="function" onClick={() => scientificFunc('sin')} />
                  <CalcButton label="cos" variant="function" onClick={() => scientificFunc('cos')} />
                  <CalcButton label="tan" variant="function" onClick={() => scientificFunc('tan')} />
                  <CalcButton label={<RotateCcw size={16} />} variant="action" onClick={clear} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <CalcButton label="log" variant="function" onClick={() => scientificFunc('log')} />
                  <CalcButton label="ln" variant="function" onClick={() => scientificFunc('ln')} />
                  <CalcButton label="(" variant="function" onClick={() => appendToDisplay('(')} />
                  <CalcButton label=")" variant="function" onClick={() => appendToDisplay(')')} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <CalcButton label="√" variant="function" onClick={() => scientificFunc('√')} />
                  <CalcButton label="%" variant="function" onClick={() => appendToDisplay('%')} />
                  <CalcButton label="÷" variant="operator" onClick={() => appendToDisplay('÷')} />
                  <CalcButton label={<Delete size={16} />} onClick={backspace} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <CalcButton label="7" onClick={() => appendToDisplay('7')} />
                  <CalcButton label="8" onClick={() => appendToDisplay('8')} />
                  <CalcButton label="9" onClick={() => appendToDisplay('9')} />
                  <CalcButton label="×" variant="operator" onClick={() => appendToDisplay('×')} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <CalcButton label="4" onClick={() => appendToDisplay('4')} />
                  <CalcButton label="5" onClick={() => appendToDisplay('5')} />
                  <CalcButton label="6" onClick={() => appendToDisplay('6')} />
                  <CalcButton label="-" variant="operator" onClick={() => appendToDisplay('-')} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <CalcButton label="1" onClick={() => appendToDisplay('1')} />
                  <CalcButton label="2" onClick={() => appendToDisplay('2')} />
                  <CalcButton label="3" onClick={() => appendToDisplay('3')} />
                  <CalcButton label="+" variant="operator" onClick={() => appendToDisplay('+')} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <CalcButton label="0" onClick={() => appendToDisplay('0')} />
                  <CalcButton label="." onClick={() => appendToDisplay('.')} />
                  <CalcButton label={<Equal size={20} />} variant="operator" onClick={calculate} />
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/5">
                   <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">History</p>
                   <div className="space-y-2">
                     {history.map((item, index) => (
                       <div key={index} className="text-[11px] font-medium text-white/40 font-mono">
                         {item}
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
