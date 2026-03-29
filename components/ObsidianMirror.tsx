
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles, Radio, Activity, RefreshCw, Bookmark, Check, Loader2, Zap, Waves, MessageSquare, ExternalLink, Copy, CornerDownRight, Orbit, Sun, Moon, Info, Fingerprint, AlertTriangle } from 'lucide-react';
import { fetchCommunityZines } from '../services/firebase';
import { generateMirrorRefraction } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';

const DissonanceCanvas: React.FC<{ score: number }> = ({ score }) => {
 const canvasRef = useRef<HTMLCanvasElement>(null);
 
 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 let animationFrameId: number;
 let time = 0;

 const render = () => {
 time += 0.01;
 const { width, height } = canvas;
 ctx.clearRect(0, 0, width, height);
 
 const intensity = score / 100;
 ctx.strokeStyle = `rgba(168, 162, 158, ${0.1 + intensity * 0.4})`;
 ctx.lineWidth = 1;

 for (let i = 0; i < 3; i++) {
 ctx.beginPath();
 for (let x = 0; x < width; x += 5) {
 const y = height / 2 + 
 Math.sin(x * 0.02 + time + i) * (15 * intensity) + 
 Math.cos(x * 0.03 - time * 0.7) * (8 * intensity);
 if (x === 0) ctx.moveTo(x, y);
 else ctx.lineTo(x, y);
 }
 ctx.stroke();
 }
 animationFrameId = requestAnimationFrame(render);
 };

 render();
 return () => cancelAnimationFrame(animationFrameId);
 }, [score]);

 return <canvas ref={canvasRef} width={400} height={80} className="w-full h-12 opacity-60"/>;
};

