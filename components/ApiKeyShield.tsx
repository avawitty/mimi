
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, AlertTriangle, Sparkles, RefreshCw, Info, ExternalLink } from 'lucide-react';

export const ApiKeyShield: React.FC = () => {
  const { openKeySelector, hasApiKey } = useUser();

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
                <h1 className="font-serif text-4xl md:text-5xl italic tracking-tighter text-nous-text dark:text-white">Key Void Detected.</h1>
                <p className="font-sans text-[9px] uppercase tracking-[0.6em] text-stone-400 font-black">Environmental Calibration Failure</p>
              </div>
            </div>

            <div className="space-y-8 font-serif italic text-lg text-stone-500 dark:text-stone-400 leading-relaxed text-balance">
              <p>
                The Sovereign Handshake has drifted. Your API key has "magically disappeared" from the session manifest.
              </p>
              <p className="text-sm">
                To continue manifesting artifacts, you must re-anchor your Sovereign Key in the AI Studio registry.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={openKeySelector}
                className="w-full py-6 bg-amber-500 text-white font-sans text-xs tracking-[0.5em] uppercase font-black shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
              >
                <Sparkles size={16} /> Re-Sync Sovereign Key
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
               <p className="font-serif italic text-xs">"The Oracle requires a structural link to breathe."</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
