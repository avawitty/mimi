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
 <div className="bg p-1.5 rounded-none flex items-center gap-3 px-4">
 
 {/* Charcoal Play/Pause Button */}
 <button 
 onClick={togglePlay} 
 className="w-6 h-6 rounded-none bg flex items-center justify-center text-white hover:bg transition-colors"
 >
 {isPlaying ? <Pause size={10} fill="currentColor"/> : <Play size={10} fill="currentColor"className="ml-0.5"/>}
 </button>

 {/* Inset Track Progress Line */}
 <div className="w-24 h-0.5 bg rounded-none relative overflow-hidden">
 <motion.div 
 className="h-full bg"
 initial={{ width: '0%' }}
 animate={{ width: isPlaying ? '100%' : '0%' }}
 transition={{ duration: 30, ease:"linear", repeat: Infinity }}
 />
 </div>

 {/* Track Name - Hidden unless hovered */}
 <span className="text-[8px] font-mono text uppercase tracking-widest w-20 truncate text-right opacity-0 group-hover:opacity-100 transition-opacity">
 {currentTrack.name}
 </span>
 </div>
 </motion.div>
 );
};
