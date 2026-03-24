// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DossierArtifact } from '../types';
import { X, Share2, Download, ExternalLink, Activity, Info, Briefcase, FileText, Check, Copy, Globe, Pin, LayoutGrid, Quote, Terminal, Cpu, ScanLine, Target } from 'lucide-react';
import { AestheticDNA } from './AestheticDNA';

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
    <div className="fixed inset-0 z-[5000] bg-[#0a0a0a] text-stone-200 overflow-y-auto no-scrollbar font-mono selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

      <div className="h-20 border-b border-stone-800 px-6 md:px-12 flex justify-between items-center sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-[100] print:hidden">
          <button onClick={onClose} className="flex items-center gap-4 group">
             <div className="p-2 border border-stone-800 rounded-sm group-hover:border-emerald-500 group-hover:text-emerald-500 transition-all"><X size={16} /></div>
             <span className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 group-hover:text-emerald-500 transition-colors">Close Artifact</span>
          </button>
          <div className="flex items-center gap-4">
             <button onClick={handleShare} className="flex items-center gap-3 px-6 py-2 bg-stone-900 border border-stone-800 rounded-sm font-mono text-[9px] uppercase tracking-widest font-bold text-stone-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all">
                {copied ? <Check size={12} className="text-emerald-500" /> : <Share2 size={12} />}
                {copied ? 'Link Copied' : 'Share Shard'}
             </button>
             <button onClick={handleExportPdf} className="p-3 bg-stone-900 border border-stone-800 text-stone-400 hover:text-emerald-500 hover:border-emerald-500/50 rounded-sm transition-all">
                <Download size={18} />
             </button>
          </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-12 relative z-10">
          <header className="space-y-6">
              <div className="flex items-center gap-4 text-emerald-500">
                  <ScanLine size={18} className="animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.4em] font-bold">Artifact Analysis</span>
              </div>
              <h1 className="font-serif text-4xl md:text-6xl italic tracking-tighter leading-none text-stone-100">
                  {artifact.title}
              </h1>
          </header>
          
          <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-stone-900 p-2 border border-stone-800 flex items-center justify-center min-h-[300px]">
                  {artifact.content ? (
                      <img src={artifact.content} className="w-full h-auto object-contain" alt={artifact.title} />
                  ) : artifact.type === 'strategy' ? (
                      <div className="p-8 text-center space-y-4">
                          <Target size={48} className="mx-auto text-emerald-500 opacity-50" />
                          <h3 className="font-serif italic text-2xl text-stone-300">Strategy Audit</h3>
                          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">Platform Analysis</p>
                      </div>
                  ) : (
                      <div className="p-8 text-center space-y-4">
                          <FileText size={48} className="mx-auto text-stone-700" />
                          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">Text Document</p>
                      </div>
                  )}
              </div>
              <div className="space-y-8">
                  <p className="font-serif text-xl text-stone-300 leading-relaxed">
                      {artifact.description}
                  </p>
                  <AestheticDNA dna={artifact.dna} />
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8 border-t border-stone-800">
                     <div className="flex items-center gap-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-600">Type:</span>
                        <span className="font-mono text-sm text-emerald-500 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded-sm">{artifact.type || 'Unknown'}</span>
                     </div>
                     <div className="flex flex-col items-start md:items-end">
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-600">Timestamp</span>
                        <span className="font-mono text-xs text-stone-400">{new Date(artifact.createdAt).toLocaleDateString()} <span className="text-stone-600">|</span> {new Date(artifact.createdAt).toLocaleTimeString()}</span>
                     </div>
                  </div>
              </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
             {artifact.elements?.map((el, idx) => (
                <motion.div 
                  key={el.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative flex flex-col group ${el.type === 'text' || el.type === 'analysis_pin' ? 'md:col-span-2 lg:col-span-1' : ''}`}
                >
                   {el.type === 'image' ? (
                     <div className="space-y-6">
                        <div className="bg-stone-900 p-1 border border-stone-800 rounded-sm shadow-2xl relative overflow-hidden group-hover:border-emerald-500/30 transition-all duration-500">
                            <img src={el.content} className="w-full h-auto object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700" />
                            <div className="absolute top-2 right-2">
                               <Pin size={12} className={`text-emerald-500 ${el.style?.hasPin ? "opacity-100" : "opacity-0"}`} />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 backdrop-blur-sm border-t border-stone-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <span className="font-mono text-[7px] uppercase tracking-widest text-stone-500">IMG_SEQ_0{idx+1}</span>
                            </div>
                        </div>
                        {el.notes && (
                          <div className="px-2 space-y-3 border-l border-stone-800 pl-4">
                             <div className="flex items-center gap-3 text-stone-500">
                                <Quote size={10} />
                                <span className="font-mono text-[8px] uppercase tracking-widest font-bold">Annotation</span>
                             </div>
                             <p className="font-serif italic text-lg text-stone-400 leading-relaxed">{el.notes}</p>
                          </div>
                        )}
                     </div>
                   ) : (
                     <div className="flex flex-col h-full space-y-6">
                        <div className="flex-1 bg-stone-900/50 p-8 flex flex-col justify-start text-left border border-stone-800 hover:border-emerald-500/30 transition-colors rounded-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-stone-800 group-hover:bg-emerald-500 transition-colors" />
                            <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-2">
                               <div className="flex items-center gap-2 text-stone-500">
                                  <Terminal size={12} className="text-emerald-500" />
                                  <span className="font-mono text-[8px] uppercase tracking-widest font-bold">
                                     {el.type === 'analysis_pin' ? 'System_Log' : 'Text_Fragment'}
                                  </span>
                               </div>
                               <span className="font-mono text-[8px] text-stone-700">HEX_0{idx+1}</span>
                            </div>
                            <div className={`font-serif tracking-tight text-stone-300 whitespace-pre-wrap ${el.type === 'analysis_pin' ? 'text-lg leading-relaxed' : 'text-xl leading-snug'}`}>
                               {artifact.type === 'strategy' ? (
                                  (() => {
                                    try {
                                      const data = JSON.parse(el.content);
                                      return (
                                        <div className="space-y-6 text-sm">
                                          <div>
                                            <h4 className="font-mono text-[10px] uppercase tracking-widest text-emerald-500 mb-2">Opening Line</h4>
                                            <p className="italic text-stone-400">"{data.openingLine}"</p>
                                          </div>
                                          <div>
                                            <h4 className="font-mono text-[10px] uppercase tracking-widest text-emerald-500 mb-2">Aesthetic Audit</h4>
                                            <ul className="list-disc pl-4 space-y-1 text-stone-400">
                                              <li><strong>Palette:</strong> {data.aestheticAudit.palette}</li>
                                              <li><strong>Density:</strong> {data.aestheticAudit.density}</li>
                                              <li><strong>Entropy:</strong> {data.aestheticAudit.entropy}</li>
                                              <li className="italic mt-2">"{data.aestheticAudit.insight}"</li>
                                            </ul>
                                          </div>
                                          <div>
                                            <h4 className="font-mono text-[10px] uppercase tracking-widest text-emerald-500 mb-2">Strategy Shift</h4>
                                            <ul className="list-disc pl-4 space-y-1 text-stone-400">
                                              {data.strategyShift.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                            </ul>
                                          </div>
                                          <div>
                                            <h4 className="font-mono text-[10px] uppercase tracking-widest text-emerald-500 mb-2">Identity Reframe</h4>
                                            <p className="italic text-stone-400">"{data.identityReframe}"</p>
                                          </div>
                                        </div>
                                      );
                                    } catch (e) {
                                      return <pre className="font-mono text-[10px] text-stone-400 overflow-x-auto p-4 bg-black/50 rounded-sm border border-stone-800">{el.content}</pre>;
                                    }
                                  })()
                               ) : (
                                  `"${el.content}"`
                               )}
                            </div>
                        </div>
                     </div>
                   )}
                </motion.div>
             ))}
          </section>

          {artifact.report && (
            <section className="grid md:grid-cols-12 gap-16 md:gap-32 pt-24 border-t border-stone-800 items-start">
               <div className="md:col-span-7 space-y-12">
                  <div className="flex items-center gap-4 text-emerald-500">
                     <Cpu size={18} />
                     <span className="font-mono text-[9px] uppercase tracking-[0.4em] font-bold">Executive Synthesis</span>
                  </div>
                  <h3 className="font-serif text-4xl md:text-5xl italic tracking-tighter leading-tight text-stone-200">
                     {artifact.report.conceptualThroughline || artifact.report.coreFrequency}
                  </h3>
                  <div className="space-y-8 font-serif italic text-xl text-stone-400 leading-relaxed text-balance">
                     <p>{artifact.report.designBrief || artifact.report.diagnosis}</p>
                  </div>
               </div>
               <aside className="md:col-span-5 space-y-8">
                  <div className="p-8 bg-stone-900/30 border border-stone-800 rounded-sm space-y-8">
                      <div className="space-y-2">
                        <span className="font-mono text-[8px] uppercase tracking-widest font-bold text-emerald-500">Frequency Audit</span>
                        <p className="font-serif italic text-2xl text-stone-200">{artifact.report.coreFrequency}</p>
                      </div>
                      <div className="space-y-4">
                         <span className="font-mono text-[8px] uppercase tracking-widest font-bold text-stone-500">Chromatic Data</span>
                         <div className="flex gap-2">
                            {artifact.report.colorStory?.map((c, i) => (
                               <div key={i} className="w-8 h-8 rounded-sm border border-stone-700" style={{ backgroundColor: c.hex }} title={c.name} />
                            ))}
                         </div>
                      </div>
                  </div>
               </aside>
            </section>
          )}

          <section className="pt-24 border-t border-stone-800">
             <AestheticDNA 
                report={artifact.report} 
                palette={artifact.report?.colorStory} 
                title={artifact.title} 
              />
          </section>

          <footer className="pt-32 pb-48 text-center space-y-12 border-t border-stone-800 print:hidden">
             <div className="opacity-10 pointer-events-none select-none">
                <h1 className="font-serif italic text-[8rem] md:text-[12rem] text-stone-800">Mimi.</h1>
             </div>
             <button onClick={onClose} className="px-12 py-4 border border-stone-800 hover:border-emerald-500 text-stone-500 hover:text-emerald-500 font-mono text-[9px] uppercase tracking-[0.4em] font-bold rounded-sm transition-all">Return to Grid</button>
          </footer>
      </div>
    </div>
  );
};
