
// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { ZineMetadata, ToneTag } from '../types';
import { Activity, Sparkles, Eye, Radio, ShieldCheck, Bookmark, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { addToPocket } from '../services/firebase';

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
  'Romantic Interior': { 
    wrapper: 'bg-[#FFF9F9]', border: 'border-rose-100', text: 'text-rose-950', accent: 'text-rose-300', aspect: 'aspect-[4/3]', grainOpacity: 'opacity-[0.04]', overlayColor: 'bg-rose-50/70', 
    dark: { wrapper: 'bg-[#0D0505]', border: 'border-rose-950', text: 'text-rose-100', accent: 'text-rose-800', overlayColor: 'bg-black/80' } 
  },
  'Structured Desire': { 
    wrapper: 'bg-[#0A0A0A]', border: 'border-red-900', text: 'text-white', accent: 'text-red-500', aspect: 'aspect-square', grainOpacity: 'opacity-[0.15]', overlayColor: 'bg-black/40',
    dark: { wrapper: 'bg-black', border: 'border-red-950', text: 'text-red-50', accent: 'text-red-800', overlayColor: 'bg-black/70' }
  },
  'Documentary B&W': { 
    wrapper: 'bg-stone-300', border: 'border-stone-400', text: 'text-stone-900', accent: 'text-stone-600', aspect: 'aspect-[2/3]', grainOpacity: 'opacity-[0.1]', overlayColor: 'bg-stone-300/60', 
    dark: { wrapper: 'bg-[#080808]', border: 'border-white/5', text: 'text-stone-300', accent: 'text-stone-600', overlayColor: 'bg-black/80' } 
  },
  'chic': { 
    wrapper: 'bg-[#F5F5F0]', border: 'border-stone-300', text: 'text-stone-900', accent: 'text-stone-500', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.05]', overlayColor: 'bg-[#F5F5F0]/80', 
    dark: { wrapper: 'bg-[#0A0A0A]', border: 'border-white/10', text: 'text-stone-200', accent: 'text-stone-500', overlayColor: 'bg-black/90' } 
  },
  'nostalgia': { 
    wrapper: 'bg-[#FDF6E3]', border: 'border-amber-200', text: 'text-amber-950', accent: 'text-amber-600', aspect: 'aspect-[2/3]', grainOpacity: 'opacity-[0.15]', overlayColor: 'bg-[#FDF6E3]/70', 
    dark: { wrapper: 'bg-[#1C1917]', border: 'border-amber-900/30', text: 'text-amber-100', accent: 'text-amber-700', overlayColor: 'bg-black/80' } 
  },
  'dream': { 
    wrapper: 'bg-[#FFF0F5]', border: 'border-rose-100', text: 'text-rose-900', accent: 'text-rose-400', aspect: 'aspect-[4/3]', grainOpacity: 'opacity-[0.06]', overlayColor: 'bg-[#FFF0F5]/60', 
    dark: { wrapper: 'bg-[#1A050A]', border: 'border-rose-900/40', text: 'text-rose-200', accent: 'text-rose-800', overlayColor: 'bg-black/60' } 
  },
  'panic': { 
    wrapper: 'bg-[#000000]', border: 'border-red-600', text: 'text-red-500', accent: 'text-white', aspect: 'aspect-[9/16]', grainOpacity: 'opacity-[0.3]', overlayColor: 'bg-black/50',
    dark: { wrapper: 'bg-[#000000]', border: 'border-red-600', text: 'text-red-50', accent: 'text-white', overlayColor: 'bg-black/50' }
  },
  'unhinged': { 
    wrapper: 'bg-[#111827]', border: 'border-indigo-500', text: 'text-green-400', accent: 'text-purple-400', aspect: 'aspect-square', grainOpacity: 'opacity-[0.2]', overlayColor: 'bg-gray-900/80',
    dark: { wrapper: 'bg-[#050505]', border: 'border-indigo-500', text: 'text-green-400', accent: 'text-purple-400', overlayColor: 'bg-black/90' }
  },
  'editorial': { 
    wrapper: 'bg-white', border: 'border-stone-100', text: 'text-black', accent: 'text-stone-400', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.02]', overlayColor: 'bg-white/90',
    dark: { wrapper: 'bg-black', border: 'border-white/20', text: 'text-white', accent: 'text-stone-500', overlayColor: 'bg-black/90' }
  }
};

