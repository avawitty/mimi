
// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaFile, ToneTag } from '../types';
import { useRecorder } from '../hooks/useRecorder';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { Plus, BrainCircuit, X, Globe, Mic, Loader2, Square, Radio, Mail, Info, Sparkles, AlertCircle, Eraser, Zap, Image as ImageIcon, Link as LinkIcon, Twitter, Instagram, Shield, Users } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';
import { CuratorNote } from './CuratorNote';
import { useUser } from '../contexts/UserContext';
import { LegalOverlay } from './LegalOverlay';

const TONE_OPTIONS: ToneTag[] = ['chic', 'nostalgia', 'dream', 'unhinged', 'panic', 'editorial'];

const PROMPTS_BY_TONE: Record<ToneTag, string[]> = {
  chic: [
    "What is the silhouette of your current desire?",
    "If your aesthetic was a structural law, what would it decree?",
    "Which designer's shadow are you currently occupying?"
  ],
  nostalgia: [
    "Which memory are you currently over-editing?",
    "What is the scent of the decade you're trying to reclaim?",
    "If your childhood was a vintage editorial, who would photograph it?"
  ],
  dream: [
    "If your subconscious was a gallery, what would be the first piece?",
    "What is the texture of the lie you told yourself last night?",
    "Which impossible space are you currently architecting?"
  ],
  unhinged: [
    "What structural lie are you finally ready to discard?",
    "If chaos was a silk garment, how would you drape it?",
    "What is the most beautiful thing about your current debris?"
  ],
  panic: [
    "What is the most beautiful thing about your current instability?",
    "How does the simulation feel when it glitches for you?",
    "If your anxiety was an archival motif, what would it look like?"
  ],
  editorial: [
    "How would you headline your own silence?",
    "What is the ROI of being seen in this specific light?",
    "If your life was a layout, where would you place the void?"
  ]
};

