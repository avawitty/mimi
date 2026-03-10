
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { generateZineImage, applyTreatment, animateShardWithVeo, analyzeMiseEnScene } from '../services/geminiService';
import { addToPocket } from '../services/firebase';
import { Loader2, RefreshCw, Bookmark, Check, Pencil, Download, Square, RectangleHorizontal, RectangleVertical, X, Sparkles, Image as ImageIcon, Ruler, Film, Activity, Zap, Maximize2, Layers, Eye } from 'lucide-react';
import { AspectRatio, ImageSize } from '../types';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

const SUPPORTED_ASPECT_RATIOS: AspectRatio[] = ['1:1', '3:4', '9:16', '16:9'];
const SUPPORTED_SIZES: ImageSize[] = ['1K', '2K', '4K'];

export const Visualizer: React.FC<{ 
  prompt: string; 
  defaultAspectRatio?: AspectRatio; 
  defaultImageSize?: ImageSize;
  initialImage?: string; 
  isArtifact?: boolean;
  isLite?: boolean; 
  delay?: number;
  artifacts?: any[];
}> = ({ prompt, defaultAspectRatio = '1:1', defaultImageSize = '1K', initialImage, isArtifact, isLite, delay = 0, artifacts }) => {
  const { user, profile, activePersona } = useUser();
  const [variants, setVariants] = useState<string[]>(initialImage ? [initialImage] : []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPocketSaved, setIsPocketSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultAspectRatio);
  const [imageSize, setImageSize] = useState<ImageSize>(defaultImageSize);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (variants.length === 0 && prompt && !isLoading) {
        const t = setTimeout(() => handleDevelop(), delay);
        return () => clearTimeout(t);
    }
  }, [prompt, delay]);

  const isVideo = (url: string) => url?.startsWith('data:video/') || url?.includes('.mp4');

  const handleDevelop = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsLoading(true);
    setImgLoaded(false);
    setIsPocketSaved(false);
    setIsEditing(false);
    try {
      const personaKey = activePersona?.apiKey ? activePersona.apiKey : undefined;
      const result = await generateZineImage(prompt, aspectRatio, imageSize, profile, isLite, personaKey, artifacts);
      setVariants(prev => {
          const next = [...prev, result];
          const limited = next.slice(-3); // Keep only 3 most recent
          setSelectedIdx(limited.length - 1);
          return limited;
      });
    } catch (e) { 
        console.error("MIMI // Plate Development Failed:", e);
    } finally { setIsLoading(false); }
  };

  const handleAnimate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variants[selectedIdx] || isAnimating) return;
    setIsAnimating(true);
    
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Veo Calibration Initialized...", icon: <Film size={14} className="text-amber-500" /> } 
    }));
    
    try {
      const currentSource = variants[selectedIdx];
      const res = await animateShardWithVeo(currentSource, prompt, aspectRatio === '9:16' ? '9:16' : '16:9');
      setVariants(prev => {
          const next = [...prev, res as string];
          const limited = next.slice(-3);
          setSelectedIdx(limited.length - 1);
          return limited;
      });
      
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Motion Refraction Manifested.", icon: <Check size={14} className="text-emerald-500" /> } 
      }));
    } catch (e) {
      console.error("MIMI // V-O Refraction Failure:", e);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variants[selectedIdx] || isAnalyzing) return;
    setIsAnalyzing(true);
    
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Analyzing Mise en Scène...", icon: <Eye size={14} className="text-indigo-500" /> } 
    }));
    
    try {
      const currentSource = variants[selectedIdx];
      // Extract base64 and mimeType
      const match = currentSource.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
      if (!match) throw new Error("Invalid image format");
      const mimeType = match[1];
      const base64 = match[2];
      
      const analysis = await analyzeMiseEnScene(base64, mimeType, profile);
      
      // Store in pocket
      await addToPocket(user?.uid || 'ghost', 'text', {
          content: `Mise en Scène Analysis:\n\nDirector's Note: ${analysis.directors_note}\n\nLighting: ${analysis.lighting_analysis}\n\nCultural Parallel: ${analysis.cultural_parallel}\n\nSemiotic Touchpoints: ${analysis.semiotic_touchpoints?.join(', ')}`,
          sourceImage: currentSource
      });
      
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Analysis Saved to Pocket.", icon: <Check size={14} className="text-emerald-500" /> } 
      }));
    } catch (e) {
      console.error("MIMI // Analysis Failure:", e);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Analysis Failed.", icon: <X size={14} className="text-red-500" /> } 
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cycleRatio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (SUPPORTED_ASPECT_RATIOS.indexOf(aspectRatio) + 1) % SUPPORTED_ASPECT_RATIOS.length;
    setAspectRatio(SUPPORTED_ASPECT_RATIOS[nextIdx]);
  };

  const handleSelectVariant = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (variants[idx]) {
        setSelectedIdx(idx);
        setImgLoaded(false);
    }
  };

  const saveToPocket = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variants[selectedIdx]) return;
    await addToPocket(user?.uid || 'ghost', 'image', { 
        imageUrl: variants[selectedIdx], 
        prompt,
        aspectRatio 
    });
    setIsPocketSaved(true);
    setTimeout(() => setIsPocketSaved(false), 3000);
  };

  return (
    <div className={`relative w-full flex flex-col items-center group/visualizer ${isArtifact ? 'h-full' : ''}`}>
      <div 
        className={`relative w-full overflow-hidden border border-stone-100 dark:border-stone-800 shadow-2xl rounded-sm bg-stone-50 dark:bg-stone-900 transition-all duration-700 ${isArtifact ? 'h-full flex items-center justify-center' : ''}`} 
        style={isArtifact ? {} : { aspectRatio: aspectRatio.replace(':', '/') }}
      >
        <AnimatePresence>
            {(isLoading || isAnimating || isAnalyzing) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-stone-950/40 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
                 <Loader2 size={32} className="animate-spin text-emerald-500" />
                 <span className="font-sans text-[8px] uppercase tracking-[0.6em] text-white font-black animate-pulse">
                    {isAnalyzing ? 'Analyzing Mise en Scène...' : isAnimating ? 'Refracting Motion...' : 'Developing Plate...'}
                 </span>
              </motion.div>
            )}
        </AnimatePresence>

        {variants[selectedIdx] ? (
          <div className="relative w-full h-full">
            {isVideo(variants[selectedIdx]) ? (
              <video src={variants[selectedIdx]} autoPlay loop muted playsInline className={`w-full h-full object-cover grayscale hover:grayscale-0`} />
            ) : (
              <img 
                src={variants[selectedIdx]} 
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full transition-all duration-[1s] group-hover/visualizer:grayscale-0 ${imgLoaded ? 'opacity-100 grayscale' : 'opacity-0 scale-110 blur-2xl'} ${isArtifact ? 'object-contain' : 'object-cover'}`} 
              />
            )}

            {/* VARIANT CONTROLS */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-2xl p-1.5 rounded-full border border-white/10 z-40 shadow-2xl opacity-0 group-hover/visualizer:opacity-100 transition-all">
               <div className="flex bg-white/10 px-3 py-1 rounded-full gap-2 border-r border-white/10 pr-4 mr-1">
                  {[0, 1, 2].map((i) => (
                    <button 
                        key={i} 
                        disabled={!variants[i]}
                        onClick={(e) => handleSelectVariant(i, e)} 
                        className={`w-6 h-6 rounded-full font-sans text-[8px] font-black transition-all ${!variants[i] ? 'opacity-10' : selectedIdx === i ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        0{i+1}
                    </button>
                  ))}
               </div>
               <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-2.5 text-stone-400 hover:text-white transition-colors"><Pencil size={14}/></button>
               <button onClick={saveToPocket} className={`p-2.5 transition-all ${isPocketSaved ? 'text-emerald-500' : 'text-stone-400 hover:text-white'}`}>{isPocketSaved ? <Check size={14}/> : <Bookmark size={14}/>}</button>
               <button onClick={handleAnalyze} disabled={isAnalyzing} className="p-2.5 text-stone-400 hover:text-indigo-400"><Eye size={14}/></button>
               <button onClick={handleAnimate} disabled={isAnimating} className="p-2.5 text-stone-400 hover:text-amber-400"><Film size={14}/></button>
               <div className="w-px h-6 bg-white/10 mx-1" />
               <button onClick={cycleRatio} className="p-2.5 text-stone-400 hover:text-white font-mono text-[8px]">{aspectRatio}</button>
               <button onClick={handleDevelop} className="p-2.5 text-stone-400 hover:text-emerald-400"><RefreshCw size={14}/></button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-8 bg-stone-100 dark:bg-stone-900/50">
             <button onClick={handleDevelop} className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Initialize Plate</button>
          </div>
        )}
      </div>
    </div>
  );
};
