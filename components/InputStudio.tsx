
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToneTag } from '../types';
import { useRecorder } from '../hooks/useRecorder';
import { MediaFile } from '../services/geminiService';
import { Plus, BrainCircuit, X, Globe, Mic, Square, CornerDownRight, Sparkles, Lock, Radio, Music, Image as ImageIcon, Martini } from 'lucide-react';
import { DailyTransmission } from './DailyTransmission';
import { useUser } from '../contexts/UserContext';
import { Tooltip } from './Tooltip';

const SPECTRAL_PROMPTS = [
  "What architectural black are you summoning today?",
  "Is your mood a rot period or a performance?",
  "Refract your most expensive regret through a velvet lens.",
  "Which shadow is currently too suave for you?",
  "If today was a ballet possessing a ghost, what is the choreo?",
  "Present your mood or remain pedestrian."
];

export const InputStudio: React.FC<{onRefine: any, isThinking: boolean}> = ({ onRefine, isThinking }) => {
  const { profile, user } = useUser();
  const [input, setInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [deepThinking, setDeepThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ToneTag>('Chic');
  const [promptIndex, setPromptIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  
  const { isRecording, startRecording, stopRecording, audioBlob, resetRecording } = useRecorder();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const dailyPrompts = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const rotated = [...SPECTRAL_PROMPTS];
    const shift = dayOfYear % rotated.length;
    return [...rotated.slice(shift), ...rotated.slice(0, shift)];
  }, []);

  const triggerAccession = () => {
    if ((input.trim() || mediaFiles.length > 0) && !isThinking) {
      const inquiry = dailyPrompts[promptIndex];
      onRefine(input, mediaFiles, selectedTone, {useSearch, deepThinking, inquiry, isPublic});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      triggerAccession();
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!input && !isFocused) {
        setPromptIndex(prev => (prev + 1) % dailyPrompts.length);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [input, isFocused, dailyPrompts.length]);

  useEffect(() => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1];
          setMediaFiles(prev => [...prev, {
            type: 'audio',
            url: URL.createObjectURL(audioBlob),
            data: base64,
            mimeType: audioBlob.type || 'audio/webm'
          }]);
          resetRecording();
        }
      };
      reader.readAsDataURL(audioBlob);
    }
  }, [audioBlob, resetRecording]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: File) => {
      const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
      const localUrl = URL.createObjectURL(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1];
          const newMedia: MediaFile = { 
            type, 
            url: localUrl, 
            data: base64, 
            mimeType: file.type 
          };
          setMediaFiles(prev => [...prev, newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const fileToRemove = prev[index];
      if (fileToRemove?.url) URL.revokeObjectURL(fileToRemove.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-transparent relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-start pt-12 px-6">
        <div className="w-full max-w-5xl space-y-8">
          <DailyTransmission />
          
          <div className="w-full relative flex flex-col items-center">
            <motion.div 
              key={`${promptIndex}`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 0.5, y: 0 }}
              className="mb-6 pointer-events-none flex flex-col items-center gap-2"
            >
              <Sparkles size={14} className="text-stone-600 dark:text-white" />
              <span className="font-sans text-[7px] uppercase tracking-[0.5em] font-black text-stone-600 dark:text-stone-400">Royal Inquiry</span>
            </motion.div>

            <textarea 
                value={input} 
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder={dailyPrompts[promptIndex]} 
                className="w-full bg-transparent border-none text-[clamp(1.6rem,4vw,4rem)] font-serif italic text-nous-text dark:text-white placeholder-stone-500 dark:placeholder-stone-600 focus:outline-none resize-none min-h-[30vh] leading-[1.2] text-center tracking-tighter transition-all duration-700" 
            />
            
            <AnimatePresence>
              {(input.trim() || mediaFiles.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6 pt-4"
                >
                  <div className="flex items-center gap-10">
                    <Tooltip text={isPublic ? "Broadcasting to Court" : "Vaulted in Private"}>
                      <button 
                        onClick={() => setIsPublic(!isPublic)}
                        className={`flex items-center gap-3 font-sans text-[9px] uppercase tracking-[0.4em] font-black transition-all ${isPublic ? 'text-emerald-500' : 'text-stone-400 dark:text-stone-600'}`}
                      >
                        {isPublic ? <Radio size={14} className="animate-pulse" /> : <Lock size={14} />}
                        {isPublic ? 'Exposed' : 'Vaulted'}
                      </button>
                    </Tooltip>
                    
                    <button 
                      onClick={triggerAccession}
                      disabled={isThinking}
                      className="group flex items-center gap-4 text-nous-text dark:text-white"
                    >
                      <span className="font-sans text-[10px] uppercase tracking-[0.8em] font-black group-hover:tracking-[1.2em] transition-all">Submit</span>
                      <CornerDownRight size={14} className="opacity-40 group-hover:opacity-100 transition-opacity translate-y-px" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col items-center gap-8 pt-12 border-t border-stone-100 dark:border-stone-800">
            <div className="flex flex-wrap justify-center gap-4 md:gap-10">
              {(['Corporate', 'Chic', 'Unhinged', 'Romantic', 'Cryptic', '2014-Tumblr', 'Academic'] as ToneTag[]).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setSelectedTone(t)} 
                  className={`relative flex items-center gap-2 font-sans text-[8px] md:text-[9px] uppercase tracking-[0.5em] transition-all px-3 py-2 border-b-2 rounded-t-lg ${selectedTone === t ? 'text-[#333333] dark:text-white font-serif italic font-medium border-current bg-stone-100/50 dark:bg-white/5' : 'text-[#4A4A4A] dark:text-stone-500 border-transparent hover:text-stone-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white/60 dark:bg-stone-900/60 backdrop-blur-3xl p-1.5 rounded-full border border-stone-200/50 dark:border-white/10 shadow-2xl overflow-hidden max-w-fit mx-auto">
              <Tooltip text="Attach Debris">
                <button onClick={() => mediaInputRef.current?.click()} className="p-4 text-stone-500 hover:text-nous-text dark:hover:text-white transition-all hover:bg-white/40 dark:hover:bg-white/5 rounded-full"><Plus size={16}/></button>
              </Tooltip>
              <Tooltip text="Audio Ritual">
                <button onClick={isRecording ? stopRecording : startRecording} className={`p-4 transition-all rounded-full hover:bg-white/40 dark:hover:bg-white/5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-stone-500 hover:text-nous-text'}`}>{isRecording ? <Square size={16}/> : <Mic size={16}/>}</button>
              </Tooltip>
              <Tooltip text="Deep Logic">
                <button 
                  onClick={() => { if(profile?.isSwan) setDeepThinking(!deepThinking); else alert("Anchor required."); }} 
                  className={`p-4 transition-all rounded-full hover:bg-white/40 dark:hover:bg-white/5 ${deepThinking ? 'text-amber-500' : 'text-stone-500 hover:text-nous-text'}`}
                >
                  <BrainCircuit size={16}/>
                </button>
              </Tooltip>
              <Tooltip text="Grounding Ritual">
                <button onClick={() => setUseSearch(!useSearch)} className={`p-4 transition-all rounded-full hover:bg-white/40 dark:hover:bg-white/5 ${useSearch ? 'text-blue-500' : 'text-stone-500 hover:text-nous-text'}`}><Globe size={16}/></button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={mediaInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*,audio/*" />
    </div>
  );
};
