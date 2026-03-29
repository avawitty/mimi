
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PocketItem, DossierElement, TasteAuditReport, MaterialityConfig } from '../types';
import { X, Check, Plus, Image as ImageIcon, Type, Layout, Palette, Pin, Trash2, Layers, Move, SlidersHorizontal, Upload, ArrowRight, LayoutGrid, Quote, Terminal } from 'lucide-react';
import { MaterialityPanel } from './MaterialityPanel';

interface MoodboardComposerProps {
 selectedItems: PocketItem[];
 report?: TasteAuditReport;
 onCancel: () => void;
 onFinalize: (elements: DossierElement[], layoutConfig: any) => void;
}

const parseRoadmapToText = (content: any): string => {
 if (!content || !content.roadmap) return"Unstructured Roadmap";
 const rm = content.roadmap;
 return `STRATEGIC THESIS\n${rm.strategicThesis || '---'}\n\nPOSITIONING AXIS\n${rm.positioningAxis || '---'}\n\nAUTHORITY ANCHOR\nCore Claim: ${rm.authorityAnchor?.coreClaim || '---'}\nRepetition Vector: ${rm.authorityAnchor?.repetitionVector || '---'}\nExclusion Principle: ${rm.authorityAnchor?.exclusionPrinciple || '---'}`;
};

