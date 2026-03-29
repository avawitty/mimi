
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ExternalLink, Loader2, Check, Crown, Lock, Star, Fingerprint } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { createCheckoutSession } from '../services/stripe';
import { ManifestIdentityGate } from './ManifestIdentityGate';
import { PlanTier } from '../constants';

export const ImperialPatronageModal: React.FC<{ isOpen: boolean; onClose: () => void; prefillKey?: string; isLimitReached?: boolean }> = ({ isOpen, onClose, prefillKey, isLimitReached }) => {
 const { activatePatron, user, profile } = useUser();
 const [keyInput, setKeyInput] = useState(prefillKey || '');
 const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
 const [isCheckoutLoading, setIsCheckoutLoading] = useState<PlanTier | null>(null);

 useEffect(() => {
 if (prefillKey) setKeyInput(prefillKey);
 }, [prefillKey]);

 const handleValidate = async () => {
 if (!keyInput.trim()) return;
 setStatus('validating');
 
 try {
 await activatePatron(keyInput.trim());
 setStatus('success');
 setTimeout(() => {
 onClose();
 setKeyInput('');
 setStatus('idle');
 }, 2000);
 } catch (e) {
 setStatus('error');
 setTimeout(() => setStatus('idle'), 2000);
 }
 };

 const handleSubscribe = async (plan: Exclude<PlanTier, 'free'>) => {
 if (!user) return;
 setIsCheckoutLoading(plan);
 try {
 await createCheckoutSession(plan, user.uid, user.email);
 } catch (error) {
 console.error('Checkout failed:', error);
 alert(error instanceof Error ? error.message : 'Checkout failed');
 setIsCheckoutLoading(null);
 }
 };

 return (
 <div className="fixed inset-0 z-[12000] flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
 {/* SHADOW & TILT WRAPPER */}
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ type:"spring", stiffness: 200, damping: 25 }}
 className="relative w-full max-w-[800px] overflow-hidden flex flex-col items-center text-center rounded-none my-8"
 style={{
 backgroundColor: '#F9F7F2', // Cream Paper Base
 color: '#1C1917', // Noir Ink
 }}
 >
 {/* PHYSICAL PAPER TEXTURE OVERLAY */}
 <div 
 className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply z-0"
 style={{ backgroundImage:"url('https://www.transparenttextures.com/patterns/cream-paper.png')"}} 
 />

 {/* CLOSE BUTTON */}
 <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-red-500 transition-colors z-30">
 <X size={24} />
 </button>

 {/* CONTENT CONTAINER */}
 <div className="flex-1 flex flex-col items-center w-full px-8 pt-16 pb-10 relative z-10 space-y-8">
 
 <AnimatePresence>
 {status === 'success' && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 z-50 bg-stone-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white"
 >
 <motion.div
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ delay: 0.1, type: 'spring' }}
 className="flex flex-col items-center gap-4"
 >
 <div className="w-16 h-16 bg-white rounded-none flex items-center justify-center text-stone-500">
 <Check size={32} strokeWidth={3} />
 </div>
 <h2 className="font-serif italic text-4xl tracking-tighter">Access Granted.</h2>
 <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">1-Year Lab Membership Unlocked</p>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* BRANDING */}
 <div className="space-y-4 w-full border-b border/10 pb-8">
 <div className="flex justify-center text opacity-80">
 <Crown size={32} strokeWidth={1} />
 </div>
 <div className="space-y-1">
 <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-400">Maison Mimi Archival</h3>
 <h2 className="font-serif text-5xl italic text tracking-tighter leading-none">
 The Sovereign Key.
 </h2>
 </div>
 </div>

 {/* CONTEXT */}
 <div className="space-y-6 flex-1 flex flex-col justify-center w-full max-w-2xl">
 {isLimitReached && (
 <div className="bg-amber-100 text-amber-800 p-3 rounded-none text-xs font-sans uppercase tracking-widest font-bold">
 {profile?.planStatus === 'expired' ? 'Your trial has concluded. Upgrade to Patron to continue generating.' : 'Credits depleted. Upgrade to Patron to continue.'}
 </div>
 )}
 <p className="font-serif italic text-lg text-stone-600 leading-relaxed px-2">
