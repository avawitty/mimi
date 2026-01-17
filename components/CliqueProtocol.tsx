
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Anchor, Sparkles, UserPlus, Fingerprint, Loader2, Check, Radio } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export const CliqueProtocol: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useUser();
  const [signalKey, setSignalKey] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAnchorMuse = async () => {
    if (!signalKey.trim() || !profile) return;
    setIsBinding(true);
    
    // Simulate spectral handshake
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const updatedSynced = [...(profile.syncedUsers || []), signalKey.trim()];
      await updateProfile({
        ...profile,
        syncedUsers: updatedSynced
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSignalKey('');
        onClose();
      }, 2000);
    } catch (e) {
      console.error("MUSE_ANCHOR_FAILURE");
    } finally {
      setIsBinding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-white/40 dark:bg-black/40 backdrop-blur-3xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-[0_50px_100px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden"
      >
        <div className="p-10 md:p-14 space-y-12">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="font-serif text-4xl italic tracking-tighter">Clique Protocol.</h2>
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-400 font-black">Anchoring New Muses</p>
            </div>
            <button onClick={onClose} className="p-2 text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4 p-6 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-xl">
               <div className="p-3 bg-white dark:bg-stone-900 rounded-full shadow-sm">
                  <Fingerprint size={20} className="text-nous-text dark:text-white" />
               </div>
               <div className="flex flex-col">
                  <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Your Signal Key</span>
                  <span className="font-mono text-xs text-nous-text dark:text-white select-all">{profile?.uid.slice(0, 12)}...</span>
               </div>
            </div>

            <div className="space-y-4">
              <label className="font-sans text-[9px] uppercase tracking-[0.5em] text-stone-500 font-black block">Enter Muse Key</label>
              <input 
                type="text" 
                value={signalKey}
                onChange={(e) => setSignalKey(e.target.value)}
                placeholder="Spectral Signature"
                className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-4 font-serif text-2xl italic focus:outline-none focus:border-nous-text dark:focus:border-white transition-colors"
              />
            </div>

            <button 
              onClick={handleAnchorMuse}
              disabled={!signalKey.trim() || isBinding || success}
              className={`w-full py-6 flex items-center justify-center gap-4 font-sans text-xs tracking-[0.6em] uppercase font-black shadow-2xl transition-all active:scale-95 rounded-full ${success ? 'bg-emerald-500 text-white' : 'bg-nous-text dark:bg-white text-white dark:text-black'}`}
            >
              {isBinding ? <Loader2 size={16} className="animate-spin" /> : success ? <Check size={16} /> : <Anchor size={16} />}
              <span>{isBinding ? 'Calibrating Sync' : success ? 'Muse Anchored' : 'Anchor Muse'}</span>
            </button>
          </div>

          <div className="pt-8 border-t border-stone-100 dark:border-stone-800 text-center space-y-4">
            <div className="flex items-center justify-center gap-3 opacity-20">
               <Radio size={12} />
               <div className="h-px w-12 bg-stone-400" />
               <Sparkles size={12} />
            </div>
            <p className="font-serif italic text-stone-400 text-xs">
              Muses can witness your **Broadcasting** refractions. Vaulted items remain clinical and private.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