export const ObsidianMirror: React.FC = () => {
 const { user, profile } = useUser();
 const [omen, setOmen] = useState<string | null>(null);
 const [provenance, setProvenance] = useState<string | null>(null);
 const [manifestationUrl, setManifestationUrl] = useState<string | null>(null);
 const [loading, setLoading] = useState(true);
 const [ritualStep, setRitualStep] = useState(0);
 const [isArchiving, setIsArchiving] = useState(false);
 const [isArchived, setIsArchived] = useState(false);
 const [dissonance, setDissonance] = useState(0);
 const [showLogic, setShowLogic] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const RITUAL_TEXTS = [
"Analyzing spatial threshold...",
"Calibrating rod/cone resonance...",
"Intercepting structural signals...",
"Binding architectural omens...",
"Reconciling taste manifesto...",
"Re-syncing with the collective void..."
 ];

 const fetchOmen = async () => {
 setLoading(true);
 setIsArchived(false);
 setShowLogic(false);
 setError(null);
 setRitualStep(0);
 
 const interval = setInterval(() => setRitualStep(prev => (prev + 1) % RITUAL_TEXTS.length), 1500);

 try {
 const zines = await fetchCommunityZines(12);
 const titles = (zines || []).map(z => z.content?.headlines?.[0] || z.title).join(', ');

 const data = await generateMirrorRefraction(profile, titles);
 
 setOmen(data.omen);
 setDissonance(data.dissonance);
 setProvenance(data.provenance);
 setManifestationUrl(data.imageUrl);

 } catch (e: any) {
 console.error("MIMI // The Lens Signal Failure:", e);
 const errorMsg = e.message ||"The signal was obscured by structural dissonance.";
 setError(errorMsg);
 setOmen(null);
 } finally {
 clearInterval(interval);
 setLoading(false);
 }
 };

 const handleArchiveOmen = async () => {
 if (!omen || isArchiving || isArchived) return;
 setIsArchiving(true);
 try {
 const targetUid = user?.uid || (profile?.uid) || 'ghost_temporary';
 const { archiveManager } = await import('../services/archiveManager');
 await archiveManager.saveToPocket(targetUid, 'omen', { 
 omenText: omen, 
 provenance: provenance,
 imageUrl: manifestationUrl || undefined,
 metaphor: `Spatial refraction captured for ${profile?.zodiacSign ||"Ghost"}`,
 zodiacSign: profile?.zodiacSign
 });
 setIsArchived(true);
 } catch (e) {
 console.error("MIMI // The Lens Archive failed:", e);
 } finally {
 setIsArchiving(false);
 }
 };

 useEffect(() => { fetchOmen(); }, []);

 return (
 <div className="w-full min-h-screen flex flex-col items-center justify-start pt-24 md:pt-32 p-4 md:p-6 bg-nous-base/30 dark:bg transition-colors duration-1000 pb-32">
 <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 space-y-2">
 <h2 className="font-serif text-3xl md:text-5xl italic tracking-tighter luminescent-text text-nous-text ">The Lens</h2>
 <div className="flex items-center justify-center gap-4">
 <span className="font-sans text-[7px] uppercase tracking-[1em] text-nous-subtle font-black">Twilight Refraction</span>
 {profile?.zodiacSign && (
 <div className="flex items-center gap-2 px-3 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-none">
 <Sun size={10} className="text-amber-500"/>
 <span className="font-sans text-[7px] uppercase tracking-widest font-black text-indigo-400">{profile.zodiacSign} Signature</span>
 </div>
 )}
 </div>
 </motion.div>

 <div className="min-h-[300px] w-full flex flex-col items-center justify-center relative py-6">
 <AnimatePresence mode="wait">
 {loading ? (
 <motion.div key="loading"initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 flex flex-col items-center">
 <Loader2 className="animate-spin text-nous-text"size={24} />
 <p className="font-serif text-lg italic text-nous-subtle">{RITUAL_TEXTS[ritualStep]}</p>
 </motion.div>
 ) : error ? (
 <motion.div key="error"initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-8 py-12 px-6">
 <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-none border border-red-100 dark:border-red-900/30">
 <AlertTriangle size={32} className="text-red-500 animate-pulse"/>
 </div>
 <div className="space-y-4 max-w-md mx-auto">
 <h3 className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-red-500">Handshake Failure</h3>
 <p className="font-serif italic text-xl md:text-2xl text-nous-text0 leading-tight">
"{error}"
 </p>
 </div>
 <button onClick={fetchOmen} className="px-8 py-3 bg-nous-text text-nous-base font-sans text-[10px] uppercase tracking-[0.5em] font-black rounded-none active:scale-95 transition-all flex items-center gap-3">
 <RefreshCw size={14} /> Re-Align Threshold
 </button>
 </motion.div>
 ) : (
 <motion.div key="omen"initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
 <div className="w-48 h-48 md:w-64 md:h-64 rounded-none overflow-hidden border border-nous-border relative bg-black group">
 {manifestationUrl && <img src={manifestationUrl} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"/>}
 <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
 <Orbit size={180} className="text-white animate-[spin_20s_linear_infinite]"/>
 </div>
 </div>
 <div className="max-w-lg space-y-6">
 <p className="font-serif text-2xl md:text-4xl italic text-nous-text text-nous-text leading-tight px-4 font-medium">"{omen}"</p>
 
 <AnimatePresence>
 {showLogic && provenance && (
 <motion.div 
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="px-6 py-4 bg-nous-base/50 /50 border border-nous-border rounded-none overflow-hidden"
 >
 <div className="flex items-center gap-2 mb-2 text-nous-subtle">
 <Fingerprint size={10} />
 <span className="font-sans text-[7px] uppercase tracking-widest font-black">Lens Provenance</span>
 </div>
 <p className="font-serif italic text-sm text-nous-text0 leading-relaxed">
 {provenance}
 </p>
 </motion.div>
 )}
 </AnimatePresence>

 <div className="flex gap-4 justify-center">
 <button onClick={fetchOmen} className="p-4 rounded-none border border-nous-border text-nous-subtle hover:text-nous-text transition-all active:rotate-180"><RefreshCw size={14} /></button>
 <button 
 onClick={() => setShowLogic(!showLogic)} 
 className={`p-4 rounded-none border transition-all ${showLogic ? 'bg-nous-text text-nous-base border-nous-text  ' : 'border-nous-border text-nous-subtle hover:text-nous-text'}`}
 >
 <Info size={14} />
 </button>
 <button onClick={handleArchiveOmen} disabled={isArchived || isArchiving} className={`px-8 py-2 rounded-none font-sans text-[8px] uppercase tracking-[0.4em] font-black transition-all flex items-center gap-3 ${isArchived ? 'bg-nous-base text-nous-subtle border-nous-border ' : 'bg-nous-text text-nous-base active:scale-95'}`}>
 {isArchiving ? <Loader2 size={10} className="animate-spin"/> : isArchived ? <Check size={10} /> : <Bookmark size={10} />}
 {isArchived ? 'Captured' : 'Commit'}
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <div className="mt-12 w-full max-w-2xl grid md:grid-cols-2 gap-10 border-t border-nous-border pt-10">
 <div className="space-y-4 text-left">
 <div className="flex items-center gap-2 text-nous-subtle"><Zap size={10} className="text-amber-500"/><span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black">Dissonance</span></div>
 <DissonanceCanvas score={dissonance} />
 <p className="font-serif italic text-xs text-nous-subtle">Current structural friction detected in the collective threshold.</p>
 </div>
 
 <div className="space-y-6">
 <div className="flex items-center gap-2 text-nous-subtle"><Orbit size={10} /><span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black">The Lens Registry</span></div>
 <button 
 onClick={() => alert("The Lens is for threshold reflection. To actively commit artifacts to the registry, descend into the Obsidian Studio.")}
 className="w-full flex items-center justify-between p-4 md:p-5 bg-white border border-nous-border rounded-none group hover:border-nous-text dark:hover:border-white transition-all relative overflow-hidden"
 >
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-nous-text text-nous-base rounded-none flex items-center justify-center">
 <CornerDownRight size={18} />
 </div>
 <div className="flex flex-col text-left">
 <span className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-nous-text text-nous-text">
 Shadow Studio
 </span>
 <span className="font-serif italic text-[10px] md:text-xs text-nous-subtle">Commit Omens to form</span>
 </div>
 </div>
 <ExternalLink size={14} className="text-nous-subtle group-hover:text-nous-text dark:group-hover:text-nous-text transition-colors"/>
 </button>
 </div>
 </div>
 </div>
 </div>
 );
};
