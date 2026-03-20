import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaFile, ToneTag, PocketItem, ZineGenerationOptions } from '../types';
import { useRecorder } from '../hooks/useRecorder';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { Plus, BrainCircuit, X, Globe, Mic, Loader2, Square, Check, Radio, Mail, Info, Sparkles, AlertCircle, Eraser, Zap, Image as ImageIcon, Link as LinkIcon, Twitter, Instagram, Shield, Users, ArrowUpRight, FolderOpen, Paperclip, ChevronLeft, ChevronRight, GripVertical, FileText, Filter, Wand2, ChevronDown } from 'lucide-react';
import { transcribeAudio, compressImage, generateTagsFromMedia, analyzeImageAesthetic } from '../services/geminiService';
import { ZineConfiguration } from './ZineConfiguration';
import { TagGenerator } from './TagGenerator';
import { SUPERINTELLIGENCE_PROMPTS } from '../constants';
import { CuratorNote } from './CuratorNote';
import { useUser } from '../contexts/UserContext';
import { LegalOverlay } from './LegalOverlay';
import { fetchPocketItems } from '../services/firebase';

const CATEGORIES: Record<string, ToneTag[]> = {
  STYLE: ['CONTENT', 'editorial', 'dream', 'unhinged', 'research'],
  SOURCE: ['SHADOW', 'SIGNAL', 'ECHO'],
  FORMAT: ['MANIFESTO', 'SHARD', 'DOSSIER', 'PROMPT'],
  ALCHEMY: ['RAW', 'VINTAGE', 'CONTRARY']
};

