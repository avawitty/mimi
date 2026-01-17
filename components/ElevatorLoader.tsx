
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PONDERS = [
  "Manifesting thought.",
  "Binding structural omens.",
  "Developing the refraction.",
  "Curating the void.",
  "Calibrating chromatic logic.",
  "Assembling the archive."
];

interface ElevatorLoaderProps {
  onComplete?: () => void;
}

export const ElevatorLoader: React.FC<ElevatorLoaderProps> = ({ onComplete }) => {
  const [ponderIndex, setPonderIndex] = useState(0);

  useEffect(() => {
    const ponderTimer = setInterval(() => {
      setPonderIndex(prev => (prev + 1) % PONDERS.length);
    }, 3000);

    // Minimum time spent in the elevator to appreciate the curation ritual.
    const completionTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5500); 

    return () => {
      clearInterval(ponderTimer);
      clearTimeout(completionTimer);
    };
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-nous-base dark:bg-stone-950 text-nous-text transition-colors"
    >
      <div className="relative w-full max-w-xl text-center px-8">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mx-auto mb-10 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          />

          <AnimatePresence mode="wait">
            <motion.h2 
              key={ponderIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="font-serif text-3xl md:text-5xl italic leading-tight text-nous-text dark:text-white tracking-tighter mb-12 h-20 flex items-center justify-center"
            >
              "{PONDERS[ponderIndex]}"
            </motion.h2>
          </AnimatePresence>

          <div className="w-16 h-px bg-stone-100 dark:bg-stone-800 mx-auto overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full w-full bg-nous-text dark:bg-white"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <span className="font-sans text-[8px] uppercase tracking-[0.6em] text-stone-300 dark:text-stone-700 font-black">Issue Calibration</span>
          </div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute left-[15%] h-full w-px bg-black dark:bg-white" />
        <div className="absolute right-[15%] h-full w-px bg-black dark:bg-white" />
      </div>
    </motion.div>
  );
};
