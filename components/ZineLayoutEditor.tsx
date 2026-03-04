
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZinePage, EditorElement, EditorElementStyle, ToneTag, Treatment } from '../types';
import { Type, Box, X, Check, Trash2, Plus, Image as ImageIcon, RotateCw, AlignLeft, AlignCenter, AlignRight, Italic, ChevronsUp, ChevronsDown, Bold, SlidersHorizontal, History, Maximize, Move, Layers, Type as FontIcon, ChevronUp, ChevronDown, Palette, Sparkles, Wand2, Info, Volume2, Loader2, AlertCircle, EyeOff, Crown, Link as LinkIcon, Radar, Fingerprint, Droplet, Hash, ExternalLink, Download, FileImage, FileText, Save, FolderOpen, Ratio, Crop, ScanLine } from 'lucide-react';
import { getAspectRatioForTone, generateAudio, generateSemioticSignals, analyzeMiseEnScene } from '../services/geminiService';
import { fetchPocketItems } from '../services/firebase';
import { Tooltip } from './Tooltip';
import { TitleLegend } from './TitleLegend';
import { useUser } from '../contexts/UserContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ZineLayoutEditorProps {
  page: ZinePage;
  tone: ToneTag;
  initialTitle?: string;
  onSave: (elements: EditorElement[], trace?: { timestamp: number; note: string }[], metadata?: any) => void;
  onCancel: () => void;
}

const FONT_FAMILIES = [
  { id: 'serif', label: 'Editorial Serif', css: 'Cormorant Garamond' },
  { id: 'sans', label: 'Space Grotesk', css: 'Space Grotesk' },
  { id: 'mono', label: 'Space Mono', css: 'Space Mono' },
  { id: 'brutalist', label: 'Brutalist', css: 'Anton' }
];

const COLORS = [
  { id: 'noir', hex: '#1C1917', label: 'Noir' },
  { id: 'white', hex: '#FFFFFF', label: 'Void' },
  { id: 'subtle', hex: '#A8A29E', label: 'Debris' },
  { id: 'signal', hex: '#10B981', label: 'Signal' },
  { id: 'caution', hex: '#F59E0B', label: 'Audit' },
  { id: 'error', hex: '#EF4444', label: 'Breach' }
];

const IMAGE_FILTERS = [
  { name: 'Raw', value: 'none', icon: '✦' },
  { name: 'Ghost', value: 'grayscale(100%) brightness(110%) contrast(90%)', icon: '👻' },
  { name: 'Archive', value: 'sepia(80%) contrast(80%) brightness(105%)', icon: '📜' },
  { name: 'Negative', value: 'invert(100%) contrast(120%)', icon: '🌗' },
  { name: 'Editorial', value: 'contrast(160%) brightness(80%) saturate(0%)', icon: '📸' },
  { name: 'Soft', value: 'blur(3px) brightness(1.1) grayscale(30%)', icon: '☁️' }
];

const initializeElements = (page: ZinePage): EditorElement[] => {
  if (page.customLayout?.elements && page.customLayout.elements.length > 0) {
      return page.customLayout.elements.map(el => ({ ...el, style: { ...el.style } }));
  }
  const els: EditorElement[] = [];
  const getId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  if (page.originalMediaUrl) {
    els.push({ id: getId('img'), type: 'image', content: page.originalMediaUrl, negativePrompt: page.negativePrompt, style: { top: 10, left: 10, width: 80, height: 80, zIndex: 0, opacity: 1, objectFit: 'cover', filter: 'none', rotation: 0 } });
  }
  if (page.headline) {
    els.push({ id: getId('headline'), type: 'text', content: page.headline, style: { top: 10, left: 10, width: 80, zIndex: 10, fontSize: 2.2, fontFamily: 'serif', color: 'inherit', textAlign: 'left', fontStyle: 'italic', fontWeight: '900', opacity: 1, rotation: 0, lineHeight: 1.1 } });
  }
  if (page.bodyCopy) {
    els.push({ id: getId('body'), type: 'text', content: page.bodyCopy, style: { top: 40, left: 10, width: 80, zIndex: 8, fontSize: 1.1, fontFamily: 'serif', color: 'inherit', textAlign: 'left', fontStyle: 'normal', fontWeight: '400', opacity: 1, rotation: 0, lineHeight: 1.4 } });
  }
  return els;
};

