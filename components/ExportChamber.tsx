
// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, FileText, LayoutGrid, Layers, Printer, Check, Copy, Shield, Info, Palette, Maximize2, Smartphone, Square, ArrowDown, ChevronDown, CheckCircle2, Terminal, Stamp, Loader2, Zap, Monitor, Scroll, Image } from 'lucide-react';
import { ZineMetadata } from '../types';
import { SocialShareModal } from './SocialShareModal';
import html2canvas from 'html2canvas';

interface ExportChamberProps {
  metadata: ZineMetadata;
  onClose: () => void;
}

const SECTION_DEFS = [
  { id: 'cover', label: 'Invocation', icon: <Shield size={14} /> },
  { id: 'reading', label: 'The Reading', icon: <FileText size={14} /> },
  { id: 'signals', label: 'Archetype', icon: <Layers size={14} /> },
  { id: 'plates', label: 'Plates', icon: <LayoutGrid size={14} /> },
  { id: 'blueprint', label: 'Blueprint', icon: <Terminal size={14} /> },
  { id: 'debris', label: 'Field Debris', icon: <Info size={14} /> }
];

const EXPORT_MODES = [
  { id: 'scroll', label: 'Master Scroll', desc: 'Continuous vertical flow. Optimized for mobile witnessing and long screenshots.', icon: <Scroll size={16} /> },
  { id: 'assets', label: 'Asset Stack', desc: 'Separated high-fidelity cards. Designed for individual saving or social carousel processing.', icon: <Image size={16} /> },
  { id: 'print', label: 'Physical (A4)', desc: 'Standard architectural layout calibrated for physical ink manifestation and archival binding.', icon: <Printer size={16} /> }
];

const SectionHeader: React.FC<{ label: string; icon: any }> = ({ label, icon: Icon }) => (
  <div className="flex items-center gap-4 mb-8 opacity-50">
    <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-nous-text dark:text-white">
      {React.cloneElement(Icon as React.ReactElement, { size: 12 })}
    </div>
    <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black text-stone-400">{label}</span>
    <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
  </div>
);

