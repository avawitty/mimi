
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PocketItem, ZineMetadata, TasteAuditReport, TrendSynthesisReport, ColorShard, InvestmentReport } from '../types';
import { fetchPocketItems, deleteFromPocket, updatePocketItem, createMoodboard } from '../services/firebase';
import { getLocalPocket } from '../services/localArchive';
import { useUser } from '../contexts/UserContext';
import { searchGrounding } from '../services/searchService';
import { analyzeCollectionIntent, scryTrendSynthesis, generateInvestmentStrategy, compressImage, applyAestheticRefraction, analyzeImageAesthetic, analyzeAestheticDelta } from '../services/geminiService';
import { Loader2, Trash2, Sparkles, RefreshCw, X, CheckCircle2, Filter, Search, Link as LinkIcon, Anchor, Info, Compass, ShieldCheck, Target, ChevronRight, Binary, Orbit, Zap, Activity, Fingerprint, Waves, Play, Pause, Volume2, Shield, Plus, Layers, PenTool, Layout, Save, Wand2, Pencil, FolderPlus, FolderOpen, ArrowLeft, Copy, Check, Send, Radio, Briefcase, Eye, EyeOff, Globe2, Radar, ExternalLink, ImageIcon, Wallet, ScrollText, DollarSign, PieChart, Coins, AlertTriangle, LayoutGrid, Upload, FileText, Share2, Wand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeltaVerdictCard } from './DeltaVerdictCard';

// --- SUB-COMPONENTS ---

