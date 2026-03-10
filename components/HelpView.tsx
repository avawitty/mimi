import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Scissors, ShieldCheck, Camera, FlaskConical, Archive, Compass, LayoutGrid, Briefcase, Activity } from 'lucide-react';
import { Diagnostics } from './Diagnostics';

export const HelpView: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar bg-[#F5F2ED] dark:bg-[#050505] text-[#1A1A1A] dark:text-[#E4E3E0] transition-all duration-1000">
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-24 pb-32">
        
        {/* Hero Section */}
        <header className="relative mb-32">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10" />
          <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
                <BookOpen size={16} />
                <span className="font-sans text-[9px] uppercase tracking-[0.2em] font-bold">System Documentation</span>
              </div>
              <p className="font-sans text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">
                Vol. 01 / Architecture
              </p>
            </div>
            <div className="md:col-span-9">
              <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter leading-[0.85] mb-8">
                The <span className="italic">Codex.</span>
              </h1>
              <p className="font-serif text-2xl md:text-3xl text-stone-600 dark:text-stone-300 max-w-3xl leading-snug">
                A comprehensive guide to Mimi Zine: an engine for aesthetic superintelligence and sovereign curation.
              </p>
            </div>
          </div>
        </header>

        {/* Core Philosophy */}
        <section className="mb-32 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10" />
          <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">01. Core Philosophy</h2>
            </div>
            <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-12">
              <p className="font-serif text-xl leading-relaxed text-stone-700 dark:text-stone-300">
                Mimi is not a mere content generator; it is a <span className="italic">Sovereign Registry</span> for your aesthetic identity. It operates on the principle that true style is not adopted, but synthesized through rigorous curation and algorithmic reflection.
              </p>
              <p className="font-serif text-xl leading-relaxed text-stone-700 dark:text-stone-300">
                By feeding the engine your raw thoughts, visual fragments, and cultural obsessions, Mimi acts as a mirror, refracting your inputs into polished, editorial manifests. Over time, the system learns your unique visual language, helping you govern your aesthetic drift.
              </p>
            </div>
          </div>
        </section>

        {/* Creation Modules */}
        <section className="mb-32 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10" />
          <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">02. Creation Modules</h2>
            </div>
            <div className="md:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                
                <div className="group">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <Sparkles size={18} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    <h3 className="font-serif text-3xl italic tracking-tight">Studio</h3>
                  </div>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    The primary input terminal. Submit text, images, or voice notes. Use <span className="text-stone-800 dark:text-stone-200 font-medium">Deep Refraction</span> for high-level, complex processing, or <span className="text-stone-800 dark:text-stone-200 font-medium">Lite Protocol</span> for rapid, unopinionated formatting.
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <Briefcase size={18} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    <h3 className="font-serif text-3xl italic tracking-tight">Projects</h3>
                  </div>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    Organize your manifests into strategic folders. Generate <span className="text-stone-800 dark:text-stone-200 font-medium">Strategic Memos</span> to synthesize the contents of a folder into actionable creative direction.
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <LayoutGrid size={18} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    <h3 className="font-serif text-3xl italic tracking-tight">The Stand</h3>
                  </div>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    A spatial, non-linear view of your entire archive. Discover unexpected connections between disparate thoughts and visual fragments.
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <Compass size={18} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    <h3 className="font-serif text-3xl italic tracking-tight">Scry</h3>
                  </div>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    Query your archive using natural language. The Oracle will synthesize an answer based entirely on your past manifests and curated knowledge.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Alchemy & Governance */}
        <section className="mb-32 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10" />
          <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">03. Alchemy & Governance</h2>
            </div>
            <div className="md:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                
                <div className="group">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <Scissors size={18} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    <h3 className="font-serif text-3xl italic tracking-tight">Tailor</h3>
                  </div>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    Define your "Mask"—your stated aesthetic intent. Set your core silhouettes, textures, chromatic registry, and narrative voice. This acts as the baseline for all future generation.
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <ShieldCheck size={18} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    <h3 className="font-serif text-3xl italic tracking-tight">The Ward</h3>
                  </div>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    The autonomous governance module. <span className="text-stone-800 dark:text-stone-200 font-medium">Curator</span> analyzes your actual output, while <span className="text-stone-800 dark:text-stone-200 font-medium">Sentinel</span> compares it against your Tailor settings to detect "Aesthetic Drift".
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <Camera size={18} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    <h3 className="font-serif text-3xl italic tracking-tight">Mesopic Lens</h3>
                  </div>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    Upload raw images for deep semiotic analysis. The engine will extract latent themes, lighting profiles, and cultural parallels, allowing you to anchor them as new manifests.
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <FlaskConical size={18} className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    <h3 className="font-serif text-3xl italic tracking-tight">Darkroom</h3>
                  </div>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    An experimental space for visual synthesis. Combine multiple image shards to generate entirely new, cohesive visual concepts based on your archive's DNA.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Advanced Protocols */}
        <section className="mb-32 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10" />
          <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">04. Advanced Protocols</h2>
            </div>
            <div className="md:col-span-9 space-y-12">
              
              <div className="relative pl-8 md:pl-12">
                <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-emerald-500/30" />
                <h4 className="font-serif italic text-2xl text-[#1A1A1A] dark:text-white mb-3">Deep Refraction</h4>
                <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                  When enabled in the Studio, the engine spends significantly more time analyzing your input against your Tailor profile. It produces highly structured, multi-section editorial layouts with profound semiotic depth. Use this for major conceptual pieces.
                </p>
              </div>

              <div className="relative pl-8 md:pl-12">
                <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-amber-500/30" />
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="font-serif italic text-2xl text-[#1A1A1A] dark:text-white">Cultural Grounding</h4>
                  <span className="px-2 py-0.5 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[9px] font-sans uppercase tracking-widest rounded-full">High-Fidelity</span>
                </div>
                <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                  A sovereign capability unlocked via the High-Fidelity (Couture) Engine. By enabling the globe icon in the Studio, the engine queries the live internet to anchor your generations in current cultural contexts. This ensures your output isn't just aesthetically pleasing, but deeply relevant to contemporary events, emerging subcultures, and real-time data touchpoints.
                </p>
              </div>

              <div className="relative pl-8 md:pl-12">
                <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-indigo-500/30" />
                <h4 className="font-serif italic text-2xl text-[#1A1A1A] dark:text-white mb-3">Voice Consultation</h4>
                <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                  Available within The Ward. Initiate a live, real-time voice session with the system's persona. It will interrogate your aesthetic choices and discuss your recent drift in a highly editorial, conversational format.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* System Status */}
        <section className="relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10" />
          <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">05. System Status</h2>
            </div>
            <div className="md:col-span-9">
              <Diagnostics />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
