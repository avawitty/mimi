
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ZapOff, Fingerprint } from 'lucide-react';

export const ValidationLegend: React.FC = () => {
  return (
    <motion.div 
      className="clinical-legend absolute -bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[320px] z-[5000]"
      initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
    >
      <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-black/5 dark:border-white/10 p-5 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col gap-4 overflow-hidden relative group/legend">
        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover/legend:rotate-0 transition-transform duration-700">
          <Fingerprint size={48} />
        </div>

        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
            <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black text-stone-400">The Audit Key</span>
          </div>
          <span className="font-mono text-[7px] uppercase text-stone-300">Ref: CL-099</span>
        </div>
        
        <div className="space-y-3">
          <motion.div 
            whileHover={{ x: 5 }}
            className="flex items-center gap-4 cursor-default"
          >
            <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            <div className="flex flex-col">
               <span className="font-sans text-[7px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400">Structural Alignment</span>
               <span className="font-serif italic text-[11px] text-stone-500 leading-none">The fragment adheres to simulation logic.</span>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ x: 5 }}
            className="flex items-center gap-4 cursor-default"
          >
            <div className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
            <div className="flex flex-col">
               <span className="font-sans text-[7px] uppercase tracking-widest font-black text-red-600 dark:text-red-400">Archival Dissonance</span>
               <span className="font-serif italic text-[11px] text-stone-500 leading-none">Recalibration required for manifestation.</span>
            </div>
          </motion.div>
        </div>

        <div className="pt-2 flex justify-center opacity-30">
          <p className="font-serif italic text-[9px] text-stone-400">“Validation is a requirement of form.”</p>
        </div>
      </div>
    </motion.div>
  );
};
