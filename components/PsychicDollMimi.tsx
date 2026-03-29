import React, { useEffect, useRef, useState } from 'react';
import { transmuteThought } from '../services/tasteEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface PsychicDollMimiProps {
 analyser?: AnalyserNode | null;
 className?: string;
}

export const PsychicDollMimi: React.FC<PsychicDollMimiProps> = ({ analyser, className = '' }) => {
 const eyeLeftRef = useRef<SVGCircleElement>(null);
 const eyeRightRef = useRef<SVGCircleElement>(null);
 const mouthRef = useRef<SVGPathElement>(null);
 const requestRef = useRef<number | undefined>(undefined);

 const [transcript, setTranscript] = useState('');
 const [insight, setInsight] = useState('');
 const [isTransmuting, setIsTransmuting] = useState(false);
 const recognitionRef = useRef<any>(null);
 const transcriptRef = useRef('');

 useEffect(() => {
 if (!analyser) return;

 const dataArray = new Uint8Array(analyser.frequencyBinCount);

 const animateMimi = () => {
 requestRef.current = requestAnimationFrame(animateMimi);
 
 analyser.getByteFrequencyData(dataArray);
 
 let sum = dataArray.reduce((a, b) => a + b, 0);
 let volume = sum / dataArray.length; 

 if (eyeLeftRef.current && eyeRightRef.current) {
 const eyeRadius = 4 + (volume * 0.05);
 eyeLeftRef.current.setAttribute('r', eyeRadius.toString());
 eyeRightRef.current.setAttribute('r', eyeRadius.toString());
 }

 if (mouthRef.current) {
 const mouthOpen = 2 + (volume * 0.15);
 mouthRef.current.setAttribute('d', `M 40 70 Q 50 ${70 + mouthOpen} 60 70`);
 }
 };

 animateMimi();

 return () => {
 if (requestRef.current) {
 cancelAnimationFrame(requestRef.current);
 }
 };
 }, [analyser]);

 useEffect(() => {
 const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 if (!SpeechRecognition) return;

 const recognition = new SpeechRecognition();
 recognition.continuous = true;
 recognition.interimResults = true;
 recognition.lang = 'en-US';

 recognition.onresult = (event: any) => {
 let currentTranscript = '';
 for (let i = event.resultIndex; i < event.results.length; ++i) {
 currentTranscript += event.results[i][0].transcript;
 }
 setTranscript(currentTranscript);
 transcriptRef.current = currentTranscript;
 };

 let silenceTimer: NodeJS.Timeout;

 recognition.onend = () => {
 const finalTranscript = transcriptRef.current.trim();
 if (finalTranscript.length > 5 && !isTransmuting) {
 handleTransmute(finalTranscript);
 } else {
 // If it ended without enough text or we are already transmuting, just restart listening
 try {
 if (!isTransmuting) recognition.start();
 } catch (e) {}
 }
 };

 recognition.start();
 recognitionRef.current = recognition;

 return () => {
 recognition.stop();
 };
 }, [isTransmuting]);

 const handleTransmute = async (thought: string) => {
 if (isTransmuting) return;
 setIsTransmuting(true);
 
 // Stop recognition while transmuting
 if (recognitionRef.current) {
 recognitionRef.current.stop();
 }

 setInsight('');
 
 const result = await transmuteThought(thought);
 setInsight(result);
 setTranscript('');
 transcriptRef.current = '';
 setIsTransmuting(false);
 };

 return (
 <div className={`flex flex-col items-center w-full max-w-[300px] ${className}`}>
 {/* Mimi Visual */}
 <svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 100 100"className="w-32 h-32 mb-4 drop-">
 <defs>
 <radialGradient id="mimiGlow"cx="50%"cy="50%"r="50%">
 <stop offset="0%"stopColor="#f4f4f5"stopOpacity="0.8"/>
 <stop offset="100%"stopColor="#a8a29e"stopOpacity="0"/>
 </radialGradient>
 <filter id="blurGlow">
 <feGaussianBlur stdDeviation="3"result="coloredBlur"/>
 <feMerge>
 <feMergeNode in="coloredBlur"/>
 <feMergeNode in="SourceGraphic"/>
 </feMerge>
 </filter>
 </defs>

 {/* Aura */}
 <circle cx="50"cy="50"r="45"fill="url(#mimiGlow)"/>
 
 {/* Face Outline */}
 <path d="M 20 50 C 20 20, 80 20, 80 50 C 80 80, 50 95, 50 95 C 50 95, 20 80, 20 50 Z"
 fill="none"stroke="#d6d3d1"strokeWidth="1"opacity="0.5"/>
 
 {/* Eyes */}
 <circle ref={eyeLeftRef} cx="35"cy="45"r="4"fill="#1c1917"filter="url(#blurGlow)"/>
 <circle ref={eyeRightRef} cx="65"cy="45"r="4"fill="#1c1917"filter="url(#blurGlow)"/>
 
 {/* Tears / Markings */}
 <path d="M 35 52 Q 35 60 32 65"fill="none"stroke="#a8a29e"strokeWidth="0.5"opacity="0.6"/>
 <path d="M 65 52 Q 65 60 68 65"fill="none"stroke="#a8a29e"strokeWidth="0.5"opacity="0.6"/>

 {/* Mouth */}
 <path ref={mouthRef} d="M 40 70 Q 50 72 60 70"fill="none"stroke="#1c1917"strokeWidth="1.5"strokeLinecap="round"/>
 
 {/* Third Eye / Crown */}
 <polygon points="50,25 47,30 53,30"fill="#d6d3d1"opacity="0.8"/>
 </svg>

 {/* Thought / Insight Display */}
 <div className="w-full min-h-[80px] flex flex-col items-center justify-center text-center">
 <AnimatePresence mode="wait">
 {isTransmuting ? (
 <motion.div
 key="transmuting"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle animate-pulse"
 >
 Transmuting thought...
 </motion.div>
 ) : insight ? (
 <motion.div
 key="insight"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="font-serif text-sm italic text-nous-text leading-relaxed"
 >
"{insight}"
 </motion.div>
 ) : transcript ? (
 <motion.div
 key="transcript"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="font-sans text-xs text-nous-subtle"
 >
 {transcript}
 </motion.div>
 ) : (
 <motion.div
 key="idle"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="font-mono text-[9px] uppercase tracking-widest text-nous-text0"
 >
 Speak your thoughts to Mimi...
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
};
