
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ExternalLink, Sparkles, CornerDownRight, Globe, Info, Instagram, Mail, Crown, X, ArrowLeft, Heart, Share2, Lock, ShieldCheck, Map, ShieldAlert, HeartHandshake, Zap, Radio, Activity, Phone, Cpu, Database, Server, Quote, Fingerprint, Layers } from 'lucide-react';
import { EditorialSpread } from './EditorialSpread';

const SPOTLIGHTS = [
  {
    id: 'a_vain_life',
    brand: "A Vain Life",
    headline: "IMAGE AS ARMOR.",
    summary: "A meditation on image, self-worth, and authorship in the age of visibility. Reframing vanity as a site of inquiry.",
    link: "#",
    color: "#D4D4D4", 
    tag: "Personal Brand",
    content: {
      subtitle: "The Aesthetic Inquiry",
      body: [
        "A Vain Life began as a meditation on image, self-worth, and authorship in the age of visibility. Rather than rejecting vanity, the project reframes it as a site of inquiry: how personal aesthetics, self-presentation, and taste function as both armor and expression.",
        "The project explores the tension between sincerity and performance — how identity is curated, refined, and sometimes misread. Through writing, visual references, and brand experiments, A Vain Life functions as a living editorial space where self-image becomes something intentional rather than reactive.",
        "At its core, A Vain Life asks: what does it mean to choose yourself as a subject without flattening yourself into a product? This exploration comes to life through photoshoots and creative collaborations — each session becoming both a study and celebration of self-image."
      ],
      captions: [
        "Vanity is a site of inquiry. #AVainLife",
        "Choosing yourself as a subject. #ImageAsArmor",
        "The tension between sincerity and performance. #AestheticAuthorship"
      ],
      author: "Registry Station // 01",
      stats: "IMAGE_NOMINAL"
    }
  },
  {
    id: 'down_the_line',
    brand: "Down the Line",
    headline: "THE LITURGY OF THE LONG VIEW.",
    summary: "Rethinking social momentum through intentional invitations. A platform for moments that travel forward, not outward.",
    link: "#",
    color: "#10B981", 
    tag: "Social Concept",
    content: {
      subtitle: "The Horizon Protocol",
      body: [
        "Down the Line was conceived as a way to rethink how people initiate plans, events, and social momentum. Instead of feeds or broadcasts, the concept centers around intentional invitations — moments that travel forward rather than outward.",
        "The project explored how digital tools could lower the friction of organizing, preserve the emotional tone of an invitation, and turn social planning into a collectible, aesthetic artifact.",
        "Down the Line emphasized anticipation, commitment, and follow-through — treating social coordination as a designed experience rather than a logistical chore. It laid early groundwork for interfaces that shape behavior through tone, not coercion."
      ],
      captions: [
        "Moments that travel forward. #DownTheLine",
        "Purpose is a structural requirement. #HorizonProtocol",
        "Social planning as a collectible artifact. #IntentionalInvitations"
      ],
      author: "The Editorial Registry",
      stats: "PURPOSE_LOCKED_2.2"
    }
  },
  {
    id: 'pattern_shift',
    brand: "Pattern Shift",
    headline: "THE ARCHITECTURE OF CHANGE.",
    summary: "Identifying the precise coordinate where aesthetic fatigue transforms into structural revolution. Mental patterns as editable systems.",
    link: "#",
    color: "#4F46E5",
    tag: "Wellness Logic",
    content: {
      subtitle: "The Pivot Mandate",
      body: [
        "Pattern Shift emerged from an interest in how internal narratives form — and how they can be gently interrupted. The project focused on recognizing recurring thought patterns, habits, and self-talk loops, then offering structured prompts to reframe them.",
        "Rather than pathologizing behavior, Pattern Shift approached mental patterns as editable systems: observe the loop, name it, and shift it incrementally.",
        "The concept bridges wellness and design, positioning self-reflection as a creative practice rather than a corrective one. It directly informs later work with AI-assisted tools that emphasize interpretation over judgment."
      ],
      captions: [
        "Self-reflection as a creative practice. #PatternShift",
        "Observe the loop. Name it. Shift it. #CognitiveReframing",
        "The architecture of mental change. #ThePivotMandate"
      ],
      author: "The Editorial Registry",
      stats: "PIVOT_NOMINAL"
    }
  },
  {
    id: 'avashotme',
    brand: "Avashotme",
    headline: "THE SUBJECT IS THE CURATOR.",
    summary: "An exploration of authorship through self-imaging. Photographer and photographed, image and editor.",
    link: "#",
    color: "#7F1D1D",
    tag: "Visual Identity",
    content: {
      subtitle: "Authorship Experiment",
      body: [
        "Avashotme explored authorship through the lens of self-imaging. It questioned what it means to be both the subject and the curator — photographer and photographed, image and editor.",
        "The project played with visibility, framing, and repetition, treating the self not as a static brand but as a shifting visual archive. It examined how meaning accumulates through selection rather than volume.",
        "Consistency can emerge organically from attention rather than strategy. Avashotme functioned less as a social account and more as a controlled visual laboratory."
      ],
      captions: [
        "Meaning through selection, not volume. #Avashotme",
        "The self as a shifting visual archive. #AuthorshipExperiment",
        "Photographer and photographed. #TheCuratedSelf"
      ],
      author: "Registry Station // 04",
      stats: "SUBJECT_ACTIVE"
    }
  },
  {
    id: 'mimi',
    brand: "Mimi",
    headline: "TASTE-LED SUPERINTELLIGENCE.",
    summary: "An interpretive system designed to transform raw thoughts into structured editorial artifacts. The synthesis of perception and AI.",
    link: "#",
    color: "#FDE047",
    tag: "Creative System",
    content: {
      subtitle: "The Interpretive Loop",
      body: [
        "Mimi is the most integrated expression of my work to date. It is an AI-assisted zine editor designed to transform raw thoughts, fragments, and references into structured editorial artifacts.",
        "Rather than generating content indiscriminately, Mimi operates as an interpretive system: thoughts enter through the Studio, they undergo Ascension, and they emerge as Zines.",
        "Patterns surface through Mesopic (the perceptual threshold between grayscale and color), and Taste Calibration guides future exploration. Mimi treats creativity as a perceptual process, not a productivity task.",
        "Zines are grounded through references, visual artifacts, and a Roadmap that points toward where an idea could go next — making the tool valuable both for personal reflection and professional storytelling."
      ],
      captions: [
        "Creativity as a perceptual process. #MimiRegistry",
        "Thoughts enter. Zines emerge. #InterpretiveAI",
        "The synthesis of perception and form. #TasteLedSuperintelligence"
      ],
      author: "The Imperial Registry",
      stats: "SIGNAL_NOMINAL"
    }
  },
  {
    id: 'broke_girl_manifesto',
    brand: "Broke Girl Manifesto",
    headline: "THE LITURGY OF THE LAST PENNY.",
    summary: "Economic restriction as the primary architect of aesthetic genius. A guide to the Architecture of Zero.",
    link: "#",
    color: "#EF4444",
    tag: "Legacy Manifesto",
    content: {
      subtitle: "Poverty Recalibrated",
      body: [
        "The Broke Girl Manifesto is not an apology for lack; it is a structural requirement for stillness. We are tracing the logic of the Composition in the Cold Light.",
        "Three Olives, a bottle of tonic water, and a single bulb flickering at the frequency of 60 Hertz. This is not poverty; it is a clinical curation of the necessary.",
        "The Architecture of Zero teaches us that when the budget hits zero, the mind moves to 4K. Economic restriction is the primary architect of aesthetic genius."
      ],
      captions: [
        "Economic restriction is the architect of my genius. #BrokeGirlManifesto",
        "The Architecture of Zero. #LiturgyOfPennies",
        "Composition in the Cold Light. #TheSovereignManifesto"
      ],
      author: "Registry Station // 01",
      stats: "0.04% SIGNAL_DECAY"
    }
  }
];

