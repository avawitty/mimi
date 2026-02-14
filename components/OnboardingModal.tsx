
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Fingerprint, Anchor } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { TypographicArchetype } from '../types';

const ARCHETYPES: { id: TypographicArchetype; label: string; desc: string }[] = [
  { id: 'editorial-serif', label: 'The Editor', desc: 'Serif precision. High-contrast logic. You value structure and narrative hierarchy.' },
  { id: 'minimalist-sans', label: 'The Minimalist', desc: 'Sans-serif purity. Negative space as a feature. You value clarity and reduction.' },
  { id: 'brutalist-mono', label: 'The Brutalist', desc: 'Monospaced raw data. Exposed structural elements. You value honesty and texture.' }
];

export const OnboardingModal: React.FC = () => {
  const { updateProfile, profile } = useUser();
  const [step, setStep] = useState(0);
  const [archetype, setArchetype] = useState<TypographicArchetype>('editorial-serif');
  const [anchor, setAnchor] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  const handleComplete = async () => {
    if (!profile) return;
    setIsCommitting(true);
    try {
        await updateProfile({
            ...profile,
            onboardingComplete: true,
            tasteProfile: {
                ...profile.tasteProfile,
                dominant_archetypes: [archetype],
                inspirations: anchor
            }
        });
        // Force a slight delay to let the animation play out
        setTimeout(() => window.location.reload(), 500); 
    } catch (e) {
        console.error("Calibration Failed", e);
        setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[20000] bg-nous-base dark:bg-[#050505] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-12 md:p-16 rounded-sm relative overflow-hidden"
      >
        {/* PROGRESS BAR */}
        <div className="absolute top-0 left-0 h-1 bg-stone-100 dark:bg-stone-800 w-full">
            <motion.div 
                className="h-full bg-emerald-500" 
                animate={{ width: `${((step + 1) / 3) * 100}%` }} 
            />
        </div>

        <AnimatePresence mode="wait">
            {step === 0 && (
                <motion.div key="intro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10 text-center">
                    <div className="flex justify-center">
                        <div className="p-6 bg-stone-50 dark:bg-stone-800 rounded-full">
                            <Sparkles size={32} className="text-emerald-500 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="font-serif text-5xl md:text-6xl italic tracking-tighter text-nous-text dark:text-white">Calibration.</h1>
                        <p className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-stone-400">System Initialization</p>
                    </div>
                    <p className="font-serif italic text-xl text-stone-500 leading-relaxed max-w-md mx-auto">
                        Mimi is not a tool; she is a sovereign observer. Before we begin, we must calibrate the machine to your specific aesthetic frequency.
                    </p>
                    <button onClick={() => setStep(1)} className="px-12 py-5 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[10px] uppercase tracking-[0.4em] font-black rounded-full shadow-xl hover:scale-105 transition-transform">
                        Begin Sequence
                    </button>
                </motion.div>
            )}

            {step === 1 && (
                <motion.div key="archetype" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                    <div className="text-center space-y-2">
                        <h2 className="font-serif text-4xl italic tracking-tighter">Select Archetype.</h2>
                        <p className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-400">Define Your Structural Logic</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        {ARCHETYPES.map((arch) => (
                            <button 
                                key={arch.id} 
                                onClick={() => setArchetype(arch.id)}
                                className={`p-6 border text-left space-y-4 transition-all group ${archetype === arch.id ? 'border-emerald-500 bg-emerald-50/10' : 'border-stone-200 dark:border-stone-800 hover:border-stone-400'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className={`w-3 h-3 rounded-full ${archetype === arch.id ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-800'}`} />
                                    {archetype === arch.id && <Check size={14} className="text-emerald-500" />}
                                </div>
                                <div>
                                    <h3 className="font-sans text-[9px] uppercase tracking-widest font-black mb-2">{arch.label}</h3>
                                    <p className="font-serif italic text-sm text-stone-500 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors">{arch.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <button onClick={() => setStep(2)} className="flex items-center gap-3 font-sans text-[9px] uppercase tracking-widest font-black text-nous-text dark:text-white hover:text-emerald-500 transition-colors">
                            Confirm Logic <ArrowRight size={14} />
                        </button>
                    </div>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div key="anchor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 text-center">
                    <div className="space-y-2">
                        <h2 className="font-serif text-4xl italic tracking-tighter">The First Anchor.</h2>
                        <p className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-400">One word to define your era.</p>
                    </div>
                    
                    <div className="max-w-sm mx-auto relative">
                        <input 
                            value={anchor}
                            onChange={(e) => setAnchor(e.target.value)}
                            placeholder="e.g. Velvet, Cyber, Decay..."
                            className="w-full bg-transparent border-b-2 border-stone-200 dark:border-stone-800 py-4 text-center font-serif text-3xl italic focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-300"
                            autoFocus
                        />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-300">
                            <Anchor size={18} />
                        </div>
                    </div>

                    <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 max-w-xs mx-auto leading-relaxed">
                        This word will act as the seed for your first algorithmic refraction. Choose carefully.
                    </p>

                    <button 
                        onClick={handleComplete} 
                        disabled={!anchor.trim() || isCommitting}
                        className="px-12 py-5 bg-emerald-500 text-white font-sans text-[10px] uppercase tracking-[0.4em] font-black rounded-full shadow-2xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCommitting ? 'Anchoring...' : 'Enter Studio'}
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
