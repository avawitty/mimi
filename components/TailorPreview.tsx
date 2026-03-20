
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Loader2, Sparkles, RefreshCw, Maximize2, Download } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { TailorLogicDraft } from '../types';
import { generateZineImage } from '../services/geminiService';
import { addToPocket } from '../services/firebaseUtils';
import { useUser } from '../contexts/UserContext';

interface TailorPreviewProps {
  draft: TailorLogicDraft;
  activePersonaId: string;
  apiKey?: string;
}

export const TailorPreview: React.FC<TailorPreviewProps> = ({ draft, activePersonaId, apiKey }) => {
  const { user } = useUser();
  const { handleError } = useErrorHandler();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      handleError(err, "Failed to manifest preview.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToPocket = async () => {
    if (!previewUrl || !user) return;
    setIsSaving(true);
    try {
      await addToPocket(user.uid, 'image', {
        imageUrl: previewUrl,
        prompt: `Tailor Preview: ${draft.positioningCore.aestheticCore.eraBias}`
      });
      // Show temporary success state
      const btn = document.getElementById('save-preview-btn');
      if (btn) {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to save preview:", err);
    } finally {
      setIsSaving(false);
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
        {previewUrl && (
          <button 
            id="save-preview-btn"
            onClick={handleSaveToPocket}
            disabled={isSaving}
            className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full text-stone-600 dark:text-stone-300 shadow-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
            title="Save to Archive"
          >
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          </button>
        )}
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
