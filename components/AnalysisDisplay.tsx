
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ZineMetadata, ZinePage, EditorElement, ToneTag } from '../types';
import { useUser } from '../contexts/UserContext';
import { generateAudio, refractTextLanguage } from '../services/geminiService';
import { saveZineToProfile, addToPocket } from '../services/firebase';
import { ChevronLeft, Volume2, Loader2, ArrowRight, CornerRightDown, Globe, Lock, Palette as PaletteIcon, FileText, Bookmark, Check, Download, Square, Languages, Share2, Mic, Settings2, Sparkles, AlertTriangle, Fingerprint, Eye } from 'lucide-react';
import { Visualizer } from './Visualizer';
import { Tooltip } from './Tooltip';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { ZineLayoutEditor } from './ZineLayoutEditor';

const LANGUAGES = [
  { label: 'Original', value: 'original' },
  { label: '简体中文', value: 'Simplified Chinese' },
  { label: '繁體中文', value: 'Traditional Chinese' },
  { label: '日本語', value: 'Japanese' },
  { label: 'Français', value: 'French' },
  { label: 'Español', value: 'Spanish' }
];

const PageRenderer: React.FC<{ page: ZinePage; index: number; onEdit: (idx: number, newImage?: string) => void }> = ({ page, index, onEdit }) => {
  const isAlt = index % 2 !== 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`zine-page relative mb-24 md:mb-[40rem] flex flex-col items-start w-full border-t border-stone-100 dark:border-stone-800 pt-12 md:pt-32`}
    >
      <div className={`z-10 w-full max-w-7xl flex flex-col ${isAlt ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-32 items-start`}>
        <div className="absolute -top-10 left-0 md:-left-12 opacity-5 dark:opacity-10 pointer-events-none">
           <span className="font-serif italic text-6xl md:text-[12rem] tracking-tighter leading-none select-none">
             0{index + 1}
           </span>
        </div>

        <div className="w-full md:w-3/5 magazine-border p-3 md:p-6 bg-white dark:bg-stone-950 shadow-[0_30px_60px_rgba(0,0,0,0.1)] overflow-hidden group">
            <div className="relative overflow-hidden aspect-[4/5] bg-stone-50 dark:bg-stone-900">
               <Visualizer 
                  prompt={page.imagePrompt} 
                  initialImage={page.originalMediaUrl}
                  defaultAspectRatio='3:4' 
                  className="h-full" 
                  onUpdate={(newImage) => onEdit(index, newImage)}
               />
            </div>
        </div>

        <div className="w-full md:w-2/5 space-y-6 md:space-y-16 px-2 md:px-0">
           <div className="flex items-center gap-4 md:gap-6 text-stone-200 dark:text-stone-800">
              <span className="font-sans text-[7px] md:text-[10px] uppercase tracking-[0.6em] md:tracking-[0.8em] font-black shrink-0">LOG_FRAG_{index.toString().padStart(2, '0')}</span>
              <div className="flex-1 h-px bg-current" />
           </div>

           <div className="space-y-6 md:space-y-12">
              {page.headline && (
                <h2 className="font-serif text-4xl md:text-8xl italic tracking-tighter leading-[0.9] text-nous-text dark:text-white font-light text-balance">
                  {page.headline}
                </h2>
              )}
              {page.bodyCopy && (
                <div className="space-y-6 md:space-y-10">
                  <p className="font-serif text-xl md:text-4xl italic text-stone-500 dark:text-stone-400 leading-[1.3] drop-cap">
                    {page.bodyCopy}
                  </p>
                  <div className="flex items-center gap-3 text-nous-text dark:text-white group cursor-pointer pt-2" onClick={() => onEdit(index)}>
                     <span className="font-sans text-[8px] md:text-[9px] uppercase tracking-[0.4em] md:tracking-[0.6em] font-black border-b border-stone-200 dark:border-stone-800 group-hover:border-current transition-all">Calibrate Spread</span>
                     <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const PaintChip: React.FC<{ color: string; label: string; zineTitle: string }> = ({ color, label, zineTitle }) => {
  const { user } = useUser();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCapture = async () => {
    if (!user || isSaved || isLoading) return;
    setIsLoading(true);
    try {
      await navigator.clipboard.writeText(color.toUpperCase());
      await addToPocket(user.uid, 'palette', { 
        colors: [color], 
        zineTitle: zineTitle,
        colorTheory: `Frequency extraction: ${label} from ${zineTitle}`
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error("MIMI // Chip Extraction Failure:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.02 }}
      className="flex flex-col w-32 md:w-48 bg-white dark:bg-stone-900 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-stone-100 dark:border-stone-800 overflow-hidden group cursor-pointer"
      onClick={handleCapture}
    >
      <div className="h-40 md:h-64 w-full relative" style={{ backgroundColor: color || '#A8A29E' }}>
        <AnimatePresence>
          {(isSaved || isLoading) && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="animate-spin text-white" size={24} /> : <Check className="text-white" size={24} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="p-4 md:p-6 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-stone-400">{label}</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Bookmark size={10} className="text-nous-text dark:text-white" />
          </div>
        </div>
        <div className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-nous-text dark:text-white font-bold">
          {color || '#A8A29E'}
        </div>
      </div>
      <div className="h-1 w-full bg-stone-50 dark:bg-stone-800 opacity-20" />
    </motion.div>
  );
};

export const AnalysisDisplay: React.FC<{ metadata: ZineMetadata, onReset: () => void }> = ({ metadata: initialMetadata, onReset }) => {
  const { user, profile } = useUser();
  const [metadata, setMetadata] = useState(initialMetadata);
  const [originalMetadata] = useState(initialMetadata);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransmissionLoading, setIsTransmissionLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(!!initialMetadata.isPublic);
  const [shimmer, setShimmer] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState('original');
  const [isSharing, setIsSharing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showThoughtReveal, setShowThoughtReveal] = useState(false);
  const [isRotaryOpen, setIsRotaryOpen] = useState(false);
  const rotaryRotate = useMotionValue(0);
  const rotarySpring = useSpring(rotaryRotate, { stiffness: 60, damping: 15 });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Structural Risk Assessment Logic
  const museRegister = ['Ava', 'Catherine', 'Giselle', 'Paige', 'Jessica Yeunge', 'Milton', 'Amaan', 'Vyan'];
  const hasSubjectSignal = museRegister.some(name => 
    metadata.title.includes(name) || 
    (metadata.content.originalThought && metadata.content.originalThought.includes(name)) ||
    (metadata.content.expanded_reflection && metadata.content.expanded_reflection.includes(name))
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const initAudio = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const handleTranslate = async (lang: string) => {
    if (lang === 'original') {
      setMetadata(originalMetadata);
      setCurrentLang('original');
      setShowLangMenu(false);
      return;
    }

    setIsTranslating(true);
    setShimmer(true);
    setShowLangMenu(false);
    try {
      const refracted = await refractTextLanguage(metadata.content, lang);
      setMetadata(prev => ({
        ...prev,
        title: refracted.title,
        content: {
          ...prev.content,
          ...refracted
        }
      }));
      setCurrentLang(lang);
    } catch (e) {
      console.error("MIMI // Linguistic Refraction Failed:", e);
    } finally {
      setIsTranslating(false);
      setShimmer(false);
    }
  };

  const handleShare = async () => {
    if (!metadata.id) return;
    setIsSharing(true);
    const shareUrl = `${window.location.origin}${window.location.pathname}?zine=${metadata.id}`;
    const shareData = {
      title: `Witness refraction: ${metadata.title}`,
      text: `A curated artifact from Mimi Zine. Tone: ${metadata.tone}`,
      url: shareUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Refraction link preserved to clipboard.");
      }
    } catch (e) {
      console.warn("MIMI // Sharing Ritual interrupted.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveWholePalette = async () => {
    if (!user) return;
    setShimmer(true);
    try {
      await addToPocket(user.uid, 'palette', { 
        colors: metadata.content.analysis?.visualPalette || [], 
        zineTitle: metadata.title,
        colorTheory: metadata.content.analysis?.colorTheory || 'Sovereign Accord'
      });
    } catch (e) {} finally {
      setTimeout(() => setShimmer(false), 1200);
    }
  };

  const toggleTransmission = async () => {
    const ctx = await initAudio();
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      return;
    }
    setIsTransmissionLoading(true);
    try {
      const script = `${metadata.content.title}. ${metadata.content.voiceoverScript}`;
      const buffer = await generateAudio(script);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (err) { 
      console.error("MIMI // Transmission failed:", err); 
    } finally { 
      setIsTransmissionLoading(false); 
    }
  };

  const handlePageMutation = async (index: number, newImage?: string) => {
    const updatedPages = [...metadata.content.pages];
    if (newImage) {
      updatedPages[index] = { ...updatedPages[index], originalMediaUrl: newImage };
    }
    const updatedMetadata = { ...metadata, content: { ...metadata.content, pages: updatedPages } };
    setMetadata(updatedMetadata);
    if (user) {
      await saveZineToProfile(user.uid, profile?.handle || 'Ghost', profile?.photoURL, updatedMetadata.content, metadata.tone, metadata.coverImageUrl || undefined, metadata.isDeepThinking, isPublic);
    }
  };

  const handleSavePage = async (elements: EditorElement[]) => {
    if (editingPageIndex === null) return;
    const updatedPages = [...metadata.content.pages];
    updatedPages[editingPageIndex] = { ...updatedPages[editingPageIndex], customLayout: { elements } };
    const updatedMetadata = { ...metadata, content: { ...metadata.content, pages: updatedPages } };
    setMetadata(updatedMetadata);
    setEditingPageIndex(null);
    if (user) await saveZineToProfile(user.uid, profile?.handle || 'Ghost', profile?.photoURL, updatedMetadata.content, metadata.tone, metadata.coverImageUrl || undefined, metadata.isDeepThinking, isPublic);
  };

  const handleTogglePublic = async () => {
    const next = !isPublic;
    setIsPublic(next);
    if (user) {
      await saveZineToProfile(user.uid, profile?.handle || 'Ghost', profile?.photoURL, metadata.content, metadata.tone, metadata.coverImageUrl || undefined, metadata.isDeepThinking, next);
    }
  };

  const visualPalette = metadata.content.analysis?.visualPalette || [];
  const paintChips = [
    { color: visualPalette[0], label: 'Primary Base' },
    { color: visualPalette[1], label: 'Manuscript' },
    { color: visualPalette[2], label: 'Sovereign Accent' }
  ];

  const rotaryTools = [
    { id: 'translate', icon: <Languages size={isMobile ? 20 : 24} />, label: 'Translate', action: () => setShowLangMenu(!showLangMenu), active: currentLang !== 'original' },
    { id: 'share', icon: <Share2 size={isMobile ? 20 : 24} />, label: 'Share', action: handleShare, active: isSharing },
    { id: 'public', icon: isPublic ? <Globe size={isMobile ? 20 : 24} /> : <Lock size={isMobile ? 20 : 24} />, label: isPublic ? 'Broadcasting' : 'Private', action: handleTogglePublic, active: isPublic },
    { id: 'mic', icon: <Mic size={isMobile ? 20 : 24} />, label: 'Echo', action: () => alert("Voice Capture Ritual: Phase 02."), active: false },
  ];

  return (
    <div className={`w-full min-h-screen pb-48 bg-nous-base dark:bg-stone-950 relative selection:bg-nous-text selection:text-white overflow-x-hidden transition-all duration-700 ${shimmer ? 'opacity-40 grayscale blur-xl scale-95 pointer-events-none' : ''}`}>
      <AnimatePresence>
        {editingPageIndex !== null && (
          <ZineLayoutEditor page={metadata.content.pages[editingPageIndex]} tone={metadata.tone} onSave={handleSavePage} onCancel={() => setEditingPageIndex(null)} />
        )}
      </AnimatePresence>

      <div className="fixed top-6 left-6 md:top-12 md:left-12 z-[110] flex flex-col gap-4 md:gap-6">
          <Tooltip text="Return to Stand">
            <button onClick={onReset} className="p-4 md:p-5 bg-white/95 dark:bg-black/95 magazine-border rounded-full shadow-2xl text-stone-400 hover:text-nous-text transition-all active:scale-90 border border-stone-200/50 dark:border-stone-800">
              <ChevronLeft size={20}/>
            </button>
          </Tooltip>
          
          <Tooltip text={isPlaying ? "Silence Transmission" : "Listen to Manifest"}>
            <button 
              onClick={toggleTransmission} 
              disabled={isTransmissionLoading} 
              className={`p-4 md:p-5 bg-white/95 dark:bg-black/95 magazine-border rounded-full shadow-2xl transition-all border border-stone-200/50 dark:border-stone-800 ${isPlaying ? 'text-amber-500 shadow-inner ring-2 ring-amber-500/20' : 'text-stone-400 hover:text-nous-text'}`}
            >
              {isTransmissionLoading ? <Loader2 size={20} className="animate-spin" /> : isPlaying ? <Square size={20} /> : <Volume2 size={20} />}
            </button>
          </Tooltip>
      </div>

      <div className={`fixed ${isMobile ? 'bottom-6 left-6' : 'bottom-10 left-10'} z-[1000] flex items-end`}>
          <div className="relative">
              <AnimatePresence>
                  {isRotaryOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotate: -45 }}
                        className={`absolute bottom-2 left-2 ${isMobile ? 'w-[220px] h-[220px]' : 'w-[360px] h-[360px]'} pointer-events-none`}
                      >
                          <motion.div 
                            className="w-full h-full relative"
                            style={{ rotate: rotarySpring }}
                          >
                             {rotaryTools.map((tool, i) => {
                                const angle = (i * (360 / rotaryTools.length)) * (Math.PI / 180);
                                const radius = isMobile ? 80 : 130; 
                                return (
                                  <motion.button
                                    key={tool.id}
                                    onClick={(e) => { e.stopPropagation(); tool.action(); }}
                                    whileHover={{ scale: 1.1 }}
                                    className={`pointer-events-auto absolute ${isMobile ? 'p-4' : 'p-7'} rounded-full bg-white dark:bg-stone-900 border-2 border-stone-100 dark:border-stone-800 shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all active:scale-95 group ${tool.active ? 'text-nous-text dark:text-white ring-2 ring-nous-text/10' : 'text-stone-300 dark:text-stone-700 hover:text-stone-500'}`}
                                    style={{ 
                                      left: `calc(50% + ${Math.cos(angle) * radius}px - ${isMobile ? '24px' : '32px'})`,
                                      top: `calc(50% + ${Math.sin(angle) * radius}px - ${isMobile ? '24px' : '32px'})`,
                                    }}
                                  >
                                    <div className="flex flex-col items-center justify-center">
                                      {tool.icon}
                                      {!isMobile && (
                                        <motion.span className="absolute -bottom-4 font-sans text-[6px] uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-nous-text dark:text-white">
                                          {tool.label}
                                        </motion.span>
                                      )}
                                    </div>
                                  </motion.button>
                                )
                             })}
                          </motion.div>
                      </motion.div>
                  )}
              </AnimatePresence>

              <button 
                onClick={() => {
                  setIsRotaryOpen(!isRotaryOpen);
                  if(!isRotaryOpen) rotaryRotate.set(rotaryRotate.get() + 90);
                }}
                className={`relative z-20 ${isMobile ? 'p-5' : 'p-9'} rounded-full shadow-[0_30px_70px_rgba(0,0,0,0.25)] transition-all active:scale-90 border-2 ${isRotaryOpen ? 'bg-nous-text text-white dark:bg-white dark:text-black border-transparent' : 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-3xl text-stone-400 hover:text-nous-text border-stone-100 dark:border-stone-800'}`}
              >
                  <motion.div animate={{ rotate: isRotaryOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                    {isRotaryOpen ? <Sparkles size={isMobile ? 22 : 28} /> : <Settings2 size={isMobile ? 22 : 28} />}
                  </motion.div>
              </button>
          </div>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div 
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                className={`${isMobile ? 'fixed bottom-24 left-6 right-6' : 'ml-12 mb-4 min-w-[220px]'} bg-white/95 dark:bg-stone-900/95 backdrop-blur-3xl border-2 border-stone-100 dark:border-stone-800 shadow-[0_40px_80px_rgba(0,0,0,0.2)] rounded-[2.5rem] p-8 flex flex-col gap-3 z-[1100]`}
              >
                <div className="flex items-center gap-3 mb-4 px-2 border-b border-stone-100 dark:border-stone-800 pb-4">
                  <Languages size={14} className="text-stone-400" />
                  <span className="font-sans text-[8px] uppercase tracking-[0.4em] text-stone-400 font-black">Linguistic Refraction</span>
                </div>
                {LANGUAGES.map(lang => (
                  <button 
                    key={lang.value} 
                    onClick={() => handleTranslate(lang.value)}
                    className={`text-left px-5 py-3 rounded-xl font-sans text-[11px] uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-stone-800 transition-all ${currentLang === lang.value ? 'text-nous-text dark:text-white font-black bg-stone-50 dark:bg-stone-800' : 'text-stone-400 hover:translate-x-1'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-24 md:pt-64">
        {/* Mode Mode Note: Structural Risk Assessment Sentinel - Now persistent on all scenes */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-12 flex items-center gap-6 p-6 border rounded-xl max-w-fit transition-colors duration-700 ${hasSubjectSignal ? 'bg-red-600/5 dark:bg-red-600/10 border-red-600/20' : 'bg-amber-600/5 dark:bg-amber-600/10 border-amber-600/20'}`}
        >
          <div className="flex -space-x-3">
            <div className={`w-12 h-12 rounded-full border-4 border-white dark:border-black flex items-center justify-center transition-colors ${hasSubjectSignal ? 'bg-red-600' : 'bg-amber-500'}`}>
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-white dark:border-black bg-stone-900 flex items-center justify-center">
              <Fingerprint size={20} className="text-white" />
            </div>
          </div>
          <div>
            <span className={`font-sans text-[10px] uppercase tracking-[0.6em] font-black ${hasSubjectSignal ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              Structural Risk Assessment: {hasSubjectSignal ? 'CRITICAL' : 'ROUTINE'}
            </span>
            <p className="font-serif italic text-sm text-stone-500">
              {hasSubjectSignal 
                ? 'Subject detected in Social Register. Witness with extreme caution.' 
                : 'Routine frequency check complete. No critical debris detected.'}
            </p>
          </div>
        </motion.div>

        <header className="mb-24 md:mb-[45rem] flex flex-col">
          <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-12 mb-12 md:mb-24 border-b-2 border-nous-text dark:border-white pb-8 md:pb-16">
             <div className="flex flex-col text-left">
                <span className="font-mono text-[8px] md:text-[11px] uppercase tracking-[0.6em] md:tracking-[1em] text-stone-400 mb-4 md:mb-6">ISSUE_ID // {metadata.id?.slice(-8)}</span>
                <h1 className={`font-serif text-[clamp(2.5rem,10vw,14rem)] italic tracking-tighter leading-[0.85] luminescent-text font-light text-nous-text dark:text-white -ml-1 md:-ml-4 ${hasSubjectSignal ? 'uppercase' : ''}`}>
                  {metadata.title}
                </h1>
             </div>
             <div className="flex flex-col items-start md:items-end text-left md:text-right shrink-0">
                <span className="font-sans text-[8px] md:text-[11px] uppercase tracking-[0.6em] md:tracking-[0.8em] text-stone-400 font-black mb-1 md:mb-3">Refraction Cycle</span>
                <span className="font-serif italic text-2xl md:text-4xl text-nous-text dark:text-white">{profile?.currentSeason || 'Perpetual'}</span>
             </div>
          </div>

          <div className="w-full grid md:grid-cols-12 gap-10 md:gap-20">
             <div className="md:col-span-8 space-y-8 md:space-y-16">
                <p className="font-serif italic text-3xl md:text-7xl text-stone-400 dark:text-stone-600 leading-tight">
                  "{metadata.content.oracular_mirror}"
                </p>
                <div className="flex items-center gap-6 md:gap-8">
                   <CornerRightDown size={20} className="text-stone-200" />
                   <span className="font-sans text-[8px] md:text-[11px] uppercase tracking-[1em] md:tracking-[1em] text-stone-300 font-black">Scroll Manifest</span>
                </div>
             </div>
             <div className="md:col-span-4 p-6 md:p-12 border border-stone-100 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/50">
                <h4 className="font-sans text-[8px] md:text-[10px] uppercase tracking-[0.5em] md:tracking-[0.6em] text-stone-400 font-black mb-6 md:mb-8">Metadata Tombstone</h4>
                <div className="space-y-4 md:space-y-6 font-serif italic text-sm md:text-lg text-stone-500 leading-relaxed">
                   <p><span className="font-sans text-[7px] uppercase tracking-widest block mb-1">Components</span> {metadata.content.tombstone.materials}</p>
                   <p><span className="font-sans text-[7px] uppercase tracking-widest block mb-1">Temporal</span> {metadata.content.tombstone.temporal_range}</p>
                   <p><span className="font-sans text-[7px] uppercase tracking-widest block mb-1">Origin</span> {metadata.content.tombstone.source}</p>
                </div>
             </div>
          </div>
        </header>

        <section className="mb-24 md:mb-[45rem] max-w-5xl mx-auto px-2">
            <div className="grid md:grid-cols-2 gap-10 md:gap-32 items-start">
               <div className="space-y-4 md:space-y-8">
                  <span className="font-sans text-[8px] md:text-[11px] uppercase tracking-[0.6em] md:tracking-[0.8em] text-stone-400 font-black">The Refraction</span>
                  <div className="w-12 md:w-20 h-[2px] md:h-[3px] bg-nous-text dark:bg-white" />
               </div>
               <p className="font-serif text-2xl md:text-5xl leading-[1.3] text-stone-800 dark:text-stone-200 font-light italic text-justify hyphens-auto">
                  {metadata.content.expanded_reflection}
               </p>
            </div>
        </section>

        <main className="space-y-24 md:space-y-[40rem]">
          {metadata.content.pages.map((page, i) => (
            <PageRenderer 
              key={i} 
              page={page} 
              index={i} 
              onEdit={(idx, newImg) => newImg ? handlePageMutation(idx, newImg) : setEditingPageIndex(idx)} 
            />
          ))}
        </main>

        <section className="py-32 md:py-64 border-t border-stone-100 dark:border-stone-800 mt-64 space-y-32">
            <div className="max-w-6xl mx-auto space-y-24">
               <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-12">
                  <div className="flex items-center gap-6 text-stone-400">
                      <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-full">
                        <PaletteIcon size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sans text-[11px] uppercase tracking-[0.8em] font-black">The Chromatic Accord</span>
                        <span className="font-serif italic text-stone-400 text-sm mt-1">Fragmentary paint chip logic.</span>
                      </div>
                  </div>
                  <Tooltip text="Capture Entire Manifesto">
                    <button 
                      onClick={handleSaveWholePalette}
                      className="group flex items-center gap-4 px-8 py-4 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full text-stone-400 hover:text-nous-text hover:border-nous-text transition-all"
                    >
                      <Download size={18} className="group-hover:translate-y-1 transition-transform" />
                      <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Extract All</span>
                    </button>
                  </Tooltip>
               </div>
               
               <div className="flex flex-wrap gap-8 md:gap-16 justify-center md:justify-start">
                  {paintChips.map((chip, i) => (
                    <PaintChip key={i} color={chip.color} label={chip.label} zineTitle={metadata.title} />
                  ))}
               </div>

               <div className="max-w-3xl border-l-4 border-stone-100 dark:border-stone-800 pl-12 md:pl-20 py-4">
                  <p className="font-serif italic text-2xl md:text-5xl text-stone-500 leading-[1.3] tracking-tight">
                    {metadata.content.analysis?.colorTheory}
                  </p>
               </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-16 pt-32 border-t border-stone-50 dark:border-stone-900">
               <div className="flex items-center gap-4 text-stone-400">
                  <FileText size={18} />
                  <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black">Manifesto Script // End-Note</span>
               </div>
               <div className="space-y-8">
                  <h3 className="font-serif text-4xl md:text-6xl italic text-nous-text dark:text-white tracking-tighter leading-tight">
                    {metadata.content.title}
                  </h3>
                  <p className="font-serif italic text-2xl md:text-4xl text-stone-400 dark:text-stone-600 leading-[1.4] max-w-3xl">
                    {metadata.content.voiceoverScript}
                  </p>
               </div>
            </div>

            <div className="max-w-4xl mx-auto pt-32 border-t border-stone-100 dark:border-stone-800 flex flex-col items-center gap-12">
                <button 
                  onClick={() => setShowThoughtReveal(!showThoughtReveal)}
                  className="group flex items-center gap-4 text-stone-300 hover:text-nous-text transition-all"
                >
                  <Eye size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-sans text-[9px] uppercase tracking-[0.8em] font-black">Reveal Catalan Thought</span>
                </button>
                
                <AnimatePresence>
                  {showThoughtReveal && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full text-center"
                    >
                      <div className="p-12 md:p-20 bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-stone-100 dark:border-stone-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nous-text/10 dark:via-white/10 to-transparent" />
                        <span className="font-sans text-[8px] uppercase tracking-[1em] text-stone-300 mb-12 block">ORIGINAL_DEBRIS</span>
                        <p className="font-serif italic text-2xl md:text-5xl text-stone-400 dark:text-stone-500 leading-tight">
                          "{metadata.content.originalThought || "The seed was reclaimed by the void."}"
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
        </section>

        <footer className="py-[15vh] md:py-[30vh] text-center border-t border-stone-100 dark:border-stone-800 mt-[10vh] md:mt-[20vh] relative overflow-hidden">
            <h3 className="font-serif text-[clamp(4rem,18vw,30rem)] italic tracking-tighter mb-6 opacity-[0.02] select-none">Mimi.</h3>
            <div className="flex flex-col items-center gap-3">
              <span className="font-sans text-[8px] md:text-[11px] uppercase tracking-[1.2em] md:tracking-[2em] font-black opacity-40 ml-[1.2em] md:ml-[2em]">Refraction Terminated</span>
              <div className="w-16 md:w-32 h-px bg-stone-200 dark:bg-stone-800" />
            </div>
        </footer>
      </div>
    </div>
  );
};
