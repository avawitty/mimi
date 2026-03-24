import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AestheticDialProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  color?: string;
  labelLeft?: string;
  labelRight?: string;
}

export const AestheticDial: React.FC<AestheticDialProps> = ({
  value,
  min = 0,
  max = 100,
  onChange,
  color = '#10b981', // emerald-500
  labelLeft = '0',
  labelRight = '100'
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate percentage
  const safeValue = isNaN(value) ? min : value;
  const percentage = Math.max(0, Math.min(100, ((safeValue - min) / (max - min)) * 100));

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateValueFromPointer(e);
  };

  const updateValueFromPointer = (e: React.PointerEvent | PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercentage = x / rect.width;
    const newValue = Math.round(min + newPercentage * (max - min));
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    const handleGlobalMove = (e: PointerEvent) => {
      if (isDragging) {
        updateValueFromPointer(e);
      }
    };

    if (isDragging) {
      window.addEventListener('pointerup', handleGlobalUp);
      window.addEventListener('pointermove', handleGlobalMove);
    }

    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointermove', handleGlobalMove);
    };
  }, [isDragging, min, max, onChange]);

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      <div 
        className="relative h-8 flex items-center cursor-pointer touch-none"
        ref={trackRef}
        onPointerDown={handlePointerDown}
      >
        {/* Track Background */}
        <div className="absolute left-0 right-0 h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          {/* Fill */}
          <motion.div 
            className="absolute top-0 bottom-0 left-0 rounded-full"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: color
            }}
            layout
            transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
          />
        </div>

        {/* Thumb */}
        <motion.div 
          className="absolute w-4 h-4 rounded-full bg-white border-2 shadow-sm flex items-center justify-center z-10"
          style={{ 
            left: `calc(${percentage}% - 8px)`,
            borderColor: color
          }}
          animate={{
            scale: isDragging ? 1.5 : 1,
            boxShadow: isDragging ? `0 0 0 8px ${color}20` : '0 1px 2px rgba(0,0,0,0.1)'
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
            {isDragging && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -24 }}
                    className="absolute font-mono text-[10px] bg-black text-white px-2 py-1 rounded-sm whitespace-nowrap pointer-events-none"
                >
                    {safeValue}
                </motion.div>
            )}
        </motion.div>
      </div>
      
      <div className="flex justify-between items-center text-stone-400 font-mono text-[9px] uppercase tracking-widest">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
    </div>
  );
};