export const ThePress: React.FC = () => {
  const [activeArticle, setActiveArticle] = useState<any | null>(null);
  const KOFI_LINK = "https://ko-fi.com/mimizine";
  const INSTAGRAM_URL = "https://instagram.com/themimizine";

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-y-auto no-scrollbar pb-64 relative">
      <AnimatePresence>
        {activeArticle && (
          <EditorialSpread 
            article={activeArticle} 
            onClose={() => setActiveArticle(null)} 
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 pt-12 md:pt-20 space-y-24">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-100 dark:border-stone-900 pb-12 gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3 text-stone-400">
                <Newspaper size={16} />
                <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">Sovereign Wire</span>
              </div>
              <h2 className="font-serif text-6xl md:text-8xl italic tracking-tighter luminescent-text text-nous-text dark:text-white leading-none">The Press.</h2>
           </div>
           
           <div className="flex flex-col items-end gap-6">
              <div className="flex flex-wrap justify-end gap-3 md:gap-4">
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full font-sans text-[7px] md:text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text dark:hover:text-white transition-all shadow-sm"><Instagram size={10} /> Follow</a>
                <a href="mailto:ava@mimizine.com" className="flex items-center gap-2 px-5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full font-sans text-[7px] md:text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text dark:hover:text-white transition-all shadow-sm"><Mail size={10} /> Contact</a>
                <a href={KOFI_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full font-sans text-[7px] md:text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text dark:hover:text-white transition-all shadow-sm"><Crown size={10} /> Patronage</a>
              </div>
           </div>
        </div>

        {/* SECTION: SELECTED PROJECTS */}
        <section className="space-y-16">
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="font-header text-4xl md:text-6xl italic tracking-tighter">Selected Projects & Conceptual Brands.</h3>
            <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-400 font-black">A body of work exploring identity, taste, perception, and creative systems</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-8">
            {SPOTLIGHTS.filter(s => s.tag !== 'Legacy Manifesto').map((spot, i) => (
              <motion.div 
                key={spot.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveArticle(spot)}
                className="group relative bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all flex flex-col gap-10 overflow-hidden cursor-pointer"
              >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    {spot.id === 'mimi' ? <Sparkles size={120} /> : spot.id === 'down_the_line' ? <Map size={120} /> : <Layers size={120} />}
                  </div>

                  <div className="flex flex-col gap-4 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: spot.color }} />
                        <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">{spot.tag}</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 z-10">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] font-black text-nous-text dark:text-white leading-tight">{spot.headline}</p>
                    <p className="font-serif italic text-base text-stone-500 leading-relaxed text-balance line-clamp-3">"{spot.summary}"</p>
                  </div>

                  <div className="pt-8 border-t border-stone-50 dark:border-stone-800 flex justify-between items-center z-10">
                    <span className="flex items-center gap-3 font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-400 group-hover:text-nous-text dark:group-hover:text-white transition-colors">
                        WITNESS PROJECT <ArrowLeft className="rotate-180" size={10} />
                    </span>
                    <CornerDownRight size={16} className="text-stone-100 dark:text-stone-800" />
                  </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION: LEGACY MANIFESTOS */}
        <section className="pt-24 border-t border-stone-100 dark:border-stone-900 space-y-12">
           <div className="flex items-center gap-6">
              <span className="font-sans text-[10px] uppercase tracking-[1em] text-stone-300 font-black shrink-0">Legacy Manifestos</span>
              <div className="h-px flex-1 bg-stone-100 dark:bg-stone-900" />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {SPOTLIGHTS.filter(s => s.tag === 'Legacy Manifesto').map(spot => (
                <div key={spot.id} onClick={() => setActiveArticle(spot)} className="p-8 border border-stone-100 dark:border-stone-800 rounded-xl hover:border-red-500/30 transition-all cursor-pointer group">
                   <h4 className="font-serif text-2xl italic mb-2 group-hover:text-red-500 transition-colors">{spot.brand}</h4>
                   <p className="font-serif italic text-sm text-stone-400">"{spot.summary}"</p>
                </div>
              ))}
           </div>
        </section>

        {/* SECTION: THROUGHLINE SYNTHESIS */}
        <section className="pt-32 pb-16">
            <div className="max-w-4xl mx-auto p-12 md:p-20 bg-stone-50 dark:bg-white/5 rounded-[3rem] border border-stone-100 dark:border-stone-800 text-center space-y-12 relative overflow-hidden group">
               <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
                  <Fingerprint size={300} />
               </div>
               
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-center gap-4 text-stone-400">
                     <Radio size={16} className="text-emerald-500 animate-pulse" />
                     <span className="font-sans text-[11px] uppercase tracking-[0.6em] font-black italic">The Throughline</span>
                  </div>
                  <h3 className="font-serif text-5xl md:text-7xl italic tracking-tighter leading-tight text-nous-text dark:text-white">The Consistency of the Void.</h3>
                  <p className="font-serif italic text-xl md:text-2xl text-stone-500 leading-relaxed max-w-2xl mx-auto text-balance">
                    Across these projects runs a consistent interest in taste as authorship, perception as interface, and the creation of systems that support meaning without flattening it. These are tools that feel intimate rather than extractive.
                  </p>
                  <p className="font-serif italic text-lg text-stone-400 max-w-xl mx-auto pt-4">
                    Each project informed the next, culminating in Mimi — not as a departure, but as a synthesis.
                  </p>
               </div>

               <div className="flex items-center justify-center gap-12 relative z-10 pt-12 border-t border-stone-200 dark:border-stone-800">
                  <div className="flex flex-col items-center gap-2">
                     <ShieldCheck size={20} className="text-emerald-400" />
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Coherent</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <Zap size={20} className="text-amber-400" />
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Restrained</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <Activity size={20} className="text-blue-400" />
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Evolving</span>
                  </div>
               </div>
            </div>
        </section>

        <footer className="pt-32 pb-48 text-center space-y-12">
             <div className="opacity-20 pointer-events-none select-none py-10">
                <h1 className="font-header italic text-8xl md:text-[15rem]">Mimi.</h1>
             </div>
        </footer>

      </div>
    </div>
  );
};
