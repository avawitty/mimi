import React from 'react';
import { motion } from 'framer-motion';
import { SovereignIdentityCardView } from './SovereignIdentityCardView';
import { TasteConstellation } from './TasteConstellation';
import { useUser } from '../contexts/UserContext';

export const TheOracle: React.FC = () => {
 const { profile } = useUser();

 if (!profile?.tasteProfile?.sovereignIdentity) {
 return (
 <div className="flex-1 flex items-center justify-center p-8 text-center text-nous-subtle italic font-serif h-full">
 The Oracle requires a Sovereign Identity Card to read your aesthetic horoscope.
 </div>
 );
 }

 return (
 <div className="flex flex-col h-full bg overflow-y-auto pb-32">
 <div className="p-6 pt-12">
 <motion.h1 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-3xl font-serif italic text-nous-text mb-2"
 >
 The Oracle
 </motion.h1>
 <motion.p 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="text-xs font-sans uppercase tracking-widest text-nous-subtle mb-8"
 >
 Your Daily Aesthetic Horoscope
 </motion.p>

 <div className="space-y-12">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
 className="flex justify-center"
 >
 <SovereignIdentityCardView card={profile.tasteProfile.sovereignIdentity} />
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="border-t border-white/10 pt-8"
 >
 <h2 className="text-xl font-serif italic text-nous-subtle mb-6 text-center">
 Taste Constellation
 </h2>
 <div className="h-[400px] w-full bg border border-nous-border overflow-hidden">
 <TasteConstellation />
 </div>
 </motion.div>
 </div>
 </div>
 </div>
 );
};
