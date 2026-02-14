
// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Save, Loader2, Type, Palette, 
  Layout, ChevronLeft, ChevronRight, Download, 
  Settings2, Wand2, Briefcase, Feather, Zap, 
  RefreshCw, MousePointer2, Edit3, Eye,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import { Proposal, ProposalSection, EditorElement, UserProfile, BrandKit } from '../types';
import { saveProposalToRegistry, refineSectionContent } from '../services/proposalOrchestrator';
import { SlideCanvas } from './SlideCanvas';
import { useUser } from '../contexts/UserContext';

// --- CONFIG CONSTANTS ---
const FONTS = [
  { label: 'Editorial Serif', value: 'Cormorant Garamond' },
  { label: 'Minimal Sans', value: 'Space Grotesk' },
  { label: 'Brutalist Mono', value: 'Space Mono' }
];

const COLORS = [
  { label: 'Noir', value: '#1C1917' },
  { label: 'Paper', value: '#FDFBF7' },
  { label: 'Concrete', value: '#A8A29E' },
  { label: 'Signal', value: '#10B981' },
  { label: 'Alert', value: '#EF4444' }
];

const REFINEMENT_MODES = [
  { id: 'Crystalize', icon: <Briefcase size={14} />, prompt: "Make this concise, strategic, and professional." },
  { id: 'Soften', icon: <Feather size={14} />, prompt: "Make this poetic, alluring, and editorial." },
  { id: 'Punch', icon: <Zap size={14} />, prompt: "Make this high-impact, short, and punchy." }
];

interface ProposalWorkspaceProps {
  proposal: Proposal;
  onUpdateProposal: (updated: Proposal) => void;
  onClose: () => void;
}

