
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Bookmark, Check, Circle, Zap, Lock } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { addToPocket } from '../services/firebase';

interface EditorialSpreadProps {
  article: any;
  onClose: () => void;
}

const SpecimenSVG: React.FC<{ type: number }> = ({ type }) => {
    if (type === 1) return (
        <svg viewBox="0 0 100 150" className="w-full h-full stroke-stone-400 dark:stroke-stone-600 fill-none opacity-60" strokeWidth="0.5">
            <path d="M50,140 Q45,100 50,60 M50,110 Q30,90 25,75 M50,90 Q70,70 75,55 M50,60 Q40,30 50,10 Q60,30 50,60" strokeDasharray="2 1" />
            <circle cx="50" cy="10" fill="currentColor" r="2" className="text-stone-500" />
            <path d="M48,12 Q45,5 50,2 Q55,5 52,12" />
            <path d="M25,75 Q20,70 24,65 Q28,70 25,75" />
        </svg>
    );
    if (type === 2) return (
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-stone-400 dark:stroke-stone-600 fill-none opacity-60" strokeWidth="0.5">
            <path d="M20,20 L80,25 L75,80 L15,75 Z" />
            <path d="M20,20 L40,15 L70,20" />
            <path d="M15,75 L30,85 L60,80" />
            <path d="M40,40 Q50,35 60,40 Q65,55 55,65 Q40,60 40,40" strokeDasharray="1 1" />
            <circle cx="50" cy="50" fill="currentColor" r="1" className="text-stone-500" />
        </svg>
    );
    return null;
};

