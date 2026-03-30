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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 w-full flex flex-col items-center">
      <div className="space-y-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-px bg-nous-border mb-2"/>
          <span className="font-sans text-[7px] uppercase tracking-[0.4em] text-nous-subtle block font-black">Active Mentor</span>
        </div>
        <h2 className="font-serif text-5xl md:text-6xl italic text-nous-text tracking-tight">{name}.</h2>
        <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-nous-subtle font-medium">{role}</p>
      </div>
      
      <div className="w-full flex flex-col items-center gap-8">
        {children}

        <div className="relative w-full h-32 flex flex-col items-center justify-center gap-8">
          <div className="relative w-full h-12 flex items-center justify-center">
            {isConnected ? (
              <canvas ref={canvasRef} width={400} height={100} className="w-full h-full opacity-40 mix-blend-difference"/>
            ) : (
              <div className="w-24 h-px bg-stone-200/50 dark:bg-stone-800/50"/>
            )}
          </div>

          <button 
            onClick={toggleConnection}
            disabled={isConnecting}
            className={`relative group w-20 h-20 rounded-full border flex items-center justify-center transition-all duration-500 ${
              isConnected 
                ? 'border-red-500/30 text-red-500 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                : isConnecting
                ? 'border-nous-border text-nous-subtle cursor-not-allowed'
                : 'border-nous-border text-nous-subtle hover:text-nous-text hover:border-nous-text dark:hover:border-white bg-transparent'
            }`}
          >
            {isConnected && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-red-500/10"
              />
            )}
            {isConnecting ? <Loader2 size={20} strokeWidth={1} className="animate-spin"/> : isConnected ? <MicOff size={20} strokeWidth={1} /> : <Mic size={20} strokeWidth={1} />}
          </button>
        </div>
      </div>

      <div className="h-12 flex items-center justify-center">
        {error ? (
          <p className="font-mono text-[9px] text-red-500 uppercase tracking-[0.2em]">{error}</p>
        ) : isConnecting ? (
          <p className="font-mono text-[9px] text-nous-subtle uppercase tracking-[0.3em] animate-pulse">
            Establishing Link...
          </p>
        ) : isConnected ? (
          <p className="font-mono text-[9px] text-nous-subtle uppercase tracking-[0.3em]">
            {isSpeaking ? 'Transmitting...' : 'Listening...'}
          </p>
        ) : (
          <p className="font-serif italic text-sm text-nous-subtle opacity-60">Tap to initiate vocal sync.</p>
        )}
      </div>

      {/* Live Transcription Terminal */}
      {isConnected && transcript && (
        <div className="w-full max-w-[300px] h-24 overflow-y-auto text-left border-t border-nous-border pt-4 mt-4">
          <p className="font-mono text-[10px] text-nous-subtle uppercase leading-relaxed">
            {'>'} {transcript.slice(-150)}
            <span className="animate-pulse">_</span>
          </p>
        </div>
      )}
    </motion.div>
  );
};