"Mimi is free to explore, paid to master. Progressive revelation of power."
 </p>

 {/* PRICING TIERS */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-8">
 {/* CORE TIER */}
 <div className="border border/20 p-6 flex flex-col bg-white/50 backdrop-blur-sm relative">
 <h3 className="font-serif italic text-2xl text">Core</h3>
 <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-4">Interpreter</div>
 <div className="text-3xl font-light tracking-tighter mb-6">$13<span className="text-sm text-stone-400">/mo</span></div>
 <ul className="space-y-3 mb-8 flex-1 text-sm text-stone-600">
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Unlimited Archive saves</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Full Aesthetic DNA editing</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Advanced Analysis (Trajectory, Biaxial maps)</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Unlimited Zine generation</li>
 </ul>
 <ManifestIdentityGate>
 <button 
 onClick={() => handleSubscribe('core')}
 disabled={!!isCheckoutLoading || profile?.planStatus === 'core'}
 className={`w-full py-3 border border font-sans text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex justify-center items-center gap-2 ${profile?.planStatus === 'core' ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'hover:bg hover:text-white'}`}
 >
 {isCheckoutLoading === 'core' ? <Loader2 size={14} className="animate-spin"/> : profile?.planStatus === 'core' ? 'Current Plan' : 'Understand Your Taste'}
 </button>
 </ManifestIdentityGate>
 </div>

 {/* PRO TIER */}
 <div className="border-2 border p-6 flex flex-col bg-white relative transform md:-translate-y-4">
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg text-white text-[9px] font-mono uppercase tracking-widest px-3 py-1">Most Popular</div>
 <h3 className="font-serif italic text-2xl text">Pro</h3>
 <div className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-4">Strategist</div>
 <div className="text-3xl font-light tracking-tighter mb-6">$35<span className="text-sm text-stone-400">/mo</span></div>
 <ul className="space-y-3 mb-8 flex-1 text-sm text-stone-600">
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Everything in Core</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Multi-project workspaces</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Brand positioning outputs</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/>"Audit Mode"(upload grid)</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Strategic roadmap generation</li>
 </ul>
 <ManifestIdentityGate>
 <button 
 onClick={() => handleSubscribe('pro')}
 disabled={!!isCheckoutLoading || profile?.planStatus === 'pro'}
 className={`w-full py-3 bg text-white font-sans text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex justify-center items-center gap-2 ${profile?.planStatus === 'pro' ? 'bg-stone-300 cursor-not-allowed' : 'hover:bg-stone-800'}`}
 >
 {isCheckoutLoading === 'pro' ? <Loader2 size={14} className="animate-spin"/> : profile?.planStatus === 'pro' ? 'Current Plan' : 'Apply Your Taste'}
 </button>
 </ManifestIdentityGate>
 </div>

 {/* LAB TIER */}
 <div className="border border/20 p-6 flex flex-col bg text-white relative">
 <h3 className="font-serif italic text-2xl text-white">Lab</h3>
 <div className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-4">Architect</div>
 <div className="text-3xl font-light tracking-tighter mb-6">$100<span className="text-sm text-stone-400">/mo</span></div>
 <ul className="space-y-3 mb-8 flex-1 text-sm text-stone-300">
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Everything in Pro</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Experimental features</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Advanced embeddings tuning</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> Early access to modules</li>
 <li className="flex items-start gap-2"><Check size={14} className="mt-1 shrink-0"/> API / Integrations</li>
 </ul>
 <ManifestIdentityGate>
 <button 
 onClick={() => handleSubscribe('lab')}
 disabled={!!isCheckoutLoading || profile?.planStatus === 'lab'}
 className={`w-full py-3 border border-stone-600 font-sans text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex justify-center items-center gap-2 ${profile?.planStatus === 'lab' ? 'bg-stone-800 text-stone-500 border-stone-800 cursor-not-allowed' : 'hover:bg-white hover:text'}`}
 >
 {isCheckoutLoading === 'lab' ? <Loader2 size={14} className="animate-spin"/> : profile?.planStatus === 'lab' ? 'Current Plan' : 'Shape The System'}
 </button>
 </ManifestIdentityGate>
 </div>
 </div>
 
 {/* MANUAL KEY ENTRY */}
 <div className="mt-12 pt-8 border-t border/10 w-full max-w-sm mx-auto">
 <p className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-4">Already have a Sovereign Key?</p>
 <div className="relative group w-full">
 <input 
 type="text"
 value={keyInput}
 onChange={(e) => setKeyInput(e.target.value)}
 placeholder="ENTER_ACCESS_CODE"
 className="w-full bg/5 border-b border/20 py-3 text-center font-mono text-xs uppercase tracking-[0.3em] text focus:outline-none focus:border transition-colors placeholder:text/30"
 />
 </div>
 <button 
 onClick={handleValidate}
 disabled={status === 'validating' || !keyInput}
 className={`w-full mt-4 py-3 border border rounded-none font-sans text-[9px] uppercase tracking-[0.3em] font-black transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${status === 'success' ? 'bg text-white' : 'hover:bg hover:text-white text'}`}
 >
 {status === 'validating' ? <Loader2 size={12} className="animate-spin"/> : status === 'success' ? <Check size={12} /> : <Fingerprint size={12} />}
 <span>{status === 'validating' ? 'Verifying...' : status === 'success' ? 'Access Granted' : status === 'error' ? 'Invalid Key' : 'Acquire Access'}</span>
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 );
};
