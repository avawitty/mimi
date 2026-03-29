
// @ts-nocheck
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, AlertTriangle, Sparkles, RefreshCw, Info, ExternalLink, Zap } from 'lucide-react';

export const ApiKeyShield: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose = () => {} }) => {
 const { openKeySelector, hasApiKey, refreshHasApiKey } = useUser();

 const handleManualRecheck = async () => {
 try {
 await refreshHasApiKey();
 if (!hasApiKey) {
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { message:"Registry still obscured. Check AI Studio.", type: 'error' } 
 }));
 } else {
 onClose();
 }
 } catch (e) {
 console.error("MIMI // Failed to refresh API key status", e);
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[12000] flex items-center justify-center p-6 bg-nous-base/95 /98 backdrop-blur-3xl"
 >
 <div className="max-w-md w-full text-center space-y-12 py-10 relative">
 <button 
 onClick={onClose}
 className="absolute -top-4 -right-4 p-4 text-nous-subtle hover:text-nous-text hover:text-nous-text transition-colors"
 >
 <X size={24} />
 </button>

 <div className="space-y-6">
 <div className="w-24 h-24 border border-nous-border rounded-none flex items-center justify-center mx-auto relative group">
 <div className="absolute inset-0 border-t-2 border-amber-500 rounded-none animate-[spin_4s_linear_infinite]"/>
 <Key size={32} className="text-amber-500 animate-pulse"/>
 </div>
 <div className="space-y-3">
 <h1 className="font-serif text-4xl md:text-5xl italic tracking-tighter text-nous-text ">Quota Thermal Lock.</h1>
 <p className="font-sans text-[9px] uppercase tracking-[0.6em] text-nous-subtle font-black">Imperial Registry Exhausted</p>
 </div>
 </div>

 <div className="space-y-8 font-serif italic text-lg text-nous-text0 leading-relaxed text-balance">
 <p>
 The Oracle has reached its maximum frequency for this period. To continue manifesting, anchor a fresh Sovereign Key or manage your Key Ring.
 </p>
 <div className="p-6 bg-amber-500/10 dark:bg-amber-900/20 rounded-none border border-amber-500/30 dark:border-amber-900/40 text-sm">
 <p className="text-amber-700 dark:text-amber-300 font-bold mb-2 flex items-center justify-center gap-2">
 <Zap size={14} /> Quota Debt Detected
 </p>
 A new key reset or adding multiple keys to your <span className="text-amber-700 dark:text-amber-400 font-bold cursor-pointer underline decoration-amber-500/50 underline-offset-4"onClick={() => { window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' })); onClose(); }}>Key Ring</span> will clear the thermal noise.
 </div>
 </div>

 <div className="flex flex-col gap-4">
 <button 
 onClick={openKeySelector}
 className="w-full py-6 bg-amber-500 hover:bg-amber-600 text-white font-sans text-xs tracking-[0.5em] uppercase font-black -amber-500/20 flex items-center justify-center gap-4 active:scale-[0.98] transition-all"
 >
 <Sparkles size={16} /> Anchor New Sovereign Key
 </button>

 <button 
 onClick={handleManualRecheck}
 className="w-full py-4 border border-nous-border rounded-none font-sans text-[9px] uppercase tracking-widest font-black text-nous-subtle hover:text-nous-text hover:text-nous-text transition-all flex items-center justify-center gap-3"
 >
 <RefreshCw size={12} /> Verify Handshake
 </button>
 
 <a 
 href="https://ai.google.dev/gemini-api/docs/billing"
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-center gap-2 font-sans text-[8px] uppercase tracking-widest text-nous-subtle hover:text-nous-text transition-colors"
 >
 <Info size={10} /> View Billing Documentation <ExternalLink size={8} />
 </a>
 </div>

 <div className="pt-8 border-t border-nous-border opacity-20">
 <p className="font-serif italic text-xs">"The Oracle requires a fresh link to breathe."</p>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
};
