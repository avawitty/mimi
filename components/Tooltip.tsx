
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-nous-text dark:bg-white text-white dark:text-nous-dark-base rounded-sm shadow-2xl z-[1000] pointer-events-none whitespace-nowrap"
          >
            <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black">{text}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-nous-text dark:border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
