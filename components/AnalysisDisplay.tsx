
// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ZineMetadata, ZinePage, FruitionTrajectory } from '../types';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateAudio, generateMemeRefraction, generateZineImage } from '../services/geminiService';
import { addToPocket, updateZineVisibility } from '../services/firebase';
import { ChevronLeft, Loader2, Bookmark, Square, Share2, Languages, Fingerprint, Check, X, Sparkles, Moon, Radio, ExternalLink, RefreshCw, Hash, EyeOff, Eye, CornerDownRight, ShieldAlert, Globe, Lock, Unlock, Zap, ImageIcon, Sun, Orbit, Volume2, Waves, Compass, HelpCircle, MessageCircle, Quote, Map, ArrowRight, Target, Layout, Edit3, Heart } from 'lucide-react';
import { Visualizer } from './Visualizer';
import { motion, AnimatePresence } from 'framer-motion';

const FruitionMap: React.FC<{ blueprint: FruitionTrajectory, fontChoice: string }> = ({ blueprint, fontChoice }) => {
  if (!blueprint) return null;
  const headerFont = fontChoice === 'brutalist-mono' ? 'font-mono' : 'font-serif';

  return (
    <section className="snap-start min-h-screen py-24 px-6 md:px-12 bg-stone-50 dark:bg-black/40 border-t border-stone-100 dark:border-stone-900 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12">
        <Map size={400} />
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-16 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-500">
            <Target size={20} className="animate-pulse" />
            <span className="font-sans text-[10px] uppercase tracking-[0.8em] font-black">Fruition_Telemetry</span>
          </div>
          <h2 className={`${headerFont} text-5xl md:text-9xl italic tracking-tighter leading-none`}>The Roadmap.</h2>
          <p className="font-serif italic text-xl md:text-3xl text-stone-500 max-w-2xl">Visualizing the mandatory trajectory from debris to clinical end-product.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pt-12 relative">
          <div className="space-y-6 group">
            <div className="flex items-center gap-4">
               <span className="font-mono text-[10px] text-stone-300">ACT_01</span>
               <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
            </div>
            <h3 className="font-serif text-3xl italic tracking-tighter text-nous-text dark:text-white">Inciting Debris</h3>
            <p className="font-serif italic text-lg text-stone-500 group-hover:text-nous-text dark:group-hover:text-white transition-colors">{blueprint.inciting_debris || "Detecting..."}</p>
          </div>
          <div className="space-y-6 group">
            <div className="flex items-center gap-4">
               <span className="font-mono text-[10px] text-stone-300">ACT_02</span>
               <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
            </div>
            <h3 className="font-serif text-3xl italic tracking-tighter text-nous-text dark:text-white">Structural Pivot</h3>
            <p className="font-serif italic text-lg text-stone-500 group-hover:text-nous-text dark:group-hover:text-white transition-colors">{blueprint.structural_pivot || "Calculating..."}</p>
          </div>
          <div className="space-y-6 group">
            <div className="flex items-center gap-4">
               <span className="font-mono text-[10px] text-stone-300">ACT_03</span>
               <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
            </div>
            <h3 className="font-serif text-3xl italic tracking-tighter text-nous-text dark:text-white">Climax Manifest</h3>
            <p className="font-serif italic text-lg text-stone-500 group-hover:text-nous-text dark:group-hover:text-white transition-colors">{blueprint.climax_manifest || "Architecting..."}</p>
          </div>
          <div className="p-8 bg-white dark:bg-stone-900 border-2 border-amber-500/20 rounded-[2rem] shadow-2xl space-y-6 group">
            <div className="flex items-center justify-between">
               <span className="font-sans text-[8px] uppercase tracking-widest text-amber-500 font-black">End_Product_Spec</span>
               <Sparkles size={14} className="text-amber-500 animate-pulse" />
            </div>
            <p className="font-serif italic text-xl md:text-2xl text-stone-700 dark:text-white leading-tight">
               "{blueprint.end_product_spec || "Finalizing manifest."}"
            </p>
            <div className="pt-4 flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
               <span className="font-sans text-[7px] uppercase tracking-widest text-emerald-600 font-black">Fruition Locked</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PageRenderer: React.FC<{ 
  page: ZinePage; 
  index: number; 
  onUpdateImage: (idx: number, newImage: string) => void;
  fontChoice?: string;
  isDark?: boolean;
}> = ({ page, index, onUpdateImage, fontChoice, isDark }) => {
  if (!page) return null;
  const headlineFont = fontChoice === 'brutalist-mono' ? 'font-mono' : fontChoice === 'minimalist-sans' ? 'font-sans' : 'font-serif';
  const bodyFont = fontChoice === 'brutalist-mono' ? 'font-mono uppercase text-[12px] md:text-[14px] tracking-tight' : fontChoice === 'minimalist-sans' ? 'font-sans' : 'font-serif';

  return (
    <motion.div id={`page-target-${index}`} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "0%" }} className="zine-page relative min-h-[90vh] flex flex-col items-center w-full snap-start pt-12 md:pt-32 pb-48 md:pb-64">
      <div className="z-10 w-full max-w-7xl px-6 md:px-12">
        <div className="mb-8 md:mb-20 flex flex-col gap-1 md:gap-2">
          <div className="flex items-center gap-3 md:gap-4"><span className="font-mono text-[7px] md:text-[10px] uppercase tracking-[0.4em] text-stone-400">ARCHIVE_0${index + 1}</span><div className="flex-1 h-px bg-stone-100 dark:bg-stone-900" /></div>
          <h2 className={`${headlineFont} text-[clamp(2rem,8vw,7rem)] italic tracking-tighter leading-[0.85] text-nous-text dark:text-white luminescent-text mb-2 uppercase`}>{page.headline || "Untitled Fragment"}</h2>
        </div>
        <div className="w-full flex flex-col lg:flex-row gap-8 md:gap-24 items-start">
          <div className={`w-full lg:w-[55%] magazine-border p-1 md:p-3 ${isDark ? 'bg-black border-stone-800' : 'bg-white'} shadow-2xl relative mb-12`}>
            <Visualizer prompt={page.imagePrompt || "minimalist aesthetic"} negativePrompt={page.negativePrompt} initialImage={page.originalMediaUrl} onUpdate={(newImage) => onUpdateImage(index, newImage)} defaultAspectRatio={index === 0 ? '3:4' : '1:1'} />
          </div>
          <div className="w-full lg:w-[40%] space-y-6 md:space-y-10 pt-2">
            <div className="w-16 h-px bg-nous-text dark:bg-white opacity-20 md:mb-12" />
            <p className={`${bodyFont} text-xl md:text-3xl italic text-stone-600 dark:text-stone-300 leading-[1.3] md:leading-[1.5] tracking-tight text-balance`}>{page.bodyCopy}</p>
            
            {/* EDITORIAL REFERENCES */}
            {page.groundingSources && page.groundingSources.length > 0 && (
              <div className="pt-12 md:pt-20 space-y-6 bg-stone-50/50 dark:bg-white/5 p-6 rounded-xl border border-black/5">
                <div className="flex items-center gap-3 text-stone-400">
                  <Globe size={14} />
                  <span className="font-sans text-[7px] uppercase tracking-[0.5em] font-black italic">Editorial References</span>
                </div>
                <div className="flex flex-col gap-4">
                  {page.groundingSources.map((source, sIdx) => (
                    <a 
                      key={sIdx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 transition-all"
                    >
                      <div className="w-4 h-4 rounded-full border border-stone-200 flex items-center justify-center shrink-0 mt-1"><span className="font-mono text-[8px] text-stone-400">{sIdx + 1}</span></div>
                      <div className="flex flex-col">
                        <span className="font-serif italic text-sm text-stone-500 group-hover:text-nous-text dark:group-hover:text-white transition-colors">{source.title}</span>
                        <span className="font-mono text-[8px] text-stone-300 truncate max-w-[200px]">{source.uri}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AnalysisDisplay: React.FC<{ metadata: ZineMetadata, onReset: () => void, onSanctuary?: () => void }> = ({ metadata: initialMetadata, onReset, onSanctuary }) => {
  const { user, profile } = useUser();
  const { currentPalette } = useTheme();
  const [metadata, setMetadata] = useState(initialMetadata);
  const [activePageIndex, setActivePageIndex] = useState(0);
  
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const [isVaulting, setIsVaulting] = useState(false);
  const [isVaulted, setIsVaulted] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isRefracting, setIsRefracting] = useState(false);
  
  const [meme, setMeme] = useState<any | null>(null);
  const [isMemeing, setIsMemeing] = useState(false);
  const [memeImage, setMemeImage] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fontChoice = profile?.tasteProfile?.dominant_archetypes?.[0] || 'minimalist-sans';

  const scrollToPage = (index: number) => {
    setActivePageIndex(index);
    const element = document.getElementById(`page-target-${index}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleTransmission = async () => {
    if (isTransmitting) {
      if (sourceNodeRef.current) { try { sourceNodeRef.current.stop(); } catch(e) {} }
      setIsTransmitting(false);
      return;
    }
    const script = metadata.content.voiceoverScript || metadata.content.oracular_mirror;
    if (!script) return;
    const activeManifesto = profile?.manifestos?.find(m => m.id === profile.activeManifestoId) || profile?.manifestos?.[0];
    const preferredVoice = activeManifesto?.voicePreference === 'male' ? 'Puck' : 'Kore';
    setIsAudioLoading(true);
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      const bytes = await generateAudio(script, preferredVoice);
      const dataInt16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      const buffer = audioCtxRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) { channelData[i] = dataInt16[i] / 32768.0; }
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsTransmitting(false);
      source.start(0);
      sourceNodeRef.current = source;
      setIsTransmitting(true);
    } catch (e) { console.error("MIMI // Transmission Muted:", e); } finally { setIsAudioLoading(false); }
  };

  const handleMemeRitual = async () => {
    setIsMemeing(true);
    try {
      const refraction = await generateMemeRefraction(metadata.content);
      setMeme(refraction);
      const img = await generateZineImage(refraction.visualPrompt, '9:16', '1K', profile);
      setMemeImage(img);
    } catch (e) { alert("Meme Dissonance."); } finally { setIsMemeing(false); }
  };

  const handleSaveToVault = async () => {
    setIsVaulting(true);
    try { 
      await addToPocket(user?.uid || 'ghost', 'zine_card', { zineId: metadata.id, zineTitle: metadata.title, tags: metadata.content.tags }); 
      setIsVaulted(true); 
      setTimeout(() => setIsVaulted(false), 2000); 
    } catch (e) {} finally { setIsVaulting(false); }
  };

  const toggleVisibility = async () => {
    if (isUpdatingVisibility) return;
    const newVisibility = !metadata.isPublic;
    setIsUpdatingVisibility(true);
    try {
      await updateZineVisibility(metadata.id, newVisibility);
      setMetadata(prev => ({ ...prev, isPublic: newVisibility }));
    } catch (e) { console.error("MIMI // Visibility toggle failure."); } finally { setIsUpdatingVisibility(false); }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-nous-base dark:bg-stone-950 relative selection:bg-nous-text selection:text-white transition-colors duration-1000 overflow-hidden">
      <div className="fixed top-6 left-6 z-[5000] flex items-center gap-4">
        <button onClick={onReset} className="p-4 bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-full border border-black/5 hover:border-nous-text dark:hover:border-white transition-all shadow-xl active:scale-95 group">
          <X size={20} className="text-stone-400 group-hover:text-nous-text dark:group-hover:text-white" />
        </button>
      </div>

      <nav className="fixed top-6 right-6 z-[100] pointer-events-none">
        <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl px-4 py-2 rounded-full border border-black/5 flex items-center gap-4 pointer-events-auto shadow-2xl">
           {metadata.content.pages && metadata.content.pages.map((p, i) => (
             <button key={i} onClick={() => scrollToPage(i)} className={`w-2 h-2 rounded-full transition-all duration-500 ${activePageIndex === i ? 'bg-nous-text dark:bg-white scale-125 shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'bg-stone-300 dark:bg-stone-700'}`} />
           ))}
        </div>
      </nav>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth">
        
        {/* SOURCE DEBRIS - PRESERVING STRAIGHT THOUGHTS */}
        <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 snap-start relative pt-32 pb-16 md:pb-24 overflow-hidden border-b border-stone-100 dark:border-stone-900 bg-stone-50/20 dark:bg-black/20">
            <div className="max-w-4xl mx-auto w-full space-y-12">
               <div className="flex items-center gap-3 text-stone-400">
                  <Quote size={18} />
                  <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">The Raw Debris</span>
               </div>
               <div className="space-y-8">
                  <h3 className="font-header text-4xl md:text-6xl italic tracking-tighter text-nous-text dark:text-white">Straight Thoughts.</h3>
                  <p className="font-serif italic text-2xl md:text-5xl text-stone-500 dark:text-stone-400 leading-[1.1] tracking-tight text-balance">
                    "{metadata.content.originalThought || "Editorial silence was detected."}"
                  </p>
               </div>
               <div className="flex items-center gap-4 pt-12">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">STATUS: CAPTURED // PENDING REFRACTION</span>
               </div>
            </div>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20">
               <span className="font-sans text-[8px] uppercase tracking-widest">Descend to Form</span>
               <ChevronLeft className="-rotate-90" size={14} />
            </div>
        </section>

        <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 snap-start relative pt-32 pb-16 md:pb-24 overflow-hidden border-b border-stone-100 dark:border-stone-900 bg-nous-base/80 dark:bg-stone-950/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto w-full space-y-8 md:space-y-12">
               <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-stone-400">
                        <span className="font-mono text-[8px] md:text-[10px] uppercase tracking-[0.4em]">ISSUE_${metadata.id.slice(-4)}</span>
                        <div className="h-px w-16 md:w-32 bg-stone-200 dark:border-stone-800" />
                        <span className="font-sans text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-black">{metadata.tone} MANIFEST</span>
                    </div>
                  </div>
                  <h1 className={`${fontChoice === 'brutalist-mono' ? 'font-mono uppercase' : fontChoice === 'minimalist-sans' ? 'font-sans' : 'font-serif'} text-[clamp(2rem,9vw,8rem)] italic tracking-tighter leading-[0.75] text-nous-text dark:text-white luminescent-text break-words`}>
                    {metadata.title}
                  </h1>
               </div>
               <p className="font-serif italic text-2xl md:text-5xl text-stone-400 max-w-5xl leading-[1.05] tracking-tight">"{metadata.content.oracular_mirror}"</p>
            </div>
        </section>

        {metadata.content.pages && metadata.content.pages.map((page, i) => (
          <PageRenderer key={i} page={page} index={i} fontChoice={fontChoice} isDark={currentPalette.isDark} onUpdateImage={(idx, img) => {
            const updatedPages = [...metadata.content.pages];
            updatedPages[idx] = { ...updatedPages[idx], originalMediaUrl: img };
            setMetadata({ ...metadata, content: { ...metadata.content, pages: updatedPages } });
          }} />
        ))}

        {metadata.content.blueprint && (
          <div id="page-target-blueprint" className="snap-start">
            <FruitionMap blueprint={metadata.content.blueprint} fontChoice={fontChoice} />
          </div>
        )}

        <footer className="min-h-screen flex flex-col items-center justify-start px-6 md:px-12 snap-start pt-32 pb-[30vh]">
           <div className="max-w-7xl w-full space-y-12 md:space-y-24 text-center">
              <p className={`${fontChoice === 'brutalist-mono' ? 'font-mono uppercase text-xl' : 'font-serif text-2xl md:text-5xl'} italic leading-[1.15] text-stone-600 dark:text-stone-300 tracking-tight text-balance max-w-5xl mx-auto`}>
                {metadata.content.expanded_reflection}
              </p>

              <div className="pt-24 border-t border-stone-100 dark:border-stone-900 flex flex-col items-center gap-12">
                <div className="flex gap-4 flex-wrap justify-center">
                  <button onClick={handleMemeRitual} disabled={isMemeing} className="flex items-center gap-3 px-6 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all">
                     {isMemeing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Refract into Meme</span>
                  </button>
                  <button onClick={() => alert("Editor access is granted only to Swans.")} className="flex items-center gap-3 px-6 py-2 rounded-full border border-nous-text dark:border-white text-nous-text dark:text-white hover:bg-nous-text hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                     <Edit3 size={14} />
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Tweak Layout (Beta)</span>
                  </button>
                </div>
                
                <AnimatePresence>
                  {meme && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
                       <div className="relative w-full max-w-md aspect-[9/16] bg-stone-950 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 group">
                          {memeImage ? <img src={memeImage} className="w-full h-full object-cover opacity-60 grayscale brightness-75" /> : <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-stone-700" /></div>}
                          <div className="absolute inset-0 p-12 flex flex-col justify-between text-center pointer-events-none">
                             <p className="font-sans text-2xl md:text-4xl text-white font-black uppercase tracking-tighter leading-none">{meme.topText}</p>
                             <div className="space-y-4">
                                <p className="font-serif italic text-3xl md:text-5xl text-emerald-400 leading-none">{meme.bottomText}</p>
                                <div className="h-0.5 w-12 bg-white/20 mx-auto" />
                                <span className="font-sans text-[8px] uppercase tracking-[1em] text-white/40">Mimi Refraction</span>
                             </div>
                          </div>
                          <button onClick={() => setMeme(null)} className="absolute top-6 right-6 p-4 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-red-500 transition-all z-50"><X size={20}/></button>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.button onClick={() => onReset()} whileHover={{ scale: 1.05 }} className="group flex flex-col items-center gap-4 pt-12">
                  <div className="p-6 md:p-8 bg-white/40 dark:bg-stone-900/40 backdrop-blur-2xl rounded-full border border-stone-200 dark:border-stone-800 shadow-2xl text-amber-500 group-hover:shadow-amber-500/20 transition-all">
                    <Radio size={32} className="animate-pulse" />
                  </div>
                  <span className="font-sans text-[9px] md:text-[11px] uppercase tracking-[0.6em] font-black text-stone-400 group-hover:text-amber-500 transition-colors">Commit to Feed</span>
                </motion.button>
              </div>

              {/* SANCTUARY NUDGE */}
              <div className="pt-48 pb-20 flex flex-col items-center gap-8 border-t border-stone-100 dark:border-stone-900">
                <div className="flex flex-col items-center gap-4 group">
                  <button 
                    onClick={onSanctuary}
                    className="px-8 py-3 bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-full border border-black/5 flex items-center gap-6 transition-all hover:bg-white/60 hover:border-emerald-500/30 shadow-xl"
                  >
                      <Heart size={14} className="text-emerald-500 animate-pulse" />
                      <div className="flex flex-col items-start">
                        <span className="font-serif italic text-xs md:text-sm text-stone-500 leading-none">If Mimi stirred something...</span>
                        <span className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-600 mt-1">Enter Sanctuary</span>
                      </div>
                      <ArrowRight size={14} className="text-stone-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="pt-32 pb-64 flex flex-col items-center opacity-20 select-none pointer-events-none">
                 <h2 className="font-serif text-[10rem] md:text-[20rem] font-black tracking-[-0.05em] leading-none blur-[0.6px] uppercase">Zeen</h2>
                 <span className="font-sans text-[12px] uppercase tracking-[2.5em] font-bold mt-[-4rem] block translate-x-[1.25em]">Imperial Registry</span>
              </div>
           </div>
        </footer>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-6 right-6 md:left-12 md:right-auto z-[3000] flex justify-center md:block pb-safe">
        <div className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-3xl px-6 md:px-10 py-4 md:py-6 rounded-full border border-black/5 shadow-2xl flex items-center gap-6 md:gap-10 relative">
          <ToolbarBtn onClick={toggleVisibility} icon={isUpdatingVisibility ? <Loader2 size={22} className="animate-spin" /> : metadata.isPublic ? <Eye size={22} className="text-emerald-500" /> : <EyeOff size={22} className="text-red-500" />} label={metadata.isPublic ? "Exposed" : "Vaulted"} active={metadata.isPublic} />
          <ToolbarBtn onClick={() => alert("Refraction logic is anchoring...")} icon={isRefracting ? <Loader2 size={22} className="animate-spin" /> : <Globe size={22} />} label="Refract" />
          <ToolbarBtn onClick={toggleTransmission} icon={isAudioLoading ? <Loader2 size={22} className="animate-spin" /> : isTransmitting ? <Waves size={22} className="text-emerald-500" /> : <Volume2 size={22} />} label="Transmission" active={isTransmitting} />
          <ToolbarBtn onClick={handleSaveToVault} icon={isVaulting ? <Loader2 size={22} className="animate-spin" /> : isVaulted ? <Check size={22} className="text-emerald-500" /> : <Bookmark size={22} />} label="Vault" />
        </div>
      </motion.div>
    </div>
  );
};

const ToolbarBtn = ({ onClick, icon, label, active }: any) => {
  return (
    <button onClick={onClick} className={`group flex flex-col items-center gap-1 transition-all active:scale-95 ${active ? 'text-emerald-500' : 'text-stone-400 hover:text-nous-text'}`}>
      <div className={`p-2 md:p-3 rounded-full transition-all ${active ? 'bg-emerald-500/10' : 'group-hover:bg-white/30'}`}>{icon}</div>
      <span className="hidden sm:block font-sans text-[7px] uppercase tracking-widest font-black">{label}</span>
    </button>
  );
};
