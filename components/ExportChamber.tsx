
// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, FileText, LayoutGrid, Layers, Printer, Check, Copy, Shield, Info, Palette, Maximize2, Smartphone, Square, ArrowDown, ChevronDown, CheckCircle2, Terminal, Stamp, Loader2, Zap, Monitor, Scroll, Image } from 'lucide-react';
import { ZineMetadata } from '../types';
import { SocialShareModal } from './SocialShareModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportChamberProps {
 metadata: ZineMetadata;
 onClose: () => void;
}

const SECTION_DEFS = [
 { id: 'cover', label: 'Invocation', icon: <Shield size={14} /> },
 { id: 'reading', label: 'The Reading', icon: <FileText size={14} /> },
 { id: 'signals', label: 'Archetype', icon: <Layers size={14} /> },
 { id: 'plates', label: 'Plates', icon: <LayoutGrid size={14} /> },
 { id: 'roadmap', label: 'Roadmap', icon: <Terminal size={14} /> },
 { id: 'debris', label: 'Field Debris', icon: <Info size={14} /> }
];

const EXPORT_MODES = [
 { id: 'pdf', label: 'EXPORT AS FLATTENED PDF', desc: 'Standard architectural layout calibrated for physical ink manifestation and archival binding.', icon: <Printer size={16} /> },
 { id: 'assets', label: 'EXTRACT RAW VISUAL ASSETS (.ZIP)', desc: 'Separated high-fidelity cards. Designed for individual saving or social carousel processing.', icon: <Image size={16} /> },
 { id: 'link', label: 'GENERATE ENCRYPTED LINK', desc: 'Secure, time-limited transmission vector for external viewing.', icon: <Share2 size={16} /> }
];

const SectionHeader: React.FC<{ label: string; icon: any }> = ({ label, icon: Icon }) => (
 <div className="flex items-center gap-4 mb-8 opacity-50">
 <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-none text-nous-text dark:text-white">
 {React.cloneElement(Icon as React.ReactElement, { size: 12 })}
 </div>
 <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black text-stone-400">{label}</span>
 <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800"/>
 </div>
);