export const MoodboardComposer: React.FC<MoodboardComposerProps> = ({ selectedItems, report, onCancel, onFinalize }) => {
 const [elements, setElements] = useState<DossierElement[]>([]);
 const [materiality, setMateriality] = useState<MaterialityConfig>({
 paperStock: 'newsprint',
 typographyLineage: 'brutalist',
 negativeSpaceDensity: 5,
 colorScheme: 'monochrome'
 });
 
 useEffect(() => {
 const items = selectedItems || [];
 const initialElements: DossierElement[] = items.map((item, idx) => {
 let content ="";
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
 }, [JSON.stringify(selectedItems), report]);

 const removeElement = (id: string) => {
 setElements(prev => prev.filter(el => el.id !== id));
 };

 const togglePin = (id: string) => {
 setElements(prev => prev.map(el => el.id === id ? { ...el, style: { ...el.style, hasPin: !el.style.hasPin } } : el));
 };

 const getTypographyClass = () => {
 switch (materiality.typographyLineage) {
 case 'brutalist': return 'font-mono uppercase tracking-tight';
 case 'editorial-serif': return 'font-serif italic';
 case 'technical-mono': return 'font-mono';
 default: return 'font-sans';
 }
 };

 const getMoodboardStyle = () => {
 let base = '';
 // Color Scheme
 switch (materiality.colorScheme) {
 case 'monochrome': base = 'bg-nous-base text-nous-text'; break;
 case 'high-contrast': base = 'bg-nous-text text-nous-base'; break;
 case 'earth-tones': base = 'bg-stone-200 text-nous-text'; break;
 default: base = 'bg-nous-base text-nous-text';
 }

 // Paper Stock Effects
 switch (materiality.paperStock) {
 case 'vellum': 
 base += ' bg-white/60 backdrop-blur-md'; 
 break;
 case 'raw-cardboard':
 base += ' bg-stone-400'; // Warm fibrous tone
 break;
 case 'newsprint':
 base += ' bg-nous-base';
 break;
 }
 return base;
 };

 return (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 className="fixed inset-0 z-[6000] bg-white flex flex-col transition-colors duration-1000"
 >
 <header className="h-20 border-b border-nous-border px-8 flex justify-between items-center bg z-[100]">
 <button onClick={onCancel} className="flex items-center gap-4 group">
 <div className="p-2 border border-nous-border group-hover:bg-nous-base group-hover:text-nous-subtle transition-all text-nous-text0"><X size={16} /></div>
 <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-nous-text0 group-hover:text-nous-subtle">Cancel Manifest</span>
 </button>
 
 <div className="flex items-center gap-6">
 <div className="flex flex-col items-end">
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-text0 font-bold">Composition Cycle</span>
 <span className="font-serif italic text-sm text-nous-subtle">{elements.length} Constituent Fragments</span>
 </div>
 <button onClick={() => onFinalize(elements, { backgroundColor: '#050505', aspectRatio:"16:9"})} className="px-6 py-3 border border-nous-border text-nous-subtle font-mono text-[9px] uppercase tracking-widest font-bold hover:bg-nous-base hover:text-nous-text transition-all flex items-center gap-3">
 [ FINALIZE ARTIFACT ] <ArrowRight size={12} />
 </button>
 </div>
 </header>

 <div className="flex flex-1 overflow-hidden bg">
 <aside className="w-64 border-r border-nous-border p-8 overflow-y-auto bg">
 <MaterialityPanel config={materiality} onChange={setMateriality} />
 </aside>

 <main className={`flex-1 overflow-y-auto no-scrollbar py-20 px-6 md:px-12 ${getMoodboardStyle()}`}>
 <div className="max-w-6xl mx-auto space-y-16">
 <div className="text-center space-y-4 mb-20 border-b border-nous-border pb-8">
 <div className="flex items-center justify-center gap-3 text-nous-text0">
 <LayoutGrid size={16} />
 <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Manifest Composition</span>
 </div>
 <p className="font-serif italic text-2xl text-nous-subtle">Review the structural sequence and field notes.</p>
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
 <button onClick={() => togglePin(el.id)} className={`p-2 border transition-all ${el.style.hasPin ? 'bg-nous-base text-nous-text border-nous-border' : 'bg-transparent text-nous-text0 border-nous-border hover:border-nous-border'}`}>
 <Pin size={12} fill={el.style.hasPin ?"currentColor":"none"} />
 </button>
 <button onClick={() => removeElement(el.id)} className="p-2 bg-transparent text-nous-text0 border border-nous-border hover:text-red-500 hover:border-red-900/50 transition-all">
 <Trash2 size={12} />
 </button>
 </div>

 {el.type === 'image' ? (
 <div className="space-y-6">
 <div className={`p-3 bg-transparent border border-nous-border transition-all duration-700 ${
 materiality.paperStock === 'newsprint' ? 'grayscale' : 
 materiality.paperStock === 'vellum' ? 'opacity-90 blur-[0.5px]' :
 materiality.paperStock === 'raw-cardboard' ? 'sepia-[0.3]' : ''
 }`}>
 <img src={el.content} className="w-full aspect-[3/4] object-cover transition-all duration-1000 grayscale group-hover:grayscale-0"/>
 <div className="pt-4 pb-1 px-1 opacity-20 group-hover:opacity-100 transition-opacity flex justify-between items-center border-t border-nous-border mt-3">
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-text0">shrd_0{idx+1}</span>
 <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-nous-text0">IMAGE</span>
 </div>
 </div>
 {el.notes && (
 <div className="px-2 space-y-2 opacity-60 group-hover:opacity-100 transition-opacity border-l border-nous-border pl-4">
 <div className="flex items-center gap-2 text-nous-text0">
 <Quote size={10} />
 <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Linked Remark</span>
 </div>
 <p className="font-serif italic text-sm text-nous-subtle line-clamp-3">"{el.notes}"</p>
 </div>
 )}
 </div>
 ) : (
 <div className={`p-8 bg-transparent border border-nous-border h-full flex flex-col justify-start text-left transition-all duration-700`}>
 <div className="flex items-center justify-between mb-6 border-b border-nous-border pb-4">
 <div className="flex items-center gap-2 text-nous-text0">
 <Terminal size={12} />
 <span className="font-mono text-[9px] uppercase tracking-widest font-bold">
 {el.type === 'analysis_pin' ? 'Tech_Debrief' : 'Thought_Shard'}
 </span>
 </div>
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-subtle">REF_0{idx+1}</span>
 </div>
 <div className="flex-1 overflow-y-auto max-h-[400px] no-scrollbar">
 <p className={`${getTypographyClass()} text-nous-subtle whitespace-pre-wrap ${el.type === 'analysis_pin' ? 'text-xl md:text-2xl leading-snug' : 'text-lg md:text-xl leading-relaxed'}`}>
"{el.content}"
 </p>
 </div>
 {el.notes && (
 <div className="mt-8 pt-4 border-t border-nous-border opacity-60">
 <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-nous-text0 block mb-2">Field Note</span>
 <p className="font-serif italic text-xs text-nous-subtle line-clamp-2 leading-tight">"{el.notes}"</p>
 </div>
 )}
 </div>
 )}
 </motion.div>
 ))}
 </AnimatePresence>
 
 {elements.length === 0 && (
 <div className="col-span-full py-48 text-center opacity-20">
 <Layout size={48} className="mx-auto mb-8 animate-pulse"/>
 <p className="font-serif italic text-3xl">“All fragments withdrawn.”</p>
 </div>
 )}
 </div>
 </div>
 </main>
 </div>
 </motion.div>
 );
};
