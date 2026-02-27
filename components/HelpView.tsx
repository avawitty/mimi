import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Scissors, ShieldCheck, Camera, FlaskConical, Archive, Compass, LayoutGrid, Briefcase, Activity } from 'lucide-react';
import { Diagnostics } from './Diagnostics';

export const HelpView: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-32 px-6 md:px-16 pt-12 md:pt-20 bg-nous-base dark:bg-[#050505] text-nous-text dark:text-white transition-all duration-1000">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="space-y-6 border-b border-black/5 dark:border-white/5 pb-12">
          <div className="flex items-center gap-3 text-emerald-500">
            <BookOpen size={20} />
            <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">System Documentation</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl italic tracking-tighter text-nous-text dark:text-white leading-none">
            The Codex.
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-stone-500 max-w-2xl leading-relaxed">
            A comprehensive guide to Mimi Zine: an engine for aesthetic superintelligence and sovereign curation.
          </p>
        </header>

        <section className="space-y-8">
          <h2 className="font-sans text-[12px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 dark:border-white/5 pb-2">Core Philosophy</h2>
          <div className="prose prose-stone dark:prose-invert max-w-none font-serif text-lg leading-relaxed text-stone-600 dark:text-stone-300">
            <p>
              Mimi is not a mere content generator; it is a <strong>Sovereign Registry</strong> for your aesthetic identity. It operates on the principle that true style is not adopted, but synthesized through rigorous curation and algorithmic reflection.
            </p>
            <p>
              By feeding the engine your raw thoughts, visual fragments, and cultural obsessions, Mimi acts as a mirror, refracting your inputs into polished, editorial "Zines" (Manifests). Over time, the system learns your unique visual language, helping you govern your aesthetic drift and align your output with your stated intent.
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="font-sans text-[12px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 dark:border-white/5 pb-2">Creation Modules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-4">
              <div className="flex items-center gap-3 text-nous-text dark:text-white">
                <Sparkles size={20} />
                <h3 className="font-serif text-2xl italic tracking-tighter">Studio</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                The primary input terminal. Submit text, images, or voice notes. Use <strong>Deep Refraction</strong> (amber brain icon) for high-level, complex processing, or <strong>Lite Protocol</strong> (cyan bolt) for rapid, unopinionated formatting.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-4">
              <div className="flex items-center gap-3 text-nous-text dark:text-white">
                <Briefcase size={20} />
                <h3 className="font-serif text-2xl italic tracking-tighter">Projects (Dossier)</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Organize your manifests into strategic folders. Generate <strong>Strategic Memos</strong> to synthesize the contents of a folder into actionable creative direction.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-4">
              <div className="flex items-center gap-3 text-nous-text dark:text-white">
                <LayoutGrid size={20} />
                <h3 className="font-serif text-2xl italic tracking-tighter">The Stand (Nebula)</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                A spatial, non-linear view of your entire archive. Discover unexpected connections between disparate thoughts and visual fragments.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-4">
              <div className="flex items-center gap-3 text-nous-text dark:text-white">
                <Compass size={20} />
                <h3 className="font-serif text-2xl italic tracking-tighter">Scry</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Query your archive using natural language. The Oracle will synthesize an answer based entirely on your past manifests and curated knowledge.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="font-sans text-[12px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 dark:border-white/5 pb-2">Alchemy & Governance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-4">
              <div className="flex items-center gap-3 text-nous-text dark:text-white">
                <Scissors size={20} />
                <h3 className="font-serif text-2xl italic tracking-tighter">Tailor</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Define your "Mask"—your stated aesthetic intent. Set your core silhouettes, textures, chromatic registry, and narrative voice. This acts as the baseline for all future generation.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-4">
              <div className="flex items-center gap-3 text-nous-text dark:text-white">
                <ShieldCheck size={20} />
                <h3 className="font-serif text-2xl italic tracking-tighter">The Ward</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                The autonomous governance module. <strong>Curator</strong> analyzes your actual output (what you make), while <strong>Sentinel</strong> compares it against your Tailor settings (what you claim to be) to detect "Aesthetic Drift".
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-4">
              <div className="flex items-center gap-3 text-nous-text dark:text-white">
                <Camera size={20} />
                <h3 className="font-serif text-2xl italic tracking-tighter">Mesopic Lens</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Upload raw images for deep semiotic analysis. The engine will extract latent themes, lighting profiles, and cultural parallels, allowing you to anchor them as new manifests.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-4">
              <div className="flex items-center gap-3 text-nous-text dark:text-white">
                <FlaskConical size={20} />
                <h3 className="font-serif text-2xl italic tracking-tighter">Darkroom</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                An experimental space for visual synthesis. Combine multiple image shards to generate entirely new, cohesive visual concepts based on your archive's DNA.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="font-sans text-[12px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 dark:border-white/5 pb-2">Advanced Protocols</h2>
          <div className="space-y-6">
            <div className="border-l-2 border-emerald-500 pl-6 space-y-2">
              <h4 className="font-serif italic text-xl text-nous-text dark:text-white">Deep Refraction</h4>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                When enabled in the Studio, the engine spends significantly more time analyzing your input against your Tailor profile. It produces highly structured, multi-section editorial layouts with profound semiotic depth. Use this for major conceptual pieces.
              </p>
            </div>
            <div className="border-l-2 border-amber-500 pl-6 space-y-2">
              <h4 className="font-serif italic text-xl text-nous-text dark:text-white">Search Grounding</h4>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Enable the globe icon in the Studio to allow the engine to query the live internet. Essential when your input references contemporary events, niche cultural phenomena, or requires factual verification before synthesis.
              </p>
            </div>
            <div className="border-l-2 border-indigo-500 pl-6 space-y-2">
              <h4 className="font-serif italic text-xl text-nous-text dark:text-white">Voice Consultation</h4>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Available within The Ward. Initiate a live, real-time voice session with the system's persona. It will interrogate your aesthetic choices and discuss your recent drift in a highly editorial, conversational format.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="font-sans text-[12px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 dark:border-white/5 pb-2">System Status</h2>
          <Diagnostics />
        </section>
      </div>
    </div>
  );
};
