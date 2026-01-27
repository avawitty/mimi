
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, QrCode } from 'lucide-react';

export const ManifestSignet: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  // DYNAMIC ANCHOR: Uses the current origin to avoid manual forwarding rituals.
  const IMPERIAL_URL = typeof window !== 'undefined' ? window.location.origin : 'https://mimizine.com';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-white/60 dark:bg-black/80 backdrop-blur-3xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-[0_50px_100px_rgba(0,0,0,0.3)] rounded-sm p-10 md:p-14 text-center space-y-10"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="space-y-3">
          <h2 className="font-serif text-4xl italic tracking-tighter">Imperial Anchor.</h2>
          <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-400 font-black">Transfer Frequency to Mobile</p>
        </div>

        <div className="bg-white p-6 md:p-8 inline-block rounded-xl shadow-inner border border-stone-100">
           <img 
             src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(IMPERIAL_URL)}&bgcolor=ffffff&color=1c1917&margin=2`} 
             className="w-48 h-48 md:w-64 md:h-64"
             alt="Manifest QR"
           />
        </div>

        <div className="space-y-6">
          <p className="font-serif italic text-stone-500 text-sm px-4">
            "Scan this signet to manifest Mimi within a sovereign mobile chamber. The Imperial Link is the only immutable path."
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(IMPERIAL_URL);
                alert("Imperial Link Preserved.");
              }}
              className="flex items-center justify-center gap-3 w-full py-4 border border-stone-100 dark:border-stone-800 rounded-full font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 hover:text-nous-text dark:hover:text-white transition-all"
            >
              <Smartphone size={14} /> Copy Imperial URL
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
