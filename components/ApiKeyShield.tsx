
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, AlertTriangle } from 'lucide-react';

export const ApiKeyShield: React.FC = () => {
  const { openKeySelector, hasApiKey } = useUser();

  return (
    <AnimatePresence>
      {!hasApiKey && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[5000]"
        >
          <button 
            onClick={openKeySelector}
            className="flex items-center gap-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-3xl px-8 py-4 border border-amber-200/50 dark:border-amber-900/30 rounded-full shadow-2xl group transition-all hover:scale-105"
          >
            <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
            <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-500 dark:text-stone-400 group-hover:text-nous-text dark:group-hover:text-white transition-colors">
              Calibration Required: Anchor Sovereign Key
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
