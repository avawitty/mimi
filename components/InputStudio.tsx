import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaFile, ToneTag, PocketItem, ZineGenerationOptions } from '../types';
import { useRecorder } from '../hooks/useRecorder';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { Plus, BrainCircuit, X, Globe, MapPin, Mic, Loader2, Square, Check, Radio, Mail, Info, Sparkles, AlertCircle, Eraser, Zap, Image as ImageIcon, Link as LinkIcon, Twitter, Instagram, Shield, Users, ArrowUpRight, FolderOpen, Paperclip, ChevronLeft, ChevronRight, GripVertical, FileText, Filter, Wand2, ChevronDown, Scissors, ShoppingBag, FolderPlus, Radar, Trash2 } from 'lucide-react';
import { transcribeAudio, generateTagsFromMedia, analyzeImageAesthetic, generateZineTitle, analyzeAudio, applyAestheticRefraction, generateAutoAwesomePrompt, analyzeAestheticDelta } from '../services/geminiService';
import { PromptOrchestrator } from './PromptOrchestrator';
import { TheThimble } from './TheThimble';
import { DeltaVerdictCard } from './DeltaVerdictCard';
import { ZineConfiguration } from './ZineConfiguration';
import { TagGenerator } from './TagGenerator';
import { ZineInspoCarousel } from './ZineInspoCarousel';
import { SUPERINTELLIGENCE_PROMPTS } from '../constants';
import { CuratorNote } from './CuratorNote';
import { useUser } from '../contexts/UserContext';
import { createMoodboard } from '../services/firebase';
import { LegalOverlay } from './LegalOverlay';
import { GlossaryTooltip } from './GlossaryTooltip';

const CATEGORIES: Record<string, ToneTag[]> = {
 STYLE: ['CONTENT', 'editorial', 'dream', 'unhinged', 'research'],
 SOURCE: ['SHADOW', 'SIGNAL', 'ECHO'],
 FORMAT: ['MANIFESTO', 'SHARD', 'DOSSIER', 'PROMPT'],
 ALCHEMY: ['RAW', 'VINTAGE', 'CONTRARY']
};

const GUIDED_PROMPTS: Record<string, string> = {
 CONTENT:"DEFINE THE ASSIGNMENT. SPECIFY THE DIRECTIVES. OUTLINE THE OUTPUT.",
 editorial:"IDENTIFY YOUR VISUAL ANCHOR. DEFINE THE COMPOSITION. SET THE TYPOGRAPHIC WEIGHT.",
 dream:"TRIGGER THE MEMORY. LAYER THE ATMOSPHERE. CAPTURE THE RESONANCE.",
 unhinged:"CALIBRATE THE CHAOS. DISTORT THE VISION. INJECT THE NON-SEQUITUR.",
 research:"STATE THE CORE INQUIRY. TARGET THE SOURCES. CHOOSE THE SYNTHESIS.",
};

const DEFAULT_PROMPTS = [
"MAP THE LATENT SPACE.",
"DECONSTRUCT A MEMORY.",
"ARCHIVE THE EPHEMERAL.",
"SYNTHESIZE A NEW MATERIALITY.",
"PROVOKE A SHIFT IN PERSPECTIVE.",
"TRACE THE LINEAGE OF AN IDEA.",
"MANIFEST A VIRTUAL ARTIFACT."
];

const DEFAULT_STARTERS = [
"It started with the texture of...",
"The light caught the edge of...",
"I am haunted by the image of...",
"A sudden realization about...",
"The specific mood of...",
"Fragments of a conversation regarding...",
"The architecture of..."
];

const PROVOCATIONS = [
"What is the texture of the silence here?",
"Deconstruct the primary anchor.",
"Introduce a brutalist contradiction.",
"Consider the artifact as a ruin.",
"Bleed the colors into the semantic layer.",
"Obscure the obvious.",
"What if the subject is actually the background?",
"Elevate the mundane to the mythological.",
"Find the tension between the organic and the synthetic.",
"Let the negative space dictate the narrative."
];

