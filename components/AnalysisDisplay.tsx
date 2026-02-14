
// @ts-nocheck
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ZineMetadata, PocketItem } from '../types';
import { generateAudio, animateShardWithVeo, transcribeAudio } from '../services/geminiService';
import { addToPocket } from '../services/firebase';
import { Loader2, X, Volume2, Orbit, Eye, Target, Layers, Moon, Sparkles, Terminal, Quote, ArrowDown, Grid3X3, Printer, Bookmark, Check, Play, Pause, ExternalLink, Download, Share2, Star, FileText, Map, Compass, Zap, RefreshCw, PenTool, Save, Mic, Square, AlertCircle, StickyNote, History, MessageSquareQuote, Radar, Maximize2, Activity, Archive, FolderPlus, Compass as RoadmapIcon, Stars as CelestialIcon, ArrowRight, CornerDownRight, Image as ImageIcon, Film, MousePointer2, Briefcase, ChevronDown, Hash, Search } from 'lucide-react';
import { Visualizer } from './Visualizer';
import { ExportChamber } from './ExportChamber';
import { SocialShareModal } from './SocialShareModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useRecorder } from '../hooks/useRecorder';

const SectionHeader: React.FC<{ label: string; icon: any; color?: string }> = ({ label, icon: Icon, color = "text-emerald-500" }) => (
  <div className="flex items-center gap-4 mb-12 print:mb-4 opacity-50 hover:opacity-100 transition-opacity duration-700">
    <div className={`p-2 bg-stone-50 dark:bg-stone-900 rounded-full ${color}`}>
      <Icon size={14} />
    </div>
    <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-400">{label}</span>
    <div className="h-px flex-1 bg-stone-200 dark:border-stone-800" />
  </div>
);

