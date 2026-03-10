
// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaFile, ToneTag, PocketItem } from '../types';
import { useRecorder } from '../hooks/useRecorder';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { Plus, BrainCircuit, X, Globe, Mic, Loader2, Square, Check, Radio, Mail, Info, Sparkles, AlertCircle, Eraser, Zap, Image as ImageIcon, Link as LinkIcon, Twitter, Instagram, Shield, Users, ArrowUpRight, FolderOpen, Paperclip, ChevronLeft, ChevronRight, GripVertical, FileText } from 'lucide-react';
import { transcribeAudio, compressImage, generateTags } from '../services/geminiService';
import { CuratorNote } from './CuratorNote';
import { useUser } from '../contexts/UserContext';
import { LegalOverlay } from './LegalOverlay';
import { fetchPocketItems } from '../services/firebase';

const CATEGORIES: Record<string, ToneTag[]> = {
  STYLE: ['CONTENT', 'EDITORIAL', 'DREAM', 'UNHINGED', 'RESEARCH'],
  SOURCE: ['SHADOW', 'SIGNAL', 'ECHO'],
  FORMAT: ['MANIFESTO', 'SHARD', 'DOSSIER', 'PROMPT'],
  ALCHEMY: ['RAW', 'VINTAGE', 'CONTRARY']
};

const GUIDED_PROMPTS: Record<string, string> = {
  CONTENT: "DEFINE THE ASSIGNMENT. SPECIFY THE DIRECTIVES. OUTLINE THE OUTPUT.",
  EDITORIAL: "IDENTIFY YOUR VISUAL ANCHOR. DEFINE THE COMPOSITION. SET THE TYPOGRAPHIC WEIGHT.",
  DREAM: "TRIGGER THE MEMORY. LAYER THE ATMOSPHERE. CAPTURE THE RESONANCE.",
  UNHINGED: "CALIBRATE THE CHAOS. DISTORT THE VISION. INJECT THE NON-SEQUITUR.",
  RESEARCH: "STATE THE CORE INQUIRY. TARGET THE SOURCES. CHOOSE THE SYNTHESIS.",
};

const DEFAULT_PROMPTS = ["AWAITING INPUT...", "STANDBY FOR ARCHIVE...", "DEFINE THE VIBE..."];

const DEFAULT_STARTERS = [
  "It started with the texture of...",
  "The light caught the edge of...",
  "I am haunted by the image of...",
  "A sudden realization about...",
  "The specific mood of...",
  "Fragments of a conversation regarding...",
  "The architecture of..."
];