const SonicShardPlayer: React.FC<{ url: string }> = ({ url }) => {
 const [isPlaying, setIsPlaying] = useState(false);
 const audioRef = useRef<HTMLAudioElement>(null);
 
 useEffect(() => {
 return () => {
 if (audioRef.current) {
 audioRef.current.pause();
 audioRef.current.src ="";
 }
 };
 }, []);

 const togglePlay = (e: React.MouseEvent) => {
 e.stopPropagation();
 if (!audioRef.current) return;
 
 if (isPlaying) {
 audioRef.current.pause();
 setIsPlaying(false);
 } else {
 const playPromise = audioRef.current.play();
 if (playPromise !== undefined) {
 playPromise
 .then(() => {
 setIsPlaying(true);
 })
 .catch(error => {
 console.warn("MIMI // Playback prevented or interrupted:", error);
 setIsPlaying(false);
 });
 }
 }
 };

 return (
 <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-nous-base gap-6 text-center group">
 <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden"/>
 <div className="relative">
 <div className={`absolute inset-0 bg-nous-base0/20 blur-xl rounded-none transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
 <button onClick={togglePlay} className="relative z-10 p-5 bg-white rounded-none hover:scale-110 active:scale-95 transition-all text-nous-text0">
 {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1"/>}
 </button>
 </div>
 <div className="space-y-1">
 <Waves size={32} className={`text-nous-text0/40 mx-auto ${isPlaying ? 'animate-pulse' : ''}`} />
 <span className="font-sans text-[7px] uppercase tracking-widest font-black text-nous-subtle">Sonic Refraction</span>
 </div>
 </div>
 );
};

const ColorStory: React.FC<{ colors: ColorShard[] }> = ({ colors = [] }) => (
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 {colors?.map((c, i) => (
 <div key={i} className="space-y-3">
 <div className="aspect-square rounded-none border border-black/5 /10"style={{ backgroundColor: c.hex }} />
 <div className="space-y-1">
 <span className="font-mono text-[9px] uppercase font-black text-nous-text ">{c.name}</span>
 <p className="font-serif italic text-[10px] text-nous-subtle leading-tight">{c.descriptor}</p>
 </div>
 </div>
 ))}
 </div>
);

const FinancialBriefOverlay: React.FC<{ report: InvestmentReport; onClose: () => void }> = ({ report, onClose }) => (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[6000] bg-nous-base/95 backdrop-blur-xl flex items-center justify-center p-6 md:p-12 overflow-y-auto">
 <div className="w-full max-w-4xl bg border border-nous-border rounded-none overflow-hidden flex flex-col max-h-[90vh]">
 <header className="flex justify-between items-center p-8 border-b border-nous-border bg-black/50 shrink-0">
 <div className="flex items-center gap-4 text-nous-text0">
 <Wallet size={20} />
 <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">The Strategist // Fiscal Audit</span>
 </div>
 <button onClick={onClose} className="p-2 text-nous-text0 hover:text-nous-text"><X size={20} /></button>
 </header>
 
 <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
 <section className="space-y-6">
 <div className="flex justify-between items-start">
 <span className="font-sans text-[9px] uppercase tracking-widest font-black text-nous-text0">Executive Thesis</span>
 <div className="flex items-center gap-2 px-3 py-1 bg-nous-base0/10 border border-nous-border/20 rounded-none">
 <Activity size={12} className="text-nous-text0"/>
 <span className="font-mono text-[9px] text-nous-subtle font-bold">IMPACT: {report.capsule_impact_score}/100</span>
 </div>
 </div>
 <h2 className="font-serif text-3xl md:text-4xl italic text-white leading-tight">{report.thesis}</h2>
 {report.tailor_alignment_note && (
 <p className="font-serif italic text-sm text-nous-subtle border-l-2 border-nous-border pl-4">{report.tailor_alignment_note}</p>
 )}
 </section>

 <section className="space-y-8">
 <span className="font-sans text-[9px] uppercase tracking-widest font-black text-nous-text0 border-b border-nous-border pb-2 block">Capital Allocation Roadmap</span>
 <div className="grid gap-4">
 {report.capital_allocation.map((item, i) => (
 <div key={i} className="p-6 bg-nous-base/50 border border-nous-border rounded-none flex flex-col md:flex-row gap-6">
 <div className="md:w-1/4 space-y-2 shrink-0">
 <span className={`font-sans text-[8px] uppercase tracking-widest font-black px-2 py-1 rounded-none ${item.category === 'KEYSTONE ASSET' ? 'bg-nous-base0 text-black' : item.category === 'VANITY METRIC' ? 'bg-red-500/20 text-red-400' : 'bg-nous-base text-nous-subtle'}`}>
 {item.category}
 </span>
 <p className="font-mono text-[9px] text-nous-text0 pt-2">{item.fiscal_route}</p>
 </div>
 <div className="flex-1 space-y-3">
 <div className="flex flex-wrap gap-2">
 {item.items.map((prod, j) => (
 <span key={j} className="font-serif italic text-lg text-white border-b border-nous-border">{prod}</span>
 ))}
 </div>
 <p className="font-serif text-sm text-nous-subtle leading-relaxed">{item.reasoning}</p>
 </div>
 </div>
 ))}
 </div>
 </section>

 {report.missing_infrastructure && (
 <section className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-none space-y-2">
 <span className="font-sans text-[9px] uppercase tracking-widest font-black text-amber-500 flex items-center gap-2"><AlertTriangle size={12} /> Missing Infrastructure</span>
 <p className="font-serif italic text-nous-subtle">{report.missing_infrastructure}</p>
 </section>
 )}
 </div>
 </div>
 </motion.div>
);

const ShardDetailView: React.FC<{ item: PocketItem; onClose: () => void; onUpdate: (id: string, updates: any) => void; onAcquire?: (item: PocketItem) => void }> = ({ item, onClose, onUpdate, onAcquire }) => {
 const [notes, setNotes] = useState(item.notes || '');
 const [title, setTitle] = useState(item.content.title || item.content.prompt || item.content.name || '');
 const [description, setDescription] = useState(item.content.description || '');
 const [price, setPrice] = useState(item.content.price || '');
 const [isEditing, setIsEditing] = useState(false);
 const [isRefracting, setIsRefracting] = useState(false);
 const { profile } = useUser();
 
 const handleSave = async () => {
 const updates = { 
 notes, 
 content: { 
 ...item.content, 
 title, 
 description, 
 price 
 } 
 };
 await updatePocketItem(item.userId, item.id, updates);
 onUpdate(item.id, updates);
 setIsEditing(false);
 };

 const handleShare = async () => {
 const shareData = {
 title: title || 'Mimi Shard',
 text: description || notes || 'Check out this aesthetic shard from Mimi.',
 url: item.content.imageUrl || window.location.href
 };
 
 try {
 if (navigator.share) {
 await navigator.share(shareData);
 } else {
 await navigator.clipboard.writeText(shareData.url);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Link copied to clipboard.", type: 'success' } }));
 }
 } catch (err) {
 console.error("Share failed", err);
 }
 };

 const handleRefract = async () => {
 const stylePrompt = prompt("Enter an aesthetic style or directive for refraction (e.g., '90s Cyberpunk', 'Minimalist Editorial', 'Surrealist Oil Painting'):");
 if (!stylePrompt) return;

 setIsRefracting(true);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Refracting Aesthetic Frequency...", icon: <Sparkles size={14} className="animate-pulse"/> } }));

 try {
 const refractedUrl = await applyAestheticRefraction(item.content.imageUrl, stylePrompt, profile);
 const updates = {
 content: {
 ...item.content,
 imageUrl: refractedUrl,
 originalUrl: item.content.imageUrl,
 refractionStyle: stylePrompt
 }
 };
 await updatePocketItem(item.userId, item.id, updates);
 onUpdate(item.id, updates);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Aesthetic Refraction Complete.", type: 'success' } }));
 } catch (err) {
 console.error("Refraction failed", err);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Refraction Failed.", type: 'error' } }));
 } finally {
 setIsRefracting(false);
 }
 };

 return (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9000] bg-white flex flex-col md:flex-row overflow-hidden">
 <button onClick={onClose} className="absolute top-8 right-8 z-50 p-4 bg-black/10 /10 rounded-none hover:bg-red-500 hover:text-nous-text transition-all">
 <X size={24} />
 </button>
 
 {/* VISUAL SIDE */}
 <div className="flex-1 bg-nous-base flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
 <div className="absolute inset-0 opacity-20 pointer-events-none">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-400/20 via-transparent to-transparent"/>
 </div>
 <div className="relative z-10 max-w-full max-h-full">
 {item.type === 'image' && (
 <div className="relative group space-y-8">
 <img src={item.content.imageUrl} className="max-w-full max-h-[60vh] object-contain"/>
 
 {/* Expanded Metadata */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {item.agentEnrichment && (
 <div className="p-6 bg-nous-base /50 rounded-none border border-nous-border space-y-4">
 <div className="flex items-center gap-2">
 <Fingerprint size={14} className="text-nous-text0"/>
 <span className="font-sans text-[9px] uppercase tracking-widest font-black text-nous-subtle">Agent Enrichment</span>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <span className="block font-mono text-[7px] text-nous-subtle uppercase tracking-widest">Detected Era</span>
 <span className="font-serif italic text-sm text-nous-text text-nous-text">{item.agentEnrichment.detectedEra || 'Unknown'}</span>
 </div>
 <div>
 <span className="block font-mono text-[7px] text-nous-subtle uppercase tracking-widest">Cultural Ref</span>
 <span className="font-serif italic text-sm text-nous-text text-nous-text">{item.agentEnrichment.culturalReference || 'N/A'}</span>
 </div>
 </div>
 </div>
 )}

 {item.content.semiotic_touchpoints && (
 <div className="p-6 bg-nous-base /50 rounded-none border border-nous-border space-y-4">
 <div className="flex items-center gap-2">
 <Zap size={14} className="text-indigo-500"/>
 <span className="font-sans text-[9px] uppercase tracking-widest font-black text-nous-subtle">Semiotic Signals</span>
 </div>
 <div className="flex flex-wrap gap-2">
 {item.content.semiotic_touchpoints.map((pt: string, i: number) => (
 <span key={i} className="px-2 py-1 bg-white text-nous-text0 font-mono text-[8px] rounded-none border border-nous-border">
 {pt}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 {item.type === 'zine_card' && (
 <div className="w-full max-w-2xl bg-white p-6 md:p-12 space-y-8 overflow-y-auto max-h-[80vh] border border-nous-border">
 <div className="space-y-2 border-b border-nous-border pb-6">
 <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-nous-text0 font-black">Zine Inspection</span>
 <h2 className="font-serif text-4xl italic text-nous-text text-nous-text">{item.content.title}</h2>
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 {[
 item.content.imageUrl,
 ...(item.content.analysis?.pages?.map(p => p.imageUrl) || []),
 ...(item.content.analysis?.visual_shards?.map(s => s.imageUrl) || [])
 ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map((url, i) => (
 <div key={i} className="group relative aspect-square bg-nous-base rounded-none overflow-hidden border border-nous-border">
 <img src={url} className="w-full h-full object-cover transition-all"/>
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
 <button 
 onClick={async () => {
 try {
 let deltaVerdict = undefined;
 if (profile?.tasteProfile?.aestheticSignature) {
 try {
 // For URL images, we'd need to fetch and convert to base64, but for now we'll skip delta for extracted zine images unless we have the base64
 // Or we can just pass the URL if analyzeImageAesthetic supports it (it expects base64).
 // We will skip delta for zine extraction for now to keep it fast, or we can fetch it.
 // Let's just do a basic add.
 } catch (e) {
 console.error(e);
 }
 }
 const { archiveManager } = await import('../services/archiveManager');
 await archiveManager.saveToPocket(item.userId, 'image', {
 imageUrl: url,
 prompt: `Extracted from: ${item.content.title}`,
 timestamp: Date.now(),
 origin: 'Zine_Extraction'
 });
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Shard Injected to Pocket.", icon: <CheckCircle2 size={14} /> } }));
 window.dispatchEvent(new CustomEvent('mimi:pocket_updated'));
 } catch (error) {
 console.error("MIMI // Failed to inject shard:", error);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Failed to inject shard.", type: 'error' } }));
 }
 }}
 className="w-full py-2 bg-nous-base0 text-white font-sans text-[8px] uppercase tracking-widest font-black rounded-none hover:scale-105 active:scale-95 transition-all"
 >
 Inject Shard
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 {(item.type === 'voicenote' || item.type === 'audio') && <SonicShardPlayer url={item.content.audioUrl} />}
 {item.type === 'analysis_report' && (
 <div className="w-full max-w-2xl bg-nous-text text-nous-base p-6 md:p-12 space-y-8 overflow-y-auto max-h-[80vh]">
 <div className="space-y-2 border-b border-white/10 pb-6">
 <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-nous-text0 font-black">The Lens Analysis</span>
 <h2 className="font-serif text-4xl italic">{item.content.title}</h2>
 </div>
 
 <div className="space-y-4">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle">Director's Note</span>
 <p className="font-serif italic text-lg text-nous-subtle leading-relaxed border-l-2 border-nous-border/30 pl-4">
"{item.content.content?.directors_note}"
 </p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 bg-black/40 rounded-none">
 <span className="block font-mono text-[8px] text-nous-subtle mb-2">LIGHTING</span>
 <span className="font-serif italic text-sm text-white">{item.content.content?.lighting_analysis}</span>
 </div>
 <div className="p-4 bg-black/40 rounded-none">
 <span className="block font-mono text-[8px] text-nous-subtle mb-2">CULTURE</span>
 <span className="font-serif italic text-sm text-white">{item.content.content?.cultural_parallel}</span>
 </div>
 </div>

 {item.content.content?.creative_potential && (
 <div className="space-y-4">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle">Creative Potential</span>
 <p className="font-serif italic text-sm text-nous-subtle leading-relaxed border-l-2 border-indigo-500/30 pl-4">
 {item.content.content.creative_potential}
 </p>
 </div>
 )}

 {item.content.content?.semiotic_touchpoints && (
 <div className="space-y-4">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle">Semiotic Touchpoints</span>
 <div className="flex flex-wrap gap-2">
 {item.content.content.semiotic_touchpoints.map((pt: string, i: number) => (
 <span key={i} className="px-3 py-1.5 bg-black/40 text-nous-subtle font-mono text-[9px] rounded-none border border-white/5">
 {pt}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 
 {/* DATA SIDE */}
 <div className="w-full md:w-[450px] bg-white border-l border-nous-border p-6 md:p-12 flex flex-col gap-12 overflow-y-auto">
 <div className="space-y-8">
 <div className="flex justify-between items-center border-b border-nous-border pb-2">
 <span className="font-sans text-[10px] uppercase tracking-[0.5em] text-nous-subtle font-black italic">Shard Metadata</span>
 {!isEditing ? (
 <button onClick={() => setIsEditing(true)} className="text-nous-subtle hover:text-nous-text hover:text-nous-text"><Pencil size={14} /></button>
 ) : (
 <button onClick={handleSave} className="text-nous-text0 hover:text-nous-subtle"><Check size={14} /></button>
 )}
 </div>
 
 {isEditing ? (
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black">Title</label>
 <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-nous-base p-3 font-serif italic text-xl focus:outline-none rounded-none border-b border-nous-border"placeholder="Shard Title..."/>
 </div>
 <div className="space-y-2">
 <label className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black">Description</label>
 <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 bg-nous-base p-3 font-serif italic text-sm focus:outline-none rounded-none border-b border-nous-border"placeholder="Aesthetic description..."/>
 </div>
 <div className="space-y-2">
 <label className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black">Price / Valuation</label>
 <input value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-nous-base p-3 font-mono text-sm focus:outline-none rounded-none border-b border-nous-border"placeholder="$0.00"/>
 </div>
 </div>
 ) : (
 <div className="space-y-4">
 <h2 className="font-serif text-4xl italic text-nous-text text-nous-text leading-tight">{title || 'Untitled Fragment'}</h2>
 {description && <p className="font-serif text-sm text-nous-text0 italic leading-relaxed">{description}</p>}
 {price && (
 <div className="flex items-center gap-2 text-nous-text0 font-mono text-sm bg-nous-base0/5 px-3 py-2 rounded-none w-fit border border-nous-border/10">
 <DollarSign size={14} />
 <span className="font-black">{price}</span>
 </div>
 )}
 </div>
 )}
 </div>

 <div className="space-y-6">
 <div className="flex justify-between items-center border-b border-nous-border pb-2">
 <span className="font-sans text-[9px] uppercase tracking-widest font-black text-nous-subtle">Interior Notes</span>
 </div>
 {item.deltaVerdict && (
 <div className="mb-4">
 <DeltaVerdictCard verdict={item.deltaVerdict} />
 </div>
 )}
 {isEditing ? (
 <textarea 
 value={notes} 
 onChange={e => setNotes(e.target.value)}
 className="w-full h-48 bg-nous-base p-4 font-serif italic text-lg focus:outline-none rounded-none border-b border-nous-border"
 placeholder="Record your perception..."
 />
 ) : (
 <p className="font-serif italic text-xl text-nous-subtle leading-relaxed">
 {notes ||"No interior reflections recorded for this shard."}
 </p>
 )}
 </div>

 <div className="mt-auto space-y-4">
 <button 
 onClick={() => {
 if (onAcquire) onAcquire(item);
 else {
 // Fallback to financial analysis if no onAcquire passed
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Initiating Fiscal Audit...", icon: <Wallet size={14} /> } }));
 // This assumes the parent Pocket component will handle the actual logic via some event or shared state
 // But better to just ensure onAcquire is passed.
 }
 }}
 className="w-full py-4 bg-nous-base  text-nous-base rounded-none font-sans text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
 >
 <Target size={14} /> Acquire Data
 </button>
 <div className="grid grid-cols-2 gap-4">
 <button 
 onClick={handleShare}
 className="py-4 border border-nous-border rounded-none font-sans text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 hover:bg-nous-base transition-colors"
 >
 <Share2 size={14} /> Share Shard
 </button>
 {item.type === 'image' && (
 <button 
 onClick={handleRefract}
 disabled={isRefracting}
 className="py-4 border border-nous-border rounded-none font-sans text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 hover:bg-nous-base transition-colors disabled:opacity-50"
 >
 {isRefracting ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14} />} Refract Style
 </button>
 )}
 </div>
 <button className="w-full py-4 border border-nous-border rounded-none font-sans text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 hover:bg-nous-base transition-colors">
 <Volume2 size={14} /> Voice Memo
 </button>
 </div>
 </div>
 </motion.div>
 );
};

// --- MAIN COMPONENT ---

export const Pocket: React.FC<{ onSelectZine: (zine: ZineMetadata) => void }> = ({ onSelectZine }) => {
 const { user, profile, systemStatus } = useUser();
 const [items, setItems] = useState<PocketItem[]>([]);
 const [loading, setLoading] = useState(true);
 
 // Selection & Mode State
 const [isSelectionMode, setIsSelectionMode] = useState(false);
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
 
 // Processing States
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [activeAgent, setActiveAgent] = useState<'curator' | 'strategist' | null>(null);
 
 // Active Views
 const [activeBoard, setActiveBoard] = useState<PocketItem | null>(null);
 const [activeAudit, setActiveAudit] = useState<TasteAuditReport | null>(null);
 const [activeInvestment, setActiveInvestment] = useState<InvestmentReport | null>(null);
 const [activeTrendReport, setActiveTrendReport] = useState<TrendSynthesisReport | null>(null);
 
 // Modals
 const [showInjectModal, setShowInjectModal] = useState(false);
 const [showFolderModal, setShowFolderModal] = useState(false);
 const [newFolderName, setNewFolderName] = useState('');
 const [activeShard, setActiveShard] = useState<PocketItem | null>(null);
 
 // Search State
 const [searchQuery, setSearchQuery] = useState('');
 const [isSearching, setIsSearching] = useState(false);
 const [searchSummary, setSearchSummary] = useState<string | null>(null);
 const [searchResults, setSearchResults] = useState<{ id: string; type: string; relevanceScore: number }[]>([]);
 
 const fileInputRef = useRef<HTMLInputElement>(null);

 const loadPocket = useCallback(async (silent = false) => {
 if (!silent) setLoading(true);
 try {
 const localData = await getLocalPocket() || [];
 let cloudData: PocketItem[] = [];
 if (user && !user.isAnonymous) cloudData = await fetchPocketItems(user.uid) || []; 
 const registry = new Map<string, PocketItem>();
 localData.forEach(item => { if (item && item.id) registry.set(item.id, item); });
 cloudData.forEach(item => { if (item && item.id) registry.set(item.id, item); });
 setItems(Array.from(registry.values()).sort((a,b) => b.savedAt - a.savedAt));
 } catch (e) {} finally { setLoading(false); }
 }, [user]);

 useEffect(() => {
 loadPocket();
 const handleShardAdded = (e: any) => {
 setItems(prev => [e.detail, ...prev]);
 };
 const handlePocketUpdate = () => loadPocket(true);
 window.addEventListener('mimi:shard_added', handleShardAdded);
 window.addEventListener('mimi:pocket_updated', handlePocketUpdate);
 return () => {
 window.removeEventListener('mimi:shard_added', handleShardAdded);
 window.removeEventListener('mimi:pocket_updated', handlePocketUpdate);
 };
 }, [loadPocket]);

 const filteredItems = useMemo(() => {
 if (searchQuery && searchResults.length > 0) {
 const resultIds = new Set(searchResults.map(r => r.id));
 return items.filter(i => resultIds.has(i.id));
 }
 
 if (activeBoard) return items.filter(i => activeBoard.content.itemIds?.includes(i.id));
 
 return items.filter(item => {
 // If we are at root, allow items that are NOT in a folder OR are folders themselves
 const isFolder = item.type === 'moodboard';
 if (isFolder) return true;
 
 const isInAnyFolder = items.some(mb => mb.type === 'moodboard' && mb.content.itemIds?.includes(item.id));
 return !isInAnyFolder;
 });
 }, [items, activeBoard, searchQuery, searchResults]);

 // --- ACTIONS ---

 const getSelection = () => {
 return isSelectionMode && selectedIds.size > 0 
 ? items.filter(i => selectedIds.has(i.id))
 : activeBoard ? items.filter(i => activeBoard.content.itemIds?.includes(i.id)) : [];
 };

 const handleDesignerAudit = async () => {
 const targetItems = getSelection();
 if (targetItems.length === 0) return;
 
 setIsAnalyzing(true);
 setActiveAgent('curator');
 
 try {
 const res = await analyzeCollectionIntent(targetItems, profile);
 setActiveAudit(res);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Curator Analysis Complete.", icon: <Briefcase size={14} /> } }));
 } catch (e) {
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Audit Failed.", type: 'error' } }));
 } finally { setIsAnalyzing(false); setActiveAgent(null); }
 };

 const handleBatchRefract = async () => {
 const targetItems = getSelection().filter(i => i.type === 'image');
 if (targetItems.length === 0) {
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"No images selected for refraction.", type: 'error' } }));
 return;
 }
 
 setIsSelectionMode(false);
 setSelectedIds(new Set());
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Batch Refraction Initiated...", icon: <Wand2 size={14} /> } }));
 
 for (const item of targetItems) {
 try {
 const stylePrompt = item.agentEnrichment?.culturalReference || 'avant-garde';
 const transformedUrl = await applyAestheticRefraction(item.content.imageUrl, stylePrompt, profile);
 
 const newItemContent = {
 imageUrl: transformedUrl,
 prompt: `Refracted: ${item.content.prompt || item.content.name || 'Untitled'}`,
 timestamp: Date.now(),
 origin: 'Batch_Refraction'
 };
 
 const { archiveManager } = await import('../services/archiveManager');
 const id = await archiveManager.saveToPocket(user?.uid || 'ghost', 'image', newItemContent);
 const fullItem: PocketItem = { id, userId: user?.uid || 'ghost', type: 'image', savedAt: Date.now(), content: newItemContent };
 window.dispatchEvent(new CustomEvent('mimi:shard_added', { detail: fullItem }));
 } catch (e) {
 console.error("Refraction failed for item", item.id, e);
 }
 }
 
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Batch Refraction Complete.", icon: <CheckCircle2 size={14} /> } }));
 await loadPocket(true);
 };

 const handleFinancialAnalysis = async (singleItem?: PocketItem) => {
 const targetItems = singleItem ? [singleItem] : getSelection();
 if (targetItems.length === 0) return;

 setIsAnalyzing(true);
 setActiveAgent('strategist');

 try {
 // Collect notes and metadata from all items to give context
 const collectiveContext = targetItems.map(i => {
 const p = i.content.price ? ` [Price/Valuation: ${i.content.price}]` : '';
 const d = i.content.description ? ` [Description: ${i.content.description}]` : '';
 return `${i.content.title || i.content.prompt || 'Untitled Fragment'}${p}${d}\nNotes: ${i.notes || 'None'}`;
 }).join('\n---\n');

 const res = await generateInvestmentStrategy(targetItems, collectiveContext, profile);
 setActiveInvestment(res);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Fiscal Strategy Generated.", icon: <Wallet size={14} /> } }));
 } catch (e) {
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Strategist Disconnected.", type: 'error' } }));
 } finally { setIsAnalyzing(false); setActiveAgent(null); }
 };

 const handleTrendSynthesis = async () => {
 const targetItems = getSelection();
 // Default to recent items if no selection
 const scope = targetItems.length > 0 ? targetItems : items.slice(0, 15);
 
 setIsAnalyzing(true);
 setActiveAgent('curator');
 try {
 const res = await scryTrendSynthesis(scope, profile);
 setActiveTrendReport(res);
 } catch (e) {
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Trend Scry Failed.", type: 'error' } }));
 } finally { setIsAnalyzing(false); setActiveAgent(null); }
 };

 const handleProposal = () => {
 const targetItems = getSelection();
 if (targetItems.length === 0) return;
 
 const folderData = {
 id: activeBoard?.id || 'temp_selection',
 name: activeBoard?.content.name || 'Custom Selection',
 items: targetItems,
 notes: targetItems.map(i => i.notes).join('\n')
 };

 window.dispatchEvent(new CustomEvent('mimi:change_view', { 
 detail: 'about', 
 detail_data: { folder: folderData } 
 }));
 };

 const handleCreateFolder = async () => {
 if (!newFolderName.trim()) return;
 window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'success' } }));
 try {
 await createMoodboard(user?.uid || 'ghost', newFolderName, Array.from(selectedIds));
 setNewFolderName(''); setShowFolderModal(false); setIsSelectionMode(false); setSelectedIds(new Set());
 await loadPocket(true);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Stack Created.", icon: <FolderPlus size={14} /> } }));
 } catch (e) { console.error(e); }
 };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (!files || files.length === 0) return;
 setLoading(true);
 try {
 for (const file of Array.from(files)) {
 const reader = new FileReader();
 const base64 = await new Promise<string>((resolve, reject) => {
 reader.onload = async (ev) => {
 try {
 const raw = ev.target?.result as string;
 const compressed = await compressImage(raw);
 resolve(compressed);
 } catch (err) {
 reject(err);
 }
 };
 reader.onerror = reject;
 reader.readAsDataURL(file);
 });
 const type = file.type.startsWith('audio') ? 'voicenote' : 'image';
 const newItem = {
 imageUrl: type === 'image' ? base64 : undefined,
 audioUrl: type === 'voicenote' ? base64 : undefined,
 prompt: file.name,
 timestamp: Date.now()
 };
 
 let deltaVerdict = undefined;
 if (type === 'image' && profile?.tasteProfile?.aestheticSignature) {
 try {
 const aesthetic = await analyzeImageAesthetic(base64, 'image/png', profile);
 if (aesthetic) {
 deltaVerdict = await analyzeAestheticDelta(profile.tasteProfile.aestheticSignature, aesthetic);
 }
 } catch (e) {
 console.error("Failed to analyze delta for new pocket item", e);
 }
 }

 const { archiveManager } = await import('../services/archiveManager');
 const id = await archiveManager.saveToPocket(user?.uid || 'ghost', type, newItem, undefined, undefined, deltaVerdict);
 const fullItem: PocketItem = { id, userId: user?.uid || 'ghost', type, savedAt: Date.now(), content: newItem, deltaVerdict };
 window.dispatchEvent(new CustomEvent('mimi:shard_added', { detail: fullItem }));
 }
 await loadPocket(true);
 } catch (err) { console.error(err); } finally { setLoading(false); }
 };

 const handleItemClick = (item: PocketItem) => {
 if (isSelectionMode) {
 setSelectedIds(prev => { const next = new Set(prev); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; });
 } else {
 if (item.type === 'moodboard') {
 setActiveBoard(item);
 } else if (item.type === 'zine_card' && item.content.analysis && onSelectZine) {
 onSelectZine({ id: item.content.zineId, title: item.content.title, content: item.content.analysis, tone: 'default', timestamp: item.timestamp, userHandle: 'Ghost' } as ZineMetadata);
 } else {
 setActiveShard(item);
 }
 }
 };

 const handleSearch = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!searchQuery.trim()) {
 setSearchResults([]);
 setSearchSummary(null);
 return;
 }

 setIsSearching(true);
 try {
 const { results, summary } = await searchGrounding(searchQuery);
 setSearchResults(results || []);
 setSearchSummary(summary || null);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Search Grounded.", icon: <Search size={14} /> } }));
 } catch (err) {
 console.error("Search failed", err);
 } finally {
 setIsSearching(false);
 }
 };

 const clearSearch = () => {
 setSearchQuery('');
 setSearchResults([]);
 setSearchSummary(null);
 };

 return (
 <div className="w-full h-full flex flex-col bg-nous-base transition-colors duration-1000 overflow-hidden relative">
 <AnimatePresence>
 {isAnalyzing && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-white/80 /80 backdrop-blur-xl flex flex-col items-center justify-center gap-8">
 <Loader2 size={48} className={`animate-spin ${activeAgent === 'strategist' ? 'text-nous-text0' : 'text-indigo-500'}`} />
 <div className="text-center space-y-2">
 <h3 className="font-serif text-3xl italic text-nous-text text-nous-text">
 {activeAgent === 'strategist' ?"Summoning The Strategist...":"Invoking The Curator..."}
 </h3>
 <p className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-nous-subtle">
 {activeAgent === 'strategist' ?"Calculating Fiscal Velocity":"Auditing Aesthetic Patterns"}
 </p>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 <header className="px-4 md:px-8 lg:px-12 py-4 border-b border-nous-border bg-white/50 /50 backdrop-blur-xl shrink-0">
 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
 
 <div className="flex-1"/>
 
 {/* Middle: Search Bar */}
 <form onSubmit={handleSearch} className="relative w-full md:max-w-sm group">
 <input 
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Search fragments..."
 className="w-full bg-nous-base border-none py-2 pl-10 pr-10 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-stone-500 transition-all rounded-none"
 />
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nous-subtle group-focus-within:text-nous-text0 transition-colors"/>
 {searchQuery && (
 <button type="button"onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-nous-subtle hover:text-red-500">
 <X size={14} />
 </button>
 )}
 </form>

 {/* Right: Actions */}
 <div className="flex items-center gap-4">
 <button 
 onClick={() => setShowInjectModal(true)}
 className="flex items-center gap-2 px-4 py-2 bg-nous-base0 text-white rounded-none font-sans text-[9px] uppercase tracking-widest font-black hover:bg-stone-600 transition-all"
 >
 <Plus size={12} /> Inject
 </button>
 <div className="flex items-center gap-2 px-3 py-1.5 bg-nous-base rounded-none border border-black/5">
 <Shield size={10} className={systemStatus.auth === 'anchored' ? 'text-nous-text0' : 'text-nous-subtle'} />
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle">
 {systemStatus.auth === 'anchored' ? 'SYNC' : 'LOCAL'}
 </span>
 </div>
 </div>
 </div>
 </header>

 <AnimatePresence>
 {showInjectModal && (
 <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-nous-base/90 backdrop-blur-xl">
 <div className="w-full max-w-md bg-white p-8 rounded-none space-y-8 border border-nous-border">
 <div className="flex justify-between items-center">
 <div className="space-y-1">
 <h3 className="font-serif text-2xl italic">Inject Shard.</h3>
 <p className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black">Material Ingestion Protocol</p>
 </div>
 <button onClick={() => setShowInjectModal(false)} className="p-2 text-nous-subtle hover:text-red-500 transition-colors"><X size={20}/></button>
 </div>
 <div className="grid gap-4">
 <button onClick={() => { fileInputRef.current?.click(); setShowInjectModal(false); }} className="w-full py-4 bg-nous-base hover:bg-nous-base0 hover:text-nous-text transition-all rounded-none font-sans text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 group">
 <Upload size={14} className="text-nous-subtle group-hover:text-nous-text"/> Upload Local File
 </button>
 <button onClick={() => { window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'archival' })); setShowInjectModal(false); }} className="w-full py-4 bg-nous-base hover:bg-nous-base0 hover:text-nous-text transition-all rounded-none font-sans text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 group">
 <FileText size={14} className="text-nous-subtle group-hover:text-nous-text"/> From Authored Registry
 </button>
 </div>
 </div>
 </div>
 )}
 </AnimatePresence>

 <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-8 lg:px-12 pt-12 pb-64">
 {/* SEARCH SUMMARY */}
 <AnimatePresence>
 {searchSummary && (
 <motion.div 
 initial={{ opacity: 0, height: 0 }} 
 animate={{ opacity: 1, height: 'auto' }} 
 exit={{ opacity: 0, height: 0 }}
 className="mb-12 p-6 bg-nous-base0/5 border border-nous-border/20 rounded-none overflow-hidden"
 >
 <div className="flex items-center gap-3 mb-4">
 <Sparkles size={16} className="text-nous-text0"/>
 <span className="font-sans text-[9px] uppercase tracking-widest font-black text-nous-subtle">AI Search Insight</span>
 </div>
 <p className="font-serif italic text-xl text-nous-subtle leading-relaxed">
 {searchSummary}
 </p>
 </motion.div>
 )}
 </AnimatePresence>

 {/* REPORT OVERLAYS */}
 <AnimatePresence>
 {activeTrendReport && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-24 p-10 md:p-20 bg-nous-text text-nous-base border border-nous-border/30 rounded-none relative overflow-hidden group">
 <div className="flex justify-between items-start mb-16">
 <div className="flex items-center gap-4 text-nous-text0">
 <Radar size={20} className="animate-pulse"/>
 <span className="font-sans text-[11px] uppercase tracking-[0.6em] font-black italic">Anti-WGSN Trend Synthesis</span>
 </div>
 <button onClick={() => setActiveTrendReport(null)} className="p-3 text-nous-subtle hover:text-nous-text transition-all"><X size={24} /></button>
 </div>
 <div className="grid md:grid-cols-12 gap-16 md:gap-24">
 <div className="md:col-span-7 space-y-12">
 <div className="space-y-4">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-nous-text0">Emerging Pattern Signals</span>
 <div className="space-y-4">
 {activeTrendReport.pattern_signals?.map((s, i) => (
 <div key={i} className="flex gap-6 items-start">
 <span className="font-mono text-[9px] text-nous-text0 pt-1.5">SIGNAL_{i+1}</span>
 <p className="font-serif italic text-2xl md:text-4xl text-nous-text">{s}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {activeAudit && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-24 p-10 md:p-20 bg-white border-2 border-nous-border/20 rounded-none relative overflow-hidden group">
 <div className="flex justify-between items-start mb-16">
 <div className="flex items-center gap-4 text-nous-text0">
 <Briefcase size={20} />
 <span className="font-sans text-[11px] uppercase tracking-[0.6em] font-black italic">Editorial Designer Brief</span>
 </div>
 <button onClick={() => setActiveAudit(null)} className="p-3 text-nous-subtle hover:text-red-500 transition-all"><X size={24} /></button>
 </div>
 <div className="grid md:grid-cols-12 gap-16 md:gap-24">
 <div className="md:col-span-7 space-y-12">
 <div className="space-y-4">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle">Conceptual Throughline</span>
 <h3 className="font-serif text-3xl md:text-6xl italic tracking-tighter leading-tight text-nous-text text-nous-text">{activeAudit.conceptualThroughline}</h3>
 </div>
 <div className="space-y-6 pt-8 border-t border-stone-50">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle">Color Story</span>
 <ColorStory colors={activeAudit.colorStory} />
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {activeInvestment && (
 <FinancialBriefOverlay report={activeInvestment} onClose={() => setActiveInvestment(null)} />
 )}
 </AnimatePresence>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
 {filteredItems?.map(item => (
 <motion.div key={item.id} layout onClick={() => handleItemClick(item)} className={`group relative bg-white border p-1 rounded-none flex flex-col transition-all cursor-pointer ${isSelectionMode && selectedIds.has(item.id) ? 'border-nous-border ring-2 ring-stone-500/20' : 'border-nous-border '}`}>
 <div className="relative aspect-[3/4] bg-nous-base overflow-hidden">
 {item.type === 'image' && <img src={item.content.thumbnailUrl || item.content.imageUrl} className="w-full h-full object-cover transition-all duration-[2s]"loading="lazy"/>}
 {item.type === 'analysis_report' && (
 <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-nous-text text-nous-base gap-4 text-center border border-nous-border/20">
 <Radar size={32} className="text-nous-text0 opacity-50"/>
 <h3 className="font-serif italic text-xl text-white line-clamp-2">{item.content.title}</h3>
 <span className="font-sans text-[6px] uppercase tracking-widest text-nous-text0 font-black">The Lens Analysis</span>
 </div>
 )}
 {item.type === 'moodboard' && (
 <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 bg-nous-base overflow-hidden group-hover:scale-105 transition-transform duration-700">
 {item.content.itemIds?.slice(0, 4).map((id, idx) => {
 const shard = items.find(i => i.id === id);
 return (
 <div key={idx} className="w-full h-full bg-nous-base overflow-hidden">
 {shard?.content?.imageUrl ? (
 <img src={shard.content.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center text-nous-subtle"><Layers size={12}/></div>
 )}
 </div>
 );
 })}
 {(!item.content.itemIds || item.content.itemIds.length === 0) && (
 <div className="col-span-2 row-span-2 flex flex-col items-center justify-center p-8 bg-nous-text text-nous-base gap-4 text-center">
 <FolderOpen size={32} className="text-nous-text0 opacity-30"/>
 <span className="font-sans text-[6px] uppercase tracking-widest text-nous-text0 font-black">Empty Stack</span>
 </div>
 )}
 <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
 <h3 className="font-serif italic text-xl text-white line-clamp-2 text-center drop-">{item.content.name}</h3>
 <span className="font-sans text-[6px] uppercase tracking-widest text-nous-subtle font-black mt-2">{item.content.itemIds?.length || 0} Fragments</span>
 </div>
 </div>
 )}
 {(item.type === 'voicenote' || item.type === 'audio') && <SonicShardPlayer url={item.content.audioUrl} />}
 {item.type === 'zine_card' && (
 <div className="w-full h-full pointer-events-auto"onClick={(e) => { e.stopPropagation(); if(item.content.analysis && onSelectZine) onSelectZine({ id: item.content.zineId, title: item.content.title, content: item.content.analysis, tone: 'default', timestamp: item.timestamp, userHandle: 'Ghost' } as ZineMetadata); }}>
 <img src={item.content.imageUrl} className="w-full h-full object-cover transition-all duration-[2s]"/>
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <span className="font-sans text-[8px] uppercase tracking-widest text-white font-black">Absorb Zine</span>
 </div>
 </div>
 )}
 
 {/* SELECTION CHECKBOX */}
 {isSelectionMode && (
 <div className="absolute inset-0 bg-black/10 flex items-start justify-end p-3">
 <div className={`w-6 h-6 rounded-none border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id) ? 'bg-nous-base0 border-nous-border' : 'bg-white/20 border-white/60'}`}>
 {selectedIds.has(item.id) && <CheckCircle2 size={12} className="text-white"/>}
 </div>
 </div>
 )}
 </div>
 <div className="p-4 md:p-6">
 <h5 className="font-serif italic text-lg md:text-xl text-nous-text text-nous-text line-clamp-1">{item.content.prompt || item.content.name || item.content.title || 'Untitled'}</h5>
 </div>
 </motion.div>
 ))}
 </div>
 </div>

 {/* FOOTER TOOLBAR */}
 {createPortal(
 <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[4000] w-full max-w-2xl px-6">
 <AnimatePresence mode="wait">
 <motion.div 
 key="toolbar"
 initial={{ y: 20, opacity: 0 }} 
 animate={{ y: 0, opacity: 1 }} 
 exit={{ y: 20, opacity: 0 }}
 className="bg-nous-base/95 backdrop-blur-3xl p-3 rounded-none flex items-center justify-between border border-white/10 gap-2"
 >
 <div className="flex items-center gap-1">
 <button 
 onClick={() => setShowFolderModal(true)} 
 disabled={selectedIds.size === 0}
 className="flex flex-col items-center gap-1 px-4 py-2 rounded-none text-nous-subtle hover:text-nous-text hover:bg-white/5 transition-all disabled:opacity-30"
 >
 <FolderPlus size={18} />
 <span className="font-sans text-[7px] uppercase tracking-widest font-black">Stack</span>
 </button>
 <div className="w-px h-8 bg-white/10"/>
 <button 
 onClick={handleDesignerAudit}
 disabled={selectedIds.size === 0}
 className="flex flex-col items-center gap-1 px-4 py-2 rounded-none text-nous-subtle hover:text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-30"
 >
 <Briefcase size={18} />
 <span className="font-sans text-[7px] uppercase tracking-widest font-black">Audit</span>
 </button>
 <button 
 onClick={handleBatchRefract}
 disabled={selectedIds.size === 0}
 className="flex flex-col items-center gap-1 px-4 py-2 rounded-none text-nous-subtle hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-30"
 >
 <Wand2 size={18} />
 <span className="font-sans text-[7px] uppercase tracking-widest font-black">Refract</span>
 </button>
 <button 
 onClick={handleFinancialAnalysis}
 disabled={selectedIds.size === 0}
 className="flex flex-col items-center gap-1 px-4 py-2 rounded-none text-nous-subtle hover:text-nous-subtle hover:bg-nous-base0/10 transition-all disabled:opacity-30"
 >
 <Wallet size={18} />
 <span className="font-sans text-[7px] uppercase tracking-widest font-black">Acquire</span>
 </button>
 <button 
 onClick={async () => {
 const targetItems = getSelection();
 if (targetItems.length === 0) return;
 window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'shimmer' } }));
 try {
 const { collection, addDoc } = await import('firebase/firestore');
 const { db } = await import('../services/firebase');
 for (const item of targetItems) {
 if (item.type === 'image' || item.type === 'zine_card') {
 const transmission = {
 userId: user?.uid || 'ghost',
 userHandle: profile?.handle || 'Ghost',
 content: item.content.prompt || item.content.name || item.content.title || 'Untitled Fragment',
 imageUrl: item.content.imageUrl || '',
 timestamp: Date.now(),
 type: 'signal',
 likes: 0,
 zineData: item.type === 'zine_card' ? item.content.analysis : null
 };
 const cleanTransmission = JSON.parse(JSON.stringify(transmission));
 await addDoc(collection(db, 'public_transmissions'), cleanTransmission);
 }
 }
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Fragments Broadcasted.", icon: <Radio size={14} /> } }));
 setIsSelectionMode(false);
 setSelectedIds(new Set());
 } catch (e) {
 console.error(e);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message:"Broadcast Failed.", type: 'error' } }));
 }
 }}
 disabled={selectedIds.size === 0}
 className="flex flex-col items-center gap-1 px-4 py-2 rounded-none text-nous-subtle hover:text-nous-subtle hover:bg-nous-base0/10 transition-all disabled:opacity-30"
 >
 <Radio size={18} />
 <span className="font-sans text-[7px] uppercase tracking-widest font-black">Broadcast</span>
 </button>
 </div>
 <div className="flex items-center gap-4 px-4 border-l border-white/10">
 <span className="font-mono text-xs text-white hidden md:inline">{selectedIds.size} Selected</span>
 <button onClick={() => {
 if (selectedIds.size === filteredItems.length) {
 setSelectedIds(new Set());
 } else {
 setSelectedIds(new Set(filteredItems.map(i => i.id)));
 }
 }} className="font-sans text-[9px] uppercase tracking-widest font-black text-nous-subtle hover:text-nous-text transition-colors">
 {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
 </button>
 <button onClick={() => { setIsSelectionMode(!isSelectionMode); if(isSelectionMode) setSelectedIds(new Set()); }} className={`p-2 rounded-none transition-colors ${isSelectionMode ? 'bg-red-500 text-white' : 'bg-white/10 text-nous-subtle hover:bg-white/20'}`}>
 {isSelectionMode ? <X size={16} /> : <CheckCircle2 size={16} />}
 </button>
 </div>
 </motion.div>
 </AnimatePresence>
 </div>, document.body)}

 <AnimatePresence>
 {showFolderModal && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[8000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
 <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-none border border-nous-border max-w-sm w-full space-y-8">
 <div className="space-y-2">
 <h3 className="font-serif text-3xl italic tracking-tighter">Stack Shards.</h3>
 <p className="font-sans text-[8px] uppercase tracking-widest text-nous-subtle font-black">Group {selectedIds.size} fragments into a collection</p>
 </div>
 <input type="text"value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Collection Name..."className="w-full bg-nous-base border-b border-nous-border p-4 font-serif italic text-xl focus:outline-none"/>
 <div className="flex gap-4">
 <button onClick={() => setShowFolderModal(false)} className="flex-1 py-4 font-sans text-[8px] uppercase tracking-widest font-black text-nous-subtle hover:text-nous-text transition-all">Cancel</button>
 <button onClick={handleCreateFolder} className="flex-[2] py-4 bg-nous-text text-nous-base font-sans text-[8px] uppercase tracking-widest font-black rounded-none hover:scale-105 transition-transform">Create Stack</button>
 </div>
 </motion.div>
 </motion.div>
 )}

 {activeShard && (
 <ShardDetailView 
 item={activeShard} 
 onClose={() => setActiveShard(null)} 
 onUpdate={(id, updates) => {
 setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
 }}
 onAcquire={(item) => {
 setActiveShard(null);
 handleFinancialAnalysis(item);
 }}
 />
 )}
 </AnimatePresence>

 <input type="file"ref={fileInputRef} onChange={handleFileUpload} className="hidden"multiple accept="image/*,audio/*"/>
 </div>
 );
};
