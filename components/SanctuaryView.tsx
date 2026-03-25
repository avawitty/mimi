// @ts-nocheck
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 HeartHandshake, ShieldAlert, Radio, Sparkles, Loader2, 
 CornerDownRight, ShieldCheck, Zap, Compass, Wind, Anchor, 
 Waves, Sun, Moon, BookOpen, PenTool, Check, ArrowRight, 
 X, BrainCircuit, Save, Orbit, Feather, Activity
} from 'lucide-react';
import { executeConfidenceModule, generateCelestialReading, generateSanctuaryReport } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { SanctuaryReport } from '../types';

const MODULES = [
 { id: 'reality_anchor', label: 'Reality Anchor', icon: <Anchor size={14} />, desc: 'Stop triangulation loops.' },
 { id: 'attachment_translator', label: 'Attachment Translator', icon: <HeartHandshake size={14} />, desc: 'Recode jealousy as signal.' },
 { id: 'projection_diffuser', label: 'Projection Diffuser', icon: <ShieldAlert size={14} />, desc: 'Stop self-blame loops.' },
 { id: 'confidence_ledger', label: 'Confidence Ledger', icon: <BookOpen size={14} />, desc: 'Evidence, not hype.' },
 { id: 'language_rewriter', label: 'Language Rewriter', icon: <PenTool size={14} />, desc: 'Stop apologizing.' }
];

export const SanctuaryView: React.FC = () => {
 const { user, profile } = useUser();
 const [activeTab, setActiveTab] = useState<'begin' | 'modules' | 'celestial'>('begin');
 const [activeModule, setActiveModule] = useState(MODULES[0].id);
 const [inputs, setInputs] = useState<Record<string, string>>({});
 const [result, setResult] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [sanctuaryInput, setSanctuaryInput] = useState('');
 const [sanctuaryReport, setSanctuaryReport] = useState<SanctuaryReport | null>(null);

 const handleSanctuaryCalibration = async () => {
 if (!sanctuaryInput.trim() || isLoading) return;
 setIsLoading(true);
 setSanctuaryReport(null);
 try {
 const res = await generateSanctuaryReport(sanctuaryInput, profile);
 setSanctuaryReport(res);
 } catch (e) {
 console.error(e);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-64 px-6 md:px-16 pt-12 md:pt-20 bg text-white transition-all duration-1000 relative selection:bg-white selection:text-black">
 <div className="max-w-5xl mx-auto space-y-16 relative z-10">
 <header className="space-y-8 border-b border-white/10 pb-12">
 <div className="flex items-center gap-4 text-stone-500">
 <ShieldCheck size={18} className="animate-pulse"/>
 <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">The Clearing</span>
 </div>
 <div className="space-y-2">
 <h2 className="font-serif text-6xl md:text-8xl italic tracking-tighter text-white leading-[0.8]">Sanctuary.</h2>
 <p className="font-serif italic text-lg text-stone-400 max-w-2xl">A space for re-calibration. No noise. No feed.</p>
 </div>
 <div className="flex gap-8 pt-4">
 <button onClick={() => setActiveTab('begin')} className={`font-sans text-[9px] uppercase tracking-widest font-black transition-all ${activeTab === 'begin' ? 'text-white border-b border-white pb-1' : 'text-stone-500 hover:text-stone-300'}`}>Calibration</button>
 <button onClick={() => setActiveTab('modules')} className={`font-sans text-[9px] uppercase tracking-widest font-black transition-all ${activeTab === 'modules' ? 'text-white border-b border-white pb-1' : 'text-stone-500 hover:text-stone-300'}`}>Modules</button>
 <button onClick={() => setActiveTab('celestial')} className={`font-sans text-[9px] uppercase tracking-widest font-black transition-all ${activeTab === 'celestial' ? 'text-white border-b border-white pb-1' : 'text-stone-500 hover:text-stone-300'}`}>Celestial</button>
 </div>
 </header>
 <AnimatePresence mode="wait">
 {activeTab === 'begin' && (
 <motion.div key="begin"initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16">
 <div className="grid md:grid-cols-2 gap-16">
 <div className="space-y-8">
 <textarea value={sanctuaryInput} onChange={(e) => setSanctuaryInput(e.target.value)} className="w-full bg-stone-900/50 border border-white/10 p-6 font-serif text-xl italic text-white focus:outline-none focus:border-stone-800 dark:focus:border-stone-300/50 transition-all resize-none h-48 rounded-none"placeholder="The frequency feels distorted..."/>
 <button onClick={handleSanctuaryCalibration} disabled={isLoading || !sanctuaryInput.trim()} className="px-10 py-4 bg-white text-black rounded-none font-sans text-[9px] uppercase tracking-[0.4em] font-black hover:bg-stone-400 transition-all flex items-center gap-4 disabled:opacity-50">
 {isLoading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />} Calibrate Signal
 </button>
 </div>
 <div className="border-l border-white/5 pl-16 flex flex-col justify-center">
 {sanctuaryReport ? (
 <div className="space-y-12">
 <div className="space-y-2">
 <span className="font-sans text-[8px] uppercase tracking-widest text-stone-500 font-black">Validation</span>
 <p className="font-serif italic text-2xl text-white leading-relaxed">{sanctuaryReport.validation}</p>
 </div>
 </div>
 ) : (
 <div className="opacity-20 space-y-4">
 <Activity size={48} />
 <p className="font-serif italic text-2xl">Awaiting input.</p>
 </div>
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
};