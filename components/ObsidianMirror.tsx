
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles, Radio, Activity, RefreshCw, Bookmark, Check, Loader2, Zap, Waves } from 'lucide-react';
import { fetchCommunityZines, addToPocket } from '../services/firebase';
import { GoogleGenAI } from "@google/genai";
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

  return <canvas ref={canvasRef} width={400} height={80} className="w-full h-12 opacity-60" />;
};

export const ObsidianMirror: React.FC = () => {
  const { user, profile } = useUser();
  const [omen, setOmen] = useState<string | null>(null);
  const [manifestationUrl, setManifestationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ritualStep, setRitualStep] = useState(0);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [dissonance, setDissonance] = useState(0);

  const RITUAL_TEXTS = ["Consulting collective debris...", "Tracing spectral frequencies...", "Binding structural omens..."];

  const fetchOmen = async () => {
    setLoading(true);
    setIsArchived(false);
    setRitualStep(0);
    const interval = setInterval(() => setRitualStep(prev => (prev + 1) % RITUAL_TEXTS.length), 1500);

    try {
      const zines = await fetchCommunityZines(20);
      const titles = zines.map(z => z.title).join(', ');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Clique Context: [${titles}]. User Taste: ${profile?.tasteProfile?.inspirations || 'Minimalism'}. Evaluate current aesthetic dissonance. Generate: 1. A single, pretentiously minimalist Omen (12 words max). 2. A "Dissonance Score" (0-100). Return as JSON: { "omen": "...", "dissonance": 0 }`,
        config: { responseMimeType: "application/json", systemInstruction: "You are Mimi. Your omens are cryptic, editorial, and hyper-chic." }
      });
      const data = JSON.parse(response.text || "{}");
      setOmen(data.omen);
      setDissonance(data.dissonance);

      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A circular obsidian manifestation of this omen: "${data.omen}". Macro photography of velvet glitching into liquid mercury, minimalist, expensive, film grain.` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setManifestationUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (e) {
      setOmen("The signal is obscured by recent clutter.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleArchiveOmen = async () => {
    if (!omen || isArchiving || isArchived) return;
    setIsArchiving(true);
    try {
      // Use ghost ID if no user is present to ensure local storage always captures it
      const targetUid = user?.uid || 'ghost_temporary';
      await addToPocket(targetUid, 'omen', { 
        omenText: omen, 
        imageUrl: manifestationUrl || undefined,
        metaphor: "Spectral Refraction captured in Obsidian Mirror"
      });
      setIsArchived(true);
    } catch (e) {
      console.error("MIMI // Mirror Archive failed:", e);
    } finally {
      setIsArchiving(false);
    }
  };

  useEffect(() => { fetchOmen(); }, []);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start pt-24 md:pt-32 p-6 bg-stone-50/30 dark:bg-[#080707] transition-colors duration-1000">
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 space-y-2">
              <h2 className="font-serif text-3xl md:text-5xl italic tracking-tighter luminescent-text text-nous-text dark:text-white">Obsidian Mirror</h2>
              <span className="font-sans text-[7px] uppercase tracking-[1em] text-stone-400 font-black">Spectral Refraction</span>
          </motion.div>

          <div className="min-h-[300px] w-full flex flex-col items-center justify-center relative py-6">
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 flex flex-col items-center">
                        <Loader2 className="animate-spin text-stone-200" size={24} />
                        <p className="font-serif text-lg italic text-stone-400">{RITUAL_TEXTS[ritualStep]}</p>
                    </motion.div>
                ) : (
                    <motion.div key="omen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full flex flex-col items-center">
                        <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border border-stone-200 dark:border-stone-800 relative bg-black shadow-2xl group">
                            {manifestationUrl && <img src={manifestationUrl} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000" />}
                        </div>
                        <div className="max-w-lg space-y-4">
                          <p className="font-serif text-xl md:text-3xl italic text-nous-text dark:text-white leading-tight px-4 italic">"{omen}"</p>
                          <div className="flex gap-4 justify-center">
                              <button onClick={fetchOmen} className="p-4 rounded-full border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-nous-text transition-all"><RefreshCw size={14} /></button>
                              <button onClick={handleArchiveOmen} disabled={isArchived || isArchiving} className={`px-8 py-2 rounded-full font-sans text-[8px] uppercase tracking-[0.4em] font-black transition-all flex items-center gap-3 ${isArchived ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-nous-text dark:bg-white text-white dark:text-black shadow-xl active:scale-95'}`}>
                                  {isArchiving ? <Loader2 size={10} className="animate-spin" /> : isArchived ? <Check size={10} /> : <Bookmark size={10} />}
                                  {isArchived ? 'Captured' : 'Commit'}
                              </button>
                          </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <div className="mt-6 w-full max-w-2xl grid md:grid-cols-2 gap-6 border-t border-stone-100 dark:border-stone-900 pt-6">
              <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-stone-400"><Zap size={10} className="text-amber-500" /><span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black">Dissonance</span></div>
                  <DissonanceCanvas score={dissonance} />
              </div>
              <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-stone-400"><Waves size={10} /><span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black">Spectral Tide</span></div>
                  <div className="flex justify-between border-b border-stone-100 dark:border-stone-900 pb-1">
                      <span className="font-serif italic text-stone-400 text-[10px]">Sync</span>
                      <span className="font-mono text-[8px] text-emerald-500">STABLE</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
