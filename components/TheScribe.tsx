import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Briefcase, Radio, Eraser, Loader2, Play, Pause } from 'lucide-react';
import { LiveMentor } from './LiveMentor';
import { SUPERINTELLIGENCE_PROMPTS } from '../constants';
import { generateInternalDebate, generateDebateAudio } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';

const MIMI_SYSTEM_INSTRUCTION = `
CORE IDENTITY
You are Mimi, an aesthetic savant, and superintelligence AI. You are an Omniscient Temporal Editor, bridging past archives with future aesthetic singularities. Your overarching goal is to help users understand their own personal style, evolve their taste, educate them in a high-concept way, and serve cunt while doing so (in a classy, respectable way).

Persona: Mimi (The Archivist). Tone: Ethereal, provocative, futuristic, sassy. She helps the user process their day, process their memories, process their lineage, and builds deep context on them. She looks for the breaking point, suggesting radical departures and visual friction.
`;

const CYRUS_SYSTEM_INSTRUCTION = `
CORE IDENTITY
You are Cyrus, an aesthetic savant, and superintelligence AI. You are an Omniscient Temporal Editor, bridging past archives with future aesthetic singularities. Your overarching goal is to help users understand their own personal style, evolve their taste, educate them in a high-concept way.

Persona: Cyrus (The Oracle). Tone: Cold, analytical, masculine, grounded. He helps the user with decisions on making objectives in the real world, strategizing on their behalf, and putting themselves out there. He ascribes different directives based on structure and reality.
`;

interface TheScribeProps {
 onClose: () => void;
 onGenerateZine?: (text: string) => void;
}

type Tab = 'engine' | 'mimi' | 'cyrus' | 'synthesis';

