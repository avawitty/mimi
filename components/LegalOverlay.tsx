
// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Scale, EyeOff } from 'lucide-react';

interface LegalOverlayProps {
 type: 'privacy' | 'terms' | null;
 onClose: () => void;
}

const LEGAL_CONTENT = {
 privacy: {
 title:"Privacy Refraction",
 subtitle:"The Zero-Extraction Mandate",
 sections: [
 {
 head:"Identity Sanctity",
 body:"Your debris (data) is yours. We do not sell your taste to the pedestrian masses. We merely store it in the vault so you may perceive yourself more clearly."
 },
 {
 head:"The Ghost Clause",
 body:"Anonymous users exist only in -memory (localStorage). Once you purge your cache, the machine forgets you. This is true digital death."
 },
 {
 head:"Swan Persistence",
 body:"Anchored identities (Google Auth) transmit data to the Cloud Registry. This data is encrypted and used solely for your personal archive and collective 'Social Floor' anonymized trends."
 }
 ]
 },
 terms: {
 title:"Terms of Performance",
 subtitle:"The Sovereign Contract",
 sections: [
 {
 head:"Conduct of the Muse",
 body:"You are responsible for the debris you manifest. Mimi is an editor, not a censor, but we decree that violence and harm are aesthetically wretched and grounds for vault suspension."
 },
 {
 head:"Structural Integrity",
 body:"Mimi is an experimental manifestation. We strive for permanence, but the void sometimes reclaims data. We are not liable for accidental deletions from the archives."
 },
 {
 head:"Intellectual Sovereignty",
 body:"You own your refractions. Mimi owns the machine that refines them. It is a partnership of velvet and logic."
 }
 ]
 }
};

export const LegalOverlay: React.FC<LegalOverlayProps> = ({ type, onClose }) => {
 if (!type) return null;
 const content = LEGAL_CONTENT[type];

 return (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[10000] flex items-center justify-center bg-nous-base/95 dark:bg-black/95 backdrop-blur-3xl p-6"
 >
 <div className="max-w-xl w-full">
 <div className="flex justify-between items-start mb-16">
 <div className="space-y-2">
 <h2 className="font-serif text-5xl italic tracking-tighter">{content.title}.</h2>
 <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-400 font-black">{content.subtitle}</p>
 </div>
 <button onClick={onClose} className="p-3 text-stone-300 hover:text-nous-text dark:hover:text-white transition-all">
 <X size={24} />
 </button>
 </div>

 <div className="space-y-12">
 {content.sections.map((s, i) => (
 <motion.section 
 key={i}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 className="space-y-4"
 >
 <div className="flex items-center gap-4">
 <div className="w-8 h-px bg-stone-200"/>
 <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-500">{s.head}</h3>
 </div>
 <p className="font-serif italic text-lg text-stone-600 dark:text-stone-400 leading-relaxed pl-12">
 {s.body}
 </p>
 </motion.section>
 ))}
 </div>

 <div className="mt-20 pt-8 border-t border-stone-100 dark:border-stone-900 text-center">
 <button onClick={onClose} className="font-sans text-[10px] uppercase tracking-[0.5em] font-black text-nous-text dark:text-white border-b border-current pb-1">I Decree Approval</button>
 </div>
 </div>
 </motion.div>
 );
};
