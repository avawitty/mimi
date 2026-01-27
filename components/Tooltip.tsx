
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-4',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-4',
    left: 'right-full top-1/2 -translate-y-1/2 mr-4',
    right: 'left-full top-1/2 -translate-y-1/2 ml-4',
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute z-[20000] w-64 p-5 bg-white/95 dark:bg-stone-900/98 backdrop-blur-3xl border border-stone-100 dark:border-stone-800 rounded-2xl shadow-2xl pointer-events-none ${positions[position]}`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-nous-accent animate-pulse" />
                <span className="font-sans text-[7px] uppercase tracking-[0.3em] font-black text-stone-400">Context_Audit</span>
              </div>
              <p className="font-serif italic text-xs leading-relaxed text-stone-600 dark:text-stone-300 text-balance">
                {text}
              </p>
            </div>
            {/* Minimalist arrow */}
            <div className={`absolute w-2 h-2 bg-white/95 dark:bg-stone-900/98 border-stone-100 dark:border-stone-800 rotate-45 border-b border-r ${
              position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : 
              position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 border-t border-l border-b-0 border-r-0' : ''
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