const GUIDED_PROMPTS: Record<string, string> = {
  CONTENT: "DEFINE THE ASSIGNMENT. SPECIFY THE DIRECTIVES. OUTLINE THE OUTPUT.",
  editorial: "IDENTIFY YOUR VISUAL ANCHOR. DEFINE THE COMPOSITION. SET THE TYPOGRAPHIC WEIGHT.",
  dream: "TRIGGER THE MEMORY. LAYER THE ATMOSPHERE. CAPTURE THE RESONANCE.",
  unhinged: "CALIBRATE THE CHAOS. DISTORT THE VISION. INJECT THE NON-SEQUITUR.",
  research: "STATE THE CORE INQUIRY. TARGET THE SOURCES. CHOOSE THE SYNTHESIS.",
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
  const { systemStatus, user: currentUser, updateProfile, profile } = useUser();
  const { logEvent } = useTasteLogging();
  
  // Initialize with a value if none provided
  const [input, setInput] = useState(() => {
    if (initialValue) return initialValue;
    return DEFAULT_STARTERS[Math.floor(Math.random() * DEFAULT_STARTERS.length)];
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [deepThinking, setDeepThinking] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  const [bypassLogic, setBypassLogic] = useState(false);
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
  const [activeTags, setActiveTags] = useState<string[]>([]);
  
  // Sidebar State
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [showTagGenerator, setShowTagGenerator] = useState(false);
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
  
  const { isRecording, startRecording, stopRecording, audioBlob, permissionError, resetRecording } = useRecorder();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedTone) {
      const timer = setInterval(() => {
        setPromptIndex(prev => {
          let next;
          do {
            next = Math.floor(Math.random() * DEFAULT_PROMPTS.length);
          } while (next === prev && DEFAULT_PROMPTS.length > 1);
          return next;
        });
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
          const base64 = await new Promise<string>((resolve) => {
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
          resetRecording();
        }
      };
      handleTranscription();
    }
  }, [audioBlob, resetRecording]);

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
          isHighFidelity: isHighFidelity,
          zineOptions: zineOptions,
          tags: activeTags
      });
    }
  }, [input, mediaFiles, isThinking, selectedTone, useSearch, deepThinking, liteMode, freshState, onRefine, activeProvocation, folderTitle, selectedComponents, isHighFidelity, zineOptions, activeTags]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Process files sequentially to ensure compression
    for (const file of Array.from(files) as File[]) {
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
              type: file.type.startsWith('audio') ? 'audio' : file.type.startsWith('video') ? 'video' : 'image', 
              url: URL.createObjectURL(file), // Keep preview URL lightweight
              data: processedBase64.split(',')[1], 
              mimeType: file.type,
              name: file.name,
              tags: []
            }]);
            
            // Generate tags asynchronously
            generateTagsFromMedia(`Artifact: ${file.name}`, []).then(tags => {
                setMediaFiles(prev => prev.map(m => m.name === file.name ? { ...m, tags } : m));
                setActiveTags(prev => [...new Set([...prev, ...tags])]);
            });

            // Analyze aesthetic
            if (file.type.startsWith('image')) {
                analyzeImageAesthetic(processedBase64.split(',')[1], file.type, currentUser).then(result => {
                    if (result && result.culturalReferences) {
                        const newRefs = result.culturalReferences;
                        // Update profile
                        if (currentUser) {
                            const updatedProfile = {
                                ...currentUser,
                                tailorDraft: {
                                    ...(currentUser.tailorDraft || {}),
                                    positioningCore: {
                                        ...(currentUser.tailorDraft?.positioningCore || {}),
                                        anchors: {
                                            ...(currentUser.tailorDraft?.positioningCore?.anchors || {}),
                                            culturalReferences: [
                                                ...new Set([
                                                    ...(currentUser.tailorDraft?.positioningCore?.anchors?.culturalReferences || []),
                                                    ...newRefs
                                                ])
                                            ]
                                        }
                                    }
                                }
                            };
                            updateProfile(updatedProfile);
                        }
                    }
                });
            }
            
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
      className="w-full h-full flex flex-col items-center relative transition-all duration-1000 bg-nous-base dark:bg-background-dark"
    >
            {/* 1. MAIN WORKSPACE */}
       <motion.div 
         animate={{ opacity: isThinking ? [0.5, 1, 0.5] : 1 }}
         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
         className={`w-full max-w-5xl flex-1 flex flex-col items-center justify-start relative min-h-full pb-32 px-4 md:px-8 z-10 transition-all duration-300 ease-out`}
       >
        {/* Title Input */}
        <input 
            type="text" 
            placeholder="ENTER ZINE TITLE..."
            className="w-full max-w-2xl bg-transparent border-b border-stone-300 dark:border-stone-700 pb-2 mb-8 mt-16 text-sm uppercase tracking-widest text-stone-500 placeholder:text-stone-400 outline-none text-center"
        />

        {/* Prompt Cycle */}
        <div className="text-center mb-8">
            <p className="text-[8px] uppercase tracking-widest text-stone-400">PROMPT_CYCLE {promptIndex + 1}</p>
            <p className="text-[10px] uppercase tracking-widest text-stone-500">"{DEFAULT_PROMPTS[promptIndex]}"</p>
        </div>

        {/* Fragments of a conversation regarding... (textarea) */}
        <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full max-w-3xl bg-transparent border-none focus:ring-0 text-2xl font-serif italic text-center mb-12 text-primary dark:text-white outline-none resize-none p-12"
            placeholder="Fragments of a conversation regarding..."
        />

        {/* Submit Button */}
        <button onClick={triggerAccession} className="text-[10px] uppercase tracking-[0.2em] border-b border-primary/20 dark:border-white/20 hover:border-primary dark:hover:border-white transition-colors text-primary dark:text-white mb-8">
            → SUBMIT TO ISSUE
        </button>

        {/* Thumbnails */}
        {mediaFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {mediaFiles.map((file, idx) => (
              <div key={idx} className="relative w-16 h-16">
                <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => removeMedia(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 mb-12">
            <button onClick={() => mediaInputRef.current?.click()} className="p-2 text-stone-400 hover:text-primary dark:hover:text-white rounded-full transition-colors" title="Image Upload"><ImageIcon size={16} /></button>
            <button onClick={startRecording} className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500' : 'text-stone-400 hover:text-primary dark:hover:text-white'}`} title="Voice Transcription"><Mic size={16} /></button>
            <div className="w-px h-6 bg-stone-300 dark:bg-stone-700 mx-2" />
            <button onClick={() => setLiteMode(!liteMode)} className={`p-2 rounded-full transition-colors ${liteMode ? 'text-primary dark:text-white bg-black/5 dark:bg-white/5' : 'text-stone-400'}`} title="Lite Zine"><Zap size={16} /></button>
            <button onClick={() => setBypassLogic(!bypassLogic)} className={`p-2 rounded-full transition-colors ${bypassLogic ? 'text-primary dark:text-white bg-black/5 dark:bg-white/5' : 'text-stone-400'}`} title="Bypass Logic"><Shield size={16} /></button>
            <button onClick={() => setDeepThinking(!deepThinking)} className={`p-2 rounded-full transition-colors ${deepThinking ? 'text-primary dark:text-white bg-black/5 dark:bg-white/5' : 'text-stone-400'}`} title="Deep Thinking"><BrainCircuit size={16} /></button>
            <button onClick={() => setUseSearch(!useSearch)} className={`p-2 rounded-full transition-colors ${useSearch ? 'text-primary dark:text-white bg-black/5 dark:bg-white/5' : 'text-stone-400'}`} title="Grounding"><Globe size={16} /></button>
            <button onClick={() => setIsHighFidelity(!isHighFidelity)} className={`p-2 rounded-full transition-colors ${isHighFidelity ? 'text-primary dark:text-white bg-black/5 dark:bg-white/5' : 'text-stone-400'}`} title="High Fidelity"><Sparkles size={16} /></button>
        </div>

        {/* AI Tags & Visual Directives Boxes */}
        <div className="flex gap-8 mb-12">
            <button onClick={() => setShowTagGenerator(true)} className="px-6 py-2 brutalist-border text-[10px] uppercase tracking-widest text-stone-500 hover:text-primary dark:hover:text-white transition-colors">SIGNAL</button>
            <button onClick={() => setIsFolderOpen(true)} className="px-6 py-2 brutalist-border text-[10px] uppercase tracking-widest text-stone-500 hover:text-primary dark:hover:text-white transition-colors">TREATMENT</button>
        </div>

        {/* AI Tags Cloud */}
        <div className="flex flex-wrap gap-2 justify-center max-w-3xl">
            {activeTags.map(tag => (
                <span key={tag} className="text-[10px] uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-1 brutalist-border">{tag}</span>
            ))}
        </div>
      </motion.div>

      {/* Zine Configuration Drawer / Modal */}
      <AnimatePresence>
        {isFolderOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsFolderOpen(false)}
          >
            <div 
              className="bg-background-light dark:bg-background-dark brutalist-border w-full max-w-4xl max-h-[80vh] overflow-y-auto p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-display text-2xl text-primary dark:text-white">Configuration</h2>
                <button onClick={() => setIsFolderOpen(false)} className="text-primary dark:text-white"><X size={24} /></button>
              </div>
              <ZineConfiguration 
                zineOptions={zineOptions} 
                setZineOptions={setZineOptions} 
                profile={profile} 
                onSelectPrompt={(prompt) => {
                  setInput(prompt);
                  setIsFolderOpen(false);
                }}
              />
            </div>
          </motion.div>
        )}

        {showTagGenerator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowTagGenerator(false)}
          >
            <div 
              className="bg-background-light dark:bg-background-dark brutalist-border w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8 border-b border-black/10 dark:border-white/10 pb-4">
                <h2 className="text-2xl font-display italic">AI Tags</h2>
                <button onClick={() => setShowTagGenerator(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <TagGenerator 
                context={input} 
                onAddTags={(tags) => {
                  setActiveTags(prev => [...new Set([...prev, ...tags])]);
                  setShowTagGenerator(false);
                }} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Meta */}
      <footer className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end pointer-events-none">
        <div className="text-[10px] uppercase tracking-[0.3em] text-primary/40 dark:text-white/40 leading-loose pointer-events-auto">
          <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'help' }))} className="hover:text-primary dark:hover:text-white transition-colors">Mimi Engine</button>
          <div>Status: {isThinking ? 'Processing...' : 'Ready for Input'}</div>
        </div>
        <div className="flex gap-8 pointer-events-auto">
          <button onClick={() => window.location.href = '/privacy'} className="text-[10px] uppercase tracking-[0.2em] border-b border-primary/20 dark:border-white/20 hover:border-primary dark:hover:border-white transition-colors text-primary dark:text-white">Privacy</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'proscenium' }))} className="text-[10px] uppercase tracking-[0.2em] border-b border-primary/20 dark:border-white/20 hover:border-primary dark:hover:border-white transition-colors text-primary dark:text-white">Community</button>
        </div>
      </footer>
      
      {/* Hidden Overlays */}
      <CuratorNote isOpen={showColophon} onClose={() => setShowColophon(false)} />
      <AnimatePresence>
        {legalType && <LegalOverlay type={legalType} onClose={() => setLegalType(null)} />}
      </AnimatePresence>
      <input type="file" id="media-upload" name="mediaUpload" ref={mediaInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,audio/*,video/*" />
    </div>
  );
};
