
import React, { useState, useEffect } from 'react';
import { generateZineImage, editZineImage } from '../services/geminiService';
import { Loader2, Sparkles, Wand2, RefreshCcw, Bookmark, Check, Download } from 'lucide-react';
import { AspectRatio, ImageSize } from '../types';
import { addToPocket } from '../services/firebase';
import { useUser } from '../contexts/UserContext';

interface VisualizerProps {
  prompt: string;
  className?: string;
  defaultAspectRatio?: AspectRatio;
  referenceImageUrl?: string; // Optional user image to mix in
}

export const Visualizer: React.FC<VisualizerProps> = ({ prompt, className, defaultAspectRatio = '1:1', referenceImageUrl }) => {
  const { user } = useUser();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultAspectRatio);
  const [size, setSize] = useState<ImageSize>('1K');
  
  // Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');

  // Pocket State
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setAspectRatio(defaultAspectRatio);
  }, [defaultAspectRatio]);

  const handleDevelop = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const base64 = await generateZineImage(prompt, aspectRatio, size, referenceImageUrl);
      setImageSrc(base64);
      setIsSaved(false); 
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to develop.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (isLoading || !imageSrc || !editPrompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const base64 = await editZineImage(imageSrc, editPrompt);
      setImageSrc(base64); 
      setEditPrompt('');
      setIsEditing(false);
      setIsSaved(false); 
    } catch (e: any) {
      console.error(e);
      setError("Edit failed. " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToPocket = async () => {
    if (!user || !imageSrc || isSaving || isSaved) return;
    
    setIsSaving(true);
    try {
      await addToPocket(user.uid, 'image', {
        imageUrl: imageSrc,
        prompt: prompt,
        aspectRatio: aspectRatio
      });
      setIsSaved(true);
    } catch (e) {
      console.error("Failed to save to pocket", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (imageSrc) {
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `mimi_vision_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  // Map aspect ratios to inline styles (safer than tailwind arbitrary values for dynamics)
  const getAspectStyle = (ratio: AspectRatio) => {
    const [w, h] = ratio.split(':').map(Number);
    return { aspectRatio: `${w}/${h}` };
  };

  return (
    <div className={`relative w-full flex justify-center ${className}`}>
      
      {/* Rectangular Editorial Card */}
      <div 
        className="relative w-full max-w-2xl bg-[#F5F2EB] shadow-xl overflow-hidden group transition-all duration-700 border border-stone-200"
        style={getAspectStyle(aspectRatio)}
      >
        
        {/* Placeholder Texture */}
        {!imageSrc && (
           <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>
           </div>
        )}

        {/* 1. THE IMAGE RESULT */}
        {imageSrc ? (
          <div className="relative w-full h-full animate-fade-in group">
            <img 
              src={imageSrc} 
              alt={prompt} 
              className={`w-full h-full object-cover transition-all duration-1000 ease-out ${isLoading ? 'opacity-90 blur-sm scale-[1.01]' : 'scale-100'}`}
            />
            
            {/* Overlay Actions (Glass Bar) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-sm shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 border border-stone-100 translate-y-2 group-hover:translate-y-0 z-20">
               
                 {/* Save to Pocket */}
                 {user && (
                   <button
                     onClick={handleSaveToPocket}
                     disabled={isSaved || isSaving}
                     className={`text-stone-500 hover:text-emerald-600 transition-colors ${isSaved ? 'text-emerald-500' : ''}`}
                     title="Save to Pocket"
                   >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Bookmark size={16} />}
                   </button>
                 )}

                 <div className="w-px h-4 bg-stone-300" />

                 {/* Download */}
                 <button onClick={handleDownload} className="text-stone-500 hover:text-stone-900 transition-colors" title="Download Vision">
                    <Download size={16} />
                 </button>

                 <div className="w-px h-4 bg-stone-300" />

                 {/* Edit */}
                 <button onClick={() => setIsEditing(true)} className="text-stone-500 hover:text-amber-600 transition-colors" title="Refine Vision">
                   <Wand2 size={16} />
                 </button>
            </div>
            
            {/* Editing Input Overlay */}
            {isEditing && (
               <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-30 p-8 animate-fade-in">
                  <div className="w-full max-w-md text-center">
                    <p className="font-sans text-[9px] uppercase tracking-widest text-stone-400 mb-4">Refine Vision</p>
                    <input 
                       value={editPrompt}
                       onChange={(e) => setEditPrompt(e.target.value)}
                       placeholder="Add grain, make it darker, remove elements..."
                       className="bg-transparent border-b border-stone-300 text-stone-800 text-xl font-serif w-full p-2 focus:outline-none focus:border-stone-800 text-center placeholder-stone-300 mb-8"
                       autoFocus
                    />
                    <div className="flex justify-center gap-8">
                       <button onClick={() => setIsEditing(false)} className="font-sans text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-600">Cancel</button>
                       <button onClick={handleEdit} className="font-sans text-[10px] uppercase tracking-widest text-stone-900 border-b border-stone-900 pb-1 hover:opacity-70">Apply Changes</button>
                    </div>
                  </div>
               </div>
            )}
            
            {isLoading && (
               <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-40">
                 <Loader2 className="w-8 h-8 text-stone-800 animate-spin" />
               </div>
            )}
          </div>
        ) : (
          /* 2. THE EMPTY STATE */
          <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center relative z-10">
             <div className="w-full max-w-[280px] flex flex-col items-center gap-8">
               <p className="font-serif text-xl italic text-stone-600 leading-relaxed">
                 "{prompt}"
               </p>
               
               {isLoading ? (
                 <div className="flex flex-col items-center gap-3 animate-pulse">
                   <Loader2 className="w-5 h-5 text-stone-800 animate-spin" />
                   <span className="font-sans text-[8px] uppercase tracking-[0.3em] text-stone-400">
                     Developing...
                   </span>
                 </div>
               ) : (
                 <button 
                   onClick={handleDevelop}
                   className="group/btn flex items-center gap-3 px-8 py-3 border border-stone-300 hover:border-stone-800 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                 >
                   {error ? <RefreshCcw className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-stone-400 group-hover/btn:text-stone-800" />}
                   <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-stone-600 group-hover/btn:text-stone-900">
                     {error ? 'Retry Vision' : 'Generate Plate'}
                   </span>
                 </button>
               )}
               
               {error && <p className="text-[8px] text-red-400 uppercase tracking-widest">{error}</p>}
             </div>
          </div>
        )}
      </div>
      
      {/* Decorative corners for editorial feel */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-stone-300 opacity-50"></div>
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-stone-300 opacity-50"></div>
    </div>
  );
};
