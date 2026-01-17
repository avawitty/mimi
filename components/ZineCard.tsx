
import React, { useMemo } from 'react';
import { ZineMetadata, ToneTag } from '../types';
import { Zap, Activity, ShieldCheck, CornerDownRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ZineCardProps {
  zine: ZineMetadata;
  onClick: () => void;
  currentUserId: string | undefined;
  isSocialFloor?: boolean;
}

const TONE_STYLES: Record<ToneTag, { 
  wrapper: string, 
  border: string, 
  text: string, 
  accent: string,
  aspect: string,
  grainOpacity: string
}> = {
  'Corporate': { wrapper: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', accent: 'text-slate-400', aspect: 'aspect-[16/9]', grainOpacity: 'opacity-[0.03]' },
  'Chic': { wrapper: 'bg-[#FDFBF7]', border: 'border-stone-200', text: 'text-[#1C1917]', accent: 'text-[#A8A29E]', aspect: 'aspect-[3/4]', grainOpacity: 'opacity-[0.05]' },
  'Unhinged': { wrapper: 'bg-[#0A0A0A]', border: 'border-red-600', text: 'text-white', accent: 'text-red-500', aspect: 'aspect-square', grainOpacity: 'opacity-[0.15]' },
  'Romantic': { wrapper: 'bg-[#FFF9F9]', border: 'border-rose-100', text: 'text-rose-950', accent: 'text-rose-300', aspect: 'aspect-[4/3]', grainOpacity: 'opacity-[0.04]' },
  'Cryptic': { wrapper: 'bg-stone-300', border: 'border-stone-400', text: 'text-stone-900', accent: 'text-stone-600', aspect: 'aspect-[2/3]', grainOpacity: 'opacity-[0.08]' },
  '2014-Tumblr': { wrapper: 'bg-[#F5F3FF]', border: 'border-violet-200', text: 'text-violet-950', accent: 'text-violet-400', aspect: 'aspect-square', grainOpacity: 'opacity-[0.06]' },
  'Academic': { wrapper: 'bg-[#F2F1EC]', border: 'border-stone-300', text: 'text-stone-900', accent: 'text-stone-500', aspect: 'aspect-[3/2]', grainOpacity: 'opacity-[0.03]' },
};

export const ZineCard: React.FC<ZineCardProps> = ({ zine, onClick, currentUserId, isSocialFloor }) => {
  const styles = TONE_STYLES[zine.tone] || TONE_STYLES['Chic'];
  
  const decayFactor = useMemo(() => {
    const ageInHours = (Date.now() - zine.timestamp) / (1000 * 60 * 60);
    return Math.min(ageInHours / 168, 0.9);
  }, [zine.timestamp]);

  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -12, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer transition-all duration-1000 w-full ${isSocialFloor ? 'max-w-5xl mx-auto' : 'max-w-[420px] mx-auto'}`}
      style={{ 
        filter: `grayscale(${decayFactor * 40}%)`,
      }}
    >
      <div className={`
        w-full ${isSocialFloor ? 'aspect-[21/9]' : styles.aspect} ${styles.wrapper} ${styles.border} border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col p-8 md:p-12 relative rounded-sm group
      `}>
        <div className={`absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise.png')] ${styles.grainOpacity}`} />
        <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 dark:bg-black/10 backdrop-blur-md border-l border-b border-black/5 dark:border-white/5" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />

        <div className="flex justify-between items-start z-20 mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={zine.userAvatar || `https://ui-avatars.com/api/?name=${zine.userHandle}`} className="w-10 h-10 rounded-full border-2 border-white dark:border-stone-800 shadow-xl object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                {(!zine.userId.startsWith('ghost_') || zine.isDeepThinking) && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                    <Sparkles size={10} />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className={`font-sans text-[10px] uppercase tracking-[0.3em] font-black ${styles.text}`}>@{zine.userHandle}</span>
                <span className={`font-mono text-[7px] uppercase tracking-widest opacity-40 ${styles.text}`}>VER_0{zine.timestamp.toString().slice(-1)}</span>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded-full border border-black/5 dark:border-white/10 backdrop-blur-md">
                <span className={`font-mono text-[8px] uppercase tracking-widest font-black opacity-60 ${styles.text}`}>{zine.tone}</span>
            </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center px-4 relative z-10">
             <motion.h2 
               layoutId={`title-${zine.id}`}
               className={`font-serif ${isSocialFloor ? 'text-5xl md:text-8xl' : 'text-3xl md:text-5xl'} italic leading-[0.85] tracking-tighter mb-8 text-balance drop-shadow-sm ${styles.text} group-hover:scale-[1.02] transition-transform duration-1000`}
             >
                {zine.title}
             </motion.h2>

             {zine.coverImageUrl && (
                <div className="w-full aspect-video overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-sm border border-black/5 dark:border-white/5 relative">
                    <img src={zine.coverImageUrl} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[1.5s] ease-out scale-100 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
             )}

             <div className="mt-8 flex flex-col items-center gap-4">
               <CornerDownRight size={14} className={`opacity-20 ${styles.text}`} />
               <p className={`font-serif italic text-sm md:text-lg opacity-40 max-w-sm leading-snug line-clamp-3 ${styles.text}`}>
                   "{zine.content.oracular_mirror}"
               </p>
             </div>
        </div>

        <div className="mt-12 flex items-center justify-between z-20 border-t border-black/5 dark:border-white/5 pt-6">
            <div className="flex items-center gap-3">
                <Activity size={12} className={styles.accent} />
                <span className={`font-sans text-[8px] uppercase tracking-[0.4em] font-black ${styles.accent}`}>Refraction_Log</span>
            </div>
            <div className="flex items-center gap-6">
                <span className={`font-mono text-[8px] uppercase tracking-[0.2em] opacity-40 ${styles.text}`}>VOL. {new Date(zine.timestamp).getFullYear().toString().slice(-2)}</span>
                <div className={`w-2 h-2 rounded-full ${zine.isDeepThinking ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-stone-200'}`} />
            </div>
        </div>
      </div>
    </motion.div>
  );
};
