
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FlaskConical, Droplet, ArrowRight, Save, Wand2, Info, ChevronRight, Binary, Beaker, Layers, Zap, Palette, Sun, Eye, Sliders, Check, Settings2, Sparkles } from 'lucide-react';
import { Treatment } from '../types';

interface TreatmentPanelProps {
  treatments: Treatment[];
  onApply: (treatment: Treatment) => void;
  onClose: () => void;
  onSaveNew: (treatment: Omit<Treatment, 'id' | 'createdAt' | 'userId'>) => void;
}

const PRESET_SUGGESTIONS = [
  { name: "Scotopic Grain", instr: "Apply heavy 35mm film grain, deepen shadows, and reduce overall saturation to create a moody, nocturnal feel." },
  { name: "Ethereal Bloom", instr: "Add a soft highlight bloom effect, raise the white point, and introduce a subtle warm amber tint to the midtones." },
  { name: "Brutalist Steel", instr: "High contrast, crushed blacks, and a cold blue/silver color grade. Emphasize metallic textures and sharp lines." },
  { name: "Vintage Blush", instr: "Muted pastels, soft focus edges, and a slight pink/rose overlay with visible paper texture." }
];

export const TreatmentPanel: React.FC<TreatmentPanelProps> = ({ treatments, onApply, onClose, onSaveNew }) => {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [newName, setNewName] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [newVariance, setNewVariance] = useState<'interpretive' | 'anchored'>('interpretive');
  const [isMixedMedia, setIsMixedMedia] = useState(false);

  const handleCreate = () => {
    if (!newName.trim() || !newInstruction.trim()) return;
    onSaveNew({
      name: newName,
      instruction: newInstruction,
      variance: newVariance,
      isMixedMedia
    });
    setNewName('');
    setNewInstruction('');
    setIsMixedMedia(false);
    setMode('list');
  };

  const useSuggestion = (s: typeof PRESET_SUGGESTIONS[0]) => {
    setNewName(s.name);
    setNewInstruction(s.instr);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-stone-950 shadow-[-40px_0_100px_rgba(0,0,0,0.8)] z-[5500] flex flex-col border-l border-stone-800"
    >
      <header className="h-24 border-b border-stone-800 px-8 flex justify-between items-center bg-black/40 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Beaker size={20} className="animate-pulse" />
             </div>
             <div className="flex flex-col">
                <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-stone-300">Aesthetic Presets</span>
                <span className="font-mono text-[7px] text-stone-500 uppercase tracking-widest">Registry_Darkroom_v2</span>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-stone-500 hover:text-white transition-all bg-white/5 rounded-full"><X size={20}/></button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-8">
         <AnimatePresence mode="wait">
            {mode === 'list' ? (
              <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12 pb-20">
                  <div className="space-y-4">
                     <h2 className="font-header text-4xl italic tracking-tighter leading-tight text-white">The Vault.</h2>
                     <p className="font-serif italic text-lg text-stone-400">Apply saved visual directives to your current selection. Chaining instructions over existing shards creates layered complexity.</p>
                  </div>

                  <div className="space-y-6">
                     {treatments.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-stone-800 rounded-3xl bg-white/2 space-y-6">
                           <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto text-stone-600">
                              <Zap size={32} strokeWidth={1} />
                           </div>
                           <div className="space-y-2">
                             <p className="font-serif italic text-2xl text-stone-500">“No Logic Shards Bound.”</p>
                             <p className="font-sans text-[9px] uppercase tracking-widest text-stone-600">Manifest a preset to begin batching.</p>
                           </div>
                        </div>
                     ) : (
                       <div className="grid gap-4">
                          {treatments.map(t => (
                             <button 
                               key={t.id} 
                               onClick={() => onApply(t)}
                               className="w-full text-left p-8 bg-stone-900/40 border border-white/5 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group relative overflow-hidden shadow-2xl"
                             >
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                                   <Palette size={80} />
                                </div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${t.variance === 'anchored' ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                                      <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-stone-400">Ref: {t.variance?.toUpperCase()}</span>
                                   </div>
                                   <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ArrowRight size={14} className="text-white" />
                                   </div>
                                </div>
                                <h4 className="font-header text-3xl italic tracking-tighter text-white mb-4 relative z-10">{t.name}</h4>
                                <div className="p-5 bg-black/40 rounded-xl border border-white/5 relative z-10">
                                   <div className="flex items-center gap-2 mb-3">
                                      <Sliders size={10} className="text-stone-500" />
                                      <span className="font-sans text-[7px] uppercase tracking-widest text-stone-500 font-black">Pixel Logic</span>
                                   </div>
                                   <p className="font-serif italic text-base text-stone-400 leading-relaxed line-clamp-3">"{t.instruction}"</p>
                                </div>
                             </button>
                          ))}
                       </div>
                     )}
                     
                     <button 
                       onClick={() => setMode('create')}
                       className="w-full py-10 border-2 border-dashed border-stone-800 rounded-3xl text-stone-500 hover:text-white hover:border-indigo-500 transition-all flex flex-col items-center justify-center gap-4 bg-white/2 hover:bg-indigo-500/5 group"
                     >
                        <div className="p-4 bg-stone-900 rounded-full group-hover:scale-110 transition-transform">
                          <Plus size={32} strokeWidth={1} />
                        </div>
                        <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black">Manifest New Preset</span>
                     </button>
                  </div>
              </motion.div>
            ) : (
              <motion.div key="create" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  <button onClick={() => setMode('list')} className="flex items-center gap-4 text-stone-500 mb-8 hover:text-white transition-colors group">
                     <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                     <span className="font-sans text-[9px] uppercase tracking-widest font-black">Back to Vault</span>
                  </button>

                  <div className="space-y-4">
                     <h2 className="font-header text-5xl italic tracking-tighter text-white">Logic Refinement.</h2>
                     <p className="font-serif italic text-lg text-stone-400 leading-snug">Design an aesthetic mandate to be stored and applied as a high-fidelity preset.</p>
                  </div>

                  <div className="space-y-12">
                     <div className="space-y-3">
                        <label htmlFor="presetName" className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-500">Preset Identity</label>
                        <input 
                          id="presetName"
                          name="presetName"
                          type="text" 
                          value={newName} 
                          onChange={e => setNewName(e.target.value)}
                          placeholder="e.g. 1999 Fashion Flash"
                          className="w-full bg-transparent border-b border-stone-800 py-4 font-header italic text-3xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-stone-700 text-white"
                        />
                     </div>

                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                           <label htmlFor="presetInstruction" className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-500">Visual Mandate</label>
                           <div className="flex items-center gap-2">
                              <Sparkles size={12} className="text-emerald-500" />
                              <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-600 italic">Mimi Suggestions</span>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           {PRESET_SUGGESTIONS.map(s => (
                             <button 
                               key={s.name} 
                               onClick={() => useSuggestion(s)}
                               className="text-left p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/20 transition-all group"
                             >
                                <span className="font-header italic text-sm text-stone-400 group-hover:text-white block mb-1">{s.name}</span>
                                <div className="h-1 w-8 bg-stone-800 rounded-full group-hover:bg-indigo-50 transition-all" />
                             </button>
                           ))}
                        </div>
                        <textarea 
                          id="presetInstruction"
                          name="presetInstruction"
                          value={newInstruction}
                          onChange={e => setNewInstruction(e.target.value)}
                          placeholder="Define the bloom, grain, shadows, and hue shifts..."
                          className="w-full bg-stone-900/50 border border-stone-800 p-8 font-serif italic text-xl focus:outline-none focus:border-indigo-500 h-56 resize-none rounded-2xl leading-relaxed text-stone-300 shadow-inner"
                        />
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                           <Settings2 size={12} className="text-stone-500" />
                           <label className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-500">Development Protocol</label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={() => setNewVariance('interpretive')} className={`py-6 px-6 border rounded-2xl font-sans text-[10px] uppercase tracking-widest font-black transition-all flex flex-col items-center gap-2 ${newVariance === 'interpretive' ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-stone-800 text-stone-500 hover:border-stone-600'}`}>
                              <Wand2 size={16} />
                              Interpretive
                           </button>
                           <button onClick={() => setNewVariance('anchored')} className={`py-6 px-6 border rounded-2xl font-sans text-[10px] uppercase tracking-widest font-black transition-all flex flex-col items-center gap-2 ${newVariance === 'anchored' ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-stone-800 text-stone-500 hover:border-stone-600'}`}>
                              <Anchor size={16} />
                              Anchored
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-4 shadow-inner">
                      <div className="flex items-center gap-3 text-emerald-400">
                         <Info size={18} />
                         <span className="font-sans text-[9px] uppercase tracking-widest font-black">Archival Strategy</span>
                      </div>
                      <p className="font-serif italic text-sm text-emerald-100/60 leading-relaxed text-balance">
                        Presets are not just filters; they are the semantic rules of your brand. Once saved, they can be applied to any batch of shards in your Darkroom.
                      </p>
                  </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      <AnimatePresence>
        {mode === 'create' && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="p-8 border-t border-stone-800 bg-stone-950 z-20 shrink-0">
                <button 
                    onClick={handleCreate}
                    disabled={!newName.trim() || !newInstruction.trim()}
                    className="w-full py-8 bg-indigo-600 text-white rounded-full font-sans text-xs tracking-[0.5em] uppercase font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-30 hover:bg-indigo-500"
                >
                    <Check size={20} /> Anchor to Registry
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      <footer className="h-24 border-t border-stone-800 px-10 flex items-center justify-center bg-black/40 shrink-0">
          <p className="font-serif italic text-xs text-stone-500 text-center">“Consistency is the highest form of visual intelligence.”</p>
      </footer>
    </motion.div>
  );
};
