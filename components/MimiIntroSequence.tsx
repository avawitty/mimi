import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MimiIntroSequenceProps {
 onComplete: () => void;
}

export default function MimiIntroSequence({ onComplete }: MimiIntroSequenceProps) {
 const [phase, setPhase] = useState<'intro' | 'pulling' | 'tearing' | 'complete'>('intro');

 useEffect(() => {
 const pullTimer = setTimeout(() => setPhase('pulling'), 2000);
 const tearTimer = setTimeout(() => setPhase('tearing'), 2600);
 const completeTimer = setTimeout(() => {
 setPhase('complete');
 onComplete();
 }, 3600);

 return () => {
 clearTimeout(pullTimer);
 clearTimeout(tearTimer);
 clearTimeout(completeTimer);
 };
 }, [onComplete]);

 if (phase === 'complete') return null;

 return (
 <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden bg-transparent">
 <AnimatePresence>
 {phase !== 'tearing' && (
 <>
 {/* Top Half */}
 <motion.div
 initial={{ y: 0 }}
 exit={{ y: '-100vh', opacity: 0 }}
 transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
 className="absolute top-0 left-0 right-0 h-1/2 bg-nous-base overflow-hidden origin-bottom"
 >
 <div className="absolute top-0 left-0 right-0 h-[100vh] flex flex-col items-center justify-center">
 <div className="z-10 text-center space-y-6">
 <motion.h1
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
 className="font-serif italic text-6xl md:text-8xl text-nous-text  tracking-tight"
 >
 Mimi
 </motion.h1>
 <motion.p
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 1.5, ease: 'easeOut', delay: 0.8 }}
 className="font-mono text-[9px] uppercase tracking-[0.4em] text-nous-subtle max-w-sm leading-relaxed"
 >
 A sovereign sanctuary for discrete creative synthesis.
 </motion.p>
 </div>
 </div>
 </motion.div>

 {/* Bottom Half */}
 <motion.div
 initial={{ y: 0 }}
 exit={{ y: '100vh', opacity: 0 }}
 transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
 className="absolute bottom-0 left-0 right-0 h-1/2 bg-nous-base overflow-hidden origin-top"
 >
 <div className="absolute top-0 left-0 right-0 h-[100vh] flex flex-col items-center justify-center -translate-y-1/2">
 <div className="z-10 text-center space-y-6">
 <motion.h1
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
 className="font-serif italic text-6xl md:text-8xl text-nous-text text-nous-text tracking-tight"
 >
 Mimi
 </motion.h1>
 <motion.p
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 1.5, ease: 'easeOut', delay: 0.8 }}
 className="font-mono text-[9px] uppercase tracking-[0.4em] text-nous-subtle max-w-sm leading-relaxed"
 >
 A sovereign sanctuary for discrete creative synthesis.
 </motion.p>
 </div>
 </div>
 </motion.div>

 {/* The Thread */}
 <motion.div
 initial={{ scaleX: 0, opacity: 0 }}
 animate={{ scaleX: phase === 'pulling' ? 1 : 0, opacity: phase === 'pulling' ? 1 : 0 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
 className="absolute top-1/2 left-0 right-0 h-[1px] bg-nous-base dark: z-30 -translate-y-1/2 origin-left"
 />
 </>
 )}
 </AnimatePresence>
 </div>
 );
}
