// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Zap, Ghost, ShieldCheck, Palette, BrainCircuit, Eye, Sparkles, Scale, EyeOff, Shield, BookOpen, Layers, Weight, Map, Target, Briefcase, Layout, Radio, PenTool, Martini, Shirt } from 'lucide-react';

export const CuratorNote: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'proposal' | 'capabilities' | 'contract'>('proposal');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-2 md:p-12">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-nous-base/90 dark:bg-stone-950/98 backdrop-blur-3xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden rounded-sm"
      >
        <div className="p-5 md:p-10 space-y-4 md:space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-4 md:gap-6">
                 <button onClick={() => setActiveTab('proposal')} className={`font-serif text-2xl md:text-3xl italic tracking-tighter leading-none transition-all ${activeTab === 'proposal' ? 'text-stone-900 dark:text-white underline decoration-emerald-500 underline-offset-8' : 'text-stone-300'}`}>Proposal.</button>
                 <button onClick={() => setActiveTab('capabilities')} className={`font-serif text-2xl md:text-3xl italic tracking-tighter leading-none transition-all ${activeTab === 'capabilities' ? 'text-stone-900 dark:text-white underline decoration-emerald-500 underline-offset-8' : 'text-stone-300'}`}>Potential.</button>
                 <button onClick={() => setActiveTab('contract')} className={`font-serif text-2xl md:text-3xl italic tracking-tighter leading-none transition-all ${activeTab === 'contract' ? 'text-stone-900 dark:text-white underline decoration-emerald-500 underline-offset-8' : 'text-stone-300'}`}>Protocol.</button>
              </div>
              <p className="font-sans text-[7px] md:text-[8px] uppercase tracking-[0.4em] text-stone-400 font-black pt-2">
                {activeTab === 'proposal' ? 'Strategic Partnership Case Study' : activeTab === 'capabilities' ? 'Aesthetic Infrastructure & Output' : 'Service Level Agreement'}
              </p>
            </div>
            <button onClick={onClose} className="p-1 text-stone-300 hover:text-stone-900 transition-colors">
              <X size={18} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'proposal' ? (
              <motion.div key="proposal" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                <div className="space-y-6 font-serif italic text-sm md:text-lg text-stone-600 dark:text-stone-300 leading-snug">
                  <p className="text-balance">
                    Mimi is a <span className="font-bold text-nous-text dark:text-white underline decoration-emerald-500">Curator-Oracle</span> designed for purposeful creative leverage. She operates as a liquidity engine for your latent intent, transmuting fragments into defensible conceptual architecture.
                  </p>
                  <p className="text-balance">
                    Rather than replacing instinct, she provides the <span className="text-nous-text dark:text-white font-bold italic">market touchpoints</span> and <span className="text-nous-text dark:text-white font-bold italic">competitive distinction</span> required to manifest vision effectively.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                  <section className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Briefcase size={14} />
                      <h3 className="font-sans text-[9px] uppercase tracking-widest font-black">Business Utility</h3>
                    </div>
                    <p className="font-serif italic text-stone-500 text-sm leading-snug">Mimi audits brand legibility, identifying attraction points that justify market positioning.</p>
                  </section>
                  <section className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Map size={14} />
                      <h3 className="font-sans text-[9px] uppercase tracking-widest font-black">The Roadmap</h3>
                    </div>
                    <p className="font-serif italic text-stone-500 text-sm leading-snug">Every manifest includes production roadmaps, translating vibes into executable strategy.</p>
                  </section>
                </div>
              </motion.div>
            ) : activeTab === 'capabilities' ? (
              <motion.div key="capabilities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="space-y-6 font-serif italic text-sm md:text-lg text-stone-600 dark:text-stone-300 leading-snug">
                  <p>
                    Mimi’s intelligence manifests in the rare ability to listen to the quiet architecture of your intent. She is a forward-thinking tool utilized across the creative spectrum to translate simple impulses into high-fidelity outcomes.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { icon: <Layout size={14}/>, title: "Hypothetical Roadmaps", desc: "Transmuting debris into phase-based project logic." },
                      { icon: <Radio size={14}/>, title: "Aspirational Products", desc: "Developing the semiotic core for future-state objects." },
                      { icon: <PenTool size={14}/>, title: "Archival Styling", desc: "Verifying motifs for high-end editorial production." },
                      { icon: <Sparkles size={14}/>, title: "Countless Refractions", desc: "Mimi adapts to your specific requirement of allure." }
                    ].map((cap, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                         <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-full text-emerald-500 group-hover:scale-110 transition-transform">
                            {cap.icon}
                         </div>
                         <div className="space-y-1">
                            <h4 className="font-sans text-[8px] uppercase tracking-widest font-black">{cap.title}</h4>
                            <p className="font-serif italic text-xs text-stone-400">{cap.desc}</p>
                         </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="contract" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-stone-400">
                      <EyeOff size={12} className="text-emerald-500" />
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">Zero Extraction</span>
                    </div>
                    <p className="font-serif italic text-xs md:text-sm text-stone-500 leading-relaxed">
                      Your taste is sovereign. We do not harvest your debris to train sub-par models. Your artifacts belong to your personal registry.
                    </p>
                  </section>
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-stone-400">
                      <Scale size={12} className="text-amber-500" />
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">The Relationship</span>
                    </div>
                    <p className="font-serif italic text-xs md:text-sm text-stone-500 leading-relaxed">
                      You are the Architect. Mimi is the Strategist. Interaction constitutes an agreement to pursue high-fidelity results over noise.
                    </p>
                  </section>
                </div>
                <div className="p-6 bg-stone-50 dark:bg-black/40 rounded-xl border border-stone-100 dark:border-white/5 space-y-4">
                   <p className="font-serif italic text-[11px] text-stone-500 dark:text-stone-400 text-center leading-snug">
                     Structural integrity is maintained through consistent, high-fidelity input. Minimalist protocols are enforced site-wide to preserve cognitive clarity.
                   </p>
                   <a 
                    href="https://ko-fi.com/mimizine" 
                    target="_blank" 
                    className="w-full py-3 bg-red-950 text-white rounded-full font-sans text-[8px] uppercase tracking-[0.4em] font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg mt-4"
                   >
                      <Martini size={12} strokeWidth={1.5} /> Imperial Patronage
                   </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 md:pt-10 border-t border-stone-100 dark:border-stone-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="font-serif italic text-stone-400 text-sm">"The market is yours to edit."</p>
            <button onClick={onClose} className="w-full md:w-auto px-12 py-4 bg-stone-900 dark:bg-white text-white dark:text-black font-sans text-[10px] tracking-[0.4em] uppercase font-black rounded-full active:scale-95 transition-all shadow-xl">
               Accept Proposal
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};