export const ZineLayoutEditor: React.FC<ZineLayoutEditorProps> = ({ page, tone, initialTitle = "Untitled Manifest", onSave, onCancel }) => {
  const { profile, user } = useUser();
  const [elements, setElements] = useState<EditorElement[]>(() => initializeElements(page));
  const [zineTitle, setZineTitle] = useState(initialTitle);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trace, setTrace] = useState(() => (page.customLayout?.editTrace || []));
  const [activeTab, setActiveTab] = useState<'fragments' | 'style' | 'trace'>('fragments');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isGeneratingSignals, setIsGeneratingSignals] = useState(false);
  const [sovereignTreatments, setSovereignTreatments] = useState<Treatment[]>([]);
  
  // Analysis State
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<{ directors_note: string, cultural_parallel: string } | null>(null);
  
  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialStyle, setInitialStyle] = useState<EditorElementStyle | null>(null);
  const [ratioW, ratioH] = getAspectRatioForTone(tone).split(':').map(Number);

  useEffect(() => {
    setElements(prev => {
      if (!prev.some(el => el.content === 'The Signal Is The Message')) {
        return [...prev, {
          id: `signal_msg_${Date.now()}`,
          type: 'text',
          content: 'The Signal Is The Message',
          style: {
            top: 40,
            left: 10,
            width: 80,
            zIndex: 50,
            fontSize: 3.5,
            fontFamily: 'Anton',
            color: '#10B981',
            textAlign: 'center',
            fontWeight: '900',
            opacity: 0.9,
            rotation: -2,
            lineHeight: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 24,
            mixBlendMode: 'normal'
          }
        }];
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    const loadTreatments = async () => {
        if (!user) return;
        try {
            const items = await fetchPocketItems(user.uid);
            setSovereignTreatments(items.filter(i => i.type === 'treatment').map(i => i.content as Treatment));
        } catch (e) {}
    };
    loadTreatments();
    return () => window.removeEventListener('resize', handleResize);
  }, [user]);

  // Reset analysis when selection changes
  useEffect(() => {
      setImageAnalysis(null);
      setIsAnalyzingImage(false);
  }, [selectedId]);

  const addTrace = useCallback((note: string) => { setTrace(prev => [...prev, { timestamp: Date.now(), note }]); }, []);
  const handleCommit = () => { const imgEl = elements.find(el => el.type === 'image'); onSave(elements, trace, { negativePrompt: imgEl?.negativePrompt, title: zineTitle }); };
  
  const handleGenerateSignals = async () => { 
    if (isGeneratingSignals) return; 
    setIsGeneratingSignals(true); 
    try { 
        const signals = await generateSemioticSignals(profile); 
        signals.forEach((sig, i) => addElement('signal', sig.text, sig.query, 60 + (i * 8), 10 + (i * 5))); 
        addTrace(`Manifested ${signals.length} high-fidelity semiotic markers.`); 
    } finally { setIsGeneratingSignals(false); } 
  };

  const handleAnalyzeImage = async () => {
      const el = elements.find(e => e.id === selectedId);
      if (!el || el.type !== 'image') return;
      
      setIsAnalyzingImage(true);
      setImageAnalysis(null);
      
      try {
          const src = el.content;
          let base64 = '';
          let mimeType = 'image/jpeg';
          
          if (src.startsWith('data:')) {
              const parts = src.split(',');
              base64 = parts[1];
              mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
          } else {
              // Assume it's a URL or invalid for now, skipping real analysis for non-data URIs 
              // (In production, would need to fetch blob and convert)
              console.warn("MIMI // Image Analysis: Remote URLs not yet supported for direct analysis in editor.");
              setIsAnalyzingImage(false);
              return;
          }

          const result = await analyzeMiseEnScene(base64, mimeType, profile);
          setImageAnalysis(result);
          addTrace(`Analyzed visual shard: ${result?.directors_note?.slice(0, 30)}...`);
      } catch (e) {
          console.error("MIMI // Analysis Failed", e);
      } finally {
          setIsAnalyzingImage(false);
      }
  };

  const handleSaveDraft = () => {
    const draftState = {
      elements,
      title: zineTitle,
      trace,
      timestamp: Date.now()
    };
    localStorage.setItem('mimi_layout_draft', JSON.stringify(draftState));
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Layout Draft Anchored.", icon: <Save size={14} /> } 
    }));
  };

  const handleLoadDraft = () => {
    const saved = localStorage.getItem('mimi_layout_draft');
    if (!saved) {
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "No Draft Signal Found.", type: 'error' } 
        }));
        return;
    }
    try {
        const parsed = JSON.parse(saved);
        if (parsed.elements) setElements(parsed.elements);
        if (parsed.title) setZineTitle(parsed.title);
        if (parsed.trace) setTrace(parsed.trace);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "Draft Restored.", icon: <FolderOpen size={14} /> } 
        }));
    } catch(e) {
        console.error(e);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "Draft Corrupted.", type: 'error' } 
        }));
    }
  };

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!containerRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    setSelectedId(null); // Deselect elements to hide handles

    try {
        await new Promise(r => setTimeout(r, 100)); // Render stability wait

        const canvas = await html2canvas(containerRef.current, {
            scale: 3, // High resolution export
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false
        });

        const filename = `${(zineTitle || 'Mimi_Layout').replace(/\s+/g, '_')}_${Date.now()}`;

        if (format === 'pdf') {
            const orientation = canvas.width > canvas.height ? 'l' : 'p';
            const pdf = new jsPDF({
                orientation,
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${filename}.pdf`);
        } else {
            const mime = format === 'png' ? 'image/png' : 'image/jpeg';
            const link = document.createElement('a');
            link.href = canvas.toDataURL(mime, 1.0);
            link.download = `${filename}.${format}`;
            link.click();
        }
        
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: `Section Exported as ${format.toUpperCase()}.`, icon: <Download size={14} /> } 
        }));
    } catch (e) {
        console.error("Export Failed", e);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "Export Failed.", type: 'error' } 
        }));
    } finally {
        setIsExporting(false);
    }
  };

  const handlePointerMove = useCallback((e) => {
    if ((!isDragging && !isResizing && !isRotating) || !selectedId || !initialStyle || !containerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();
    if (isDragging) {
      const dX = ((clientX - dragStart.x) / rect.width) * 100;
      const dY = ((clientY - dragStart.y) / rect.height) * 100;
      setElements(prev => prev.map(el => el.id === selectedId ? { ...el, style: { ...el.style, left: Math.max(-20, Math.min(100, initialStyle.left + dX)), top: Math.max(-20, Math.min(100, initialStyle.top + dY)) } } : el));
    } else if (isResizing) {
      const dX = ((clientX - dragStart.x) / rect.width) * 100;
      setElements(prev => prev.map(el => el.id === selectedId ? { ...el, style: { ...el.style, width: Math.max(5, Math.min(100 - el.style.left, initialStyle.width + dX)) } } : el));
    } else if (isRotating) {
        const centerX = rect.left + (initialStyle.left + initialStyle.width/2) * rect.width / 100;
        const centerY = rect.top + (initialStyle.top + (initialStyle.height || 0)/2) * rect.height / 100;
        const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, style: { ...el.style, rotation: angle + 90 } } : el));
    }
  }, [isDragging, isResizing, isRotating, selectedId, dragStart, initialStyle]);

  const handlePointerUp = useCallback(() => { setIsDragging(false); setIsResizing(false); setIsRotating(false); }, []);
  useEffect(() => { window.addEventListener('mousemove', handlePointerMove); window.addEventListener('mouseup', handlePointerUp); return () => { window.removeEventListener('mousemove', handlePointerMove); window.removeEventListener('mouseup', handlePointerUp); }; }, [handlePointerMove, handlePointerUp]);

  const addElement = (type, content, link, initialTop, initialLeft) => {
      const id = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let newEl;
      if (type === 'signal') {
          newEl = { 
            id, type: 'text', content: content || 'SIG_RESONANCE', link: `https://www.google.com/search?q=${encodeURIComponent(link || content)}`,
            style: { top: initialTop || 30, left: initialLeft || 30, width: 30, zIndex: elements.length + 20, fontSize: 0.7, fontFamily: 'mono', color: '#10B981', opacity: 1, rotation: 0, lineHeight: 1.2, fontWeight: '900', letterSpacing: '0.1em' } 
          };
      } else {
          newEl = { id, type, content: content || (type === 'text' ? 'New Thought' : ''), style: { top: initialTop || 30, left: initialLeft || 30, width: type === 'text' ? 40 : 50, zIndex: elements.length + 10, fontSize: 1.4, fontFamily: 'serif', color: 'inherit', opacity: 1, rotation: 0, lineHeight: 1.2, objectFit: 'cover', filter: 'none', borderStyle: 'none', borderWidth: 0, borderColor: 'transparent', padding: 8 } };
      }
      setElements(prev => [...prev, newEl]); setSelectedId(id); addTrace(`Added ${type}.`);
  };

  const updateStyle = (stylePatch: Partial<EditorElementStyle>) => { if (!selectedId) return; setElements(prev => prev.map(el => el.id === selectedId ? { ...el, style: { ...el.style, ...stylePatch } } : el)); };
  const updateImageAspectRatio = (ratioStr: string) => {
    if (!selectedId || !selectedElement || selectedElement.type !== 'image') return;
    const [w, h] = ratioStr.split(':').map(Number);
    const targetAR = w / h;
    const containerAR = ratioW / ratioH;
    
    // H% = W% * (ContainerAR / TargetAR)
    const currentW = selectedElement.style.width; // percent
    const newH = currentW * (containerAR / targetAR);
    
    updateStyle({ height: newH });
  };

  const selectedElement = elements.find(e => e.id === selectedId);

  return (
    <div className="fixed inset-0 z-[2000] bg-[#F9F8F6] dark:bg-[#0C0A09] flex flex-col lg:flex-row overflow-hidden transition-colors">
        <div className="h-14 md:h-20 border-b border-stone-200 dark:border-stone-800 px-4 md:px-10 flex justify-between items-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl shrink-0 lg:absolute lg:top-0 lg:left-0 lg:right-0 lg:z-[1001]">
            <div className="flex items-center gap-2 md:gap-6">
                <button onClick={onCancel} className="p-2 md:p-3 text-stone-400 hover:text-red-500 rounded-full transition-all"><X size={18} /></button>
                <div className="h-4 md:h-6 w-px bg-stone-200 dark:border-stone-800" />
                <div className="flex flex-col group/title relative">
                    <span className="font-sans text-[6px] md:text-[8px] uppercase tracking-widest text-stone-400 font-black mb-0.5">Issue Manifest Title</span>
                    <input type="text" value={zineTitle} onChange={(e) => setZineTitle(e.target.value)} placeholder="Subject..." className="bg-transparent border-none p-0 font-serif text-xs md:text-xl italic tracking-tighter text-nous-text dark:text-white focus:outline-none min-w-[120px] md:min-w-[240px]" />
                    <TitleLegend />
                </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
                {/* DRAFT CONTROLS */}
                <div className="hidden md:flex items-center gap-1 border-r border-stone-200 dark:border-stone-800 pr-3 mr-1">
                    <button onClick={handleSaveDraft} className="p-2 text-stone-400 hover:text-emerald-500 transition-colors" title="Save Draft">
                        <Save size={16} />
                    </button>
                    <button onClick={handleLoadDraft} className="p-2 text-stone-400 hover:text-indigo-500 transition-colors" title="Load Draft">
                        <FolderOpen size={16} />
                    </button>
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)} 
                        disabled={isExporting}
                        className="px-4 py-1.5 md:py-3 border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-nous-text dark:hover:text-white font-sans text-[7px] md:text-[9px] uppercase tracking-widest font-black rounded-full flex items-center gap-2 transition-all hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                        {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        <span className="hidden md:inline">Export</span>
                    </button>
                    {showExportMenu && (
                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl flex flex-col w-40 z-50 overflow-hidden">
                            <button onClick={() => handleExport('png')} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors">
                                <FileImage size={12} className="text-emerald-500" />
                                <span className="font-sans text-[8px] uppercase tracking-widest font-black">PNG Asset</span>
                            </button>
                            <button onClick={() => handleExport('jpg')} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors">
                                <FileImage size={12} className="text-amber-500" />
                                <span className="font-sans text-[8px] uppercase tracking-widest font-black">JPG Asset</span>
                            </button>
                            <button onClick={() => handleExport('pdf')} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors border-t border-stone-100 dark:border-stone-800">
                                <FileText size={12} className="text-stone-400" />
                                <span className="font-sans text-[8px] uppercase tracking-widest font-black">PDF Doc</span>
                            </button>
                        </div>
                    )}
                </div>
                
                <button onClick={handleCommit} className="px-4 md:px-8 py-1.5 md:py-3 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[7px] md:text-[10px] uppercase tracking-[0.3em] font-black rounded-full shadow-lg flex items-center gap-1.5 md:gap-3 shrink-0 hover:scale-105 active:scale-95 transition-all">
                    <Sparkles size={8} className="animate-pulse" />Commit
                </button> 
            </div>
        </div>
        <div className={`flex-1 flex items-center justify-center p-3 md:p-20 overflow-hidden relative lg:pt-32 transition-all ${isMobile && drawerOpen ? 'pb-[45vh]' : 'pb-16'}`} onClick={() => setSelectedId(null)}>
             <div ref={containerRef} onClick={(e) => e.stopPropagation()} className="relative shadow-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 transition-all duration-700" style={{ aspectRatio: `${ratioW}/${ratioH}`, maxHeight: '75vh', maxWidth: '100%', width: 'auto', height: 'auto' }}>
                {elements.sort((a,b) => (a.style.zIndex || 0) - (b.style.zIndex || 0)).map(el => (
                    <motion.div key={el.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: el.style.opacity, scale: 1 }} onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setDragStart({x: e.clientX, y: e.clientY}); setIsDragging(true); setInitialStyle({...el.style}); if(isMobile) setDrawerOpen(true); }} className={`absolute select-none group/el ${selectedId === el.id ? 'ring-2 ring-emerald-500 z-50' : ''} cursor-move`} style={{ top: `${el.style.top}%`, left: `${el.style.left}%`, width: `${el.style.width}%`, height: el.style.height ? `${el.style.height}%` : undefined, rotate: `${el.style.rotation}deg`, zIndex: el.style.zIndex }}>
                         {el.type === 'image' && <img src={el.content} className="w-full h-full object-cover pointer-events-none" style={{ filter: el.style.filter || 'none' }}/>}
                         {el.type === 'text' && (
                            <div className="relative group/text">
                                <div 
                                    className="leading-tight break-words transition-all" 
                                    style={{ 
                                        fontSize: `${el.style.fontSize || 1.2}rem`, 
                                        fontFamily: el.style.fontFamily, 
                                        color: el.style.color || 'inherit', 
                                        textAlign: el.style.textAlign || 'left', 
                                        fontStyle: el.style.fontStyle, 
                                        fontWeight: el.style.fontWeight,
                                        borderStyle: el.style.borderStyle || 'none',
                                        borderWidth: `${el.style.borderWidth || 0}px`,
                                        borderColor: el.style.borderColor || 'transparent',
                                        borderRadius: `${el.style.borderRadius || 0}px`,
                                        padding: `${el.style.padding !== undefined ? el.style.padding : 8}px`,
                                        backgroundColor: el.style.backgroundColor || 'transparent',
                                        backgroundImage: el.style.backgroundImage,
                                        mixBlendMode: el.style.mixBlendMode as any
                                    }}
                                >
                                    {el.content}
                                </div>
                                {el.link && (
                                    <a href={el.link} target="_blank" onClick={e => e.stopPropagation()} className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/text:opacity-100 transition-opacity bg-black text-white px-2 py-1 rounded-sm flex items-center gap-1.5 shadow-xl whitespace-nowrap z-[100]">
                                        <ExternalLink size={8} /> <span className="font-sans text-[6px] uppercase tracking-widest font-black">Verify Resonance</span>
                                    </a>
                                )}
                            </div>
                         )}
                         {selectedId === el.id && <div className="absolute inset-0 pointer-events-none"><div onMouseDown={(e) => { e.stopPropagation(); setDragStart({x: e.clientX, y: e.clientY}); setIsResizing(true); setInitialStyle({...el.style}); }} className="pointer-events-auto absolute -bottom-3 -right-3 w-6 h-6 bg-white dark:bg-stone-800 rounded-full cursor-se-resize flex items-center justify-center shadow-lg border border-black/10 z-[60]"><Maximize size={12} /></div></div>}
                    </motion.div>
                ))}
             </div>
        </div>
        <motion.div initial={false} animate={{ y: isMobile ? (drawerOpen ? 0 : '100%') : 0, x: isMobile ? 0 : (selectedId ? 0 : 480) }} className={`fixed bottom-0 left-0 right-0 lg:relative lg:flex lg:w-[480px] bg-white dark:bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-800 flex-col pt-4 lg:pt-20 shadow-2xl z-[2050] transition-all duration-500 ${isMobile ? 'h-[45vh] rounded-t-3xl overflow-hidden' : 'h-full'}`}>
            <div className="flex lg:hidden justify-center pb-2" onClick={() => setDrawerOpen(false)}><div className="w-12 h-1 bg-stone-200 dark:bg-stone-800 rounded-full" /></div>
            <div className="flex border-b border-stone-100 dark:border-stone-800 h-14 lg:h-20 shrink-0 px-4"> 
                {['fragments', 'style', 'trace'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 flex flex-col items-center justify-center gap-1 font-sans text-[7px] lg:text-[9px] uppercase tracking-widest transition-all ${activeTab === tab ? 'text-nous-text dark:text-white font-black' : 'text-stone-300 dark:text-stone-700 hover:text-stone-500'}`}> 
                        {tab === 'fragments' && <Plus size={16}/>}{tab === 'style' && <SlidersHorizontal size={16}/>}{tab === 'trace' && <History size={16}/>}<span className="font-black">{tab}</span>
                    </button> 
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 lg:space-y-8 no-scrollbar pb-safe">
                {activeTab === 'fragments' && (
                    <div className="grid grid-cols-4 gap-3 lg:gap-6 animate-fade-in"> 
                        <button onClick={() => addElement('text', 'A new thought...')} className="flex flex-col items-center justify-center gap-2 aspect-square border border-stone-50 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950/50 active:scale-95"><FontIcon size={18} className="text-stone-300" /><span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Type</span></button> 
                        <button onClick={() => addElement('box', '')} className="flex flex-col items-center justify-center gap-2 aspect-square border border-stone-50 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950/50 active:scale-95"><Box size={18} className="text-stone-300" /><span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Void</span></button> 
                        <button onClick={() => imageUploadRef.current?.click()} className="flex flex-col items-center justify-center gap-2 aspect-square border border-stone-50 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950/50 active:scale-95"><ImageIcon size={18} className="text-stone-300" /><span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Image</span></button> 
                        <button onClick={handleGenerateSignals} disabled={isGeneratingSignals} className="flex flex-col items-center justify-center gap-2 aspect-square border border-emerald-500/20 rounded-xl bg-emerald-500/5 active:scale-95 group">
                          {isGeneratingSignals ? <Loader2 size={18} className="text-emerald-500 animate-spin" /> : <Radar size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />}
                          <span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">Scry</span>
                        </button>
                    </div>
                )}
                {activeTab === 'style' && selectedElement && (
                    <div className="space-y-8 lg:space-y-10 animate-fade-in pb-12">
                        <div className="flex justify-between items-center border-b pb-4"><div className="flex flex-col"><span className="font-sans text-[6px] uppercase tracking-[0.3em] text-stone-400 font-black">Calibration</span><span className="font-serif italic text-xl lg:text-2xl uppercase">{selectedElement.type}</span></div><button onClick={() => { setElements(p => p.filter(e => e.id !== selectedId)); setSelectedId(null); if(isMobile) setDrawerOpen(false); }} className="p-2 text-red-500"><Trash2 size={16}/></button></div>
                        {selectedElement.type === 'text' && (
                            <section className="space-y-6 lg:space-y-8">
                                <div className="space-y-3">
                                    <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Content</span>
                                    <textarea 
                                        value={selectedElement.content} 
                                        onChange={(e) => {
                                            setElements(prev => prev.map(el => el.id === selectedId ? { ...el, content: e.target.value } : el));
                                        }}
                                        className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 font-serif italic text-sm focus:outline-none focus:border-emerald-500 rounded-sm resize-none h-24"
                                    />
                                </div>
                                <div className="space-y-3"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Font Identity</span><div className="grid gap-1.5">{FONT_FAMILIES.map(f => <button key={f.id} onClick={() => updateStyle({ fontFamily: f.css })} className={`text-left p-3 lg:p-4 border rounded-sm transition-all ${selectedElement.style.fontFamily === f.css ? 'bg-nous-text text-white dark:bg-white dark:text-black border-transparent' : 'border-stone-100 dark:border-stone-800 text-stone-400'}`} style={{ fontFamily: f.css }}>{f.label}</button>)}</div></div>
                                <div className="space-y-3"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Scale Protocol ({selectedElement.style.fontSize}rem)</span><input type="range" min="0.5" max="8" step="0.1" value={selectedElement.style.fontSize || 1.2} onChange={e => updateStyle({ fontSize: parseFloat(e.target.value) })} className="w-full h-1 bg-stone-100 dark:bg-stone-800 accent-nous-text dark:accent-white" /></div>
                                <div className="space-y-3"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Alignment Protocol</span><div className="flex gap-2"><button onClick={() => updateStyle({ textAlign: 'left' })} className={`flex-1 py-2.5 border rounded-sm transition-all ${selectedElement.style.textAlign === 'left' ? 'bg-nous-text text-white border-transparent' : 'border-stone-100 text-stone-400'}`}><AlignLeft size={16} className="mx-auto" /></button><button onClick={() => updateStyle({ textAlign: 'center' })} className={`flex-1 py-2.5 border rounded-sm transition-all ${selectedElement.style.textAlign === 'center' ? 'bg-nous-text text-white border-transparent' : 'border-stone-100 text-stone-400'}`}><AlignCenter size={16} className="mx-auto" /></button><button onClick={() => updateStyle({ textAlign: 'right' })} className={`flex-1 py-2.5 border rounded-sm transition-all ${selectedElement.style.textAlign === 'right' ? 'bg-nous-text text-white border-transparent' : 'border-stone-100 text-stone-400'}`}><AlignRight size={16} className="mx-auto" /></button></div></div>
                                <div className="space-y-3"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Chromatic Manifold</span><div className="grid grid-cols-6 gap-3">{COLORS.map(c => <button key={c.id} onClick={() => updateStyle({ color: c.hex })} className={`aspect-square rounded-full border-2 transition-all ${selectedElement.style.color === c.hex ? 'border-emerald-500 scale-110 shadow-sm' : 'border-transparent'}`} style={{ backgroundColor: c.hex }} />)}</div></div>
                                
                                <div className="pt-6 border-t border-stone-100 dark:border-stone-800 space-y-4">
                                    <div className="flex items-center gap-2 text-stone-400">
                                        <ScanLine size={12} />
                                        <span className="font-sans text-[7px] uppercase tracking-widest font-black">Boundary Logic</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {['none', 'solid', 'dashed', 'dotted'].map(s => (
                                            <button 
                                                key={s} 
                                                onClick={() => updateStyle({ borderStyle: s as any })}
                                                className={`flex-1 py-2 border rounded-sm font-sans text-[6px] uppercase font-black transition-all ${selectedElement.style.borderStyle === s ? 'bg-nous-text dark:bg-white text-white dark:text-black border-transparent' : 'border-stone-200 dark:border-stone-800 text-stone-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[7px] font-sans uppercase text-stone-400 block mb-1">Weight</label>
                                            <input type="range" min="0" max="20" value={selectedElement.style.borderWidth || 0} onChange={e => updateStyle({ borderWidth: parseInt(e.target.value) })} className="w-full h-1 bg-stone-100 dark:bg-stone-800 accent-nous-text" />
                                        </div>
                                        <div>
                                            <label className="text-[7px] font-sans uppercase text-stone-400 block mb-1">Padding</label>
                                            <input type="range" min="0" max="40" value={selectedElement.style.padding || 8} onChange={e => updateStyle({ padding: parseInt(e.target.value) })} className="w-full h-1 bg-stone-100 dark:bg-stone-800 accent-nous-text" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center"><span className="text-[7px] font-sans uppercase text-stone-400">Border Color</span><span className="text-[7px] font-sans uppercase text-stone-400">Fill</span></div>
                                        <div className="flex justify-between gap-4">
                                            <div className="flex gap-1.5 flex-wrap">
                                                <button onClick={() => updateStyle({ borderColor: 'transparent' })} className="w-5 h-5 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[6px] text-stone-400">Ø</button>
                                                {COLORS.map(c => (
                                                    <button key={`b-${c.id}`} onClick={() => updateStyle({ borderColor: c.hex })} className="w-5 h-5 rounded-full border border-stone-200 dark:border-stone-700" style={{ backgroundColor: c.hex }} />
                                                ))}
                                            </div>
                                            <div className="w-px bg-stone-200 dark:bg-stone-800" />
                                            <div className="flex gap-1.5 flex-wrap justify-end">
                                                <button onClick={() => updateStyle({ backgroundColor: 'transparent' })} className="w-5 h-5 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[6px] text-stone-400">Ø</button>
                                                {COLORS.map(c => (
                                                    <button key={`bg-${c.id}`} onClick={() => updateStyle({ backgroundColor: c.hex })} className="w-5 h-5 rounded-full border border-stone-200 dark:border-stone-700" style={{ backgroundColor: c.hex }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                        {selectedElement.type === 'image' && (
                            <section className="space-y-8 lg:space-y-10">
                                <div className="space-y-3">
                                    <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2"><Ratio size={12} /> Aspect Ratio</span>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['1:1', '3:4', '4:3', '16:9'].map(ratio => (
                                            <button 
                                                key={ratio} 
                                                onClick={() => updateImageAspectRatio(ratio)} 
                                                className="py-2 border border-stone-200 dark:border-stone-800 rounded-sm text-[8px] font-sans font-black hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <span className="font-sans text-[7px] uppercase tracking-widest font-black text-emerald-500 flex items-center gap-2">
                                        <Sparkles size={12} /> AI Insight
                                    </span>
                                    {!imageAnalysis ? (
                                        <button 
                                            onClick={handleAnalyzeImage} 
                                            disabled={isAnalyzingImage}
                                            className="w-full py-3 border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 rounded-sm font-sans text-[8px] uppercase tracking-widest font-black hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isAnalyzingImage ? <Loader2 size={12} className="animate-spin" /> : <Radar size={12} />}
                                            {isAnalyzingImage ? "Consulting Oracle..." : "Analyze Semiotics"}
                                        </button>
                                    ) : (
                                        <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-sm border border-stone-100 dark:border-stone-700 space-y-3">
                                            <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 leading-snug">"{imageAnalysis.directors_note}"</p>
                                            {imageAnalysis.cultural_parallel && (
                                                <div className="flex items-center gap-2 text-[9px] font-mono text-stone-400 uppercase">
                                                    <Info size={10} />
                                                    <span>Ref: {imageAnalysis.cultural_parallel}</span>
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    const text = `${imageAnalysis.directors_note}\n\nRef: ${imageAnalysis.cultural_parallel || 'Unknown'}`;
                                                    addElement('text', text, null, selectedElement.style.top + 5, selectedElement.style.left + 5);
                                                }}
                                                className="w-full py-2 bg-stone-200 dark:bg-stone-700 rounded-sm font-sans text-[7px] uppercase tracking-widest font-black hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                                            >
                                                Add as Note
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Optical Filters</span><div className="grid grid-cols-3 gap-2">{IMAGE_FILTERS.map(f => <button key={f.name} onClick={() => updateStyle({ filter: f.value })} className={`p-2.5 lg:p-3 border rounded-lg transition-all text-center ${selectedElement.style.filter === f.value ? 'bg-nous-text text-white dark:bg-white dark:text-black border-transparent' : 'border-stone-100 dark:border-stone-800 text-stone-400'}`}><span className="text-[6px] lg:text-[8px] uppercase font-black block">{f.name}</span></button>)}</div></div>
                                {sovereignTreatments.length > 0 && <div className="space-y-3"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-emerald-500">Darkroom Logic Presets</span><div className="grid gap-2">{sovereignTreatments.map(t => <button key={t.id} onClick={() => updateStyle({ filter: t.instruction })} className="text-left p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-sm hover:border-emerald-500 transition-all flex justify-between items-center group"><span className="font-serif italic text-xs text-stone-600 dark:text-stone-300">{t.name}</span><Droplet size={10} className="text-emerald-500 opacity-0 group-hover:opacity-100" /></button>)}</div></div>}
                            </section>
                        )}
                    </div>
                )}
                {!selectedId && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center"><Move size={32} strokeWidth={1} /><p className="font-serif italic text-lg mt-4">Select a fragment to calibrate.</p></div>
                )}
            </div>
            <input type="file" ref={imageUploadRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => addElement('image', event.target?.result as string); reader.readAsDataURL(file); } }} accept="image/*" className="hidden" /> 
        </motion.div>
    </div>
  );
};
