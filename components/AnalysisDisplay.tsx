
// @ts-nocheck
import React, { useEffect, useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ZineMetadata, PocketItem, LineageEntry } from '../types';
import { generateAudio, animateShardWithVeo, transcribeAudio } from '../services/geminiService';
import { subscribeToPocketItems, fetchLineageEntry, saveNarrativeThread, saveTask } from '../services/firebaseUtils';
import { Loader2, X, Volume2, Orbit, Eye, Target, Layers, Moon, Sparkles, Terminal, Quote, ArrowDown, Grid3X3, Printer, Bookmark, Check, Play, Pause, ExternalLink, Download, Share2, Star, FileText, Map, Compass, Zap, RefreshCw, PenTool, Save, Mic, Square, AlertCircle, StickyNote, History, MessageSquareQuote, Radar, Maximize2, Activity, Archive, FolderPlus, Compass as RoadmapIcon, Stars as CelestialIcon, ArrowRight, CornerDownRight, Image as ImageIcon, Film, MousePointer2, Briefcase, BookOpen, ChevronDown, Hash, Search, Menu, Plus, Radio, Heart, MessageSquare } from 'lucide-react';
import { ExecutionBlock } from './ExecutionBlock';
import { VisualLanguageReflection } from './VisualLanguageReflection';
import { Visualizer } from './Visualizer';
import { ExportChamber } from './ExportChamber';
import { SocialShareModal } from './SocialShareModal';
import { ZineComments } from './ZineComments';
import { ThreadGraph } from './ThreadGraph';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { hasAccess } from '../constants';
import { useRecorder } from '../hooks/useRecorder';

const THEMES = {
  'white editorial': { bg: '#FDFBF7', text: '#1C1917', accent: '#78716c', thread: '#E5E7EB', glow: 'transparent', surface: '#FFFFFF', border: '#F5F5F4', font: 'editorial' },
  'white brutalist': { bg: '#FFFFFF', text: '#000000', accent: '#0000FF', thread: '#000000', glow: 'transparent', surface: '#FFFFFF', border: '#000000', font: 'brutalist' },
  'white minimalist': { bg: '#FAFAFA', text: '#333333', accent: '#999999', thread: '#EEEEEE', glow: 'transparent', surface: '#FFFFFF', border: '#EEEEEE', font: 'minimalist' },
  'black editorial': { bg: '#050510', text: '#E0E7FF', accent: '#06B6D4', thread: '#1E1B4B', glow: '0 0 20px rgba(6, 182, 212, 0.8)', surface: '#020617', border: '#0F172A', font: 'editorial' },
  'black brutalist': { bg: '#000000', text: '#00FF00', accent: '#00FF00', thread: '#00FF00', glow: '0 0 20px rgba(0,255,0,0.8)', surface: '#000000', border: '#00FF00', font: 'brutalist' },
  'black minimalist': { bg: '#0A0A0A', text: '#E5E5E5', accent: '#A855F7', thread: '#262626', glow: '0 0 15px rgba(168, 85, 247, 0.4)', surface: '#0A0A0A', border: '#171717', font: 'minimalist' }
};

const ChromaticDial: React.FC<{ activeTheme: string, onChange: (theme: string) => void, accent: string, className?: string }> = ({ activeTheme, onChange, accent, className }) => {
 const themes = Object.keys(THEMES);
 const currentIndex = themes.indexOf(activeTheme);
 const [isFlipped, setIsFlipped] = React.useState(false);
 
 const handleRotate = () => {
    const availableThemes = themes.filter(t => t !== activeTheme);
    const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
    setIsFlipped(!isFlipped);
    onChange(randomTheme);
    window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'click' } }));
  };

 const rotation = currentIndex * 90;

 return (
 <div className={`flex items-center gap-4 print:hidden ${className || ''}`}>
 <span className="font-mono text-[8px] uppercase tracking-widest text-nous-subtle">Tune</span>
 <div 
 onClick={handleRotate}
 className="w-12 h-12 rounded-none border border-nous-border cursor-pointer relative flex items-center justify-center hover:scale-105 bg-white/5 backdrop-blur-md pointer-events-auto"
 style={{ 
 transform: `rotate(${rotation}deg) rotateY(${isFlipped ? 180 : 0}deg)`, 
 transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' 
 }}
 >
 {[...Array(12)].map((_, i) => (
 <div key={i} className="absolute w-[1px] h-1.5 bg-stone-400/40"style={{ transform: `rotate(${i * 30}deg) translateY(-20px)` }} />
 ))}
 <div className="absolute w-1.5 h-3 rounded-none"style={{ transform: `translateY(-14px)`, backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }} />
 <div className="w-3 h-3 rounded-none border border-nous-border/50"/>
 </div>
 <span className="font-mono text-[8px] uppercase tracking-widest"style={{ color: accent }}>{activeTheme}</span>
 </div>
 );
};

const SectionHeader: React.FC<{ label: string; icon: any; color?: string; style?: React.CSSProperties }> = ({ label, icon: Icon, color ="text-nous-subtle", style }) => (
 <div className="flex items-center gap-4 mb-12 print:mb-4 opacity-50 hover:opacity-100 transition-opacity duration-700">
 <div className={`p-2 bg-nous-base rounded-none ${!style ? color : ''}`} style={style ? { color: style.color } : {}}>
 <Icon size={14} />
 </div>
 <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-nous-subtle">{label}</span>
 <div className="h-px flex-1 bg-stone-200"/>
 </div>
);

