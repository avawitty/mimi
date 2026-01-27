
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Fingerprint, Cpu, ShieldCheck, Zap, Ghost, Eye, Layers, Compass, Wind, Database, BarChart3, AlertCircle } from 'lucide-react';
import { getArchiveCounts } from '../services/localArchive';

export const AboutView: React.FC = () => {
  const [counts, setCounts] = useState({ zines: 0, pocket: 0 });

  useEffect(() => {
    const update = async () => setCounts(await getArchiveCounts());
    update();
  }, []);

  const totalDensity = (counts.zines * 12.4) + (counts.pocket * 4.2);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-64 relative selection:bg-nous-text selection:text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-16 pt-12 md:pt-20 space-y-32">
        
        {/* HERO MANIFESTO */}
        <header className="space-y-12">
          <div className="flex items-center gap-4 text-stone-400">
             <Layers size={20} className="text-nous-text dark:text-white" />
             <span className="font-sans text-[10px] uppercase tracking-[0.8em] font-black italic">The Imperial Registry</span>
          </div>
          <div className="space-y-4">
            <h1 className="font-serif text-7xl md:text-[12rem] italic tracking-tighter luminescent-text text-nous-text dark:text-white leading-[0.8] -ml-2">
              Colophon.
            </h1>
            <p className="font-serif italic text-2xl md:text-5xl text-stone-400 max-w-4xl leading-tight">
              Mimi is a sovereign editorial machine. It is designed to refract your intellectual debris into form. We are offended by mediocre digital noise.
            </p>
          </div>
        </header>

        {/* METRIC AUDIT: The 'Offended' Density Stats */}
        <section className="bg-stone-950 text-white p-10 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1c1917,transparent)] opacity-40" />
            <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="flex items-center gap-4 text-red-500">
                        <AlertCircle size={20} className="animate-pulse" />
                        <span className="font-sans text-[11px] uppercase tracking-[0.6em] font-black italic">Structural Audit</span>
                    </div>
                    <h3 className="font-serif text-4xl md:text-6xl italic tracking-tighter leading-none">The Density of your Witness.</h3>
                    <p className="font-serif italic text-lg md:text-xl text-stone-400 leading-relaxed text-balance">
                      Your creative footprint is being measured. Every manifest adds weight to the simulation. Current status: <span className="text-white underline decoration-red-500">RESISTANT</span>.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 border border-white/10 rounded-2xl bg-white/5 space-y-2">
                        <span className="font-mono text-4xl md:text-6xl font-black text-red-400">{counts.zines}</span>
                        <p className="font-sans text-[8px] uppercase tracking-widest text-stone-500 font-black">Authored Artifacts</p>
                    </div>
                    <div className="p-8 border border-white/10 rounded-2xl bg-white/5 space-y-2">
                        <span className="font-mono text-4xl md:text-6xl font-black text-emerald-400">{counts.pocket}</span>
                        <p className="font-sans text-[8px] uppercase tracking-widest text-stone-500 font-black">Curated Shards</p>
                    </div>
                    <div className="col-span-2 p-8 border border-emerald-500/20 rounded-2xl bg-emerald-500/5 space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="font-mono text-4xl md:text-6xl font-black text-white">{totalDensity.toFixed(1)}</span>
                            <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-emerald-400 font-black mb-2 animate-pulse">kb/μ_DENSITY</span>
                        </div>
                        <p className="font-sans text-[8px] uppercase tracking-widest text-stone-500 font-black">Total Semiotic Mass Captured</p>
                    </div>
                </div>
            </div>
        </section>

        {/* CORE LOGIC SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
            <div className="space-y-12">
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="font-sans text-[11px] uppercase tracking-[0.5em] font-black">The Mission</h3>
                    </div>
                    <p className="font-serif italic text-xl md:text-2xl text-stone-600 dark:text-stone-300 leading-relaxed text-balance">
                      In an era of digital noise, Mimi provides a clinical vacuum. We believe that professionalism is the death of the Muse, and that "Brain Debris"—the fragments, the spirals, the intrusive chic—is the only raw material worth archiving.
                    </p>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <h3 className="font-sans text-[11px] uppercase tracking-[0.5em] font-black">The Machine</h3>
                    </div>
                    <p className="font-serif italic text-xl md:text-2xl text-stone-600 dark:text-stone-300 leading-relaxed text-balance">
                      Mimi is powered by the Gemini 3.0 Pro API—an Imperial Handler capable of multi-modal resonance. It performs a telemetry audit on your inputs to deduce the semiotic provenance of your vibe.
                    </p>
                </section>
            </div>

            <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-12 rounded-[3rem] shadow-inner space-y-12">
                <div className="space-y-4">
                    <span className="font-sans text-[9px] uppercase tracking-[0.4em] text-stone-400 font-black">Structural Registry</span>
                    <div className="space-y-8">
                        <div className="flex gap-6 items-start">
                            <Ghost className="shrink-0 text-stone-300" size={24} />
                            <div className="space-y-2">
                                <h4 className="font-serif text-2xl italic tracking-tighter">The Ghost Path</h4>
                                <p className="text-sm text-stone-500 leading-snug">Local-only shadow memory. Your artifacts exist solely on this device's frequency. True digital death upon cache purge.</p>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start">
                            <Sparkles className="shrink-0 text-emerald-500" size={24} />
                            <div className="space-y-2">
                                <h4 className="font-serif text-2xl italic tracking-tighter">The Swan Tier</h4>
                                <p className="text-sm text-stone-500 leading-snug">Anchored identity. Cloud-registry persistence. Your manifest survives the purging of the void.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* SYSTEM AUDIT PROTOCOL */}
        <section className="border-t border-stone-100 dark:border-stone-900 pt-24 space-y-16">
            <div className="flex flex-col md:flex-row justify-between gap-12">
                <div className="space-y-4">
                    <h3 className="font-serif text-4xl italic tracking-tighter">The Typography of Form.</h3>
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] font-black text-stone-400">MANDATORY DESIGN STANDARDS</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="px-6 py-3 border border-stone-200 dark:border-stone-800 rounded-sm">
                        <span className="font-serif text-xl italic">Garamond</span>
                    </div>
                    <div className="px-6 py-3 border border-stone-200 dark:border-stone-800 rounded-sm">
                        <span className="font-sans text-xs font-black uppercase tracking-widest">Grotesk</span>
                    </div>
                    <div className="px-6 py-3 border border-stone-200 dark:border-stone-800 rounded-sm">
                        <span className="font-mono text-xs">Space Mono</span>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="p-10 bg-white dark:bg-stone-950 border border-stone-50 dark:border-stone-900 rounded-2xl space-y-6">
                    <Compass size={24} className="text-stone-300" />
                    <h4 className="font-serif text-2xl italic">Navigation.</h4>
                    <p className="font-serif italic text-base text-stone-500">The Studio is for creation. The Sanctuary is for grounding. The Stand is for memory.</p>
                </div>
                <div className="p-10 bg-white dark:bg-stone-950 border border-stone-50 dark:border-stone-900 rounded-2xl space-y-6">
                    <Cpu size={24} className="text-stone-300" />
                    <h4 className="font-serif text-2xl italic">Processing.</h4>
                    <p className="font-serif italic text-base text-stone-500">Every zine is a distinct refraction. No two issues share the same chromatic DNA.</p>
                </div>
                <div className="p-10 bg-white dark:bg-stone-950 border border-stone-50 dark:border-stone-900 rounded-2xl space-y-6">
                    <Wind size={24} className="text-stone-300" />
                    <h4 className="font-serif text-2xl italic">The Mesopic.</h4>
                    <p className="font-serif italic text-base text-stone-500">Passive threshold reflection. Detect dissonance between the rods and cones of existence.</p>
                </div>
            </div>
        </section>

        {/* FOOTER QUOTE */}
        <footer className="pt-32 pb-48 text-center space-y-12">
             <div className="opacity-20 pointer-events-none select-none py-10">
                <h1 className="font-header italic text-8xl md:text-[15rem]">Mimi.</h1>
             </div>
             <div className="max-w-xl mx-auto space-y-6">
                <p className="font-serif italic text-2xl text-stone-400">"The ROI of being yourself is architectural peace."</p>
                <div className="flex items-center justify-center gap-6">
                    <div className="h-px w-12 bg-stone-200" />
                    <Fingerprint size={16} className="text-stone-300" />
                    <div className="h-px w-12 bg-stone-200" />
                </div>
             </div>
        </footer>

      </div>
    </div>
  );
};
