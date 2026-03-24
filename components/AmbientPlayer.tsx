import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

const TRACKS = [
  { name: 'Organic Heartbeat', src: '/src/assets/Slow Heartbeat, 55 Bpm, Soft Sub Bass Thump, Internal Body Sound, Intimate, E....wav' },
  { name: 'Digital Heartbeat', src: '/src/assets/heartbeats digital mimi ambiance server.wav' },
  { name: 'Butterfly Room', src: '/src/assets/through the glass, butterfly room ambiance.wav' },
  { name: 'Telethrones', src: '/src/assets/telethrones ambient vg.wav' },
  { name: 'Mimi Intro', src: '/src/assets/mimi intro ambience.wav' }
];

export const AmbientPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <motion.div 
      drag
      dragMomentum={false}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 cursor-grab active:cursor-grabbing group"
    >
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentTrack.src} 
        loop 
        onEnded={nextTrack}
      />

      {/* Neomorphic Player UI - Smaller and more understated */}
      <div className="bg-[#E4E3E0] p-1.5 rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.7)] flex items-center gap-3 px-4">
        
        {/* Charcoal Play/Pause Button */}
        <button 
          onClick={togglePlay} 
          className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-white shadow-[1px_1px_2px_rgba(0,0,0,0.3),-0.5px_-0.5px_1px_rgba(255,255,255,0.1)] hover:bg-[#333] transition-colors"
        >
          {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Inset Track Progress Line */}
        <div className="w-24 h-0.5 bg-[#d1d0ce] rounded-full shadow-[inset_0.5px_0.5px_1px_rgba(0,0,0,0.2)] relative overflow-hidden">
          <motion.div 
            className="h-full bg-[#2a2a2a]"
            initial={{ width: '0%' }}
            animate={{ width: isPlaying ? '100%' : '0%' }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          />
        </div>

        {/* Track Name - Hidden unless hovered */}
        <span className="text-[8px] font-mono text-[#2a2a2a] uppercase tracking-widest w-20 truncate text-right opacity-0 group-hover:opacity-100 transition-opacity">
          {currentTrack.name}
        </span>
      </div>
    </motion.div>
  );
};