export const ProposalWorkspace: React.FC<ProposalWorkspaceProps> = ({ proposal, onUpdateProposal, onClose }) => {
  const { profile, activePersona } = useUser();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // -- WORKSPACE STATE --
  const [mode, setMode] = useState<'content' | 'design'>('content');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState<string | null>(null);
  
  // -- LAYOUT STATE --
  const [layoutConfig, setLayoutConfig] = useState(proposal.layout);

  useEffect(() => {
    onUpdateProposal({ ...proposal, layout: layoutConfig });
  }, [layoutConfig]);

  // Handle Scroll Snap Sync
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const width = scrollContainerRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveSlideIndex(index);
  };

  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return;
    const width = scrollContainerRef.current.clientWidth;
    scrollContainerRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
    setActiveSlideIndex(index);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProposalToRegistry(proposal);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Proposal Anchored.", icon: <Check size={14} /> } 
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSectionElements = (sectionId: string, newElements: EditorElement[]) => {
    const updatedSections = proposal.content.sections.map(sec => 
      sec.id === sectionId ? { ...sec, elements: newElements } : sec
    );
    onUpdateProposal({ 
      ...proposal, 
      content: { ...proposal.content, sections: updatedSections } 
    });
  };

  const handleRefineElement = async (sectionId: string, elementId: string, instruction: string) => {
    const section = proposal.content.sections.find(s => s.id === sectionId);
    if (!section) return;
    const element = section.elements.find(e => e.id === elementId);
    if (!element || element.type !== 'text') return;

    setIsRefining(elementId);
    try {
      const newText = await refineSectionContent(element.content, instruction, profile);
      const updatedElements = section.elements.map(e => 
        e.id === elementId ? { ...e, content: newText } : e
      );
      handleUpdateSectionElements(sectionId, updatedElements);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Text Refined.", icon: <Sparkles size={14} /> } 
      }));
    } catch (e) {
      console.error("Refinement Failed", e);
    } finally {
      setIsRefining(null);
    }
  };

  const handleSyncTailor = () => {
    if (!activePersona?.tailorDraft) return;
    const draft = activePersona.tailorDraft;
    
    const primaryFont = draft.typographyIntent.styleDescription.includes('Serif') ? 'Cormorant Garamond' : 'Space Grotesk';
    const bg = draft.chromaticRegistry.baseNeutral || '#FDFBF7';
    const colors = draft.chromaticRegistry.primaryPalette.map(c => c.hex);

    setLayoutConfig(prev => ({
        ...prev,
        fontSet: [primaryFont, prev.fontSet[1]],
        backgroundStyle: bg,
        colorSet: colors.length > 0 ? colors : prev.colorSet
    }));

    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
      detail: { message: "Synced with Aesthetic Core.", icon: <Settings2 size={14} /> } 
    }));
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-[#EBE9E4] dark:bg-[#050505] flex flex-col transition-colors duration-1000 overflow-hidden">
      
      {/* 1. TOP NAVIGATION */}
      <nav className="h-16 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl flex justify-between items-center px-6 shrink-0 z-50">
         <div className="flex items-center gap-6">
            <button onClick={onClose} className="p-2 -ml-2 text-stone-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            <div className="hidden md:flex bg-stone-100 dark:bg-stone-900 p-1 rounded-lg">
               <button 
                 onClick={() => setMode('content')} 
                 className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'content' ? 'bg-white dark:bg-stone-800 text-nous-text dark:text-white shadow-sm' : 'text-stone-400'}`}
               >
                 <Edit3 size={12} /> Content
               </button>
               <button 
                 onClick={() => setMode('design')} 
                 className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'design' ? 'bg-white dark:bg-stone-800 text-nous-text dark:text-white shadow-sm' : 'text-stone-400'}`}
               >
                 <Palette size={12} /> Design
               </button>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <span className="font-serif italic text-sm text-stone-400 hidden md:block">{proposal.title}</span>
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-widest font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all">
               {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
               Save
            </button>
         </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
         
         {/* 2. DESIGN SIDEBAR (Desktop) */}
         <AnimatePresence initial={false}>
           {mode === 'design' && (
             <motion.aside 
               initial={{ width: 0, opacity: 0 }} 
               animate={{ width: 320, opacity: 1 }} 
               exit={{ width: 0, opacity: 0 }}
               className="bg-white dark:bg-stone-900 border-r border-stone-100 dark:border-stone-800 overflow-y-auto no-scrollbar shrink-0 z-40 hidden md:block"
             >
                <div className="p-8 space-y-10 min-w-[320px]">
                   <div className="p-6 bg-stone-50 dark:bg-stone-950/50 rounded-sm border border-stone-100 dark:border-stone-800 space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="font-sans text-[9px] uppercase tracking-widest font-black text-emerald-500">Aesthetic Core</span>
                         <Settings2 size={14} className="text-stone-400" />
                      </div>
                      <p className="font-serif italic text-xs text-stone-500 leading-snug">
                         Pull typographic and chromatic DNA from your active Tailor persona.
                      </p>
                      <button onClick={handleSyncTailor} className="w-full py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-sm font-sans text-[8px] uppercase tracking-widest font-black hover:border-emerald-500 transition-colors flex items-center justify-center gap-2">
                         <RefreshCw size={10} /> Sync Profile
                      </button>
                   </div>

                   <section className="space-y-4">
                      <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2"><Type size={12} /> Typography</span>
                      <div className="space-y-2">
                         {FONTS.map(font => (
                            <button 
                              key={font.value}
                              onClick={() => setLayoutConfig(p => ({ ...p, fontSet: [font.value, p.fontSet[1]] }))}
                              className={`w-full text-left p-3 border rounded-sm transition-all text-sm ${layoutConfig.fontSet[0] === font.value ? 'border-nous-text dark:border-white bg-stone-50 dark:bg-stone-800' : 'border-stone-100 dark:border-stone-800 text-stone-500'}`}
                              style={{ fontFamily: font.value }}
                            >
                               {font.label}
                            </button>
                         ))}
                      </div>
                   </section>

                   <section className="space-y-4">
                      <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2"><Palette size={12} /> Palette</span>
                      <div className="grid grid-cols-5 gap-2">
                         {COLORS.map(color => (
                            <button 
                              key={color.value}
                              onClick={() => setLayoutConfig(p => ({ ...p, backgroundStyle: color.value }))}
                              className={`aspect-square rounded-full border-2 transition-all ${layoutConfig.backgroundStyle === color.value ? 'border-emerald-500 scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            />
                         ))}
                      </div>
                   </section>

                   <section className="space-y-4">
                      <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2"><Layout size={12} /> Density</span>
                      <input 
                        type="range" 
                        min="0.5" max="2" step="0.1" 
                        value={layoutConfig.spacingScale} 
                        onChange={(e) => setLayoutConfig(p => ({ ...p, spacingScale: parseFloat(e.target.value) }))}
                        className="w-full accent-nous-text dark:accent-white"
                      />
                   </section>
                </div>
             </motion.aside>
           )}
         </AnimatePresence>

         {/* 3. HORIZONTAL SHELL (The Main View) */}
         <div className="flex-1 relative flex flex-col overflow-hidden">
            
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 flex md:flex-row flex-col overflow-x-auto overflow-y-hidden snap-x snap-mandatory md:scroll-pl-12 no-scrollbar items-center bg-stone-200/50 dark:bg-stone-900"
            >
                <div className="w-4 md:w-12 shrink-0" /> {/* Spacer */}
                
                {proposal.content.sections.map((section, idx) => (
                    <div key={section.id} className="w-full md:w-[80vw] max-w-[1200px] h-full p-4 md:p-12 shrink-0 snap-center flex items-center justify-center">
                        <div className="w-full aspect-[16/9] shadow-2xl relative group">
                            <SlideCanvas 
                                id={section.id}
                                elements={section.elements}
                                isActive={idx === activeSlideIndex}
                                onUpdate={(els) => handleUpdateSectionElements(section.id, els)}
                                onSelect={() => setActiveSlideIndex(idx)}
                                profile={profile}
                                layoutConfig={layoutConfig} 
                            />
                            
                            {/* REFINEMENT TOOLS (Floating) */}
                            {mode === 'content' && idx === activeSlideIndex && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -right-12 top-0 flex flex-col gap-2 z-50">
                                    {section.elements.filter(e => e.type === 'text').map(el => (
                                        <div key={el.id} className="group/refine relative">
                                            <button className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-lg text-stone-400 hover:text-emerald-500 transition-colors">
                                                <Wand2 size={14} />
                                            </button>
                                            <div className="absolute right-full mr-2 top-0 bg-stone-900 text-white p-2 rounded-lg hidden group-hover/refine:flex flex-col gap-1 w-32 shadow-xl">
                                                {REFINEMENT_MODES.map(rm => (
                                                    <button 
                                                        key={rm.id}
                                                        onClick={() => handleRefineElement(section.id, el.id, rm.prompt)}
                                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 rounded text-[9px] uppercase tracking-widest text-left"
                                                    >
                                                        {isRefining === el.id ? <Loader2 size={10} className="animate-spin" /> : rm.icon}
                                                        {rm.id}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    </div>
                ))}
                
                <div className="w-4 md:w-12 shrink-0" /> {/* Spacer */}
            </div>

            {/* 4. CHAPTER NAVIGATION */}
            <div className="h-16 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-center px-4 shrink-0 gap-4">
                <button onClick={() => scrollToSlide(Math.max(0, activeSlideIndex - 1))} className="p-2 text-stone-400 hover:text-nous-text dark:hover:text-white disabled:opacity-30" disabled={activeSlideIndex === 0}><ArrowLeft size={16}/></button>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[60vw]">
                    {proposal.content.sections.map((s, i) => (
                        <button 
                            key={s.id} 
                            onClick={() => scrollToSlide(i)}
                            className={`h-1.5 rounded-full transition-all ${i === activeSlideIndex ? 'w-8 bg-nous-text dark:bg-white' : 'w-2 bg-stone-300 dark:bg-stone-800 hover:bg-stone-400'}`} 
                        />
                    ))}
                </div>

                <button onClick={() => scrollToSlide(Math.min(proposal.content.sections.length - 1, activeSlideIndex + 1))} className="p-2 text-stone-400 hover:text-nous-text dark:hover:text-white disabled:opacity-30" disabled={activeSlideIndex === proposal.content.sections.length - 1}><ArrowRight size={16}/></button>
            </div>

         </div>
      </div>
    </div>
  );
};
