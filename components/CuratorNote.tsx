import React from 'react';
import { motion } from 'framer-motion';
import { X, Info, Zap, Ghost, ShieldCheck, Palette, BrainCircuit } from 'lucide-react';

export const CuratorNote: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-nous-base/90 dark:bg-nous-dark-base/95 backdrop-blur-3xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden rounded-sm"
      >
        <div className="p-8 md:p-12 space-y-12 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="font-serif text-4xl italic tracking-tighter">Curator’s Note.</h2>
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-400 font-black">Orientation for the New Subject</p>
            </div>
            <button onClick={onClose} className="p-2 text-stone-300 hover:text-stone-900 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-12 pt-8">
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-3 text-nous-text dark:text-white">
                  <Zap size={16} />
                  <h3 className="font-sans text-[11px] uppercase tracking-widest font-black">Accession</h3>
                </div>
                <p className="font-serif italic text-stone-500 text-lg leading-relaxed">
                  The primary ritual. It transmutes your raw "debris" (notes, lyrics, logs) into a curated cinematic zine.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-nous-text dark:text-white">
                  <Palette size={16} />
                  <h3 className="font-sans text-[11px] uppercase tracking-widest font-black">Tone Tags</h3>
                </div>
                <p className="font-serif italic text-stone-500 text-lg leading-relaxed">
                  Refraction filters that dictate the zine's layout logic, prose rhythm, and visual density.
                </p>
              </section>
            </div>

            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-3 text-nous-text dark:text-white">
                  <Ghost size={16} />
                  <h3 className="font-sans text-[11px] uppercase tracking-widest font-black">Ghost Protocol</h3>
                </div>
                <p className="font-serif italic text-stone-500 text-lg leading-relaxed">
                  The ephemeral path. Your refractions exist only in this local shadow-memory. No traces on the cloud.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-nous-text dark:text-white">
                  <ShieldCheck size={16} />
                  <h3 className="font-sans text-[11px] uppercase tracking-widest font-black">Permanent Anchor</h3>
                </div>
                <p className="font-serif italic text-stone-500 text-lg leading-relaxed">
                  Synchronizes your archive across dimensions using a Google Identity.
                </p>
              </section>
            </div>
          </div>

          <div className="pt-12 border-t border-stone-100 dark:border-stone-800 text-center">
            <p className="font-serif italic text-stone-400 text-xl">"Beauty is a structural requirement."</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
