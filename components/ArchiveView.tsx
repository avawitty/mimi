
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Shelf } from './Shelf';
import { Pocket } from './Pocket';
import { ZineMetadata } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ArchiveViewProps {
  onSelectZine: (zine: ZineMetadata) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onSelectZine }) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'pocket'>('issues');

  return (
    <div className="w-full pt-32 md:pt-48 animate-fade-in transition-all duration-1000">
       
       <div className="px-12 md:px-24 mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-stone-100 dark:border-stone-800 pb-16">
           <div className="space-y-4">
               <h2 className="font-serif text-7xl md:text-9xl italic text-nous-text dark:text-nous-dark-text tracking-tighter luminescent-text leading-none">The Archive.</h2>
               <p className="font-sans text-[10px] uppercase tracking-[1em] text-stone-400 font-black">
                 {activeTab === 'issues' ? 'Manifestations of Form' : 'Curated Physical Debris'}
               </p>
           </div>

           <div className="flex gap-16">
               <button 
                 onClick={() => setActiveTab('issues')}
                 className={`font-sans text-[12px] uppercase tracking-[0.6em] pb-3 transition-all font-black border-b-2 ${activeTab === 'issues' ? 'text-nous-text dark:text-white border-nous-text dark:border-white' : 'text-stone-300 border-transparent hover:text-stone-500'}`}
               >
                  Authored
               </button>
               <button 
                 onClick={() => setActiveTab('pocket')}
                 className={`font-sans text-[12px] uppercase tracking-[0.6em] pb-3 transition-all font-black border-b-2 ${activeTab === 'pocket' ? 'text-nous-text dark:text-white border-nous-text dark:border-white' : 'text-stone-300 border-transparent hover:text-stone-500'}`}
               >
                  Curated
               </button>
           </div>
       </div>

       <div className="w-full min-h-[70vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'issues' ? (
               <motion.div key="issues" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8 }}>
                 <Shelf variant="personal" onSelectZine={onSelectZine} />
               </motion.div>
            ) : (
               <motion.div key="pocket" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8 }}>
                 <Pocket onSelectZine={onSelectZine} />
               </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
};
