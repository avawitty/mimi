
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PocketItem, DossierElement, TasteAuditReport } from '../types';
import { X, Check, Plus, Image as ImageIcon, Type, Layout, Palette, Pin, Trash2, Layers, Move, SlidersHorizontal, Upload, ArrowRight, LayoutGrid, Quote, Terminal } from 'lucide-react';

interface MoodboardComposerProps {
  selectedItems: PocketItem[];
  report?: TasteAuditReport;
  onCancel: () => void;
  onFinalize: (elements: DossierElement[], layoutConfig: any) => void;
}

const parseRoadmapToText = (content: any): string => {
  if (!content || !content.blueprint) return "Unstructured Roadmap";
  const bp = content.blueprint;
  return `ACT I: INCITING LOGIC\n${bp.inciting_debris || '---'}\n\nACT II: STRUCTURAL PIVOT\n${bp.structural_pivot || '---'}\n\nACT III: CLIMAX\n${bp.climax_manifest || '---'}\n\nOUTPUT SPEC\n${bp.end_product_spec || '---'}`;
};

export const MoodboardComposer: React.FC<MoodboardComposerProps> = ({ selectedItems, report, onCancel, onFinalize }) => {
  const [elements, setElements] = useState<DossierElement[]>([]);
  
  useEffect(() => {
    const initialElements: DossierElement[] = selectedItems.map((item, idx) => {
      let content = "";
      let type: 'image' | 'text' | 'analysis_pin' = 'text';

      if (item.type === 'image') {
        type = 'image';
        content = item.content.imageUrl;
      } else if (item.type === 'zine_card') {
        type = 'analysis_pin';
        content = item.content.analysis.design_brief;
      } else if (item.type === 'roadmap') {
        type = 'text';
        content = parseRoadmapToText(item.content);
      } else {
        type = 'text';
        content = item.content.prompt || item.content.name || item.content.omenText || 'Thought';
      }

      return {
        id: `el_${item.id}_${idx}`,
        itemId: item.id,
        type,
        content,
        notes: item.notes || (item.type === 'roadmap' ? `Strategy: ${item.content.title}` : ''),
        style: {
          zIndex: idx + 1,
          isPolaroid: true,
          hasPin: false
        }
      };
    });

    if (report) {
      initialElements.unshift({
        id: 'el_report_brief',
        type: 'analysis_pin',
        content: report.design_brief,
        style: {
          zIndex: 0,
          hasPin: true
        }
      });
    }

    setElements(initialElements);
  }, [selectedItems, report]);

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
  };

  const togglePin = (id: string) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, style: { ...el.style, hasPin: !el.style.hasPin } } : el));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[6000] bg-white dark:bg-stone-950 flex flex-col transition-colors duration-1000"
    >
      <header className="h-20 border-b border-stone-100 dark:border-stone-900 px-8 flex justify-between items-center bg-white/90 dark:bg-black/90 backdrop-blur-xl z-[100]">
          <button onClick={onCancel} className="flex items-center gap-4 group">
             <div className="p-2 border border-stone-200 dark:border-stone-800 rounded-full group-hover:bg-nous-text group-hover:text-white transition-all"><X size={16} /></div>
             <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black text-stone-400 group-hover:text-nous-text">Cancel Manifest</span>
          </button>
          
          <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black italic">Composition Cycle</span>
                <span className="font-serif italic text-sm text-nous-text dark:text-white">{elements.length} Constituent Fragments</span>
              </div>
              <button onClick={() => onFinalize(elements, { backgroundColor: '#FDFBF7', aspectRatio: "16:9" })} className="px-10 py-3 bg-indigo-600 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.5em] font-black shadow-xl active:scale-95 transition-all flex items-center gap-3">
                 Finalize Artifact <ArrowRight size={14} />
              </button>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar bg-stone-50/50 dark:bg-stone-950/50 py-20 px-6 md:px-12">
         <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4 mb-20">
               <div className="flex items-center justify-center gap-3 text-stone-300">
                  <LayoutGrid size={16} />
                  <span className="font-sans text-[10px] uppercase tracking-[0.8em] font-black italic">Manifest Composition</span>
               </div>
               <p className="font-serif italic text-2xl text-stone-400">Review the structural sequence and field notes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               <AnimatePresence>
                  {elements.map((el, idx) => (
                    <motion.div 
                      key={el.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative flex flex-col gap-6"
                    >
                       <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => togglePin(el.id)} className={`p-2 rounded-full border shadow-lg transition-all ${el.style.hasPin ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-stone-400 border-stone-100'}`}>
                             <Pin size={12} fill={el.style.hasPin ? "currentColor" : "none"} />
                          </button>
                          <button onClick={() => removeElement(el.id)} className="p-2 bg-white text-red-400 border border-stone-100 rounded-full shadow-lg hover:text-red-600 transition-all">
                             <Trash2 size={12} />
                          </button>
                       </div>

                       {el.type === 'image' ? (
                         <div className="space-y-6">
                            <div className="p-3 bg-white dark:bg-stone-900 border border-black/5 dark:border-white/5 rounded-sm shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                <img src={el.content} className="w-full aspect-[3/4] object-cover grayscale transition-all duration-1000 group-hover:grayscale-0" />
                                <div className="pt-4 pb-1 px-1 opacity-20 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                                   <span className="font-mono text-[7px] uppercase">shrd_0{idx+1}</span>
                                   <span className="font-sans text-[7px] uppercase font-black">IMAGE</span>
                                </div>
                            </div>
                            {el.notes && (
                              <div className="px-2 space-y-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-2 text-stone-300">
                                    <Quote size={8} />
                                    <span className="font-sans text-[6px] uppercase tracking-widest font-black">Linked Remark</span>
                                 </div>
                                 <p className="font-serif italic text-sm text-stone-500 line-clamp-3">"{el.notes}"</p>
                              </div>
                            )}
                         </div>
                       ) : (
                         <div className={`p-8 bg-[#FDFBF7] dark:bg-stone-900 border border-black/5 dark:border-white/10 rounded-sm h-full flex flex-col justify-start text-left transition-all duration-700 shadow-sm group-hover:shadow-2xl border-b-[30px] border-[#FDFBF7] dark:border-stone-900`}>
                            <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
                               <div className="flex items-center gap-2 text-stone-400">
                                  <Terminal size={12} className="text-emerald-500" />
                                  <span className="font-mono text-[8px] uppercase tracking-widest font-black">
                                     {el.type === 'analysis_pin' ? 'Tech_Debrief' : 'Thought_Shard'}
                                  </span>
                               </div>
                               <span className="font-mono text-[8px] opacity-30">REF_0{idx+1}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[400px] no-scrollbar">
                                <p className={`font-serif italic tracking-tight text-stone-700 dark:text-stone-300 whitespace-pre-wrap ${el.type === 'analysis_pin' ? 'text-xl md:text-2xl leading-snug' : 'text-lg md:text-xl leading-relaxed'}`}>
                                "{el.content}"
                                </p>
                            </div>
                            {el.notes && (
                              <div className="mt-6 opacity-40">
                                 <span className="font-sans text-[6px] uppercase tracking-widest font-black block mb-1">Field Note</span>
                                 <p className="font-serif italic text-[10px] line-clamp-2 leading-tight">"{el.notes}"</p>
                              </div>
                            )}
                         </div>
                       )}
                    </motion.div>
                  ))}
               </AnimatePresence>
               
               {elements.length === 0 && (
                 <div className="col-span-full py-48 text-center opacity-20">
                    <Layout size={48} className="mx-auto mb-8 animate-pulse" />
                    <p className="font-serif italic text-3xl">“All fragments withdrawn.”</p>
                 </div>
               )}
            </div>
         </div>
      </main>
      
      <footer className="h-20 border-t border-stone-100 dark:border-stone-900 px-8 flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-xl">
         <p className="font-serif italic text-stone-400 text-sm">"The artifact reflects the sequence of your intent."</p>
      </footer>
    </motion.div>
  );
};