interface ZineCardProps {
  zine: ZineMetadata;
  onClick: () => void;
  currentUserId?: string;
  isSocialFloor?: boolean;
}

export const ZineCard: React.FC<ZineCardProps> = React.memo(({ zine, onClick, currentUserId, isSocialFloor }) => {
  const { profile, user } = useUser();
  const { currentPalette } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  
  const baseStyles = TONE_STYLES[zine.tone] || TONE_STYLES['Editorial Stillness'];

  const styles = useMemo(() => {
    if (currentPalette.isDark && baseStyles.dark) {
      return { ...baseStyles, ...baseStyles.dark };
    }
    return baseStyles;
  }, [currentPalette.isDark, baseStyles, zine.tone]);

  const headlineFont = profile?.tasteProfile?.dominant_archetypes?.[0] === 'brutalist-mono' ? 'font-mono' : 'font-serif';

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isArchived || !user) return;
    try {
      await addToPocket(user.uid, 'zine_card', { 
          zineId: zine.id, 
          title: zine.title, 
          // Saving full analysis data to enable Proposal generation from this card
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
    }
  };

  return (
    <motion.div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      className={`relative cursor-pointer transition-all duration-[1.2s] w-full ${isSocialFloor ? 'max-w-5xl' : 'max-w-[420px]'} mx-auto overflow-hidden rounded-none group`}
    >
      <div className={`w-full flex flex-col min-h-[500px] ${styles.aspect} ${styles.wrapper} ${styles.border} border-l border-r border-t border-b-0 relative transition-colors duration-1000`}>
        
        {/* TEXTURE LAYER */}
        <div className={`absolute inset-0 pointer-events-none ${styles.grainOpacity} bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-0`} />
        
        {/* OPTIMIZED COVER IMAGE */}
        {(zine.coverImageUrl || zine.content?.hero_image_url) && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[1.5s] z-0">
               <img 
                 src={zine.coverImageUrl || zine.content?.hero_image_url} 
                 loading="lazy"
                 decoding="async"
                 className="w-full h-full object-cover grayscale opacity-20"
                 alt=""
               />
            </div>
        )}
        
        {/* ARCHIVE BUTTON OVERLAY */}
        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <button 
                onClick={handleArchive}
                className={`p-3 rounded-full shadow-lg transition-all ${isArchived ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-stone-900 text-stone-400 hover:text-emerald-500'}`}
                title="Archive to Pocket"
            >
                {isArchived ? <Check size={14} /> : <Bookmark size={14} />}
            </button>
        </div>
        
        {/* CONTENT LAYER */}
        <div className="relative flex flex-col h-full z-10 p-8 md:p-12 justify-between">
          
          {/* TOP: DATE / TONE */}
          <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <span className={`font-mono text-[7px] uppercase tracking-widest opacity-40 ${styles.text}`}>
                {new Date(zine.timestamp).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <span className={`font-sans text-[7px] uppercase tracking-[0.3em] font-black ${styles.accent}`}>
                {zine.tone}
              </span>
          </div>

          {/* CENTER: TITLE */}
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
               <h2 className={`${headlineFont} ${isSocialFloor ? 'text-6xl md:text-9xl' : 'text-5xl md:text-7xl'} italic leading-[0.8] tracking-tighter ${styles.text} transition-colors duration-1000 luminescent-text`}>
                  {zine.title || "Untitled"}
               </h2>
               {isHovered && (
                 <motion.p 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }}
                   className={`font-serif italic text-sm md:text-lg opacity-60 max-w-xs leading-tight ${styles.text}`}
                 >
                     "{zine.content?.oracular_mirror}"
                 </motion.p>
               )}
          </div>

          {/* BOTTOM: AUTHOR */}
          <div className="flex justify-center items-center pb-2 opacity-30 group-hover:opacity-100 transition-opacity duration-700">
              <span className={`font-sans text-[7px] uppercase tracking-[0.4em] font-black ${styles.text}`}>
                @{zine.userHandle || 'Ghost'}
              </span>
          </div>
        </div>
      </div>
      
      {/* BOTTOM BORDER (SEPARATE TO ALLOW HOVER EFFECT) */}
      <div className={`h-px w-full ${styles.text} opacity-20 group-hover:opacity-100 transition-all duration-1000`} />
    </motion.div>
  );
});
