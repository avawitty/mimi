
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Loader2, Sparkles, X, WifiOff, Radio, Moon, Terminal, Info, Cat, Waves } from 'lucide-react';
import { generateAudio } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';

const FALLBACK_EDICTS = [
  "Art is a structural requirement for survival.",
  "Your current boredom is a strategic failure.",
  "Economic restriction is the architect of aesthetic genius.",
  "The Broke Girl manifest requires a 4K mind.",
  "Clinical clarity is the only sustainable vibe.",
  "The void is listening. Speak clearly."
];

export const DailyTransmission: React.FC = () => {
  const { currentPalette } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTired, setIsTired] = useState(false);
  const [activeEdict, setActiveEdict] = useState<{message: string, isWarning: boolean, timestamp: number} | null>(null);
  const [lastTrace, setLastTrace] = useState<{ code: string, message: string } | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const handleSystemEdict = (e: any) => {
      setActiveEdict(e.detail);
      setIsTired(false);
      // Optional: Auto-play system edicts if not already playing
      // playTransmission(e.detail.message);
    };
    window.addEventListener('mimi:system_edict', handleSystemEdict);
    return () => {
      window.removeEventListener('mimi:system_edict', handleSystemEdict);
      if (sourceNodeRef.current) { try { sourceNodeRef.current.stop(); } catch(e) {} }
    };
  }, []);

  const decodePCM = (ctx: AudioContext, data: Uint8Array): AudioBuffer => {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) { 
      channelData[i] = dataInt16[i] / 32768.0; 
    }
    return audioBuffer;
  };

  const playTransmission = async (overrideText?: string) => {
    if (isPlaying) { 
      if (sourceNodeRef.current) { try { sourceNodeRef.current.stop(); } catch(e) {} } 
      setIsPlaying(false); 
      return; 
    }
    
    setIsLoading(true);
    setIsTired(false);
    setLastTrace(null);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("ORACLE_EXHAUSTED")), 12000)
    );

    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
        gainNodeRef.current = audioCtxRef.current.createGain();
        gainNodeRef.current.connect(audioCtxRef.current.destination);
      }
      
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      
      const baseText = overrideText || activeEdict?.message || FALLBACK_EDICTS[Math.floor(Math.random() * FALLBACK_EDICTS.length)];
      
      const bytes = await Promise.race([
        generateAudio(baseText),
        timeoutPromise
      ]) as Uint8Array;

      const buffer = decodePCM(audioCtxRef.current, bytes);
      
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNodeRef.current!);
      source.onended = () => setIsPlaying(false);
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (err: any) { 
      console.error("MIMI // Transmission Interrupted:", err);
      setIsTired(true);
      setLastTrace({ code: err.code || 'SIGNAL_VOID', message: err.message });
      setTimeout(() => setIsTired(false), 5000);
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 mb-4 w-full transition-all duration-700">
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {(activeEdict || isPlaying || isTired) && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: isPlaying ? [1.1, 1.3, 1.1] : 1.1, 
                opacity: 1 
              }}
              transition={isPlaying ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
              exit={{ scale: 1.5, opacity: 0 }}
              className={`absolute inset-0 rounded-full blur-2xl pointer-events-none transition-colors duration-1000 ${isPlaying ? 'bg-emerald-400/30' : isTired ? 'bg-red-400/20' : 'bg-amber-400/10'}`}
            />
          )}
        </AnimatePresence>
        
        <div className="flex flex-col items-center gap-2">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => playTransmission()}
              onContextMenu={(e) => { e.preventDefault(); setShowTrace(!showTrace); }}
              className={`relative z-10 flex items-center gap-3 px-8 py-3 bg-white/70 dark:bg-stone-900/70 backdrop-blur-3xl border border-black/5 rounded-full shadow-2xl group transition-all ${isPlaying ? 'ring-2 ring-emerald-500/40' : isTired ? 'ring-2 ring-red-500/20' : ''}`}
            >
              {isLoading ? (
                <Loader2 size={12} className="animate-spin text-stone-400" />
              ) : isTired ? (
                <Moon size={12} className="text-red-400 animate-pulse" />
              ) : (
                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isPlaying ? 'bg-emerald-500 animate-pulse scale-150' : activeEdict ? 'bg-amber-400' : 'bg-stone-300'}`} />
              )}
              <span className="font-sans text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-black text-stone-600 dark:text-stone-300">
                {isLoading ? 'Calibrating' : isPlaying ? 'Transmitting' : isTired ? 'Oracle Tired' : 'Royal Edict'}
              </span>
              {isPlaying ? (
                <X size={12} className="text-stone-400 hover:text-red-500 transition-colors" />
              ) : (
                <div className="flex items-center gap-2">
                   <Cat size={10} className="text-stone-200 opacity-20 group-hover:opacity-100 transition-opacity" />
                   <Sparkles size={12} className={`text-stone-300 group-hover:text-amber-400 transition-colors ${activeEdict && !isTired ? 'animate-pulse text-amber-500' : ''}`} />
                </div>
              )}
            </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {(isPlaying || isTired) && !showTrace && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="font-serif italic text-xs md:text-sm text-stone-400 text-center max-w-xs md:max-w-md px-6 leading-tight">
              {isTired ? "The Oracle is exhausted. Return when the frequency has stabilized." : `“${activeEdict?.message || "Mimi is breathing."}”`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
