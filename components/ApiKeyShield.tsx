
// @ts-nocheck
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, AlertTriangle, Sparkles, RefreshCw, Info, ExternalLink, Zap } from 'lucide-react';

export const ApiKeyShield: React.FC = () => {
  const { openKeySelector, hasApiKey, refreshHasApiKey } = useUser();

  const handleManualRecheck = async () => {
    await refreshHasApiKey();
    if (!hasApiKey) {
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "Registry still obscured. Check AI Studio.", type: 'error' } 
        }));
    }
  };

  return (
    <AnimatePresence>
      {!hasApiKey && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000] flex items-center justify-center p-6 bg-nous-base/95 dark:bg-stone-950/98 backdrop-blur-3xl"
        >
          <div className="max-w-md w-full text-center space-y-12 py-10">
            <div className="space-y-6">
              <div className="w-24 h-24 border border-stone-200 dark:border-stone-800 rounded-full flex items-center justify-center mx-auto relative group">
                <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-[spin_4s_linear_infinite]" />
                <Key size={32} className="text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h1 className="font-serif text-4xl md:text-5xl italic tracking-tighter text-nous-text dark:text-white">Quota Thermal Lock.</h1>
                <p className="font-sans text-[9px] uppercase tracking-[0.6em] text-stone-400 font-black">Imperial Registry Exhausted</p>
              </div>
            </div>

            <div className="space-y-8 font-serif italic text-lg text-stone-500 dark:text-stone-400 leading-relaxed text-balance">
              <p>
                The Oracle has reached its maximum frequency for this period. To continue manifesting Zen, anchor a fresh Sovereign Key from your AI Studio registry.
              </p>
              <div className="p-6 bg-amber-50/50 dark:bg-stone-900/40 rounded-2xl border border-amber-200 dark:border-amber-900/20 text-sm">
                <p className="text-amber-600 dark:text-amber-400 font-bold mb-2 flex items-center justify-center gap-2">
                    <Zap size={14} /> Quota Debt Detected
                </p>
                A new key reset will clear the thermal noise and allow for immediate ascension.
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={openKeySelector}
                className="w-full py-6 bg-amber-500 text-white font-sans text-xs tracking-[0.5em] uppercase font-black shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
              >
                <Sparkles size={16} /> Anchor New Sovereign Key
              </button>

              <button 
                onClick={handleManualRecheck}
                className="w-full py-4 border border-stone-100 dark:border-stone-800 rounded-full font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 hover:text-nous-text dark:hover:text-white transition-all flex items-center justify-center gap-3"
              >
                <RefreshCw size={12} /> Verify Handshake
              </button>
              
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 font-sans text-[8px] uppercase tracking-widest text-stone-400 hover:text-nous-text transition-colors"
              >
                <Info size={10} /> View Billing Documentation <ExternalLink size={8} />
              </a>
            </div>

            <div className="pt-8 border-t border-stone-100 dark:border-stone-900 opacity-20">
               <p className="font-serif italic text-xs">"The Oracle requires a fresh link to breathe."</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