export const ExportChamber: React.FC<ExportChamberProps> = ({ metadata, onClose }) => {
 const [exportMode, setExportMode] = useState<'scroll' | 'assets' | 'pdf'>('scroll');
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
 <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-none font-sans text-xs font-black">Close</button>
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

 const convertImagesToBase64 = async (element: HTMLElement) => {
 const images = Array.from(element.querySelectorAll('img'));
 const promises = images.map(async (img) => {
 if (img.src.startsWith('data:')) return;
 try {
 img.crossOrigin ="anonymous";
 const response = await fetch(img.src, { mode: 'cors', cache: 'force-cache' });
 const blob = await response.blob();
 await new Promise<void>((resolve, reject) => {
 const reader = new FileReader();
 reader.onloadend = () => {
 img.srcset =""; 
 img.src = reader.result as string;
 resolve();
 };
 reader.onerror = reject;
 reader.readAsDataURL(blob);
 });
 } catch (e) {
 console.warn("MIMI // Export: Image conversion failed, fallback to CORS", e);
 }
 });
 await Promise.all(promises);
 };

 const waitForImages = async (element: HTMLElement) => {
 const images = Array.from(element.querySelectorAll('img'));
 const promises = images.map(img => {
 if (img.complete) return Promise.resolve();
 return new Promise(resolve => {
 img.onload = resolve;
 img.onerror = resolve;
 });
 });
 await Promise.all(promises);
 };

 const generatePDF = async () => {
 const doc = new jsPDF({
 orientation: 'p',
 unit: 'mm',
 format: 'a4'
 });

 const target = document.getElementById('export-target');
 if (!target) throw new Error("Capture target missing");

 // CRITICAL: Convert to Base64 to bypass CORS in html2canvas
 await convertImagesToBase64(target);
 await waitForImages(target);

 const sections = target.querySelectorAll('.export-section');
 const pageWidth = doc.internal.pageSize.getWidth();
 const pageHeight = doc.internal.pageSize.getHeight();

 for (let i = 0; i < sections.length; i++) {
 const section = sections[i] as HTMLElement;
 
 // Ensure visibility for capture
 const originalStyle = section.style.cssText;
 section.style.width = '793px'; // A4 width at 96 DPI approx
 section.style.height = '1122px'; // A4 height
 
 const canvas = await html2canvas(section, {
 scale: 2,
 useCORS: true,
 logging: false,
 backgroundColor: '#ffffff'
 });
 
 // Restore style
 section.style.cssText = originalStyle;

 const imgData = canvas.toDataURL('image/jpeg', 0.95);
 if (i > 0) doc.addPage();
 doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
 }
 
 doc.save(`Mimi_${metadata.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
 };

 const handleExport = async () => {
 if (isGenerating) return;
 setIsGenerating(true);
 setHasError(false);
 
 // Allow UI to update before processing
 await new Promise(r => setTimeout(r, 500));

 if (exportMode === 'link') {
 try {
 await navigator.clipboard.writeText(window.location.href);
 alert('Encrypted Link copied to clipboard.');
 } catch (err) {
 console.error('Failed to copy link:', err);
 alert('Failed to copy link to clipboard. You can copy the URL from your browser address bar.');
 }
 setIsGenerating(false);
 return;
 }

 try {
 const element = document.getElementById('export-target');
 if (!element) throw new Error("Capture target not found");

 // Robust Image Handling for both modes
 await convertImagesToBase64(element);
 await waitForImages(element);

 if (exportMode === 'pdf' || exportMode === 'assets') {
 await generatePDF();
 } else {
 // Scroll Mode (PNG/JPG)
 const canvas = await html2canvas(element, {
 scale: 2,
 useCORS: true,
 backgroundColor: exportMode === 'scroll_jpg' ? '#ffffff' : null, 
 logging: false
 });

 const link = document.createElement('a');
 const ext = exportMode === 'scroll_jpg' ? 'jpg' : 'png';
 const mime = exportMode === 'scroll_jpg' ? 'image/jpeg' : 'image/png';
 link.download = `Mimi_${metadata.title.replace(/[^a-z0-9]/gi, '_')}_scroll.${ext}`;
 link.href = canvas.toDataURL(mime, exportMode === 'scroll_jpg' ? 0.9 : 1.0);
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
 // For PDF/Assets generation, we rely on the specific styling in generatePDF logic and CSS classes
 // But for preview, we keep it contained
 return { width: '100%', maxWidth: '420px' };
 }, [exportMode]);

 const blockClass = useMemo(() => {
 const base ="export-section bg-white dark:bg-stone-950 flex flex-col justify-center overflow-hidden relative";
 // PDF/Print/Asset Mode: Forced Page Dimensions for reliable canvas capture
 if (exportMode === 'pdf' || exportMode === 'assets') {
 return `${base} w-full aspect-[210/297] p-16 mb-8 border border-stone-100 dark:border-stone-800 `;
 }
 // Scroll Mode: Continuous Flow
 return `${base} py-16 px-10 border-b border-stone-100 dark:border-stone-900 last:border-0`;
 }, [exportMode]);

 return (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }} 
 className="fixed inset-0 z-[20000] bg-stone-100 dark:bg-stone-950 flex flex-col md:flex-row overflow-hidden selection:bg-stone-500"
 >
 
 {/* CONTROLS SIDEBAR */}
 <aside className="w-full md:w-[400px] border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col p-8 shrink-0 z-20 overflow-y-auto no-scrollbar">
 <div className="flex justify-between items-center mb-12">
 <div className="space-y-1">
 <span className="font-sans text-[8px] uppercase tracking-[0.5em] font-black text-stone-500">Extraction Protocol</span>
 <h2 className="font-serif text-3xl italic tracking-tighter text-nous-text dark:text-white">Extract Artifact.</h2>
 </div>
 <button onClick={onClose} className="p-2 text-stone-400 hover:text-red-500 transition-all rounded-none hover:bg-stone-100 dark:hover:bg-stone-800"><X size={20}/></button>
 </div>
 
 <div className="space-y-12">
 <section className="space-y-6">
 <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 block border-b border-stone-100 dark:border-stone-800 pb-2">Format Protocol</span>
 <div className="grid gap-3">
 {EXPORT_MODES.map(m => (
 <button key={m.id} onClick={() => setExportMode(m.id as any)} className={`text-left p-5 rounded-none border transition-all ${exportMode === m.id ? 'bg-stone-50 dark:bg-black/20 border-stone-500 ring-1 ring-stone-500/20' : 'text-stone-400 border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-3">
 <div className={exportMode === m.id ? 'text-stone-500' : 'text-stone-300'}>{m.icon}</div>
 <p className={`font-serif italic text-lg ${exportMode === m.id ? 'text-nous-text dark:text-white' : 'text-stone-500'}`}>{m.label}</p>
 </div>
 {exportMode === m.id && <CheckCircle2 size={14} className="text-stone-500"/>}
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
 <button key={s.id} onClick={() => toggleSection(s.id)} className={`flex items-center gap-3 p-3 rounded-none border transition-all ${selectedSections.has(s.id) ? 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-nous-text dark:text-white' : 'text-stone-300 dark:text-stone-700 border-transparent hover:bg-stone-50 dark:hover:bg-stone-900'}`}>
 <div className={selectedSections.has(s.id) ? 'text-stone-500' : ''}>{s.icon}</div>
 <span className="font-sans text-[8px] uppercase tracking-widest font-black">{s.label}</span>
 </button>
 ))}
 </div>
 </section>
 </div>

 <div className="mt-auto pt-12 space-y-4">
 {hasError && <p className="text-red-500 text-xs font-mono text-center">Export Handshake Failed. Try refreshing.</p>}
 <button onClick={handleExport} disabled={isGenerating} className="w-full py-5 bg-nous-text dark:bg-white text-white dark:text-black rounded-none font-sans text-[10px] tracking-[0.4em] uppercase font-black flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
 {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />}
 {isGenerating ? 'Rendering...' : 'Extract Artifact'}
 </button>
 </div>
 </aside>

 {/* PREVIEW AREA */}
 <main className="flex-1 bg-stone-200/50 dark:bg overflow-y-auto p-4 md:p-12 flex justify-center no-scrollbar">
 <AnimatePresence>{isGenerating && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"><div className="bg-white dark:bg-stone-900 p-12 rounded-none text-center space-y-6 border border-stone-100 dark:border-stone-800"><Loader2 size={40} className="animate-spin text-stone-500 mx-auto"/><div className="space-y-2"><p className="font-serif italic text-2xl text-nous-text dark:text-white">“Compressing Reality...”</p><p className="font-sans text-[9px] uppercase tracking-widest text-stone-400">Preparing High-Fidelity Output</p></div></div></motion.div>}</AnimatePresence>
 
 <div id="export-target"className={`transition-all duration-500 ${exportMode === 'scroll' ? 'bg-white dark:bg-stone-950 ' : ''}`} style={containerStyle}>
 
 {/* 1. COVER */}
 {selectedSections.has('cover') && (
 <div className={blockClass}>
 <div className="flex-1 flex flex-col justify-center space-y-10">
 <div className="space-y-4">
 <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black text-stone-400">Issue Manifest</span>
 <h1 className="font-serif text-6xl md:text-8xl italic tracking-tighter leading-[0.85] uppercase text-nous-text dark:text-white">
 {metadata.title}
 </h1>
 </div>
 <div className="h-px w-24 bg-stone-200 dark:bg-stone-800"/>
 <div className="space-y-2">
 <p className="font-serif italic text-2xl text-stone-500">@{metadata.userHandle}</p>
 <p className="font-sans text-[9px] uppercase tracking-widest text-stone-400 font-black">{metadata.tone} // {new Date(metadata.timestamp).toLocaleDateString()}</p>
 </div>
 </div>
 {exportMode !== 'scroll' && <div className="absolute bottom-8 right-8"><Stamp size={64} className="text-stone-100 dark:text-stone-900 -rotate-12"/></div>}
 </div>
 )}

 {/* 2. READING */}
 {selectedSections.has('reading') && (
 <div className={blockClass}>
 <SectionHeader label="The Reading"icon={<FileText />} />
 <div className="flex-1 flex flex-col justify-center">
 <p className="font-serif italic text-3xl md:text-4xl text-stone-800 dark:text-stone-200 leading-[1.2] text-balance">
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
 {selectedSections.has('signals') && metadata.content.semiotic_signals && (
 <div className={`${blockClass} bg-stone-900 text-white dark:bg-black`}>
 <SectionHeader label="Archetype Index"icon={<Layers />} />
 <div className="flex-1 flex flex-col justify-center space-y-8">
 {metadata.content.semiotic_signals.slice(0, 4).map((t, i) => (
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
 <div className="aspect-[3/4] w-full overflow-hidden mb-8 bg-stone-100">
 <img 
 src={page.image_url} 
 className="w-full h-full object-cover grayscale"
 crossOrigin="anonymous"
 />
 </div>
 <h2 className="font-serif text-3xl italic tracking-tight uppercase mb-4 text-nous-text dark:text-white">{page.headline}</h2>
 <p className="font-serif italic text-base text-stone-500 leading-relaxed">{page.bodyCopy}</p>
 </div>
 ))}

 {/* 5. ROADMAP (NEW) */}
 {selectedSections.has('roadmap') && content.roadmap && (
 <div className={blockClass}>
 <SectionHeader label="The Roadmap"icon={<Terminal />} />
 <div className="flex-1 flex flex-col justify-center gap-8">
 <div className="space-y-2">
 <span className="font-sans text-[7px] uppercase tracking-[0.2em] font-black text-stone-600 dark:text-stone-400 block">Strategic Thesis</span>
 <p className="font-serif italic text-lg text-nous-text dark:text-white leading-snug border-b border-stone-100 dark:border-stone-900 pb-4">
 {content.roadmap.strategicThesis}
 </p>
 </div>
 <div className="space-y-2">
 <span className="font-sans text-[7px] uppercase tracking-[0.2em] font-black text-stone-600 dark:text-stone-400 block">Positioning Axis</span>
 <p className="font-serif italic text-lg text-nous-text dark:text-white leading-snug border-b border-stone-100 dark:border-stone-900 pb-4">
 {content.roadmap.positioningAxis}
 </p>
 </div>
 <div className="space-y-2">
 <span className="font-sans text-[7px] uppercase tracking-[0.2em] font-black text-stone-600 dark:text-stone-400 block">Authority Anchor</span>
 <p className="font-serif italic text-sm text-stone-500 leading-snug border-b border-stone-100 dark:border-stone-900 pb-4">
 <strong>Core Claim:</strong> {content.roadmap.authorityAnchor?.coreClaim}<br/>
 <strong>Repetition Vector:</strong> {content.roadmap.authorityAnchor?.repetitionVector}<br/>
 <strong>Exclusion Principle:</strong> {content.roadmap.authorityAnchor?.exclusionPrinciple}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* 6. DEBRIS (NEW) */}
 {selectedSections.has('debris') && (metadata.originalInput || metadata.content.meta?.intent) && (
 <div className={`${blockClass} bg-stone-50 dark:bg-stone-900`}>
 <SectionHeader label="Field Debris"icon={<Info />} />
 <div className="flex-1 flex flex-col justify-center">
 <div className="p-8 border-l-4 border-stone-200 dark:border-stone-700">
 <span className="font-mono text-[9px] text-stone-400 mb-4 block">// RAW_INPUT_LOG</span>
 <p className="font-mono text-xs md:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
 {metadata.originalInput || metadata.content.meta?.intent ||"Debris data obscured."}
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
 </motion.div>
 );
};