export const AnalysisDisplay: React.FC<{ 
 metadata: ZineMetadata, 
 onReset: () => void, 
 onUpdateMetadata: (updatedMetadata: ZineMetadata) => void,
 onExtractTailorLogic?: (logic: any) => void
}> = ({ metadata, onReset, onUpdateMetadata, onExtractTailorLogic }) => {
 const { user, profile, activePersona, toggleZineStar } = useUser();
  const isOwner = user?.uid === metadata.userId;
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
 const [isSavingThread, setIsSavingThread] = useState(false);
 const [isThreadSaved, setIsThreadSaved] = useState(false);
 const [audioProgress, setAudioProgress] = useState(0);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
 const startTimeRef = useRef<number>(0);
 const durationRef = useRef<number>(0);
 const animationRef = useRef<number>(0);
 
 const updateProgress = () => {
 if (!audioCtxRef.current || durationRef.current === 0) return;
 const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
 const progress = Math.min(elapsed / durationRef.current, 1);
 setAudioProgress(progress);
 if (progress < 1) {
 animationRef.current = requestAnimationFrame(updateProgress);
 }
 };

 useEffect(() => {
 if (isPlaying) {
 animationRef.current = requestAnimationFrame(updateProgress);
 } else {
 cancelAnimationFrame(animationRef.current);
 }
 return () => cancelAnimationFrame(animationRef.current);
 }, [isPlaying]);
 
 const handleResonanceFlip = async () => {
 try {
 if (!showLineage) {
 const entry = await fetchLineageEntry(metadata.id);
 setLineageEntry(entry);
 }
 setShowLineage(!showLineage);
 } catch (e) {
 console.error("MIMI // Error in handleResonanceFlip:", e);
 }
 };
 
 const exportZine = async (format: 'pdf' | 'png') => {
 try {
 const element = document.getElementById('zine-content');
 if (!element) return;
 
 const displayTitle = metadata.content?.headlines?.[0] || metadata.title ||"Untitled";
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
 } catch (e) {
 console.error("MIMI // Error in exportZine:", e);
 }
 };
 
 // TAILOR INTEGRATION: Fetch styling from the active persona's draft
 const [activeTheme, setActiveTheme] = useState<string>('white editorial');
  
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setActiveTheme('black editorial');
    }
  }, []);
 const themeConfig = THEMES[activeTheme as keyof typeof THEMES] || THEMES['white editorial'];

 const tailor = activePersona?.tailorDraft || profile?.tailorDraft;
 const accentColor = tailor?.chromaticRegistry?.accentSignal || themeConfig.accent;
 const baseColor = themeConfig.bg;
 
 // Determine dominant font family based on Tailor intent
 const fontFamily = tailor?.typographyIntent?.styleDescription || 'Inter';
 const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}&display=swap`;
 const fontStyle = ''; // Inherit from root wrapper

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
 const { archiveManager } = await import('../services/archiveManager');
 const url = await archiveManager.uploadMedia(user.uid, base64, `zines/${metadata.id}/hero`);
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
 const { archiveManager } = await import('../services/archiveManager');
 const url = await archiveManager.uploadMedia(user.uid, base64, `zines/${metadata.id}/page_${pageIndex}`);
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
 const { archiveManager } = await import('../services/archiveManager');
 const url = await archiveManager.uploadMedia(user.uid, base64, `zines/${metadata.id}/hypothesis`);
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
 const base64 = await new Promise<string>((resolve, reject) => {
 reader.onload = () => resolve((reader.result as string).split(',')[1]);
 reader.onerror = reject;
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
 if (!hasAccess(profile?.plan, 'core')) {
 window.dispatchEvent(new CustomEvent('mimi:open_patron_modal'));
 return;
 }
 if (isPlaying) { 
 if (sourceRef.current) { try { sourceRef.current.stop(); } catch(e) {} }
 setIsPlaying(false); 
 setAudioProgress(0);
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
 
 const displayTitle = metadata.content?.headlines?.[0] || metadata.title ||"Untitled";
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
 source.onended = () => {
 setIsPlaying(false);
 setAudioProgress(0);
 };
 source.start(0);
 startTimeRef.current = audioCtxRef.current.currentTime;
 durationRef.current = audioBuffer.duration;
 sourceRef.current = source;
 setIsPlaying(true);
 } catch (e: any) {
 console.error("MIMI // Voice synthesis failed:", e);
 setIsPlaying(false);
 if (e.message?.includes('overloaded') || e.code === 'QUOTA_EXCEEDED') {
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { 
 message:"Oracle Overloaded. The frequency is too high.", 
 icon: <AlertCircle size={14} className="text-red-500"/> 
 } 
 }));
 }
 } finally { setIsVoiceLoading(false); }
 };

 const handleAnimateManifest = async () => {
 if (isAnimatingManifest) return;
 if (!hasAccess(profile?.plan, 'lab')) {
 window.dispatchEvent(new CustomEvent('mimi:open_patron_modal'));
 return;
 }
 setIsAnimatingManifest(true);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Manifesting Motion Refraction...", icon: <Film size={14} style={{ color: accentColor }} /> } }));
 try {
 const displayTitle = metadata.content?.headlines?.[0] || metadata.title ||"Untitled";
 const targetImage = metadata.coverImageUrl || metadata.content.pages?.[0]?.image_url;
 const res = await animateShardWithVeo(targetImage, displayTitle, '9:16');
 const { archiveManager } = await import('../services/archiveManager');
 await archiveManager.saveToPocket(user?.uid || 'ghost', 'video', { videoUrl: res, title: `${displayTitle} // Motion`, timestamp: Date.now() });
 } catch (e) {} finally { setIsAnimatingManifest(false); }
 };

 const handleSaveToPocket = async () => {
 if (isSaved) return;
 
 // Optimistic update
 setIsSaved(true);
 
 try {
 const displayTitle = metadata.content?.headlines?.[0] || metadata.title ||"Untitled";
 const { archiveManager } = await import('../services/archiveManager');
 await archiveManager.saveToPocket(user?.uid || 'ghost', 'zine_card', { 
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
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Manifest Anchored with Field Notes.", icon: <Bookmark size={14} style={{ color: accentColor }} /> } }));
 } catch (e) {
 // Revert on error
 setIsSaved(false);
 console.error("Failed to save to pocket", e);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Failed to anchor manifest.", icon: <AlertCircle size={14} className="text-red-500"/> } }));
 }
 };

 const handleSaveThread = async () => {
 if (isThreadSaved || isSavingThread || !user?.uid) return;
 
 setIsSavingThread(true);
 try {
 const displayTitle = metadata.content?.headlines?.[0] || metadata.title ||"Untitled Thread";
 const thread: NarrativeThread = {
 id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
 userId: user.uid,
 title: displayTitle,
 narrative: originalDebris,
 mode: 'influence', // Defaulting to influence for now, could be derived
 createdAt: Date.now(),
 updatedAt: Date.now()
 };
 await saveNarrativeThread(thread);
 setIsThreadSaved(true);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Thread Anchored.", icon: <Bookmark size={14} style={{ color: accentColor }} /> } }));
 } catch (e) {
 console.error("Failed to save thread", e);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Failed to anchor thread.", icon: <AlertCircle size={14} className="text-red-500"/> } }));
 } finally {
 setIsSavingThread(false);
 }
 };

 const handleBroadcast = async () => {
 if (isBroadcasted || isBroadcasting) return;
 setIsBroadcasting(true);
 window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'shimmer' } }));
 try {
 const { collection, addDoc } = await import('firebase/firestore');
 const { db } = await import('../services/firebase');
 
 const displayTitle = metadata.content?.headlines?.[0] || metadata.title ||"Untitled";
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
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Manifest Broadcasted to Proscenium.", icon: <Radio size={14} style={{ color: accentColor }} /> } }));
 } catch (e) {
 console.error("Broadcast failed", e);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Broadcast Failed.", type: 'error' } }));
 } finally {
 setIsBroadcasting(false);
 }
 };

 const handleContinuum = () => {
 // Pass provocation AND original artifacts as context to input
 const provocation = metadata.content.poetic_provocation;
 const displayTitle = metadata.content?.headlines?.[0] || metadata.title ||"Untitled";
 window.dispatchEvent(new CustomEvent('mimi:change_view', { 
 detail: 'studio', 
 detail_data: { 
 context: `Continuing thread from"${displayTitle}".\n\nPROVOCATION:"${provocation}"\n\nRESPONSE:`,
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

 useEffect(() => {
 document.body.style.overflow = 'hidden';
 return () => {
 document.body.style.overflow = '';
 };
 }, []);

 return (
 <>
 <link href={fontUrl} rel="stylesheet"/>
 <div 
 className="fixed inset-0 z-[9999] w-screen h-screen flex flex-col overflow-hidden transition-colors duration-1000 print:bg-white zine-theme-root"
 style={{ 
 fontFamily: `'${fontFamily}', sans-serif`,
 '--zine-bg': baseColor, 
 '--zine-text': themeConfig.text, 
 '--zine-accent': accentColor, 
 '--zine-thread': themeConfig.thread, 
 '--zine-glow': themeConfig.glow,
 '--zine-surface': themeConfig.surface,
 '--zine-border': themeConfig.border,
 backgroundColor: 'var(--zine-bg)',
 color: 'var(--zine-text)'
 } as React.CSSProperties}
 >
 <button 
 onClick={onReset} 
 className="fixed top-8 right-8 z-[10000] font-mono text-[10px] uppercase tracking-[0.2em] font-black text-nous-subtle hover:text-nous-text hover:text-nous-text transition-all bg-white/80 /80 backdrop-blur-md px-6 py-3 border border-nous-border /10 hover:scale-105 active:scale-95 shadow-lg"
 >
 [ X CLOSE ]
 </button>
 <style>{`
  .zine-theme-root section { background-color: transparent !important; }
  .zine-theme-root .bg-white, .zine-theme-root .dark\\:bg-\\[\\#0A0A0A\\], .zine-theme-root .dark\\:bg-nous-base { background-color: var(--zine-surface) !important; }
  .zine-theme-root .border-nous-border, .zine-theme-root .dark\\:border-nous-border, .zine-theme-root .dark\\:border-nous-border { border-color: var(--zine-border) !important; }
  .zine-theme-root .text-nous-text, .zine-theme-root .dark\\:text-nous-text, .zine-theme-root .text-nous-text { color: var(--zine-text) !important; }
  .zine-theme-root .bg-\\[\\#FDFBF7\\], .zine-theme-root .dark\\:bg-\\[\\#080808\\], .zine-theme-root .bg-\\[\\#FAFAFA\\] { background-color: var(--zine-bg) !important; }
  ${themeConfig.font === 'editorial' ? `
    .zine-theme-root .font-serif { font-family: '${fontFamily}', serif !important; }
  ` : themeConfig.font === 'brutalist' ? `
    .zine-theme-root .font-serif, .zine-theme-root .font-sans, .zine-theme-root p, .zine-theme-root h1, .zine-theme-root h2, .zine-theme-root h3, .zine-theme-root h4, .zine-theme-root span { font-family: 'JetBrains Mono', monospace !important; text-transform: uppercase !important; letter-spacing: -0.05em !important; }
  ` : `
    .zine-theme-root .font-serif, .zine-theme-root .font-sans, .zine-theme-root p, .zine-theme-root h1, .zine-theme-root h2, .zine-theme-root h3, .zine-theme-root h4, .zine-theme-root span { font-family: 'Inter', sans-serif !important; font-style: normal !important; letter-spacing: -0.02em !important; }
  `}
  `}</style>
 {/* PORTFOLIO BINDING STITCH & LATENT THREAD */}
 <div className="absolute left-8 top-0 bottom-0 w-8 z-[4000] pointer-events-none flex justify-center">
 {/* The physical stitch (dashed thread) */}
 <div 
 className="w-[2px] h-full transition-colors duration-1000 opacity-60"
 style={{ 
 backgroundImage: `repeating-linear-gradient(to bottom, ${themeConfig.thread} 0, ${themeConfig.thread} 16px, transparent 16px, transparent 32px)`,
 boxShadow: themeConfig.glow 
 }} 
 />
 {/* The fiber optic laser pulse */}
 <motion.div 
 key={activeTheme}
 initial={{ top: 0, height: '0%', opacity: 1 }}
 animate={{ top: '100%', height: '200px', opacity: 0 }}
 transition={{ duration: 1.5, ease:"circOut"}}
 className="absolute w-[4px] rounded-none"
 style={{ backgroundColor: accentColor, boxShadow: `0 0 30px 4px ${accentColor}` }}
 />
 
 {/* The Chromatic Dial positioned relative to the stitch */}
 <ChromaticDial 
 activeTheme={activeTheme} 
 onChange={(t) => setActiveTheme(t as any)} 
 accent={accentColor} 
 className="absolute bottom-8 left-full ml-4"
 />
 </div>

 <AnimatePresence>
 {showExport && <ExportChamber metadata={metadata} onClose={() => setShowExport(false)} />}
 {showShare && <SocialShareModal metadata={metadata} onClose={() => setShowShare(false)} />}
 {showComments && (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-nous-base/80 backdrop-blur-xl"
 >
 <ZineComments zineId={metadata.id} onClose={() => setShowComments(false)} />
 </motion.div>
 )}
 </AnimatePresence>

 {/* MAIN CONTENT LAYOUT - SPLIT WITH SIDEBAR */}
 <div className="flex flex-1 overflow-hidden relative">
 
 {/* THE SCROLLABLE ZINE CONTENT */}
 <div className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth print:overflow-visible print:snap-none">
 
 {/* 1. HEADLINES (TITLE/TONE) */}
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start border-b border-nous-border print:min-h-0 print:py-12 bg-nous-base">
 <div className="w-full space-y-16 px-6 md:px-24">
 <div className="flex items-center gap-4">
 <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-nous-subtle">Issue_0{Math.floor(Math.random() * 10)}</span>
 {metadata.isDeepThinking && <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-none text-amber-500 font-sans text-[7px] font-black uppercase tracking-widest"><Radar size={10} className="animate-pulse"/> Deep Refraction</div>}
 <button onClick={handleResonanceFlip} className="p-2 bg-nous-base rounded-none hover:bg-nous-base0 transition-colors">
 <Layers size={14} className="text-nous-subtle"/>
 </button>
 </div>
 <h1 className={`${fontStyle} text-7xl md:text-[11rem] tracking-tighter leading-[0.8] text-nous-text uppercase italic break-words hyphens-auto`}>
 {metadata.content?.headlines?.[0] || metadata.title}
 </h1>
 <div className="flex flex-col md:flex-row md:items-center gap-12 pt-12 border-t border-nous-border">
 <div className="flex flex-col gap-1">
 <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-nous-subtle">Tone</span>
 <span className="font-serif italic text-3xl"style={{ color: accentColor }}>{metadata.tone}</span>
 </div>
 <div className="hidden md:block h-12 w-px bg-stone-200"/>
 <div className="flex flex-col gap-1">
 <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-nous-subtle">Date</span>
 <span className="font-serif italic text-3xl">{new Date(metadata.timestamp).toLocaleDateString()}</span>
 </div>
 <div className="hidden md:block h-12 w-px bg-stone-200"/>
 <div className="flex flex-col gap-1">
 <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-nous-subtle">Author</span>
 <span className="font-serif italic text-3xl">@{metadata.userHandle}</span>
 </div>
 </div>
 </div>
 </section>

 {/* 2. SUMMARY (WITH VOCAL TRANSMISSION) */}
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg-nous-base print:min-h-0 print:py-12">
 <div className="w-full space-y-16 px-6 md:px-24">
 <SectionHeader label="Executive Summary"icon={Sparkles} style={{ color: accentColor }} />
 {isOwner && (
  <button onClick={() => setIsEditing(!isEditing)} className="text-[8px] uppercase tracking-widest font-black text-nous-subtle hover:text-nous-text transition-colors">
  {isEditing ? 'Cancel Edit' : 'Edit Summary'}
  </button>
 )}
 {isEditing ? (
 <div className="space-y-4">
 <textarea value={vocalSummary} onChange={e => setVocalSummary(e.target.value)} className="w-full p-4 bg-nous-base rounded-none"placeholder="Vocal Summary Blurb"/>
 <textarea value={poeticInterpretation} onChange={e => setPoeticInterpretation(e.target.value)} className="w-full p-4 bg-nous-base rounded-none"placeholder="Poetic Interpretation"/>
 <button onClick={handleSaveMetadata} className="px-4 py-2 bg-nous-base0 text-white rounded-none font-sans text-[8px] uppercase tracking-widest font-black">Save Changes</button>
 </div>
 ) : (
 <p className="font-serif italic text-3xl md:text-6xl text-nous-text leading-[1.1] md:leading-[1.1]">
"{vocalSummary || poeticInterpretation}"
 </p>
 )}
 </div>
 </section>

 {/* 3. HEADER IMAGE */}
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg-black overflow-hidden relative group print:min-h-0 print:py-12">
 <Visualizer prompt={metadata.content.hero_image_prompt || metadata.content?.headlines?.[0] || metadata.title} defaultAspectRatio="16:9"defaultImageSize={metadata.isHighFidelity ? '2K' : '1K'} isArtifact isLite={metadata.isLite} initialImage={metadata.coverImageUrl} artifacts={metadata.artifacts} treatmentId={metadata.treatmentId} onImageGenerated={handleHeroImageGenerated} />
 <div className="absolute bottom-12 left-12 p-4 bg-white/5 backdrop-blur-md rounded-none border border-white/10">
 <span className="font-mono text-[7px] text-white uppercase tracking-widest">FIG_01: PRIMARY_VISUAL</span>
 </div>
 </section>

 {/* 4. THE READING (ORACULAR MIRROR) */}
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg-nous-base print:min-h-0 print:py-12">
 <div className="w-full space-y-12 px-6 md:px-24">
 <SectionHeader label="Oracular Mirror"icon={Eye} style={{ color: accentColor }} />
 <p className="font-serif italic text-3xl md:text-5xl text-nous-text leading-tight">
"{metadata.content.oracular_mirror || metadata.content.the_reading ||"The mirror is silent."}"
 </p>
 </div>
 </section>

 {/* 5. STRATEGIC HYPOTHESIS (VISUALIZED) */}
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg-nous-base print:min-h-0 print:py-12">
 <div className="w-full space-y-12 px-6 md:px-24">
 <SectionHeader label="Strategic Hypothesis"icon={Target} style={{ color: accentColor }} />
 <div className="grid md:grid-cols-2 gap-12 items-center">
 <div className="aspect-square w-full relative border border-nous-border rounded-none overflow-hidden bg-nous-base">
 {/* Use Visualizer to render the hypothesis visually */}
 <Visualizer 
 prompt={`A high-contrast, moody, abstract, conceptual editorial photograph representing the concept:"${metadata.content.strategic_hypothesis}". Focus on deep shadows, dramatic lighting, and texture. No text, no typography. Cinematic, architectural.`} 
 defaultAspectRatio="1:1"
 defaultImageSize={metadata.isHighFidelity ? '2K' : '1K'}
 isArtifact 
 isLite={metadata.isLite} 
 delay={400}
 artifacts={metadata.artifacts?.length > 1 ? metadata.artifacts : undefined}
 treatmentId={metadata.treatmentId}
 initialImage={(metadata.content as any).hypothesis_image_url}
 onImageGenerated={handleHypothesisImageGenerated}
 />
 <div className="absolute bottom-4 right-4 bg-black/80 text-white px-2 py-1 text-[8px] font-mono rounded-none">FIG 2.1 — ABSTRACT</div>
 </div>
 <div className="p-8 md:p-12 border-l-4"style={{ borderColor: `${accentColor}30` }}>
 <p className="font-serif italic text-2xl md:text-4xl leading-relaxed text-nous-text">
 {metadata.content.strategic_hypothesis}
 </p>
 <div className="mt-8 flex items-center gap-4 text-nous-subtle">
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
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg-nous-base print:min-h-0 print:py-12">
 <div className="w-full space-y-16 px-6 md:px-24">
 <SectionHeader label="Semiotics & Visual Directives"icon={Radar} style={{ color: accentColor }} />
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {metadata.content.semiotic_signals?.map((t, i) => {
 const Icon = t.type === 'acquisition' ? Briefcase : t.type === 'lexical' ? BookOpen : Sparkles;
 const label = t.type === 'acquisition' ? 'Buy this' : t.type === 'lexical' ? 'Add to Lexicon' : 'Imagine this';
 
 return (
 <div key={i} className="group relative p-8 bg-white border border-nous-border rounded-none hover: transition-all flex flex-col justify-between min-h-[300px] hover:border-transparent"style={{ '--hover-accent': accentColor } as React.CSSProperties}>
 <div className="absolute top-4 right-4 opacity-30 font-mono text-[9px]">SIG_0{i+1}</div>
 
 <div className="space-y-4">
 <div className="flex items-center gap-2 mb-2">
 <Icon size={12} className="text-nous-subtle group-hover:text-[var(--hover-accent)] transition-colors"/>
 <span className="font-sans text-[7px] uppercase tracking-widest font-black text-nous-subtle">{label}</span>
 </div>
 <h4 className="font-serif text-3xl italic tracking-tighter text-nous-text  group-hover:text-[var(--hover-accent)] transition-colors">
 {t.motif}
 </h4>
 <p className="font-serif italic text-sm text-nous-subtle leading-relaxed border-l-2 border-nous-border pl-4">
 {t.context}
 </p>
 {t.visual_directive && (
 <div className="mt-4 pt-4 border-t border-nous-border">
 <span className="font-sans text-[7px] uppercase tracking-widest font-black text-nous-subtle block mb-2">Directive</span>
 <p className="font-mono text-[9px] text-nous-subtle">{t.visual_directive}</p>
 </div>
 )}
 
 {/* SOVEREIGN AD TARGETING LOGIC */}
 {(t.semantic_trigger || t.targeting_rationale) && (
 <div className="mt-4 pt-4 border-t border-nous-border">
 <div className="flex items-center gap-2 mb-2">
 <Target size={10} className="text-nous-subtle"/>
 <span className="font-sans text-[7px] uppercase tracking-widest font-black text-nous-subtle">Targeting Rationale</span>
 </div>
 {t.semantic_trigger && (
 <div className="mb-2">
 <span className="font-mono text-[8px] text-nous-subtle">Trigger: </span>
 <span className="font-mono text-[9px] text-[var(--hover-accent)] bg-[var(--hover-accent)]/10 px-1 py-0.5 rounded-none">{t.semantic_trigger}</span>
 </div>
 )}
 {t.targeting_rationale && (
 <p className="font-sans text-[10px] text-nous-subtle leading-relaxed">
 {t.targeting_rationale}
 </p>
 )}
 </div>
 )}
 </div>

 <div className="pt-8 flex justify-between items-end">
 <div className="flex gap-4">
 <button
 onClick={() => handleScrySignal(t.motif + (t.visual_directive ?""+ t.visual_directive :""))} 
 className="flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle hover:text-[var(--hover-accent)] transition-colors border-b border-transparent hover:border-current pb-0.5"
 >
 <Search size={10} /> Scry Signal
 </button>
 {t.type === 'acquisition' && t.link && (
 <a 
 href={t.link} 
 target="_blank"
 className="flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle hover:text-nous-subtle transition-colors border-b border-transparent hover:border-current pb-0.5"
 >
 <Briefcase size={10} /> Grounding
 </a>
 )}
 </div>
 <a 
 href={`https://www.google.com/search?q=${encodeURIComponent(t.motif +"aesthetic meaning")}`} 
 target="_blank"
 className="text-nous-subtle hover:text-[var(--hover-accent)] transition-colors"
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
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg text-white print:min-h-0 print:py-12">
 <div className="w-full space-y-12 px-6 md:px-24">
 <SectionHeader label="Celestial Calibration"icon={Moon} color="text-white"/>
 <div className="flex flex-col items-center text-center space-y-12">
 <div className="p-8 rounded-none border border-white/10 bg-white/5 animate-pulse-slow">
 <CelestialIcon size={48} style={{ color: accentColor }} />
 </div>
 <p className="font-mono text-xl md:text-3xl text-nous-text uppercase tracking-widest leading-relaxed max-w-2xl border-l-2 pl-8 text-left"style={{ borderColor: accentColor }}>
 {metadata.content.celestial_calibration}
 </p>
 </div>
 </div>
 </section>

 {/* 8. VISUAL PLATES - REDESIGNED AS EDITORIAL SPREADS */}
 <div className="bg-white py-32 space-y-32">
 <div className="px-6 md:px-24 w-full">
 <SectionHeader label="Visual Plates"icon={Grid3X3} style={{ color: accentColor }} />
 </div>
 
 {metadata.content.pages?.map((page, i) => {
 const isEven = i % 2 === 0;
 return (
 <section key={i} className="min-h-[100dvh] flex flex-col justify-center snap-start w-full">
 <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-stretch h-[100dvh]`}>
 
 {/* VISUAL COMPONENT */}
 <div className="w-full md:w-1/2 relative group h-[50dvh] md:h-full">
 <div className="relative w-full h-full bg-nous-base overflow-hidden">
 <Visualizer 
 prompt={page.imagePrompt} 
 defaultAspectRatio="3:4"
 defaultImageSize={metadata.isHighFidelity ? '2K' : '1K'}
 isArtifact 
 isLite={metadata.isLite} 
 initialImage={page.image_url} 
 delay={800 + (i * 1200)}
 artifacts={metadata.artifacts?.length > 1 ? metadata.artifacts : undefined}
 treatmentId={metadata.treatmentId}
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
 <div className="flex items-center gap-4 text-nous-subtle">
 <span className="font-serif italic text-4xl text-nous-text">{i+1}.</span>
 <div className="h-px flex-1 bg-nous-base"/>
 </div>
 <h3 className={`${fontStyle} text-5xl md:text-7xl italic tracking-tighter leading-[0.9] text-nous-text text-nous-text`}>
 {page.headline}
 </h3>
 <div className="pl-6 border-l"style={{ borderColor: `${accentColor}40` }}>
 <p className="font-serif italic text-lg md:text-xl text-nous-subtle leading-relaxed text-balance">
 {page.bodyCopy}
 </p>
 {page.supportingText && (i >= metadata.content.pages.length - 3) && (
 <p className="mt-4 font-mono text-xs text-nous-subtle 0 uppercase tracking-widest">
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
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg text-white print:min-h-0 print:py-12 relative overflow-hidden">
 {/* TECHNICAL GRID BACKGROUND */}
 <div className="absolute inset-0 opacity-10 pointer-events-none"
 style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
 />
 
 <div className="w-full space-y-16 relative z-10 px-6 md:px-24">
 <SectionHeader label="Authority Roadmap"icon={RoadmapIcon} color="text-white"/>
 <div className="border border-nous-border bg/90 p-12 relative">
 {/* CAD MARKERS */}
 <div className="absolute top-0 left-0 p-2 border-r border-b border-nous-border"><span className="font-mono text-[8px] text-nous-subtle">TL_REF_01</span></div>
 <div className="absolute bottom-0 right-0 p-2 border-l border-t border-nous-border"><span className="font-mono text-[8px] text-nous-subtle">BR_REF_04</span></div>
 
 <div className="grid md:grid-cols-2 gap-16">
 {metadata.content.roadmap ? (
 <>
 <div className="space-y-4 group">
 <div className="flex items-center gap-4 border-b border-nous-border pb-2">
 <span className="font-mono text-xs"style={{ color: accentColor }}>01</span>
 <span className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle group-hover:text-nous-text transition-colors">Strategic Thesis</span>
 </div>
 <p className="font-mono text-sm text-nous-subtle leading-relaxed pl-8 border-l border-white/5 transition-colors">
 {metadata.content.roadmap.strategicThesis}
 </p>
 </div>
 <div className="space-y-4 group">
 <div className="flex items-center gap-4 border-b border-nous-border pb-2">
 <span className="font-mono text-xs"style={{ color: accentColor }}>02</span>
 <span className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle group-hover:text-nous-text transition-colors">Positioning Axis</span>
 </div>
 <p className="font-mono text-sm text-nous-subtle leading-relaxed pl-8 border-l border-white/5 transition-colors">
 {metadata.content.roadmap.positioningAxis}
 </p>
 </div>
 <div className="col-span-1 md:col-span-2 space-y-4 group">
 <div className="flex items-center gap-4 border-b border-nous-border pb-2">
 <span className="font-mono text-xs"style={{ color: accentColor }}>03</span>
 <span className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle group-hover:text-nous-text transition-colors">Authority Anchor</span>
 </div>
 <div className="grid md:grid-cols-3 gap-8 pl-8 border-l border-white/5">
 <div>
 <span className="font-mono text-[8px] text-nous-subtle uppercase block mb-2">Core Claim</span>
 <p className="font-mono text-sm text-nous-subtle">{metadata.content.roadmap.authorityAnchor?.coreClaim}</p>
 </div>
 <div>
 <span className="font-mono text-[8px] text-nous-subtle uppercase block mb-2">Repetition Vector</span>
 <p className="font-mono text-sm text-nous-subtle">{metadata.content.roadmap.authorityAnchor?.repetitionVector}</p>
 </div>
 <div>
 <span className="font-mono text-[8px] text-nous-subtle uppercase block mb-2">Exclusion Principle</span>
 <p className="font-mono text-sm text-nous-subtle">{metadata.content.roadmap.authorityAnchor?.exclusionPrinciple}</p>
 </div>
 </div>
 </div>
 
 {metadata.content.roadmap.phases && metadata.content.roadmap.phases.length > 0 && (
 <div className="col-span-1 md:col-span-2 space-y-4 group mt-8">
 <div className="flex items-center gap-4 border-b border-nous-border pb-2">
 <span className="font-mono text-xs"style={{ color: accentColor }}>04</span>
 <span className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle group-hover:text-nous-text transition-colors">Authority Phases</span>
 </div>
 <div className="grid md:grid-cols-2 gap-8 pl-8 border-l border-white/5">
 {metadata.content.roadmap.phases.map((phase, idx) => (
 <div key={idx} className="space-y-2 border border-nous-border/50 p-4 bg-nous-base/20">
 <span className="font-mono text-[10px] text-nous-subtle uppercase tracking-widest block mb-1">Phase: {phase.type}</span>
 <p className="font-mono text-sm text-nous-subtle"><strong>Objective:</strong> {phase.objective}</p>
 <p className="font-mono text-sm text-nous-subtle"><strong>Move:</strong> {phase.strategicMove}</p>
 <p className="font-mono text-xs text-nous-subtle mt-2"><strong>Risk:</strong> {phase.riskToIntegrity}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 
 {metadata.content.roadmap.driftForecast && (
 <div className="col-span-1 md:col-span-2 space-y-4 group mt-8">
 <div className="flex items-center gap-4 border-b border-nous-border pb-2">
 <span className="font-mono text-xs"style={{ color: accentColor }}>05</span>
 <span className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle group-hover:text-nous-text transition-colors">Drift Forecast</span>
 </div>
 <div className="grid md:grid-cols-2 gap-8 pl-8 border-l border-white/5">
 <div>
 <span className="font-mono text-[8px] text-nous-subtle uppercase block mb-1">Predicted Shift</span>
 <p className="font-mono text-sm text-nous-subtle">{metadata.content.roadmap.driftForecast.predictedClusterShift}</p>
 </div>
 <div>
 <span className="font-mono text-[8px] text-nous-subtle uppercase block mb-1">Refusal Point</span>
 <p className="font-mono text-sm text-nous-subtle">{metadata.content.roadmap.driftForecast.refusalPoint}</p>
 </div>
 </div>
 </div>
 )}
 </>
 ) : metadata.content.blueprint ? Object.entries(metadata.content.blueprint).map(([key, val], i) => (
 <div key={i} className="space-y-4 group">
 <div className="flex items-center gap-4 border-b border-nous-border pb-2">
 <span className="font-mono text-xs"style={{ color: accentColor }}>0{i+1}</span>
 <span className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle group-hover:text-nous-text transition-colors">{key.replace('_', ' ')}</span>
 </div>
 <p className="font-mono text-sm text-nous-subtle leading-relaxed pl-8 border-l border-white/5 transition-colors"style={{ '--hover-color': accentColor } as React.CSSProperties}>
 {String(val)}
 </p>
 </div>
 )) : (
 <div className="col-span-2 space-y-4">
 <div className="flex items-center gap-4 border-b border-nous-border pb-2">
 <span className="font-mono text-xs"style={{ color: accentColor }}>01</span>
 <span className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle">Roadmap</span>
 </div>
 <p className="font-mono text-sm text-nous-subtle leading-relaxed pl-8 border-l border-white/5">
 {metadata.content.the_roadmap ||"No architectural blueprint detected."}
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 </section>

 {/* 10. SIGNAL FEED (The Cultural Air) */}
 {metadata.transmissionsUsed && metadata.transmissionsUsed.length > 0 && (
 <section className="min-h-[100dvh] flex flex-col justify-center px-6 md:px-24 snap-start bg-nous-base text-nous-text text-nous-text print:min-h-0 print:py-12">
 <div className="max-w-4xl w-full space-y-16">
 <SectionHeader label="Signal Feed"icon={Radio} style={{ color: accentColor }} />
 <div className="space-y-8">
 <p className="font-serif italic text-2xl text-nous-subtle leading-relaxed">
"The manifest does not exist in a vacuum. It is a refraction of the collective frequency."
 </p>
 <div className="grid gap-6">
 {metadata.transmissionsUsed.map((t, idx) => (
 <div key={idx} className="flex items-start gap-4 p-4 border border-nous-border rounded-none bg-nous-base/50 /30">
 <div className="w-8 h-8 rounded-none bg-stone-200 flex items-center justify-center shrink-0">
 <Radio size={14} className="text-nous-subtle"/>
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle">@{t.userHandle}</span>
 <span className="font-mono text-[8px] text-nous-subtle">{new Date(t.timestamp).toLocaleTimeString()}</span>
 </div>
 <p className="font-serif italic text-sm text-nous-subtle leading-relaxed">
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

 {/* 10. NARRATIVE THREAD (RAW INPUT + ANALYSIS + THUMBNAILS) */}
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg-nous-base  text-nous-text text-nous-text print:min-h-0 print:py-12">
 <div className="w-full space-y-16 px-6 md:px-24">
 <SectionHeader label="Narrative Thread"icon={History} style={{ color: accentColor }} />
 {originalDebris ? (
 <div className="space-y-12">
 <div className="space-y-8 pl-8 md:pl-12 border-l-4 border-nous-border">
 <div className="font-mono text-[10px] text-nous-subtle mb-4 uppercase tracking-widest">
 // RAW_INPUT_LOG_{metadata.id.slice(-4)}
 </div>
 <p className="font-mono text-lg md:text-2xl text-nous-subtle leading-relaxed whitespace-pre-wrap tracking-tight">
"{originalDebris}"
 </p>
 
 {/* THUMBNAIL DISPLAY */}
 {metadata.artifacts && metadata.artifacts.length > 0 && (
 <div className="flex flex-wrap gap-4 pt-8 border-t border-nous-border">
 {metadata.artifacts.map((art, idx) => (
 <div key={idx} className="relative w-24 h-24 border border-nous-border bg-white rounded-none overflow-hidden hover:scale-105 transition-transform">
 {art.type === 'image' ? (
 <img src={art.url || `data:${art.mimeType};base64,${art.data}`} className="w-full h-full object-cover"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center text-nous-subtle">
 <Volume2 size={24} />
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* ANALYSIS GRAPH */}
 <div className="pt-8">
 <ThreadGraph metadata={metadata} accentColor={accentColor} />
 <div className="mt-8 flex justify-center">
 <button 
 onClick={handleSaveThread} 
 disabled={isThreadSaved || isSavingThread}
 className="font-mono text-[10px] uppercase tracking-[0.2em] font-black text-nous-subtle hover:text-nous-text transition-colors bg-black/50 backdrop-blur-md px-6 py-3 border border-white/10 flex items-center gap-2"
 >
 {isSavingThread ? <Loader2 size={12} className="animate-spin"/> : isThreadSaved ? <Check size={12} /> : <History size={12} />}
 [ {isThreadSaved ? 'APPENDED TO THREAD' : '+ APPEND TO THREAD'} ]
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div className="opacity-30 text-center py-12 border-2 border-dashed border-nous-border rounded-none">
 <p className="font-serif italic text-xl">Debris data lost in transit.</p>
 </div>
 )}
 <div className="pt-12 border-t border-nous-border /5 opacity-40">
 <p className="font-serif italic text-xs">"The debris is the foundation of the manifest."</p>
 </div>
 </div>
 </section>

 {/* 10.5 EXECUTION LAYER */}
 {metadata.executionLayer && (
 <section className="min-h-[100dvh] flex flex-col justify-center snap-start bg-nous-base text-nous-text print:min-h-0 print:py-12">
 <div className="w-full px-6 md:px-24">
 <ExecutionBlock layer={metadata.executionLayer} />
 </div>
 </section>
 )}

 {/* 11. PROVOCATION + CONTINUUM */}
 <footer className="min-h-[100dvh] flex flex-col items-center justify-center p-12 snap-start print:hidden text-center space-y-16">
 <div className="space-y-6 w-full px-6 md:px-24">
 <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black"style={{ color: accentColor }}>Mimi's Provocation</span>
 <p className="font-serif italic text-3xl md:text-6xl leading-tight text-balance">
"{metadata.content.poetic_provocation ||"Where does this frequency lead?"}"
 </p>
 </div>

 <div className="flex flex-col gap-6 w-full max-w-md">
 <button onClick={onReset} className="w-full py-4 text-nous-subtle hover:text-nous-subtle font-sans text-[9px] uppercase tracking-widest font-black transition-all">
 Purge & Return
 </button>
 </div>
 </footer>
 </div>

 {/* FIELD NOTES SIDEBAR */}
 <AnimatePresence>
 {showNotes && (
 <motion.aside 
 initial={{ x:"100%"}}
 animate={{ x: 0 }}
 exit={{ x:"100%"}}
 transition={{ type:"spring", stiffness: 300, damping: 30 }}
 className="w-full md:w-[400px] border-l border-nous-border bg-white z-40 flex flex-col absolute right-0 top-0 bottom-0"
 >
 {/* Header */}
 <div className="h-16 border-b border-nous-border flex items-center justify-between px-6 shrink-0 bg-white/50 /20 backdrop-blur-sm">
 <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-nous-text text-nous-text">FIELD NOTE — 01</span>
 <button onClick={() => setShowNotes(false)} className="p-2 text-nous-subtle hover:text-nous-subtle hover:text-nous-text transition-colors">
 <X size={16} />
 </button>
 </div>

 {/* Metadata Strip */}
 <div className="flex items-center gap-6 px-6 py-4 border-b border-nous-border opacity-60 shrink-0">
 <div className="flex items-center gap-2">
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-subtle">REF:</span>
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-text">001.NOTE</span>
 </div>
 <div className="h-3 w-px bg-stone-300 dark:bg-stone-700"/>
 <div className="flex items-center gap-2">
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-subtle">TONE:</span>
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-text">{metadata.tone}</span>
 </div>
 <div className="h-3 w-px bg-stone-300 dark:bg-stone-700"/>
 <div className="flex items-center gap-2">
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-subtle">DATE:</span>
 <span className="font-mono text-[9px] uppercase tracking-widest text-nous-text">{new Date().toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
 </div>
 </div>

 {/* Input Area */}
 <div className="flex-1 relative bg-transparent">
 {/* Margin Rule */}
 <div className="absolute left-8 top-0 bottom-0 w-px bg-red-900/10 dark:bg-red-500/10"/>
 
 <textarea 
 value={noteContent} 
 onChange={(e) => setNoteContent(e.target.value)} 
 placeholder="Annotation layer active..."
 className="w-full h-full bg-transparent p-8 pl-12 resize-none outline-none font-serif text-sm leading-relaxed text-nous-subtle placeholder:text-nous-subtle dark:placeholder:text-nous-subtle"
 />

 {/* Voice Trigger (Bottom Right) */}
 <div className="absolute bottom-6 right-6">
 {isTranscribing && (
 <div className="absolute right-full mr-4 bottom-1/2 translate-y-1/2 flex items-center gap-2 bg-white px-3 py-1 rounded-none whitespace-nowrap">
 <Loader2 size={10} className="animate-spin text-nous-subtle"/>
 <span className="font-sans text-[7px] uppercase tracking-widest font-black text-nous-subtle">Parsing...</span>
 </div>
 )}
 <button 
 onClick={isRecording ? stopRecording : startRecording} 
 className={`p-2 transition-all opacity-50 hover:opacity-100 ${isRecording ? 'text-red-500 animate-pulse' : 'text-nous-subtle hover:text-nous-subtle hover:text-nous-text'}`}
 >
 {isRecording ? <Square size={14} fill="currentColor"/> : <Mic size={14} />}
 </button>
 </div>
 </div>

 {/* Footer Actions */}
 <div className="p-6 border-t border-nous-border flex justify-between items-center bg-white/50 /20 backdrop-blur-sm shrink-0">
 <span className="font-mono text-[8px] text-nous-subtle uppercase tracking-widest">Auto-Saved</span>
 <button 
 onClick={handleSaveToPocket}
 disabled={isSaved}
 className={`flex items-center gap-2 font-sans text-[8px] uppercase tracking-[0.2em] font-black transition-all ${isSaved ? 'text-nous-subtle' : 'text-nous-subtle hover:text-nous-subtle hover:text-nous-text'}`}
 >
 {isSaved ? <Check size={12} /> : <Bookmark size={12} />}
 {isSaved ? 'Anchored' : 'Commit Note'}
 </button>
 </div>
 </motion.aside>
 )}
 </AnimatePresence>
 </div>

 {/* MINIMALIST FOOTER */}
  <motion.div 
    initial={false}
    animate={{ y: isToolbarCollapsed ? 100 : 0, opacity: isToolbarCollapsed ? 0 : 1 }}
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-8 px-10 py-4 bg-white/90 /90 backdrop-blur-xl border border-nous-border /10 text-nous-subtle text-nous-text/70 font-mono text-[10px] uppercase tracking-[0.2em] print:hidden shadow-2xl rounded-none"
  >
    <span className="text-nous-subtle text-nous-text/50">RESONANCE: 98%</span>
    <div className="w-px h-4 bg-stone-200 /20"/>
    
    <div className="flex items-center gap-3 group cursor-pointer" onClick={handleVoiceToggle}>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-nous-border /20 group-hover:border-nous-border dark:group-hover:border-white/50 transition-colors">
        {isVoiceLoading ? (
          <Loader2 size={12} className="animate-spin text-nous-subtle text-nous-text/70"/>
        ) : isPlaying ? (
          <Pause size={10} className="text-nous-subtle text-nous-text/70 group-hover:text-nous-text dark:group-hover:text-nous-text"/>
        ) : (
          <Play size={10} className="text-nous-subtle text-nous-text/70 group-hover:text-nous-text dark:group-hover:text-nous-text ml-0.5"/>
        )}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="94.2" strokeDashoffset={94.2 - (audioProgress * 94.2)} className="text-nous-text text-nous-text transition-all duration-100"/>
        </svg>
      </div>
      <span className="group-hover:text-nous-text dark:group-hover:text-nous-text transition-colors">[ THE DIAL ]</span>
    </div>

    <div className="w-px h-4 bg-stone-200 /20"/>
    <button onClick={() => setShowNotes(!showNotes)} className={`${showNotes ? 'text-nous-text text-nous-text' : 'hover:text-nous-text hover:text-nous-text'} transition-colors`}>
      [ FIELD NOTES ]
    </button>
    <div className="w-px h-4 bg-stone-200 /20"/>
    <button onClick={() => setShowExport(true)} className="hover:text-nous-text hover:text-nous-text transition-colors">
      [ EXTRACT ARTIFACT ]
    </button>
    <div className="w-px h-4 bg-stone-200 /20"/>
    <button onClick={handleSaveToPocket} className={`${isSaved ? 'text-red-500' : 'hover:text-red-500'} transition-colors flex items-center gap-2`}>
      [ {isSaved ? <Heart className="fill-current" size={12} /> : <Heart size={12} />} SAVE ]
    </button>
    <div className="w-px h-4 bg-stone-200 /20"/>
    <button onClick={() => setShowComments(true)} className="hover:text-nous-text hover:text-nous-text transition-colors flex items-center gap-2">
      [ <MessageSquare size={12} /> DISCUSS ]
    </button>
    <div className="w-px h-4 bg-stone-200 /20"/>
    <button onClick={() => setIsToolbarCollapsed(true)} className="hover:text-nous-text hover:text-nous-text transition-colors flex items-center gap-2">
      [ <ChevronDown size={12} /> HIDE ]
    </button>
  </motion.div>

  <AnimatePresence>
    {isToolbarCollapsed && (
      <motion.button
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={() => setIsToolbarCollapsed(false)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-6 py-3 bg-white/90 /90 backdrop-blur-xl border border-nous-border /10 text-nous-subtle text-nous-text/70 font-mono text-[10px] uppercase tracking-[0.2em] print:hidden shadow-2xl rounded-none hover:text-nous-text transition-colors"
      >
        [ SHOW TOOLBAR ]
      </motion.button>
    )}
  </AnimatePresence>
  </div>
 </>
 );
};
