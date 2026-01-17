
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, ShieldCheck, Loader2, Beer as Martini, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, ghostLogin, authError } = useUser();
  const [isAccessing, setIsAccessing] = useState<'google' | 'ghost' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = authError || localError;

  const handleGoogleLogin = async () => {
    setIsAccessing('google');
    setLocalError(null);
    try {
      await login();
    } catch (e: any) {
      console.error("MIMI // Auth Trace:", e);
      // Explicit check for domain restriction which often hits local dev or new deploys
      if (e.code === 'auth/unauthorized-domain' || e.message?.includes("unauthorized-domain") || e.message?.includes("DOMAIN_UNAUTHORIZED")) {
        setLocalError(`Structural Blockage: ${window.location.hostname} is not whitelisted. Visit Firebase Console > Auth > Settings > Authorized Domains.`);
      } else {
        setLocalError(e.message || "The cloud registry rejected the handshake.");
      }
      setIsAccessing(null);
    }
  };

  const handleGhostLogin = async () => {
    setIsAccessing('ghost');
    setLocalError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      await ghostLogin();
    } catch (e: any) {
      setLocalError("The shadow memory failed to manifest.");
      setIsAccessing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white dark:bg-stone-950 flex items-center justify-center p-6 md:p-12 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stone-100 dark:bg-stone-900/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg text-center space-y-16"
      >
        <div className="space-y-6">
           <div className="w-24 h-24 border border-stone-200 dark:border-stone-800 rounded-full flex items-center justify-center mx-auto relative group">
              <div className="absolute inset-0 border-t-2 border-nous-text dark:border-white rounded-full animate-[spin_4s_linear_infinite]" />
              <Martini size={32} className="text-nous-text dark:text-white group-hover:scale-110 transition-transform duration-700" />
           </div>
           <div className="space-y-3">
              <h1 className="font-serif text-5xl md:text-7xl italic tracking-tighter luminescent-text text-nous-text dark:text-white">Accession.</h1>
              <p className="font-sans text-[10px] uppercase tracking-[0.8em] text-stone-400 font-black">Identity Calibration Sequence</p>
           </div>
        </div>

        <div className="space-y-6">
            <button 
                onClick={handleGoogleLogin}
                disabled={!!isAccessing}
                className="w-full group relative flex items-center justify-center py-6 bg-nous-text dark:bg-white text-white dark:text-stone-950 font-sans text-xs tracking-[0.6em] uppercase font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 rounded-full"
            >
                {isAccessing === 'google' ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} className="mr-3" />}
                <span>Permanent Anchor</span>
            </button>

            <button 
                onClick={handleGhostLogin}
                disabled={!!isAccessing}
                className="w-full flex items-center justify-center py-5 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-nous-text dark:hover:text-white font-sans text-[10px] tracking-[0.5em] uppercase font-black transition-all hover:bg-stone-50 dark:hover:bg-white/5 rounded-full"
            >
                {isAccessing === 'ghost' ? <Loader2 size={14} className="animate-spin" /> : <Ghost size={14} className="mr-3" />}
                <span>Ghost Protocol</span>
            </button>
        </div>

        <AnimatePresence>
            {displayError && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-2xl space-y-4 text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle size={14} />
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black">Protocol Trace Failure</span>
                    </div>
                    <p className="font-serif italic text-sm text-red-800 dark:text-red-300 leading-tight">"{displayError}"</p>
                    <div className="flex flex-col gap-3 pt-2">
                      <a 
                        href="https://console.firebase.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 mx-auto font-sans text-[8px] uppercase tracking-widest font-black text-red-600 hover:text-red-800 border-b border-red-600/30 transition-all"
                      >
                        Visit Firebase Console <ExternalLink size={10} />
                      </a>
                      <button 
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 mx-auto font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        <RefreshCw size={10} /> Re-Sync Signal
                      </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
