
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { PocketItem, ZineMetadata, TasteAuditReport, TrendSynthesisReport, ColorShard } from '../types';
import { fetchPocketItems, deleteFromPocket, addToPocket, updatePocketItem, createMoodboard } from '../services/firebase';
import { getLocalPocket } from '../services/localArchive';
import { useUser } from '../contexts/UserContext';
import { analyzeTasteManifesto, scryTrendSynthesis, scryLinkAesthetic, generateZineImage, generateSanctuaryReport, compressImage } from '../services/geminiService';
import { Loader2, Trash2, Sparkles, RefreshCw, X, Hash, CheckCircle2, Filter, Search, Link as LinkIcon, Anchor, Info, Compass, ShieldCheck, Target, ChevronRight, Binary, Orbit, Zap, Activity, Fingerprint, Waves, Play, Pause, Volume2, Shield, Plus, Layers, PenTool, Layout, Save, Wand2, Pencil, FolderPlus, FolderOpen, ArrowLeft, Copy, Check, Send, Radio, Briefcase, Eye, EyeOff, Globe2, Radar, ExternalLink, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SonicShardPlayer: React.FC<{ url: string }> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
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
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-stone-50 dark:bg-stone-900 gap-6 text-center group">
       <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden" />
       <div className="relative">
          <div className={`absolute inset-0 bg-emerald-500/20 blur-xl rounded-full transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
          <button onClick={togglePlay} className="relative z-10 p-5 bg-white dark:bg-stone-800 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all text-emerald-500">
             {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
       </div>
       <div className="space-y-1">
          <Waves size={32} className={`text-emerald-500/40 mx-auto ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Sonic Refraction</span>
       </div>
    </div>
  );
};

const ColorStory: React.FC<{ colors: ColorShard[] }> = ({ colors = [] }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    {colors?.map((c, i) => (
      <div key={i} className="space-y-3">
        <div className="aspect-square rounded-sm border border-black/5 dark:border-white/10 shadow-sm" style={{ backgroundColor: c.hex }} />
        <div className="space-y-1">
           <span className="font-mono text-[9px] uppercase font-black text-nous-text dark:text-white">{c.name}</span>
           <p className="font-serif italic text-[10px] text-stone-400 leading-tight">{c.descriptor}</p>
        </div>
      </div>
    ))}
  </div>
);

