
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZinePage, EditorElement, EditorElementStyle, ToneTag } from '../types';
import { Type, Box, X, Check, Trash2, Plus, Image as ImageIcon, RotateCw, AlignLeft, AlignCenter, AlignRight, Italic, ChevronsUp, ChevronsDown, Bold, SlidersHorizontal, History, Maximize, Move, Layers, Type as FontIcon, ChevronUp, ChevronDown, Palette, Sparkles, Wand2, Info, Volume2, Loader2, AlertCircle, EyeOff, Crown } from 'lucide-react';
import { getAspectRatioForTone, generateAudio } from '../services/geminiService';
import { Tooltip } from './Tooltip';
import { TitleLegend } from './TitleLegend';

interface ZineLayoutEditorProps {
  page: ZinePage;
  tone: ToneTag;
  initialTitle?: string;
  onSave: (elements: EditorElement[], trace?: { timestamp: number; note: string }[], metadata?: any) => void;
  onCancel: () => void;
}

const safeContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (content === null || content === undefined) return '';
  return String(content || '');
};

const initializeElements = (page: ZinePage): EditorElement[] => {
  if (page.customLayout?.elements && page.customLayout.elements.length > 0) {
      return page.customLayout.elements.map(el => ({ 
        ...el, 
        content: safeContent(el.content),
        style: { ...el.style }
      }));
  }
  const els: EditorElement[] = [];
  const getId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (page.originalMediaUrl) {
    els.push({ 
      id: getId('img'), 
      type: 'image', 
      content: safeContent(page.originalMediaUrl), 
      negativePrompt: page.negativePrompt,
      style: { top: 10, left: 10, width: 80, height: 80, zIndex: 0, opacity: 1, objectFit: 'cover', filter: 'none', rotation: 0 } 
    });
  }
  
  if (page.headline) {
    els.push({ 
      id: getId('headline'), 
      type: 'text', 
      content: safeContent(page.headline), 
      style: { top: 10, left: 10, width: 80, zIndex: 10, fontSize: 2.2, fontFamily: 'serif', color: 'inherit', textAlign: 'left', fontStyle: 'italic', fontWeight: '900', opacity: 1, rotation: 0, lineHeight: 1.1 }
    });
  }

  if (page.bodyCopy) {
    els.push({ 
      id: getId('body'), 
      type: 'text', 
      content: safeContent(page.bodyCopy), 
      style: { top: 40, left: 10, width: 80, zIndex: 8, fontSize: 1.1, fontFamily: 'serif', color: 'inherit', textAlign: 'left', fontStyle: 'normal', fontWeight: '400', opacity: 1, rotation: 0, lineHeight: 1.4 }
    });
  }

  return els;
};

const IMAGE_FILTERS = [
  { name: 'Raw', value: 'none', icon: '✦' },
  { name: 'Ghost', value: 'grayscale(100%) brightness(110%) contrast(90%)', icon: '👻' },
  { name: 'Archive', value: 'sepia(80%) contrast(80%) brightness(105%)', icon: '📜' },
  { name: 'Negative', value: 'invert(100%) contrast(120%)', icon: '🌗' },
  { name: 'Editorial', value: 'contrast(160%) brightness(80%) saturate(0%)', icon: '📸' },
  { name: 'Soft', value: 'blur(3px) brightness(1.1) grayscale(30%)', icon: '☁️' }
];

