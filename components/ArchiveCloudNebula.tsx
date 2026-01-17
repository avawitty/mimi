
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchUserZines } from '../services/firebase';
import { getLocalZines } from '../services/localArchive';
import { ZineMetadata, ToneTag } from '../types';
import { useUser } from '../contexts/UserContext';
import { Ghost, CornerDownRight } from 'lucide-react';

const TONE_MAP: Record<ToneTag, { bg: string, text: string, accent: string }> = {
  'Corporate': { bg: 'bg-slate-50', text: 'text-slate-900', accent: 'border-slate-200' },
  'Chic': { bg: 'bg-[#FDFBF7]', text: 'text-[#1C1917]', accent: 'border-stone-200' },
  'Unhinged': { bg: 'bg-[#0A0A0A]', text: 'text-white', accent: 'border-red-900' },
  'Romantic': { bg: 'bg-[#FFF9F9]', text: 'text-rose-950', accent: 'border-rose-100' },
  'Cryptic': { bg: 'bg-stone-200', text: 'text-stone-900', accent: 'border-stone-400' },
  '2014-Tumblr': { bg: 'bg-[#F5F3FF]', text: 'text-violet-950', accent: 'border-violet-200' },
  'Academic': { bg: 'bg-[#F2F1EC]', text: 'text-stone-900', accent: 'border-stone-300' },
};

export const ArchiveCloudNebula: React.FC<{ onSelectZine: (zine: ZineMetadata) => void }> = ({ onSelectZine }) => {
  const { user } = useUser();
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const local = getLocalZines() || [];
      let cloud: ZineMetadata[] = [];
      if (user && !user.isAnonymous) {
        try { cloud = await fetchUserZines(user.uid); } catch(e) {}
      }
      
      const map = new Map();
      cloud.forEach(z => map.set(z.id, z));
      local.forEach(z => { if(!map.has(z.id)) map.set(z.id, z); });
      setZines(Array.from(map.values()).sort((a,b) => b.timestamp - a.timestamp));
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-pulse">
      <div className="w-12 h-12 rounded-full border-t-2 border-nous-text dark:border-white animate-spin opacity-20" />
      <span className="font-sans text-[8px] uppercase tracking-[1em] text-stone-400 font-black">Hydrating The Stand</span>
    </div>
  );

  if (zines.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-12 relative overflow-hidden">
        {/* The Editorial Wireframe: A ghostly magazine skeleton */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none p-12">
           <div className="w-full max-w-5xl aspect-[1.414/1] border-[2px] border-dashed border-nous-text flex rounded-sm">
              <div className="w-1/2 border-r-[2px] border-dashed border-nous-text p-12 flex flex-col gap-6">
                 <div className="w-32 h-6 bg-nous-text opacity-40" />
                 <div className="w-full aspect-square border-[2px] border-dashed border-nous-text" />
              </div>
              <div className="w-1/2 p-12 flex flex-col justify-end gap-4">
                 <div className="w-full h-3 bg-nous-text opacity-20" />
                 <div className="w-full h-3 bg-nous-text opacity-20" />
                 <div className="w-3/4 h-3 bg-nous-text opacity-20" />
                 <div className="w-1/2 h-8 bg-nous-text opacity-40 mt-6" />
              </div>
           </div>
        </div>
        
        <div className="z-10 space-y-4">
            <h3 className="font-serif italic text-4xl md:text-6xl text-stone-300 dark:text-stone-700 tracking-tighter">The Stand awaits its first artifact.</h3>
            <p className="font-serif italic text-xl text-stone-400/50">A void is merely an uncurated potential.</p>
        </div>
        <Ghost size={32} className="text-stone-100 dark:text-stone-900 opacity-20 z-10 animate-float" />
    </div>
  );

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-stone-100/50 dark:from-white/5 opacity-50" />
      </div>

      <div className="relative w-full max-w-7xl h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 p-6 md:p-16 overflow-y-auto no-scrollbar pb-64">
        {zines.map((zine, i) => {
          const colors = TONE_MAP[zine.tone] || TONE_MAP.Chic;
          return (
            <motion.div
              key={zine.id}
              initial={{ opacity: 0, y: 30, rotate: i % 2 === 0 ? 1 : -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -10, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
              onClick={() => onSelectZine(zine)}
              className={`group relative cursor-pointer ${colors.bg} border ${colors.accent} p-8 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_60px_100px_rgba(0,0,0,0.12)] transition-all flex flex-col gap-12 rounded-sm`}
            >
               <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-[0.03] rounded-sm" />

               <div className="flex justify-between items-start z-10">
                 <span className={`font-mono text-[8px] md:text-[10px] uppercase tracking-widest opacity-40 ${colors.text}`}>ID_{zine.id.slice(-4)}</span>
                 <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${zine.isDeepThinking ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-stone-300'}`} />
                    <span className={`font-sans text-[8px] md:text-[10px] uppercase tracking-[0.5em] font-black ${colors.text}`}>{zine.tone}</span>
                 </div>
               </div>

               <div className="flex-1 flex flex-col justify-center z-10">
                  <h3 className={`font-serif text-3xl md:text-5xl italic tracking-tighter leading-[0.9] mb-6 transition-all group-hover:tracking-normal duration-700 ${colors.text}`}>
                    {zine.title}
                  </h3>
                  <div className={`flex items-start gap-4 opacity-40 group-hover:opacity-100 transition-opacity duration-1000 ${colors.text}`}>
                     <CornerDownRight size={14} className="mt-1 shrink-0" />
                     <p className="font-serif italic text-xs md:text-base leading-snug line-clamp-2">
                       {zine.content.oracular_mirror}
                     </p>
                  </div>
               </div>

               <div className={`flex justify-between items-center z-10 opacity-30 pt-4 border-t ${colors.accent}`}>
                 <span className={`font-mono text-[8px] uppercase tracking-widest ${colors.text}`}>{new Date(zine.timestamp).toLocaleDateString()}</span>
                 <div className="flex gap-2">
                   {[...Array(3)].map((_, j) => <div key={j} className={`w-1 h-1 rounded-full ${colors.text} opacity-20`} />)}
                 </div>
               </div>
            </motion.div>
          );
        })}
      </div>

      <div className="absolute top-8 md:top-16 left-1/2 -translate-x-1/2 pointer-events-none text-center z-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-px bg-stone-200 dark:bg-stone-800" />
          <span className="font-sans text-[8px] md:text-[11px] uppercase tracking-[1em] text-stone-400 font-black">The Private Stand</span>
        </div>
      </div>
    </div>
  );
};
