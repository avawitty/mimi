import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --------------------------------------------
// 💭 THE "SMALL TALK" PONDERS
// --------------------------------------------
const PONDERS = [
  "Does the past feel heavy or light today?",
  "Checking the lighting in your memories...",
  "Who are you when no one is watching?",
  "Arranging the furniture in your mind...",
  "Is this a memory or a dream?",
  "Separating the signal from the noise...",
  "Developing the negatives...",
  "What song is stuck in your head?",
  "Tracing the invisible lines...",
  "Hold the door, please.",
  "Going up..."
];

// --------------------------------------------
// 🏢 THE FLOORS (Progress Indicator)
// --------------------------------------------
const FLOORS = ["LOBBY", "ARCHIVE", "EMOTION", "PATTERN", "DREAM", "PENTHOUSE"];

export const ElevatorLoader: React.FC = () => {
  const [ponderIndex, setPonderIndex] = useState(0);
  const [floorIndex, setFloorIndex] = useState(0);

  // Cycle through the "Ponders" every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPonderIndex((prev) => (prev + 1) % PONDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Cycle through "Floors" faster to simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setFloorIndex((prev) => (prev < FLOORS.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex bg-nous-base text-nous-text overflow-hidden">
      
      {/* --------------------------------------------
          LEFT: THE ELEVATOR PANEL
      --------------------------------------------- */}
      <div className="absolute left-8 bottom-8 md:left-12 md:bottom-12 flex flex-col gap-2 pointer-events-none z-10">
        <div className="flex flex-col-reverse gap-1 h-auto">
          {FLOORS.map((floor, i) => (
            <motion.div 
              key={floor}
              animate={{ 
                opacity: i === floorIndex ? 1 : 0.2,
                scale: i === floorIndex ? 1.05 : 1,
                x: i === floorIndex ? 5 : 0,
                color: i === floorIndex ? '#1C1917' : '#A8A29E'
              }}
              className="font-sans text-[10px] tracking-[0.3em] uppercase transition-colors duration-500"
            >
              {i + 1} — {floor}
            </motion.div>
          ))}
        </div>
        <div className="w-px h-12 bg-stone-300 ml-1 mt-2" />
      </div>

      {/* --------------------------------------------
          CENTER: THE THOUGHT STREAM
      --------------------------------------------- */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="relative w-full max-w-xl text-center">
          
          {/* The "Ding" Light */}
          <motion.div 
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto mb-8 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"
          />

          <AnimatePresence mode="wait">
            <motion.h2
              key={ponderIndex}
              initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="font-serif text-2xl md:text-4xl italic leading-relaxed text-nous-text"
            >
              "{PONDERS[ponderIndex]}"
            </motion.h2>
          </AnimatePresence>

          {/* Subtle loading bar at bottom of text */}
          <div className="mt-12 w-24 h-px bg-stone-200 mx-auto overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full w-full bg-stone-800"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      {/* --------------------------------------------
          BACKGROUND AMBIENCE (Moving Lines)
      --------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
        <div className="absolute left-[20%] h-full w-px bg-black animate-slide-up-slow" />
        <div className="absolute right-[20%] h-full w-px bg-black animate-slide-up-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute left-[50%] h-full w-px bg-black animate-slide-up-slow" style={{ animationDelay: '3s' }} />
      </div>

    </div>
  );
};