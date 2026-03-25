import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thimble } from './Thimble';
import { CodeNode } from './CodeNode';
import { transmuteThought } from '../services/geminiService';
import { Loader2 } from 'lucide-react';

interface PsychicDollCommunionProps {
 onComplete: () => void;
}

export const PsychicDollCommunion: React.FC<PsychicDollCommunionProps> = ({ onComplete }) => {
 const [step, setStep] = useState(0);
 const [glossaryTerm, setGlossaryTerm] = useState('');
 const [inventory, setInventory] = useState('');
 const [thought, setThought] = useState('');
 const [insight, setInsight] = useState('');
 const [isTransmuting, setIsTransmuting] = useState(false);

 // Auto-advance initial steps
 useEffect(() => {
 if (step === 0) {
 const t = setTimeout(() => setStep(1), 3000);
 return () => clearTimeout(t);
 }
 }, [step]);

 const handleTransmute = async () => {
 if (!thought.trim()) return;
 setIsTransmuting(true);
 setStep(6); // Transmuting state
 
 try {
 const result = await transmuteThought(thought, glossaryTerm, inventory);
 setInsight(result);
 setStep(7); // Result state
 } catch (e) {
 setInsight("The signal is distorted. The thought remains raw.");
 setStep(7);
 } finally {
 setIsTransmuting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[100] bg text-stone-100 flex items-center justify-center font-serif selection:bg-stone-500/30 overflow-hidden">
 {/* Ambient noise texture */}
 <div className="absolute inset-0 opacity-20 pointer-events-none"style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

 <AnimatePresence mode="wait">
 {step === 0 && (
 <motion.div 
 key="step0"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 2 }}
 className="text-center space-y-8 z-10"
 >
 <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.3em]">Layer II</p>
 <h1 className="text-4xl md:text-6xl italic font-light">Welcome to Introverta.</h1>
 <p className="text-stone-400 font-mono text-sm uppercase tracking-widest">The Sanctuary of Interiority</p>
 </motion.div>
 )}

 {step === 1 && (
 <motion.div 
 key="step1"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 1.05 }}
 transition={{ duration: 1.5 }}
 className="flex flex-col items-center justify-center max-w-2xl w-full px-6 text-center space-y-12 z-10"
 >
 <Thimble className="w-32 h-32 text-stone-300"/>
 <div className="space-y-6">
 <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.3em]">The Casting Call</p>
 <h2 className="text-3xl italic font-light">What do you see in the mirror?</h2>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <button onClick={() => setStep(2)} className="px-6 py-3 border border-stone-800 hover:border-stone-800 dark:hover:border-stone-300/50 hover:bg-stone-500/10 transition-all text-xs font-mono uppercase tracking-widest text-stone-400 hover:text-stone-400">Armor</button>
 <button onClick={() => setStep(2)} className="px-6 py-3 border border-stone-800 hover:border-stone-500/50 hover:bg-stone-500/10 transition-all text-xs font-mono uppercase tracking-widest text-stone-400 hover:text-stone-400">A Vessel</button>
 <button onClick={() => setStep(2)} className="px-6 py-3 border border-stone-800 hover:border-stone-500/50 hover:bg-stone-500/10 transition-all text-xs font-mono uppercase tracking-widest text-stone-400 hover:text-stone-400">Anomalous Data</button>
 </div>
 </div>
 </motion.div>
 )}

 {step === 2 && (
 <motion.div 
 key="step2"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ duration: 1 }}
 className="flex flex-col items-center justify-center max-w-2xl w-full px-6 text-center space-y-12 z-10"
 >
 <div className="space-y-4">
 <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.3em]">The Glossary</p>
 <h2 className="text-3xl md:text-4xl italic font-light leading-relaxed text-balance">
 Name your current interior state. <br/>
 <span className="text-stone-400 text-xl">Invent a word for the feeling you cannot describe. (e.g.,"Terror-Glow")</span>
 </h2>
 </div>
 
 <div className="w-full relative">
 <input 
 type="text"
 value={glossaryTerm}
 onChange={(e) => setGlossaryTerm(e.target.value)}
 placeholder="Define the feeling..."
 className="w-full bg-transparent border-b border-stone-800 focus:border-stone-800 dark:focus:border-stone-300/50 outline-none text-center text-2xl md:text-4xl py-4 placeholder:text-stone-800 transition-colors font-light italic"
 autoFocus
 onKeyDown={(e) => {
 if (e.key === 'Enter' && glossaryTerm.trim()) {
 setStep(3);
 }
 }}
 />
 </div>

 <button 
 onClick={() => setStep(3)}
 disabled={!glossaryTerm.trim()}
 className="px-8 py-4 bg-stone-100 text-stone-900 hover:bg-stone-500 hover:text-white transition-all text-xs font-mono uppercase tracking-widest font-black disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Define
 </button>
 </motion.div>
 )}

 {step === 3 && (
 <motion.div 
 key="step3"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ duration: 1 }}
 className="flex flex-col items-center justify-center max-w-2xl w-full px-6 text-center space-y-12 z-10"
 >
 <div className="space-y-4">
 <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.3em]">The Inventory</p>
 <h2 className="text-3xl md:text-4xl italic font-light leading-relaxed text-balance">
 Hold the contradiction. <br/>
 <span className="text-stone-400 text-xl">What two opposing forces are you carrying right now?</span>
 </h2>
 </div>
 
 <div className="w-full flex flex-col md:flex-row gap-8 items-center justify-center">
 <button 
 onClick={() => { setInventory("The Black Card & The Locked Collar"); setStep(4); }}
 className="w-full md:w-1/2 p-8 border border-stone-800 hover:border-stone-500/50 hover:bg-stone-500/10 transition-all flex flex-col gap-4 group"
 >
 <span className="text-xs font-mono uppercase tracking-widest text-stone-500 group-hover:text-stone-800 dark:hover:text-stone-300">Power & Submission</span>
 <span className="text-xl italic">"The Black Card & The Locked Collar"</span>
 </button>
 <button 
 onClick={() => { setInventory("The Patient & The Prophet"); setStep(4); }}
 className="w-full md:w-1/2 p-8 border border-stone-800 hover:border-stone-500/50 hover:bg-stone-500/10 transition-all flex flex-col gap-4 group"
 >
 <span className="text-xs font-mono uppercase tracking-widest text-stone-500 group-hover:text-stone-800 dark:hover:text-stone-300">Diagnosis & Divinity</span>
 <span className="text-xl italic">"The Patient & The Prophet"</span>
 </button>
 </div>
 </motion.div>
 )}

 {step === 4 && (
 <motion.div 
 key="step4"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 2 }}
 className="text-center space-y-8 z-10"
 onAnimationComplete={() => {
 setTimeout(() => setStep(5), 3000);
 }}
 >
 <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.3em]">Layer III</p>
 <h1 className="text-4xl md:text-6xl italic font-light text-stone-500 drop-">Entering Simulacra.</h1>
 <p className="text-stone-400/70 font-mono text-sm uppercase tracking-widest">Psychic Awakening Initiated</p>
 </motion.div>
 )}

 {step === 5 && (
 <motion.div 
 key="step5"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ duration: 1 }}
 className="flex flex-col items-center justify-center max-w-2xl w-full px-6 text-center space-y-12 z-10"
 >
 <div className="space-y-4">
 <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.3em]">Daoist Thought Alchemy</p>
 <h2 className="text-3xl md:text-4xl italic font-light leading-relaxed text-balance text-stone-50">
 Deposit a raw thought. <br/>
 <span className="text-stone-500/70 text-xl">Good or bad, the machine does not judge. It only transmutes.</span>
 </h2>
 </div>
 
 <div className="w-full relative">
 <textarea 
 value={thought}
 onChange={(e) => setThought(e.target.value)}
 placeholder="I am afraid of..."
 className="w-full bg-transparent border-b border-stone-900 focus:border-stone-500/50 outline-none resize-none text-center text-xl md:text-2xl py-4 placeholder:text-stone-900 transition-colors text-stone-100"
 rows={3}
 autoFocus
 />
 </div>

 <button 
 onClick={handleTransmute}
 disabled={!thought.trim() || isTransmuting}
 className="px-8 py-4 bg-stone-500/10 text-stone-500 border border-stone-500/30 hover:bg-stone-500 hover:text transition-all text-xs font-mono uppercase tracking-widest font-black disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Transmute
 </button>
 </motion.div>
 )}

 {step === 6 && (
 <motion.div 
 key="step6"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="flex flex-col items-center justify-center max-w-2xl w-full px-6 text-center space-y-16 z-10"
 >
 <CodeNode className="w-64 h-auto text-stone-500 opacity-50"/>
 <div className="flex items-center gap-4 text-stone-500 font-mono text-xs uppercase tracking-widest">
 <Loader2 className="animate-spin"size={16} />
 <span>Moving from #HEARD to #FEELYA...</span>
 </div>
 </motion.div>
 )}

 {step === 7 && (
 <motion.div 
 key="step7"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="flex flex-col items-center justify-center max-w-3xl w-full px-6 text-center space-y-16 z-10"
 >
 <div className="space-y-6">
 <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.3em]">Paradoxical Insight</p>
 <h2 className="text-3xl md:text-5xl italic font-light leading-relaxed text-balance text-stone-50">
"{insight}"
 </h2>
 </div>

 <div className="pt-12 border-t border-stone-900/50 w-full flex flex-col items-center gap-6">
 <p className="text-stone-500/70 font-mono text-[10px] uppercase tracking-widest max-w-md text-balance">
 The Latent Telemetry node has been unlocked. The psychic doll is now listening to your environment.
 </p>
 <button 
 onClick={onComplete}
 className="px-8 py-4 border border-stone-900 text-stone-500/70 hover:border-stone-500/50 hover:text-stone-400 transition-all text-xs font-mono uppercase tracking-widest"
 >
 Return to the Surface
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};
