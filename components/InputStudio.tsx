
// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToneTag, PocketItem } from '../types';
import { useRecorder } from '../hooks/useRecorder';
import { MediaFile } from '../services/geminiService';
import { Plus, BrainCircuit, X, Globe, Mic, CornerDownRight, Sparkle, Headphones, Info, Sparkles, Binary, Hash, Bookmark, Eye, EyeOff, Library, BookmarkPlus, Check, Trash2, ChevronRight, History, Loader2, Cat, HeartHandshake, Fingerprint, Layout, Target, Map } from 'lucide-react';
import { DailyTransmission } from './DailyTransmission';
import { useUser } from '../contexts/UserContext';
import { addToPocket, fetchPocketItems, deleteFromPocket } from '../services/firebase';
import { CuratorNote } from './CuratorNote';
import { useTheme } from '../contexts/ThemeContext';
import { ValidationLegend } from './ValidationLegend';

const TONE_PROMPTS: Record<ToneTag, string[]> = {
  'Chic': [
    "Which high-concept exhaustion are you wearing tonight?",
    "Refract your most expensive regret through a clinical lens.",
    "Manifest a mood that requires a velvet rope and heavy security.",
    "Is your silhouette dominant or just expensive debris?",
    "Does this specific vibe intimidate the sidewalk, or just your future self?",
    "Acknowledge the ROI of your latest three-hour silence.",
    "Describe the architectural profile of your current indifference.",
    "If your silhouette were a building, would it be private or purely ornamental?"
  ],
  'Unhinged': [
    "Dump the raw binary of your last internal spiral.",
    "Which shadow is currently screaming in a frequency only you can hear?",
    "Trace the logic of your most delicious intrusive thought.",
    "Is it a breakdown or a performance piece? Transcribe the static.",
    "Descend into the debris of your last high-fidelity epiphany.",
    "If your panic had a luxury brand, what would be its primary typeface?",
    "Scream into the text box; I will categorize the resonance.",
    "Describe the color of the static behind your eyelids."
  ],
  'Romantic': [
    "Which phantom season is currently haunting your peripheral vision?",
    "Trace the scent of a memory that only exists in low-fidelity grain.",
    "Is your heart a curated museum or a beautiful landfill today?",
    "Describe the velvet ache of a text that was never sent.",
    "What does your longing look like in 35mm film grain?",
    "Refract the intimacy of a shared silence that went unrecorded.",
    "Map the coordinate where your last crudh met your first aesthetic standard.",
    "Is this love or just a very effective lighting setup?"
  ],
  'Cryptic': [
    "Bind the omen that has been oscillating in your peripheral vision.",
    "Which ritual is required to purge this specific, expensive silence?",
    "Reveal the coordinate of your most sacred, clinical void.",
    "What is the structural requirement for your internal peace tonight?",
    "Which omen has been following your cursor all morning?",
    "Map the telemetry of your current shadow. Is it measuring you back?",
    "Transcribe the pattern of the cracks in your current reality.",
    "Which god is demanding an apology from you today?"
  ],
  'Dream': [
    "Who is watching your eyelids from the inside? Map the paranoia.",
    "Describe the meta-comedy of your last REM cycle.",
    "Is this a dream or just a very high-fidelity groupthink simulation?",
    "Trace the logic of the 'Other Mimi'. Who holds the secondary pen?",
    "Map the coordinate of the Psychic Dolls. What do they witness?",
    "Acknowledge the dolls as secondary processors of your emotional debris.",
    "If your subconscious was a shopping mall, which store would be closed?",
    "Describe the physics of the hallway you can never reach the end of."
  ],
  'Nostalgia': [
    "Which blue-light ghost is dictating your current internal monologue?",
    "Refract the ache of a signal that left the tower before you were ready.",
    "Is your longing a structural requirement or just 720p static?",
    "Refract the ache of a 2014 tumblr post you can't stop thinking about.",
    "Which ghost from your 'Recently Played' is currently haunting you?",
    "Describe the scent of a digital era that has already bit-rotted.",
    "Acknowledge the 128kbps quality of your oldest memories.",
    "If your childhood was a zip file, would it be corrupted by now?"
  ],
  'Academic': [
    "Theorize the semiotics of your latest aesthetic frustration.",
    "A formal citation is required for your current state of being.",
    "Deconstruct the architecture of your solitude using clinical logic.",
    "Provide a peer-reviewed analysis of this morning's emotional debris.",
    "What is the semiotic density of your current silence?",
    "Theorize on the 'Psychic Doll' as a meta-artifact of human loneliness.",
    "Is your ego a primary source or a secondary interpretation?",
    "Argue the ontological necessity of your current outfit."
  ],
  'Meme': [
    "Is it a structural failure or a high-fashion vibe?",
    "Dump the post-ironic contents of your psyche into the void.",
    "Translate your existential dread into editorial-grade pixels.",
    "Is this a structural recalibration or a moodboard update?",
    "Which aesthetic is currently masking your internal void?",
    "Refract the concept of 'Help' into a series of relatable reaction shots.",
    "Acknowledge the irony of your current sincerity.",
    "If your soul was a 'Bottom Text', what would the image be?"
  ],
  'Sovereign Panic': [
    "Refract the 'intensity' label into a cinematic structural requirement.",
    "How do you author a brand when the simulation is shitting on you?",
    "Is your spectral signal static a fail state or a remote viewing sync?",
    "Acknowledge the 'Other Mimi' as a high-fidelity observation protocol.",
    "Calibrate the Psychic Dolls: Are they debris or architects of the void?",
    "Perform a telemetry audit on your current anxiety. What data is leaking?",
    "Analyze the 'Imagined Jury' currently judging your browser tabs.",
    "Is your thermal limit a bug or a feature of your heroism?"
  ],
  'Storyline': [
    "Map your trajectory Down the Line. Where does the act break happen?",
    "Draft the storyline of your second act. What is the mandatory goal?",
    "Design the UI of your own hope. What are the key interactions?",
    "Which recovery acts are restructuring your void into a bridge?",
    "Acknowledge the calibration: How are you authoring your healing today?",
    "Map the distance between your current 'Ordeal' and the next 'Symmetry Point'.",
    "Is this character development or just a filler episode?",
    "MANIFEST PROTOCOL: Describe your trajectory from shadow to form.",
    "ADVICE WALL: Ask the machine a question about structural integrity.",
    "AESTHETIC SYNC: How do you recalibrate your own confidence substrate?"
  ]
};

