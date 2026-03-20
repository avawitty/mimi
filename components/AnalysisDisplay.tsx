
// @ts-nocheck
import React, { useEffect, useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ZineMetadata, PocketItem, LineageEntry } from '../types';
import { generateAudio, animateShardWithVeo, transcribeAudio } from '../services/geminiService';
import { addToPocket, subscribeToPocketItems, fetchLineageEntry, uploadBase64Image } from '../services/firebaseUtils';
import { Loader2, X, Volume2, Orbit, Eye, Target, Layers, Moon, Sparkles, Terminal, Quote, ArrowDown, Grid3X3, Printer, Bookmark, Check, Play, Pause, ExternalLink, Download, Share2, Star, FileText, Map, Compass, Zap, RefreshCw, PenTool, Save, Mic, Square, AlertCircle, StickyNote, History, MessageSquareQuote, Radar, Maximize2, Activity, Archive, FolderPlus, Compass as RoadmapIcon, Stars as CelestialIcon, ArrowRight, CornerDownRight, Image as ImageIcon, Film, MousePointer2, Briefcase, BookOpen, ChevronDown, Hash, Search, Menu, Plus, Radio } from 'lucide-react';
import { VisualLanguageReflection } from './VisualLanguageReflection';
import { Visualizer } from './Visualizer';
import { ExportChamber } from './ExportChamber';
import { SocialShareModal } from './SocialShareModal';
import { ZineComments } from './ZineComments';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useRecorder } from '../hooks/useRecorder';

const SectionHeader: React.FC<{ label: string; icon: any; color?: string; style?: React.CSSProperties }> = ({ label, icon: Icon, color = "text-emerald-500", style }) => (
  <div className="flex items-center gap-4 mb-12 print:mb-4 opacity-50 hover:opacity-100 transition-opacity duration-700">
    <div className={`p-2 bg-stone-50 dark:bg-stone-900 rounded-full ${!style ? color : ''}`} style={style ? { color: style.color } : {}}>
      <Icon size={14} />
    </div>
    <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-stone-400">{label}</span>
    <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
  </div>
);

