import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, Plus, Mic, Globe, Eraser, BrainCircuit, X, Paperclip, Zap, MapPin, Scissors, Sparkles, Wand2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const PROVOCATIONS = [
"If your aesthetic was a structural law, what would it decree?",
"What is the texture of the silence here?",
"Deconstruct the primary anchor.",
"Introduce a brutalist contradiction.",
"Consider the artifact as a ruin.",
"Bleed the colors into the semantic layer.",
"Obscure the obvious.",
"What if the subject is actually the background?",
"Elevate the mundane to the mythological.",
"Find the tension between the organic and the synthetic.",
"Let the negative space dictate the narrative."
];

const TAGS = ['chic', 'nostalgia', 'dream', 'unhinged', 'panic', 'editorial'];

interface MobileStudioProps {
 onPublish: (content: string, title: string) => void;
 onClose: () => void;
 onOpenProfile?: () => void;
}

export const MobileStudio: React.FC<MobileStudioProps> = ({ onPublish, onClose, onOpenProfile }) => {
 const { profile, activeThread, setActiveThread } = useUser();
 const [input, setInput] = useState('');
 const [provocationIndex, setProvocationIndex] = useState(0);
 const [activeTag, setActiveTag] = useState('chic');
 const [activeTreatmentId, setActiveTreatmentId] = useState<string | null>(null);

 useEffect(() => {
 const interval = setInterval(() => {
 setProvocationIndex((prev) => (prev + 1) % PROVOCATIONS.length);
 }, 15000);
 return () => clearInterval(interval);
 }, []);

 return (
 <div className="h-full w-full bg flex flex-col font-serif overflow-hidden">
 {/* Main Content (Centered) */}
 <div className="flex-1 flex flex-col items-center justify-center px-8">
 {/* Username */}
 <div className="text-nous-text font-['Cormorant_Garamond',serif] text-2xl font-light tracking-wide mb-6">
 {profile?.handle || 'Swan'}
 </div>

 {activeThread && (
 <div className="mb-6 flex items-center justify-center gap-2">
 <div className="w-2 h-2 rounded-none bg-nous-base0 animate-pulse"/>
 <span className="text-[10px] uppercase tracking-widest text-nous-subtle font-bold">
 Actively Weaving: {activeThread.title}
 </span>
 <button 
 onClick={() => setActiveThread(null)}
 className="text-nous-subtle hover:text-red-500 transition-colors ml-2"
 title="Clear Active Thread"
 >
 <X size={12} />
 </button>
 </div>
 )}

 {/* Prompt Cycle */}
 <AnimatePresence mode="wait">
 <motion.div 
 key={provocationIndex}
 initial={{ opacity: 0, y: 5 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -5 }}
 transition={{ duration: 0.8 }}
 className="text-center italic text-nous-subtle text-[15px] mb-16 max-w-[280px] leading-relaxed"
 >
"{PROVOCATIONS[provocationIndex]}"
 </motion.div>
 </AnimatePresence>

 {/* Input */}
 <textarea
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder="Deposit your memetic debris..."
 className="w-full bg-transparent text-center text-2xl outline-none resize-none placeholder:text-nous-subtle text-nous-subtle italic"
 rows={5}
 />
 </div>

 {/* Bottom Section */}
 <div className="pb-28 px-6 flex flex-col items-center w-full">
 {/* Status Text */}
 <div className="text-nous-text italic text-sm mb-8 transition-opacity duration-500">
 {input.trim() ?"Ready to Manifest":"Input Required to Manifest"}
 </div>

 {/* Toolbar Icons */}
 <div className="w-full max-w-[320px] overflow-x-auto no-scrollbar mb-8">
 <div className="flex items-center justify-start gap-6 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-none border border-white/60 text-nous-text min-w-max">
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><Paperclip size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><Mic size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><Zap size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><BrainCircuit size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><Globe size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><MapPin size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><Scissors size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><Sparkles size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"><Wand2 size={20} strokeWidth={1.25} /></button>
 <button className="hover:opacity-60 transition-opacity flex-shrink-0"onClick={() => setInput('')}><Eraser size={20} strokeWidth={1.25} /></button>
 </div>
 </div>

 {/* Treatment Filters */}
 {profile?.savedTreatments && profile.savedTreatments.length > 0 && (
 <div className="flex items-center justify-center gap-3 mb-6 overflow-x-auto w-full no-scrollbar px-4">
 {profile.savedTreatments.map(t => (
 <button
 key={t.id}
 onClick={() => setActiveTreatmentId(activeTreatmentId === t.id ? null : t.id)}
 className={`whitespace-nowrap px-3 py-1.5 text-[10px] uppercase tracking-widest rounded-none border transition-colors ${activeTreatmentId === t.id ? 'border-nous-border text-nous-text0 bg-nous-base0/10' : 'border-nous-border text-nous-text0 hover:border-nous-border '}`}
 >
 [{t.treatmentName}]
 </button>
 ))}
 </div>
 )}

 {/* Tags */}
 <div className="flex items-center justify-center gap-5 mb-12 overflow-x-auto w-full no-scrollbar text-[15px] italic text-nous-subtle px-4">
 {TAGS.map(tag => (
 <button 
 key={tag}
 onClick={() => setActiveTag(tag)}
 className={`whitespace-nowrap pb-1 border-b-[1.5px] transition-colors ${activeTag === tag ? 'text-nous-subtle border-nous-border' : 'border-transparent hover:text-nous-subtle'}`}
 >
 {tag}
 </button>
 ))}
 </div>

 {/* Footer / Manifest Button */}
 <button 
 onClick={() => {
 if (input.trim()) {
 let finalInput = input;
 if (activeThread && activeThread.narrative) {
 finalInput = `${input}\n\n[THREAD CONTEXT: ${activeThread.narrative}]`;
 }
 
 if (activeTreatmentId && profile?.savedTreatments) {
 const treatment = profile.savedTreatments.find(t => t.id === activeTreatmentId);
 if (treatment) {
 finalInput = `[TREATMENT FILTER ACTIVE: ${treatment.treatmentName}]\nBase Directives: ${treatment.basePromptDirectives}\nTypography: ${treatment.typographyLayout}\nImage Rules: ${treatment.imageEditingRules}\n\n${finalInput}`;
 }
 }

 onPublish(finalInput, 'Untitled');
 }
 }}
 disabled={!input.trim()}
 className={`flex flex-col items-center gap-3 group transition-opacity duration-500 ${input.trim() ? 'opacity-100 cursor-pointer hover:scale-105' : 'opacity-70 cursor-not-allowed'}`}
 >
 <div className="flex items-center gap-2 text-pink-500 font-sans text-[10px] uppercase tracking-[0.25em] font-bold">
 <svg width="16"height="16"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/></svg>
 Colophon Protocol
 </div>
 <div className="flex items-center gap-2 text-[9px] font-sans uppercase tracking-[0.2em] text-nous-subtle">
 <div className={`w-1.5 h-1.5 rounded-none ${input.trim() ? 'bg-stone-400 ' : 'bg-stone-300'}`}></div>
 System Nominal
 </div>
 </button>
 </div>
 </div>
 );
};