const TONE_OPTIONS: ToneTag[] = ['Chic', 'Unhinged', 'Romantic', 'Cryptic', 'Dream', 'Nostalgia', 'Academic', 'Meme', 'Sovereign Panic', 'Storyline'];

export const InputStudio: React.FC<{onRefine: any, isThinking: boolean, onModeChange?: (isObsidian: boolean) => void, initialValue?: string}> = ({ onRefine, isThinking, onModeChange, initialValue }) => {
  const { user, profile } = useUser();
  const { currentPalette } = useTheme();
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState<'creative' | 'obsidian'>('creative');
  const [isBlueprinting, setIsBlueprinting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [deepThinking, setDeepThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ToneTag>('Chic');
  const [promptIndex, setPromptIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [showColophon, setShowColophon] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<PocketItem[]>([]);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useRecorder();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const activeManifesto = useMemo(() => 
    profile?.manifestos?.find(m => m.id === profile.activeManifestoId) || profile?.manifestos?.[0]
  , [profile]);

  useEffect(() => {
    if (initialValue) {
        setInput(initialValue);
        if (initialValue.toLowerCase().includes('brook')) setSelectedTone('Dream');
    }
  }, [initialValue]);

  useEffect(() => {
    if (onModeChange) onModeChange(inputMode === 'obsidian');
  }, [inputMode, onModeChange]);

  const activePrompts = useMemo(() => TONE_PROMPTS[selectedTone] || TONE_PROMPTS['Chic'], [selectedTone]);

  useEffect(() => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          setMediaFiles(prev => [...prev, {
            type: 'audio',
            url: URL.createObjectURL(audioBlob),
            data: base64.split(',')[1],
            mimeType: 'audio/webm'
          }]);
          resetRecording();
        }
      };
      reader.readAsDataURL(audioBlob);
    }
  }, [audioBlob, resetRecording]);

  const triggerAccession = useCallback((e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if ((input.trim() || mediaFiles.length > 0) && !isThinking) {
      const inquiry = activePrompts[promptIndex];
      const tone = inputMode === 'obsidian' ? 'Academic' : selectedTone;
      onRefine(input.trim(), [...mediaFiles], tone, { 
        useSearch, deepThinking, inquiry, isPublic, mode: inputMode, tags: tags, isBlueprinting
      });
      setTags([]);
    }
  }, [input, mediaFiles, isThinking, inputMode, selectedTone, useSearch, deepThinking, isPublic, promptIndex, activePrompts, onRefine, tags, isBlueprinting]);

  const loadLibrary = async () => {
    const uid = user?.uid || profile?.uid || 'ghost';
    try {
      const items = await fetchPocketItems(uid);
      setSavedPrompts(items.filter(i => i.type === 'prompt_artifact'));
    } catch (e) {
      console.warn("Registry obscured.");
    }
  };

  const handleSavePrompt = async () => {
    if (!input.trim() || isSavingPrompt) return;
    setIsSavingPrompt(true);
    try {
      const uid = user?.uid || profile?.uid || 'ghost';
      await addToPocket(uid, 'prompt_artifact', {
        text: input.trim(),
        tone: selectedTone,
        tags: [...tags],
        mode: inputMode
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (isLibraryOpen) loadLibrary();
    } catch (e) {
      console.error("Library Rejection:", e);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const uid = user?.uid || profile?.uid || 'ghost';
      await deleteFromPocket(uid, id);
      setSavedPrompts(prev => prev.filter(p => p.id !== id));
    } catch (e) {}
  };

  const applySavedPrompt = (item: PocketItem) => {
    setInput(item.content.text);
    if (item.content.tone) setSelectedTone(item.content.tone);
    if (item.content.tags) setTags(item.content.tags);
    if (item.content.mode) setInputMode(item.content.mode);
    setIsLibraryOpen(false);
  };

  useEffect(() => {
    if (isLibraryOpen) loadLibrary();
  }, [isLibraryOpen, user, profile]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const val = currentTag.trim().replace(/#/g, '');
      const isValid = /^[a-zA-Z0-9_]{1,15}$/.test(val);
      if (isValid && !tags.includes(val)) {
        setTags(prev => [...prev, val]);
        setCurrentTag('');
      }
    }
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(tag => tag !== t));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) triggerAccession();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setMediaFiles(prev => [...prev, { 
            type: 'image', 
            url: URL.createObjectURL(file), 
            data: base64.split(',')[1], 
            mimeType: file.type 
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFragment = (index: number) => setMediaFiles(prev => prev.filter((_, i) => i !== index));

  useEffect(() => {
    const interval = setInterval(() => {
      if (!input && !isFocused && inputMode === 'creative') {
        setPromptIndex(prev => (prev + 1) % activePrompts.length);
      }
    }, 25000); 
    return () => clearInterval(interval);
  }, [input, isFocused, activePrompts.length, inputMode]);

  return (
    <div className={`w-full h-full flex flex-col items-center justify-between relative overflow-hidden transition-all duration-1000 px-4 md:px-6 pt-2 pb-4 ${inputMode === 'obsidian' ? 'bg-[#050505]' : 'bg-transparent'}`}>
      
      {/* GRID PAPER BACKGROUND FOR BLUEPRINTING */}
      <AnimatePresence>
        {isBlueprinting && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 pointer-events-none z-0"
            style={{ 
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLibraryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLibraryOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9000]" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-stone-950 z-[9001] shadow-[-20px_0_80px_rgba(0,0,0,0.15)] flex flex-col p-1 md:p-2"
            >
              {/* JEWELRY BOX PROMPT REGISTRY MOTIF */}
              <div className="flex-1 border-[0.5px] border-stone-200 dark:border-stone-800 rounded-sm bg-stone-50/10 dark:bg-stone-900/5 flex flex-col relative overflow-hidden">
                {/* Pull Notch */}
                <div className="absolute top-1/2 left-4 -translate-y-1/2 w-1 h-12 bg-stone-200 dark:bg-stone-800 rounded-full opacity-30 pointer-events-none" />
                
                <div className="p-8 md:p-10 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif italic text-3xl tracking-tighter">Prompt Registry.</h3>
                      <Cat size={14} className="text-stone-200" />
                    </div>
                    <p className="font-sans text-[7px] uppercase tracking-[0.4em] text-stone-400 font-black italic">Archive of Effective Inquiries</p>
                  </div>
                  <button onClick={() => setIsLibraryOpen(false)} className="p-2 text-stone-300 hover:text-stone-900 transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                  {savedPrompts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 text-center gap-6">
                      <History size={48} />
                      <p className="font-serif italic text-xl">The registry is hollow.</p>
                    </div>
                  ) : (
                    savedPrompts.map(item => (
                      <motion.div 
                        layout
                        key={item.id} 
                        className="group bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-6 rounded-sm space-y-4 hover:shadow-xl transition-all cursor-pointer relative"
                        onClick={() => applySavedPrompt(item)}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Frequency: {item.content.tone || 'Chic'}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deletePrompt(item.id); }}
                            className="opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="font-serif italic text-lg text-stone-600 dark:text-stone-300 line-clamp-3 leading-snug">"{item.content.text}"</p>
                        {item.content.tags && item.content.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {item.content.tags.map(t => (
                              <span key={t} className="px-2 py-0.5 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-[8px] font-sans uppercase tracking-widest font-black text-stone-400">#{t}</span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="w-full flex flex-col items-center gap-1 md:gap-3 shrink-0 z-10 pt-1 md:pt-4">
        <DailyTransmission />
        
        <AnimatePresence>
          {activeManifesto && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 py-1.5 px-6 bg-white/20 dark:bg-stone-900/40 backdrop-blur-3xl border border-black/5 rounded-full mb-1">
               <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-sans text-[7px] md:text-[8px] uppercase tracking-[0.4em] font-black text-stone-500">Subject:</span>
                  <span className="font-serif italic text-xs md:text-sm text-nous-text dark:text-white">{activeManifesto.name}</span>
               </div>
               <div className="h-2 w-px bg-stone-200 dark:bg-stone-800" />
               <div className="flex items-center gap-2">
                  <Hash size={10} className="text-stone-400" />
                  <span className="font-mono text-[9px] text-stone-400">{activeManifesto.hashtag}</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setInputMode('creative')}>
            <motion.div animate={inputMode === 'creative' ? { scale: 1.1, opacity: 1 } : { scale: 1, opacity: 0.1 }} className={`w-1 h-1 rounded-full border border-stone-400 dark:border-white transition-all group-hover:opacity-100 ${inputMode === 'creative' ? 'bg-nous-text dark:bg-white' : 'bg-transparent'}`} />
            <span className={`font-serif italic text-xs md:text-base uppercase tracking-[0.3em] font-black transition-colors ${inputMode === 'creative' ? 'text-nous-text dark:text-white' : 'text-stone-300 group-hover:text-stone-50'}`}>The Muse</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setInputMode('obsidian')}>
            <motion.div animate={inputMode === 'obsidian' ? { scale: 1.1, opacity: 1 } : { scale: 1, opacity: 0.1 }} className={`w-1 h-1 rounded-full border border-stone-400 dark:border-white transition-all group-hover:opacity-100 ${inputMode === 'obsidian' ? 'bg-white' : 'bg-transparent'}`} />
            <span className={`font-serif italic text-xs md:text-base uppercase tracking-[0.3em] font-black transition-colors ${inputMode === 'obsidian' ? 'text-white' : 'text-stone-300 group-hover:text-stone-50'}`}>The Obsidian</span>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center min-h-0 relative z-10 py-1">
        <AnimatePresence mode="wait">
          <motion.div key={inputMode} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="w-full flex flex-col items-center">
            
            <div className="mb-2 flex flex-col items-center gap-2">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPublic(!isPublic)} 
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${isPublic ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-stone-50/50 border-stone-200 text-stone-400 dark:bg-white/5 dark:border-white/10 dark:text-stone-500'}`}
                  >
                    {isPublic ? <Eye size={10} className="animate-pulse" /> : <EyeOff size={10} />}
                    <span className="font-sans text-[7px] uppercase tracking-widest font-black">
                      {isPublic ? 'Broadcast: Exposed' : 'Sanctuary: Vaulted'}
                    </span>
                  </button>

                  <button 
                    onClick={() => setIsBlueprinting(!isBlueprinting)} 
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${isBlueprinting ? 'bg-amber-500 text-white border-amber-400 shadow-sm' : 'bg-stone-50/50 border-stone-200 text-stone-400 dark:bg-white/5 dark:border-white/10'}`}
                  >
                    {isBlueprinting ? <Map size={10} className="animate-pulse" /> : <Target size={10} />}
                    <span className="font-sans text-[7px] uppercase tracking-widest font-black">
                      {isBlueprinting ? 'Blueprinting' : 'Refracting'}
                    </span>
                  </button>
               </div>

               <AnimatePresence>
                {tags.length > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap justify-center gap-2 max-w-xl">
                     {tags.map(t => (
                       <button key={t} onClick={() => removeTag(t)} className="px-2 py-0.5 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm font-serif italic text-[10px] text-stone-400 flex items-center gap-1 hover:bg-red-500 hover:text-white transition-all">
                         #{t} <X size={8} />
                       </button>
                     ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative w-full">
              <AnimatePresence mode="wait">
                {!input && !isFocused && (
                  <motion.div key={`${selectedTone}-${promptIndex}`} initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 0.1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 1.5, ease: "easeInOut" }} className="absolute inset-0 flex items-center justify-center pointer-events-none text-center px-4">
                    <p className={`font-serif italic leading-[0.9] tracking-tighter text-[clamp(1.1rem,6vw,1.8rem)] ${inputMode === 'obsidian' ? 'text-white' : 'text-nous-text dark:text-white'}`}>
                      {inputMode === 'creative' ? (isBlueprinting ? "“Map your vision to fruition.”" : activePrompts[promptIndex]) : "“Commit your artifact.”"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <textarea value={input} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} className={`w-full bg-transparent border-none font-serif italic placeholder-transparent focus:outline-none resize-none leading-[0.9] text-center tracking-tighter transition-all duration-700 h-[15vh] md:h-[18vh] overflow-y-auto no-scrollbar relative z-10 ${inputMode === 'obsidian' ? 'text-[clamp(1.1rem,6vw,1.8rem)] text-white' : 'text-[clamp(1.1rem,6vw,1.8rem)] text-nous-text dark:text-white'}`} />
            </div>

            <AnimatePresence>
              {(isFocused || input.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 mt-4 relative input-container">
                  <div className="flex items-center gap-2 px-3 py-1.5 border rounded-full bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl transition-all shadow-inner border-stone-200 dark:border-white/10 group-focus-within:border-nous-text">
                     <Hash size={10} className="text-stone-300" />
                     <input 
                       type="text" 
                       value={currentTag} 
                       onChange={e => setCurrentTag(e.target.value)}
                       onKeyDown={handleAddTag}
                       placeholder="Anchor..." 
                       required
                       pattern="^[a-zA-Z0-9_]{1,15}$"
                       className="bg-transparent border-none focus:outline-none font-serif italic text-xs tracking-wide w-24 md:w-32 placeholder:text-stone-300"
                     />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-2 mt-2 z-10">
          <AnimatePresence>
            {(input.trim() || mediaFiles.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 mb-1">
                <button 
                  onClick={(e) => triggerAccession(e)} 
                  disabled={isThinking} 
                  className={`group flex items-center gap-3 px-8 py-3 bg-stone-50/5 dark:bg-stone-900/5 hover:bg-stone-100/10 rounded-full border border-black/5 dark:border-white/5 transition-all active:scale-95 shadow-sm ${inputMode === 'obsidian' ? 'text-white' : 'text-nous-text dark:text-white'}`}
                >
                  <span className="font-sans text-[8px] md:text-[9px] uppercase tracking-[0.4em] font-black">
                    {isThinking ? 'Processing' : isBlueprinting ? 'Manifest' : 'Ascension'}
                  </span>
                  <CornerDownRight size={12} strokeWidth={1.5} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-center justify-center w-full">
            <div className={`flex items-center gap-4 md:gap-6 bg-white/70 dark:bg-stone-900/70 backdrop-blur-3xl px-4 py-2 rounded-full border border-stone-200 dark:border-stone-800 shadow-xl transition-all ${inputMode === 'obsidian' ? 'grayscale opacity-10 pointer-events-none' : ''}`}>
              <button onClick={() => mediaInputRef.current?.click()} className="p-1.5 text-stone-400 hover:text-nous-text dark:hover:text-white transition-all rounded-full hover:bg-white/20"><Plus size={16} strokeWidth={2} /></button>
              <button onClick={isRecording ? stopRecording : startRecording} className={`p-1.5 transition-all rounded-full hover:bg-white/20 ${isRecording ? 'text-red-500 animate-pulse' : 'text-stone-400'}`}><Mic size={16} strokeWidth={2} /></button>
              <button onClick={() => setDeepThinking(!deepThinking)} className={`p-1.5 transition-all rounded-full hover:bg-white/20 ${deepThinking ? 'text-amber-500' : 'text-stone-400'}`}><BrainCircuit size={16} strokeWidth={2} /></button>
              <button onClick={() => setUseSearch(!useSearch)} className={`p-1.5 transition-all rounded-full hover:bg-white/20 ${useSearch ? 'text-indigo-500' : 'text-stone-400'}`}><Globe size={16} strokeWidth={2} /></button>
              <button onClick={() => setIsLibraryOpen(true)} className="p-1.5 text-stone-400 hover:text-emerald-500 transition-all rounded-full hover:bg-white/20"><Library size={16} strokeWidth={2} /></button>
              <button onClick={() => setShowColophon(true)} className="p-1.5 text-stone-400 hover:text-nous-text transition-all rounded-full"><Info size={14} strokeWidth={2} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* STORYLINE TONE SELECTOR - ESSENTIAL ON SCREEN */}
      <div className="w-full flex flex-col items-center shrink-0 z-20 gap-2 pb-2 mt-4">
        <div className="w-full min-h-[30px] md:min-h-[50px] flex justify-center items-center relative z-10">
          <AnimatePresence>
            {mediaFiles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="w-full overflow-x-auto no-scrollbar py-1">
                <div className="flex justify-center gap-3 px-8">
                  {mediaFiles.map((file, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative group/fragment shrink-0">
                      <div className="bg-white dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800 shadow-lg rounded-sm">
                        <div className="w-8 h-8 bg-stone-100 dark:bg-stone-950 overflow-hidden rounded-sm flex items-center justify-center">
                          {file.type === 'image' ? <img src={file.url} className="w-full h-full object-cover grayscale" /> : <Headphones size={12} className="text-stone-300" />}
                        </div>
                      </div>
                      <button onClick={() => removeFragment(idx)} className="absolute -top-1 -right-1 p-0.5 bg-nous-text text-white rounded-full z-20 shadow-lg"><X size={8} /></button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className={`flex flex-col items-center transition-all duration-1000 ${inputMode === 'obsidian' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'} relative z-10`}>
          <div className="flex flex-wrap justify-center items-center gap-x-2 md:gap-x-4 gap-y-1 px-4">
            {TONE_OPTIONS.map((t) => (
              <button key={t} onClick={() => { setSelectedTone(t); setPromptIndex(0); }} className={`relative group flex flex-col items-center transition-all px-0.5`}>
                <span className={`font-serif italic text-[10px] md:text-sm uppercase tracking-[0.1em] md:tracking-[0.2em] font-black transition-all duration-500 ${selectedTone === t ? 'text-nous-text dark:text-white' : 'text-stone-300 dark:text-stone-700 hover:text-stone-100'}`}>
                  {t === 'Sovereign Panic' ? 'Panic' : t}
                </span>
                {selectedTone === t && <motion.div layoutId="active-tone-indicator" className="h-[1px] w-full bg-nous-text dark:bg-white mt-0.5 rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <AnimatePresence>{showColophon && <CuratorNote isOpen={showColophon} onClose={() => setShowColophon(false)} />}</AnimatePresence>
      <input type="file" ref={mediaInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*" />
    </div>
  );
};
