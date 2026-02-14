
// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Timer, BrainCircuit, Sparkles, Target, Layers, Cpu, ShieldCheck, Zap, Activity, Radio, RefreshCw, Wind } from 'lucide-react';

const STANDARD_PHASES = [
  { id: 'extraction', label: 'PHASE I: SEMIOTIC EXTRACTION', duration: 3500, desc: "Filtering memetic debris for latent architectural intent." },
  { id: 'synthesis', label: 'PHASE II: STRUCTURAL SYNTHESIS', duration: 4500, desc: "Binding fragments into a coherent conceptual throughline." },
  { id: 'rendering', label: 'PHASE III: VISUAL ORIENTATION', duration: 4000, desc: "Calibrating the scotopic field for plate generation." },
  { id: 'finalizing', label: 'PHASE IV: EDITORIAL COMMIT', duration: 2500, desc: "Finalizing the Sovereign Registry for witness display." }
];

const DEEP_PHASES = [
  { id: 'recursive_audit', label: 'PHASE I: RECURSIVE HEURISTIC AUDIT', duration: 8000, desc: "Performing deep semiotic scan of archival debris." },
  { id: 'archetypal_mapping', label: 'PHASE II: ARCHETYPAL POSITIONING', duration: 10000, desc: "Calculating resonance against historical aesthetic canons." },
  { id: 'high_fidelity_synthesis', label: 'PHASE III: HIGH-FIDELITY SYNTHESIS', duration: 12000, desc: "Architecting a defensible creative manifesto." },
  { id: 'calibration', label: 'PHASE IV: SPECTRAL CALIBRATION', duration: 8000, desc: "Optimizing latent space for alluring resonance." }
];

const NOUS_DIAGNOSTICS = [
  "Noise floor: OPTIMAL",
  "Resonance: STABLE",
  "Latent space: EXPANDING",
  "Aesthetic Debt: ZERO",
  "Thinking Budget: 32,768 (MAX)",
  "Thermal Integrity: NOMINAL",
  "Pro Tier Handshake: VERIFIED"
];

interface ElevatorLoaderProps {
  onComplete?: () => void;
  onBypass?: (lastPrompt?: string) => void;
  isDeep?: boolean;
}

export const ElevatorLoader: React.FC<ElevatorLoaderProps> = ({ onComplete, onBypass, isDeep }) => {
  const phases = isDeep ? DEEP_PHASES : STANDARD_PHASES;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [diagIndex, setDiagIndex] = useState(0);
  const [showBypass, setShowBypass] = useState(false);
  
  useEffect(() => {
    // Structural Logging for the Architect
    console.info(`MIMI // Protocol Initiated: ${isDeep ? 'Imperial Refraction (32k Budget)' : 'Standard Render'}`);
    
    const phaseInterval = setInterval(() => {
      setPhaseIndex(prev => (prev < phases.length - 1 ? prev + 1 : prev));
    }, isDeep ? 9000 : 4000);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const slowdownThreshold = 88;
        const increment = isDeep 
            ? (prev > slowdownThreshold ? 0.015 : 0.06)
            : (prev > slowdownThreshold ? 0.04 : 0.15);
        return Math.min(99.8, prev + increment);
      });
    }, 100);

    const diagInterval = setInterval(() => {
      setDiagIndex(prev => (prev + 1) % NOUS_DIAGNOSTICS.length);
    }, 3000);

    // Deep Refraction requires 25-45s usually. Bypass appears at 40s.
    const bypassTimer = setTimeout(() => setShowBypass(true), isDeep ? 40000 : 15000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
      clearInterval(diagInterval);
      clearTimeout(bypassTimer);
    };
  }, [isDeep, phases]);

  const activePhase = phases[phaseIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-nous-base dark:bg-[#050505] text-nous-text transition-colors duration-1000 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 8, repeat: Infinity }} className="absolute inset-0 flex items-center justify-center">
          <div className="w-[1000px] h-[1000px] border-[0.5px] border-stone-400 dark:border-white rounded-full" />
        </motion.div>
      </div>

      <div className="relative w-full max-w-xl text-center px-8 space-y-20 flex flex-col items-center z-10">
          <div className="flex flex-col items-center gap-8">
             <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className={`w-24 h-24 border-[0.5px] rounded-full flex items-center justify-center ${isDeep ? 'border-amber-500/30' : 'border-emerald-500/30'}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                   {isDeep ? <BrainCircuit size={32} className="text-amber-500 animate-pulse" /> : <Cpu size={32} className="text-emerald-500 animate-pulse" />}
                </div>
             </div>
             <div className="space-y-2">
                <span className={`font-sans text-[9px] uppercase tracking-[0.6em] font-black ${isDeep ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {isDeep ? 'NOUS IMPERIAL AUDITOR' : 'Mimi Development Agent'}
                </span>
                <div className="flex items-center gap-3 justify-center text-stone-400">
                   <Radio size={8} />
                   <span className="font-mono text-[8px] uppercase tracking-widest">{NOUS_DIAGNOSTICS[diagIndex]}</span>
                </div>
             </div>
          </div>

          <div className="h-48 flex flex-col items-center justify-center space-y-10">
            <AnimatePresence mode="wait">
              <motion.div key={phaseIndex} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                   <span className="font-sans text-[10px] uppercase tracking-[0.8em] font-black text-stone-400">{activePhase.label}</span>
                   <h2 className="font-serif text-3xl md:text-5xl italic leading-none tracking-tighter text-nous-text dark:text-white max-w-lg mx-auto">
                      {activePhase.desc}
                   </h2>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full space-y-6">
             <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-900 overflow-hidden relative rounded-full shadow-inner">
                <motion.div className={`absolute top-0 left-0 h-full ${isDeep ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_12px_#10b981]'}`} animate={{ width: `${progress}%` }} />
             </div>
             <div className="flex justify-between items-center px-2">
                <span className="font-sans text-[8px] text-stone-400 uppercase tracking-widest font-black">Refraction_Depth</span>
                <span className={`font-mono text-[10px] font-black ${isDeep ? 'text-amber-500' : 'text-emerald-500'}`}>{Math.floor(progress)}%</span>
             </div>
          </div>

          <AnimatePresence>
            {showBypass && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-12 space-y-8 flex flex-col items-center">
                <p className="font-serif italic text-xs text-stone-400 max-w-xs text-balance opacity-80">
                    The model is architecting a high-density manifest. If the wait feels structurally unsound, you may manual purge.
                </p>
                <button
                  onClick={() => onBypass && onBypass()}
                  className="px-10 py-4 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-red-500 rounded-full font-sans text-[9px] uppercase tracking-[0.5em] font-black transition-all group flex items-center gap-4 shadow-sm hover:shadow-xl"
                >
                  <Wind size={14} className="group-hover:animate-spin" /> Abort Refraction
                </button>
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </motion.div>
  );
};
