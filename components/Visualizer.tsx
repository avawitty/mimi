
import React, { useState, useEffect } from 'react';
import { generateZineImage, editZineImage } from '../services/geminiService';
import { Loader2, Bookmark, Check, RefreshCw, Maximize2 } from 'lucide-react';
import { AspectRatio, ImageSize } from '../types';
import { addToPocket, recordTasteEdit } from '../services/firebase';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from './Tooltip';

interface VisualizerProps {
  prompt: string;
  className?: string;
  defaultAspectRatio?: AspectRatio;
  onUpdate?: (newImage: string) => void;
  initialImage?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ prompt, className, defaultAspectRatio = '1:1', onUpdate, initialImage }) => {
  const { user } = useUser();
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBinding, setIsBinding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultAspectRatio);
  const [size, setSize] = useState<ImageSize>('1K');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (initialImage) setImageSrc(initialImage);
  }, [initialImage]);

  const handleDevelop = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const base64 = await generateZineImage(prompt, aspectRatio, size);
      setImageSrc(base64);
      setIsSaved(false); 
      if (onUpdate) onUpdate(base64);
    } catch (e: any) {
      setError(e.message || "Vision obscured.");
    } finally { setIsLoading(false); }
  };

  const handleRefract = async () => {
    if (!imageSrc || !editPrompt) return;
    setIsLoading(true);
    setIsBinding(true);
    try {
      // 1. Structural Refraction Ritual
      const base64Data = imageSrc.includes('base64,') ? imageSrc.split(',')[1] : imageSrc;
      const refined = await editZineImage(base64Data, editPrompt);
      
      // 2. Manifestation
      setImageSrc(refined);
      
      // 3. Structural Anchor (Force state to parent)
      if (onUpdate) onUpdate(refined);
      
      // 4. Archive Ritual
      if (user) await recordTasteEdit(user.uid, imageSrc, refined, prompt, editPrompt);

      // 5. Exit Ritual
      setIsEditing(false);
      setEditPrompt('');
    } catch (e) {
      console.error("MIMI // Refraction failed:", e);
      setError("Mutation rejected.");
    } finally { 
      setIsLoading(false); 
      setIsBinding(false);
    }
  };

  const handleSaveToPocket = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || !imageSrc || isSaving || isSaved) return;
    setIsSaving(true);
    try {
      await addToPocket(user.uid, 'image', { imageUrl: imageSrc, prompt, aspectRatio });
      setIsSaved(true);
    } catch (e) { 
      console.error("MIMI // Pocket failure:", e); 
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    <div className={`relative w-full flex flex-col items-center ${className}`}>
      <div 
        className="relative w-full bg-white dark:bg-stone-900 shadow-[0_40px_80px_rgba(0,0,0,0.08)] overflow-hidden group border border-stone-100 dark:border-stone-800 transition-all duration-1000 rounded-sm"
        style={{ aspectRatio: aspectRatio.split(':').join('/') }}
      >
        {imageSrc ? (
          <div className="relative w-full h-full group">
            <img src={imageSrc} alt="" className="w-full h-full object-cover grayscale md:hover:grayscale-0 transition-all duration-[2s] ease-out" />
            
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-white/95 dark:bg-black/95 backdrop-blur-3xl px-8 py-4 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all border border-stone-100 dark:border-stone-800 translate-y-4 group-hover:translate-y-0 z-20">
                 <Tooltip text={isSaved ? "Saved" : "Archive Fragment"}>
                   <button onClick={handleSaveToPocket} className={`transition-all ${isSaved ? 'text-emerald-500' : 'text-stone-400 hover:text-nous-text'}`}>
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                   </button>
                 </Tooltip>
                 <div className="w-px h-4 bg-stone-200" />
                 <Tooltip text="Mutate Vision">
                   <button onClick={() => setIsEditing(true)} className="text-stone-400 hover:text-nous-text flex items-center gap-2">
                      <RefreshCw size={18} />
                      <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black">Refract</span>
                   </button>
                 </Tooltip>
            </div>

            <AnimatePresence>
              {isEditing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-8 gap-8">
                  <div className="w-full max-w-sm space-y-6 text-center">
                    <span className="font-sans text-[8px] uppercase tracking-[0.6em] text-stone-400 font-black">Mutation Instructions</span>
                    <textarea 
                      value={editPrompt} 
                      onChange={(e) => setEditPrompt(e.target.value)} 
                      placeholder="e.g. 'Add a silver haze'..." 
                      className="w-full bg-transparent border-b border-stone-200 text-center font-serif text-2xl italic focus:outline-none placeholder-stone-300 dark:placeholder-stone-700 resize-none h-24 dark:text-white"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setIsEditing(false)} disabled={isBinding} className="px-8 py-3 border border-stone-200 dark:border-stone-800 font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 hover:text-red-500 hover:border-red-500 transition-all">Cancel</button>
                    <button onClick={handleRefract} disabled={!editPrompt.trim() || isBinding} className="px-8 py-3 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[9px] uppercase tracking-widest font-black disabled:opacity-30 flex items-center gap-3">
                      {isBinding ? <Loader2 size={12} className="animate-spin" /> : null}
                      {isBinding ? 'Binding...' : 'Apply Trace'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-stone-50/50 dark:bg-stone-950/20">
             {isLoading ? (
               <div className="flex flex-col items-center gap-6">
                 <Loader2 className="animate-spin text-stone-300" size={32} />
                 <p className="font-serif italic text-lg animate-pulse text-stone-400">Refining structural form...</p>
               </div>
             ) : (
                <div className="w-full max-w-lg text-center space-y-12 animate-fade-in">
                  <p className="font-serif italic text-2xl md:text-3xl text-stone-300 dark:text-stone-700 leading-tight">"{prompt}"</p>
                  <button onClick={handleDevelop} className="font-sans text-[10px] uppercase tracking-[0.6em] text-stone-500 hover:text-nous-text font-black transition-all border-b border-transparent hover:border-current pb-2 flex items-center gap-3">
                    <Maximize2 size={14} /> Develop Artifact
                  </button>
                </div>
             )}
          </div>
        )}
      </div>
      {error && <p className="mt-4 font-sans text-[8px] uppercase tracking-widest text-red-500 font-black">{error}</p>}
    </div>
  );
};