export const InputStudio: React.FC<{
 onRefine: any, 
 isThinking: boolean, 
 initialValue?: string,
 initialMedia?: MediaFile[],
 continuumContext?: any,
 zineOptions: ZineGenerationOptions,
 setZineOptions: (options: ZineGenerationOptions) => void,
 initialHighFidelity?: boolean
}> = ({ onRefine, isThinking, initialValue, initialMedia, continuumContext, initialHighFidelity, zineOptions, setZineOptions }) => {
 const { systemStatus, user: currentUser, updateProfile, profile, activeThread, setActiveThread } = useUser();
 const { logEvent } = useTasteLogging();
 
 // Initialize with a value if none provided
 const [input, setInput] = useState(() => {
 if (initialValue) return initialValue;
 const savedDraft = localStorage.getItem('mimi_draft_input');
 if (savedDraft) return savedDraft;
 return DEFAULT_STARTERS[Math.floor(Math.random() * DEFAULT_STARTERS.length)] || '';
 });
 const [title, setTitle] = useState(() => {
 const savedTitle = localStorage.getItem('mimi_draft_title');
 return savedTitle || '';
 });
 const [provocationIndex, setProvocationIndex] = useState(0);

 // Autosave draft
 useEffect(() => {
 const timeoutId = setTimeout(() => {
 if (input && !DEFAULT_STARTERS.includes(input)) {
 localStorage.setItem('mimi_draft_input', input);
 }
 if (title) {
 localStorage.setItem('mimi_draft_title', title);
 }
 }, 1000);
 return () => clearTimeout(timeoutId);
 }, [input, title]);

 useEffect(() => {
 const interval = setInterval(() => {
 setProvocationIndex((prev) => (prev + 1) % PROVOCATIONS.length);
 }, 15000);
 return () => clearInterval(interval);
 }, []);

 const handleAutoGenerateTitle = async () => {
 if (!input) return;
 try {
 const generatedTitle = await generateZineTitle(input);
 setTitle(generatedTitle);
 } catch (e) {
 console.error("MIMI // Failed to generate title:", e);
 }
 };

 const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
 const [isSelectionMode, setIsSelectionMode] = useState(false);
 const [selectedMediaIndices, setSelectedMediaIndices] = useState<Set<number>>(new Set());
 const [isDrawerOpen, setIsDrawerOpen] = useState(false);
 const [selectedImage, setSelectedImage] = useState<string | null>(null);
 const [mediaAnalysis, setMediaAnalysis] = useState<Record<number, { tags: string[], aesthetic: any, deltaVerdict?: any }>>({});
 const [isAnalyzing, setIsAnalyzing] = useState<Record<number, boolean>>({});
 const [deepThinking, setDeepThinking] = useState(false);
 const [liteMode, setLiteMode] = useState(false);
 const [useTailorProfile, setUseTailorProfile] = useState(true);
 const [isHighFidelity, setIsHighFidelity] = useState(initialHighFidelity || false);
 const [freshState, setFreshState] = useState(false);
 const [useSearch, setUseSearch] = useState(false); 
 const [useMaps, setUseMaps] = useState(false);
 const [taskMode, setTaskMode] = useState(false);
 const [selectedCategory, setSelectedCategory] = useState<string>('STYLE');
 const [selectedTone, setSelectedTone] = useState<ToneTag | null>(null);
 const [isTranscribing, setIsTranscribing] = useState(false);
 const [transcriptionStatus, setTranscriptionStatus] = useState<'idle' | 'transcribing' | 'success' | 'error'>('idle');
 const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
 const [showColophon, setShowColophon] = useState(false);
 const [promptIndex, setPromptIndex] = useState(0);
 const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);
 const [showConfirmation, setShowConfirmation] = useState(false);
 const [activeTags, setActiveTags] = useState<string[]>([]);
 const [activeTreatmentId, setActiveTreatmentId] = useState<string | null>(null);
 
 const mediaInputRef = useRef<HTMLInputElement>(null);
 const { isRecording, startRecording: startRecordingHook, stopRecording, resetRecording } = useRecorder();

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files) {
 try {
 const files = Array.from(e.target.files);
 const newMedia = await Promise.all(files.map(async (f) => {
 let data: string;
 if (f.type.startsWith('image/')) {
 const { compressImage } = await import('../services/imageUtils');
 data = await compressImage(f, 800, 800, 0.7);
 } else {
 data = await new Promise<string>((resolve, reject) => {
 const reader = new FileReader();
 reader.onloadend = () => resolve(reader.result as string);
 reader.onerror = reject;
 reader.readAsDataURL(f);
 });
 }
 return {
 file: f,
 type: (f.type.startsWith('image/') ? 'image' : f.type.startsWith('audio/') ? 'audio' : 'video') as 'image' | 'audio' | 'video',
 url: URL.createObjectURL(f),
 data,
 mimeType: f.type.startsWith('image/') ? 'image/jpeg' : f.type,
 name: f.name
 };
 }));
 setMediaFiles(prev => [...prev, ...newMedia]);
 } catch (err) {
 console.error("MIMI // Error reading files:", err);
 }
 }
 };

 const triggerAccession = useCallback(() => {
 let finalInput = input;
 if (activeThread && activeThread.narrative) {
 finalInput = `${input}\n\n[THREAD CONTEXT: ${activeThread.narrative}]`;
 }

 if (activeTreatmentId && profile?.savedTreatments) {
 const treatment = profile.savedTreatments.find(t => t.id === activeTreatmentId);
 if (treatment) {
 finalInput = `[TREATMENT FILTER ACTIVE: ${treatment.treatmentName}]\nBase Directives: ${treatment.basePromptDirectives}\nTypography: ${treatment.typographyLayout}\nImage Rules: ${treatment.imageEditingRules}\n\n${finalInput}`;
 }
 }

 onRefine(finalInput, mediaFiles, selectedTone || 'CONTENT', {
 deepThinking,
 isPublic: false,
 isLite: liteMode,
 bypassTailor: !useTailorProfile,
 isHighFidelity,
 useSearch,
 useMaps,
 taskMode,
 zineOptions: { ...zineOptions, customTitle: title, selectedTreatmentId: activeTreatmentId || zineOptions.selectedTreatmentId }
 });
 
 localStorage.removeItem('mimi_draft_input');
 localStorage.removeItem('mimi_draft_title');
 }, [onRefine, input, mediaFiles, selectedTone, deepThinking, liteMode, useTailorProfile, isHighFidelity, useSearch, useMaps, taskMode, zineOptions, title, activeThread, activeTreatmentId, profile]);

 const handleBatchAnalyze = async () => {
 const indices = Array.from(selectedMediaIndices);
 for (const index of indices) {
 const media = mediaFiles[index];
 if (media.type !== 'image') continue;
 setIsAnalyzing(prev => ({ ...prev, [index]: true }));
 try {
 const base64 = media.data.split(',')[1] || media.data;
 const [tags, aesthetic] = await Promise.all([
 generateTagsFromMedia(undefined, [{ type: 'image', data: base64, mimeType: 'image/png' }]),
 analyzeImageAesthetic(base64, 'image/png', profile)
 ]);
 let deltaVerdict = undefined;
 if (profile?.tasteProfile?.aestheticSignature && aesthetic) {
 deltaVerdict = await analyzeAestheticDelta(profile.tasteProfile.aestheticSignature, aesthetic);
 }
 setMediaAnalysis(prev => ({ ...prev, [index]: { tags, aesthetic, deltaVerdict } }));
 } catch (e) {
 console.error(e);
 } finally {
 setIsAnalyzing(prev => ({ ...prev, [index]: false }));
 }
 }
 setSelectedMediaIndices(new Set());
 };

 const handleBatchRefract = async () => {
 const indices = Array.from(selectedMediaIndices);
 for (const index of indices) {
 const media = mediaFiles[index];
 if (media.type !== 'image') continue;
 try {
 const base64 = media.data.split(',')[1] || media.data;
 const stylePrompt = mediaAnalysis[index]?.aesthetic?.culturalReferences?.join(', ') || 'avant-garde';
 const transformed = await applyAestheticRefraction(media.data, stylePrompt, profile);
 setMediaFiles(prev => prev.map((m, i) => i === index ? { ...m, data: transformed } : m));
 } catch (e) {
 console.error(e);
 }
 }
 setSelectedMediaIndices(new Set());
 };

 const handleBatchExport = async () => {
 const indices = Array.from(selectedMediaIndices);
 const selectedMedia = indices.map(i => mediaFiles[i]);
 
 try {
 const itemIds = [];
 for (const media of selectedMedia) {
 let finalUrl = media.url || media.data;
 if (currentUser?.uid && media.data) {
 try {
 const { archiveManager } = await import('../services/archiveManager');
 const path = `pocket_images/${currentUser.uid}_${Date.now()}_${media.name || 'batch'}`;
 finalUrl = await archiveManager.uploadMedia(currentUser.uid, media.data, path);
 } catch (e) {
 console.warn("Failed to upload batch media to storage", e);
 finalUrl = media.data; // fallback to base64
 }
 }

 const { archiveManager } = await import('../services/archiveManager');
 const id = await archiveManager.saveToPocket(currentUser?.uid || 'ghost', media.type as any, {
 imageUrl: media.type === 'image' ? finalUrl : undefined,
 audioUrl: media.type === 'audio' ? finalUrl : undefined,
 videoUrl: media.type === 'video' ? finalUrl : undefined,
 prompt: media.name || 'Batch Export',
 timestamp: Date.now(),
 origin: 'InputStudio_Batch'
 });
 if (id) itemIds.push(id);
 }
 
 if (itemIds.length > 0) {
 await createMoodboard(
 currentUser?.uid || 'ghost', 
 `Collection ${new Date().toLocaleDateString()}`,
 itemIds
 );
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Collection Saved to Pocket.", icon: <FolderPlus size={14} /> } }));
 }
 } catch (e) {
 console.error(e);
 }
 setSelectedMediaIndices(new Set());
 };

 const startRecording = () => {
 if (isRecording) {
 stopRecording();
 } else {
 startRecordingHook();
 }
 };
 
 // ... (existing state)
 const [activeProvocation, setActiveProvocation] = useState<string | null>(null);
 const [activePanel, setActivePanel] = useState<'signal' | 'treatments' | 'orchestrator' | 'procurement' | 'inspo' | 'telemetry' | null>(null);
 
 const togglePanel = (mode: 'signal' | 'treatments' | 'orchestrator' | 'procurement' | 'inspo' | 'telemetry') => {
 if (activePanel === mode) {
 setActivePanel(null);
 } else {
 setActivePanel(mode);
 }
 };

 // ... (rest of the component)

 const textareaRef = useRef<HTMLTextAreaElement>(null);

 useEffect(() => {
 if (textareaRef.current) {
 textareaRef.current.style.height = 'auto';
 textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
 }
 }, [input]);

 return (
 <div 
 onDragOver={(e) => e.preventDefault()}
 onDrop={(e) => {
 e.preventDefault();
 if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
 handleFileChange({ target: { files: e.dataTransfer.files } } as any);
 } else {
 const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
 if (url) {
 setInput(prev => prev ? `${prev}\n${url}` : url);
 }
 }
 }}
 className="w-full h-screen flex bg-nous-base dark:bg-background-dark overflow-hidden relative"
 >
 {/* MAIN WORKSPACE */}
 <motion.div 
 animate={{ opacity: isThinking ? [0.5, 1, 0.5] : 1 }}
 transition={{ duration: 2, repeat: Infinity, ease:"easeInOut"}}
 className="flex-1 flex flex-col items-center justify-start relative h-full pb-32 px-12 z-10 overflow-x-hidden overflow-y-auto"
 >

 {/* Prompt Cycle */}
 <div className="text-center mb-8 mt-12 w-full">
 {activeThread && (
 <div className="mb-6 flex items-center justify-center gap-2">
 <div className="w-2 h-2 rounded-none bg-nous-base0 dark:bg-stone-400 animate-pulse"/>
 <span className="text-[10px] uppercase tracking-widest text-nous-subtle font-bold">
 Actively Weaving: {activeThread.title}
 </span>
 <button 
 onClick={() => setActiveThread(null)}
 className="text-nous-subtle hover:text-red-500 transition-colors ml-2"
 title="Clear Active Thread"
 >
 <X size={12} />
 </button>
 </div>
 )}
 <div className="flex items-center justify-center gap-2 mb-4 w-full max-w-lg mx-auto">
 <Sparkles size={16} className="text-nous-subtle cursor-pointer hover:text-primary hover:text-nous-text transition-colors flex-shrink-0"onClick={handleAutoGenerateTitle} />
 <input 
 type="text"
 placeholder="ENTER ZINE TITLE..."
 value={title || ''}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full bg-transparent border-b border-nous-border pb-2 text-sm uppercase tracking-widest text-nous-subtle placeholder:text-nous-subtle outline-none text-center"
 />
 </div>
 <p className="text-[8px] uppercase tracking-widest text-nous-subtle">PROMPT_CYCLE {promptIndex + 1}</p>
 <p className="text-[10px] uppercase tracking-widest text-nous-subtle">"{DEFAULT_PROMPTS[promptIndex]}"</p>
 </div>

 {/* Fragments of a conversation regarding... (textarea) */}
 <div className="w-full max-w-4xl flex flex-col items-center relative">
 {taskMode && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-4 px-3 py-1 bg-nous-base border border-nous-border rounded-none flex items-center gap-2"
 >
 <Sparkles size={10} className="text-nous-subtle"/>
 <span className="text-[9px] uppercase tracking-widest text-nous-subtle font-bold">Task Intelligence Active</span>
 </motion.div>
 )}

 <textarea
 ref={textareaRef}
 value={input || ''}
 onChange={(e) => setInput(e.target.value)}
 className="w-full bg-transparent border-none focus:ring-0 text-2xl md:text-3xl font-serif italic text-center mb-2 text-primary  outline-none resize-none p-8 min-h-[200px]"
 placeholder="Fragments of a conversation regarding..."
 />

 {/* Studio Toolbar - Neomorphic with Tooltips */}
 <div className="flex items-center gap-2 p-1.5 px-4 mb-6 rounded-none bg-nous-base dark: border border-white/20 /20">
 <div className="relative group flex items-center justify-center">
 <button onClick={() => mediaInputRef.current?.click()} className="p-1.5 text-nous-subtle hover:text-primary hover:text-nous-text transition-colors">
 <Paperclip size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Upload Media</div>
 </div>
 </div>

 <div className="relative group flex items-center justify-center">
 <button onClick={startRecording} className={`p-1.5 transition-colors ${isRecording ? 'text-red-500' : 'text-nous-subtle hover:text-primary hover:text-nous-text'}`}>
 <Mic size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Voice Transcription</div>
 </div>
 </div>
 
 <div className="w-px h-3 bg-stone-300 dark:bg-stone-700 mx-1"/>

 <div className="relative group flex items-center justify-center">
 <button onClick={() => setLiteMode(!liteMode)} className={`p-1.5 transition-colors ${liteMode ? 'text-yellow-500' : 'text-nous-subtle hover:text-yellow-500'}`}>
 <Zap size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Lite Mode</div>
 </div>
 </div>

 <div className="relative group flex items-center justify-center">
 <button onClick={() => setDeepThinking(!deepThinking)} className={`p-1.5 transition-colors ${deepThinking ? 'text-purple-500' : 'text-nous-subtle hover:text-purple-500'}`}>
 <BrainCircuit size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Deep Thinking</div>
 </div>
 </div>

 <div className="relative group flex items-center justify-center">
 <button onClick={() => setUseSearch(!useSearch)} className={`p-1.5 transition-colors ${useSearch ? 'text-blue-500' : 'text-nous-subtle hover:text-blue-500'}`}>
 <Globe size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Search Grounding</div>
 </div>
 </div>

 <div className="relative group flex items-center justify-center">
 <button onClick={() => setUseMaps(!useMaps)} className={`p-1.5 transition-colors ${useMaps ? 'text-orange-500' : 'text-nous-subtle hover:text-orange-500'}`}>
 <MapPin size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Maps Grounding</div>
 </div>
 </div>

 <div className="relative group flex items-center justify-center">
 <button onClick={() => setTaskMode(!taskMode)} className={`p-1.5 transition-colors ${taskMode ? 'text-nous-text ' : 'text-nous-subtle hover:text-nous-text '}`}>
 <Sparkles size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Task Intelligence</div>
 </div>
 </div>

 <div className="relative group flex items-center justify-center">
 <button onClick={() => setUseTailorProfile(!useTailorProfile)} className={`p-1.5 transition-colors ${useTailorProfile ? 'text-indigo-500' : 'text-nous-subtle hover:text-indigo-500'}`}>
 <Scissors size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Tailor Profile</div>
 </div>
 </div>

 <div className="w-px h-3 bg-stone-300 dark:bg-stone-700 mx-1"/>

 <div className="relative group flex items-center justify-center">
 <button 
 onClick={async () => {
 setIsGeneratingPrompt(true);
 try {
 const newPrompt = await generateAutoAwesomePrompt();
 setInput(newPrompt);
 } catch (e) {
 console.error(e);
 } finally {
 setIsGeneratingPrompt(false);
 }
 }} 
 disabled={isGeneratingPrompt}
 className={`p-1.5 transition-colors ${isGeneratingPrompt ? 'text-red-500 animate-pulse' : 'text-nous-subtle hover:text-red-500'}`}
 >
 <Wand2 size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Mimi Prompt Engine</div>
 </div>
 </div>

 <div className="relative group flex items-center justify-center">
 <button onClick={() => setInput('')} className="p-1.5 text-nous-subtle hover:text-nous-text transition-colors">
 <Eraser size={16} strokeWidth={1.0} />
 </button>
 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
 <div className="bg-nous-base dark:bg-stone-200 text-nous-base text-[9px] uppercase tracking-widest px-2 py-1 rounded-none whitespace-nowrap">Clear Input</div>
 </div>
 </div>
 </div>
 
 {/* Media Previews Area */}
 <div className="flex flex-col items-center gap-6 w-full mb-12">
 {mediaFiles.length > 0 && (
 <div className="flex flex-col items-center w-full">
 <div className="flex items-center justify-between w-full max-w-4xl mb-4 px-4">
 <h3 className="text-[10px] uppercase tracking-widest text-nous-subtle font-bold">Artifacts ({mediaFiles.length})</h3>
 <button 
 onClick={() => {
 setIsSelectionMode(!isSelectionMode);
 if (isSelectionMode) setSelectedMediaIndices(new Set());
 }}
 className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-none transition-colors ${isSelectionMode ? 'bg-nous-text text-nous-base ' : 'bg-stone-200 text-nous-subtle hover:bg-stone-300 dark:hover:bg-stone-700'}`}
 >
 {isSelectionMode ? 'Cancel Selection' : 'Select'}
 </button>
 </div>
 
 <AnimatePresence>
 {selectedMediaIndices.size > 0 && (
 <motion.div 
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="flex flex-wrap items-center gap-4 bg-nous-base text-nous-base px-6 py-3 rounded-none mb-6 z-50 sticky top-4"
 >
 <span className="text-xs font-mono">{selectedMediaIndices.size} Selected</span>
 <div className="h-4 w-px bg-white/20 /20"></div>
 <button onClick={() => {
 if (selectedMediaIndices.size === mediaFiles.length) {
 setSelectedMediaIndices(new Set());
 } else {
 setSelectedMediaIndices(new Set(mediaFiles.map((_, i) => i)));
 }
 }} className="text-[10px] uppercase tracking-widest hover:text-nous-subtle transition-colors">
 {selectedMediaIndices.size === mediaFiles.length ? 'Deselect All' : 'Select All'}
 </button>
 <div className="h-4 w-px bg-white/20 /20"></div>
 <button onClick={handleBatchAnalyze} className="text-[10px] uppercase tracking-widest hover:text-nous-text transition-colors flex items-center gap-2">
 <Radar size={14} /> Analyze
 </button>
 <button onClick={handleBatchRefract} className="text-[10px] uppercase tracking-widest hover:text-red-400 dark:hover:text-red-600 transition-colors flex items-center gap-2">
 <Wand2 size={14} /> Refract
 </button>
 <button onClick={handleBatchExport} className="text-[10px] uppercase tracking-widest hover:text-blue-400 dark:hover:text-blue-600 transition-colors flex items-center gap-2">
 <FolderPlus size={14} /> Collection
 </button>
 <button onClick={() => {
 setMediaFiles(prev => prev.filter((_, i) => !selectedMediaIndices.has(i)));
 setSelectedMediaIndices(new Set());
 }} className="text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-2">
 <Trash2 size={14} /> Delete
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 <div className="flex flex-wrap gap-4 justify-center w-full">
 {mediaFiles.map((media, index) => (
 <motion.div 
 key={index} 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="relative group"
 >
 {!isSelectionMode && (
 <button 
 onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-none p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
 >
 <X size={12} />
 </button>
 )}
 {media.type === 'image' && (
 <div 
 className={`bg-white p-2 pb-6 transform rotate-1 hover:rotate-0 transition-all duration-300 w-32 h-44 flex flex-col cursor-pointer relative ${isSelectionMode && selectedMediaIndices.has(index) ? 'ring-2 ring-stone-900 dark:ring-stone-100 scale-105' : ''}`}
 onClick={() => {
 if (isSelectionMode) {
 setSelectedMediaIndices(prev => {
 const next = new Set(prev);
 if (next.has(index)) next.delete(index);
 else next.add(index);
 return next;
 });
 } else {
 setSelectedImage(media.url || media.data);
 }
 }}
 >
 {isSelectionMode && (
 <div className="absolute top-2 right-2 z-10">
 <div className={`w-5 h-5 rounded-none border-2 flex items-center justify-center transition-colors ${selectedMediaIndices.has(index) ? 'bg-nous-base border-nous-border ' : 'bg-black/20 border-white'}`}>
 {selectedMediaIndices.has(index) && <Check size={12} className="text-white"/>}
 </div>
 </div>
 )}
 <div className="w-full h-24 bg-nous-base overflow-hidden relative">
 <img src={media.url || media.data} alt="upload"className="w-full h-full object-cover"referrerPolicy="no-referrer"/>
 </div>
 <div className="mt-auto text-[8px] text-nous-subtle uppercase truncate text-center font-mono">
 {media.name || 'IMAGE_01'}
 </div>
 <button 
 onClick={async (e) => {
 e.stopPropagation();
 setIsAnalyzing(prev => ({ ...prev, [index]: true }));
 try {
 const base64 = media.data.split(',')[1] || media.data;
 const [tags, aesthetic] = await Promise.all([
 generateTagsFromMedia(undefined, [{ type: 'image', data: base64, mimeType: 'image/png' }]),
 analyzeImageAesthetic(base64, 'image/png', profile)
 ]);
 
 let deltaVerdict = undefined;
 if (profile?.tasteProfile?.aestheticSignature && aesthetic) {
 deltaVerdict = await analyzeAestheticDelta(profile.tasteProfile.aestheticSignature, aesthetic);
 }

 setMediaAnalysis(prev => ({ ...prev, [index]: { tags, aesthetic, deltaVerdict } }));
 } catch (error) {
 console.error("MIMI // Analysis failed:", error);
 } finally {
 setIsAnalyzing(prev => ({ ...prev, [index]: false }));
 }
 }}
 className="mt-1 text-[8px] uppercase tracking-widest text-primary text-nous-text underline"
 >
 {isAnalyzing[index] ? 'Analyzing...' : 'Analyze'}
 </button>
 {mediaAnalysis[index] && (
 <div className="mt-1 text-[7px] text-nous-subtle leading-tight">
 <p className="truncate">{mediaAnalysis[index].tags.slice(0, 3).join(', ')}</p>
 <button 
 onClick={async (e) => {
 e.stopPropagation();
 try {
 const base64 = media.data.split(',')[1] || media.data;
 const stylePrompt = mediaAnalysis[index].aesthetic?.culturalReferences?.join(', ') || 'avant-garde';
 const transformed = await applyAestheticRefraction(media.data, stylePrompt, profile);
 setMediaFiles(prev => prev.map((m, i) => i === index ? { ...m, data: transformed } : m));
 } catch (error) {
 console.error("MIMI // Refraction failed:", error);
 }
 }}
 className="mt-1 text-[7px] uppercase tracking-widest text-red-500 underline"
 >
 Refract
 </button>
 {mediaAnalysis[index].deltaVerdict && (
 <div className="mt-2 text-left">
 <DeltaVerdictCard verdict={mediaAnalysis[index].deltaVerdict} compact />
 </div>
 )}
 </div>
 )}
 </div>
 )}
 {media.type === 'audio' && (
 <div 
 className={`bg-nous-base p-3 border border-nous-border w-40 h-auto flex flex-col items-center gap-2 rounded-none cursor-pointer relative transition-all duration-300 ${isSelectionMode && selectedMediaIndices.has(index) ? 'ring-2 ring-stone-900 dark:ring-stone-100 scale-105' : ''}`}
 onClick={() => {
 if (isSelectionMode) {
 setSelectedMediaIndices(prev => {
 const next = new Set(prev);
 if (next.has(index)) next.delete(index);
 else next.add(index);
 return next;
 });
 }
 }}
 >
 {isSelectionMode && (
 <div className="absolute top-2 right-2 z-10">
 <div className={`w-5 h-5 rounded-none border-2 flex items-center justify-center transition-colors ${selectedMediaIndices.has(index) ? 'bg-nous-base border-nous-border ' : 'bg-black/20 border-white'}`}>
 {selectedMediaIndices.has(index) && <Check size={12} className="text-white"/>}
 </div>
 </div>
 )}
 <div className="flex gap-1 items-center h-8 flex-1 justify-center">
 {[...Array(12)].map((_, i) => (
 <motion.div 
 key={i}
 animate={{ height: ['20%', '80%', '20%'] }}
 transition={{ duration: 1 + Math.random(), repeat: Infinity, ease:"easeInOut", delay: Math.random() }}
 className="w-0.5 bg-primary  rounded-none"
 />
 ))}
 </div>
 <button 
 onClick={async () => {
 setIsAnalyzing(prev => ({ ...prev, [index]: true }));
 try {
 const base64 = media.data.split(',')[1] || media.data;
 const analysis = await analyzeAudio(base64, 'audio/wav');
 setMediaAnalysis(prev => ({ ...prev, [index]: { tags: analysis.tags, aesthetic: analysis.fingerprint } }));
 } catch (error) {
 console.error("MIMI // Audio analysis failed:", error);
 } finally {
 setIsAnalyzing(prev => ({ ...prev, [index]: false }));
 }
 }}
 className="text-[8px] uppercase tracking-widest text-primary text-nous-text underline"
 >
 {isAnalyzing[index] ? 'Analyzing...' : 'Analyze'}
 </button>
 {mediaAnalysis[index] && (
 <div className="mt-1 text-[7px] text-nous-subtle w-full leading-tight">
 <p className="truncate">{mediaAnalysis[index].tags.slice(0, 3).join(', ')}</p>
 <p className="truncate">Mood: {mediaAnalysis[index].aesthetic.mood[0]}</p>
 {mediaAnalysis[index].deltaVerdict && (
 <div className="mt-2 text-left">
 <DeltaVerdictCard verdict={mediaAnalysis[index].deltaVerdict} compact />
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </motion.div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Submit Button */}
 <button onClick={() => setShowConfirmation(true)} className="text-[10px] uppercase tracking-[0.2em] border-b border-primary/20 /20 hover:border-primary dark:hover:border-white transition-colors text-primary text-nous-text mb-4">
 → SUBMIT TO ISSUE
 </button>
 </div>
 </motion.div>

 {/* Confirmation Overlay */}
 <AnimatePresence>
 {showConfirmation && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] flex items-center justify-center bg-nous-base/90 /90 backdrop-blur-md"
 >
 <motion.div
 initial={{ scale: 0.95, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.95, y: 20 }}
 className="bg-white p-8 max-w-lg w-full border border-nous-border flex flex-col items-center text-center shadow-2xl"
 >
 <h2 className="font-serif italic text-2xl mb-4 text-primary text-nous-text">Confirm Submission</h2>
 <p className="text-sm text-nous-subtle mb-8">
 You are about to submit this artifact to the issue. This action will initiate the synthesis process.
 </p>
 <div className="flex gap-4 w-full">
 <button
 onClick={() => setShowConfirmation(false)}
 className="flex-1 py-3 text-[10px] uppercase tracking-widest border border-nous-border text-nous-subtle hover:bg-nous-base dark:hover:bg-stone-700 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => {
 setShowConfirmation(false);
 triggerAccession();
 }}
 className="flex-1 py-3 text-[10px] uppercase tracking-widest bg-primary  text-nous-base hover:bg-nous-base dark:hover:bg-stone-200 transition-colors"
 >
 Confirm & Submit
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 
 {/* ... (rest of the component) */}

 {/* FLOATING ORACULAR TABS */}
 <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2 bg/90 dark:bg/90 backdrop-blur-xl px-6 py-3 rounded-none border border-nous-border dark:">
 {(['signal', 'inspo', 'treatments', 'orchestrator', 'procurement', 'telemetry'] as const).map((mode) => {
 const isActive = activePanel === mode;
 return (
 <button
 key={mode}
 onClick={() => togglePanel(mode)}
 className={`relative px-4 py-2 rounded-none transition-all duration-300 ${isActive ? 'bg-nous-text text-nous-base ' : 'text-nous-subtle hover:text-nous-text '}`}
 >
 <span className={`text-[10px] uppercase tracking-widest font-bold ${isActive ? 'font-serif italic text-sm' : ''}`}>
 {mode}
 </span>
 
 {/* The Oracular Glow / Fluid Active State */}
 {isActive && (
 <motion.div 
 layoutId="activeTabGlow"
 className="absolute inset-0 rounded-none border border-nous-border/30 /30 dark:"
 transition={{ type:"spring", stiffness: 300, damping: 30 }}
 />
 )}
 </button>
 );
 })}
 </div>

 {/* Panel Content (Modal-like) */}
 <AnimatePresence>
 {activePanel && (
 <motion.div 
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[400px] max-h-[60vh] bg-nous-base/95 /95 backdrop-blur-xl border border-nous-border rounded-none pointer-events-auto overflow-y-auto p-8 flex flex-col z-50"
 >
 <div className="flex-1">
 <div className="flex justify-between items-center mb-8 border-b border-nous-border pb-4">
 <h2 className="font-serif italic text-2xl text-primary text-nous-text capitalize">{activePanel}</h2>
 <button onClick={() => setActivePanel(null)} className="text-nous-subtle hover:text-primary hover:text-nous-text transition-colors"><X size={20} /></button>
 </div>
 
 <div className="text-nous-subtle">
 {activePanel === 'inspo' && (
 <div className="flex flex-col gap-6">
 <ZineInspoCarousel />
 </div>
 )}
 {activePanel === 'telemetry' && (
 <div className="flex flex-col gap-6">
 <div className="flex justify-between items-center">
 <GlossaryTooltip 
 term="Latent Telemetry"
 poeticMeaning="The silent hum of the machine, listening to the space between your words."
 functionalMeaning="A visual indicator of the system's background processing and readiness to interpret your input."
 >
 <span className="text-[10px] uppercase tracking-[0.2em] text-nous-subtle">Latent Telemetry</span>
 </GlossaryTooltip>
 <div className="flex gap-[2px] items-end h-3">
 {[...Array(5)].map((_, i) => (
 <motion.div 
 key={i}
 animate={{ height: [`${Math.random() * 40 + 20}%`, `${Math.random() * 60 + 40}%`, `${Math.random() * 40 + 20}%`] }}
 transition={{ duration: 1 + Math.random(), repeat: Infinity, ease:"easeInOut"}}
 className="w-[2px] bg-primary  rounded-none"
 />
 ))}
 </div>
 </div>
 
 <div className="font-mono text-[9px] uppercase tracking-widest flex flex-col gap-3 text-nous-subtle">
 <div className="flex justify-between items-center">
 <GlossaryTooltip 
 term="Signal Density"
 poeticMeaning="The weight of your thoughts, measured in digital mass."
 functionalMeaning="The total character count of your input, scaled to a density metric."
 >
 <span>Signal_Density</span>
 </GlossaryTooltip>
 <span className="text-primary text-nous-text">{((input?.length || 0) / 100).toFixed(2)} ℌ</span>
 </div>
 <div className="flex justify-between items-center">
 <GlossaryTooltip 
 term="Media Nodes"
 poeticMeaning="Anchors of visual truth scattered in the void."
 functionalMeaning="The number of images or videos currently attached to your input."
 >
 <span>Media_Nodes</span>
 </GlossaryTooltip>
 <span className="text-primary text-nous-text">{mediaFiles.length}</span>
 </div>
 <div className="flex justify-between items-center">
 <GlossaryTooltip 
 term="Entropy Level"
 poeticMeaning="How deeply the machine dreams into the chaotic unknown."
 functionalMeaning="Indicates if 'Deep Thinking' mode is active, increasing the randomness and complexity of the AI's response."
 >
 <span>Entropy_Level</span>
 </GlossaryTooltip>
 <span className="text-primary text-nous-text">{deepThinking ? 'Maximum' : 'Optimized'}</span>
 </div>
 </div>

 <div className="p-5 bg-nous-base /50 rounded-none border border-nous-border /50 relative overflow-hidden group">
 <div className="absolute top-0 left-0 w-1 h-full bg-stone-300 dark:bg-stone-600 group-hover:bg-primary dark:group-hover:bg-white transition-colors"/>
 <p className="text-[8px] uppercase tracking-[0.2em] text-nous-subtle mb-3">Oblique Directive</p>
 <AnimatePresence mode="wait">
 <motion.p 
 key={provocationIndex}
 initial={{ opacity: 0, y: 5 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -5 }}
 transition={{ duration: 0.5 }}
 className="font-serif italic text-sm text-primary text-nous-text leading-relaxed"
 >
"{PROVOCATIONS[provocationIndex]}"
 </motion.p>
 </AnimatePresence>
 </div>
 </div>
 )}
 {activePanel === 'signal' && (
 <div className="flex flex-col gap-6">
 <p className="text-xs uppercase tracking-widest text-nous-subtle">AI Tags</p>
 <TagGenerator 
 context={input} 
 onAddTags={(tags) => {
 setActiveTags(prev => [...new Set([...prev, ...tags])]);
 }} 
 />
 {activeTags.length > 0 && (
 <div className="mt-4">
 <p className="text-[10px] uppercase tracking-widest text-nous-subtle mb-2">Active Tags</p>
 <div className="flex flex-wrap gap-2">
 {activeTags.map(tag => (
 <span key={tag} className="px-2 py-1 bg-black/5 /5 text-[10px] uppercase tracking-widest rounded-none flex items-center gap-1">
 {tag}
 <button onClick={() => setActiveTags(prev => prev.filter(t => t !== tag))}><X size={10} /></button>
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 {activePanel === 'treatments' && (
 <div className="flex flex-col gap-6">
 <p className="text-xs uppercase tracking-widest text-nous-subtle mb-4">Treatment Panel / Directives</p>
 <ZineConfiguration 
 zineOptions={zineOptions} 
 setZineOptions={setZineOptions} 
 profile={profile} 
 onSelectPrompt={(prompt) => {
 setInput(prompt);
 }}
 />
 </div>
 )}

 {activePanel === 'orchestrator' && (
 <div className="flex flex-col gap-6">
 <p className="text-xs uppercase tracking-widest text-nous-subtle mb-4">Prompt Orchestrator</p>
 
 {/* Treatment Filters */}
 {profile?.savedTreatments && profile.savedTreatments.length > 0 && (
 <div className="flex flex-col gap-3 mb-6">
 <p className="text-[10px] uppercase tracking-widest text-nous-subtle">Treatment Filters</p>
 <div className="flex flex-wrap gap-2">
 {profile.savedTreatments.map(t => (
 <button
 key={t.id}
 onClick={() => setActiveTreatmentId(activeTreatmentId === t.id ? null : t.id)}
 className={`px-3 py-1.5 text-[10px] uppercase tracking-widest rounded-none border transition-colors ${activeTreatmentId === t.id ? 'border-nous-border text-nous-text bg-nous-base ' : 'border-nous-border text-nous-subtle hover:border-nous-border '}`}
 >
 [{t.treatmentName}]
 </button>
 ))}
 </div>
 </div>
 )}

 <PromptOrchestrator isOpen={true} onClose={() => setActivePanel(null)} />
 </div>
 )}

 {activePanel === 'procurement' && (
 <div className="flex flex-col gap-6 h-full">
 <TheThimble profile={profile} isOpen={true} />
 </div>
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Footer Meta */}
 <footer className="absolute bottom-0 left-0 w-full p-8 flex justify-end items-end pointer-events-none z-50">
 <div className="flex gap-8 pointer-events-auto relative group">
 <button 
 onClick={() => setLegalType('privacy')} 
 className="text-[10px] uppercase tracking-[0.2em] border-b border-primary/20 /20 hover:border-primary dark:hover:border-white transition-colors text-primary text-nous-text"
 >
 Privacy
 </button>
 <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'proscenium' }))} className="text-[10px] uppercase tracking-[0.2em] border-b border-primary/20 /20 hover:border-primary dark:hover:border-white transition-colors text-primary text-nous-text">Community</button>
 </div>
 </footer>
 
 {/* Hidden Overlays */}
 <CuratorNote isOpen={showColophon} onClose={() => setShowColophon(false)} />
 <AnimatePresence>
 {legalType && <LegalOverlay type={legalType} onClose={() => setLegalType(null)} />}
 </AnimatePresence>
 {/* Full-size Image Preview Modal */}
 <AnimatePresence>
 {selectedImage && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
 onClick={() => setSelectedImage(null)}
 >
 <motion.img 
 initial={{ scale: 0.9 }}
 animate={{ scale: 1 }}
 exit={{ scale: 0.9 }}
 src={selectedImage} 
 alt="Full preview"
 className="max-w-full max-h-full object-contain"
 />
 </motion.div>
 )}
 </AnimatePresence>

 <input type="file"id="media-upload"name="mediaUpload"ref={mediaInputRef} onChange={handleFileChange} className="hidden"multiple accept="image/*,audio/*,video/*"/>
 </div>
 );
};
