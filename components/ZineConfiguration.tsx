import React from 'react';
import { ZineGenerationOptions, UserProfile } from '../types';
import { SUPERINTELLIGENCE_PROMPTS } from '../constants';
import { Check, Wand2, Settings2 } from 'lucide-react';

interface ZineConfigurationProps {
 zineOptions: ZineGenerationOptions;
 setZineOptions: (options: ZineGenerationOptions) => void;
 profile?: UserProfile | null;
 onSelectPrompt?: (prompt: string) => void;
}

export const ZineConfiguration: React.FC<ZineConfigurationProps> = ({ zineOptions, setZineOptions, profile, onSelectPrompt }) => {
 return (
 <div className="flex flex-col gap-8 w-full">
 {/* Saved Treatments */}
 <div className="flex flex-col gap-4">
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60 flex items-center gap-2">
 <Wand2 size={12} />
 Saved Treatments
 </label>
 
 <div className="grid grid-cols-1 gap-2">
 <button
 onClick={() => setZineOptions({...zineOptions, selectedTreatmentId: undefined})}
 className={`text-left p-3 border rounded-none transition-colors flex items-center justify-between ${!zineOptions.selectedTreatmentId ? 'border-primary dark:border-white bg-primary/5 dark:bg-white/5' : 'border-stone-200 dark:border-stone-800 hover:border-primary/50 dark:hover:border-white/50'}`}
 >
 <div>
 <p className={`font-sans text-xs uppercase tracking-widest ${!zineOptions.selectedTreatmentId ? 'text-primary dark:text-white font-bold' : 'text-stone-500'}`}>Default / Manual</p>
 <p className="text-[10px] text-stone-400 mt-1">Use manual directives or default Tailor logic.</p>
 </div>
 {!zineOptions.selectedTreatmentId && <Check size={14} className="text-primary dark:text-white"/>}
 </button>

 {profile?.savedTreatments?.map(t => (
 <button
 key={t.id}
 onClick={() => setZineOptions({...zineOptions, selectedTreatmentId: t.id})}
 className={`text-left p-3 border rounded-none transition-colors flex items-center justify-between ${zineOptions.selectedTreatmentId === t.id ? 'border-stone-500 bg-stone-500/5' : 'border-stone-200 dark:border-stone-800 hover:border-stone-800 dark:hover:border-stone-300/50'}`}
 >
 <div>
 <p className={`font-serif italic text-sm ${zineOptions.selectedTreatmentId === t.id ? 'text-stone-500' : 'text-stone-600 dark:text-stone-300'}`}>{t.treatmentName}</p>
 <p className="text-[10px] font-mono text-stone-400 mt-1 line-clamp-1">{t.applicationLogic}</p>
 </div>
 {zineOptions.selectedTreatmentId === t.id && <Check size={14} className="text-stone-500"/>}
 </button>
 ))}
 </div>
 </div>

 {/* Manual Directives */}
 <div className={`flex flex-col gap-4 transition-opacity duration-300 ${zineOptions.selectedTreatmentId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60 flex items-center gap-2">
 <Settings2 size={12} />
 Manual Directives
 </label>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 border border-stone-200 dark:border-stone-800 rounded-none bg-stone-50 dark:bg-stone-900/30">
 <div className="flex flex-col gap-2">
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Style</label>
 <select 
 value={zineOptions.style} 
 onChange={(e) => setZineOptions({...zineOptions, style: e.target.value as any})}
 className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
 >
 <option value="minimalist"className="bg-stone-900">Minimalist</option>
 <option value="maximalist"className="bg-stone-900">Maximalist</option>
 <option value="experimental"className="bg-stone-900">Experimental</option>
 <option value="balanced"className="bg-stone-900">Balanced</option>
 </select>
 </div>
 <div className="flex flex-col gap-2">
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Theme</label>
 <select 
 value={zineOptions.theme} 
 onChange={(e) => setZineOptions({...zineOptions, theme: e.target.value as any})}
 className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
 >
 <option value="organic"className="bg-stone-900">Organic</option>
 <option value="synthetic"className="bg-stone-900">Synthetic</option>
 <option value="latent"className="bg-stone-900">Latent</option>
 </select>
 </div>
 <div className="flex flex-col gap-2">
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Content Focus</label>
 <select 
 value={zineOptions.contentFocus} 
 onChange={(e) => setZineOptions({...zineOptions, contentFocus: e.target.value as any})}
 className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
 >
 <option value="visual-heavy"className="bg-stone-900">Visual-heavy</option>
 <option value="text-heavy"className="bg-stone-900">Text-heavy</option>
 <option value="balanced"className="bg-stone-900">Balanced</option>
 </select>
 </div>
 <div className="flex flex-col gap-2">
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Aesthetic Tone</label>
 <select 
 value={zineOptions.aestheticTone || ''} 
 onChange={(e) => setZineOptions({...zineOptions, aestheticTone: e.target.value as any})}
 className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
 >
 <option value=""className="bg-stone-900">Select Tone</option>
 <option value="Cinematic"className="bg-stone-900">Cinematic</option>
 <option value="Editorial"className="bg-stone-900">Editorial</option>
 <option value="Dreamy"className="bg-stone-900">Dreamy</option>
 <option value="Industrial"className="bg-stone-900">Industrial</option>
 <option value="Noir"className="bg-stone-900">Noir</option>
 </select>
 </div>
 <div className="flex flex-col gap-2">
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Reading Level</label>
 <select 
 value={zineOptions.readingLevel || 'short'} 
 onChange={(e) => setZineOptions({...zineOptions, readingLevel: e.target.value as any})}
 className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 cursor-pointer"
 >
 <option value="short" className="bg-stone-900">Short Read (2-4 min)</option>
 <option value="slow" className="bg-stone-900">Slow Read (10-15 min)</option>
 </select>
 </div>
 <div className="flex flex-col gap-2 md:col-span-2">
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60">Art Style</label>
 <input 
 type="text"
 value={zineOptions.artStyle || ''}
 onChange={(e) => setZineOptions({...zineOptions, artStyle: e.target.value})}
 placeholder="e.g. Bauhaus, Cyberpunk, Impressionist..."
 className="bg-transparent border-b border-primary/20 dark:border-white/20 text-sm font-sans text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white pb-2 w-full"
 />
 </div>
 </div>
 </div>
 
 <div className="pt-8 border-t border-primary/10 dark:border-white/10">
 <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 dark:text-white/60 mb-4 block">Superintelligence Prompts</label>
 <div className="flex flex-wrap gap-2">
 {SUPERINTELLIGENCE_PROMPTS.map((p, i) => (
 <button 
 key={i}
 onClick={() => onSelectPrompt && onSelectPrompt(p.prompt)}
 className="text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border border-primary/20 dark:border-white/20 text-primary dark:text-white hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-primary transition-colors"
 >
 {p.label}
 </button>
 ))}
 </div>
 </div>
 </div>
 );
};