export const AnalysisDisplay: React.FC<{ metadata: ZineMetadata, onReset: () => void, onUpdateMetadata: (updatedMetadata: ZineMetadata) => void }> = ({ metadata, onReset, onUpdateMetadata }) => {
  const { user, profile, activePersona, toggleZineStar } = useUser();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showReflection, setShowReflection] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isAnimatingManifest, setIsAnimatingManifest] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isBroadcasted, setIsBroadcasted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lineageEntry, setLineageEntry] = useState<LineageEntry | null>(null);
  const [showLineage, setShowLineage] = useState(false);
  
  const handleResonanceFlip = async () => {
    if (!showLineage) {
      const entry = await fetchLineageEntry(metadata.id);
      setLineageEntry(entry);
    }
    setShowLineage(!showLineage);
  };
  
  const exportZine = async (format: 'pdf' | 'png') => {
      const element = document.getElementById('zine-content');
      if (!element) return;
      
      const displayTitle = metadata.content?.headlines?.[0] || metadata.title || "Untitled";
      const canvas = await html2canvas(element);
      if (format === 'png') {
          const link = document.createElement('a');
          link.download = `${displayTitle}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } else {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${displayTitle}.pdf`);
      }
  };
  
  // TAILOR INTEGRATION: Fetch styling from the active persona's draft
  const tailor = activePersona?.tailorDraft || profile?.tailorDraft;
  const accentColor = tailor?.chromaticRegistry?.accentSignal || '#10B981'; // Default Emerald
  const baseColor = tailor?.chromaticRegistry?.baseNeutral || '#FDFBF7';
  
  // Determine dominant font family based on Tailor intent (simple heuristic)
  const fontStyle = useMemo(() => {
     const desc = tailor?.typographyIntent?.styleDescription?.toLowerCase() || '';
     if (desc.includes('mono') || desc.includes('brutalist')) return 'font-mono';
     if (desc.includes('sans') || desc.includes('minimal')) return 'font-sans';
     return 'font-serif'; // Default to Editorial Serif
  }, [tailor]);

  // Field Notes State - Fallback logic for Debris
  const originalDebris = metadata.originalInput || metadata.content.meta?.intent || '';
  const [noteContent, setNoteContent] = useState(originalDebris);
  const [vocalSummary, setVocalSummary] = useState(metadata.content.vocal_summary_blurb || '');
  const [poeticInterpretation, setPoeticInterpretation] = useState(metadata.content.poetic_interpretation || '');
  
  const handleSaveMetadata = () => {
      const updatedMetadata = {
          ...metadata,
          content: {
              ...metadata.content,
              vocal_summary_blurb: vocalSummary,
              poetic_interpretation: poeticInterpretation
          }
      };
      onUpdateMetadata(updatedMetadata);
      setIsEditing(false);
  };

  const handleHeroImageGenerated = async (base64: string) => {
      if (!user?.uid) return;
      try {
          const url = await uploadBase64Image(base64, `zines/${user.uid}/${metadata.id}/hero.png`);
          const updatedMetadata = {
              ...metadata,
              coverImageUrl: url,
              content: {
                  ...metadata.content,
                  hero_image_url: url
              }
          };
          onUpdateMetadata(updatedMetadata);
      } catch (e) {
          console.error("Failed to upload hero image", e);
      }
  };

  const handlePageImageGenerated = async (base64: string, pageIndex: number) => {
      if (!user?.uid || !metadata.content.pages) return;
      try {
          const url = await uploadBase64Image(base64, `zines/${user.uid}/${metadata.id}/page_${pageIndex}.png`);
          const updatedPages = [...metadata.content.pages];
          updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              image_url: url
          };
          const updatedMetadata = {
              ...metadata,
              content: {
                  ...metadata.content,
                  pages: updatedPages
              }
          };
          onUpdateMetadata(updatedMetadata);
      } catch (e) {
          console.error("Failed to upload page image", e);
      }
  };

  const handleHypothesisImageGenerated = async (base64: string) => {
      if (!user?.uid) return;
      try {
          const url = await uploadBase64Image(base64, `zines/${user.uid}/${metadata.id}/hypothesis.png`);
          const updatedMetadata = {
              ...metadata,
              content: {
                  ...metadata.content,
                  hypothesis_image_url: url
              }
          };
          onUpdateMetadata(updatedMetadata);
      } catch (e) {
          console.error("Failed to upload hypothesis image", e);
      }
  };

  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
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

  // Check if zine is already saved
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = subscribeToPocketItems(user.uid, (items) => {
        const isAlreadySaved = items.some(item => item.content?.zineId === metadata.id);
        setIsSaved(isAlreadySaved);
    });
    
    return () => unsubscribe();
  }, [user?.uid, metadata.id]);
  
  const handleVoiceToggle = async () => {
    if (isPlaying) { 
      if (sourceRef.current) { try { sourceRef.current.stop(); } catch(e) {} }
      setIsPlaying(false); 
      return; 
    }
    
    setIsVoiceLoading(true);
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass();
      }
      
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      
      const displayTitle = metadata.content?.headlines?.[0] || metadata.title || "Untitled";
      const narrationText = (vocalSummary || poeticInterpretation || displayTitle).trim();
      const personaKey = activePersona?.apiKey ? activePersona.apiKey : undefined;
      const bytes = await generateAudio(narrationText, personaKey);
      
      let audioBuffer: AudioBuffer;
      
      // Check for RIFF header (WAV)
      if (bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70) {
        audioBuffer = await audioCtxRef.current.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      } else {
        // Fallback to raw 16-bit PCM 24kHz
        const length = Math.floor(bytes.byteLength / 2);
        const dataInt16 = new Int16Array(bytes.buffer, bytes.byteOffset, length);
        audioBuffer = audioCtxRef.current.createBuffer(1, length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) { 
          channelData[i] = dataInt16[i] / 32768.0; 
        }
      }

      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start(0);
      sourceRef.current = source;
      setIsPlaying(true);
    } catch (e: any) {
      console.error("MIMI // Voice synthesis failed:", e);
      setIsPlaying(false);
      if (e.message?.includes('overloaded') || e.code === 'QUOTA_EXCEEDED') {
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
              detail: { 
                  message: "Oracle Overloaded. The frequency is too high.", 
                  icon: <AlertCircle size={14} className="text-red-500" /> 
              } 
          }));
      }
    } finally { setIsVoiceLoading(false); }
  };

  const handleAnimateManifest = async () => {
      if (isAnimatingManifest) return;
      setIsAnimatingManifest(true);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Manifesting Motion Refraction...", icon: <Film size={14} style={{ color: accentColor }} /> } }));
      try {
          const displayTitle = metadata.content?.headlines?.[0] || metadata.title || "Untitled";
          const targetImage = metadata.coverImageUrl || metadata.content.pages?.[0]?.image_url;
          const res = await animateShardWithVeo(targetImage, displayTitle, '9:16');
          await addToPocket(user?.uid || 'ghost', 'video', { videoUrl: res, title: `${displayTitle} // Motion`, timestamp: Date.now() });
      } catch (e) {} finally { setIsAnimatingManifest(false); }
  };

  const handleSaveToPocket = async () => {
    if (isSaved) return;
    
    // Optimistic update
    setIsSaved(true);
    
    try {
      const displayTitle = metadata.content?.headlines?.[0] || metadata.title || "Untitled";
      await addToPocket(user?.uid || 'ghost', 'zine_card', { 
          zineId: metadata.id, 
          title: displayTitle, 
          analysis: {
             ...metadata.content,
             design_brief: metadata.content.strategic_hypothesis || metadata.content.designBrief
          }, 
          timestamp: Date.now(),
          notes: noteContent, // Save the edited/voice-appended notes
          imageUrl: metadata.coverImageUrl,
          originalInput: originalDebris // Explicitly save original debris again
      });
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Manifest Anchored with Field Notes.", icon: <Bookmark size={14} style={{ color: accentColor }} /> } }));
    } catch (e) {
      // Revert on error
      setIsSaved(false);
      console.error("Failed to save to pocket", e);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Failed to anchor manifest.", icon: <AlertCircle size={14} className="text-red-500" /> } }));
    }
  };

  const handleBroadcast = async () => {
      if (isBroadcasted || isBroadcasting) return;
      setIsBroadcasting(true);
      window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'shimmer' } }));
      try {
          const { collection, addDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          
          const displayTitle = metadata.content?.headlines?.[0] || metadata.title || "Untitled";
          const transmission = {
              userId: user?.uid || 'ghost',
              userHandle: profile?.handle || 'Ghost',
              content: displayTitle,
              imageUrl: metadata.coverImageUrl || metadata.content.hero_image_url || '',
              timestamp: Date.now(),
              type: 'manifest',
              likes: 0,
              zineData: metadata
          };
          
          const cleanTransmission = JSON.parse(JSON.stringify(transmission));
          await addDoc(collection(db, 'public_transmissions'), cleanTransmission);
          
          setIsBroadcasted(true);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Manifest Broadcasted to Proscenium.", icon: <Radio size={14} style={{ color: accentColor }} /> } }));
      } catch (e) {
          console.error("Broadcast failed", e);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Broadcast Failed.", type: 'error' } }));
      } finally {
          setIsBroadcasting(false);
      }
  };

  const handleContinuum = () => {
      // Pass provocation AND original artifacts as context to input
      const provocation = metadata.content.poetic_provocation;
      const displayTitle = metadata.content?.headlines?.[0] || metadata.title || "Untitled";
      window.dispatchEvent(new CustomEvent('mimi:change_view', { 
          detail: 'studio', 
          detail_data: { 
              context: `Continuing thread from "${displayTitle}".\n\nPROVOCATION: "${provocation}"\n\nRESPONSE:`,
              provocation: provocation,
              initialMedia: metadata.artifacts || [] 
          }
      }));
  };

  const handleScrySignal = (motif: string) => {
      // Direct pass to Scry View
      window.dispatchEvent(new CustomEvent('mimi:change_view', { 
          detail: 'scry',
          detail_data: { signal: motif }
      }));
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-[#FDFBF7] dark:bg-[#080808] relative overflow-hidden transition-colors duration-1000 print:bg-white text-nous-text dark:text-stone-200">
      <AnimatePresence>
          {showExport && <ExportChamber metadata={metadata} onClose={() => setShowExport(false)} />}
          {showShare && <SocialShareModal metadata={metadata} onClose={() => setShowShare(false)} />}
          {showComments && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-xl"
            >
              <ZineComments zineId={metadata.id} onClose={() => setShowComments(false)} />
            </motion.div>
          )}
      </AnimatePresence>

      {/* Export Buttons */}
      <div className="fixed top-8 right-24 z-[5001] flex gap-2">
        <button onClick={() => exportZine('png')} className="p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-stone-200 dark:border-white/10 rounded-full text-stone-400 hover:text-emerald-500 transition-all shadow-xl">
            <ImageIcon size={20} />
        </button>
        <button onClick={() => exportZine('pdf')} className="p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-stone-200 dark:border-white/10 rounded-full text-stone-400 hover:text-emerald-500 transition-all shadow-xl">
            <FileText size={20} />
        </button>
      </div>

      {/* TOP-LEFT EXIT BUTTON */}
      <button 
        onClick={onReset} 
        className="fixed top-8 left-8 z-[5001] p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-stone-200 dark:border-white/10 rounded-full text-stone-400 hover:text-red-500 hover:scale-110 transition-all shadow-xl active:scale-95 group print:hidden"
      >
        <X size={24} />
        <span className="absolute left-full ml-4 font-sans text-[8px] uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black text-white px-2 py-1 rounded">Purge View</span>
      </button>

      {/* MAIN CONTENT LAYOUT - SPLIT WITH SIDEBAR */}
      <div className="flex flex-1 overflow-hidden relative">
          
          {/* THE SCROLLABLE ZINE CONTENT */}
          <div className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth print:overflow-visible print:snap-none">
              
              {/* 1. HEADLINES (TITLE/TONE) */}
              <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start border-b border-stone-100 dark:border-stone-900 print:min-h-0 print:py-12 bg-[#FDFBF7] dark:bg-[#080808]">
                <div className="max-w-7xl w-full space-y-16">
                   <div className="flex items-center gap-4">
                      <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-stone-400">Issue_0{Math.floor(Math.random() * 10)}</span>
                      {metadata.isDeepThinking && <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 font-sans text-[7px] font-black uppercase tracking-widest"><Radar size={10} className="animate-pulse" /> Deep Refraction</div>}
                      <button onClick={handleResonanceFlip} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-emerald-500 transition-colors">
                          <Layers size={14} className="text-stone-500 dark:text-stone-400" />
                      </button>
                   </div>
                   <h1 className={`${fontStyle} text-7xl md:text-[11rem] tracking-tighter leading-[0.8] text-nous-text dark:text-stone-100 uppercase italic break-words hyphens-auto`}>
                      {metadata.content?.headlines?.[0] || metadata.title}
                   </h1>
                   <div className="flex flex-col md:flex-row md:items-center gap-12 pt-12 border-t border-stone-100 dark:border-stone-900">
                      <div className="flex flex-col gap-1">
                          <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-stone-400">Tone</span>
                          <span className="font-serif italic text-3xl" style={{ color: accentColor }}>{metadata.tone}</span>
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
              <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-white dark:bg-[#0A0A0A] print:min-h-0 print:py-12">
                 <div className="max-w-5xl space-y-16">
                    <SectionHeader label="Executive Summary" icon={Sparkles} style={{ color: accentColor }} />
                    <button onClick={() => setIsEditing(!isEditing)} className="text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-emerald-500 transition-colors">
                        {isEditing ? 'Cancel Edit' : 'Edit Summary'}
                    </button>
                    {isEditing ? (
                        <div className="space-y-4">
                            <textarea value={vocalSummary} onChange={e => setVocalSummary(e.target.value)} className="w-full p-4 bg-stone-100 dark:bg-stone-900 rounded-sm" placeholder="Vocal Summary Blurb" />
                            <textarea value={poeticInterpretation} onChange={e => setPoeticInterpretation(e.target.value)} className="w-full p-4 bg-stone-100 dark:bg-stone-900 rounded-sm" placeholder="Poetic Interpretation" />
                            <button onClick={handleSaveMetadata} className="px-4 py-2 bg-emerald-500 text-white rounded-sm font-sans text-[8px] uppercase tracking-widest font-black">Save Changes</button>
                        </div>
                    ) : (
                        <p className="font-serif italic text-3xl md:text-6xl text-stone-800 dark:text-stone-200 leading-[1.1] md:leading-[1.1]">
                           "{vocalSummary || poeticInterpretation}"
                        </p>
                    )}
                    
                    <button 
                        onClick={handleVoiceToggle} 
                        className={`flex items-center gap-6 group`}
                    >
                        <div className={`p-6 rounded-full border transition-all ${isPlaying ? 'text-white' : 'border-stone-200 dark:border-stone-800 text-stone-400'}`} style={isPlaying ? { backgroundColor: accentColor, borderColor: accentColor } : {}}>
                            {isVoiceLoading ? <Loader2 size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-nous-text dark:text-white transition-colors" style={isPlaying ? { color: accentColor } : {}}>
                                {isPlaying ? 'Transmitting...' : 'Play Transmission'}
                            </span>
                            <span className="font-serif italic text-sm text-stone-400">Listen to the synthesis.</span>
                        </div>
                    </button>
                 </div>
              </section>

              {/* 3. HEADER IMAGE */}
              <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg-black overflow-hidden relative group print:min-h-0 print:py-12">
                 <Visualizer prompt={metadata.content.hero_image_prompt || metadata.content?.headlines?.[0] || metadata.title} defaultAspectRatio="16:9" defaultImageSize={metadata.isHighFidelity ? '2K' : '1K'} isArtifact isLite={metadata.isLite} initialImage={metadata.coverImageUrl} artifacts={metadata.artifacts} onImageGenerated={handleHeroImageGenerated} />
                 <div className="absolute bottom-12 left-12 p-4 bg-white/5 backdrop-blur-md rounded-sm border border-white/10">
                    <span className="font-mono text-[7px] text-white uppercase tracking-widest">FIG_01: PRIMARY_VISUAL</span>
                 </div>
                 <button onClick={handleAnimateManifest} disabled={isAnimatingManifest} className="absolute bottom-12 right-12 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all">
                    {isAnimatingManifest ? <Loader2 size={20} className="animate-spin" /> : <Film size={20} />}
                 </button>
              </section>

              {/* 4. THE READING (ORACULAR MIRROR) */}
              <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-[#F5F5F0] dark:bg-[#0E0E0E] print:min-h-0 print:py-12">
                 <div className="max-w-4xl space-y-12">
                    <SectionHeader label="Oracular Mirror" icon={Eye} style={{ color: accentColor }} />
                    <p className="font-serif italic text-3xl md:text-5xl text-nous-text dark:text-stone-200 leading-tight">
                       "{metadata.content.oracular_mirror || metadata.content.the_reading || "The mirror is silent."}"
                    </p>
                 </div>
              </section>

              {/* 5. STRATEGIC HYPOTHESIS (VISUALIZED) */}
              <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-white dark:bg-[#050505] print:min-h-0 print:py-12">
                 <div className="max-w-7xl w-full space-y-12">
                    <SectionHeader label="Strategic Hypothesis" icon={Target} style={{ color: accentColor }} />
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="aspect-square w-full relative border border-stone-100 dark:border-stone-800 shadow-2xl rounded-sm overflow-hidden bg-stone-50 dark:bg-stone-900">
                            {/* Use Visualizer to render the hypothesis visually */}
                            <Visualizer 
                                prompt={`An abstract, conceptual, high-contrast editorial photograph representing the concept: "${metadata.content.strategic_hypothesis}". Focus on texture, lighting, and composition. No text, no typography. Cinematic, moody, architectural.`} 
                                defaultAspectRatio="1:1" 
                                defaultImageSize={metadata.isHighFidelity ? '2K' : '1K'}
                                isArtifact 
                                isLite={metadata.isLite} 
                                delay={400}
                                artifacts={metadata.artifacts}
                                initialImage={(metadata.content as any).hypothesis_image_url}
                                onImageGenerated={handleHypothesisImageGenerated}
                            />
                            <div className="absolute bottom-4 right-4 bg-black/80 text-white px-2 py-1 text-[8px] font-mono rounded-sm">FIG 2.1 — ABSTRACT</div>
                        </div>
                        <div className="p-8 md:p-12 border-l-4" style={{ borderColor: `${accentColor}30` }}>
                            <p className="font-serif italic text-2xl md:text-4xl leading-relaxed text-stone-800 dark:text-stone-200">
                                {metadata.content.strategic_hypothesis}
                            </p>
                            <div className="mt-8 flex items-center gap-4 text-stone-400">
                                <Layers size={16} />
                                <span className="font-sans text-[9px] uppercase tracking-widest font-black">Visual Perception Generated</span>
                            </div>
                            <div className="mt-12">
                            </div>
                        </div>
                    </div>
                 </div>
              </section>

              {/* 6. SEMIOTIC SIGNALS - REDESIGNED GRID */}
              <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-[#FAFAFA] dark:bg-[#080808] print:min-h-0 print:py-12">
                 <div className="max-w-7xl w-full space-y-16">
                    <SectionHeader label="Semiotics & Visual Directives" icon={Radar} style={{ color: accentColor }} />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {metadata.content.semiotic_signals?.map((t, i) => {
                           const Icon = t.type === 'acquisition' ? Briefcase : t.type === 'lexical' ? BookOpen : Sparkles;
                           const label = t.type === 'acquisition' ? 'Buy this' : t.type === 'lexical' ? 'Add to Lexicon' : 'Imagine this';
                           
                           return (
                             <div key={i} className="group relative p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm hover:shadow-2xl transition-all flex flex-col justify-between min-h-[300px] hover:border-transparent" style={{ '--hover-accent': accentColor } as React.CSSProperties}>
                                <div className="absolute top-4 right-4 opacity-30 font-mono text-[9px]">SIG_0{i+1}</div>
                                
                                <div className="space-y-4">
                                   <div className="flex items-center gap-2 mb-2">
                                      <Icon size={12} className="text-stone-400 group-hover:text-[var(--hover-accent)] transition-colors" />
                                      <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">{label}</span>
                                   </div>
                                   <h4 className="font-serif text-3xl italic tracking-tighter text-nous-text dark:text-white group-hover:text-[var(--hover-accent)] transition-colors">
                                      {t.motif}
                                   </h4>
                                   <p className="font-serif italic text-sm text-stone-500 dark:text-stone-400 leading-relaxed border-l-2 border-stone-100 dark:border-stone-800 pl-4">
                                      {t.context}
                                   </p>
                                   {t.visual_directive && (
                                      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                                         <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 block mb-2">Directive</span>
                                         <p className="font-mono text-[9px] text-stone-500">{t.visual_directive}</p>
                                      </div>
                                   )}
                                   
                                   {/* SOVEREIGN AD TARGETING LOGIC */}
                                   {(t.semantic_trigger || t.targeting_rationale) && (
                                      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                                         <div className="flex items-center gap-2 mb-2">
                                            <Target size={10} className="text-stone-400" />
                                            <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Targeting Rationale</span>
                                         </div>
                                         {t.semantic_trigger && (
                                            <div className="mb-2">
                                               <span className="font-mono text-[8px] text-stone-400">Trigger: </span>
                                               <span className="font-mono text-[9px] text-[var(--hover-accent)] bg-[var(--hover-accent)]/10 px-1 py-0.5 rounded-sm">{t.semantic_trigger}</span>
                                            </div>
                                         )}
                                         {t.targeting_rationale && (
                                            <p className="font-sans text-[10px] text-stone-500 leading-relaxed">
                                               {t.targeting_rationale}
                                            </p>
                                         )}
                                      </div>
                                   )}
                                </div>

                                <div className="pt-8 flex justify-between items-end">
                                   <div className="flex gap-4">
                                      <button
                                         onClick={() => handleScrySignal(t.motif + (t.visual_directive ? " " + t.visual_directive : ""))} 
                                         className="flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-[var(--hover-accent)] transition-colors border-b border-transparent hover:border-current pb-0.5"
                                      >
                                         <Search size={10} /> Scry Signal
                                      </button>
                                      {t.type === 'acquisition' && t.link && (
                                         <a 
                                            href={t.link} 
                                            target="_blank"
                                            className="flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500 hover:text-emerald-400 transition-colors border-b border-transparent hover:border-current pb-0.5"
                                         >
                                            <Briefcase size={10} /> Grounding
                                         </a>
                                      )}
                                   </div>
                                   <a 
                                      href={`https://www.google.com/search?q=${encodeURIComponent(t.motif + " aesthetic meaning")}`} 
                                      target="_blank"
                                      className="text-stone-300 hover:text-[var(--hover-accent)] transition-colors"
                                   >
                                      <ExternalLink size={14} />
                                   </a>
                                </div>
                             </div>
                           );
                        })}
                    </div>
                 </div>
              </section>

              {/* 7. CELESTIAL CALIBRATION */}
              <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-[#050505] text-white print:min-h-0 print:py-12">
                 <div className="max-w-4xl space-y-12">
                    <SectionHeader label="Celestial Calibration" icon={Moon} color="text-white" />
                    <div className="flex flex-col items-center text-center space-y-12">
                       <div className="p-8 rounded-full border border-white/10 bg-white/5 animate-pulse-slow">
                          <CelestialIcon size={48} style={{ color: accentColor }} />
                       </div>
                       <p className="font-mono text-xl md:text-3xl text-stone-200 uppercase tracking-widest leading-relaxed max-w-2xl border-l-2 pl-8 text-left" style={{ borderColor: accentColor }}>
                          {metadata.content.celestial_calibration}
                       </p>
                    </div>
                 </div>
              </section>

              {/* 8. VISUAL PLATES - REDESIGNED AS EDITORIAL SPREADS */}
              <div className="bg-white dark:bg-stone-950 py-32 space-y-32">
                 <div className="px-6 md:px-12 max-w-7xl mx-auto">
                    <SectionHeader label="Visual Plates" icon={Grid3X3} style={{ color: accentColor }} />
                 </div>
                 
                 {metadata.content.pages?.map((page, i) => {
                    const isEven = i % 2 === 0;
                    return (
                      <section key={i} className="min-h-[100dvh] flex flex-col justify-center snap-start px-6 md:px-12 max-w-7xl mx-auto w-full">
                          <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-24 items-center`}>
                              
                              {/* VISUAL COMPONENT */}
                              <div className="w-full md:w-1/2 relative group">
                                  <div className="relative aspect-[3/4] bg-stone-100 dark:bg-stone-900 overflow-hidden shadow-2xl rounded-sm">
                                      <Visualizer 
                                        prompt={page.imagePrompt} 
                                        defaultAspectRatio="3:4" 
                                        defaultImageSize={metadata.isHighFidelity ? '2K' : '1K'}
                                        isArtifact 
                                        isLite={metadata.isLite} 
                                        initialImage={page.image_url} 
                                        delay={800 + (i * 1200)}
                                        artifacts={metadata.artifacts}
                                        onImageGenerated={(base64) => handlePageImageGenerated(base64, i)}
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
                                  <h3 className={`${fontStyle} text-5xl md:text-7xl italic tracking-tighter leading-[0.9] text-nous-text dark:text-white`}>
                                      {page.headline}
                                  </h3>
                                  <div className="pl-6 border-l" style={{ borderColor: `${accentColor}40` }}>
                                      <p className="font-serif italic text-lg md:text-xl text-stone-500 dark:text-stone-400 leading-relaxed text-balance">
                                          {page.bodyCopy}
                                      </p>
                                      {page.supportingText && (i >= metadata.content.pages.length - 3) && (
                                          <p className="mt-4 font-mono text-xs text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                                              {page.supportingText}
                                          </p>
                                      )}
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

              {/* 9. THE ROADMAP (BLUEPRINT) - ARCHITECTURAL REDESIGN */}
              <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-[#050505] text-white print:min-h-0 print:py-12 relative overflow-hidden">
                 {/* TECHNICAL GRID BACKGROUND */}
                 <div className="absolute inset-0 opacity-10 pointer-events-none" 
                      style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                 />
                 
                 <div className="max-w-6xl w-full space-y-16 relative z-10">
                     <SectionHeader label="Authority Roadmap" icon={RoadmapIcon} color="text-white" />
                                        <div className="border border-stone-800 bg-[#0A0A0A]/90 p-12 relative">
                       {/* CAD MARKERS */}
                       <div className="absolute top-0 left-0 p-2 border-r border-b border-stone-800"><span className="font-mono text-[8px] text-stone-500">TL_REF_01</span></div>
                       <div className="absolute bottom-0 right-0 p-2 border-l border-t border-stone-800"><span className="font-mono text-[8px] text-stone-500">BR_REF_04</span></div>
                       
                       <div className="grid md:grid-cols-2 gap-16">
                          {metadata.content.roadmap ? (
                             <>
                                <div className="space-y-4 group">
                                   <div className="flex items-center gap-4 border-b border-stone-800 pb-2">
                                      <span className="font-mono text-xs" style={{ color: accentColor }}>01</span>
                                      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">Strategic Thesis</span>
                                   </div>
                                   <p className="font-mono text-sm text-stone-300 leading-relaxed pl-8 border-l border-white/5 transition-colors">
                                      {metadata.content.roadmap.strategicThesis}
                                   </p>
                                </div>
                                <div className="space-y-4 group">
                                   <div className="flex items-center gap-4 border-b border-stone-800 pb-2">
                                      <span className="font-mono text-xs" style={{ color: accentColor }}>02</span>
                                      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">Positioning Axis</span>
                                   </div>
                                   <p className="font-mono text-sm text-stone-300 leading-relaxed pl-8 border-l border-white/5 transition-colors">
                                      {metadata.content.roadmap.positioningAxis}
                                   </p>
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-4 group">
                                   <div className="flex items-center gap-4 border-b border-stone-800 pb-2">
                                      <span className="font-mono text-xs" style={{ color: accentColor }}>03</span>
                                      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">Authority Anchor</span>
                                   </div>
                                   <div className="grid md:grid-cols-3 gap-8 pl-8 border-l border-white/5">
                                       <div>
                                           <span className="font-mono text-[8px] text-stone-500 uppercase block mb-2">Core Claim</span>
                                           <p className="font-mono text-sm text-stone-300">{metadata.content.roadmap.authorityAnchor?.coreClaim}</p>
                                       </div>
                                       <div>
                                           <span className="font-mono text-[8px] text-stone-500 uppercase block mb-2">Repetition Vector</span>
                                           <p className="font-mono text-sm text-stone-300">{metadata.content.roadmap.authorityAnchor?.repetitionVector}</p>
                                       </div>
                                       <div>
                                           <span className="font-mono text-[8px] text-stone-500 uppercase block mb-2">Exclusion Principle</span>
                                           <p className="font-mono text-sm text-stone-300">{metadata.content.roadmap.authorityAnchor?.exclusionPrinciple}</p>
                                       </div>
                                   </div>
                                </div>
                                
                                {metadata.content.roadmap.phases && metadata.content.roadmap.phases.length > 0 && (
                                   <div className="col-span-1 md:col-span-2 space-y-4 group mt-8">
                                      <div className="flex items-center gap-4 border-b border-stone-800 pb-2">
                                         <span className="font-mono text-xs" style={{ color: accentColor }}>04</span>
                                         <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">Authority Phases</span>
                                      </div>
                                      <div className="grid md:grid-cols-2 gap-8 pl-8 border-l border-white/5">
                                         {metadata.content.roadmap.phases.map((phase, idx) => (
                                            <div key={idx} className="space-y-2 border border-stone-800/50 p-4 bg-stone-900/20">
                                               <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest block mb-1">Phase: {phase.type}</span>
                                               <p className="font-mono text-sm text-stone-300"><strong>Objective:</strong> {phase.objective}</p>
                                               <p className="font-mono text-sm text-stone-300"><strong>Move:</strong> {phase.strategicMove}</p>
                                               <p className="font-mono text-xs text-stone-500 mt-2"><strong>Risk:</strong> {phase.riskToIntegrity}</p>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                )}
                                
                                {metadata.content.roadmap.driftForecast && (
                                   <div className="col-span-1 md:col-span-2 space-y-4 group mt-8">
                                      <div className="flex items-center gap-4 border-b border-stone-800 pb-2">
                                         <span className="font-mono text-xs" style={{ color: accentColor }}>05</span>
                                         <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">Drift Forecast</span>
                                      </div>
                                      <div className="grid md:grid-cols-2 gap-8 pl-8 border-l border-white/5">
                                         <div>
                                            <span className="font-mono text-[8px] text-stone-500 uppercase block mb-1">Predicted Shift</span>
                                            <p className="font-mono text-sm text-stone-300">{metadata.content.roadmap.driftForecast.predictedClusterShift}</p>
                                         </div>
                                         <div>
                                            <span className="font-mono text-[8px] text-stone-500 uppercase block mb-1">Refusal Point</span>
                                            <p className="font-mono text-sm text-stone-300">{metadata.content.roadmap.driftForecast.refusalPoint}</p>
                                         </div>
                                      </div>
                                   </div>
                                )}
                             </>
                          ) : metadata.content.blueprint ? Object.entries(metadata.content.blueprint).map(([key, val], i) => (
                             <div key={i} className="space-y-4 group">
                                <div className="flex items-center gap-4 border-b border-stone-800 pb-2">
                                   <span className="font-mono text-xs" style={{ color: accentColor }}>0{i+1}</span>
                                   <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-white transition-colors">{key.replace('_', ' ')}</span>
                                </div>
                                <p className="font-mono text-sm text-stone-300 leading-relaxed pl-8 border-l border-white/5 transition-colors" style={{ '--hover-color': accentColor } as React.CSSProperties}>
                                   {String(val)}
                                </p>
                             </div>
                          )) : (
                             <div className="col-span-2 space-y-4">
                                <div className="flex items-center gap-4 border-b border-stone-800 pb-2">
                                   <span className="font-mono text-xs" style={{ color: accentColor }}>01</span>
                                   <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Roadmap</span>
                                </div>
                                <p className="font-mono text-sm text-stone-300 leading-relaxed pl-8 border-l border-white/5">
                                   {metadata.content.the_roadmap || "No architectural blueprint detected."}
                                </p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              </section>

               {/* 10. SIGNAL FEED (The Cultural Air) */}
               {metadata.transmissionsUsed && metadata.transmissionsUsed.length > 0 && (
                  <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-white dark:bg-black text-nous-text dark:text-white print:min-h-0 print:py-12">
                     <div className="max-w-4xl w-full space-y-16">
                        <SectionHeader label="Signal Feed" icon={Radio} style={{ color: accentColor }} />
                        <div className="space-y-8">
                           <p className="font-serif italic text-2xl text-stone-400 leading-relaxed">
                              "The manifest does not exist in a vacuum. It is a refraction of the collective frequency."
                           </p>
                           <div className="grid gap-6">
                              {metadata.transmissionsUsed.map((t, idx) => (
                                 <div key={idx} className="flex items-start gap-4 p-4 border border-stone-100 dark:border-stone-800 rounded-sm bg-stone-50/50 dark:bg-stone-900/30">
                                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center shrink-0">
                                       <Radio size={14} className="text-stone-400" />
                                    </div>
                                    <div className="space-y-1">
                                       <div className="flex items-center gap-2">
                                          <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500">@{t.userHandle}</span>
                                          <span className="font-mono text-[8px] text-stone-300">{new Date(t.timestamp).toLocaleTimeString()}</span>
                                       </div>
                                       <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                                          {t.content}
                                       </p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </section>
               )}

               {/* 10. ORIGINAL THOUGHT (RAW INPUT + THUMBNAILS) */}
              <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-stone-100 dark:bg-black text-nous-text dark:text-white print:min-h-0 print:py-12">
                 <div className="max-w-4xl space-y-16">
                    <SectionHeader label="Original Debris" icon={Zap} style={{ color: accentColor }} />
                    {originalDebris ? (
                        <div className="space-y-8 pl-8 md:pl-12 border-l-4 border-stone-300 dark:border-stone-800">
                           <div className="font-mono text-[10px] text-stone-400 mb-4 uppercase tracking-widest">
                              // RAW_INPUT_LOG_{metadata.id.slice(-4)}
                           </div>
                           <p className="font-mono text-lg md:text-2xl text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap tracking-tight">
                              "{originalDebris}"
                           </p>
                           
                           {/* THUMBNAIL DISPLAY */}
                           {metadata.artifacts && metadata.artifacts.length > 0 && (
                               <div className="flex flex-wrap gap-4 pt-8 border-t border-stone-200 dark:border-stone-800">
                                   {metadata.artifacts.map((art, idx) => (
                                       <div key={idx} className="relative w-24 h-24 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-sm overflow-hidden shadow-sm hover:scale-105 transition-transform">
                                           {art.type === 'image' ? (
                                               <img src={art.url || `data:${art.mimeType};base64,${art.data}`} className="w-full h-full object-cover" />
                                           ) : (
                                               <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                   <Volume2 size={24} />
                                               </div>
                                           )}
                                       </div>
                                   ))}
                               </div>
                           )}
                        </div>
                    ) : (
                        <div className="opacity-30 text-center py-12 border-2 border-dashed border-stone-300 dark:border-stone-800 rounded-sm">
                            <p className="font-serif italic text-xl">Debris data lost in transit.</p>
                        </div>
                    )}
                    <div className="pt-12 border-t border-stone-200 dark:border-white/5 opacity-40">
                       <p className="font-serif italic text-xs">"The debris is the foundation of the manifest."</p>
                    </div>
                 </div>
              </section>

              {/* 11. PROVOCATION + CONTINUUM */}
              <footer className="min-h-[100dvh] flex flex-col items-center justify-center p-12 snap-start print:hidden text-center space-y-16">
                 <div className="space-y-6 max-w-2xl">
                    <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black" style={{ color: accentColor }}>Mimi's Provocation</span>
                    <p className="font-serif italic text-3xl md:text-6xl leading-tight text-balance">
                       "{metadata.content.poetic_provocation || "Where does this frequency lead?"}"
                    </p>
                 </div>

                 <div className="flex flex-col gap-6 w-full max-w-md">
                    <button 
                      onClick={handleContinuum}
                      className="w-full py-6 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.6em] font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
                      style={{ backgroundColor: accentColor }}
                    >
                       <ArrowDown size={16} /> Continuum
                    </button>
                    <p className="font-serif italic text-xs text-stone-400">Send logic & debris back to Studio to thread the narrative.</p>
                    
                    <button onClick={onReset} className="w-full py-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-sans text-[9px] uppercase tracking-widest font-black transition-all">
                       Purge & Return
                    </button>
                 </div>
              </footer>
          </div>

          {/* FIELD NOTES SIDEBAR */}
          <AnimatePresence>
            {showNotes && (
                <motion.aside 
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full md:w-[400px] border-l border-stone-200 dark:border-stone-800 bg-[#FDFBF7] dark:bg-stone-950 z-40 flex flex-col shadow-2xl absolute right-0 top-0 bottom-0"
                >
                    {/* Header */}
                    <div className="h-16 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                        <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-stone-900 dark:text-white">FIELD NOTE — 01</span>
                        <button onClick={() => setShowNotes(false)} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Metadata Strip */}
                    <div className="flex items-center gap-6 px-6 py-4 border-b border-stone-100 dark:border-stone-800 opacity-60 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">REF:</span>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-800 dark:text-stone-300">001.NOTE</span>
                        </div>
                        <div className="h-3 w-px bg-stone-300 dark:bg-stone-700" />
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">TONE:</span>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-800 dark:text-stone-300">{metadata.tone}</span>
                        </div>
                        <div className="h-3 w-px bg-stone-300 dark:bg-stone-700" />
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">DATE:</span>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-800 dark:text-stone-300">{new Date().toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="flex-1 relative bg-transparent">
                        {/* Margin Rule */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-red-900/10 dark:bg-red-500/10" />
                        
                        <textarea 
                            value={noteContent} 
                            onChange={(e) => setNoteContent(e.target.value)} 
                            placeholder="Annotation layer active..." 
                            className="w-full h-full bg-transparent p-8 pl-12 resize-none outline-none font-serif text-sm leading-relaxed text-stone-700 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-700"
                        />

                        {/* Voice Trigger (Bottom Right) */}
                        <div className="absolute bottom-6 right-6">
                            {isTranscribing && (
                                <div className="absolute right-full mr-4 bottom-1/2 translate-y-1/2 flex items-center gap-2 bg-white dark:bg-stone-800 px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                                    <Loader2 size={10} className="animate-spin text-emerald-500" />
                                    <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Parsing...</span>
                                </div>
                            )}
                            <button 
                                onClick={isRecording ? stopRecording : startRecording} 
                                className={`p-2 transition-all opacity-50 hover:opacity-100 ${isRecording ? 'text-red-500 animate-pulse' : 'text-stone-400 hover:text-stone-600 dark:hover:text-white'}`}
                            >
                                {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm shrink-0">
                        <span className="font-mono text-[8px] text-stone-300 uppercase tracking-widest">Auto-Saved</span>
                        <button 
                            onClick={handleSaveToPocket}
                            disabled={isSaved}
                            className={`flex items-center gap-2 font-sans text-[8px] uppercase tracking-[0.2em] font-black transition-all ${isSaved ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600 dark:hover:text-white'}`}
                        >
                            {isSaved ? <Check size={12} /> : <Bookmark size={12} />}
                            {isSaved ? 'Anchored' : 'Commit Note'}
                        </button>
                    </div>
                </motion.aside>
            )}
          </AnimatePresence>
      </div>

      {/* THE CONTROL DIAL */}
      <div className="fixed bottom-8 right-8 z-[5000] print:hidden">
         <AnimatePresence>
            {dialOpen && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-20 right-0 flex flex-col gap-3 items-end">
                  
                  {/* Actions Stack */}
                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 }}
                    onClick={() => setShowExport(true)} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Export</span>
                     <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-nous-text dark:hover:text-white transition-colors">
                        <Download size={18} />
                     </div>
                  </motion.button>

                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    onClick={() => setShowShare(true)} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Share</span>
                     <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-emerald-500 transition-colors">
                        <Share2 size={18} />
                     </div>
                  </motion.button>

                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.12 }}
                    onClick={() => { /* TODO: Implement folder selection modal */ }} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Refract to Pocket</span>
                     <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-emerald-500 transition-colors">
                        <FolderPlus size={18} />
                     </div>
                  </motion.button>

                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                    onClick={() => toggleZineStar(metadata.id)} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Favorite</span>
                     <div className={`w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-colors ${profile?.starredZineIds?.includes(metadata.id) ? 'text-amber-500' : 'text-stone-500 hover:text-amber-500'}`}>
                        <Star size={18} fill={profile?.starredZineIds?.includes(metadata.id) ? "currentColor" : "none"} />
                     </div>
                  </motion.button>

                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    onClick={handleSaveToPocket} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Archive</span>
                     <div className={`w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-colors ${isSaved ? 'text-emerald-500' : 'text-stone-500 hover:text-emerald-500'}`}>
                        {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                     </div>
                  </motion.button>

                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.22 }}
                    onClick={handleBroadcast} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Broadcast</span>
                     <div className={`w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-colors ${isBroadcasted ? 'text-emerald-500' : 'text-stone-500 hover:text-emerald-500'}`}>
                        {isBroadcasting ? <Loader2 size={18} className="animate-spin" /> : isBroadcasted ? <Check size={18} /> : <Radio size={18} />}
                     </div>
                  </motion.button>

                  {/* FIELD NOTES TOGGLE - OPENS SIDEBAR */}
                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                    onClick={() => setShowNotes(!showNotes)} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Field Notes</span>
                     <div className={`w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-colors ${showNotes ? 'text-indigo-500' : 'text-stone-500 hover:text-indigo-500'}`}>
                        <StickyNote size={18} />
                     </div>
                  </motion.button>

                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.28 }}
                    onClick={() => setShowComments(true)} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Discourse</span>
                     <div className={`w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-colors text-stone-500 hover:text-emerald-500`}>
                        <MessageSquareQuote size={18} />
                     </div>
                  </motion.button>

                  <motion.button 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    onClick={handleVoiceToggle} 
                    className="flex items-center gap-4 group"
                  >
                     <span className="bg-black/80 text-white px-2 py-1 rounded text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Play Audio</span>
                     <div className={`w-12 h-12 bg-white dark:bg-stone-800 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-colors ${isPlaying ? 'text-emerald-500' : 'text-stone-500 hover:text-emerald-500'}`} style={isPlaying ? { color: accentColor } : {}}>
                        {isVoiceLoading ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} /> : <Play size={18} />}
                     </div>
                  </motion.button>

               </motion.div>
            )}
         </AnimatePresence>

         <button 
            onClick={() => setDialOpen(!dialOpen)}
            className="w-16 h-16 bg-nous-text dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 relative"
            style={{ backgroundColor: dialOpen ? '#000' : accentColor }}
         >
            <motion.div animate={{ rotate: dialOpen ? 45 : 0 }}>
               <Plus size={24} />
            </motion.div>
         </button>
      </div>
    </div>
  );
};
