
// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import { ZineMetadata, ToneTag } from '../types';
import { Activity, Sparkles, Eye, Radio, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';

interface ZineCardProps {
  zine: ZineMetadata;
  onClick: () => void;
  currentUserId: string | undefined;
  isSocialFloor?: boolean;
}

const TONE_STYLES: Record<ToneTag, { 
  wrapper: string, border: string, text: string, accent: string, aspect: string, grainOpacity: string, overlayColor: string, dark: any
}> = {
  'Dream': { 
    wrapper: 'bg-[#E5E7EB]', border: 'border-slate-400', text: 'text-slate-900', accent: 'text-slate-600', aspect: 'aspect-video', grainOpacity: 'opacity-[0.08]', overlayColor: 'bg-white/70', 
    dark: { wrapper: 'bg-[#1E293B]', border: 'border-slate-700', text: 'text-slate-100', accent: 'text-slate-400', overlayColor: 'bg-slate-950/70' } 
  },
  'Chic': { 
    wrapper: 'bg-[#FDFBF7]', border: 'border-stone-200', text: 'text-[#1C1917]', accent: 'text-[#A8A29E]', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.05]', overlayColor: 'bg-[#FDFBF7]/80', 
    dark: { wrapper: 'bg-[#0C0A09]', border: 'border-stone-800', text: 'text-stone-100', accent: 'text-stone-50', overlayColor: 'bg-black/80' } 
  },
  'Unhinged': { 
    wrapper: 'bg-[#0A0A0A]', border: 'border-red-900', text: 'text-white', accent: 'text-red-500', aspect: 'aspect-square', grainOpacity: 'opacity-[0.15]', overlayColor: 'bg-black/40',
    dark: { wrapper: 'bg-black', border: 'border-red-600', text: 'text-red-50', accent: 'text-red-400', overlayColor: 'bg-black/60' }
  },
  'Romantic': { 
    wrapper: 'bg-[#FFF9F9]', border: 'border-rose-100', text: 'text-rose-950', accent: 'text-rose-300', aspect: 'aspect-[4/3]', grainOpacity: 'opacity-[0.04]', overlayColor: 'bg-rose-50/70', 
    dark: { wrapper: 'bg-[#1A0A0A]', border: 'border-rose-900', text: 'text-rose-100', accent: 'text-rose-600', overlayColor: 'bg-black/70' } 
  },
  'Cryptic': { 
    wrapper: 'bg-stone-300', border: 'border-stone-400', text: 'text-stone-900', accent: 'text-stone-600', aspect: 'aspect-[2/3]', grainOpacity: 'opacity-[0.08]', overlayColor: 'bg-stone-300/60', 
    dark: { wrapper: 'bg-[#0A0A0A]', border: 'border-stone-800', text: 'text-stone-100', accent: 'text-stone-500', overlayColor: 'bg-black/80' } 
  },
  'Nostalgia': { 
    wrapper: 'bg-[#F5F3FF]', border: 'border-violet-200', text: 'text-violet-950', accent: 'text-violet-400', aspect: 'aspect-square', grainOpacity: 'opacity-[0.06]', overlayColor: 'bg-violet-50/60', 
    dark: { wrapper: 'bg-[#1E1B4B]', border: 'border-violet-900', text: 'text-violet-100', accent: 'text-violet-500', overlayColor: 'bg-black/60' } 
  },
  'Academic': { 
    wrapper: 'bg-[#F2F1EC]', border: 'border-stone-300', text: 'text-stone-900', accent: 'text-stone-500', aspect: 'aspect-[3/2]', grainOpacity: 'opacity-[0.03]', overlayColor: 'bg-[#F2F1EC]/85', 
    dark: { wrapper: 'bg-[#1C1917]', border: 'border-stone-800', text: 'text-stone-200', accent: 'text-stone-600', overlayColor: 'bg-black/85' } 
  },
  'Meme': { 
    wrapper: 'bg-[#EEF2FF]', border: 'border-indigo-200', text: 'text-indigo-950', accent: 'text-indigo-400', aspect: 'aspect-[9/16]', grainOpacity: 'opacity-[0.12]', overlayColor: 'bg-indigo-50/50', 
    dark: { wrapper: 'bg-[#1E1B4B]', border: 'border-indigo-900', text: 'text-indigo-100', accent: 'text-indigo-600', overlayColor: 'bg-black/50' } 
  },
  'Sovereign Panic': { 
    wrapper: 'bg-[#FDFBF7]', border: 'border-stone-200', text: 'text-[#1C1917]', accent: 'text-[#A8A29E]', aspect: 'aspect-square', grainOpacity: 'opacity-[0.15]', overlayColor: 'bg-black/5', 
    dark: { wrapper: 'bg-black', border: 'border-stone-800', text: 'text-white', accent: 'text-stone-300', overlayColor: 'bg-white/5' } 
  },
  'Storyline': { 
    wrapper: 'bg-[#F9FAFB]', border: 'border-stone-100', text: 'text-stone-900', accent: 'text-stone-500', aspect: 'aspect-video', grainOpacity: 'opacity-[0.02]', overlayColor: 'bg-white/90', 
    dark: { wrapper: 'bg-[#080707]', border: 'border-stone-900', text: 'text-white', accent: 'text-stone-600', overlayColor: 'bg-black/90' } 
  },
};

export const ZineCard: React.FC<ZineCardProps> = ({ zine, onClick, currentUserId, isSocialFloor }) => {
  const { profile } = useUser();
  const { currentPalette } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [sentinelHealth, setSentinelHealth] = useState<'nominal' | 'degraded'>('nominal');
  const baseStyles = TONE_STYLES[zine.tone] || TONE_STYLES['Chic'];

  const isSwan = zine.userId && !zine.userId.startsWith('ghost');

  useEffect(() => {
    const handleSentinel = (e: any) => setSentinelHealth(e.detail.status);
    window.addEventListener('mimi:sentinel_audit', handleSentinel);
    return () => window.removeEventListener('mimi:sentinel_audit', handleSentinel);
  }, []);

  const styles = useMemo(() => {
    if (currentPalette.isDark && baseStyles.dark) {
      return { ...baseStyles, ...baseStyles.dark };
    }
    return baseStyles;
  }, [currentPalette.isDark, baseStyles, zine.tone]);

  const decayFactor = useMemo(() => {
    const ageInHours = (Date.now() - (zine.timestamp || Date.now())) / (1000 * 60 * 60);
    const healthModifier = sentinelHealth === 'degraded' ? 0.3 : 0;
    return Math.min(ageInHours / 168 + healthModifier, 0.95);
  }, [zine.timestamp, sentinelHealth]);

  const headlineFont = profile?.tasteProfile?.dominant_archetypes?.[0] === 'brutalist-mono' ? 'font-mono' : 'font-serif';

  // THE MESOPIC TRANSITION: Rods (Grayscale) to Cones (Color)
  // Base grayscale is high when not hovered or when aged (bit rot).
  // Hovering simulates "cone activation," bringing back color.
  const visualGrayscale = isHovered ? 0 : Math.max(80, decayFactor * 100);

  return (
    <motion.div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -12, scale: 1.02 }}
      className={`relative cursor-pointer transition-all duration-[1.2s] w-full ${isSocialFloor ? 'max-w-5xl' : 'max-w-[420px]'} mx-auto overflow-hidden rounded-sm`}
      style={{ filter: `grayscale(${visualGrayscale}%) brightness(${currentPalette.isDark ? 1.2 - decayFactor * 0.4 : 1 - decayFactor * 0.2})` }}
    >
      <div className={`w-full flex flex-col min-h-[500px] ${styles.aspect} ${styles.wrapper} ${styles.border} border shadow-2xl relative group transition-colors duration-1000`}>
        {/* SWAN HALOGEN GLOW */}
        {isSwan && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
             <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500 rounded-full blur-[120px] animate-pulse" />
          </div>
        )}

        <div className={`absolute inset-0 z-10 ${styles.overlayColor} backdrop-blur-[1px] group-hover:opacity-10 transition-all duration-1000`} />
        
        <div className="relative flex flex-col h-full z-30 p-8 md:p-12">
          <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                   <img src={zine.userAvatar || `https://ui-avatars.com/api/?name=${zine.userHandle}`} className="w-10 h-10 rounded-full border-2 border-white/20 grayscale group-hover:grayscale-0 transition-all duration-1000" alt="" />
                   {isSwan && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-black shadow-sm" />}
                </div>
                <div className="flex flex-col">
                  <span className={`font-sans text-[10px] uppercase tracking-[0.3em] font-black ${styles.text}`}>@{zine.userHandle || 'Ghost'}</span>
                  {isSwan && <span className="font-sans text-[5px] uppercase tracking-widest text-emerald-500 font-bold">Anchored Identity</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className={`font-mono text-[8px] uppercase tracking-widest font-black opacity-60 ${styles.text}`}>{zine.tone}</span>
                 {currentUserId === zine.userId && <Eye size={10} className={styles.accent} />}
              </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center">
               <h2 className={`${headlineFont} ${isSocialFloor ? 'text-5xl md:text-8xl' : 'text-4xl md:text-6xl'} italic leading-[0.8] tracking-tighter mb-8 ${styles.text} transition-colors duration-1000`}>
                  {zine.title || "Untitled Manifest"}
               </h2>
               <p className={`font-serif italic text-base md:text-xl opacity-90 max-w-sm leading-tight line-clamp-2 ${styles.text} transition-colors duration-1000`}>
                   "{zine.content?.oracular_mirror}"
               </p>
          </div>

          <div className={`mt-auto flex items-center justify-between border-t ${currentPalette.isDark ? 'border-white/10' : 'border-black/5'} pt-6 relative`}>
              {/* SOVEREIGN TRACE TAG */}
              <div className="absolute -bottom-4 right-0 flex items-center gap-2 group-hover:translate-y-[-4px] transition-transform duration-500">
                  <div className={`px-4 py-1.5 ${styles.text} opacity-20 border border-current rounded-sm flex items-center gap-2`}>
                     <span className="font-header italic text-[10px] leading-none tracking-tighter">Mimi</span>
                     <Sparkles size={8} />
                  </div>
              </div>

              <div className="flex items-center gap-3">
                  <Activity size={12} className={styles.accent} />
                  <span className={`font-sans text-[8px] uppercase tracking-[0.4em] font-black ${styles.accent}`}>Cone_Activation_Nominal</span>
              </div>
              
              <div className="flex items-center gap-4 mr-16">
                  <div className="flex flex-col items-end opacity-20 group-hover:opacity-60 transition-opacity">
                     <span className="font-sans text-[5px] uppercase tracking-widest font-black">MESOPIC_LINK</span>
                  </div>
                  <div className="flex flex-col items-end">
                     {decayFactor > 0.5 && <span className="font-sans text-[6px] uppercase tracking-widest text-red-500 font-black animate-pulse">Scotopic Decay</span>}
                     <span className={`font-mono text-[7px] uppercase tracking-widest opacity-30 ${styles.text}`}>{new Date(zine.timestamp).toLocaleDateString()}</span>
                  </div>
              </div>
          </div>
        </div>
        
        <div className={`absolute inset-0 pointer-events-none ${styles.grainOpacity} bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-20`} />
      </div>
    </motion.div>
  );
};
