import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SovereignIdentityCardView } from './SovereignIdentityCardView';
import { TasteConstellation } from './TasteConstellation';
import { useUser } from '../contexts/UserContext';
import { generateCelestialReading, generateExecutionLayer } from '../services/geminiService';
import { Sparkles, Loader2, Fingerprint, Activity, BookOpen, Orbit, Waves, Compass, Briefcase } from 'lucide-react';
import { ExecutionBlock } from './ExecutionBlock';
import { ExecutionLayer } from '../types';

export const TheOracle: React.FC = () => {
  const { profile, activePersona } = useUser();
  const [reading, setReading] = useState<string | null>(null);
  const [executionLayer, setExecutionLayer] = useState<ExecutionLayer | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);

  // 1. Fetching the Live Reading on Component Mount
  useEffect(() => {
    if (profile && !reading) {
      setLoadingReading(true);
      generateCelestialReading(profile)
        .then(async (res) => {
          setReading(res);
          try {
            const el = await generateExecutionLayer(res);
            setExecutionLayer(el);
          } catch (e) {
            console.error("Execution Layer Error:", e);
          }
        })
        .catch(e => console.error("Oracle Error:", e))
        .finally(() => setLoadingReading(false));
    }
  }, [profile, reading]);

  // 2. Ensuring the user has generated an identity first
  if (!profile?.tasteProfile?.sovereignIdentity) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full space-y-6 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <h2 className="font-serif italic text-4xl text-nous-text">The Oracle Slumbers.</h2>
        <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle">Awaiting Sovereign Identity</p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'studio' }))}
          className="px-8 py-4 bg-nous-base text-nous-text font-sans text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-nous-base transition-colors"
        >
          Synthesize Fragments
        </button>
      </div>
    );
  }

  const sig = profile.tasteProfile?.aestheticSignature;
  const draft = activePersona?.tailorDraft || profile.tailorDraft;

  return (
    <div className="flex flex-col h-full bg overflow-y-auto pb-32">
      <div className="p-4 md:p-8 pt-8 md:pt-12 space-y-10 max-w-5xl mx-auto w-full">
        
        {/* HEADER */}
        <div className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-serif italic text-nous-text mb-2 md:mb-4 flex items-center justify-center md:justify-start gap-4"
            >
              <Sparkles size={28} className="text-nous-subtle hidden md:block" />
              The Oracle
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-[9px] md:text-xs font-sans uppercase tracking-[0.2em] text-nous-subtle"
            >
              Your Daily Aesthetic Horoscope
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('mimi:open_scribe', { detail: 'mimi' }))}
              className="px-6 py-3 border border-nous-border bg-nous-base hover:bg-nous-base0/50 transition-colors flex items-center gap-2 font-sans text-[9px] uppercase tracking-widest font-black text-nous-text"
            >
              <Sparkles size={14} />
              Consult Mimi
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('mimi:open_scribe', { detail: 'cyrus' }))}
              className="px-6 py-3 border border-nous-border bg-nous-base hover:bg-nous-base0/50 transition-colors flex items-center gap-2 font-sans text-[9px] uppercase tracking-widest font-black text-nous-text"
            >
              <Briefcase size={14} />
              Consult Cyrus
            </button>
          </motion.div>
        </div>

        {/* DAILY READING - Scaled specifically for mobile legibility */}
        <motion.div
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
           className="bg-nous-base0/30 border border-white/10 p-6 md:p-8 rounded-none relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-stone-500 to-transparent" />
          <h2 className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black flex items-center gap-2 mb-4">
            <Orbit size={12} />
            Celestial Reading
          </h2>
          <div className="min-h-[3rem] flex items-center">
            {loadingReading ? (
              <div className="flex items-center gap-3 text-nous-subtle font-sans text-xs uppercase tracking-widest leading-loose">
                <Loader2 size={14} className="animate-spin" />
                Channeling Frequency...
              </div>
            ) : (
              <div className="space-y-8 w-full">
                <p className="font-serif italic text-lg md:text-2xl text-nous-text leading-relaxed">
                  "{reading || "The stars remain quiet tonight."}"
                </p>
                {executionLayer && (
                  <div className="pt-8 border-t border-white/10">
                    <ExecutionBlock layer={executionLayer} />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* IDENTIFICATION CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          className="flex justify-center w-full"
        >
          <SovereignIdentityCardView card={profile.tasteProfile.sovereignIdentity} />
        </motion.div>

        {/* AESTHETIC SIGNATURE DETAILS - Single col mobile, Grid dual col desktop */}
        {sig && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full"
          >
            {/* Primary / Secondary Axes */}
            <div className="p-5 border border-white/10 bg-nous-base0/30 flex flex-col gap-5">
               <div className="flex items-center gap-2 text-nous-subtle">
                 <Compass size={14} />
                 <span className="font-sans text-[8px] uppercase tracking-widest font-black">Spatial Coordinates</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <span className="block font-sans text-[7px] text-white/40 uppercase tracking-widest mb-1.5">Primary Axis</span>
                   <span className="block font-serif italic text-lg text-nous-text leading-tight">{sig.primaryAxis || draft?.strategicSummary?.identityVector || 'Unknown'}</span>
                 </div>
                 <div>
                   <span className="block font-sans text-[7px] text-white/40 uppercase tracking-widest mb-1.5">Secondary Axis</span>
                   <span className="block font-serif italic text-lg text-nous-text leading-tight">{sig.secondaryAxis || 'Developing...'}</span>
                 </div>
               </div>
            </div>

            {/* Tactile & Typography Bias */}
            <div className="p-5 border border-white/10 bg-nous-base0/30 flex flex-col gap-5">
               <div className="flex items-center gap-2 text-nous-subtle">
                 <Fingerprint size={14} />
                 <span className="font-sans text-[8px] uppercase tracking-widest font-black">Sensory Bias</span>
               </div>
               <div className="grid grid-cols-2 gap-4 mt-auto">
                 <div>
                   <span className="block font-sans text-[7px] text-white/40 uppercase tracking-widest mb-1.5">Tactile Anchor</span>
                   <span className="block font-sans text-[10px] md:text-xs font-black uppercase tracking-wider text-nous-text">
                      {sig.tactileBias?.dominant || draft?.materialityConfig?.paperStock || 'Glass'}
                   </span>
                 </div>
                 <div>
                   <span className="block font-sans text-[7px] text-white/40 uppercase tracking-widest mb-1.5">Typography</span>
                   <span className="block font-sans text-[10px] md:text-xs font-black uppercase tracking-wider text-nous-text">
                      {sig.typographicPairing?.serif || draft?.expressionEngine?.typography?.serif || 'Serif'} 
                      <span className="text-nous-subtle font-normal mx-1">×</span> 
                      {sig.typographicPairing?.sans || draft?.expressionEngine?.typography?.sans || 'Sans'}
                   </span>
                 </div>
               </div>
            </div>

            {/* Motifs & Clusters (Spans both columns on desktop) */}
            <div className="md:col-span-2 p-5 border border-white/10 bg-nous-base0/30 flex flex-col gap-4">
               <div className="flex items-center gap-2 text-nous-subtle">
                 <Activity size={14} />
                 <span className="font-sans text-[8px] uppercase tracking-widest font-black">Active Motifs & Clusters</span>
               </div>
               {sig.moodCluster && (
                 <p className="font-serif italic text-lg md:text-xl text-nous-subtle mt-1.5">Core Mood: <span className="text-nous-text">{sig.moodCluster}</span></p>
               )}
               {/* Wrapped flexbox for tiny high-fashion tags */}
               <div className="flex flex-wrap gap-2 mt-2">
                 {(sig.motifs || draft?.expressionEngine?.visualPresets?.texture ? [draft?.expressionEngine?.visualPresets?.texture].filter(Boolean) : []).map((m, i) => (
                   <span key={i} className="px-3 py-1.5 border border-white/10 bg-nous-base0/50 text-[9px] uppercase tracking-widest font-sans font-black text-nous-subtle">
                     {m as string}
                   </span>
                 ))}
               </div>
            </div>

            {/* Influence Lineage */}
            {sig.influenceLineage && sig.influenceLineage.length > 0 && (
              <div className="md:col-span-2 p-5 border border-white/10 bg-nous-base0/30 flex flex-col gap-5">
                 <div className="flex items-center gap-2 text-nous-subtle mb-1">
                   <BookOpen size={14} />
                   <span className="font-sans text-[8px] uppercase tracking-widest font-black">Influence Lineage</span>
                 </div>
                 <div className="space-y-5">
                   {sig.influenceLineage.map((item, idx) => (
                     <div key={idx} className="flex flex-col gap-2">
                       <div className="flex justify-between items-end">
                         <span className="font-serif italic text-base md:text-lg text-nous-text leading-none">{item.artist}</span>
                         <span className="font-sans text-[7px] md:text-[8px] tracking-widest uppercase text-white/40">{item.movement}</span>
                       </div>
                       <div className="w-full h-0.5 bg-black/40 relative">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min(100, item.connectionStrength * 10)}%` }} // Animated progress bar 
                           transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                           className="absolute top-0 left-0 h-full bg-nous-subtle"
                         />
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TASTE CONSTELLATION - Responsive Aspect Ratio */}
        <motion.div
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
           className="border border-white/10 pt-6 mt-4"
        >
          <div className="flex items-center justify-center md:justify-start gap-2 text-nous-subtle mb-6 px-4">
            <Waves size={16} />
            <h2 className="text-[9px] font-sans uppercase font-black tracking-widest">
              Live Taste Constellation
            </h2>
          </div>
          <div className="h-64 sm:h-80 md:h-[400px] w-full bg-black/20 overflow-hidden">
             <TasteConstellation />
          </div>
        </motion.div>

      </div>
    </div>
  );
};
