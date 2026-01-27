
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Heart, Share2, Sparkles, Newspaper, Quote, Copy, Check, Bookmark, Radio, Instagram, Loader2, Lock, ShieldCheck, Zap } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { addToPocket } from '../services/firebase';

interface EditorialSpreadProps {
  article: any;
  onClose: () => void;
}

export const EditorialSpread: React.FC<EditorialSpreadProps> = ({ article, onClose }) => {
  const { user, profile } = useUser();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isAttemptingUnlock, setIsAttemptingUnlock] = useState(false);

  const handleCopyCaption = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  const handleArchiveArticle = async () => {
    if (isArchiving || isArchived) return;
    setIsArchiving(true);
    try {
      await addToPocket(user?.uid || 'ghost', 'script', {
        title: article.brand,
        headline: article.headline,
        body: article.content.body,
        tag: article.tag,
        author: article.content.author,
        timestamp: Date.now()
      });
      setIsArchived(true);
      setTimeout(() => setIsArchived(false), 3000);
    } catch (e) {
      console.error("MIMI // Archive failure:", e);
    } finally {
      setIsArchiving(false);
    }
  };

  const isArticleGated = article.isLocked && !profile?.isSwan;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-0 z-[9000] bg-white dark:bg-stone-950 flex flex-col overflow-y-auto no-scrollbar overscroll-contain"
    >
      {/* Editorial Header */}
      <div className="h-20 border-b border-stone-100 dark:border-stone-900 px-6 md:px-12 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-stone-950/90 backdrop-blur-xl z-[100]">
          <button onClick={onClose} className="flex items-center gap-4 group transition-all">
             <ArrowLeft size={20} className="text-stone-400 group-hover:text-nous-text dark:group-hover:text-white" />
             <span className="font-sans text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-black text-stone-400 group-hover:text-nous-text">Back to Wire</span>
          </button>
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex items-center gap-3">
                <Newspaper size={14} className="text-stone-300" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">{article.stats}</span>
             </div>
             {!isArticleGated && (
               <button 
                 onClick={handleArchiveArticle}
                 className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${isArchived ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-stone-50 dark:bg-stone-900 border-stone-100 dark:border-stone-800 text-stone-500'}`}
               >
                  {isArchiving ? <Loader2 size={12} className="animate-spin" /> : isArchived ? <Check size={12} /> : <Bookmark size={12} />}
                  <span className="font-sans text-[7px] uppercase tracking-widest font-black">{isArchived ? 'Archived' : 'Anchor Article'}</span>
               </button>
             )}
          </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-32 space-y-16 md:space-y-32">
          
          {isArticleGated ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 py-12">
               <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-2 border-stone-100 dark:border-stone-800 rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-[spin_3s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={48} className="text-amber-500 animate-pulse" />
                  </div>
               </div>
               
               <div className="space-y-4 max-w-md">
                  <h1 className="font-serif text-5xl italic tracking-tighter leading-none">{article.brand}.</h1>
                  <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-400 font-black">Temporal Vault Active</p>
                  <div className="h-px w-24 bg-stone-100 mx-auto mt-8" />
                  <p className="font-serif italic text-lg text-stone-500 leading-relaxed pt-4">
                    The **Victim as Architect** manifesto is currently vaulted. This frequency requires a **Swan Anchor** or **Imperial Patronage** to manifest.
                  </p>
               </div>

               <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button 
                    onClick={() => {
                      setIsAttemptingUnlock(true);
                      setTimeout(() => {
                        setIsAttemptingUnlock(false);
                        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
                          detail: { message: "Patronage Proof Missing.", type: 'error' } 
                        }));
                      }, 2000);
                    }}
                    className="w-full py-6 bg-stone-950 text-white rounded-full font-sans text-[11px] uppercase tracking-[0.5em] font-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    {isAttemptingUnlock ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="text-amber-500" />}
                    Prove Structural Identity
                  </button>
                  <a href="https://ko-fi.com/mimizine" target="_blank" className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-stone-900 transition-colors">Enter Covenant of Patronage</a>
               </div>
            </motion.div>
          ) : (
            <>
              {/* Masthead */}
              <header className="space-y-8 md:space-y-12">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-px bg-stone-200 dark:bg-stone-800" />
                    <span className="font-sans text-[10px] uppercase tracking-[0.6em] text-stone-400 font-black">{article.tag}</span>
                 </div>
                 <h1 className="font-serif text-6xl md:text-9xl italic tracking-tighter leading-[0.8] text-nous-text dark:text-white" style={{ color: article.color || 'inherit' }}>
                    {article.brand}
                 </h1>
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12">
                    <p className="font-sans text-[12px] md:text-[14px] uppercase tracking-[0.3em] font-black text-stone-500 max-w-sm">
                       {article.headline}
                    </p>
                    <div className="flex flex-col items-start md:items-end">
                       <span className="font-serif italic text-lg text-stone-400">Written by</span>
                       <span className="font-sans text-[10px] uppercase tracking-widest font-black">{article.content.author}</span>
                    </div>
                 </div>
              </header>

              {/* Featured Visual Fragment */}
              <div className="aspect-[16/9] md:aspect-[21/9] bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm relative overflow-hidden group shadow-2xl">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-10 pointer-events-none z-10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Sparkles size={80} className="text-stone-200 dark:text-stone-800 animate-pulse" />
                  </div>
                  <div className="absolute bottom-6 left-6 z-20">
                     <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-mono text-[8px] uppercase tracking-widest text-white/60 font-bold">FRAGMENT_REFRACTION_NOMINAL</span>
                     </div>
                  </div>
              </div>

              {/* Body Content - Magazine Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
                 <div className="lg:col-span-7 space-y-12">
                    <h3 className="font-serif text-3xl md:text-5xl italic tracking-tighter text-nous-text dark:text-white leading-none border-b border-stone-100 dark:border-stone-900 pb-8">
                       {article.content.subtitle}
                    </h3>
                    <div className="space-y-10 md:space-y-16">
                       {article.content.body.map((para, i) => (
                         <p key={i} className="font-serif italic text-xl md:text-2xl lg:text-3xl text-stone-600 dark:text-stone-300 leading-snug text-balance">
                            {para}
                         </p>
                       ))}
                    </div>
                 </div>

                 <aside className="lg:col-span-5 space-y-12">
                    <div className="p-8 md:p-12 bg-stone-50 dark:bg-stone-900 rounded-sm space-y-8 border border-stone-100 dark:border-stone-800 shadow-inner">
                       <Quote size={24} className="text-stone-300" />
                       <p className="font-serif italic text-2xl text-stone-500 leading-tight text-balance">
                          "Professionalism is the death of the Muse. High-fidelity sensations aren't meant to be birthed in a filtered cage."
                       </p>
                       <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
                          <span className="font-sans text-[8px] uppercase tracking-[0.3em] font-black text-stone-400">The Royal Edict</span>
                       </div>
                    </div>

                    {/* SOCIAL CAPTION MANIFEST */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-3 text-stone-400">
                          <Instagram size={14} />
                          <span className="font-sans text-[8px] uppercase tracking-widest font-black">Caption Manifest</span>
                       </div>
                       <div className="space-y-4">
                          {article.content.captions?.map((caption, i) => (
                            <button 
                              key={i} 
                              onClick={() => handleCopyCaption(caption, i)}
                              className="w-full text-left p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm hover:border-nous-text dark:hover:border-white transition-all group flex justify-between items-center"
                            >
                               <p className="font-serif italic text-sm text-stone-500 group-hover:text-nous-text dark:group-hover:text-white transition-colors flex-1 pr-4">
                                 "{caption}"
                               </p>
                               <div className="shrink-0">
                                 {copiedIndex === i ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-stone-300 opacity-0 group-hover:opacity-100" />}
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>
                 </aside>
              </div>
            </>
          )}

          <footer className="pt-32 pb-32 border-t border-stone-100 dark:border-stone-900 text-center space-y-12">
             <div className="opacity-10 pointer-events-none select-none">
                <h1 className="font-header italic text-9xl">Mimi.</h1>
             </div>
             <p className="font-serif italic text-stone-400">"Art is a structural requirement for survival."</p>
             <button 
              onClick={onClose}
              className="px-12 py-5 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[10px] uppercase tracking-[0.5em] font-black rounded-full shadow-2xl active:scale-95 transition-all"
             >
                Return to the Press
             </button>
          </footer>
      </main>
    </motion.div>
  );
};
