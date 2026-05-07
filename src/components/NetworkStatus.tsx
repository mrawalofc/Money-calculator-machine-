import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

interface NetworkStatusProps {
  isSyncing?: boolean;
}

export function NetworkStatus({ isSyncing = false }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || showStatus || isSyncing) && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.9 }}
          className="fixed bottom-28 left-6 right-6 md:left-[unset] md:right-10 z-[200] md:max-w-xs"
        >
          <div className={`relative overflow-hidden flex items-start gap-4 px-5 py-4 rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl ${
            isSyncing && isOnline
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              : isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 ${
              isSyncing && isOnline ? 'bg-indigo-500' : isOnline ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />
            
            <div className={`p-3 rounded-2xl shrink-0 ${
              isSyncing && isOnline ? 'bg-indigo-500/20' : isOnline ? 'bg-emerald-500/20' : 'bg-rose-500/20'
            }`}>
              {isSyncing && isOnline ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw size={22} />
                </motion.div>
              ) : isOnline ? (
                <Wifi size={22} />
              ) : (
                <WifiOff size={22} />
              )}
            </div>
            
            <div className="flex-1 pt-0.5">
              <h4 className="text-sm font-display font-bold uppercase tracking-wider mb-1">
                {isSyncing && isOnline ? 'Syncing Data' : isOnline ? 'Network Restored' : 'No Connection'}
              </h4>
              <p className="text-[10px] sm:text-xs opacity-70 leading-relaxed font-medium">
                {isSyncing && isOnline
                  ? 'Your financial data is currently being synchronized with the cloud.'
                  : isOnline 
                    ? 'Your financial data is now synchronized with the local cache.' 
                    : 'You are currently offline. Changes will be saved locally and sync later.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
