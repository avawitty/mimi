import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface GlossaryTooltipProps {
  term: string;
  poeticMeaning: string;
  functionalMeaning: string;
  children: React.ReactNode;
}

export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({
  term,
  poeticMeaning,
  functionalMeaning,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center gap-1 cursor-help group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <Info size={12} className="text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300 transition-colors" />
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-stone-900 dark:bg-stone-800 text-stone-100 rounded-lg shadow-xl border border-stone-700 dark:border-stone-600 text-left pointer-events-none"
          >
            <div className="text-xs font-sans tracking-widest uppercase text-emerald-400 mb-1">{term}</div>
            <div className="text-sm font-serif italic text-stone-300 mb-2">"{poeticMeaning}"</div>
            <div className="text-xs font-sans text-stone-400 border-t border-stone-700 dark:border-stone-600 pt-2">
              <span className="font-semibold text-stone-300">Function:</span> {functionalMeaning}
            </div>
            {/* Triangle pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900 dark:border-t-stone-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
