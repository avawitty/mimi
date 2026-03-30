import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { generateAestheticDNA } from '../services/geminiService';

const TEXTURES = [
  'Oxidized Aluminum', 'Damp Concrete', 'Crushed Silk', 
  'Frosted Glass', 'Burnt Wood', 'Polished Obsidian'
];

const FEARS = [
  'Stagnation', 'Visibility', 'Derivation', 
  'Irrelevance', 'Overexposure', 'Compromise'
];

const LIGHTING = [
  'Rembrandt Bulb', 'Neon Wash', 'Clinical Fluorescent', 
  'Golden Hour', 'Harsh Flash', 'Bioluminescence'
];

export const AestheticOnboarding: React.FC = () => {
  const { updateProfile, profile } = useUser();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dna, setDna] = useState<any>(null);

  const handleSelect = async (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Generate DNA
      setIsGenerating(true);
      try {
        const generatedDna = await generateAestheticDNA(newAnswers);
        if (generatedDna && profile) {
          setDna(generatedDna);
          await updateProfile({
            ...profile,
            aestheticDNA: generatedDna,
            onboardingComplete: true
          });
        }
      } catch (e) {
        console.error("Failed to generate DNA:", e);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleComplete = () => {
    // Force a reload or state update to exit onboarding
    window.location.reload();
  };

  if (dna) {
    return (
      <div className="fixed inset-0 z-[60000] bg-nous-base flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-md bg-[#050505] border border-nous-border p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-white" />
          
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.4em] text-nous-subtle font-black">Aesthetic ID Badge</h2>
              <h1 className="font-serif text-3xl italic text-white">{dna.dnaStatement}</h1>
            </div>

            <div className="space-y-4 border-t border-b border-white/10 py-6">
              <div>
                <p className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle mb-2">Dominant Archetypes</p>
                <div className="flex flex-wrap gap-2">
                  {dna.archetypes.map((arch: string, i: number) => (
                    <span key={i} className="px-2 py-1 border border-white/20 text-white font-mono text-[9px] uppercase tracking-wider">
                      {arch}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle mb-2">Poetic Expansion</p>
                <p className="font-serif text-sm text-white/80 leading-relaxed italic">
                  {dna.poeticExpansion}
                </p>
              </div>
            </div>

            <button 
              onClick={handleComplete}
              className="w-full py-4 bg-white text-black font-sans text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              Enter The Machine <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60000] bg-nous-base flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl italic text-nous-text mb-2">The Casting Call.</h1>
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-nous-subtle">
            {step === 0 ? 'Step 1 of 3' : step === 1 ? 'Step 2 of 3' : 'Step 3 of 3'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-6 py-12"
            >
              <Sparkles size={32} className="text-nous-text animate-pulse" />
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-nous-subtle animate-pulse">
                Synthesizing Aesthetic DNA...
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="space-y-8"
            >
              <h2 className="font-serif text-2xl text-center text-nous-text">
                {step === 0 && "Select your elemental texture."}
                {step === 1 && "What is your primary creative fear?"}
                {step === 2 && "Choose a cinematic lighting bias."}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(step === 0 ? TEXTURES : step === 1 ? FEARS : LIGHTING).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className="p-6 border border-nous-border hover:bg-nous-text hover:text-nous-base transition-all text-left group"
                  >
                    <span className="font-sans text-[11px] uppercase tracking-widest font-bold block group-hover:text-nous-base text-nous-text">
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
