import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useLiveSession } from '../hooks/useLiveSession';

interface LiveMentorProps {
  name: string;
  role: string;
  voiceName: string;
  systemInstruction: string;
  onTranscriptUpdate?: (text: string) => void;
  children?: React.ReactNode;
}

export const LiveMentor: React.FC<LiveMentorProps> = ({ name, role, voiceName, systemInstruction, onTranscriptUpdate, children }) => {
  const { connect, disconnect, isConnected, isConnecting, isSpeaking, error, analyser, transcript } = useLiveSession(systemInstruction, voiceName);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (onTranscriptUpdate && transcript) {
      onTranscriptUpdate(transcript);
    }
  }, [transcript, onTranscriptUpdate]);

  // Visualizer loop
  useEffect(() => {
    if (!analyser || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      const isDark = document.documentElement.classList.contains('dark');
      ctx.strokeStyle = isDark ? '#ffffff' : '#1c1917'; // white or stone-900
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  // Disconnect on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect().catch(e => console.error("MIMI // Connection failed:", e));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 w-full flex flex-col items-center">
      <div className="space-y-2 text-center">
        <span className="font-sans text-[9px] uppercase tracking-widest text-stone-400 block">Active Mentor</span>
        <h2 className="font-serif text-4xl italic text-nous-text dark:text-white">{name}.</h2>
        <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500">{role}</p>
      </div>
      
      {children}

      <div className="relative w-full h-24 flex items-center justify-center">
        {isConnected ? (
          <canvas ref={canvasRef} width={300} height={100} className="w-full h-full opacity-50" />
        ) : (
          <div className="w-full h-px bg-stone-200 dark:bg-stone-800" />
        )}
      </div>

      <button 
        onClick={toggleConnection}
        disabled={isConnecting}
        className={`mx-auto w-16 h-16 rounded-full border flex items-center justify-center transition-all ${
          isConnected 
            ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' 
            : isConnecting
              ? 'border-stone-300 text-stone-300 dark:border-stone-700 dark:text-stone-700 cursor-not-allowed'
              : 'border-stone-300 dark:border-stone-700 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:border-stone-900 dark:hover:border-white'
        }`}
      >
        {isConnecting ? <Loader2 size={20} strokeWidth={1} className="animate-spin" /> : isConnected ? <MicOff size={20} strokeWidth={1} /> : <Mic size={20} strokeWidth={1} />}
      </button>

      <div className="h-12 flex items-center justify-center">
        {error ? (
          <p className="font-mono text-[10px] text-red-500 uppercase tracking-widest">{error}</p>
        ) : isConnecting ? (
          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">
            Establishing Link...
          </p>
        ) : isConnected ? (
          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">
            {isSpeaking ? 'Transmitting...' : 'Listening...'}
          </p>
        ) : (
          <p className="font-serif italic text-sm text-stone-500">Tap to initiate vocal sync.</p>
        )}
      </div>

      {/* Live Transcription Terminal */}
      {isConnected && transcript && (
        <div className="w-full max-w-[300px] h-24 overflow-y-auto text-left border-t border-stone-200 dark:border-stone-800 pt-4 mt-4">
          <p className="font-mono text-[10px] text-stone-600 dark:text-stone-400 uppercase leading-relaxed">
            {'>'} {transcript.slice(-150)}
            <span className="animate-pulse">_</span>
          </p>
        </div>
      )}
    </motion.div>
  );
};
