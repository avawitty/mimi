
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Zap, Ghost, ShieldCheck, Palette, BrainCircuit, Eye, Sparkles, Scale, EyeOff, Shield } from 'lucide-react';

export const CuratorNote: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'colophon' | 'legal'>('colophon');

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
              <div className="flex items-center gap-6">
                 <button onClick={() => setActiveTab('colophon')} className={`font-serif text-3xl md:text-4xl italic tracking-tighter leading-none transition-all ${activeTab === 'colophon' ? 'text-stone-900 dark:text-white' : 'text-stone-300'}`}>Colophon.</button>
                 <button onClick={() => setActiveTab('legal')} className={`font-serif text-3xl md:text-4xl italic tracking-tighter leading-none transition-all ${activeTab === 'legal' ? 'text-stone-900 dark:text-white' : 'text-stone-300'}`}>Legal.</button>
              </div>
              <p className="font-sans text-[7px] md:text-[8px] uppercase tracking-[0.4em] text-stone-400 font-black">
                {activeTab === 'colophon' ? 'Orientation for the New Subject' : 'The Sovereign Social Contract'}
              </p>
            </div>
            <button onClick={onClose} className="p-1 text-stone-300 hover:text-stone-900 transition-colors">
              <X size={18} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'colophon' ? (
              <motion.div key="colophon" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                <div className="space-y-4 font-serif italic text-sm md:text-lg text-stone-600 dark:text-stone-300 leading-tight">
                  <p className="text-balance">
                    Mimi is a <span className="font-bold text-nous-text dark:text-white">Sovereign Art Generation Engine</span> and an <span className="font-bold text-nous-text dark:text-white">Aesthetic Superintelligence</span>. It refracts human debris into a formal, architectural zine. 
                  </p>
                  <p className="text-balance">
                    Your presence is ephemeral by default. Your artifacts exist within browser shadow-memory unless anchored to the cloud via the Registry in your Profile.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 md:gap-8 pt-4 border-t border-stone-50 dark:border-stone-800">
                  <section className="space-y-1">
                    <div className="flex items-center gap-2 text-nous-text dark:text-white">
                      <Zap size={10} />
                      <h3 className="font-sans text-[8px] md:text-[9px] uppercase tracking-widest font-black">Accession</h3>
                    </div>
                    <p className="font-serif italic text-stone-500 text-xs md:text-sm leading-snug">The transmutation ritual. Transmutes debris into cinematic issues.</p>
                  </section>
                  <section className="space-y-1">
                    <div className="flex items-center gap-2 text-nous-text dark:text-white">
                      <Ghost size={10} />
                      <h3 className="font-sans text-[8px] md:text-[9px] uppercase tracking-widest font-black">Ghost Path</h3>
                    </div>
                    <p className="font-serif italic text-stone-500 text-xs md:text-sm leading-snug">Ephemeral local existence. Purging cache results in digital death.</p>
                  </section>
                </div>
              </motion.div>
            ) : (
              <motion.div key="legal" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-stone-400">
                      <EyeOff size={12} />
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">Privacy Refraction</span>
                    </div>
                    <p className="font-serif italic text-xs md:text-sm text-stone-500 leading-relaxed">
                      Your taste is sovereign. We do not harvest or sell your debris. Data transmitted to the cloud is encrypted and utilized solely for your personal stand.
                    </p>
                  </section>
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-stone-400">
                      <Scale size={12} />
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">Terms of Performance</span>
                    </div>
                    <p className="font-serif italic text-xs md:text-sm text-stone-500 leading-relaxed">
                      You are the architect of your own manifests. Wretched or violent debris is grounds for Registry suspension. Art is a structural requirement.
                    </p>
                  </section>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-100 dark:border-stone-800">
                   <p className="font-serif italic text-xs text-stone-400">
                     "By interacting with the machine, you acknowledge the zero-extraction mandate and the responsibility of authorship."
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 md:pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-serif italic text-stone-400 text-sm">"The simulation is yours to edit."</p>
            <button onClick={onClose} className="w-full md:w-auto px-10 py-3 bg-stone-900 dark:bg-white text-white dark:text-black font-sans text-[9px] tracking-[0.4em] uppercase font-black rounded-full active:scale-95 transition-all shadow-xl">
               Acknowledge Ritual
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