export const InputStudio: React.FC<{
  onRefine: any, 
  isThinking: boolean, 
  initialValue?: string,
  initialMedia?: MediaFile[],
  continuumContext?: any,
  initialHighFidelity?: boolean
}> = ({ onRefine, isThinking, initialValue, initialMedia, continuumContext, initialHighFidelity }) => {
  const { systemStatus, user: currentUser } = useUser();
  const { logEvent } = useTasteLogging();
  
  // Initialize with a value if none provided
  const [input, setInput] = useState(() => {
    if (initialValue) return initialValue;
    return DEFAULT_STARTERS[Math.floor(Math.random() * DEFAULT_STARTERS.length)];
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [deepThinking, setDeepThinking] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  const [isHighFidelity, setIsHighFidelity] = useState(initialHighFidelity || false);
  const [freshState, setFreshState] = useState(false);
  const [useSearch, setUseSearch] = useState(true); 
  const [selectedCategory, setSelectedCategory] = useState<string>('STYLE');
  const [selectedTone, setSelectedTone] = useState<ToneTag | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<'idle' | 'transcribing' | 'success' | 'error'>('idle');
  const [showColophon, setShowColophon] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);
  
  // Sidebar State
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [savedComponents, setSavedComponents] = useState<PocketItem[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<PocketItem[]>([]);
  const [folderTitle, setFolderTitle] = useState('PROJECT REF — PLATE 01');
  
  useEffect(() => {
    const fetchComponents = async () => {
        if (currentUser?.uid) {
            const items = await fetchPocketItems(currentUser.uid);
            // Filter for items that might be components (e.g., tagged as 'component' or 'logo')
            setSavedComponents(items.filter(i => i.tags?.includes('component') || i.tags?.includes('logo')));
        }
    };
    fetchComponents();
  }, [currentUser?.uid]);
  
  // CONTINUUM STATE
  const [activeProvocation, setActiveProvocation] = useState<string | null>(null);
  
  const { isRecording, startRecording, stopRecording, audioBlob, permissionError } = useRecorder();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedTone) {
      const timer = setInterval(() => {
        setPromptIndex(prev => (prev + 1) % DEFAULT_PROMPTS.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [selectedTone]);

  // Handle Incoming Signal
  useEffect(() => {
      if (initialValue && typeof initialValue === 'object') {
          if (initialValue.includes('PROVOCATION:')) {
              const parts = initialValue.split('PROVOCATION: "');
              if (parts[1]) {
                  const prov = parts[1].split('"')[0];
                  setActiveProvocation(prov);
                  setInput(''); 
                  return;
              }
          }
          setInput(initialValue);
      } else if (initialValue) {
          if (initialValue.includes('PROVOCATION: "')) {
              const parts = initialValue.split('PROVOCATION: "');
              if (parts[1]) {
                  const prov = parts[1].split('"')[0];
                  setActiveProvocation(prov);
                  setInput(''); 
              } else {
                  setInput(initialValue);
              }
          } else {
              setInput(initialValue);
          }
      }
  }, [initialValue]);

  useEffect(() => {
    if (initialMedia && initialMedia.length > 0) {
        setMediaFiles(initialMedia);
        setIsFolderOpen(true); // Open folder if coming in with media
    }
  }, [initialMedia]);

  useEffect(() => {
    if (audioBlob) {
      const handleTranscription = async () => {
        setIsTranscribing(true);
        setTranscriptionStatus('transcribing');
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(audioBlob);
          });
          // Pass the mimeType dynamically
          const text = await transcribeAudio(base64, audioBlob.type);
          setInput(prev => prev ? `${prev}\n\n${text}` : text);
          setTranscriptionStatus('success');
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Vocal shard transcribed.", icon: <Mic size={14} className="text-emerald-500" /> } }));
          setTimeout(() => setTranscriptionStatus('idle'), 4000);
        } catch (e) { 
          console.error(e); 
          setTranscriptionStatus('error');
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Transcription failed.", type: 'error' } }));
          setTimeout(() => setTranscriptionStatus('idle'), 4000);
        } finally { 
          setIsTranscribing(false); 
        }
      };
      handleTranscription();
    }
  }, [audioBlob]);

  const triggerAccession = useCallback((e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if ((input.trim() || mediaFiles.length > 0) && !isThinking) {
      let finalInput = input.trim();
      if (activeProvocation) {
          finalInput = `[CONTEXT: Responding to Provocation: "${activeProvocation}"]\n\nRESPONSE: ${input}`;
      }
      onRefine(finalInput, [...mediaFiles], selectedTone, { 
          useSearch: useSearch, 
          deepThinking: deepThinking, 
          isLite: liteMode, 
          ignoreTailor: freshState, 
          isPublic: true,
          folderContext: folderTitle,
          selectedComponents: selectedComponents,
          isHighFidelity: isHighFidelity
      });
    }
  }, [input, mediaFiles, isThinking, selectedTone, useSearch, deepThinking, liteMode, freshState, onRefine, activeProvocation, folderTitle, selectedComponents, isHighFidelity]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Process files sequentially to ensure compression
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawBase64 = event.target?.result as string;
        if (rawBase64) {
          try {
            // If image, compress it. Audio is kept as is.
            let processedBase64 = rawBase64;
            if (file.type.startsWith('image')) {
               processedBase64 = await compressImage(rawBase64, 0.6, 1200);
            }
            
            setMediaFiles(prev => [...prev, { 
              type: file.type.startsWith('audio') ? 'audio' : 'image', 
              url: URL.createObjectURL(file), // Keep preview URL lightweight
              data: processedBase64.split(',')[1], 
              mimeType: file.type,
              name: file.name,
              tags: []
            }]);
            
            // Generate tags asynchronously
            generateTags(`Artifact: ${file.name}`).then(tags => {
                setMediaFiles(prev => prev.map(m => m.name === file.name ? { ...m, tags } : m));
            });
            
            setIsFolderOpen(true);
          } catch (err) {
            console.error("MIMI // Upload Error:", err);
            window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
              detail: { message: "Asset processing failed.", type: 'error' } 
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const removeMedia = (idx: number) => {
      setMediaFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full h-full flex flex-col items-center relative overflow-hidden transition-all duration-1000 bg-nous-base dark:bg-stone-950">
      
      {/* 1. MAIN WORKSPACE */}
      <div 
        className={`w-full max-w-7xl flex-1 flex flex-col items-center justify-center relative min-h-[70vh] pb-64 px-4 md:px-0 z-10 transition-all duration-300 ease-out mt-20 ${isFolderOpen ? 'md:pr-[320px]' : ''}`}
      >
        
        {/* PROMPT HEADER */}
        <div className="relative z-20 mb-8 md:mb-12 text-center max-w-xl">
           <AnimatePresence mode="wait">
             {activeProvocation ? (
               <motion.div
                 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col items-center gap-4 p-6 bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl border border-stone-200 dark:border-stone-800 rounded-sm shadow-sm"
               >
                  <div className="flex items-center gap-2 text-nous-accent">
                      <LinkIcon size={10} />
                      <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-medium">Continuum Active</span>
                  </div>
                  <p className="font-serif italic text-xl md:text-2xl text-nous-text dark:text-white leading-tight">
                      "{activeProvocation}"
                  </p>
               </motion.div>
             ) : (
               <motion.div 
                 key={selectedTone || promptIndex}
                 initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
                 className="flex flex-col items-center gap-2"
               >
                 <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-medium text-stone-400">
                   {selectedTone ? 'GUIDED_INSTRUCTION' : `PROMPT_CYCLE 0${promptIndex + 1}`}
                 </span>
                 <p className="font-mono text-[9px] uppercase tracking-widest text-stone-500 text-center max-w-md">
                    "{selectedTone ? GUIDED_PROMPTS[selectedTone] || "DEFINE THE VIBE..." : DEFAULT_PROMPTS[promptIndex]}"
                 </p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* THE MAIN THESIS INPUT */}
        <div className="relative w-full max-w-4xl z-30 group">
          <textarea 
            id="mimi-input"
            name="input"
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={activeProvocation ? "Type your answer..." : "Deposit your memetic debris..."}
            className="w-full bg-transparent border-none font-serif italic focus:outline-none resize-none leading-[1.1] text-center tracking-tight text-nous-text dark:text-white text-5xl md:text-7xl lg:text-[6rem] placeholder:text-stone-300/40 dark:placeholder:text-stone-700/40 relative transition-colors overflow-hidden py-0 normal-case" 
            style={{ minHeight: '240px' }}
            rows={2}
          />
          
          {/* EDITORIAL SUBMIT LINK */}
          <div className="mt-16 flex justify-center">
              <AnimatePresence mode="wait">
                {(input.trim() || mediaFiles.length > 0) ? (
                  <motion.button 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} 
                      onClick={triggerAccession} disabled={isThinking} 
                      className="group relative px-2 py-1"
                  >
                    <div className="flex items-center gap-3 font-sans text-[9px] uppercase tracking-[0.3em] font-medium text-nous-text dark:text-white transition-all hover:opacity-50">
                       {isThinking ? (
                         <>
                           <Loader2 size={10} className="animate-spin" />
                           <span>{deepThinking ? 'AUDITING...' : 'PROCESSING...'}</span>
                         </>
                       ) : (
                         <>
                           <span>→ SUBMIT TO ISSUE</span>
                         </>
                       )}
                    </div>
                    {/* The subtle rule */}
                    <div className="absolute -bottom-2 left-0 right-0 h-px bg-nous-text dark:bg-white opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-stone-400">
                      <div className="w-1 h-1 bg-nous-accent rounded-full animate-pulse" /> Awaiting Signal Input
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>

      </div>

      {/* 2. THE RIGHT DRAWER (PROJECT REF) */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 md:w-96 z-[1500] transition-transform duration-500 cubic-bezier(0.25, 1, 0.5, 1) shadow-2xl flex ${isFolderOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
          {/* THE TAB (Visible when closed) */}
          <div 
            onClick={() => setIsFolderOpen(!isFolderOpen)}
            className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-10 h-48 bg-[#F3F2ED] dark:bg-[#1C1C1C] border-y border-l border-stone-300 dark:border-stone-800 rounded-l-md cursor-pointer shadow-[-4px_0_10px_rgba(0,0,0,0.05)] hover:bg-[#EBE9E4] dark:hover:bg-[#252525] transition-colors flex items-center justify-center group"
          >
             <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-multiply dark:mix-blend-soft-light z-0 rounded-l-md" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cardboard.png')" }} />
             <div className="rotate-[-90deg] whitespace-nowrap flex items-center gap-2 z-10 transform origin-center translate-y-1">
                <span className="font-sans text-[9px] uppercase tracking-[0.25em] font-black text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 transition-colors">
                    PROJECT REF
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${mediaFiles.length > 0 ? 'bg-emerald-500' : 'bg-stone-300'}`} />
             </div>
          </div>

          {/* THE DRAWER BODY */}
          <div className="w-full h-full bg-[#F3F2ED] dark:bg-[#111] border-l border-stone-300 dark:border-stone-800 flex flex-col relative overflow-hidden">
             <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-multiply dark:mix-blend-soft-light z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cardboard.png')" }} />
             
             {/* Header */}
             <div className="h-16 border-b border-stone-300 dark:border-stone-800 flex items-center justify-between px-6 bg-stone-100/50 dark:bg-black/20 z-10 shrink-0">
                <input 
                    type="text" 
                    value={folderTitle} 
                    onChange={(e) => setFolderTitle(e.target.value)} 
                    className="bg-transparent border-none font-sans text-[10px] uppercase tracking-[0.2em] font-black text-stone-600 dark:text-stone-300 w-full focus:outline-none placeholder:text-stone-400"
                    placeholder="PROJECT REF"
                />
                <button onClick={() => setIsFolderOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"><ChevronRight size={16} /></button>
             </div>

             {/* Artifact Grid */}
             <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar z-10">
                <AnimatePresence>
                    {mediaFiles.map((file, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative group flex flex-col gap-3"
                        >
                            {/* Deletion Overlay on Hover */}
                            <button onClick={() => removeMedia(idx)} className="absolute top-2 right-2 p-1.5 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500">
                                <X size={10} />
                            </button>

                            {/* Image Container - "Pasted" Look */}
                            <div className="relative aspect-[3/4] w-full bg-white dark:bg-black p-2 shadow-sm border border-stone-200 dark:border-stone-800">
                                <div className="w-full h-full bg-stone-100 dark:bg-stone-900 overflow-hidden relative">
                                    {file.type === 'image' ? (
                                        <img src={file.url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="artifact" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-50 dark:bg-stone-800">
                                            <Radio size={24} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Metadata Block */}
                            <div className="flex flex-col gap-1 px-1 opacity-60">
                                <div className="flex justify-between items-baseline border-b border-stone-300 dark:border-stone-700 pb-1">
                                    <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">FIG. 0{idx + 1}</span>
                                    <Paperclip size={10} className="text-stone-400" />
                                </div>
                                <div className="flex justify-between items-baseline font-serif italic text-[10px] text-stone-500">
                                    <span className="truncate max-w-[120px]">{file.name || 'Untitled Artifact'}</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {savedComponents.length > 0 && (
                    <div className="pt-8 border-t border-stone-300 dark:border-stone-800">
                        <h4 className="font-sans text-[9px] uppercase tracking-widest text-stone-500 mb-4">Saved Components</h4>
                        <div className="space-y-4">
                            {savedComponents.map(comp => (
                                <div key={comp.id} className="flex items-center gap-3">
                                    <input 
                                        type="checkbox"
                                        checked={selectedComponents.some(c => c.id === comp.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedComponents(prev => [...prev, comp]);
                                            else setSelectedComponents(prev => prev.filter(c => c.id !== comp.id));
                                        }}
                                        className="accent-emerald-500"
                                    />
                                    <span className="font-serif italic text-xs text-stone-600 dark:text-stone-300">{comp.title || 'Untitled Component'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Trigger Area */}
                <motion.button 
                    onClick={() => mediaInputRef.current?.click()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full aspect-[4/3] border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col items-center justify-center gap-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:border-stone-400 dark:hover:border-stone-500 transition-all group"
                >
                    <Plus size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-sans text-[8px] uppercase tracking-widest font-black">Submit Material</span>
                </motion.button>
                
                {mediaFiles.length === 0 && (
                    <div className="text-center pt-2 opacity-40">
                        <p className="font-serif italic text-xs text-stone-500 leading-relaxed px-4">
                            "The archive awaits your debris."
                        </p>
                    </div>
                )}
             </div>

             {/* Footer Note */}
             <div className="p-6 bg-[#FEF9C3]/50 dark:bg-[#2C2C2C]/50 border-t border-stone-300 dark:border-stone-800 z-10 shrink-0">
                <p className="font-mono text-[8px] text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-1">Field_Note</p>
                <p className="font-serif italic text-xs text-stone-700 dark:text-stone-300 leading-snug">
                    "Fragments are latent architecture. Everything is material."
                </p>
             </div>
          </div>
      </div>

      {/* 3. BOTTOM FLOATING TOOLBAR */}
      <div 
        className={`fixed bottom-0 left-0 w-full z-40 bg-gradient-to-t from-nous-base via-nous-base to-transparent dark:from-stone-950 dark:via-stone-950 pt-12 pb-0 flex flex-col items-center transition-all duration-300 pointer-events-none ${isFolderOpen ? 'md:pr-[360px]' : ''}`}
      >
        <div className="pointer-events-auto w-full flex flex-col items-center">
            {/* TOOLS */}
            <div className="relative flex items-center justify-center gap-8 md:gap-12 mb-8 px-4 text-stone-400">
                {/* TRANSCRIPTION INDICATOR - UPDATED POSITIONING */}
                <AnimatePresence>
                  {transcriptionStatus !== 'idle' && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: -50 }}
                       exit={{ opacity: 0, y: 10 }}
                       className="absolute left-1/2 -translate-x-1/2 bg-white dark:bg-stone-800 px-4 py-2 rounded-full shadow-lg border border-stone-100 dark:border-stone-700 flex items-center gap-2 whitespace-nowrap z-50 pointer-events-none"
                       style={{ top: '-10px' }}
                     >
                        {transcriptionStatus === 'transcribing' && (
                          <>
                            <Loader2 size={12} className="animate-spin text-emerald-500" />
                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500">Transcribing Audio...</span>
                          </>
                        )}
                        {transcriptionStatus === 'success' && (
                          <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500">Transcription Complete</span>
                          </>
                        )}
                        {transcriptionStatus === 'error' && (
                          <>
                            <AlertCircle size={12} className="text-red-500" />
                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-red-500">Transcription Failed</span>
                          </>
                        )}
                     </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={() => mediaInputRef.current?.click()} className="transition-all flex flex-col items-center gap-1 group hover:text-nous-text dark:hover:text-white" title="Upload Asset">
                    <ImageIcon size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={isRecording ? stopRecording : startRecording} className={`transition-all flex flex-col items-center gap-1 group ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-nous-text dark:hover:text-white'}`} title="Vocal Note">
                    {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />}
                </button>
                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800" />
                <button onClick={() => { setLiteMode(!liteMode); if(!liteMode) setDeepThinking(false); }} className={`transition-colors flex flex-col items-center gap-1 group ${liteMode ? 'text-cyan-500' : 'hover:text-nous-text dark:hover:text-white'}`} title="Lite Protocol">
                <Zap size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={() => { setDeepThinking(!deepThinking); if(!deepThinking) setLiteMode(false); }} className={`transition-colors flex flex-col items-center gap-1 group ${deepThinking ? 'text-amber-500' : 'hover:text-nous-text dark:hover:text-white'}`} title="Deep Mode">
                <BrainCircuit size={18} strokeWidth={1.5} className={`group-hover:scale-110 transition-transform ${deepThinking ? 'animate-pulse' : ''}`} />
                </button>
                <button onClick={() => setUseSearch(!useSearch)} className={`transition-colors flex flex-col items-center gap-1 group ${useSearch ? 'text-emerald-500' : 'hover:text-nous-text dark:hover:text-white'}`} title="Educational Grounding">
                <Globe size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={() => setFreshState(!freshState)} className={`transition-colors flex flex-col items-center gap-1 group ${freshState ? 'text-pink-500' : 'hover:text-nous-text dark:hover:text-white'}`} title="Bypass Logic">
                <Eraser size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800" />
                <button onClick={() => setIsHighFidelity(!isHighFidelity)} className={`transition-colors flex flex-col items-center gap-1 group ${isHighFidelity ? 'text-purple-500' : 'hover:text-nous-text dark:hover:text-white'}`} title="High-Fidelity (Couture Engine)">
                <Sparkles size={18} strokeWidth={1.5} className={`group-hover:scale-110 transition-transform ${isHighFidelity ? 'animate-pulse' : ''}`} />
                </button>
            </div>

            {/* CATEGORY TOGGLE & TONE CHIPS */}
            <div className="w-full mb-8 px-4 md:px-6 space-y-4">
              <div className="flex justify-center gap-2">
                {Object.keys(CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSelectedTone(null); }}
                    className={`px-4 py-1.5 rounded-full font-sans text-[8px] uppercase tracking-widest font-black transition-all ${selectedCategory === cat ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex md:flex-wrap md:justify-center items-center gap-2 px-2 md:px-0 min-w-max md:min-w-0">
                {CATEGORIES[selectedCategory].map((t) => (
                  <button 
                    key={t} onClick={() => setSelectedTone(t)} 
                    className={`
                      shrink-0 px-4 py-2 border rounded-full font-sans text-[9px] uppercase tracking-[0.2em] font-black transition-all duration-300
                      ${selectedTone === t 
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-lg' 
                        : 'bg-white/80 dark:bg-stone-900/80 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'}
                    `}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* FOOTER LINKS */}
            <div className="w-full px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 font-mono text-[9px] uppercase tracking-widest text-stone-400 border-t border-white/10 pt-6 pb-6 pb-safe bg-[#1C1C1C] backdrop-blur-md relative overflow-hidden">
                
                <div className="flex items-center gap-8 relative z-10 pl-2">
                    <button onClick={() => window.open('https://x.com/themimizine', '_blank')} className="hover:text-white transition-colors"><Twitter size={12} /></button>
                    <button onClick={() => window.open('https://www.instagram.com/themimizine/', '_blank')} className="hover:text-white transition-colors"><Instagram size={12} /></button>
                    <div className="w-px h-3 bg-white/20" />
                    <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile', detail_data: { section: 'patronage' } }))} className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors group">
                        <Users size={12} />
                        <span className="font-serif italic text-xs tracking-normal capitalize">Edition 04</span>
                    </button>
                </div>

                <button onClick={() => setShowColophon(true)} className="group flex items-center gap-2 text-white hover:text-red-300 transition-colors border-b border-white/20 hover:border-red-300 pb-0.5 font-serif italic text-sm normal-case tracking-normal relative z-10">
                <Mail size={12} />
                <span>open me</span>
                </button>

                <div className="flex items-center gap-6 relative z-10">
                    <button onClick={() => setLegalType('terms')} className="flex items-center gap-1 text-white hover:text-stone-300 transition-colors">
                        <Shield size={10} /> <span className="font-serif italic text-xs tracking-normal capitalize">Legal</span>
                    </button>
                    <div className="w-px h-3 bg-white/20" />
                    <div className="flex items-center gap-1.5 text-white">
                        <div className={`w-1.5 h-1.5 rounded-full ${systemStatus.oracle === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="font-serif italic text-xs tracking-normal capitalize">Studio Build</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Hidden Overlays */}
      <CuratorNote isOpen={showColophon} onClose={() => setShowColophon(false)} />
      <AnimatePresence>
        {legalType && <LegalOverlay type={legalType} onClose={() => setLegalType(null)} />}
      </AnimatePresence>
      <input type="file" id="media-upload" name="mediaUpload" ref={mediaInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,audio/*" />
    </div>
  );
};
