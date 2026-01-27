
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { generateZineImage } from '../services/geminiService';
import { addToPocket } from '../services/firebase';
import { Loader2, RefreshCw, Maximize2, Bookmark, Check, AlertTriangle, Fingerprint, Sparkles, ImageOff, ShieldAlert, ZapOff, Lock, ServerCrash, Wind } from 'lucide-react';
import { AspectRatio, ImageSize } from '../types';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

const SUPPORTED_ASPECT_RATIOS: AspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

export const Visualizer: React.FC<{ 
  prompt: string; 
  negativePrompt?: string;
  className?: string; 
  defaultAspectRatio?: AspectRatio; 
  onUpdate?: (newImage: string) => void; 
  initialImage?: string; 
  isArtifact?: boolean;
}> = ({ prompt, negativePrompt, className, defaultAspectRatio = '1:1', onUpdate, initialImage, isArtifact }) => {
  const { user, profile } = useUser();
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPocketSaving, setIsPocketSaving] = useState(false);
  const [isPocketSaved, setIsPocketSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'safety' | 'rate' | 'auth' | 'server' | 'debris' | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const autoDevelopedRef = useRef(false);
  
  const isVaultedSignal = imageSrc === "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  const initialRatio = SUPPORTED_ASPECT_RATIOS.includes(defaultAspectRatio as AspectRatio) ? defaultAspectRatio : "1:1" as AspectRatio;
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialRatio);
  const [size, setSize] = useState<ImageSize>('1K');

  useEffect(() => {
    if (!imageSrc && prompt && !isLoading && !autoDevelopedRef.current) {
      autoDevelopedRef.current = true;
      handleDevelop();
    }
  }, [prompt, imageSrc]);

  useEffect(() => {
    if (initialImage) {
      setImageSrc(initialImage);
      setImageFailed(false);
      setError(null);
      setErrorType(null);
    }
  }, [initialImage]);

  const handleSaveToPocket = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageSrc || isPocketSaving || isPocketSaved) return;

    setIsPocketSaving(true);
    setError(null);
    try {
      await addToPocket(user?.uid || 'ghost', 'image', {
        imageUrl: imageSrc,
        prompt: prompt,
        aspectRatio: aspectRatio,
        userHandle: profile?.handle || 'Ghost',
        userAvatar: profile?.photoURL || undefined
      });
      setIsPocketSaved(true);
      setTimeout(() => setIsPocketSaved(false), 3000);
    } catch (err: any) {
      setError("Vault Failure.");
    } finally {
      setIsPocketSaving(false);
    }
  };

  const handleDevelop = async (e?: React.MouseEvent, distilled = false) => {
    if (e) e.stopPropagation();
    if (!prompt) return;
    
    setIsLoading(true);
    setIsPocketSaved(false);
    setImageFailed(false);
    setError(null);
    setErrorType(null);
    autoDevelopedRef.current = true;

    try {
      const safeRatio = SUPPORTED_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : "1:1" as AspectRatio;
      
      // If distilled path is chosen, strip the prompt to its most basic semiotic components
      const activePrompt = distilled 
        ? prompt.split(/[.,;]/)[0].slice(0, 100) 
        : prompt;

      const base64 = await generateZineImage(activePrompt, safeRatio, size, profile, negativePrompt);
      setImageSrc(base64);
      if (onUpdate) onUpdate(base64);
    } catch (e: any) {
      console.error("MIMI // Image Dev Error:", e);
      const msg = e.message || "Signal Dissonance.";
      setError(msg);
      setErrorType(e.code === 'ORACLE_COLLAPSE' ? 'debris' : e.code === 'SAFETY_BLOCK' ? 'safety' : 'server');
    } finally { setIsLoading(false); }
  };

  return (
    <div className={`relative w-full flex flex-col items-center ${className}`} onClick={(e) => e.stopPropagation()}>
      <div 
        className={`relative w-full overflow-hidden group border transition-all duration-1000 ${isVaultedSignal ? 'bg-black border-emerald-900/30' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 shadow-2xl'}`}
        style={{ aspectRatio: aspectRatio.split(':').join('/') }}
      >
        {imageSrc && !isLoading && !imageFailed ? (
          <div className="relative w-full h-full">
            <img 
              src={imageSrc} 
              alt="" 
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover grayscale transition-all duration-[2s] ease-out lg:hover:grayscale-0" 
            />
            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex items-center gap-2">
                <div className="bg-white/10 backdrop-blur-md p-1.5 md:p-2 rounded-full border border-white/20">
                  <Sparkles size={10} className="text-white/40" />
                </div>
            </div>
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xl p-1.5 md:p-2 rounded-full border border-white/10 z-30">
               <div className="flex bg-white/10 p-0.5 md:p-1 rounded-full">
                  {(['1K', '2K', '4K'] as ImageSize[]).map(s => (
                    <button key={s} onClick={(e) => { e.stopPropagation(); setSize(s); }} className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full font-sans text-[6px] md:text-[7px] uppercase tracking-widest transition-all ${size === s ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
               </div>
               <div className="flex gap-1 md:gap-2">
                   <button onClick={handleSaveToPocket} disabled={isPocketSaving || isPocketSaved} className={`p-2 md:p-2.5 rounded-full shadow-xl transition-all hover:scale-110 active:scale-90 ${isPocketSaved ? 'bg-emerald-50 text-white' : 'bg-white/20 text-white hover:bg-white'}`}>
                     {isPocketSaving ? <Loader2 size={12} className="animate-spin" /> : isPocketSaved ? <Check size={12} /> : <Bookmark size={12} />}
                   </button>
                   <button onClick={(e) => handleDevelop(e)} className="p-2 md:p-2.5 bg-white text-black rounded-full shadow-xl hover:scale-110 active:scale-90 transition-all">
                     <RefreshCw size={12} />
                   </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 bg-stone-50/50 dark:bg-stone-950/50">
             {isLoading ? (
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  <Loader2 className="animate-spin text-stone-300" size={24} />
                  <span className="font-sans text-[7px] md:text-[8px] uppercase tracking-[0.3em] text-stone-400 font-black">Developing {size}...</span>
                </div>
             ) : error ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-xs px-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full border border-red-100 dark:border-red-900/30 inline-block">
                    <ShieldAlert size={24} className="text-red-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-serif italic text-base text-stone-500 leading-tight">"{error}"</p>
                    <p className="font-sans text-[7px] uppercase tracking-widest text-stone-300 font-black">Environmental Structural Failure</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={(e) => handleDevelop(e)} className="w-full py-3 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[8px] uppercase tracking-[0.5em] font-black rounded-full shadow-lg active:scale-95 transition-all">Retry manifest</button>
                    <button onClick={(e) => handleDevelop(e, true)} className="w-full py-2 border border-stone-200 dark:border-stone-800 text-stone-400 hover:text-nous-text font-sans text-[7px] uppercase tracking-[0.4em] font-black rounded-full flex items-center justify-center gap-2 transition-all">
                       <Wind size={10} className="text-emerald-500" /> Distill Signal
                    </button>
                  </div>
                </motion.div>
             ) : (
                <div className="text-center space-y-4 md:space-y-8">
                  <p className="font-serif italic text-base md:text-xl text-stone-300 max-w-xs mx-auto px-4">"{prompt}"</p>
                  <button onClick={(e) => handleDevelop(e)} className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.5em] text-stone-500 hover:text-black dark:hover:text-white font-black transition-all border-b border-stone-200 pb-1.5 flex items-center gap-2 md:gap-3 mx-auto">
                    <Maximize2 size={12} /> Develop Artifact
                  </button>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
