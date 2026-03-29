import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, BookOpen, Users, Sparkles } from 'lucide-react';

export const CommunityManifesto: React.FC = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar p-6 md:p-12 bg-stone-50 dark:bg-stone-950">
      <div className="max-w-4xl mx-auto space-y-16 pb-32">
        
        {/* Header */}
        <header className="text-center space-y-6 pt-12">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-none border border-stone-500/20 bg-stone-500/5 text-stone-600 dark:text-stone-400">
            <Heart size={12} />
            <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black">Our Ethos</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl italic tracking-tighter text-nous-text dark:text-white leading-none">
            The Manifesto.
          </h1>
          <p className="font-serif italic text-xl text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Feminine power and softness. Playful curiosity. We prioritize clarity over cool, and intimacy over scale.
          </p>
        </header>

        {/* Brand Pillars */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
            <Sparkles size={20} className="text-stone-400" />
            <h2 className="font-sans text-xs uppercase tracking-[0.3em] font-black text-stone-500">Brand Pillars</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
              <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">Embodiment</h3>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Real life, not just AI aesthetics. We ground our digital creations in physical reality, honoring the messy, beautiful truth of lived experience.
              </p>
            </div>
            <div className="p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
              <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">Intimacy</h3>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Smallness is a feature. We reject the pressure to scale infinitely. True connection happens in quiet, curated spaces.
              </p>
            </div>
            <div className="p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
              <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">Craft</h3>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Zine energy meets editorial standards. We care about the details—typography, pacing, and the tactile feel of our digital artifacts.
              </p>
            </div>
            <div className="p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
              <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">Consent</h3>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Boundaries, moderation, and safety. We protect our peace and the peace of our community. No fake urgency. No harsh perfectionism.
              </p>
            </div>
          </div>
        </section>

        {/* Editorial Standards */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
            <BookOpen size={20} className="text-stone-400" />
            <h2 className="font-sans text-xs uppercase tracking-[0.3em] font-black text-stone-500">Editorial Standards</h2>
          </div>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 md:p-12 space-y-8">
            <div className="space-y-4">
              <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">Two Tempos</h3>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                We design for two distinct reading experiences. The <strong>Short Read (2–4 min)</strong> is punchy, clear, and highly visual. The <strong>Slow Read (10–15 min)</strong> is deep, expansive, and invites lingering reflection. Choose your tempo.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">Taste Without Cruelty</h3>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Our guidelines for feedback and critique. We believe in rigorous aesthetic standards, but we deliver them with warmth. Critique the work, not the worth. Offer pathways for evolution, not dead ends.
              </p>
            </div>
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800">
              <button className="font-sans text-[10px] uppercase tracking-widest font-black text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors flex items-center gap-2">
                Download Contributor Style Sheet <span className="text-stone-300">→</span>
              </button>
            </div>
          </div>
        </section>

        {/* Community Strategy */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
            <Shield size={20} className="text-stone-400" />
            <h2 className="font-sans text-xs uppercase tracking-[0.3em] font-black text-stone-500">The Circle (Beta)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
              <Users size={16} className="text-stone-400 mb-4" />
              <h3 className="font-serif italic text-lg text-nous-text dark:text-white">Weekly Rituals</h3>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Join our "1 prompt, 3 responses" exercise or drop into the "Open Studio" to co-create in silence.
              </p>
            </div>
            <div className="p-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
              <Shield size={16} className="text-stone-400 mb-4" />
              <h3 className="font-serif italic text-lg text-nous-text dark:text-white">Trusted Moderation</h3>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                A small team of trusted moderators ensures safety. We maintain a clear, transparent reporting flow.
              </p>
            </div>
            <div className="p-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
              <Heart size={16} className="text-stone-400 mb-4" />
              <h3 className="font-serif italic text-lg text-nous-text dark:text-white">Aligned Partnerships</h3>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                We collaborate with creators who share our micro-audience ethos for special co-issue releases.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