export const EditorialSpread: React.FC<EditorialSpreadProps> = ({ article, onClose }) => {
  const { user, profile } = useUser();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  const handleArchiveArticle = async () => {
    if (isArchiving || isArchived) return;
    setIsArchiving(true);
    try {
      await addToPocket(user?.uid || 'ghost', 'script', {
        title: article.brand,
        headline: article.headline,
        body: article.content.intro, // Save intro as summary
        tag: article.tag,
        author: article.content.author,
        timestamp: Date.now()
      });
      setIsArchived(true);
    } catch (e) {
      console.error("MIMI // Archive failure:", e);
    } finally {
      setIsArchiving(false);
    }
  };

  const isGated = article.isLocked && !profile?.isSwan;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9000] bg-[#F9F7F2] dark:bg-[#121212] flex flex-col font-serif text-stone-900 dark:text-stone-100"
    >
      {/* DOT GRID BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #d1cfc8 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }}></div>
      <div className="absolute inset-0 pointer-events-none dark:opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)', backgroundSize: '24px 24px', display: 'none' }}></div>
      <style>{`.dark .dot-bg { display: block; }`}</style>

      {/* SIDEBAR METADATA */}
      <aside className="fixed left-0 top-0 h-full w-12 md:w-16 border-r border-stone-200 dark:border-stone-800 flex flex-col items-center py-8 z-50 bg-[#F9F7F2]/80 dark:bg-[#121212]/80 backdrop-blur-sm">
         <div className="vertical-text text-[9px] md:text-[10px] font-mono tracking-widest uppercase opacity-40 mb-12 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
            LAT: 34.0522 N // LONG: 118.2437 W
         </div>
         <div className="vertical-text text-[9px] md:text-[10px] font-mono tracking-widest uppercase opacity-40 mb-12 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
            TIMESTAMP: {new Date().toISOString().split('T')[0].replace(/-/g, '.')}
         </div>
         <div className="vertical-text text-[9px] md:text-[10px] font-mono tracking-widest uppercase opacity-40 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
            PROTOCOL ID: {article.ref}
         </div>
      </aside>

      {/* FLOATING SPECIMEN SKETCH (Desktop Only) */}
      <div className="fixed right-12 top-32 w-32 pointer-events-none opacity-40 z-10 hidden xl:block">
         <SpecimenSVG type={1} />
         <div className="mt-2 font-mono text-[9px] uppercase tracking-tighter text-stone-500">
            <div className="border-t border-stone-300 dark:border-stone-700 pt-1">Specimen 04-F</div>
            <div className="opacity-70 italic">Dry. Flora Structure</div>
            <div className="mt-1 flex items-center gap-1 opacity-50">
               <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
               <span>δ: 0.12mm</span>
            </div>
         </div>
      </div>

      {/* NAV */}
      <nav className="sticky top-0 w-full z-40 border-b border-stone-200 dark:border-stone-800 bg-[#F9F7F2]/90 dark:bg-[#121212]/90 backdrop-blur px-8 py-4 ml-12 md:ml-16">
         <div className="max-w-7xl mx-auto flex justify-between items-center font-mono text-[10px] uppercase tracking-[0.2em]">
            <button onClick={onClose} className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
               <ArrowLeft size={12} /> Back to Wire
            </button>
            <div className="flex items-center gap-8 opacity-60">
               <span className="hidden md:inline">{article.stats}</span>
               <span className="hidden md:inline">Topic: {article.tag}</span>
               {!isGated && (
                   <button onClick={handleArchiveArticle} className="border border-stone-300 dark:border-stone-700 px-3 py-1 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-2">
                      {isArchived ? <Check size={10} /> : <Bookmark size={10} />} Anchor Article
                   </button>
               )}
            </div>
         </div>
      </nav>

      {/* MAIN CONTENT SCROLL */}
      <main className="ml-12 md:ml-16 min-h-screen relative pb-24 overflow-y-auto">
         {isGated ? (
             <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
                 <div className="p-8 rounded-full border border-stone-300 dark:border-stone-700">
                    <Lock size={32} className="text-stone-400" />
                 </div>
                 <div className="text-center space-y-2">
                    <h2 className="font-serif text-4xl italic">Access Restricted.</h2>
                    <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Swan Clearance Required</p>
                 </div>
             </div>
         ) : (
             <>
                <header className="max-w-7xl mx-auto pt-24 px-12 md:px-24">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="font-mono text-[11px] tracking-[0.3em] uppercase opacity-50">{article.tag}</span>
                        <div className="h-[1px] flex-grow bg-stone-300 dark:bg-stone-700"></div>
                    </div>
                    <div className="relative">
                        <h1 className="font-serif italic text-6xl md:text-8xl lg:text-9xl text-stone-900 dark:text-stone-100 leading-[0.9] mb-8 max-w-4xl tracking-tighter">
                            {article.brand}
                        </h1>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-12 border-l-4 border-stone-900 dark:border-stone-100 pl-8">
                            <div className="max-w-md">
                                <p className="font-mono text-[11px] uppercase tracking-widest leading-relaxed opacity-70">
                                    {article.headline}
                                </p>
                                <p className="font-serif italic text-2xl mt-4 text-stone-600 dark:text-stone-400">
                                    "{article.subtitle}"
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-serif text-xl opacity-60 italic">Written by</p>
                                <p className="font-mono text-[12px] uppercase tracking-widest font-bold">{article.content.author}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="max-w-7xl mx-auto mt-24 px-12 md:px-24 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
                    {/* MAIN COLUMN */}
                    <div className="lg:col-span-7 space-y-16">
                        <article className="prose prose-stone dark:prose-invert max-w-none">
                            <p className="first-letter:float-left first-letter:text-[5rem] first-letter:leading-[0.8] first-letter:pr-4 first-letter:font-serif first-letter:italic text-2xl font-serif leading-relaxed mb-12 text-stone-800 dark:text-stone-200">
                                {article.content.intro}
                            </p>

                            {article.content.sections?.map((section: any, i: number) => (
                                <div key={i} className="mb-16">
                                    <h3 className="font-mono uppercase tracking-[0.2em] text-sm border-b border-stone-200 dark:border-stone-800 pb-2 mb-8 flex items-center gap-2 text-stone-500">
                                        <span className="text-emerald-600 dark:text-emerald-400">0{i+1}.</span> {section.domain || "SECTION"}
                                    </h3>
                                    
                                    <div className="space-y-12">
                                        {section.modules?.map((mod: any, j: number) => (
                                            <div key={j} className="space-y-2">
                                                <div className="flex items-baseline gap-4">
                                                    <h4 className="font-serif text-3xl italic text-stone-900 dark:text-stone-100">{mod.name}</h4>
                                                    <span className="font-mono text-[9px] uppercase tracking-wider opacity-50">{mod.role}</span>
                                                </div>
                                                <p className="text-lg leading-relaxed text-stone-600 dark:text-stone-400">{mod.desc}</p>
                                                {mod.bestPractice && (
                                                    <div className="mt-4 p-4 bg-stone-100 dark:bg-stone-900 border-l-2 border-emerald-500">
                                                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold block mb-1 text-emerald-600 dark:text-emerald-400">Protocol:</span>
                                                        <p className="text-sm italic font-serif opacity-80">{mod.bestPractice}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            {/* FALLBACK BODY TEXT IF NO SECTIONS */}
                            {(!article.content.sections || article.content.sections.length === 0) && (
                                <p className="text-xl leading-relaxed text-stone-700 dark:text-stone-300">
                                    {article.content.bodyText}
                                </p>
                            )}
                        </article>
                    </div>

                    {/* SIDE COLUMN */}
                    <div className="lg:col-span-5 space-y-16">
                        <div className="bg-[#f2f0e9] dark:bg-[#1a1a1a] p-8 relative shadow-lg transform rotate-1 border border-stone-200 dark:border-stone-800">
                            <span className="opacity-10 text-6xl font-serif absolute top-4 left-4">“</span>
                            <p className="font-serif italic text-xl leading-relaxed relative z-10 text-stone-600 dark:text-stone-300 text-center">
                                "The hardest part of modern creativity is the premature optimization of the void."
                            </p>
                        </div>

                        <div className="relative group">
                            <div className="absolute -top-3 left-1/4 w-12 h-6 bg-stone-200/50 dark:bg-stone-800/50 backdrop-blur rotate-12 z-20 shadow-sm"></div>
                            <div className="bg-white dark:bg-stone-900 p-4 pb-12 shadow-xl -rotate-2 relative z-10 border border-stone-100 dark:border-stone-800">
                                <div className="w-full h-64 bg-stone-200 dark:bg-stone-800 mb-4 overflow-hidden">
                                    <div className="w-full h-full opacity-40 bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>
                                </div>
                                <p className="font-handwritten text-xl text-stone-600 dark:text-stone-400 text-center font-serif italic">Fig 1.A — Latent Space Debris</p>
                            </div>
                        </div>

                        <div className="border-t-2 border-stone-900 dark:border-stone-100 pt-6 relative">
                            <div className="w-20 h-20 absolute -top-10 -right-4 opacity-20">
                                <SpecimenSVG type={2} />
                            </div>
                            <h4 className="font-mono text-[12px] font-bold uppercase tracking-widest mb-6 flex items-center justify-between">
                                Internal Registry <span className="text-[10px] font-normal opacity-50">v4.4</span>
                            </h4>
                            <ul className="space-y-4 font-mono text-[11px] uppercase tracking-wide opacity-70">
                                <li className="flex justify-between border-b border-dotted border-stone-400 pb-2">
                                    <span>Vector Space</span> <span className="text-emerald-600">Active</span>
                                </li>
                                <li className="flex justify-between border-b border-dotted border-stone-400 pb-2">
                                    <span>Entropy</span> <span>0.1442</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <footer className="max-w-7xl mx-auto px-12 md:px-24 mt-32 mb-24 opacity-40">
                    <div className="flex items-center justify-between border-t border-stone-400 dark:border-stone-600 pt-8 font-mono text-[9px] uppercase tracking-[0.5em]">
                        <div>End of Manual Segment 001</div>
                        <div>Proprietary Aesthetic Engine</div>
                    </div>
                </footer>
             </>
         )}
      </main>
    </motion.div>
  );
};