export const ZineLayoutEditor: React.FC<ZineLayoutEditorProps> = ({ page, tone, initialTitle = "Untitled Manifest", onSave, onCancel }) => {
  const [elements, setElements] = useState<EditorElement[]>(() => initializeElements(page));
  const [zineTitle, setZineTitle] = useState(initialTitle);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trace, setTrace] = useState<{timestamp: number, note: string}[]>(() => 
    (page.customLayout?.editTrace || []).map(t => ({ ...t, note: safeContent(t.note) }))
  );
  
  const [activeTab, setActiveTab] = useState<'fragments' | 'style' | 'trace'>('fragments');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialStyle, setInitialStyle] = useState<EditorElementStyle | null>(null);
  const [ratioW, ratioH] = getAspectRatioForTone(tone).split(':').map(Number);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addTrace = useCallback((note: string) => { 
    setTrace(prev => [...prev, { timestamp: Date.now(), note }]); 
  }, []);

  const handleCommit = () => {
    const imgEl = elements.find(el => el.type === 'image');
    onSave(elements, trace, { negativePrompt: imgEl?.negativePrompt, title: zineTitle });
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if ((!isDragging && !isResizing && !isRotating) || !selectedId || !initialStyle || !containerRef.current) return;
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const rect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      const dX = ((clientX - dragStart.x) / rect.width) * 100;
      const dY = ((clientY - dragStart.y) / rect.height) * 100;
      setElements(prev => prev.map(el => el.id === selectedId ? { 
        ...el, style: { ...el.style, left: Math.max(-20, Math.min(100, initialStyle.left + dX)), top: Math.max(-20, Math.min(100, initialStyle.top + dY)) } 
      } : el));
    } else if (isResizing) {
      const dX = ((clientX - dragStart.x) / rect.width) * 100;
      const dY = ((clientY - dragStart.y) / rect.height) * 100;
      const delta = Math.abs(dX) > Math.abs(dY) ? dX : dY;
      setElements(prev => prev.map(el => el.id === selectedId ? { 
        ...el, style: { ...el.style, width: Math.max(5, Math.min(100 - el.style.left, initialStyle.width + delta)), height: initialStyle.height ? Math.max(5, Math.min(100 - el.style.top, initialStyle.height + delta)) : undefined } 
      } : el));
    } else if (isRotating) {
        const centerX = rect.left + (initialStyle.left + initialStyle.width/2) * rect.width / 100;
        const centerY = rect.top + (initialStyle.top + (initialStyle.height || 0)/2) * rect.height / 100;
        const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, style: { ...el.style, rotation: angle + 90 } } : el));
    }
  }, [isDragging, isResizing, isRotating, selectedId, dragStart, initialStyle]);

  const handlePointerUp = useCallback(() => { 
    if (isDragging || isResizing || isRotating) addTrace(`${isDragging ? "Repositioned" : isResizing ? "Rescaled" : "Rotated"} fragment.`);
    setIsDragging(false); setIsResizing(false); setIsRotating(false);
  }, [isDragging, isResizing, isRotating, addTrace]);

  useEffect(() => {
      window.addEventListener('mousemove', handlePointerMove); 
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove as any, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      return () => { 
        window.removeEventListener('mousemove', handlePointerMove); 
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove as any);
        window.removeEventListener('touchend', handlePointerUp);
      };
  }, [handlePointerMove, handlePointerUp]);

  const addElement = (type: 'text' | 'image' | 'box', content: string) => {
      const id = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newEl: EditorElement = { 
        id, type, content: safeContent(content) || (type === 'text' ? 'New Thought' : ''), 
        style: { top: 30, left: 30, width: type === 'text' ? 40 : 50, height: type === 'box' || type === 'image' ? 50 : undefined, zIndex: elements.length + 10, fontSize: 1.4, fontFamily: 'serif', color: 'inherit', opacity: 1, rotation: 0, lineHeight: 1.2, objectFit: 'cover', filter: 'none' } 
      };
      setElements(prev => [...prev, newEl]); 
      setSelectedId(id); 
      addTrace(`Integrated ${type}.`);
  };

  const updateStyle = (stylePatch: Partial<EditorElementStyle>) => { 
    if (!selectedId) return; 
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, style: { ...el.style, ...stylePatch } } : el)); 
  };
  
  const selectedElement = elements.find(e => e.id === selectedId);

  const startResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setIsResizing(true); setDragStart({ x: clientX, y: clientY });
    setInitialStyle({ ...selectedElement?.style } as EditorElementStyle);
  };

  const startRotate = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setIsRotating(true); setDragStart({ x: clientX, y: clientY });
    setInitialStyle({ ...selectedElement?.style } as EditorElementStyle);
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    if (selectedId !== id) setSelectedId(id);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setIsDragging(true); setDragStart({ x: clientX, y: clientY });
    const el = elements.find(item => item.id === id);
    setInitialStyle({ ...el?.style } as EditorElementStyle);
    if (isMobile) setDrawerOpen(true);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#F9F8F6] dark:bg-[#0C0A09] flex flex-col lg:flex-row overflow-hidden transition-colors selection:bg-nous-text selection:text-white">
        <div className="h-14 md:h-20 border-b border-stone-200 dark:border-stone-800 px-4 md:px-10 flex justify-between items-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl shrink-0 lg:absolute lg:top-0 lg:left-0 lg:right-0 lg:z-[1001]">
            <div className="flex items-center gap-2 md:gap-6">
              <button onClick={onCancel} className="p-2 md:p-3 text-stone-400 hover:text-red-500 rounded-full transition-all"><X size={18} /></button>
              <div className="h-4 md:h-6 w-px bg-stone-200 dark:border-stone-800" />
              <div className="flex flex-col group/title relative">
                  <span className="font-sans text-[6px] md:text-[8px] uppercase tracking-widest text-stone-400 font-black mb-0.5">Issue Manifest Title</span>
                  <input 
                    type="text"
                    value={zineTitle} 
                    onChange={(e) => setZineTitle(e.target.value)}
                    placeholder="Subject..."
                    className="bg-transparent border-none p-0 font-serif text-xs md:text-xl italic tracking-tighter text-nous-text dark:text-white focus:outline-none min-w-[120px] md:min-w-[240px]" 
                  />
                  <TitleLegend />
              </div>
            </div>
            <button onClick={handleCommit} className="px-4 md:px-8 py-1.5 md:py-3 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[7px] md:text-[10px] uppercase tracking-[0.3em] font-black rounded-full shadow-lg active:scale-95 transition-all flex items-center gap-1.5 md:gap-3 shrink-0"><Sparkles size={8} className="animate-pulse" />Commit</button> 
        </div>

        <div className={`flex-1 flex items-center justify-center p-3 md:p-20 overflow-hidden relative lg:pt-32 transition-all ${isMobile && drawerOpen ? 'pb-[35vh]' : 'pb-16'}`} onClick={() => { setSelectedId(null); if (isMobile) setDrawerOpen(false); }}>
             <div ref={containerRef} onClick={(e) => e.stopPropagation()} className="relative shadow-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 transition-all duration-700" style={{ aspectRatio: `${ratioW}/${ratioH}`, maxHeight: isMobile ? (drawerOpen ? '45vh' : '80vh') : '75vh', maxWidth: '100%', width: 'auto', height: 'auto' }}>
                {elements.sort((a,b) => (a.style.zIndex || 0) - (b.style.zIndex || 0)).map(el => (
                    <motion.div key={el.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: el.style.opacity, scale: 1 }} onMouseDown={(e) => startDrag(e, el.id)} onTouchStart={(e) => startDrag(e, el.id)} className={`absolute select-none group/el ${selectedId === el.id ? 'ring-[1px] md:ring-[2px] ring-offset-2 md:ring-offset-4 ring-nous-text dark:ring-white z-50 shadow-2xl scale-[1.005]' : ''} cursor-move transition-all duration-300`} style={{ top: `${el.style.top}%`, left: `${el.style.left}%`, width: `${el.style.width}%`, height: el.style.height ? `${el.style.height}%` : 'auto', rotate: `${el.style.rotation}deg`, zIndex: el.style.zIndex }}>
                         {el.type === 'image' && <div className="w-full h-full relative overflow-hidden"><img src={safeContent(el.content)} alt="" className="w-full h-full object-cover pointer-events-none transition-all duration-1000" style={{ filter: el.style.filter || 'none' }}/></div>}
                         {el.type === 'box' && <div className="w-full h-full shadow-inner" style={{ backgroundColor: el.style.backgroundColor || '#E7E5E4' }} />}
                         {el.type === 'text' && <div className="p-1 md:p-4 leading-tight break-words font-medium transition-colors" style={{ fontSize: `${isMobile ? (el.style.fontSize || 1.2) * 0.65 : (el.style.fontSize || 1.2)}rem`, fontFamily: el.style.fontFamily, color: el.style.color || 'inherit', textAlign: el.style.textAlign || 'left', fontStyle: el.style.fontStyle, letterSpacing: el.style.letterSpacing, fontWeight: el.style.fontWeight, lineHeight: el.style.lineHeight }}>{safeContent(el.content)}</div>}
                         
                         {selectedId === el.id && ( 
                            <div className="absolute inset-0 pointer-events-none">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} onMouseDown={startResize} onTouchStart={startResize} className="pointer-events-auto absolute -bottom-3 -right-3 md:-bottom-8 md:-right-8 w-8 h-8 md:w-16 md:h-16 bg-white dark:bg-stone-800 rounded-full cursor-se-resize flex items-center justify-center shadow-xl border border-nous-text dark:border-white z-[60] transition-all"><Maximize size={isMobile ? 12 : 22} /></motion.div>
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} onMouseDown={startRotate} onTouchStart={startRotate} className="pointer-events-auto absolute -top-3 -right-3 md:-top-8 md:-right-8 w-8 h-8 md:w-16 md:h-16 bg-white dark:bg-stone-800 rounded-full cursor-alias flex items-center justify-center shadow-xl border border-nous-text dark:border-white z-[60] transition-all"><RotateCw size={isMobile ? 12 : 22} /></motion.div>
                            </div>
                         )}
                    </motion.div>
                ))}
             </div>
        </div>

        <motion.div initial={false} animate={{ y: isMobile ? (drawerOpen ? 0 : '100%') : 0, x: isMobile ? 0 : (selectedId ? 0 : 450) }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className={`w-full lg:w-[480px] bg-white dark:bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-800 flex flex-col z-[2050] ${isMobile ? 'fixed bottom-0 left-0 right-0 h-[38vh] rounded-t-[1.5rem]' : 'h-full pt-20 shadow-[-20px_0_60px_rgba(0,0,0,0.05)]'}`}>
            <div className="flex border-b border-stone-100 dark:border-stone-800 h-12 md:h-20 shrink-0 px-1 md:px-4"> 
                {['fragments', 'style', 'trace'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 flex flex-col items-center justify-center gap-0.5 md:gap-2 font-sans text-[6px] md:text-[9px] uppercase tracking-widest relative transition-all ${activeTab === tab ? 'text-nous-text dark:text-white font-black' : 'text-stone-300 dark:text-stone-700 hover:text-stone-500'}`}> 
                        {tab === 'fragments' && <Plus size={isMobile ? 14 : 18}/>}
                        {tab === 'style' && <SlidersHorizontal size={isMobile ? 14 : 18}/>}
                        {tab === 'trace' && <History size={isMobile ? 14 : 18}/>}
                        <span className="font-black uppercase tracking-widest">{tab}</span>
                    </button> 
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 no-scrollbar pb-16">
                {activeTab === 'fragments' && (
                    <div className="grid grid-cols-3 gap-3 md:gap-6 animate-fade-in"> 
                        <button onClick={() => addElement('text', 'A new thought...')} className="flex flex-col items-center justify-center gap-2 aspect-square border border-stone-50 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950/50 active:scale-95"><FontIcon size={isMobile ? 18 : 32} className="text-stone-300" /><span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Type</span></button> 
                        <button onClick={() => addElement('box', '')} className="flex flex-col items-center justify-center gap-2 aspect-square border border-stone-50 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950/50 active:scale-95"><Box size={isMobile ? 18 : 32} className="text-stone-300" /><span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Void</span></button> 
                        <button onClick={() => imageUploadRef.current?.click()} className="flex flex-col items-center justify-center gap-2 aspect-square border border-stone-50 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950/50 active:scale-95"><ImageIcon size={isMobile ? 18 : 32} className="text-stone-300" /><span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Image</span></button> 
                    </div>
                )}

                {activeTab === 'style' && (
                    <div className="space-y-6 animate-fade-in">
                         {selectedElement ? (
                              <motion.div key={selectedId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 md:space-y-10">
                                  <div className="flex justify-between items-center border-b border-stone-50 dark:border-stone-800 pb-4"> 
                                      <div className="flex flex-col"><span className="font-sans text-[6px] uppercase tracking-[0.3em] text-stone-400 font-black mb-0.5">Calibration</span><span className="font-serif italic text-lg md:text-2xl text-nous-text dark:text-white uppercase">{selectedElement.type}</span></div>
                                      <button onClick={() => { setElements(prev => prev.filter(e => e.id !== selectedId)); setSelectedId(null); if(isMobile) setDrawerOpen(false); }} className="p-2 text-red-500"><Trash2 size={16}/></button> 
                                  </div>

                                  {selectedElement.type === 'text' && (
                                      <section className="space-y-4 md:space-y-8">
                                          <textarea value={selectedElement.content as string} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, content: e.target.value } : el))} className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-4 font-serif text-base md:text-2xl italic text-nous-text dark:text-white focus:outline-none rounded-xl resize-none min-h-[80px]" rows={2} />
                                          <div className="grid grid-cols-2 gap-2">
                                              <button onClick={() => updateStyle({ fontWeight: selectedElement.style.fontWeight === '900' ? '400' : '900' })} className={`py-3 md:py-6 border rounded-lg flex items-center justify-center gap-1.5 transition-all ${selectedElement.style.fontWeight === '900' ? 'bg-nous-text text-white dark:bg-white dark:text-black' : 'border-stone-50 dark:border-stone-800 text-stone-400'}`}><Bold size={12} /><span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest">Bold</span></button>
                                              <button onClick={() => updateStyle({ fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`py-3 md:py-6 border rounded-lg flex items-center justify-center gap-1.5 transition-all ${selectedElement.style.fontStyle === 'italic' ? 'bg-nous-text text-white dark:bg-white dark:text-black' : 'border-stone-50 dark:border-stone-800 text-stone-400'}`}><Italic size={12} /><span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest">Italic</span></button>
                                          </div>
                                      </section>
                                  )}

                                  {selectedElement.type === 'image' && (
                                    <section className="space-y-8">
                                      <div className="grid grid-cols-3 gap-2">
                                        {IMAGE_FILTERS.map(f => (
                                          <button key={f.name} onClick={() => updateStyle({ filter: f.value })} className={`group relative flex flex-col md:flex-row items-center justify-center gap-1 py-3 border rounded-lg transition-all ${selectedElement.style.filter === f.value ? 'bg-nous-text text-white dark:bg-white dark:text-black' : 'border-stone-50 dark:border-stone-800 text-stone-400'}`}><span className="text-xs md:text-lg">{f.icon}</span><span className="text-[5px] md:text-[8px] uppercase tracking-widest font-black">{f.name}</span></button>
                                        ))}
                                      </div>
                                      
                                      <div className="space-y-3 pt-6 border-t border-stone-50 dark:border-stone-800">
                                         <div className="flex items-center gap-3 text-stone-400">
                                            <EyeOff size={14} className="text-red-500" />
                                            <span className="font-sans text-[8px] md:text-[9px] uppercase tracking-[0.4em] font-black">Negative Refraction</span>
                                         </div>
                                         <p className="font-serif italic text-[10px] md:text-xs text-stone-500 leading-tight">Define the debris to omit from future visual manifestations.</p>
                                         <input 
                                           type="text" 
                                           value={selectedElement.negativePrompt || ''} 
                                           onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, negativePrompt: e.target.value } : el))}
                                           placeholder="e.g. blur, people, text, messy..." 
                                           className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-4 font-serif text-sm italic text-nous-text dark:text-white focus:outline-none rounded-xl transition-all"
                                         />
                                      </div>
                                    </section>
                                  )}
                              </motion.div>
                         ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-15 text-center"><Move size={32} /><p className="font-serif italic text-lg text-stone-500">Touch a fragment.</p></div>
                         )}
                    </div>
                )}

                {activeTab === 'trace' && (
                  <div className="space-y-2">{trace.map((t, i) => (
                    <motion.div key={i} className="flex gap-4 items-start p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"><span className="font-mono text-[6px] md:text-[8px] text-stone-300 pt-0.5 shrink-0">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><p className="font-serif italic text-base text-stone-600 dark:text-stone-400 leading-tight">"{t.note}"</p></motion.div>
                  ))}</div>
                )}
            </div>
            <input type="file" ref={imageUploadRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => addElement('image', event.target?.result as string); reader.readAsDataURL(file); } }} accept="image/*" className="hidden" /> 
        </motion.div>
    </div>
  );
};