export const ExportChamber: React.FC<ExportChamberProps> = ({ metadata, onClose }) => {
  const [exportMode, setExportMode] = useState<'scroll' | 'assets' | 'print'>('scroll');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(SECTION_DEFS.map(s => s.id)));
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fallback to prevent crash if metadata is incomplete
  if (!metadata || !metadata.content) {
      return (
          <div className="fixed inset-0 z-[20000] bg-stone-900 text-white flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-4">
                  <p className="font-serif italic text-xl text-red-400">Artifact Structural Failure</p>
                  <p className="font-sans text-xs text-stone-500">The metadata for this zine is incomplete or corrupted.</p>
                  <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-full font-sans text-xs font-black">Close</button>
              </div>
          </div>
      );
  }

  const toggleSection = (id: string) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setHasError(false);
    
    // Allow UI to update before processing
    await new Promise(r => setTimeout(r, 500));

    try {
      if (exportMode === 'print') {
        window.print();
      } else {
        // Digital Export (Scroll/Assets) - Render to PNG
        const element = document.getElementById('export-target');
        if (!element) throw new Error("Capture target not found");

        const canvas = await html2canvas(element, {
          scale: 2, // High resolution for Retina displays
          useCORS: true, // Crucial for external images
          allowTaint: true,
          backgroundColor: null, 
          logging: false,
          onclone: (doc) => {
             // Ensure visible elements are rendered clearly
             const el = doc.getElementById('export-target');
             if (el) {
                 el.style.transform = 'none';
                 el.style.maxHeight = 'none';
             }
          }
        });

        const link = document.createElement('a');
        link.download = `Mimi_${metadata.title.replace(/[^a-z0-9]/gi, '_')}_${exportMode}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error("Export Failed:", e);
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const content = metadata.content;
  
  // Dynamic styles based on mode
  const containerStyle = useMemo(() => {
      if (exportMode === 'print') return { width: '210mm', minHeight: '297mm' }; 
      if (exportMode === 'assets') return { width: '100%', maxWidth: '420px', background: 'transparent', boxShadow: 'none' };
      return { width: '100%', maxWidth: '420px' }; // Scroll mode
  }, [exportMode]);

  const blockClass = useMemo(() => {
      const base = "bg-white dark:bg-stone-950 flex flex-col justify-center overflow-hidden relative";
      // Print Mode: Forced Page Breaks
      if (exportMode === 'print') return `${base} h-[297mm] w-full p-16 print:break-after-page print:page-break-after-always border-b-0 print:border-0`;
      // Asset Stack: Separated Cards
      if (exportMode === 'assets') return `${base} aspect-[3/4] w-full p-12 mb-12 rounded-sm shadow-xl border border-stone-100 dark:border-stone-800 print:break-after-page`;
      // Scroll Mode: Continuous Flow
      return `${base} py-16 px-10 border-b border-stone-100 dark:border-stone-900 last:border-0`;
  }, [exportMode]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[20000] bg-stone-100 dark:bg-stone-950 flex flex-col md:flex-row overflow-hidden print:bg-white selection:bg-emerald-500 print:static print:overflow-visible print:h-auto print:block"
    >
      
      {/* CONTROLS SIDEBAR */}
      <aside className="w-full md:w-[400px] border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col p-8 shrink-0 z-20 print:hidden overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-12">
            <div className="space-y-1">
                <span className="font-sans text-[8px] uppercase tracking-[0.5em] font-black text-emerald-500">Output Lab</span>
                <h2 className="font-serif text-3xl italic tracking-tighter text-nous-text dark:text-white">Export.</h2>
            </div>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-red-500 transition-all rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"><X size={20}/></button>
        </div>
        
        <div className="space-y-12">
          <section className="space-y-6">
             <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 block border-b border-stone-100 dark:border-stone-800 pb-2">Format Protocol</span>
             <div className="grid gap-3">
                {EXPORT_MODES.map(m => (
                   <button key={m.id} onClick={() => setExportMode(m.id as any)} className={`text-left p-5 rounded-lg border transition-all ${exportMode === m.id ? 'bg-stone-50 dark:bg-black/20 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20' : 'text-stone-400 border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                              <div className={exportMode === m.id ? 'text-emerald-500' : 'text-stone-300'}>{m.icon}</div>
                              <p className={`font-serif italic text-lg ${exportMode === m.id ? 'text-nous-text dark:text-white' : 'text-stone-500'}`}>{m.label}</p>
                          </div>
                          {exportMode === m.id && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </div>
                      <p className="font-sans text-[9px] text-stone-400 leading-relaxed uppercase tracking-wide opacity-80 pl-9">{m.desc}</p>
                   </button>
                ))}
             </div>
          </section>

          <section className="space-y-4">
             <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 block border-b border-stone-100 dark:border-stone-800 pb-2">Includes</span>
             <div className="grid grid-cols-2 gap-2">
                {SECTION_DEFS.map(s => (
                   <button key={s.id} onClick={() => toggleSection(s.id)} className={`flex items-center gap-3 p-3 rounded-md border transition-all ${selectedSections.has(s.id) ? 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-nous-text dark:text-white' : 'text-stone-300 dark:text-stone-700 border-transparent hover:bg-stone-50 dark:hover:bg-stone-900'}`}>
                      <div className={selectedSections.has(s.id) ? 'text-emerald-500' : ''}>{s.icon}</div>
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">{s.label}</span>
                   </button>
                ))}
             </div>
          </section>
        </div>

        <div className="mt-auto pt-12 space-y-4">
           {hasError && <p className="text-red-500 text-xs font-mono text-center">Export Handshake Failed. Try refreshing.</p>}
           <button onClick={handleExport} disabled={isGenerating} className="w-full py-5 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[10px] tracking-[0.4em] uppercase font-black shadow-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : (exportMode === 'print' ? <Printer size={16} /> : <Download size={16} />)}
              {isGenerating ? 'Rendering...' : (exportMode === 'print' ? 'Print Manifest' : 'Download Asset')}
           </button>
        </div>
      </aside>

      {/* PREVIEW AREA */}
      <main className="flex-1 bg-stone-200/50 dark:bg-[#050505] overflow-y-auto p-4 md:p-12 flex justify-center no-scrollbar print:p-0 print:m-0 print:bg-white print:block print:w-full print:h-auto print:overflow-visible">
          <AnimatePresence>{isGenerating && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center print:hidden"><div className="bg-white dark:bg-stone-900 p-12 rounded-2xl shadow-2xl text-center space-y-6 border border-stone-100 dark:border-stone-800"><Loader2 size={40} className="animate-spin text-emerald-500 mx-auto" /><div className="space-y-2"><p className="font-serif italic text-2xl text-nous-text dark:text-white">“Compressing Reality...”</p><p className="font-sans text-[9px] uppercase tracking-widest text-stone-400">Preparing High-Fidelity Output</p></div></div></motion.div>}</AnimatePresence>
          
          <div id="export-target" className={`transition-all duration-500 print:shadow-none print:w-full print:max-w-none print:mx-0 print:text-black ${exportMode === 'scroll' ? 'bg-white dark:bg-stone-950 shadow-2xl' : ''} ${exportMode === 'print' ? 'bg-white text-black shadow-none' : ''}`} style={containerStyle}>
             
             {/* 1. COVER */}
             {selectedSections.has('cover') && (
                <div className={blockClass}>
                    <div className="flex-1 flex flex-col justify-center space-y-10">
                        <div className="space-y-4">
                            <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black text-stone-400">Issue Manifest</span>
                            <h1 className="font-serif text-6xl md:text-8xl italic tracking-tighter leading-[0.85] uppercase text-nous-text dark:text-white print:text-black">
                                {metadata.title}
                            </h1>
                        </div>
                        <div className="h-px w-24 bg-stone-200 dark:bg-stone-800 print:bg-black" />
                        <div className="space-y-2">
                            <p className="font-serif italic text-2xl text-stone-500 print:text-gray-600">@{metadata.userHandle}</p>
                            <p className="font-sans text-[9px] uppercase tracking-widest text-stone-400 font-black">{metadata.tone} // {new Date(metadata.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                    {exportMode !== 'scroll' && <div className="absolute bottom-8 right-8"><Stamp size={64} className="text-stone-100 dark:text-stone-900 print:text-gray-100 -rotate-12" /></div>}
                </div>
             )}

             {/* 2. READING */}
             {selectedSections.has('reading') && (
                <div className={blockClass}>
                    <SectionHeader label="The Reading" icon={<FileText />} />
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="font-serif italic text-3xl md:text-4xl text-stone-800 dark:text-stone-200 leading-[1.2] print:text-black text-balance">
                            "{content.oracular_mirror}"
                        </p>
                    </div>
                    <div className="pt-8 opacity-40">
                       <p className="font-sans text-[8px] uppercase tracking-widest font-black">Strategic Hypothesis</p>
                       <p className="font-serif italic text-sm mt-2">{content.strategic_hypothesis}</p>
                    </div>
                </div>
             )}

             {/* 3. SIGNALS (ARCHETYPE) */}
             {selectedSections.has('signals') && metadata.content.aesthetic_touchpoints && (
                <div className={`${blockClass} bg-stone-900 text-white print:bg-black print:text-white`}>
                    <SectionHeader label="Archetype Index" icon={<Layers />} />
                    <div className="flex-1 flex flex-col justify-center space-y-8">
                        {metadata.content.aesthetic_touchpoints.slice(0, 4).map((t, i) => (
                            <div key={i} className="border-l-2 border-white/20 pl-6 space-y-1">
                                <h4 className="font-serif text-2xl italic text-white">{t.motif}</h4>
                                <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 leading-relaxed">{t.context}</p>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             {/* 4. PLATES */}
             {selectedSections.has('plates') && content.pages?.map((page, i) => (
                <div key={`plate-${i}`} className={blockClass}>
                    <div className="flex justify-between items-end mb-6 opacity-50">
                        <span className="font-mono text-[9px]">FIG_0{i+1}</span>
                        <span className="font-sans text-[7px] uppercase tracking-widest font-black">Visual Plate</span>
                    </div>
                    <div className="aspect-[3/4] w-full overflow-hidden mb-8 bg-stone-100 print:bg-gray-100">
                        <img 
                            src={page.image_url} 
                            className="w-full h-full object-cover grayscale print:grayscale-0" 
                            crossOrigin="anonymous" 
                        />
                    </div>
                    <h2 className="font-serif text-3xl italic tracking-tight uppercase mb-4 text-nous-text dark:text-white print:text-black">{page.headline}</h2>
                    <p className="font-serif italic text-base text-stone-500 leading-relaxed print:text-gray-600">{page.bodyCopy}</p>
                </div>
             ))}

             {/* 5. BLUEPRINT (NEW) */}
             {selectedSections.has('blueprint') && content.blueprint && (
                <div className={blockClass}>
                    <SectionHeader label="The Blueprint" icon={<Terminal />} />
                    <div className="flex-1 flex flex-col justify-center gap-8">
                        {Object.entries(content.blueprint).map(([key, val], i) => (
                            <div key={i} className="space-y-2">
                                <span className="font-sans text-[7px] uppercase tracking-[0.2em] font-black text-emerald-600 dark:text-emerald-400 block">{key.replace('_', ' ')}</span>
                                <p className="font-serif italic text-lg text-nous-text dark:text-white print:text-black leading-snug border-b border-stone-100 dark:border-stone-900 pb-4">
                                    {String(val)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             {/* 6. DEBRIS (NEW) */}
             {selectedSections.has('debris') && (metadata.originalInput || metadata.content.meta?.intent) && (
                <div className={`${blockClass} bg-stone-50 dark:bg-stone-900 print:bg-gray-50`}>
                    <SectionHeader label="Field Debris" icon={<Info />} />
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="p-8 border-l-4 border-stone-200 dark:border-stone-700 print:border-gray-300">
                            <span className="font-mono text-[9px] text-stone-400 mb-4 block">// RAW_INPUT_LOG</span>
                            <p className="font-mono text-xs md:text-sm text-stone-600 dark:text-stone-300 print:text-black leading-relaxed whitespace-pre-wrap">
                                {metadata.originalInput || metadata.content.meta?.intent || "Debris data obscured."}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 text-center opacity-30">
                        <p className="font-serif italic text-[10px]">Mimi Sovereign Registry v4.4</p>
                    </div>
                </div>
             )}

          </div>
      </main>
      <style>{`
        @media print { 
            @page { margin: 0; size: A4; } 
            body { background: white !important; -webkit-print-color-adjust: exact; overflow: visible !important; } 
            aside, .print\\:hidden { display: none !important; } 
            main { padding: 0 !important; margin: 0 !important; background: white !important; display: block !important; overflow: visible !important; height: auto !important; } 
            #export-target { width: 100% !important; max-width: none !important; box-shadow: none !important; background: white !important; color: black !important; transform: none !important; } 
            img { filter: grayscale(0) !important; max-height: 100% !important; width: auto !important; margin: 0 auto; display: block; }
            .print\\:break-after-page { break-after: page; page-break-after: always; }
            .print\\:h-\\[297mm\\] { height: 297mm; min-height: 297mm; }
        }
      `}</style>
    </motion.div>
  );
};
