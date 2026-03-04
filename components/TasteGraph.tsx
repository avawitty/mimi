import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Radar, Pin, Flame } from 'lucide-react';

interface TasteGraphProps {
  tasteVector?: Record<string, number>;
  variant?: 'portrait' | 'diagnostic';
}

export const TasteGraph: React.FC<TasteGraphProps> = ({ tasteVector, variant = 'diagnostic' }) => {
  const [pinnedTags, setPinnedTags] = useState<Set<string>>(new Set());

  const sortedTags = useMemo(() => {
    if (!tasteVector) return [];
    return Object.entries(tasteVector)
      .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
      .slice(0, variant === 'portrait' ? 5 : 12);
  }, [tasteVector, variant]);

  if (!tasteVector || sortedTags.length === 0) {
    return (
      <div className="w-full p-8 border border-stone-100 dark:border-stone-800 rounded-sm bg-stone-50 dark:bg-stone-900/50 flex flex-col items-center justify-center text-center space-y-4">
        <Radar size={24} className="text-stone-300 dark:text-stone-700" />
        <div>
          <h4 className="font-sans text-[10px] uppercase tracking-widest font-black text-stone-400">The Taste Graph</h4>
          <p className="font-serif italic text-xs text-stone-500 mt-1">Awaiting sufficient debris to map your aesthetic intelligence.</p>
        </div>
      </div>
    );
  }

  const maxIntensity = Math.max(...sortedTags.map(t => t[1]), 0.1);

  const togglePin = (tag: string) => {
    setPinnedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  if (variant === 'portrait') {
    return (
      <div className="w-full p-6 border border-stone-100 dark:border-stone-800 rounded-sm bg-stone-50 dark:bg-stone-900/50 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-400">
            <Activity size={14} />
            <h4 className="font-sans text-[10px] uppercase tracking-widest font-black">Aesthetic DNA</h4>
          </div>
          <span className="font-mono text-[9px] text-stone-400 uppercase">Signature</span>
        </div>

        <div className="space-y-3">
          {sortedTags.map(([tag, intensity], idx) => {
            const percentage = (intensity / maxIntensity) * 100;
            return (
              <div key={tag} className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-stone-500 w-24 truncate">
                  {tag.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, delay: idx * 0.1, ease: "easeOut" }}
                    className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-stone-400 dark:bg-stone-500 rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 border border-stone-100 dark:border-stone-800 rounded-sm bg-stone-50 dark:bg-stone-900/50 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-500">
          <Activity size={14} />
          <h4 className="font-sans text-[10px] uppercase tracking-widest font-black">The Taste Graph</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-[9px] text-amber-500 uppercase">
            <Flame size={10} /> Heat Map
          </span>
          <span className="font-mono text-[9px] text-stone-400 uppercase">Diagnostic View</span>
        </div>
      </div>

      <div className="space-y-4">
        {sortedTags.map(([tag, intensity], idx) => {
          const percentage = (intensity / maxIntensity) * 100;
          const isPinned = pinnedTags.has(tag);
          
          return (
            <div key={tag} className="space-y-1 group relative">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => togglePin(tag)}
                    className={`transition-colors ${isPinned ? 'text-amber-500' : 'text-stone-300 dark:text-stone-700 hover:text-amber-400'}`}
                    title={isPinned ? "Unpin from Tailor focus" : "Pin to influence Tailor"}
                  >
                    <Pin size={12} className={isPinned ? "fill-current" : ""} />
                  </button>
                  <span className={`font-mono text-[10px] transition-colors ${isPinned ? 'text-amber-500 font-bold' : 'text-stone-600 dark:text-stone-400 group-hover:text-emerald-500'}`}>
                    {tag.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-stone-400">
                  {intensity.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden relative">
                {/* Heat map background representing recent inspiration vs all-time */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.05 }}
                  className={`h-full ${isPinned ? 'bg-amber-500' : 'bg-emerald-500'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-2">
        <p className="font-serif italic text-[11px] text-stone-500 leading-relaxed">
          This vector map evolves dynamically as you save fragments to your Pocket. It forms the foundation of your proprietary aesthetic intelligence dataset.
        </p>
        <p className="font-sans text-[8px] uppercase tracking-widest text-amber-600/70 font-black">
          * Pin nodes to bias the Tailor's generation weights for your next issue.
        </p>
      </div>
    </div>
  );
};
