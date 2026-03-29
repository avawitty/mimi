
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Shield, User, Hash } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { TypographicArchetype } from '../types';

const INTERESTS = [
 'Editorial Design', 'Cybernetics', 'Brutalism', 'Minimalism', 
 'Typography', 'Generative Art', 'Analog Photography', 'Soundscapes',
 'Architecture', 'Fashion Archives', 'Web3', 'Occult'
];

export const OnboardingModal: React.FC = () => {
 const { updateProfile, profile } = useUser();
 const [step, setStep] = useState(0);
 const [displayName, setDisplayName] = useState('');
 const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
 const [consentGiven, setConsentGiven] = useState(false);
 const [isCommitting, setIsCommitting] = useState(false);

 const toggleInterest = (interest: string) => {
 setSelectedInterests(prev => 
 prev.includes(interest) 
 ? prev.filter(i => i !== interest)
 : [...prev, interest]
 );
 };

 const handleComplete = async () => {
 if (!profile) return;
 setIsCommitting(true);
 try {
 await updateProfile({
 ...profile,
 displayName: displayName.trim() || profile.displayName || 'Anonymous',
 onboardingComplete: true,
 tasteProfile: {
 ...profile.tasteProfile,
 inspirations: selectedInterests.join(', ')
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
 <div className="fixed inset-0 z-[20000] bg-nous-base flex items-center justify-center p-6">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }} 
 animate={{ opacity: 1, scale: 1 }} 
 className="w-full max-w-2xl bg-white border border-nous-border p-12 md:p-16 rounded-none relative overflow-hidden shadow-2xl"
 >
 {/* PROGRESS BAR */}
 <div className="absolute top-0 left-0 h-1 bg-nous-base w-full">
 <motion.div 
 className="h-full bg-nous-base"
 animate={{ width: `${((step + 1) / 3) * 100}%` }} 
 />
 </div>

 <AnimatePresence mode="wait">
 {/* STEP 1: CONSENT & INTRO */}
 {step === 0 && (
 <motion.div key="intro"initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10 text-center">
 <div className="flex justify-center">
 <div className="p-6 bg-nous-base rounded-full">
 <Shield size={32} className="text-nous-text"/>
 </div>
 </div>
 <div className="space-y-4">
 <h1 className="font-serif text-5xl md:text-6xl italic tracking-tighter text-nous-text ">The Vanguard.</h1>
 <p className="font-sans text-[10px] uppercase tracking-[0.4em] font-bold text-nous-subtle">Sovereign Initialization</p>
 </div>
 <div className="space-y-6 max-w-md mx-auto text-left">
 <p className="font-serif italic text-lg text-nous-subtle leading-relaxed text-center">
 Mimi is a sovereign editorial machine. Your data remains yours. We do not train public models on your private archives.
 </p>
 <label className="flex items-start gap-4 p-4 border border-nous-border cursor-pointer hover:bg-nous-base /50 transition-colors">
 <div className="pt-1">
 <input 
 type="checkbox"
 checked={consentGiven}
 onChange={(e) => setConsentGiven(e.target.checked)}
 className="w-4 h-4 accent-stone-900 dark:accent-stone-100"
 />
 </div>
 <span className="font-sans text-xs leading-relaxed text-nous-subtle">
 I consent to the processing of my aesthetic data for my personal use only. I understand my archives are encrypted and sovereign.
 </span>
 </label>
 </div>
 <button 
 onClick={() => setStep(1)} 
 disabled={!consentGiven}
 className="px-12 py-4 bg-nous-base  text-white font-sans text-[10px] uppercase tracking-[0.3em] font-bold rounded-none hover:bg-nous-base dark:hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Accept & Continue
 </button>
 </motion.div>
 )}

 {/* STEP 2: DISPLAY NAME */}
 {step === 1 && (
 <motion.div key="name"initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 text-center">
 <div className="flex justify-center">
 <div className="p-6 bg-nous-base rounded-full">
 <User size={32} className="text-nous-text"/>
 </div>
 </div>
 <div className="space-y-4">
 <h2 className="font-serif text-4xl md:text-5xl italic tracking-tighter text-nous-text text-nous-text">Your Moniker.</h2>
 <p className="font-sans text-[10px] uppercase tracking-[0.4em] font-bold text-nous-subtle">Establish Identity</p>
 </div>
 
 <div className="max-w-sm mx-auto relative">
 <input 
 value={displayName}
 onChange={(e) => setDisplayName(e.target.value)}
 placeholder="e.g. Architect, Void, 0xMimi..."
 className="w-full bg-transparent border-b-2 border-nous-border py-4 text-center font-serif text-3xl italic focus:outline-none focus:border-nous-border dark:focus:border-nous-border transition-colors placeholder:text-nous-subtle dark:placeholder:text-nous-subtle text-nous-text text-nous-text"
 autoFocus
 onKeyDown={(e) => e.key === 'Enter' && displayName.trim() && setStep(2)}
 />
 </div>

 <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle max-w-xs mx-auto leading-relaxed">
 This is how you will be known within the community loop. It can be changed later.
 </p>

 <button 
 onClick={() => setStep(2)} 
 disabled={!displayName.trim()}
 className="px-12 py-4 bg-nous-base  text-white font-sans text-[10px] uppercase tracking-[0.3em] font-bold rounded-none hover:bg-nous-base dark:hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
 >
 Next <ArrowRight size={14} />
 </button>
 </motion.div>
 )}

 {/* STEP 3: INTERESTS */}
 {step === 2 && (
 <motion.div key="interests"initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
 <div className="text-center space-y-4">
 <div className="flex justify-center mb-6">
 <div className="p-6 bg-nous-base rounded-full">
 <Hash size={32} className="text-nous-text"/>
 </div>
 </div>
 <h2 className="font-serif text-4xl md:text-5xl italic tracking-tighter text-nous-text text-nous-text">Aesthetic Vectors.</h2>
 <p className="font-sans text-[10px] uppercase tracking-[0.4em] font-bold text-nous-subtle">Select 3 or more</p>
 </div>
 
 <div className="flex flex-wrap justify-center gap-3 max-w-xl mx-auto">
 {INTERESTS.map((interest) => {
 const isSelected = selectedInterests.includes(interest);
 return (
 <button 
 key={interest}
 onClick={() => toggleInterest(interest)}
 className={`px-4 py-2 font-sans text-[10px] uppercase tracking-widest border transition-all duration-300 ${
 isSelected 
 ? 'bg-nous-text text-nous-base border-nous-text ' 
 : 'bg-transparent text-nous-subtle border-nous-border hover:border-nous-border '
 }`}
 >
 {interest}
 </button>
 );
 })}
 </div>

 <div className="flex justify-center pt-4">
 <button 
 onClick={handleComplete} 
 disabled={selectedInterests.length < 3 || isCommitting}
 className="px-12 py-4 bg-nous-base  text-white font-sans text-[10px] uppercase tracking-[0.3em] font-bold rounded-none hover:bg-nous-base dark:hover:bg-stone-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
 >
 {isCommitting ? (
 <><Sparkles size={14} className="animate-pulse"/> Calibrating...</>
 ) : (
 'Enter The Machine'
 )}
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 </div>
 );
};
