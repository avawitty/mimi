
// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Save, Loader2, Type, Palette, 
  Layout, ChevronLeft, ChevronRight, Download, 
  Settings2, Wand2, Briefcase, Feather, Zap, 
  RefreshCw, MousePointer2, Edit3, Eye,
  ArrowRight, ArrowLeft, Plus, FolderOpen, Image as ImageIcon
} from 'lucide-react';
import { Proposal, ProposalSection, EditorElement, UserProfile, BrandKit, PocketItem } from '../types';
import { saveProposalToRegistry, refineSectionContent } from '../services/proposalOrchestrator';
import { SlideCanvas } from './SlideCanvas';
import { useUser } from '../contexts/UserContext';
import { fetchPocketItems } from '../services/firebase';

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
  const { profile, activePersona, user } = useUser();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // -- WORKSPACE STATE --
  const [mode, setMode] = useState<'content' | 'design' | 'assets'>('content');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState<string | null>(null);
  
  // -- ASSETS STATE --
  const [folderItems, setFolderItems] = useState<PocketItem[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // -- LAYOUT STATE --
  const [layoutConfig, setLayoutConfig] = useState(proposal.layout);
  
  // -- CUSTOM INPUTS --
  const [customFontInput, setCustomFontInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('#000000');

  useEffect(() => {
    // Update parent proposal state whenever local config changes
    onUpdateProposal({ ...proposal, layout: layoutConfig });
  }, [layoutConfig]);

  // Load Folder Assets
  useEffect(() => {
      const loadAssets = async () => {
          if (user?.uid) {
              setLoadingAssets(true);
              try {
                  const allItems = await fetchPocketItems(user.uid);
                  let items = [];
                  
                  if (proposal.sourceFolderId === 'manual_selection') {
                      // Filter by IDs explicitly stored in sourceArtifactIds
                      items = allItems.filter(i => proposal.sourceArtifactIds?.includes(i.id));
                  } else if (proposal.sourceFolderId) {
                      // Find the folder and get its children
                      const folder = allItems.find(i => i.id === proposal.sourceFolderId);
                      if (folder && folder.content.itemIds) {
                          items = allItems.filter(i => folder.content.itemIds.includes(i.id));
                      } else {
                          // Fallback: Check if we have sourceArtifactIds anyway
                          items = allItems.filter(i => proposal.sourceArtifactIds?.includes(i.id));
                      }
                  }
                  setFolderItems(items);
              } catch(e) { console.error(e); } finally { setLoadingAssets(false); }
          }
      };
      if (mode === 'assets') loadAssets();
  }, [mode, proposal.sourceFolderId, proposal.sourceArtifactIds, user]);

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
      // Ensure we are saving the LATEST state
      const finalProposal = { ...proposal, layout: layoutConfig };
      await saveProposalToRegistry(finalProposal);
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

  // --- NEW FEATURES ---

  const handleAddPage = () => {
      const newSection: ProposalSection = {
          id: `slide_${Date.now()}`,
          title: "New Slide",
          body: "",
          elements: [],
          order: proposal.content.sections.length
      };
      onUpdateProposal({
          ...proposal,
          content: { ...proposal.content, sections: [...proposal.content.sections, newSection] }
      });
      // Scroll to new page after render
      setTimeout(() => scrollToSlide(proposal.content.sections.length), 100);
  };

  const handleDeletePage = () => {
      if (proposal.content.sections.length <= 1) return;
      const updatedSections = proposal.content.sections.filter((_, i) => i !== activeSlideIndex);
      onUpdateProposal({
          ...proposal,
          content: { ...proposal.content, sections: updatedSections }
      });
      scrollToSlide(Math.max(0, activeSlideIndex - 1));
  };

  const handleAddText = () => {
      const activeSection = proposal.content.sections[activeSlideIndex];
      if (!activeSection) return;
      
      const newElement: EditorElement = {
          id: `el_${Date.now()}`,
          type: 'text',
          content: "New Text Block",
          style: {
              top: 50, left: 50, width: 30, zIndex: 20, fontSize: 1.2, fontFamily: layoutConfig.fontSet[0], color: '#000000', opacity: 1
          }
      };
      handleUpdateSectionElements(activeSection.id, [...activeSection.elements, newElement]);
  };

  const injectGoogleFont = (fontName: string) => {
      const linkId = `font-${fontName.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
      }
      setLayoutConfig(prev => ({ ...prev, fontSet: [fontName, prev.fontSet[1]] }));
      setCustomFontInput('');
  };

  const handleAddAssetToSlide = (item: PocketItem) => {
      const activeSection = proposal.content.sections[activeSlideIndex];
      if (!activeSection) return;

      let newElement: EditorElement;
      if (item.type === 'image') {
          newElement = {
              id: `img_${Date.now()}`,
              type: 'image',
              content: item.content.imageUrl,
              style: { top: 20, left: 20, width: 40, zIndex: 10, opacity: 1, objectFit: 'cover' }
          };
      } else {
          newElement = {
              id: `txt_${Date.now()}`,
              type: 'text',
              content: item.content.prompt || item.content.name || "Text Fragment",
              style: { top: 20, left: 20, width: 30, zIndex: 10, fontSize: 1.2, fontFamily: 'inherit', color: 'inherit' }
          };
      }
      handleUpdateSectionElements(activeSection.id, [...activeSection.elements, newElement]);
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
               <button 
                 onClick={() => setMode('assets')} 
                 className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'assets' ? 'bg-white dark:bg-stone-800 text-nous-text dark:text-white shadow-sm' : 'text-stone-400'}`}
               >
                 <FolderOpen size={12} /> Folder
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
         
         {/* 2. SIDEBARS (Dynamic based on Mode) */}
         <AnimatePresence initial={false} mode="wait">
           
           {/* DESIGN SIDEBAR */}
           {mode === 'design' && (
             <motion.aside 
               key="design-sidebar"
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
                      <div className="flex gap-2">
                          <input 
                            value={customFontInput} 
                            onChange={e => setCustomFontInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && injectGoogleFont(customFontInput)}
                            placeholder="Google Font Name..."
                            className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-700 py-1 font-sans text-xs focus:outline-none"
                          />
                          <button onClick={() => injectGoogleFont(customFontInput)} className="text-xs font-black uppercase tracking-widest text-stone-400 hover:text-emerald-500">Fetch</button>
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
                      <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="color" 
                            value={customColorInput} 
                            onChange={e => { setCustomColorInput(e.target.value); setLayoutConfig(p => ({ ...p, backgroundStyle: e.target.value })); }}
                            className="w-8 h-8 rounded-full border-none p-0 cursor-pointer"
                          />
                          <span className="font-mono text-[9px] text-stone-400">{customColorInput}</span>
                      </div>
                   </section>

                   <section className="space-y-4">
                      <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2"><Layout size={12} /> Tools</span>
                      <button onClick={handleAddText} className="w-full py-3 border border-stone-200 dark:border-stone-700 rounded-sm font-sans text-[8px] uppercase tracking-widest font-black hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                         <Type size={10} /> Add Text Block
                      </button>
                   </section>
                </div>
             </motion.aside>
           )}

           {/* ASSETS SIDEBAR */}
           {mode === 'assets' && (
             <motion.aside 
               key="assets-sidebar"
               initial={{ width: 0, opacity: 0 }} 
               animate={{ width: 320, opacity: 1 }} 
               exit={{ width: 0, opacity: 0 }}
               className="bg-stone-50 dark:bg-stone-900 border-r border-stone-100 dark:border-stone-800 overflow-y-auto no-scrollbar shrink-0 z-40 hidden md:block"
             >
                <div className="p-6 space-y-6 min-w-[320px]">
                    <div className="flex items-center gap-2 text-stone-400 mb-4">
                        <FolderOpen size={14} />
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black">Source Materials</span>
                    </div>
                    {loadingAssets ? (
                        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-stone-300" /></div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {folderItems.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => handleAddAssetToSlide(item)}
                                    className="aspect-square bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-sm overflow-hidden hover:border-emerald-500 transition-all group relative"
                                >
                                    {item.type === 'image' ? (
                                        <img src={item.content.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-2 text-center text-[8px] font-mono text-stone-500">
                                            {item.content.prompt || item.content.name || "Text Fragment"}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Plus size={16} className="text-white" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    {folderItems.length === 0 && !loadingAssets && (
                        <p className="text-center font-serif italic text-stone-400 text-sm py-10">No artifacts found in source folder.</p>
                    )}
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

            {/* 4. CHAPTER NAVIGATION & PAGE TOOLS */}
            <div className="h-16 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 shrink-0 gap-4">
                <button onClick={() => scrollToSlide(Math.max(0, activeSlideIndex - 1))} className="p-2 text-stone-400 hover:text-nous-text dark:hover:text-white disabled:opacity-30" disabled={activeSlideIndex === 0}><ArrowLeft size={16}/></button>
                
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[40vw]">
                        {proposal.content.sections.map((s, i) => (
                            <button 
                                key={s.id} 
                                onClick={() => scrollToSlide(i)}
                                className={`h-1.5 rounded-full transition-all ${i === activeSlideIndex ? 'w-8 bg-nous-text dark:bg-white' : 'w-2 bg-stone-300 dark:bg-stone-800 hover:bg-stone-400'}`} 
                            />
                        ))}
                    </div>
                    <div className="h-4 w-px bg-stone-200 dark:bg-stone-800" />
                    <button onClick={handleAddPage} className="flex items-center gap-1.5 px-3 py-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text dark:hover:text-white transition-all">
                        <Plus size={10} /> Add Slide
                    </button>
                    {proposal.content.sections.length > 1 && (
                        <button onClick={handleDeletePage} className="p-2 text-stone-300 hover:text-red-500 transition-colors" title="Delete Slide">
                            <X size={12} />
                        </button>
                    )}
                </div>

                <button onClick={() => scrollToSlide(Math.min(proposal.content.sections.length - 1, activeSlideIndex + 1))} className="p-2 text-stone-400 hover:text-nous-text dark:hover:text-white disabled:opacity-30" disabled={activeSlideIndex === proposal.content.sections.length - 1}><ArrowRight size={16}/></button>
            </div>

         </div>
      </div>
    </div>
  );
};