export const Pocket: React.FC<{ onSelectZine: (zine: ZineMetadata) => void }> = ({ onSelectZine }) => {
  const { user, profile, systemStatus } = useUser();
  const [items, setItems] = useState<PocketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeBoard, setActiveBoard] = useState<PocketItem | null>(null);
  const [activeAudit, setActiveAudit] = useState<TasteAuditReport | null>(null);
  const [activeTrendReport, setActiveTrendReport] = useState<TrendSynthesisReport | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [scryingUrl, setScryingUrl] = useState('');
  const [activeShard, setActiveShard] = useState<PocketItem | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isScryingOmen, setIsScryingOmen] = useState(false);

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

  useEffect(() => { loadPocket(); }, [loadPocket]);

  const filteredItems = useMemo(() => {
    if (activeBoard) return items.filter(i => activeBoard.content.itemIds?.includes(i.id));
    return items.filter(item => {
      const isFolder = item.type === 'moodboard';
      const isInAnyFolder = items.some(mb => mb.type === 'moodboard' && mb.content.itemIds?.includes(item.id));
      const contentStr = JSON.stringify(item.content).toLowerCase();
      const matchesSearch = !searchQuery || contentStr.includes(searchQuery.toLowerCase());
      return matchesSearch && (isFolder || !isInAnyFolder);
    });
  }, [items, searchQuery, activeBoard]);

  const handleDesignerAudit = async () => {
    const targetItems = isSelectionMode && selectedIds.size > 0 
        ? items.filter(i => selectedIds.has(i.id))
        : activeBoard ? items.filter(i => activeBoard.content.itemIds?.includes(i.id)) : items.slice(0, 8);

    if (targetItems.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeTasteManifesto(targetItems, profile);
      setActiveAudit(res);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Designer Brief Synthesized.", icon: <Briefcase size={14} /> } }));
    } catch (e) {} finally { setIsAnalyzing(false); }
  };

  const handleTrendSynthesis = async () => {
    const targetItems = isSelectionMode && selectedIds.size > 0 
        ? items.filter(i => selectedIds.has(i.id))
        : activeBoard ? items.filter(i => activeBoard.content.itemIds?.includes(i.id)) : items.slice(0, 8);

    if (targetItems.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await scryTrendSynthesis(targetItems, profile);
      setActiveTrendReport(res);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Trend Synthesis Grounded.", icon: <Radar size={14} /> } }));
    } catch (e) {} finally { setIsAnalyzing(false); }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createMoodboard(user?.uid || 'ghost', newFolderName, Array.from(selectedIds));
      setNewFolderName(''); setShowFolderModal(false); setIsSelectionMode(false); setSelectedIds(new Set());
      loadPocket(true);
    } catch (e) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
            reader.onload = async (ev) => {
                const raw = ev.target?.result as string;
                const compressed = await compressImage(raw);
                resolve(compressed);
            };
            reader.readAsDataURL(file);
        });
        const type = file.type.startsWith('audio') ? 'voicenote' : 'image';
        
        const newItem = {
            imageUrl: type === 'image' ? base64 : undefined,
            audioUrl: type === 'voicenote' ? base64 : undefined,
            prompt: file.name,
            timestamp: Date.now()
        };

        const id = await addToPocket(user?.uid || 'ghost', type, newItem);
        
        // Emit event for agents
        const fullItem: PocketItem = { id, userId: user?.uid || 'ghost', type, savedAt: Date.now(), content: newItem };
        window.dispatchEvent(new CustomEvent('mimi:shard_added', { detail: fullItem }));
      }
      await loadPocket(true);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleItemClick = (item: PocketItem) => {
    if (isSelectionMode) {
      setSelectedIds(prev => { const next = new Set(prev); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; });
    } else {
      if (item.type === 'moodboard') setActiveBoard(item);
      else setActiveShard(item);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-nous-base dark:bg-stone-950 transition-colors duration-1000 overflow-hidden relative">
      <header className="px-8 md:px-12 pt-12 md:pt-16 pb-12 border-b border-stone-100 dark:border-stone-900 bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                 {activeBoard && <button onClick={() => setActiveBoard(null)} className="p-2 -ml-2 text-stone-400 hover:text-nous-text transition-all"><ArrowLeft size={20}/></button>}
                 <span className="font-sans text-[10px] uppercase tracking-[0.5em] text-stone-400 font-black italic">{activeBoard ? 'Collection Focus' : 'Archive: Sovereign Material'}</span>
              </div>
              <h1 className="font-serif text-5xl md:text-8xl italic tracking-tighter text-nous-text dark:text-white leading-none">
                 {activeBoard ? activeBoard.content.name : 'The Pocket.'}
              </h1>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-stone-50 dark:bg-stone-800 rounded-full border border-black/5">
                <Shield size={10} className={systemStatus.auth === 'anchored' ? 'text-emerald-500' : 'text-stone-300'} />
                <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Vault Sync: {systemStatus.auth === 'anchored' ? 'ACTIVE' : 'LOCAL'}</span>
            </div>
          </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-8 md:px-12 pt-12 pb-64">
         
         <AnimatePresence>
            {activeTrendReport && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-24 p-10 md:p-20 bg-stone-950 text-white border border-emerald-500/30 rounded-sm shadow-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-16">
                     <div className="flex items-center gap-4 text-emerald-500">
                        <Radar size={20} className="animate-pulse" />
                        <span className="font-sans text-[11px] uppercase tracking-[0.6em] font-black italic">Anti-WGSN Trend Synthesis</span>
                     </div>
                     <button onClick={() => setActiveTrendReport(null)} className="p-3 text-stone-600 hover:text-white transition-all"><X size={24} /></button>
                  </div>

                  <div className="grid md:grid-cols-12 gap-16 md:gap-24">
                     <div className="md:col-span-7 space-y-12">
                        <div className="space-y-4">
                           <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500">Emerging Pattern Signals</span>
                           <div className="space-y-4">
                              {activeTrendReport.pattern_signals?.map((s, i) => (
                                <div key={i} className="flex gap-6 items-start">
                                  <span className="font-mono text-[9px] text-emerald-500 pt-1.5">SIGNAL_{i+1}</span>
                                  <p className="font-serif italic text-2xl md:text-4xl text-stone-200">{s}</p>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-8 pt-12 border-t border-white/5">
                           <section className="space-y-4">
                              <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500">Structural Shift Audit</span>
                              <p className="font-serif italic text-xl text-stone-300 leading-relaxed">{activeTrendReport.structural_shifts}</p>
                           </section>
                           <section className="space-y-4">
                              <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500">Cultural & Economic Forces</span>
                              <p className="font-serif italic text-lg text-stone-400 leading-relaxed">{activeTrendReport.cultural_forces}</p>
                           </section>
                        </div>
                     </div>

                     <div className="md:col-span-5 space-y-12">
                        <div className="p-8 bg-white/5 border border-white/10 rounded-sm space-y-8">
                           <div className="space-y-4">
                              <span className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500">Estimated Horizon</span>
                              <h4 className="font-serif text-3xl italic text-white tracking-tighter">{activeTrendReport.time_horizon}</h4>
                           </div>

                           <div className="space-y-6 pt-6 border-t border-white/10">
                              <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500">Grounding Sources</span>
                              <div className="space-y-3">
                                 {activeTrendReport.grounding_sources?.map((src, i) => (
                                   <a key={i} href={src.uri} target="_blank" className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-sm transition-all group/link">
                                      <span className="font-serif italic text-sm text-stone-300 truncate pr-4">{src.title || src.uri}</span>
                                      <ExternalLink size={12} className="text-stone-500 group-hover/link:text-emerald-500" />
                                   </a>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-4">
                            <Info size={16} className="text-emerald-500" />
                            <p className="font-serif italic text-xs text-emerald-100/60 leading-relaxed">
                               This synthesis is non-proprietary and grounded in verifiable digital debris. It identifies pattern resonance over consumerist projections.
                            </p>
                        </div>
                     </div>
                  </div>
              </motion.div>
            )}

            {activeAudit && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-24 p-10 md:p-20 bg-white dark:bg-stone-900 border-2 border-emerald-500/20 rounded-sm shadow-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-16">
                     <div className="flex items-center gap-4 text-emerald-500">
                        <Briefcase size={20} />
                        <span className="font-sans text-[11px] uppercase tracking-[0.6em] font-black italic">Editorial Designer Brief</span>
                     </div>
                     <button onClick={() => setActiveAudit(null)} className="p-3 text-stone-300 hover:text-red-500 transition-all"><X size={24} /></button>
                  </div>

                  <div className="grid md:grid-cols-12 gap-16 md:gap-24">
                     <div className="md:col-span-7 space-y-12">
                        <div className="space-y-4">
                           <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Conceptual Throughline</span>
                           <h3 className="font-serif text-3xl md:text-6xl italic tracking-tighter leading-tight text-nous-text dark:text-white">{activeAudit.conceptualThroughline}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-stone-50 dark:border-stone-800">
                           <section className="space-y-4">
                              <div className="flex items-center gap-3 text-amber-500">
                                 <Activity size={14} />
                                 <span className="font-sans text-[9px] uppercase tracking-widest font-black">Productive Tensions</span>
                              </div>
                              <ul className="space-y-3">
                                 {activeAudit.productiveTensions?.map((t, i) => (
                                   <li key={i} className="font-serif italic text-xl text-stone-600 dark:text-stone-300">"{t}"</li>
                                 ))}
                              </ul>
                           </section>
                           <section className="space-y-4">
                              <div className="flex items-center gap-3 text-stone-400">
                                 <EyeOff size={14} />
                                 <span className="font-sans text-[9px] uppercase tracking-widest font-black">The Void (Omissions)</span>
                              </div>
                              <p className="font-serif italic text-lg text-stone-500 leading-snug">{activeAudit.theVoid}</p>
                           </section>
                        </div>

                        <div className="space-y-6 pt-8 border-t border-stone-50 dark:border-stone-800">
                           <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Color Story // Archive Range</span>
                           <ColorStory colors={activeAudit.colorStory} />
                        </div>
                     </div>

                     <div className="md:col-span-5 space-y-12">
                        <div className="p-8 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-sm space-y-8">
                           <div className="space-y-6">
                              <span className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500">Design Brief Mandate</span>
                              <p className="font-serif italic text-xl text-stone-600 dark:text-stone-300 leading-relaxed">{activeAudit.designBrief}</p>
                           </div>

                           <div className="space-y-6 pt-6 border-t border-stone-100 dark:border-stone-800">
                              <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Material Logic</span>
                              <div className="flex flex-wrap gap-2">
                                 {activeAudit.materialSuggestions?.map((m, i) => (
                                   <span key={i} className="px-4 py-2 bg-white dark:bg-stone-900 border border-black/5 rounded-full font-serif italic text-sm text-stone-500">{m}</span>
                                 ))}
                              </div>
                           </div>

                           <div className="space-y-4 pt-6 border-t border-stone-100 dark:border-stone-800">
                              <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Silhouette Direction</span>
                              <p className="font-serif italic text-lg text-stone-500">{activeAudit.silhouetteDirection}</p>
                           </div>
                        </div>
                     </div>
                  </div>
              </motion.div>
            )}
         </AnimatePresence>

         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
            {filteredItems?.map(item => (
              <motion.div key={item.id} layout onClick={() => handleItemClick(item)} className={`group relative bg-white dark:bg-stone-900 border p-1 shadow-sm rounded-sm flex flex-col transition-all cursor-pointer ${isSelectionMode && selectedIds.has(item.id) ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-stone-100 dark:border-stone-800'}`}>
                  <div className="relative aspect-[3/4] bg-stone-50 dark:bg-stone-950 overflow-hidden">
                     {item.type === 'image' && <img src={item.content.imageUrl} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 duration-[2s]" />}
                     {item.type === 'moodboard' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-stone-900 text-white gap-6 text-center">
                           <FolderOpen size={48} className="text-emerald-500" />
                           <h3 className="font-serif italic text-2xl line-clamp-2">{item.content.name}</h3>
                           <span className="font-sans text-[6px] uppercase tracking-widest text-emerald-500 font-black">{item.content.itemIds?.length} Fragments</span>
                        </div>
                     )}
                     {(item.type === 'voicenote' || item.type === 'audio') && <SonicShardPlayer url={item.content.audioUrl} />}
                     <div className="absolute top-3 right-3 z-20">
                        <div className="bg-black/80 px-2 py-1 rounded-sm border border-white/10">
                           <span className="font-sans text-[6px] uppercase tracking-widest font-black text-white">{item.type.toUpperCase()}</span>
                        </div>
                     </div>
                     {/* AGENT ENRICHMENT BADGE */}
                     {item.agentEnrichment && (
                        <div className="absolute bottom-3 right-3 z-20 bg-indigo-500/20 border border-indigo-500/40 px-2 py-1 rounded-full backdrop-blur-sm" title="Curator Analyzed">
                            <Sparkles size={8} className="text-indigo-400" />
                        </div>
                     )}
                     {isSelectionMode && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                           <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedIds.has(item.id) ? 'bg-emerald-500 border-emerald-400' : 'bg-white/20 border-white/40'}`}>
                              {selectedIds.has(item.id) && <CheckCircle2 size={16} className="text-white" />}
                           </div>
                        </div>
                     )}
                  </div>
                  <div className="p-4 md:p-6">
                     <h5 className="font-serif italic text-lg md:text-xl text-stone-900 dark:text-white line-clamp-1">{item.content.prompt || item.content.name || 'Untitled'}</h5>
                     {item.agentEnrichment?.autoTags && (
                        <div className="flex gap-1 mt-2 overflow-x-auto no-scrollbar">
                            {item.agentEnrichment.autoTags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[6px] uppercase font-black bg-stone-100 dark:bg-stone-800 px-1 rounded text-stone-500 whitespace-nowrap">{tag}</span>
                            ))}
                        </div>
                     )}
                  </div>
              </motion.div>
            ))}
         </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[4000] w-full max-w-lg px-6">
         <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-3xl p-1.5 rounded-full shadow-2xl flex items-center justify-between border border-black/5 gap-2">
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} className={`p-3 rounded-full transition-all ${isSelectionMode ? 'bg-emerald-500 text-white shadow-md' : 'text-stone-400 hover:text-nous-text'}`} title="Selection Mode"><Filter size={18} /></button>
              
              <button 
                onClick={handleDesignerAudit}
                disabled={isAnalyzing || (!activeBoard && selectedIds.size === 0)}
                className={`p-3 rounded-full transition-all flex items-center gap-2 ${isAnalyzing ? 'bg-emerald-100 text-emerald-500 animate-pulse' : 'text-stone-400 hover:text-emerald-500'} disabled:opacity-30`}
                title="Designer Brief Audit"
              >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Briefcase size={18} />}
              </button>

              <button 
                onClick={handleTrendSynthesis}
                disabled={isAnalyzing || (!activeBoard && selectedIds.size === 0)}
                className={`p-3 rounded-full transition-all flex items-center gap-2 ${isAnalyzing ? 'bg-emerald-100 text-emerald-500 animate-pulse' : 'text-stone-400 hover:text-amber-500'} disabled:opacity-30`}
                title="Trend Intelligence"
              >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Radar size={18} />}
              </button>

              <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-full transition-all text-stone-400 hover:text-emerald-500`} title="O2 Omen Scry"><Radio size={18} /></button>
            </div>

            <div className="flex items-center gap-1.5">
               <AnimatePresence>
                 {isSelectionMode && selectedIds.size > 0 && (
                   <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onClick={() => setShowFolderModal(true)} className="px-4 py-2.5 bg-emerald-500 text-white rounded-full font-sans text-[8px] uppercase tracking-widest font-black active:scale-95 transition-all flex items-center gap-2 shadow-lg"><FolderPlus size={14} /> Stack</motion.button>
                 )}
               </AnimatePresence>
               <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full shadow-lg active:scale-95 transition-all"><Plus size={20} /></button>
            </div>
         </div>
      </div>

      <AnimatePresence>
         {showFolderModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-stone-900 p-10 rounded-sm border border-stone-200 dark:border-stone-800 shadow-2xl max-w-sm w-full space-y-8">
                  <div className="space-y-2">
                     <h3 className="font-serif text-3xl italic tracking-tighter">Stack Shards.</h3>
                     <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Group fragments into a collection</p>
                  </div>
                  <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Collection Name..." className="w-full bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800 p-4 font-serif italic text-xl focus:outline-none" />
                  <div className="flex gap-4">
                     <button onClick={() => setShowFolderModal(false)} className="flex-1 py-4 font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-nous-text transition-all">Cancel</button>
                     <button onClick={handleCreateFolder} className="flex-[2] py-4 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[8px] uppercase tracking-widest font-black rounded-full shadow-xl">Create Stack</button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*,audio/*" />
    </div>
  );
};
