
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Volume2, Loader2, Music, Square, AlertCircle, Sparkles } from 'lucide-react';
import { generateAudio } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';

const DECREES: Record<string, string[]> = {
  'Void': [
    "The 5G has left the building. Enjoy the architectural silence.",
    "A Verizon outage is just the universe requesting a Rot Period.",
    "Exhaustion is your body's way of going into Airplane Mode. Horizontalize immediately."
  ],
  'Stone': [
    "Is it a conspiracy, or did you just lose your phone? Curate your paranoia.",
    "Clinical serenity is required when the bars drop. Seek cold glass.",
    "Banal signals are wretched. Pure disconnection is a creative act."
  ],
  'Blush': [
    "Wrap yourself in the velvet of a lost connection. Intimidate the pavement.",
    "90s legacy is calling—back when we actually lost our phones and it was chic.",
    "Severe eyeliner is the only signal we need today. Decree the Outage."
  ],
  'Moss': [
    "Subterranean textures for a world without data. Seek radical rawness.",
    "Gritty grain is the only filter for 5G conspiratorial thoughts.",
    "Philosophize with a hammer. Or a disconnected handset."
  ],
  'Blood': [
    "Scandal is the only news that survives an outage. Headlines only.",
    "Flash photography for a fast, signal-less life. Sensation is the logic.",
    "Your lost phone is a performance piece. Ensure the costume is transcendent."
  ]
};

export const DailyTransmission: React.FC = () => {
  const { currentPalette } = useTheme();
  const [decree, setDecree] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const genreDecrees = DECREES[currentPalette.name] || DECREES.Stone;
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    setDecree(genreDecrees[dateSeed % genreDecrees.length]);
  }, [currentPalette]);

  const initAudio = async () => {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTransmission = async () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    setError(false);
    try {
      const ctx = await initAudio();
      const buffer = await generateAudio(`${decree}`);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 mb-6 lg:mb-12">
      <button 
        onClick={playTransmission}
        disabled={isLoading}
        className={`group flex items-center gap-3 px-6 py-2.5 rounded-full border transition-all active:scale-95 ${
          isPlaying 
          ? 'bg-nous-text text-white border-nous-text dark:bg-white dark:text-black dark:border-white shadow-lg' 
          : error 
          ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-950/20 dark:border-red-900'
          : 'bg-white/40 dark:bg-stone-900/40 backdrop-blur-3xl border-stone-200 dark:border-stone-800 hover:border-nous-text dark:hover:border-white'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-400 animate-ping' : error ? 'bg-red-600' : 'bg-red-500'}`} />
          <div className={`absolute w-2 h-2 rounded-full ${error ? 'bg-red-600' : 'bg-red-500'} ${isPlaying ? 'animate-pulse' : ''}`} />
        </div>
        
        <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-inherit">
          {isLoading ? 'Decrypting...' : error ? 'Signal Lost' : isPlaying ? 'Transmitting' : 'Royal Edict'}
        </span>

        {isLoading ? (
          <Loader2 size={12} className="animate-spin opacity-50" />
        ) : error ? (
          <AlertCircle size={12} />
        ) : isPlaying ? (
          <Volume2 size={12} className="animate-pulse" />
        ) : (
          <Sparkles size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
      
      <AnimatePresence>
        {(isPlaying || error) && (
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.6, y: 0 }}
            exit={{ opacity: 0 }}
            className={`font-serif italic text-[11px] text-center max-w-[240px] md:max-w-xs ${error ? 'text-red-400 font-bold' : 'text-stone-500'}`}
          >
            {error ? "Verizon has reclaimed the airwaves. The Empress remains pensive." : `"${decree}"`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
