// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DossierArtifact } from '../types';
import { X, Share2, Download, ExternalLink, Activity, Info, Briefcase, FileText, Check, Copy, Globe, Pin, LayoutGrid, Quote, Terminal } from 'lucide-react';

export const DossierArtifactView: React.FC<{ artifact: DossierArtifact; onClose: () => void }> = ({ artifact, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/?dossier=${artifact.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-white dark:bg-[#0A0A0A] overflow-y-auto no-scrollbar print:overflow-visible print:h-auto selection:bg-nous-text selection:text-white print:bg-white print:text-black">
      <div className="h-20 border-b border-stone-100 dark:border-stone-900 px-6 md:px-12 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl z-[100] print:hidden">
          <button onClick={onClose} className="flex items-center gap-4 group">
             <div className="p-2 border border-stone-200 dark:border-stone-800 rounded-full group-hover:bg-nous-text group-hover:text-white transition-all"><X size={16} /></div>
             <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black text-stone-400 group-hover:text-nous-text">Archive Reference</span>
          </button>
          <div className="flex items-center gap-4">
             <button onClick={handleShare} className="flex items-center gap-3 px-6 py-2 bg-stone-50 dark:bg-stone-800 border border-black/5 rounded-full font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text transition-all">
                {copied ? <Check size={12} className="text-emerald-500" /> : <Share2 size={12} />}
                {copied ? 'Link Bound' : 'Share Manifest'}
             </button>
             <button onClick={handleExportPdf} className="p-3 bg-nous-text dark:bg-white text-white dark:text-black rounded-full shadow-lg active:scale-95 transition-all">
                <Download size={18} />
             </button>
          </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-24 print:p-0 print:m-0 print:space-y-12">
          <header className="space-y-12 md:space-y-16 print:space-y-4">
              <div className="flex items-center gap-4 text-emerald-500 print:text-black">
                  <LayoutGrid size={18} className="animate-pulse print:hidden" />
                  <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">Curated Dossier Artifact</span>
              </div>
              <div className="space-y-6 print:space-y-2">
                <h1 className="font-serif text-6xl md:text-8xl italic tracking-tighter leading-none text-nous-text dark:text-white print:text-black print:text-5xl">
                   {artifact.title}
                </h1>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8 border-t border-stone-100 dark:border-stone-900 print:pt-4 print:border-black">
                   <div className="flex items-center gap-4">
                      <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 print:text-gray-500">Classification:</span>
                      <span className="font-serif italic text-2xl text-nous-text dark:text-white uppercase print:text-black">{artifact.type || 'Project Artifact'}</span>
                   </div>
                   <div className="flex flex-col items-start md:items-end">
                      <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 print:text-gray-500">Archive Entry</span>
                      <span className="font-mono text-sm text-stone-500 font-bold print:text-black">{new Date(artifact.createdAt).toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 print:block print:space-y-8">
             {artifact.elements?.map((el, idx) => (
                <motion.div 
                  key={el.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative flex flex-col group print:break-inside-avoid print:mb-8 ${el.type === 'text' || el.type === 'analysis_pin' ? 'md:col-span-2 lg:col-span-1' : ''}`}
                >
                   {el.type === 'image' ? (
                     <div className="space-y-6 print:space-y-2">
                        <div className="bg-stone-50 dark:bg-stone-900 p-1 border border-black/5 dark:border-white/5 rounded-sm shadow-sm hover:shadow-xl transition-all duration-700 print:bg-white print:border-gray-200 print:shadow-none">
                            <img src={el.content} className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-[2s] print:grayscale-0" />
                            <div className="pt-4 pb-2 px-2 flex justify-between items-center opacity-30 print:hidden">
                               <span className="font-mono text-[7px] uppercase tracking-widest">fragment_0{idx+1}</span>
                               <Pin size={10} className={el.style?.hasPin ? "text-red-500 opacity-100" : ""} />
                            </div>
                        </div>
                        {el.notes && (
                          <div className="px-2 space-y-3 print:pl-0">
                             <div className="flex items-center gap-3 text-stone-300 print:text-gray-400">
                                <Quote size={10} />
                                <span className="font-sans text-[7px] uppercase tracking-widest font-black italic">Field Note</span>
                             </div>
                             <p className="font-serif italic text-lg text-stone-500 leading-relaxed border-l-2 border-stone-100 pl-4 print:text-black print:border-gray-300">{el.notes}</p>
                          </div>
                        )}
                     </div>
                   ) : (
                     <div className="flex flex-col h-full space-y-6 print:space-y-2">
                        <div className="flex-1 bg-[#FDFBF7] dark:bg-stone-900 p-8 flex flex-col justify-start text-left border border-black/5 dark:border-white/10 shadow-inner group relative rounded-sm border-b-[40px] border-[#FDFBF7] dark:border-stone-900 print:bg-white print:border-black print:border-b-0 print:shadow-none print:p-0">
                            <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-2 print:mb-2 print:border-black">
                               <div className="flex items-center gap-2 text-stone-400 print:text-black">
                                  <Terminal size={14} className="text-emerald-500 print:hidden" />
                                  <span className="font-mono text-[9px] uppercase tracking-widest font-black">
                                     {el.type === 'analysis_pin' ? 'Tech_Debrief' : 'Thought_Shard'}
                                  </span>
                               </div>
                               <span className="font-mono text-[8px] opacity-30 print:hidden">REF_0{idx+1}</span>
                            </div>
                            <p className={`font-serif italic tracking-tight text-stone-700 dark:text-stone-300 print:text-black whitespace-pre-wrap ${el.type === 'analysis_pin' ? 'text-xl md:text-2xl leading-snug' : 'text-3xl md:text-4xl leading-none print:text-xl'}`}>
                               "{el.content}"
                            </p>
                        </div>
                     </div>
                   )}
                </motion.div>
             ))}
          </section>

          {artifact.report && (
            <section className="grid md:grid-cols-12 gap-16 md:gap-32 pt-24 border-t border-stone-100 dark:border-stone-900 items-start print:block print:pt-8 print:border-black">
               <div className="md:col-span-7 space-y-12 print:mb-8 print:space-y-4">
                  <div className="flex items-center gap-4 text-stone-300 print:text-black">
                     <Briefcase size={20} />
                     <span className="font-sans text-[11px] uppercase tracking-[0.5em] font-black italic">Executive Synthesis</span>
                  </div>
                  <h3 className="font-serif text-4xl md:text-6xl italic tracking-tighter leading-tight text-nous-text dark:text-white print:text-black print:text-3xl">
                     {artifact.report.conceptualThroughline || artifact.report.coreFrequency}
                  </h3>
                  <div className="space-y-8 font-serif italic text-xl md:text-2xl text-stone-500 dark:text-stone-400 leading-relaxed text-balance print:text-black print:text-lg">
                     <p>{artifact.report.designBrief || artifact.report.diagnosis}</p>
                  </div>
               </div>
               <aside className="md:col-span-5 space-y-16 print:space-y-4">
                  <div className="p-10 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-8 shadow-inner print:bg-white print:border-gray-200 print:p-0 print:shadow-none">
                      <div className="space-y-2">
                        <span className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500 italic print:text-black">Frequency Audit</span>
                        <p className="font-serif italic text-2xl text-nous-text dark:text-white print:text-black">{artifact.report.coreFrequency}</p>
                      </div>
                      <div className="space-y-4">
                         <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 print:text-black">Color Story</span>
                         <div className="flex gap-2">
                            {artifact.report.colorStory?.map((c, i) => (
                               <div key={i} className="w-8 h-8 rounded-full border border-black/5" style={{ backgroundColor: c.hex }} title={c.name} />
                            ))}
                         </div>
                      </div>
                  </div>
               </aside>
            </section>
          )}

          <footer className="pt-32 pb-48 text-center space-y-12 border-t border-stone-100 dark:border-stone-900 print:hidden">
             <div className="opacity-10 pointer-events-none select-none">
                <h1 className="font-header italic text-[12rem] md:text-[18rem]">Mimi.</h1>
             </div>
             <button onClick={onClose} className="px-12 py-5 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[10px] uppercase tracking-[0.5em] font-black rounded-full shadow-2xl active:scale-95 transition-all print:hidden">Return to Folder</button>
          </footer>
      </main>
    </div>
  );
};