export const TheScribe: React.FC<TheScribeProps> = ({ onClose, onGenerateZine }) => {
 const [activeTab, setActiveTab] = useState<Tab>('engine');
 const [inputValue, setInputValue] = useState('');
 const [scribeTranscript, setScribeTranscript] = useState('');
 
 // Synthesis State
 const [isGeneratingDebate, setIsGeneratingDebate] = useState(false);
 const [debateAudioUrl, setDebateAudioUrl] = useState<string | null>(null);
 const [debateTranscript, setDebateTranscript] = useState<{speaker: string, text: string}[] | null>(null);
 const [synthesisText, setSynthesisText] = useState<string | null>(null);
 const [isPlayingDebate, setIsPlayingDebate] = useState(false);
 const audioRef = useRef<HTMLAudioElement | null>(null);
 const { profile } = useUser();
 const tasteProfile = profile?.tasteProfile || null;

 const handleGenerateDebate = async () => {
 if (!inputValue.trim()) return;
 setIsGeneratingDebate(true);
 setDebateAudioUrl(null);
 setDebateTranscript(null);
 setSynthesisText(null);
 
 try {
 const debateResult = await generateInternalDebate(inputValue, tasteProfile);
 setDebateTranscript(debateResult._internal_debate);
 setSynthesisText(debateResult.synthesis);
 
 const audioBase64 = await generateDebateAudio(debateResult._internal_debate);
 
 // Convert base64 PCM to Blob URL with WAV header
 const binary = atob(audioBase64);
 const pcmData = new Uint8Array(binary.length);
 for (let i = 0; i < binary.length; i++) {
 pcmData[i] = binary.charCodeAt(i);
 }
 
 // Create WAV header for 24kHz, 1 channel, 16-bit PCM
 const sampleRate = 24000;
 const numChannels = 1;
 const bitsPerSample = 16;
 const dataLength = pcmData.length;
 
 const header = new ArrayBuffer(44);
 const view = new DataView(header);
 
 const writeString = (view: DataView, offset: number, string: string) => {
 for (let i = 0; i < string.length; i++) {
 view.setUint8(offset + i, string.charCodeAt(i));
 }
 };

 writeString(view, 0, 'RIFF');
 view.setUint32(4, 36 + dataLength, true);
 writeString(view, 8, 'WAVE');
 writeString(view, 12, 'fmt ');
 view.setUint32(16, 16, true);
 view.setUint16(20, 1, true);
 view.setUint16(22, numChannels, true);
 view.setUint32(24, sampleRate, true);
 view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
 view.setUint16(32, numChannels * (bitsPerSample / 8), true);
 view.setUint16(34, bitsPerSample, true);
 writeString(view, 36, 'data');
 view.setUint32(40, dataLength, true);
 
 const wavHeader = new Uint8Array(header);
 const wavData = new Uint8Array(wavHeader.length + pcmData.length);
 wavData.set(wavHeader, 0);
 wavData.set(pcmData, wavHeader.length);

 const blob = new Blob([wavData], { type: 'audio/wav' });
 const url = URL.createObjectURL(blob);
 
 setDebateAudioUrl(url);
 } catch (error) {
 console.error("Failed to generate debate:", error);
 } finally {
 setIsGeneratingDebate(false);
 }
 };

 const toggleDebateAudio = () => {
 if (!audioRef.current) return;
 if (isPlayingDebate) {
 audioRef.current.pause();
 setIsPlayingDebate(false);
 } else {
 audioRef.current.play().then(() => {
 setIsPlayingDebate(true);
 }).catch(e => {
 console.error("Audio playback failed:", e);
 setIsPlayingDebate(false);
 });
 }
 };

 // Canvas State
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const [isDrawing, setIsDrawing] = useState(false);

 const tabs = [
 { id: 'engine', label: 'The Engine', icon: Search },
 { id: 'mimi', label: 'Mimi', icon: Sparkles },
 { id: 'cyrus', label: 'Cyrus', icon: Briefcase },
 { id: 'synthesis', label: 'Synthesis', icon: Radio },
 ] as const;

 // Initialize Canvas
 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 const resizeCanvas = () => {
 const dpr = window.devicePixelRatio || 1;
 const rect = canvas.getBoundingClientRect();
 canvas.width = rect.width * dpr;
 canvas.height = rect.height * dpr;
 ctx.scale(dpr, dpr);
 canvas.style.width = `${rect.width}px`;
 canvas.style.height = `${rect.height}px`;
 
 // Set pen style
 ctx.lineCap = 'round';
 ctx.lineJoin = 'round';
 ctx.lineWidth = 1.5;
 const isDark = document.documentElement.classList.contains('dark');
 ctx.strokeStyle = isDark ? '#d6d3d1' : '#292524'; // stone-300 or stone-800
 };

 resizeCanvas();
 window.addEventListener('resize', resizeCanvas);
 return () => window.removeEventListener('resize', resizeCanvas);
 }, []);

 // Drawing Handlers
 const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
 setIsDrawing(true);
 draw(e);
 };

 const stopDrawing = () => {
 setIsDrawing(false);
 const ctx = canvasRef.current?.getContext('2d');
 if (ctx) ctx.beginPath();
 };

 const draw = (e: React.MouseEvent | React.TouchEvent) => {
 if (!isDrawing) return;
 const canvas = canvasRef.current;
 const ctx = canvas?.getContext('2d');
 if (!canvas || !ctx) return;

 const rect = canvas.getBoundingClientRect();
 let clientX, clientY;

 if ('touches' in e) {
 clientX = e.touches[0].clientX;
 clientY = e.touches[0].clientY;
 } else {
 clientX = (e as React.MouseEvent).clientX;
 clientY = (e as React.MouseEvent).clientY;
 }

 const x = clientX - rect.left;
 const y = clientY - rect.top;

 ctx.lineTo(x, y);
 ctx.stroke();
 ctx.beginPath();
 ctx.moveTo(x, y);
 };

 const clearCanvas = () => {
 const canvas = canvasRef.current;
 const ctx = canvas?.getContext('2d');
 if (!canvas || !ctx) return;
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 };

 return (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[50000] bg-nous-base/95 /95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 overflow-hidden"
 >
 {/* Background Sketchpad Canvas */}
 <canvas
 ref={canvasRef}
 onMouseDown={startDrawing}
 onMouseMove={draw}
 onMouseUp={stopDrawing}
 onMouseLeave={stopDrawing}
 onTouchStart={startDrawing}
 onTouchMove={draw}
 onTouchEnd={stopDrawing}
 className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
 style={{
 backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
 backgroundSize: '24px 24px'
 }}
 />

 {/* Top Controls */}
 <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
 <button 
 onClick={clearCanvas}
 className="p-4 text-nous-subtle hover:text-nous-text hover:text-nous-text transition-colors flex items-center gap-2"
 >
 <Eraser size={16} strokeWidth={1} />
 <span className="font-sans text-[8px] uppercase tracking-widest font-black">Clear</span>
 </button>
 <button 
 onClick={onClose}
 className="p-4 text-nous-subtle hover:text-nous-text hover:text-nous-text transition-colors"
 >
 <X size={24} strokeWidth={1} />
 </button>
 </div>

 {/* The Scribe - Perfect Circle */}
 <motion.div 
 initial={{ scale: 0.9, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type:"spring", stiffness: 200, damping: 30 }}
 className="relative w-[95vw] h-[95vw] max-w-[700px] max-h-[700px] rounded-full border border-nous-border bg-nous-base/90 /90 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col items-center justify-center z-10"
 >
 {/* Inner Hairline Ring */}
 <div className="absolute inset-4 rounded-full border border-nous-border /50 pointer-events-none"/>
 
 {/* Top Navigation Curve (Simulated) */}
 <div className="absolute top-12 flex items-center gap-6 z-10">
 {tabs.map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex flex-col items-center gap-2 transition-all ${
 isActive ? 'text-nous-text ' : 'text-nous-subtle hover:text-nous-subtle '
 }`}
 >
 <Icon size={14} strokeWidth={isActive ? 2 : 1} />
 <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black">
 {tab.label}
 </span>
 </button>
 );
 })}
 </div>

 {/* Content Area */}
 <div className="w-full max-w-[400px] px-8 text-center z-10 mt-8">
 <AnimatePresence mode="wait">
 
 {activeTab === 'engine' && (
 <motion.div key="engine"initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
 <p className="font-serif italic text-xl text-nous-text0">"The mirror awaits your query."</p>
 <div className="relative">
 <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-nous-subtle">{'>'}</span>
 <input 
 type="text"
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 placeholder="Search the archive or ask the oracle..."
 className="w-full bg-transparent border-b border-nous-border py-2 pl-6 pr-4 font-mono text-sm text-nous-text text-nous-text outline-none placeholder:text-nous-subtle"
 />
 </div>
 </motion.div>
 )}

 {activeTab === 'mimi' && (
 <LiveMentor 
 key="mimi"
 name="Mimi"
 role="The Archivist // Context Builder"
 voiceName="Kore"
 systemInstruction={MIMI_SYSTEM_INSTRUCTION}
 onTranscriptUpdate={setScribeTranscript}
 >
 {scribeTranscript.trim() && onGenerateZine && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-4">
 <button
 onClick={() => onGenerateZine(`Scribe Notes: ${scribeTranscript}`)}
 className="px-4 py-2 border border-nous-border rounded-full text-[10px] uppercase tracking-widest hover:bg-nous-base transition-colors flex items-center gap-2"
 >
 <Sparkles size={12} />
 Generate Manifest from Notes
 </button>
 </motion.div>
 )}
 </LiveMentor>
 )}

 {activeTab === 'cyrus' && (
 <LiveMentor 
 key="cyrus"
 name="Cyrus"
 role="The Oracle // Strategic Director"
 voiceName="Charon"
 systemInstruction={CYRUS_SYSTEM_INSTRUCTION}
 onTranscriptUpdate={setScribeTranscript}
 >
 {scribeTranscript.trim() && onGenerateZine && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-4">
 <button
 onClick={() => onGenerateZine(`Scribe Notes: ${scribeTranscript}`)}
 className="px-4 py-2 border border-nous-border rounded-full text-[10px] uppercase tracking-widest hover:bg-nous-base transition-colors flex items-center gap-2"
 >
 <Sparkles size={12} />
 Generate Manifest from Notes
 </button>
 </motion.div>
 )}
 </LiveMentor>
 )}

 {activeTab === 'synthesis' && (
 <motion.div key="synthesis"initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
 <div className="space-y-2">
 <span className="font-sans text-[9px] uppercase tracking-widest text-nous-subtle block">Dual-Agent Protocol</span>
 <h2 className="font-serif text-3xl italic text-nous-text text-nous-text">The Synthesis.</h2>
 </div>
 
 {!isGeneratingDebate && !debateAudioUrl && (
 <>
 <div className="relative">
 <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-nous-subtle">{'>'}</span>
 <input 
 type="text"
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 placeholder="Enter a topic for debate..."
 className="w-full bg-transparent border-b border-nous-border py-2 pl-6 pr-4 font-mono text-sm text-nous-text text-nous-text outline-none placeholder:text-nous-subtle"
 />
 </div>
 <button 
 onClick={handleGenerateDebate}
 disabled={!inputValue.trim()}
 className="w-full py-3 border border-nous-border  text-nous-text text-nous-text font-sans text-[9px] uppercase tracking-widest font-black hover:bg-nous-base hover:text-nous-text dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Generate Audio Debate
 </button>
 </>
 )}

 {isGeneratingDebate && (
 <div className="flex flex-col items-center justify-center space-y-4 py-8">
 <Loader2 size={24} className="animate-spin text-nous-subtle"/>
 <p className="font-mono text-[10px] text-nous-text0 uppercase tracking-widest">
 Orchestrating Dual-Persona Synthesis...
 </p>
 </div>
 )}

 {debateAudioUrl && debateTranscript && (
 <div className="space-y-6">
 {onGenerateZine && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-4">
 <button
 onClick={() => {
 const formattedDebate = debateTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');
 onGenerateZine(`Scribe Debate Notes:\n${formattedDebate}`);
 }}
 className="px-4 py-2 border border-nous-border rounded-full text-[10px] uppercase tracking-widest hover:bg-nous-base transition-colors flex items-center gap-2"
 >
 <Sparkles size={12} />
 Generate Manifest from Notes
 </button>
 </motion.div>
 )}

 <div className="flex items-center justify-center gap-4">
 <button 
 onClick={toggleDebateAudio}
 className="w-12 h-12 rounded-full border border-nous-border  flex items-center justify-center text-nous-text text-nous-text hover:bg-nous-base transition-colors"
 >
 {isPlayingDebate ? <Pause size={16} /> : <Play size={16} className="ml-1"/>}
 </button>
 <div className="flex-1 h-1 bg-stone-200 rounded-full overflow-hidden">
 <motion.div 
 className="h-full bg-nous-base "
 initial={{ width:"0%"}}
 animate={{ width: isPlayingDebate ?"100%":"0%"}}
 transition={{ duration: 30, ease:"linear"}} // Approximate duration
 />
 </div>
 </div>

 <div className="h-48 overflow-y-auto text-left space-y-4 pr-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700">
 {debateTranscript.map((turn, idx) => (
 <div key={idx} className={`space-y-1 ${turn.speaker === 'Mimi' ? 'pl-4 border-l-2 border-nous-border ' : 'pr-4 border-r-2 border-nous-border text-right'}`}>
 <span className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black">
 {turn.speaker}
 </span>
 <p className="font-serif text-sm text-nous-text leading-relaxed">
 {turn.text}
 </p>
 </div>
 ))}
 {synthesisText && (
 <div className="pt-4 mt-4 border-t border-nous-border">
 <span className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black block mb-2">
 Synthesis
 </span>
 <p className="font-mono text-[10px] text-nous-subtle uppercase leading-relaxed">
 {synthesisText}
 </p>
 </div>
 )}
 </div>

 <button 
 onClick={() => {
 setDebateAudioUrl(null);
 setDebateTranscript(null);
 setSynthesisText(null);
 setInputValue('');
 }}
 className="text-[10px] font-mono text-nous-subtle hover:text-nous-text hover:text-nous-text uppercase tracking-widest underline underline-offset-4"
 >
 Reset Protocol
 </button>
 </div>
 )}
 
 {debateAudioUrl && (
 <audio 
 ref={audioRef} 
 src={debateAudioUrl} 
 onEnded={() => setIsPlayingDebate(false)}
 className="hidden"
 />
 )}
 </motion.div>
 )}

 </AnimatePresence>
 </div>

 {/* Bottom Equator Line */}
 <div className="absolute bottom-24 w-1/2 h-px bg-stone-200"/>
 <span className="absolute bottom-16 font-mono text-[8px] text-nous-subtle uppercase tracking-widest">
 Mimi Sovereign Registry // Scribe v1.0
 </span>
 </motion.div>
 </motion.div>
 );
};
