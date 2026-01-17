
import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, CreditCard, Sparkles } from 'lucide-react';

interface StructuralPageProps {
  type: 'orientation' | 'evolution' | 'access';
  onClose: () => void;
}

const CONTENT = {
  orientation: {
    title: 'Curator’s Note',
    subtitle: 'On the Intent of Mimi',
    body: (
      <div className="space-y-8 font-serif italic text-lg md:text-xl text-stone-500 dark:text-stone-400 leading-relaxed text-balance">
        <p>
          Mimi Zine is an experiment in digital solitude. It is an editorial machine designed to transmute the raw debris of thought into structured artifacts, preserving the intimacy of the private notebook while introducing the gravity of the archival press.
        </p>
        <p>
          We prioritize the void over the feed. This is not a social tool, but a structural one—a place where the performance of existence is suspended in favor of a quiet, intentional refraction.
        </p>
        <div className="border-l-2 border-nous-text dark:border-white pl-6 py-4 space-y-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-nous-text dark:text-white font-black">Mandate of Discovery</p>
          <p className="text-nous-text dark:text-white">
            Do not seek a manual. The editor is a ritual space, not a utility. **Mess around and find out.** Intuition is your only map; discovery is your only reward. If a gesture feels cryptic, perform it anyway. Experience is the only architect here.
          </p>
        </div>
      </div>
    )
  },
  evolution: {
    title: 'Trace Log',
    subtitle: 'Continuity and Development',
    body: (
      <div className="space-y-12">
        <div className="space-y-6">
          <div className="flex justify-between items-baseline border-b border-stone-100 dark:border-stone-800 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">v1.4 — Influence Protocol</span>
            <span className="font-serif italic text-sm text-stone-300">Mimi Müse Handshake</span>
          </div>
          <p className="font-serif italic text-stone-500 text-base">Implementation of the **Müse Registry**. Users may now anchor their identity to become Mimi Müses and join our aesthetic broadcast.</p>
        </div>
        <div className="space-y-6 opacity-60">
          <div className="flex justify-between items-baseline border-b border-stone-100 dark:border-stone-800 pb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">v1.3</span>
            <span className="font-serif italic text-sm text-stone-300">Acoustic Handshake</span>
          </div>
          <p className="font-serif italic text-stone-500 text-base">Refined PCM decoding to ensure Coral's transmissions survive browser horizontalization.</p>
        </div>
        <div className="pt-8 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black text-stone-400">Müse Status</span>
          </div>
          <p className="font-serif italic text-stone-400 text-sm">
            Registry is open via the emerald Zap. Anchored identities are prioritized for the **Sovereign Spotlight** and highlighted artifacts.
          </p>
        </div>
      </div>
    )
  },
  access: {
    title: 'Handling Instructions',
    subtitle: 'Conditions of Use',
    body: (
      <div className="space-y-8 font-serif italic text-lg text-stone-500 dark:text-stone-400 leading-relaxed">
        <p>
          What you write here belongs to the silence from which it came. Your data is stored locally in your browser's shadow-memory unless you choose a **Permanent Anchor**.
        </p>
        <p>
          **Permanent Anchors** (Mimi Müses) enjoy cloud-registry persistence, meaning your artifacts survive the purging of browser caches. We do not harvest your taste; we merely archive it for your future self.
        </p>
        <div className="pt-8 border-t border-stone-100 dark:border-stone-800">
           <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-stone-400 font-black block mb-2">Visibility Protocol</span>
           <p className="text-sm">Default state is **Vaulted**. Artifacts only appear in the **Season** (Social Floor) if you explicitly decree them as **Broadcasting**.</p>
        </div>
      </div>
    )
  }
};

export const StructuralPage: React.FC<StructuralPageProps> = ({ type, onClose }) => {
  const page = CONTENT[type];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9000] flex items-center justify-center p-6 md:p-12 bg-nous-base/95 dark:bg-nous-dark-base/98 backdrop-blur-2xl"
    >
      <div className="relative w-full max-w-xl">
        <div className="flex justify-between items-start mb-16">
          <div className="space-y-2">
            <h2 className="font-serif text-5xl italic tracking-tighter">{page.title}.</h2>
            <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-400 font-black">{page.subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {page.body}
        </motion.div>
        
        <div className="mt-24 pt-8 border-t border-stone-100 dark:border-stone-800 opacity-20 text-center">
          <span className="font-mono text-[8px] uppercase tracking-widest">Colophon // 2024</span>
        </div>
      </div>
    </motion.div>
  );
};
