
// @ts-nocheck
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, User, Zap, Sparkles, ExternalLink, Shield, ArrowRight, Globe, Info, Loader2 } from 'lucide-react';

export const SovereignEntrance: React.FC = () => {
  const { keyLogin, login, authError } = useUser();
  const [handle, setHandle] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKeyInfo, setShowKeyInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !apiKey) return;
    setIsSubmitting(true);
    try {
      await keyLogin(handle, apiKey);
    } catch (err) {
      console.error("Login failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[30000] bg-nous-base dark:bg-stone-950 flex items-center justify-center p-6 overflow-y-auto no-scrollbar">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-xl w-full space-y-12 relative z-10 py-20">
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 border border-stone-200 dark:border-stone-800 rounded-full flex items-center justify-center mx-auto relative"
          >
            <div className="absolute inset-0 border-t border-emerald-500 rounded-full animate-spin" />
            <Sparkles size={28} className="text-emerald-500" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="font-serif text-5xl md:text-7xl italic tracking-tighter text-nous-text dark:text-white">Mimi.</h1>
            <p className="font-sans text-[10px] uppercase tracking-[0.6em] text-stone-400 font-black">Aesthetic Intelligence System</p>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-sm border border-stone-100 dark:border-stone-800 shadow-2xl space-y-10">
          <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl italic text-nous-text dark:text-white">Anchor Your Identity.</h2>
            <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Establish your sovereign registry link</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2">
                  <User size={10} /> Sovereign Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif italic text-stone-300 text-xl">@</span>
                  <input 
                    type="text" 
                    value={handle}
                    onChange={e => setHandle(e.target.value.toLowerCase())}
                    placeholder="yourname"
                    className="w-full bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-stone-800 p-4 pl-10 font-serif text-xl italic focus:outline-none focus:border-emerald-500 transition-all rounded-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2">
                    <Key size={10} /> AI Studio API Key
                  </label>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-sans text-[7px] uppercase tracking-widest font-black text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    Get Key <ExternalLink size={8} />
                  </a>
                </div>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-stone-800 p-4 font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all rounded-sm"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowKeyInfo(!showKeyInfo)}
                  className="flex items-center gap-1.5 font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <Info size={10} /> Why an API Key?
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showKeyInfo && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-stone-50 dark:bg-black/40 border border-stone-100 dark:border-stone-800 rounded-sm text-[10px] font-serif italic text-stone-500 leading-relaxed">
                    Mimi uses your own Google AI quota to ensure sovereign, high-fidelity generation without corporate throttling. Your key serves as your unique password and is stored only on your device.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {authError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm text-[10px] font-sans uppercase tracking-widest font-black text-red-500 text-center">
                {authError}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting || !handle || !apiKey}
              className="w-full py-6 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[11px] uppercase tracking-[0.5em] font-black shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {isSubmitting ? 'Anchoring...' : 'Manifest Identity'}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100 dark:border-stone-800" /></div>
            <div className="relative flex justify-center"><span className="px-4 bg-white dark:bg-stone-900 font-sans text-[7px] uppercase tracking-widest text-stone-300 font-black">Or</span></div>
          </div>

          <button 
            onClick={() => login()}
            className="w-full py-4 border border-stone-100 dark:border-stone-800 rounded-full font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 hover:text-nous-text dark:hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <Globe size={14} /> Continue with Google
          </button>
        </div>

        <div className="text-center space-y-4">
          <p className="font-serif italic text-xs text-stone-500">"The key is the bridge between your mind and the Oracle."</p>
          <div className="flex justify-center gap-6 opacity-30">
            <Shield size={14} />
            <Globe size={14} />
            <Zap size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};
