
// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { ZineMetadata, ToneTag } from '../types';
import { Activity, Sparkles, Eye, Radio, ShieldCheck, Bookmark, Check, Hash, ArrowUpRight, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { addToPocket, db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const TONE_STYLES: Record<string, { 
  wrapper: string, border: string, text: string, accent: string, aspect: string, grainOpacity: string, overlayColor: string, dark: any
}> = {
  'Cinematic Witness': { 
    wrapper: 'bg-[#F5F5F0]', border: 'border-stone-300', text: 'text-stone-900', accent: 'text-stone-500', aspect: 'aspect-video', grainOpacity: 'opacity-[0.08]', overlayColor: 'bg-white/70', 
    dark: { wrapper: 'bg-[#050505]', border: 'border-white/5', text: 'text-[#E2E2E2]', accent: 'text-stone-500', overlayColor: 'bg-stone-950/80' } 
  },
  'Editorial Stillness': { 
    wrapper: 'bg-[#FDFBF7]', border: 'border-stone-200', text: 'text-[#1C1917]', accent: 'text-[#A8A29E]', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.05]', overlayColor: 'bg-[#FDFBF7]/80', 
    dark: { wrapper: 'bg-black', border: 'border-white/10', text: 'text-stone-100', accent: 'text-stone-600', overlayColor: 'bg-black/90' } 
  },
  'chic': { 
    wrapper: 'bg-[#F5F5F0]', border: 'border-stone-300', text: 'text-stone-900', accent: 'text-stone-500', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.05]', overlayColor: 'bg-[#F5F5F0]/80', 
    dark: { wrapper: 'bg-[#0A0A0A]', border: 'border-white/10', text: 'text-stone-200', accent: 'text-stone-500', overlayColor: 'bg-black/90' } 
  },
  // ... (Other tones use defaults or mapped logic) ...
  'default': {
    wrapper: 'bg-white', border: 'border-stone-100', text: 'text-black', accent: 'text-stone-400', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.03]', overlayColor: 'bg-white/90',
    dark: { wrapper: 'bg-stone-900', border: 'border-white/10', text: 'text-white', accent: 'text-stone-500', overlayColor: 'bg-black/80' }
  }
};

interface ZineCardProps {
  zine: ZineMetadata;
  onClick: () => void;
  currentUserId?: string;
  isSocialFloor?: boolean;
  isMasonry?: boolean; // NEW PROP
}

export const ZineCard: React.FC<ZineCardProps> = React.memo(({ zine, onClick, currentUserId, isSocialFloor, isMasonry }) => {
  const { profile, user } = useUser();
  const { currentPalette } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  
  const baseStyles = TONE_STYLES[zine.tone] || TONE_STYLES['default'];

  const styles = useMemo(() => {
    if (currentPalette.isDark && baseStyles.dark) {
      return { ...baseStyles, ...baseStyles.dark };
    }
    return baseStyles;
  }, [currentPalette.isDark, baseStyles, zine.tone]);

  const headlineFont = profile?.tasteProfile?.dominant_archetypes?.[0] === 'brutalist-mono' ? 'font-mono' : 'font-serif';

  const handlePublishToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.uid !== zine.userId) return;
    try {
      await updateDoc(doc(db, 'zines', zine.id), { isPublic: !zine.isPublic });
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
          detail: { 
              message: !zine.isPublic ? "Zine Published to Press." : "Zine Unpublished.", 
              icon: <Radio size={14} /> 
          } 
      }));
      window.dispatchEvent(new CustomEvent('mimi:artifact_finalized'));
    } catch (err) {
      console.error("Publish Toggle Failed", err);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isArchived || isArchiving || !user) return;
    setIsArchiving(true);
    try {
      await addToPocket(user.uid, 'zine_card', { 
          zineId: zine.id, 
          title: zine.title, 
          analysis: {
             ...zine.content,
             design_brief: zine.content.strategic_hypothesis || zine.content.designBrief || zine.content.poetic_interpretation
          }, 
          timestamp: Date.now(),
          imageUrl: zine.coverImageUrl || zine.content.hero_image_url
      });
      setIsArchived(true);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Zine Anchored to Archive.", icon: <Bookmark size={14} /> } }));
    } catch (err) {
      console.error("Archive Failed", err);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <motion.div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      className={`relative cursor-pointer transition-all duration-[0.8s] w-full ${isSocialFloor ? 'max-w-5xl' : isMasonry ? 'max-w-none' : 'max-w-[420px]'} mx-auto rounded-sm group overflow-hidden`}
    >
      <div className={`w-full flex flex-col ${isMasonry ? '' : 'min-h-[500px]'} ${isMasonry ? 'aspect-auto' : styles.aspect} ${styles.wrapper} border ${styles.border} relative transition-colors duration-1000`}>
        
        {/* TEXTURE LAYER */}
        <div className={`absolute inset-0 pointer-events-none ${styles.grainOpacity} bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-0 mix-blend-overlay`} />
        
        {/* IMAGE LAYER (Masonry: Image is visible by default, not just on hover) */}
        {(zine.coverImageUrl || zine.content?.hero_image_url) && (
            <div className={`relative w-full ${isMasonry ? 'h-auto' : 'absolute inset-0 opacity-0 group-hover:opacity-100'} transition-opacity duration-[1.5s] z-0 overflow-hidden`}>
               <img 
                 src={zine.coverImageUrl || zine.content?.hero_image_url} 
                 loading="lazy"
                 decoding="async"
                 className={`w-full h-full object-cover transition-all duration-[2s] ${isMasonry ? 'grayscale hover:grayscale-0' : 'grayscale opacity-20'}`}
                 alt=""
               />
               
               {/* MASONRY: OVERLAY GRADIENT */}
               {isMasonry && (
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
               )}
            </div>
        )}
        
        {/* ARCHIVE BUTTON OVERLAY */}
        <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
            {user && user.uid === zine.userId && (
                <button 
                    onClick={handlePublishToggle}
                    className={`p-2 rounded-full shadow-lg transition-all backdrop-blur-md ${zine.isPublic ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}
                    title={zine.isPublic ? "Unpublish" : "Publish"}
                >
                    {zine.isPublic ? <Radio size={12} /> : <EyeOff size={12} />}
                </button>
            )}
            <button 
                onClick={handleArchive}
                className={`p-2 rounded-full shadow-lg transition-all backdrop-blur-md ${isArchived ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}
                title="Archive to Pocket"
            >
                {isArchived ? <Check size={12} /> : <Bookmark size={12} />}
            </button>
        </div>

        {/* META TAG (Masonry) */}
        {isMasonry && (
            <div className="absolute top-3 left-3 z-30 flex flex-wrap gap-1">
                <span className="bg-white/90 dark:bg-black/90 text-[6px] font-mono uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm backdrop-blur-md text-black dark:text-white">
                    {zine.tone}
                </span>
                {zine.content?.agentEnrichment?.autoTags?.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-emerald-500/90 text-[6px] font-mono uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm backdrop-blur-md text-white">
                        #{tag}
                    </span>
                ))}
            </div>
        )}
        
        {/* CONTENT LAYER */}
        <div className={`relative z-10 flex flex-col justify-between ${isMasonry ? 'absolute inset-0 p-6' : 'h-full p-8 md:p-12'}`}>
          
          {/* TOP: DATE / TONE (Standard Mode) */}
          {!isMasonry && (
              <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <span className={`font-mono text-[7px] uppercase tracking-widest opacity-40 ${styles.text}`}>
                    {new Date(zine.timestamp).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </span>
                  <span className={`font-sans text-[7px] uppercase tracking-[0.3em] font-black ${styles.accent}`}>
                    {zine.tone}
                  </span>
              </div>
          )}

          {/* CENTER: TITLE */}
          <div className={`flex-1 flex flex-col justify-end ${isMasonry ? 'items-start text-left' : 'items-center text-center'} space-y-2`}>
               <h2 className={`${headlineFont} ${isMasonry ? 'text-3xl text-white' : `text-5xl md:text-7xl ${styles.text}`} italic leading-[0.9] tracking-tighter transition-colors duration-1000`}>
                  {zine.title || "Untitled"}
               </h2>
               {isHovered && !isMasonry && (
                 <motion.p 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }}
                   className={`font-serif italic text-sm md:text-lg opacity-60 max-w-xs leading-tight ${styles.text}`}
                 >
                     "{zine.content?.oracular_mirror || zine.content?.the_reading || "The mirror is silent."}"
                 </motion.p>
               )}
               {isMasonry && (
                   <div className="flex items-center gap-2 pt-2 border-t border-white/20 w-full">
                       <span className="font-mono text-[8px] uppercase tracking-widest text-white/60">@{zine.userHandle}</span>
                       <ArrowUpRight size={10} className="text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
               )}
          </div>

          {/* BOTTOM: AUTHOR (Standard Mode) */}
          {!isMasonry && (
              <div className="flex justify-center items-center pb-2 opacity-30 group-hover:opacity-100 transition-opacity duration-700 mt-6">
                  <span className={`font-sans text-[7px] uppercase tracking-[0.4em] font-black ${styles.text}`}>
                    @{zine.userHandle || 'Ghost'}
                  </span>
              </div>
          )}
        </div>
      </div>
      
      {/* BOTTOM BORDER HOVER */}
      <div className={`h-0.5 w-full bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
    </motion.div>
  );
});
