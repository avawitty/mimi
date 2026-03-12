
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
  loadingMessage?: string;
}

export const ElevatorLoader: React.FC<ElevatorLoaderProps> = ({ onComplete, onBypass, isDeep, loadingMessage }) => {
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-[#FDFBF7] dark:bg-[#050505] text-nous-text dark:text-white overflow-hidden cursor-wait"
    >
      {/* BACKGROUND GRID - SCHEMATIC TEXTURE */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.1]" 
           style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* MAIN SCHEMATIC CONTAINER */}
      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col md:flex-row items-center justify-center gap-16 p-8">
          
          {/* LEFT: THE ELEVATOR SHAFT (VISUALIZER) */}
          <div className="relative h-[500px] w-24 md:w-32 border-x border-dashed border-stone-300 dark:border-stone-800 flex flex-col justify-end overflow-hidden">
             {/* Shaft Cables */}
             <div className="absolute inset-x-0 top-0 bottom-0 flex justify-center gap-2 opacity-20">
                <div className="w-px h-full bg-current" />
                <div className="w-px h-full bg-current" />
             </div>

             {/* Floor Markers */}
             <div className="absolute right-full mr-4 h-full flex flex-col justify-between py-4 text-[7px] font-mono text-stone-400 text-right">
                <span>LVL_04</span>
                <span>LVL_03</span>
                <span>LVL_02</span>
                <span>LVL_01</span>
             </div>

             {/* The Cab (Moving Element) */}
             <motion.div 
               className={`relative z-10 w-full aspect-[2/3] border border-nous-text dark:border-white bg-white dark:bg-black shadow-xl flex items-center justify-center ${isDeep ? 'overflow-hidden' : ''}`}
               initial={{ y: "350%" }}
               animate={{ y: `${350 - (progress * 3.5)}%` }}
               transition={{ type: "tween", ease: "linear", duration: 0.1 }} // Smooth linear tracking of progress
             >
                {/* Cab Interior Detail */}
                {isDeep ? (
                    <>
                        <div className="absolute inset-0 bg-amber-500/10 animate-pulse" />
                        <motion.div 
                            className="absolute inset-0 border-[0.5px] border-amber-500/30"
                            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div 
                            className="absolute inset-4 border-[0.5px] border-amber-500/50"
                            animate={{ rotate: -360, scale: [1, 0.9, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping z-10" />
                    </>
                ) : (
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                )}
                <div className="absolute top-0 inset-x-0 h-px bg-current opacity-20" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-current opacity-20" />
             </motion.div>

             {/* Depth Fader at Top */}
             <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#FDFBF7] dark:from-[#050505] to-transparent z-20 pointer-events-none" />
          </div>

          {/* RIGHT: THE DATA READOUT (CONTENT) */}
          <div className="w-full md:w-96 space-y-12">
             
             {/* Header */}
             <div className="space-y-2 border-b border-stone-200 dark:border-stone-800 pb-6">
                <div className="flex justify-between items-center">
                    <span className={`font-sans text-[9px] uppercase tracking-[0.4em] font-black ${isDeep ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {isDeep ? 'DEEP_REFRACTION_PROTOCOL' : 'STANDARD_RENDER'}
                    </span>
                    <Activity size={12} className={isDeep ? 'text-amber-500 animate-pulse' : 'text-emerald-500'} />
                </div>
                <h1 className="font-serif text-4xl md:text-5xl italic tracking-tighter leading-none">
                   Manifesting.
                </h1>
                {loadingMessage && <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">{loadingMessage}</p>}
             </div>

             {/* Phase Indicator */}
             <div className="space-y-6 min-h-[120px]">
                <AnimatePresence mode="wait">
                   <motion.div 
                     key={phaseIndex}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 10 }}
                     className="space-y-3"
                   >
                      <div className="flex items-center gap-3 text-stone-400">
                         {phaseIndex === 0 && <Target size={16} />}
                         {phaseIndex === 1 && <BrainCircuit size={16} />}
                         {phaseIndex === 2 && <Layers size={16} />}
                         {phaseIndex === 3 && <Sparkles size={16} />}
                         <span className="font-mono text-[9px] uppercase tracking-widest">{activePhase.label}</span>
                      </div>
                      <p className="font-serif italic text-lg text-stone-600 dark:text-stone-300 leading-snug">
                         "{activePhase.desc}"
                      </p>
                   </motion.div>
                </AnimatePresence>
             </div>

             {/* Diagnostics Ticker */}
             <div className="p-4 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm font-mono text-[9px] text-stone-500 uppercase tracking-wide flex justify-between items-center">
                <span>SYS_DIAG:</span>
                <span className="text-nous-text dark:text-white animate-pulse">{NOUS_DIAGNOSTICS[diagIndex]}</span>
             </div>

             {/* Bypass Control */}
             <AnimatePresence>
                {showBypass && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 flex justify-center">
                      <button 
                        onClick={() => onBypass && onBypass()}
                        className="text-stone-400 hover:text-red-500 font-sans text-[8px] uppercase tracking-widest font-black flex items-center gap-2 border-b border-transparent hover:border-red-500 transition-all pb-0.5"
                      >
                         <Wind size={10} /> Abort Refraction
                      </button>
                   </motion.div>
                )}
             </AnimatePresence>

          </div>
      </div>

      {/* FOOTER METADATA */}
      <div className="absolute bottom-8 left-8 font-mono text-[8px] text-stone-300 uppercase tracking-widest hidden md:block">
         Coordinates: {Math.random().toFixed(4)}N, {Math.random().toFixed(4)}W
      </div>
      <div className="absolute bottom-8 right-8 font-mono text-[8px] text-stone-300 uppercase tracking-widest hidden md:block">
         Load: {Math.floor(progress)}%
      </div>

    </motion.div>
  );
};