export const AnalysisDisplay: React.FC<{ metadata: ZineMetadata, onReset: () => void }> = ({ metadata, onReset }) => {
  const { user, profile, toggleZineStar } = useUser();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAnimatingManifest, setIsAnimatingManifest] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Field Notes State
  const [noteContent, setNoteContent] = useState(metadata.originalInput || metadata.content.meta?.intent || '');
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const { isRecording, startRecording, stopRecording, audioBlob } = useRecorder();

  // Handle Voice Transcription for Notes
  useEffect(() => {
    if (audioBlob) {
        const processAudio = async () => {
            setIsTranscribing(true);
            try {
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(audioBlob);
                });
                const text = await transcribeAudio(base64);
                setNoteContent(prev => prev ? `${prev}\n\n[Voice Note]: ${text}` : `[Voice Note]: ${text}`);
            } catch (e) {
                console.error("Transcription failed", e);
            } finally {
                setIsTranscribing(false);
            }
        };
        processAudio();
    }
  }, [audioBlob]);
  
  const handleVoiceToggle = async () => {
    if (isPlaying) { sourceRef.current?.stop(); setIsPlaying(false); return; }
    setIsVoiceLoading(true);
    try {
      const AudioContextClass = (window.AudioContext || window.webkitAudioContext);
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      
      const narrationText = `
        ${metadata.content?.vocal_summary_blurb || metadata.content.poetic_provocation}
      `.trim();

      const bytes = await generateAudio(narrationText);
      const dataInt16 = new Int16Array(bytes.buffer);
      const audioBuffer = audioCtxRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) { channelData[i] = dataInt16[i] / 32768.0; }
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start(0);
      sourceRef.current = source;
      setIsPlaying(true);
    } catch (e) {
      console.error("Voice synthesis failed", e);
    } finally { setIsVoiceLoading(false); }
  };

  const handleAnimateManifest = async () => {
      if (isAnimatingManifest) return;
      setIsAnimatingManifest(true);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Manifesting Motion Refraction...", icon: <Film size={14} className="text-amber-500" /> } }));
      try {
          const targetImage = metadata.coverImageUrl || metadata.content.pages?.[0]?.image_url;
          const res = await animateShardWithVeo(targetImage, metadata.title, '9:16');
          await addToPocket(user?.uid || 'ghost', 'video', { videoUrl: res, title: `${metadata.title} // Motion`, timestamp: Date.now() });
      } catch (e) {} finally { setIsAnimatingManifest(false); }
  };

  const handleSaveToPocket = async () => {
    if (isSaved) return;
    try {
      await addToPocket(user?.uid || 'ghost', 'zine_card', { 
          zineId: metadata.id, 
          title: metadata.title, 
          analysis: {
             ...metadata.content,
             design_brief: metadata.content.strategic_hypothesis || metadata.content.designBrief
          }, 
          timestamp: Date.now(),
          notes: noteContent, // Save the edited/voice-appended notes
          imageUrl: metadata.coverImageUrl
      });
      setIsSaved(true);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Manifest Anchored with Field Notes.", icon: <Bookmark size={14} /> } }));
    } catch (e) {}
  };

  const handleContinuum = () => {
      const continuumData = {
          type: 'continuum',
          previousZineId: metadata.id,
          previousTitle: metadata.title,
          context: `Continuing thread from "${metadata.title}". Hypothesis: ${metadata.content.strategic_hypothesis}. Provocation: ${metadata.content.poetic_provocation}`
      };
      
      window.dispatchEvent(new CustomEvent('mimi:change_view', { 
          detail: 'studio', 
          detail_data: continuumData 
      }));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#FDFBF7] dark:bg-[#080808] relative overflow-hidden transition-colors duration-1000 print:bg-white text-nous-text dark:text-stone-200">
      <AnimatePresence>
          {showExport && <ExportChamber metadata={metadata} onClose={() => setShowExport(false)} />}
          {showShare && <SocialShareModal metadata={metadata} onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      {/* TOP-LEFT EXIT BUTTON */}
      <button 
        onClick={onReset} 
        className="fixed top-8 left-8 z-[5001] p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-stone-200 dark:border-white/10 rounded-full text-stone-400 hover:text-red-500 hover:scale-110 transition-all shadow-xl active:scale-95 group print:hidden"
      >
        <X size={24} />
        <span className="absolute left-full ml-4 font-sans text-[8px] uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black text-white px-2 py-1 rounded">Purge View</span>
      </button>

      {/* FIELD NOTES OVERLAY */}
      <AnimatePresence>
        {showNotes && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }} 
                className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-lg z-[6000] px-6"
            >
                <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-stone-200 dark:border-stone-800 shadow-2xl rounded-sm p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <StickyNote size={14} />
                            <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Field Notes</span>
                        </div>
                        <button onClick={() => setShowNotes(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-white"><X size={14} /></button>
                    </div>
                    <div className="relative">
                        <textarea 
                            value={noteContent} 
                            onChange={(e) => setNoteContent(e.target.value)} 
                            placeholder="Paste references, copy deep links, or record a thought..." 
                            className="w-full h-40 bg-stone-50 dark:bg-black/20 border-none resize-none p-4 font-serif italic text-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 rounded-sm"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            {isTranscribing && (
                                <div className="flex items-center gap-2 bg-white dark:bg-stone-800 px-3 py-1 rounded-full shadow-sm">
                                    <Loader2 size={10} className="animate-spin text-emerald-500" />
                                    <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Parsing Shard...</span>
                                </div>
                            )}
                            <button 
                                onClick={isRecording ? stopRecording : startRecording} 
                                className={`p-2 rounded-full transition-all shadow-sm ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-stone-800 text-stone-400 hover:text-emerald-500'}`}
                            >
                                {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="font-mono text-[8px] text-stone-300 uppercase tracking-widest">Auto-attaches to Archive</span>
                        <button onClick={() => setShowNotes(false)} className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-emerald-500">Minimize</button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING TOOLBAR - THE DOCK */}
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed bottom-8 left-0 right-0 z-[5000] px-4 md:px-0 flex justify-center print:hidden">
        <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200 dark:border-stone-800 p-2 rounded-full shadow-2xl flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full md:max-w-none snap-x">
           
           {/* VOICE CONTROL - RESTORED */}
           <button onClick={handleVoiceToggle} className={`p-4 rounded-full transition-all shrink-0 snap-start flex items-center gap-2 ${isPlaying ? 'bg-emerald-500 text-white' : 'text-stone-500 hover:text-emerald-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
              {isVoiceLoading ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} /> : <Play size={18} />}
           </button>

           <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-1" />

           {/* FIELD NOTES TOGGLE - NEW */}
           <button onClick={() => setShowNotes(!showNotes)} className={`p-4 rounded-full transition-all shrink-0 snap-start ${showNotes || noteContent ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
              <StickyNote size={18} />
           </button>

           <button onClick={handleSaveToPocket} className={`p-4 rounded-full transition-all shrink-0 snap-start ${isSaved ? 'text-emerald-500' : 'text-stone-500 hover:bg-stone-100'}`}>
              {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
           </button>
           <button onClick={() => toggleZineStar(metadata.id)} className={`p-4 rounded-full transition-all shrink-0 snap-start ${profile?.starredZineIds?.includes(metadata.id) ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-stone-500'}`}>
              <Star size={18} fill={profile?.starredZineIds?.includes(metadata.id) ? "currentColor" : "none"} />
           </button>
           <button onClick={() => setShowShare(true)} className="p-4 rounded-full transition-all shrink-0 snap-start text-stone-500 hover:text-nous-text dark:hover:text-white"><Share2 size={18} /></button>
           <button onClick={() => setShowExport(true)} className="p-4 bg-nous-text dark:bg-white text-white dark:text-black rounded-full shadow-lg active:scale-95 transition-all shrink-0 snap-start"><Download size={18} /></button>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth print:overflow-visible print:snap-none">
          
          {/* 1. HEADLINES (TITLE/TONE) */}
          <section className="min-h-screen flex flex-col justify-center px-6 md:px-24 snap-start border-b border-stone-100 dark:border-stone-900 print:min-h-0 print:py-12 bg-[#FDFBF7] dark:bg-[#080808]">
            <div className="max-w-7xl w-full space-y-16">
               <div className="flex items-center gap-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-stone-400">Issue_0{Math.floor(Math.random() * 10)}</span>
                  {metadata.isDeepThinking && <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 font-sans text-[7px] font-black uppercase tracking-widest"><Radar size={10} className="animate-pulse" /> Deep Refraction</div>}
               </div>
               <h1 className="text-7xl md:text-[11rem] tracking-tighter leading-[0.8] text-nous-text dark:text-white uppercase font-serif italic break-words hyphens-auto">
                  {metadata.title}
               </h1>
               <div className="flex flex-col md:flex-row md:items-center gap-12 pt-12 border-t border-stone-100 dark:border-stone-900">
                  <div className="flex flex-col gap-1">
                      <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-stone-400">Tone</span>
                      <span className="font-serif italic text-3xl">{metadata.tone}</span>
                  </div>
                  <div className="hidden md:block h-12 w-px bg-stone-200 dark:bg-stone-800" />
                  <div className="flex flex-col gap-1">
                      <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-stone-400">Date</span>
                      <span className="font-serif italic text-3xl">{new Date(metadata.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="hidden md:block h-12 w-px bg-stone-200 dark:bg-stone-800" />
                  <div className="flex flex-col gap-1">
                      <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-stone-400">Author</span>
                      <span className="font-serif italic text-3xl">@{metadata.userHandle}</span>
                  </div>
               </div>
            </div>
          </section>

          {/* 2. SUMMARY (WITH VOCAL TRANSMISSION) */}
          <section className="min-h-screen flex flex-col justify-center px-6 md:px-24 snap-start bg-white dark:bg-[#0A0A0A] print:min-h-0 print:py-12">
             <div className="max-w-5xl space-y-16">
                <SectionHeader label="Executive Summary" icon={Sparkles} />
                <p className="font-serif italic text-3xl md:text-6xl text-stone-800 dark:text-stone-200 leading-[1.1] md:leading-[1.1]">
                   "{metadata.content.vocal_summary_blurb || metadata.content.poetic_interpretation}"
                </p>
                
                <button 
                    onClick={handleVoiceToggle} 
                    className={`flex items-center gap-6 group`}
                >
                    <div className={`p-6 rounded-full border transition-all ${isPlaying ? 'bg-emerald-500 text-white border-emerald-400' : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:text-emerald-500 hover:border-emerald-500'}`}>
                        {isVoiceLoading ? <Loader2 size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-nous-text dark:text-white group-hover:text-emerald-500 transition-colors">
                            {isPlaying ? 'Transmitting...' : 'Play Transmission'}
                        </span>
                        <span className="font-serif italic text-sm text-stone-400">Listen to the synthesis.</span>
                    </div>
                </button>
             </div>
          </section>

          {/* 3. HEADER IMAGE */}
          <section className="min-h-screen flex flex-col justify-center snap-start bg-black overflow-hidden relative group print:min-h-0 print:py-12">
             <Visualizer prompt={metadata.content.hero_image_prompt || metadata.title} defaultAspectRatio="16:9" isArtifact isLite={metadata.isLite} initialImage={metadata.coverImageUrl} />
             <div className="absolute bottom-12 left-12 p-4 bg-white/5 backdrop-blur-md rounded-sm border border-white/10">
                <span className="font-mono text-[7px] text-white uppercase tracking-widest">FIG_01: PRIMARY_VISUAL</span>
             </div>
             <button onClick={handleAnimateManifest} disabled={isAnimatingManifest} className="absolute bottom-12 right-12 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all">
                {isAnimatingManifest ? <Loader2 size={20} className="animate-spin" /> : <Film size={20} />}
             </button>
          </section>

          {/* 4. THE READING (ORACULAR MIRROR) */}
          <section className="min-h-screen flex flex-col justify-center px-6 md:px-24 snap-start bg-[#F5F5F0] dark:bg-[#0E0E0E] print:min-h-0 print:py-12">
             <div className="max-w-4xl space-y-12">
                <SectionHeader label="Oracular Mirror" icon={Eye} color="text-amber-500" />
                <p className="font-serif italic text-3xl md:text-5xl text-nous-text dark:text-stone-200 leading-tight">
                   "{metadata.content.oracular_mirror}"
                </p>
             </div>
          </section>

          {/* 5. STRATEGIC HYPOTHESIS */}
          <section className="min-h-screen flex flex-col justify-center px-6 md:px-24 snap-start bg-white dark:bg-[#050505] print:min-h-0 print:py-12">
             <div className="max-w-5xl space-y-12">
                <SectionHeader label="Strategic Hypothesis" icon={Target} color="text-indigo-500" />
                <div className="p-10 md:p-16 bg-[#FDFBF7] dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-900 dark:text-indigo-100"><Layers size={200} /></div>
                   <p className="font-serif italic text-2xl md:text-4xl leading-relaxed relative z-10 text-stone-800 dark:text-stone-200">
                      {metadata.content.strategic_hypothesis}
                   </p>
                </div>
             </div>
          </section>

          {/* 6. SEMIOTIC SIGNALS - REDESIGNED AS INDEX */}
          <section className="min-h-screen flex flex-col justify-center px-6 md:px-24 snap-start bg-[#FAFAFA] dark:bg-[#080808] print:min-h-0 print:py-12">
             <div className="max-w-6xl w-full space-y-16">
                <SectionHeader label="Semiotics & Visual Directives" icon={Radar} />
                <div className="grid grid-cols-1 divide-y divide-stone-200 dark:divide-stone-800 border-t border-b border-stone-200 dark:border-stone-800">
                    {metadata.content.aesthetic_touchpoints?.map((t, i) => (
                       <div key={i} className="py-8 grid md:grid-cols-12 gap-6 items-baseline group hover:bg-stone-100 dark:hover:bg-stone-900/50 transition-colors px-4 -mx-4">
                          <div className="md:col-span-1">
                             <span className="font-mono text-[9px] text-stone-400">0{i+1}</span>
                          </div>
                          <div className="md:col-span-3">
                             <h4 className="font-serif text-2xl italic tracking-tighter text-nous-text dark:text-white group-hover:text-emerald-500 transition-colors">{t.motif}</h4>
                          </div>
                          <div className="md:col-span-6 space-y-2">
                             <p className="font-serif italic text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{t.context}</p>
                             {t.visual_directive && (
                                <div className="mt-2 pl-3 border-l border-stone-300 dark:border-stone-700">
                                   <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 block mb-1">Visual Directive</span>
                                   <p className="font-serif text-xs text-stone-600 dark:text-stone-300">{t.visual_directive}</p>
                                </div>
                             )}
                          </div>
                          <div className="md:col-span-2 text-right flex flex-col items-end gap-2">
                             <a 
                                href={`https://www.google.com/search?q=${encodeURIComponent(t.motif + " semiotics aesthetic")}`} 
                                target="_blank"
                                className="inline-flex items-center gap-2 font-sans text-[7px] uppercase tracking-widest font-black text-stone-300 group-hover:text-emerald-500 transition-colors"
                             >
                                Source <ExternalLink size={10} />
                             </a>
                             <button
                                onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'scry' }))} 
                                className="inline-flex items-center gap-2 font-sans text-[7px] uppercase tracking-widest font-black text-indigo-300 group-hover:text-indigo-500 transition-colors"
                             >
                                Scry Signal <Search size={10} />
                             </button>
                          </div>
                       </div>
                    ))}
                </div>
             </div>
          </section>

          {/* 7. CELESTIAL CALIBRATION */}
          <section className="min-h-screen flex flex-col justify-center px-6 md:px-24 snap-start bg-[#050505] text-white print:min-h-0 print:py-12">
             <div className="max-w-4xl space-y-12">
                <SectionHeader label="Celestial Calibration" icon={Moon} color="text-white" />
                <div className="flex flex-col items-center text-center space-y-12">
                   <div className="p-8 rounded-full border border-white/10 bg-white/5 animate-pulse-slow">
                      <CelestialIcon size={48} className="text-emerald-400" />
                   </div>
                   <p className="font-mono text-xl md:text-3xl text-stone-200 uppercase tracking-widest leading-relaxed max-w-2xl border-l-2 border-emerald-500 pl-8 text-left">
                      {metadata.content.celestial_calibration}
                   </p>
                </div>
             </div>
          </section>

          {/* 8. VISUAL PLATES - REDESIGNED AS EDITORIAL SPREADS */}
          <div className="bg-white dark:bg-stone-950 py-32 space-y-32">
             <div className="px-6 md:px-12 max-w-7xl mx-auto">
                <SectionHeader label="Visual Plates" icon={Grid3X3} />
             </div>
             
             {metadata.content.pages?.map((page, i) => {
                const isEven = i % 2 === 0;
                return (
                  <section key={i} className="min-h-screen flex flex-col justify-center snap-start px-6 md:px-12 max-w-7xl mx-auto w-full">
                      <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-24 items-center`}>
                          
                          {/* VISUAL COMPONENT */}
                          <div className="w-full md:w-1/2 relative group">
                              <div className="relative aspect-[3/4] bg-stone-100 dark:bg-stone-900 overflow-hidden shadow-2xl rounded-sm">
                                  <Visualizer 
                                    prompt={page.imagePrompt} 
                                    defaultAspectRatio="3:4" 
                                    isArtifact 
                                    isLite={metadata.isLite} 
                                    initialImage={page.image_url} 
                                  />
                                  {/* PLATE METADATA OVERLAY */}
                                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none mix-blend-difference text-white opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                      <div className="flex flex-col gap-1">
                                          <span className="font-mono text-[7px] uppercase tracking-widest">FIG. 0{i+1}</span>
                                          <span className="font-sans text-[7px] font-black uppercase tracking-widest">Aspect: 3:4</span>
                                      </div>
                                      <div className="font-mono text-[7px] uppercase tracking-widest">PROMPT_REF_{i+1}</div>
                                  </div>
                              </div>
                          </div>

                          {/* TEXT COMPONENT */}
                          <div className="w-full md:w-1/2 space-y-8 md:space-y-12">
                              <div className="flex items-center gap-4 text-stone-300 dark:text-stone-600">
                                  <span className="font-serif italic text-4xl text-stone-200 dark:text-stone-800">{i+1}.</span>
                                  <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
                              </div>
                              <h3 className="font-serif text-5xl md:text-7xl italic tracking-tighter leading-[0.9] text-nous-text dark:text-white">
                                  {page.headline}
                              </h3>
                              <div className="pl-6 border-l border-emerald-500/30">
                                  <p className="font-serif italic text-lg md:text-xl text-stone-500 dark:text-stone-400 leading-relaxed text-balance">
                                      {page.bodyCopy}
                                  </p>
                              </div>
                              
                              {/* CAPTION STYLE FOOTNOTE */}
                              <div className="pt-8 flex gap-4 opacity-40">
                                  <Hash size={12} />
                                  <p className="font-mono text-[8px] uppercase leading-relaxed max-w-xs">
                                      Generative Output • {metadata.tone} • Plate {i+1} of {metadata.content.pages.length}
                                  </p>
                              </div>
                          </div>
                      </div>
                  </section>
                );
             })}
          </div>

          {/* 9. THE ROADMAP (BLUEPRINT) */}
          <section className="min-h-screen flex flex-col justify-center px-6 md:px-24 snap-start bg-[#F9F9F9] dark:bg-[#0C0C0C] print:min-h-0 print:py-12">
             <div className="max-w-5xl w-full space-y-12">
                <SectionHeader label="The Blueprint" icon={RoadmapIcon} color="text-emerald-500" />
                <div className="grid md:grid-cols-2 gap-12">
                   {metadata.content.blueprint && Object.entries(metadata.content.blueprint).map(([key, val], i) => (
                      <div key={i} className="p-10 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-sm space-y-6 hover:shadow-xl transition-shadow duration-500">
                         <div className="flex items-center gap-3">
                            <span className="font-mono text-[9px] text-stone-300">0{i+1}</span>
                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">{key.replace('_', ' ')}</span>
                         </div>
                         <p className="font-serif italic text-xl md:text-2xl text-nous-text dark:text-white leading-snug">{String(val)}</p>
                      </div>
                   ))}
                </div>
             </div>
          </section>

          {/* 10. ORIGINAL THOUGHT (RAW INPUT) */}
          <section className="min-h-screen flex flex-col justify-center px-6 md:px-24 snap-start bg-stone-100 dark:bg-black text-nous-text dark:text-white print:min-h-0 print:py-12">
             <div className="max-w-4xl space-y-16">
                <SectionHeader label="Original Debris" icon={Zap} color="text-amber-500" />
                <div className="space-y-8 pl-8 md:pl-12 border-l-4 border-stone-300 dark:border-stone-800">
                   <div className="font-mono text-[10px] text-stone-400 mb-4 uppercase tracking-widest">
                      // RAW_INPUT_LOG_{metadata.id.slice(-4)}
                   </div>
                   <p className="font-mono text-lg md:text-2xl text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap tracking-tight">
                      "{metadata.originalInput || metadata.content.meta?.intent}"
                   </p>
                </div>
                <div className="pt-12 border-t border-stone-200 dark:border-white/5 opacity-40">
                   <p className="font-serif italic text-xs">"The debris is the foundation of the manifest."</p>
                </div>
             </div>
          </section>

          {/* 11. PROVOCATION + CONTINUUM */}
          <footer className="min-h-screen flex flex-col items-center justify-center p-12 snap-start print:hidden text-center space-y-16">
             <div className="space-y-6 max-w-2xl">
                <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black text-emerald-500">Mimi's Provocation</span>
                <p className="font-serif italic text-3xl md:text-6xl leading-tight text-balance">
                   "{metadata.content.poetic_provocation || "Where does this frequency lead?"}"
                </p>
             </div>

             <div className="flex flex-col gap-6 w-full max-w-md">
                <button 
                  onClick={handleContinuum}
                  className="w-full py-6 bg-emerald-500 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.6em] font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-emerald-400"
                >
                   <ArrowDown size={16} /> Continuum
                </button>
                <p className="font-serif italic text-xs text-stone-400">Send logic back to Studio to thread the narrative.</p>
                
                <button onClick={onReset} className="w-full py-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-sans text-[9px] uppercase tracking-widest font-black transition-all">
                   Purge & Return
                </button>
             </div>
          </footer>
      </div>
    </div>
  );
};
