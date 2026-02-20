
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ExternalLink, Loader2, Check, Crown, Lock, Star, Fingerprint } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export const ImperialPatronageModal: React.FC<{ isOpen: boolean; onClose: () => void; prefillKey?: string }> = ({ isOpen, onClose, prefillKey }) => {
  const { toggleFeature } = useUser();
  const [keyInput, setKeyInput] = useState(prefillKey || '');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');

  useEffect(() => {
      if (prefillKey) setKeyInput(prefillKey);
  }, [prefillKey]);

  const handleValidate = () => {
    if (!keyInput.trim()) return;
    setStatus('validating');
    
    // Simulating validation delay
    setTimeout(() => {
        // Validation logic: Checks for specific "Gold" keys, Stripe patterns, or the new Minted Key format
        const cleanKey = keyInput.trim();
        const isValid = 
            cleanKey === 'MIMI-GOLD' || 
            cleanKey.startsWith('sk_') || 
            cleanKey.includes('PATRON') ||
            cleanKey.startsWith('MIMI-IMP-'); // New Minted Key Format

        if (isValid) {
            setStatus('success');
            toggleFeature('proposal'); // Example: Unlocks the Proposal feature
            
            // Persist locally for immediate gratification
            localStorage.setItem('mimi_patron_status', 'active');
            
            setTimeout(() => {
                onClose();
                setKeyInput('');
                setStatus('idle');
            }, 2000);
        } else {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-md">
      {/* SHADOW & TILT WRAPPER */}
      <motion.div 
        initial={{ y: -50, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative w-full max-w-[360px] aspect-[9/16] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center text-center rounded-sm"
        style={{
            backgroundColor: '#F9F7F2', // Cream Paper Base
            color: '#1C1917', // Noir Ink
        }}
      >
        {/* PHYSICAL PAPER TEXTURE OVERLAY */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply z-0"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }} 
        />
        <div 
            className="absolute inset-0 pointer-events-none opacity-10 mix-blend-multiply z-0"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/noise.png')" }} 
        />

        {/* HANG TAG HOLE */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
            <div className="w-4 h-4 bg-[#2a2826] rounded-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] border border-[#1C1917]/20" />
            {/* Thread Visual */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1px] h-32 bg-stone-400/50" />
        </div>

        {/* CLOSE BUTTON */}
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-300 hover:text-red-500 transition-colors z-30">
            <X size={18} />
        </button>

        {/* CONTENT CONTAINER */}
        <div className="flex-1 flex flex-col items-center w-full px-8 pt-20 pb-10 relative z-10 space-y-8">
            
            {/* BRANDING */}
            <div className="space-y-4 w-full border-b border-[#1C1917]/10 pb-8">
                <div className="flex justify-center text-[#1C1917] opacity-80">
                    <Crown size={32} strokeWidth={1} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] text-stone-400">Maison Mimi Archival</h3>
                    <h2 className="font-serif text-4xl italic text-[#1C1917] tracking-tighter leading-none">
                        The Sovereign<br/>Key.
                    </h2>
                </div>
            </div>

            {/* CONTEXT */}
            <div className="space-y-6 flex-1 flex flex-col justify-center w-full">
                <p className="font-serif italic text-sm text-stone-600 leading-relaxed px-2">
                    "Patronage unlocks deeper resonance: 4K Export, Unlimited Storage, and priority Agent processing."
                </p>

                <div className="relative group w-full max-w-[200px] mx-auto">
                    <input 
                        type="text" 
                        id="accessCode"
                        name="accessCode"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="ACCESS_CODE"
                        className="w-full bg-[#1C1917]/5 border-b border-[#1C1917]/20 py-3 text-center font-mono text-xs uppercase tracking-[0.3em] text-[#1C1917] focus:outline-none focus:border-[#1C1917] transition-colors placeholder:text-[#1C1917]/30"
                    />
                </div>
                
                <button 
                    onClick={handleValidate}
                    disabled={status === 'validating' || !keyInput}
                    className={`w-full py-4 border border-[#1C1917] rounded-sm font-sans text-[9px] uppercase tracking-[0.3em] font-black transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${status === 'success' ? 'bg-[#1C1917] text-white' : 'hover:bg-[#1C1917] hover:text-white text-[#1C1917]'}`}
                >
                    {status === 'validating' ? <Loader2 size={12} className="animate-spin" /> : status === 'success' ? <Check size={12} /> : <Fingerprint size={12} />}
                    <span>{status === 'validating' ? 'Verifying...' : status === 'success' ? 'Access Granted' : status === 'error' ? 'Invalid Key' : 'Acquire Access'}</span>
                </button>
            </div>

            {/* FOOTER / STRIPE LINK */}
            <div className="mt-auto w-full pt-6 border-t border-[#1C1917]/10 flex flex-col gap-3">
                <div className="flex justify-between items-center text-[7px] font-mono text-stone-400 uppercase tracking-widest px-2">
                    <span>Ref: IMP-001</span>
                    <span>Status: {status === 'success' ? 'ACTIVE' : 'WAITING'}</span>
                </div>
                <a 
                    href="https://buy.stripe.com/3cI4gtekA8L36kX3NDaEE00" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 font-serif italic text-xs text-stone-500 hover:text-[#1C1917] hover:underline decoration-[#1C1917]/30 underline-offset-4 transition-all"
                >
                    Purchase Key via Stripe <ExternalLink size={8} />
                </a>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