export const InputStudio: React.FC<{
  onRefine: any, 
  isThinking: boolean, 
  initialValue?: string,
  initialMedia?: MediaFile[],
  continuumContext?: any
}> = ({ onRefine, isThinking, initialValue, initialMedia, continuumContext }) => {
  const { systemStatus } = useUser();
  const { logEvent } = useTasteLogging();
  
  const [input, setInput] = useState(initialValue || '');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [deepThinking, setDeepThinking] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  const [freshState, setFreshState] = useState(false);
  const [useSearch, setUseSearch] = useState(true); 
  const [selectedTone, setSelectedTone] = useState<ToneTag>('chic');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showColophon, setShowColophon] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);
  
  // CONTINUUM STATE
  const [activeProvocation, setActiveProvocation] = useState<string | null>(null);
  
  const { isRecording, startRecording, stopRecording, audioBlob, permissionError } = useRecorder();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromptIndex(prev => (prev + 1) % PROMPTS_BY_TONE[selectedTone].length);
    }, 10000);
    return () => clearInterval(timer);
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
    if (initialMedia && initialMedia.length > 0) setMediaFiles(initialMedia);
  }, [initialMedia]);

  useEffect(() => {
    if (audioBlob) {
      const handleTranscription = async () => {
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(audioBlob);
          });
          const text = await transcribeAudio(base64);
          setInput(prev => prev ? `${prev}\n\n${text}` : text);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Vocal shard transcribed.", icon: <Mic size={14} className="text-emerald-500" /> } }));
        } catch (e) { console.error(e); } finally { setIsTranscribing(false); }
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
          isPublic: true 
      });
    }
  }, [input, mediaFiles, isThinking, selectedTone, useSearch, deepThinking, liteMode, freshState, onRefine, activeProvocation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setMediaFiles(prev => [...prev, { 
            type: file.type.startsWith('audio') ? 'audio' : 'image', 
            url: URL.createObjectURL(file), 
            data: base64.split(',')[1], 
            mimeType: file.type 
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center relative overflow-x-hidden transition-all duration-1000 bg-transparent">
      <CuratorNote isOpen={showColophon} onClose={() => setShowColophon(false)} />
      <AnimatePresence>
        {legalType && <LegalOverlay type={legalType} onClose={() => setLegalType(null)} />}
      </AnimatePresence>
      
      <div className="w-full max-w-4xl flex-1 flex flex-col items-center min-h-0 relative px-4 mt-8 md:mt-24 overflow-y-auto no-scrollbar transition-all z-0">
        
        {/* PROMPT HEADER / CONTINUUM PROVOCATION */}
        <div className="flex flex-col items-center justify-center mb-8 px-6 relative w-full text-center space-y-6">
           <AnimatePresence mode="wait">
             {activeProvocation ? (
               <motion.div
                 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm shadow-xl max-w-2xl"
               >
                  <div className="flex items-center gap-2 text-emerald-500">
                      <LinkIcon size={14} />
                      <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Continuum Active</span>
                  </div>
                  <p className="font-serif italic text-2xl md:text-3xl text-nous-text dark:text-white leading-tight">
                      "{activeProvocation}"
                  </p>
               </motion.div>
             ) : (
               <motion.p 
                 key={`${selectedTone}-${promptIndex}`}
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.8, y: 0 }} exit={{ opacity: 0, y: -10 }}
                 className="font-serif italic text-lg md:text-2xl text-stone-500 dark:text-stone-400 text-center leading-tight max-w-xl"
               >
                  "{PROMPTS_BY_TONE[selectedTone][promptIndex]}"
               </motion.p>
             )}
           </AnimatePresence>
        </div>

        <div className="w-full relative">
          <textarea 
            id="mimi-input"
            name="input"
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={activeProvocation ? "Type your answer..." : "Deposit your memetic debris..."}
            className="w-full bg-transparent border-none font-serif italic focus:outline-none resize-none leading-[0.9] text-center tracking-tight text-nous-text dark:text-white text-5xl md:text-7xl lg:text-8xl placeholder:text-stone-300/50 dark:placeholder:text-stone-700/50 relative transition-colors" 
            style={{ minHeight: '200px' }}
          />
        </div>
        
        {isTranscribing && (
          <div className="flex items-center justify-center gap-2 text-emerald-500 animate-pulse py-4">
            <Loader2 size={12} className="animate-spin" />
            <span className="font-sans text-[8px] uppercase tracking-widest font-black">Transcribing Shard...</span>
          </div>
        )}

        <AnimatePresence>
            {mediaFiles.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 overflow-x-auto no-scrollbar p-2 mb-12">
                    {mediaFiles.map((file, idx) => (
                        <div key={idx} className="relative w-20 h-20 border border-stone-200 dark:border-stone-800 rounded-sm overflow-hidden bg-white shadow-lg shrink-0">
                          {file.type === 'image' ? <img src={file.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Radio size={16} className="text-emerald-500" /></div>}
                          <button onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 p-1 bg-black/60 text-white rounded-full"><X size={8} /></button>
                        </div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="w-full flex flex-col items-center shrink-0 pb-6 md:pb-12 transition-all z-30 relative bg-gradient-to-t from-nous-base dark:from-stone-950 via-nous-base dark:via-stone-950 to-transparent pt-12">
        
        {/* INPUT REQUIRED INDICATOR OR MAIN ACTION */}
        <div className="flex flex-col items-center justify-center w-full px-4 mb-8 min-h-[60px] relative">
            <AnimatePresence mode="wait">
              {(input.trim() || mediaFiles.length > 0) ? (
                <motion.button 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
                    onClick={triggerAccession} disabled={isThinking} 
                    className={`group flex items-center justify-center gap-3 px-12 py-5 rounded-full shadow-2xl hover:shadow-xl active:scale-95 transition-all relative ${deepThinking ? 'bg-amber-50 dark:bg-stone-900 border border-amber-500/30 text-amber-900 dark:text-amber-500 ring-2 ring-amber-500/10' : 'bg-nous-text dark:bg-white text-white dark:text-black'}`}
                >
                  {isThinking ? (
                     <>
                       <Loader2 size={14} className="animate-spin" />
                       <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black">
                        {deepThinking ? 'AUDITING DEEP...' : 'CALIBRATING...'}
                       </span>
                     </>
                  ) : (
                     <>
                       <Sparkles size={14} className={deepThinking ? 'animate-pulse' : ''} />
                       <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black">
                        {activeProvocation ? 'Bind Response' : deepThinking ? 'Imperial Refraction' : 'Generate Zine'}
                       </span>
                     </>
                  )}
                </motion.button>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} className="font-serif italic text-stone-400 text-sm">
                   Input Required to Manifest
                </motion.div>
              )}
            </AnimatePresence>
        </div>
        
        {/* TOOLS ROW */}
        <div className="flex items-center justify-center gap-8 md:gap-12 mb-8 px-4">
            <button onClick={() => mediaInputRef.current?.click()} className="text-stone-400 hover:text-emerald-500 transition-all duration-300 transform hover:scale-110" title="Inject Shard">
                <Plus size={24} strokeWidth={1} />
            </button>
            <button onClick={isRecording ? stopRecording : startRecording} className={`transition-all duration-500 ${isRecording ? 'text-red-500 scale-125 animate-pulse' : permissionError ? 'text-red-300' : 'text-stone-400 hover:text-emerald-500'}`} title="Vocal Note">
                {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} strokeWidth={1} />}
            </button>
            <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-2" />
            <button onClick={() => { setLiteMode(!liteMode); if(!liteMode) setDeepThinking(false); }} className={`transition-colors flex items-center gap-2 ${liteMode ? 'text-cyan-500' : 'text-stone-400 hover:text-stone-600'}`} title="Lite Protocol (Low Latency)">
              <Zap size={18} strokeWidth={1} />
            </button>
            <button onClick={() => { setDeepThinking(!deepThinking); if(!deepThinking) setLiteMode(false); }} className={`transition-colors flex items-center gap-2 ${deepThinking ? 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-stone-400 hover:text-stone-600'}`} title="Deep Mode (Enhanced Heuristics)">
              <BrainCircuit size={18} strokeWidth={1} className={deepThinking ? 'animate-pulse' : ''} />
            </button>
            <button onClick={() => setUseSearch(!useSearch)} className={`transition-colors ${useSearch ? 'text-emerald-500' : 'text-stone-400 hover:text-stone-600'}`} title="Search Grounding"><Globe size={18} strokeWidth={1} /></button>
            <button onClick={() => setFreshState(!freshState)} className={`transition-colors flex items-center gap-2 ${freshState ? 'text-pink-500' : 'text-stone-400 hover:text-stone-600'}`} title="Bypass Logic (Fresh State)">
              <Eraser size={18} strokeWidth={1} />
            </button>
        </div>

        {/* TONE SELECTOR */}
        <div className="w-full overflow-x-auto no-scrollbar mb-8 px-0 md:px-6">
          <div className="flex md:flex-wrap md:justify-center items-center gap-4 px-6 md:px-0 min-w-max md:min-w-0">
            {TONE_OPTIONS.map((t) => (
              <button 
                key={t} onClick={() => setSelectedTone(t)} 
                className={`shrink-0 px-6 py-2 rounded-full font-serif italic text-lg transition-all duration-300 border ${selectedTone === t ? 'bg-nous-text dark:bg-white text-white dark:text-stone-900 border-transparent shadow-lg scale-105' : 'bg-transparent border-stone-200 dark:border-stone-800 text-stone-400 hover:border-stone-400 dark:hover:border-stone-600 hover:text-stone-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* FOOTER STATUS - UPGRADED CONTROL BAR */}
        <div className="pt-6 border-t border-black/5 dark:border-white/5 w-full px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
            {/* Left: Social & Identity */}
            <div className="flex items-center gap-6">
                <button onClick={() => window.open('https://x.com/themimizine', '_blank')} className="text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
                    <Twitter size={14} />
                </button>
                <button onClick={() => window.open('https://www.instagram.com/themimizine/', '_blank')} className="text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
                    <Instagram size={14} />
                </button>
                <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
                <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile', detail_data: { section: 'patronage' } }))} className="flex items-center gap-2 text-stone-400 hover:text-emerald-500 transition-colors group">
                    <Users size={14} />
                    <span className="font-sans text-[7px] uppercase tracking-widest font-black">Members</span>
                </button>
            </div>

            {/* Center: The Envelope Trigger (MINIMAL TEXT LINK) */}
            <button 
                onClick={() => setShowColophon(true)} 
                className="group flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
            >
               <Mail size={14} strokeWidth={1} />
               <span className="font-serif italic text-sm underline decoration-1 decoration-red-200 underline-offset-4 group-hover:decoration-red-500 transition-all">
                  open me
               </span>
            </button>

            {/* Right: Legal & Status */}
            <div className="flex items-center gap-6">
                <button onClick={() => setLegalType('terms')} className="flex items-center gap-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
                    <Shield size={12} />
                    <span className="font-sans text-[7px] uppercase tracking-widest font-black">Legal</span>
                </button>
                <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
                <div className="flex items-center gap-2 opacity-40">
                    <div className={`w-1 h-1 rounded-full ${systemStatus.oracle === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-sans text-[6px] uppercase tracking-widest">v4.4</span>
                </div>
            </div>
        </div>
      </div>
      <input type="file" ref={mediaInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,audio/*" />
    </div>
  );
};
