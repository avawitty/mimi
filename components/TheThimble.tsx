import React, { useState } from 'react';
import { Search, Loader2, Copy, Check, ShoppingBag, ExternalLink } from 'lucide-react';
import { procureGarments } from '../services/geminiService';

interface SourcingTarget {
 targetArchetype: string;
 keywordBoolean: string;
 emergingDesigner: string;
 rationale: string;
}

interface TheThimbleProps {
 profile: any;
 isOpen: boolean;
}

export const TheThimble: React.FC<TheThimbleProps> = ({ profile, isOpen }) => {
 const [budget, setBudget] = useState('');
 const [objective, setObjective] = useState('');
 const [targets, setTargets] = useState<SourcingTarget[]>([]);
 const [isProcuring, setIsProcuring] = useState(false);
 const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

 if (!isOpen) return null;

 const handleProcure = async () => {
 if (!budget.trim()) return;
 setIsProcuring(true);
 try {
 const results = await procureGarments(profile?.tasteProfile || profile?.aestheticCore ||"Unknown Taste", budget, objective);
 setTargets(results);
 } catch (error) {
 console.error("Procurement failed:", error);
 } finally {
 setIsProcuring(false);
 }
 };

 const copyToClipboard = (text: string, index: number) => {
 navigator.clipboard.writeText(text).catch(e => console.error("MIMI // Clipboard error", e));
 setCopiedIndex(index);
 setTimeout(() => setCopiedIndex(null), 2000);
 };

 const openSearch = (query: string) => {
 window.open(`https://www.grailed.com/shop?query=${encodeURIComponent(query)}`, '_blank');
 };

 return (
 <div className="h-full flex flex-col bg dark:bg text-stone-900 dark:text-stone-100 font-mono text-xs border-l border-stone-200 dark:border-stone-800 relative dark:">
 {/* Texture Overlay */}
 <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-0 mix-blend-overlay"/>
 
 <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white/50 dark:bg-stone-900/50 relative z-10 backdrop-blur-sm">
 <div className="flex items-center gap-2">
 <ShoppingBag className="w-4 h-4 text-stone-400"/>
 <span className="font-bold tracking-widest text-stone-900 dark:text-stone-100 uppercase">The Thimble</span>
 </div>
 <span className="text-[10px] text-stone-500 uppercase tracking-widest">Sourcing</span>
 </div>

 <div className="p-4 border-b border-stone-200 dark:border-stone-800 space-y-4 relative z-10">
 <div className="space-y-2">
 <label className="text-[10px] uppercase tracking-widest text-stone-500">Sourcing Objective</label>
 <input
 type="text"
 value={objective}
 onChange={(e) => setObjective(e.target.value)}
 placeholder="e.g., Winter capsule, Wedding guest, Daily uniform"
 className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors rounded-none"
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] uppercase tracking-widest text-stone-500">Fiscal Constraints</label>
 <input
 type="text"
 value={budget}
 onChange={(e) => setBudget(e.target.value)}
 placeholder="e.g., $50-$150, Uncapped, Under $300"
 className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 transition-colors rounded-none"
 onKeyDown={(e) => e.key === 'Enter' && handleProcure()}
 />
 </div>
 
 <button
 onClick={handleProcure}
 disabled={isProcuring || !budget.trim()}
 className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-3 font-bold uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 rounded-none"
 >
 {isProcuring ? (
 <><Loader2 className="w-4 h-4 animate-spin"/> Procuring...</>
 ) : (
 <><Search className="w-4 h-4"/> Initialize Sourcing</>
 )}
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10">
 {targets.length > 0 ? (
 <div className="space-y-6">
 <div className="text-[10px] uppercase tracking-widest text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-2">
 Sourcing Targets Acquired
 </div>
 {targets.map((target, idx) => (
 <div key={idx} className="bg-white/50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 p-4 space-y-4 rounded-none backdrop-blur-sm">
 <div className="flex justify-between items-start">
 <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm uppercase tracking-wider">{target.targetArchetype}</h3>
 <span className="text-[10px] text-stone-500">TARGET 0{idx + 1}</span>
 </div>
 
 <div className="space-y-1">
 <div className="text-[10px] uppercase tracking-widest text-stone-500">Boolean Query</div>
 <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-3 flex items-center justify-between group rounded-none">
 <code className="text-stone-900 dark:text-stone-300 font-mono text-xs break-all pr-4">
 {target.keywordBoolean}
 </code>
 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button 
 onClick={() => copyToClipboard(target.keywordBoolean, idx)}
 className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-300 transition-colors"
 title="Copy Query"
 >
 {copiedIndex === idx ? <Check className="w-4 h-4 text-stone-900 dark:text-stone-300"/> : <Copy className="w-4 h-4"/>}
 </button>
 <button
 onClick={() => openSearch(target.keywordBoolean)}
 className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-300 transition-colors"
 title="Search Grailed"
 >
 <ExternalLink className="w-4 h-4"/>
 </button>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4">
 <div className="space-y-1">
 <div className="text-[10px] uppercase tracking-widest text-stone-500">Emerging Designer</div>
 <div className="text-stone-800 dark:text-stone-300">{target.emergingDesigner}</div>
 </div>
 <div className="space-y-1">
 <div className="text-[10px] uppercase tracking-widest text-stone-500">Rationale</div>
 <div className="text-stone-600 dark:text-stone-400 leading-relaxed">{target.rationale}</div>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 !isProcuring && (
 <div className="h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 space-y-4">
 <ShoppingBag className="w-8 h-8 opacity-20"/>
 <div className="text-center space-y-1">
 <p className="uppercase tracking-widest">Awaiting Fiscal Input</p>
 <p className="text-[10px]">Enter budget to generate sourcing targets.</p>
 </div>
 </div>
 )
 )}
 </div>
 </div>
 );
};
