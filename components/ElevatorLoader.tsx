
// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Activity, Wifi, ShieldAlert, Wind, Terminal, Cpu } from 'lucide-react';

const PONDERS = [
  "Manifesting thought.",
  "Binding structural omens.",
  "Developing the refraction.",
  "Curating the void.",
  "Calibrating chromatic logic.",
  "Assembling the archive."
];

const DEEP_PONDERS = [
  "Architecting reasoning traces...",
  "Oscillating between clinical logic...",
  "Deducing semiotic provenance...",
  "Synthesizing high-concept debris...",
  "Anchoring existential fragments..."
];

interface ElevatorLoaderProps {
  onComplete?: () => void;
  onBypass?: () => void;
  isDeep?: boolean;
}

export const ElevatorLoader: React.FC<ElevatorLoaderProps> = ({ onComplete, onBypass, isDeep }) => {
  const [ponderIndex, setPonderIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showBypass, setShowBypass] = useState(false);
  const [statusLog, setStatusLog] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<string>("Initializing Hydraulic Pressure...");

  useEffect(() => {
    const handleShift = (e: any) => {
      const { reason } = e.detail;
      setStatusLog(reason === 'saturation' ? "Recalibrating Hydraulic Pressure..." : "Scrubbing Structural Debris...");
    };
    
    const handleTelemetry = (e: any) => {
      if (e.detail?.status) setTelemetry(e.detail.status);
    };

    window.addEventListener('mimi:frequency_shift', handleShift);
    window.addEventListener('mimi:telemetry_update', handleTelemetry);
    
    return () => {
      window.removeEventListener('mimi:frequency_shift', handleShift);
      window.removeEventListener('mimi:telemetry_update', handleTelemetry);
    };
  }, []);

  useEffect(() => {
    const ponderTimer = setInterval(() => {
      setPonderIndex(prev => (prev + 1) % (isDeep ? DEEP_PONDERS.length : PONDERS.length));
    }, 2500);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev < 60) return prev + 0.8;
        if (prev < 90) return prev + (90 - prev) * 0.03;
        if (prev < 99.9) return prev + (100 - prev) * 0.005;
        return 99.9;
      });
    }, 300);

    const bypassTimer = setTimeout(() => setShowBypass(true), 8000);

    return () => {
      clearInterval(ponderTimer);
      clearInterval(progressTimer);
      clearTimeout(bypassTimer);
    };
  }, [isDeep]);

  const activePonder = statusLog || (isDeep ? DEEP_PONDERS[ponderIndex] : PONDERS[ponderIndex]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-nous-base dark:bg-stone-950 text-nous-text transition-colors duration-1000"
    >
      <div className="relative w-full max-w-2xl text-center px-8 flex flex-col items-center">
          
          <div className="mb-12 flex items-center gap-6">
             <div className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-800" />
             <motion.div 
               animate={{ 
                 scale: [1, 1.4, 1], 
                 opacity: [0.3, 1, 0.3],
                 backgroundColor: isDeep ? ['#10B981', '#34D399', '#10B981'] : ['#ef4444', '#f59e0b', '#ef4444'] 
               }}
               transition={{ duration: 1.2, repeat: Infinity }}
               className={`w-2.5 h-2.5 rounded-full ${isDeep ? 'shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'shadow-[0_0_25px_rgba(239,68,68,0.5)]'}`}
             />
             <div className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-800" />
          </div>

          <div className="h-40 flex flex-col items-center justify-center space-y-8">
            <AnimatePresence mode="wait">
              <motion.h2 
                key={activePonder}
                initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                className="font-serif text-4xl md:text-6xl italic leading-tight text-nous-text dark:text-white tracking-tighter"
              >
                "{activePonder}"
              </motion.h2>
            </AnimatePresence>
            
            <div className="flex items-center gap-3 px-5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full shadow-inner">
               <Terminal size={12} className="text-emerald-500 animate-pulse" />
               <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">{telemetry}</span>
            </div>
          </div>

          <div className="w-72 h-[1px] bg-stone-100 dark:bg-stone-900 mx-auto mt-20 overflow-hidden relative rounded-full">
            <motion.div 
              className={`absolute top-0 left-0 h-full ${isDeep ? 'bg-emerald-500' : 'bg-nous-text dark:bg-white'}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <div className="mt-12 flex flex-col items-center gap-4">
             <div className="flex items-center gap-4">
                <Activity size={10} className={`text-stone-300 dark:text-stone-700 ${progress > 90 ? 'animate-pulse' : ''}`} />
                <span className="font-sans text-[7px] md:text-[8px] uppercase tracking-[0.8em] text-stone-300 dark:text-stone-700 font-black">
                   {isDeep ? 'PRO_REASONING_ENGINE' : 'FLASH_REFRACTION'}
                </span>
             </div>
          </div>

          <AnimatePresence>
            {showBypass && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-24 space-y-6">
                <p className="font-serif italic text-sm text-stone-400">The reasoning trace is exceptionally dense.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-10 py-4 bg-nous-text dark:bg-white text-white dark:text-stone-950 rounded-full font-sans text-[9px] uppercase tracking-[0.5em] font-black shadow-2xl transition-all active:scale-95 group flex items-center gap-4 border border-white/20"
                >
                  <Wind size={14} className="group-hover:rotate-180 transition-transform duration-1000" /> 
                  Hydraulic Release
                </button>
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </motion.div>
  );
};
