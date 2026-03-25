import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { ArrowRight, Check, Key, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '../services/stripe';
import { PlanTier } from '../constants';
import '../types';

export const MembershipView: React.FC = () => {
 const { user, profile, upgradePlan } = useUser();
 const [secretCode, setSecretCode] = useState('');
 const [showSecretInput, setShowSecretInput] = useState(false);

 const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

 const handleSecretSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user) return;
 try {
 const { applyPromoCode } = await import('../services/membershipPipeline');
 await applyPromoCode(user.uid, secretCode);
 // Also update local profile state
 if (profile) {
 await upgradePlan('lab', 'year');
 }
 setShowSuccessOverlay(true);
 setTimeout(() => {
 setShowSuccessOverlay(false);
 setShowSecretInput(false);
 setSecretCode('');
 }, 2500);
 } catch (error) {
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Invalid Code.", type: 'error' } }));
 }
 };

 return (
 <div className="min-h-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-6 md:p-12 overflow-y-auto relative">
 <AnimatePresence>
 {showSuccessOverlay && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] bg-stone-500/90 backdrop-blur-md flex flex-col items-center justify-center text-white"
 >
 <motion.div
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ delay: 0.1, type: 'spring' }}
 className="flex flex-col items-center gap-6"
 >
 <div className="w-20 h-20 bg-white rounded-none flex items-center justify-center text-stone-500">
 <Check size={40} strokeWidth={3} />
 </div>
 <h2 className="font-serif italic text-5xl md:text-7xl tracking-tighter">Access Granted.</h2>
 <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-80">1-Year Lab Membership Unlocked</p>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 <div className="max-w-6xl mx-auto">
 <div className="mb-16 text-center relative">
 <h1 className="font-serif italic text-5xl md:text-7xl tracking-tighter mb-4">Membership.</h1>
 <div className="flex items-center justify-center gap-2">
 <p className="font-sans text-sm uppercase tracking-[0.2em] text-stone-500 font-bold">
 Elevate your aesthetic practice
 </p>
 </div>

 <div className="mt-8 flex flex-col items-center">
 <button 
 onClick={() => setShowSecretInput(!showSecretInput)} 
 className="font-sans text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-2"
 >
 <Key size={10} /> Have an access code?
 </button>
 <AnimatePresence>
 {showSecretInput && (
 <motion.form 
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 onSubmit={handleSecretSubmit}
 className="mt-4 flex justify-center items-center gap-2 overflow-hidden"
 >
 <input 
 type="text"
 value={secretCode}
 onChange={e => setSecretCode(e.target.value)}
 placeholder="ENTER CODE (e.g. MIMIMUSE)"
 className="bg-transparent border-b border-stone-300 dark:border-stone-700 px-4 py-2 text-center font-mono text-xs uppercase tracking-widest focus:outline-none focus:border-stone-800 dark:focus:border-stone-300 dark:focus:border-stone-400 w-64"
 autoFocus
 />
 <button 
 type="submit"
 disabled={!secretCode}
 className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors disabled:opacity-50"
 >
 <ArrowRight size={16} />
 </button>
 </motion.form>
 )}
 </AnimatePresence>
 </div>
 
 {profile?.plan && profile.plan !== 'free' && (
 <div className="mt-12 inline-flex flex-col items-center p-8 bg-white dark:bg-stone-900 rounded-none border border-stone-200 dark:border-stone-800">
 <span className="font-sans text-[10px] uppercase tracking-widest text-stone-500 mb-2">Current Tier</span>
 <span className={`font-serif italic text-3xl mb-6 ${
 profile.plan === 'lab' ? 'text-stone-600 dark:text-stone-400' :
 profile.plan === 'pro' ? 'text-purple-600 dark:text-purple-400' :
 'text-orange-600 dark:text-orange-400'
 }`}>
 Mimi {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
 {profile.subscriptionInterval === 'year' && <span className="text-sm ml-2 text-stone-500 font-sans not-italic">(Annual)</span>}
 </span>
 <a 
 href="https://billing.stripe.com/p/login/3cI4gtekA8L36kX3NDaEE00"
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-none font-sans text-xs uppercase tracking-widest font-bold hover:bg-stone-800 dark:hover:bg-white transition-colors"
 >
 Manage Subscription <ArrowRight size={14} />
 </a>
 <p className="mt-4 font-sans text-[10px] text-stone-500 max-w-xs text-center">
 Upgrade, downgrade, or cancel your subscription at any time through the customer portal.
 </p>
 </div>
 )}
 </div>

 <div className="w-full max-w-5xl mx-auto mt-16">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 px-4">
 
 {/* Core Tier - Hanger Tag */}
 <div className="flex flex-col items-center group">
 {/* String */}
 <div className="w-px h-16 bg-stone-300 dark:bg-stone-700 group-hover:h-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
 {/* Tag */}
 <div className="w-full max-w-[320px] bg dark:bg border border-stone-200 dark:border-stone-800 rounded-none rounded-none p-8 pt-16 flex flex-col items-center text-center relative group-hover:-translate-y-4 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
 {/* Hole */}
 <div className="absolute top-6 w-4 h-4 rounded-none bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800"></div>
 
 <h3 className="font-serif italic text-4xl mb-4 text-stone-800 dark:text-stone-200">Core</h3>
 <div className="w-8 h-px bg-stone-300 dark:bg-stone-700 mb-6"></div>
 <p className="font-sans text-xs leading-relaxed text-stone-500 mb-12 flex-grow px-4">
 Unlock full aesthetic analysis, unlimited archive, and zine generation. Understand your taste.
 </p>
 <a 
 href={user ? `https://buy.stripe.com/7sY3cp4K02mFdNpbg5aEE04?client_reference_id=${user.uid}&prefilled_email=${encodeURIComponent(user.email || '')}` : 'https://buy.stripe.com/7sY3cp4K02mFdNpbg5aEE04'}
 className="w-full py-4 px-4 bg-transparent border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-none font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-center hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-colors"
 >
 Select Core
 </a>
 </div>
 </div>

 {/* Pro Tier - Hanger Tag */}
 <div className="flex flex-col items-center group">
 {/* String */}
 <div className="w-px h-16 bg-stone-300 dark:bg-stone-700 group-hover:h-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
 {/* Tag */}
 <div className="w-full max-w-[320px] bg dark:bg border border-stone-200 dark:border-stone-800 rounded-none rounded-none p-8 pt-16 flex flex-col items-center text-center relative group-hover:-translate-y-4 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
 {/* Hole */}
 <div className="absolute top-6 w-4 h-4 rounded-none bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800"></div>
 
 <h3 className="font-serif italic text-4xl mb-4 text-stone-800 dark:text-stone-200">Pro</h3>
 <div className="w-8 h-px bg-stone-300 dark:bg-stone-700 mb-6"></div>
 <p className="font-sans text-xs leading-relaxed text-stone-500 mb-12 flex-grow px-4">
 Strategic tools for creators and brands. Advanced analysis, audits, and positioning systems.
 </p>
 <a 
 href={user ? `https://buy.stripe.com/fZufZb7Wc8L324H83TaEE03?client_reference_id=${user.uid}&prefilled_email=${encodeURIComponent(user.email || '')}` : 'https://buy.stripe.com/fZufZb7Wc8L324H83TaEE03'}
 className="w-full py-4 px-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-none font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-center hover:bg-stone-800 dark:hover:bg-white transition-colors"
 >
 Select Pro
 </a>
 </div>
 </div>

 {/* Lab Tier - Hanger Tag */}
 <div className="flex flex-col items-center group">
 {/* String */}
 <div className="w-px h-16 bg-stone-500/50 group-hover:h-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
 {/* Tag */}
 <div className="w-full max-w-[320px] bg-stone-900 dark:bg border border-stone-800 dark:border-stone-800 rounded-none rounded-none p-8 pt-16 flex flex-col items-center text-center relative group-hover:-translate-y-4 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
 {/* Hole */}
 <div className="absolute top-6 w-4 h-4 rounded-none bg-stone-50 dark:bg-stone-950 border border-stone-800"></div>
 
 <h3 className="font-serif italic text-4xl mb-4 text-stone-400">Lab ✧</h3>
 <div className="w-8 h-px bg-stone-500/30 mb-6"></div>
 <p className="font-sans text-xs leading-relaxed text-stone-400 mb-12 flex-grow px-4">
 Experimental access. Early features, advanced systems, and the edge of aesthetic intelligence.
 </p>
 <div className="flex flex-col gap-3 w-full">
 <a 
 href={user ? `https://buy.stripe.com/28E00dccsd1jcJlck9aEE02?client_reference_id=${user.uid}&prefilled_email=${encodeURIComponent(user.email || '')}` : 'https://buy.stripe.com/28E00dccsd1jcJlck9aEE02'}
 className="w-full py-4 px-4 bg-stone-500 text-stone-900 rounded-none font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-center hover:bg-stone-400 transition-colors"
 >
 Monthly
 </a>
 <a 
 href={user ? `https://buy.stripe.com/8x2dR3a4k8L3eRtac1aEE01?client_reference_id=${user.uid}&prefilled_email=${encodeURIComponent(user.email || '')}` : 'https://buy.stripe.com/8x2dR3a4k8L3eRtac1aEE01'}
 className="w-full py-4 px-4 bg-transparent border border-stone-500/30 text-stone-400 rounded-none font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-center hover:bg-stone-500/10 transition-colors"
 >
 Annual
 </a>
 </div>
 </div>
 </div>

 </div>
 </div>
 </div>
 </div>
 );
};
