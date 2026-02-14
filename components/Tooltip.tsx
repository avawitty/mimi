
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Binary, Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  binaryText?: string; 
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, binaryText, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBinary, setShowBinary] = useState(false);

  // Clear timeout on unmount or interaction
  useEffect(() => {
    return () => {
      setIsVisible(false);
    };
  }, []);

  const handleTouch = () => {
    // Mobile logic: Toggle visibility on tap if not visible, otherwise let the click pass through
    // For specific behavior like long press, more complex logic is needed. 
    // Here we show it briefly on touch start for feedback.
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), 2000);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-4',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-4',
    left: 'right-full top-1/2 -translate-y-1/2 mr-4',
    right: 'left-full top-1/2 -translate-y-1/2 ml-4',
  };

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => { setIsVisible(false); setShowBinary(false); }}
      onTouchStart={handleTouch}
      onClick={() => setShowBinary(!showBinary)}
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
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-stone-50 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-sans text-[7px] uppercase tracking-[0.3em] font-black text-stone-400">Definition_Audit</span>
                </div>
                {binaryText && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowBinary(!showBinary); }}
                    className={`p-1 rounded-sm transition-all pointer-events-auto ${showBinary ? 'bg-emerald-500 text-white' : 'bg-stone-50 text-stone-300'}`}
                  >
                    <Binary size={10} />
                  </button>
                )}
              </div>
              
              <div className="min-h-[40px] flex items-center">
                <AnimatePresence mode="wait">
                  {showBinary && binaryText ? (
                    <motion.div key="binary" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="space-y-2">
                       <span className="font-sans text-[6px] uppercase tracking-widest font-black text-emerald-500">Clinical ID:</span>
                       <p className="font-mono text-[10px] leading-tight text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                          {binaryText}
                       </p>
                    </motion.div>
                  ) : (
                    <motion.p key="metaphor" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} className="font-serif italic text-xs leading-relaxed text-stone-600 dark:text-stone-300 text-balance">
                      {text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
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
