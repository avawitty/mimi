
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Loader2, Sparkles, RefreshCw, Maximize2 } from 'lucide-react';
import { TailorLogicDraft } from '../types';
import { generateZineImage } from '../services/geminiService';

interface TailorPreviewProps {
  draft: TailorLogicDraft;
  activePersonaId: string;
  apiKey?: string;
}

export const TailorPreview: React.FC<TailorPreviewProps> = ({ draft, activePersonaId, apiKey }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastGeneratedDraft = useRef<string>('');

  const generatePreview = async (force = false) => {
    const currentDraftString = JSON.stringify({
      eraBias: draft.positioningCore.aestheticCore.eraBias,
      silhouettes: draft.positioningCore.aestheticCore.silhouettes,
      materiality: draft.positioningCore.aestheticCore.materiality,
      chromatic: draft.expressionEngine.chromaticRegistry
    });

    if (!force && currentDraftString === lastGeneratedDraft.current) return;

    setIsLoading(true);
    setError(null);
    lastGeneratedDraft.current = currentDraftString;

    try {
      const prompt = `A high-end editorial fashion photograph, centered composition, sharp focus, professional lighting, representing the aesthetic DNA: ${draft.positioningCore.aestheticCore.eraBias}, silhouettes: ${draft.positioningCore.aestheticCore.silhouettes.join(', ')}, materiality: ${draft.positioningCore.aestheticCore.materiality.join(', ')}.`;
      
      // We pass a mock profile object that generateZineImage expects
      const mockProfile = { tailorDraft: draft };
      
      const url = await generateZineImage(
        prompt, 
        '3:4', 
        '1K', 
        mockProfile, 
        true, // isLite
        apiKey
      );
      
      setPreviewUrl(url);
    } catch (err: any) {
      console.error("Preview Generation Failed:", err);
      setError("Failed to manifest preview.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      generatePreview();
    }, 3000); // 3 second debounce

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [draft]);

  return (
    <div className="relative group aspect-[3/4] bg-stone-100 dark:bg-stone-900 rounded-sm overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner">
      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.img
            key={previewUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            src={previewUrl}
            alt="Aesthetic Preview"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
            <ImageIcon size={32} className="mb-4 opacity-20" />
            <p className="font-serif italic text-xs">Adjust your Tailor logic to manifest a visual preview.</p>
          </div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
      
      <div className="absolute top-3 right-3 flex gap-2">
        <button 
          onClick={() => generatePreview(true)}
          disabled={isLoading}
          className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full text-stone-600 dark:text-stone-300 shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
          title="Regenerate Preview"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-emerald-500" />
            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500">Manifesting...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-3 left-3 right-3 bg-red-500/90 backdrop-blur-md text-white p-2 rounded-sm text-[8px] uppercase tracking-widest font-black flex items-center gap-2">
          <Sparkles size={10} />
          {error}
        </div>
      )}

      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md px-2 py-1 rounded-sm border border-black/5 dark:border-white/5">
          <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-500">Aesthetic Preview // 1K</span>
        </div>
      </div>
    </div>
  );
};
