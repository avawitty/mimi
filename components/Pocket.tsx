
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { PocketItem, ZineMetadata, TasteAuditReport, TrendSynthesisReport, ColorShard, InvestmentReport } from '../types';
import { fetchPocketItems, deleteFromPocket, addToPocket, updatePocketItem, createMoodboard } from '../services/firebase';
import { getLocalPocket } from '../services/localArchive';
import { useUser } from '../contexts/UserContext';
import { analyzeCollectionIntent, scryTrendSynthesis, generateInvestmentStrategy, compressImage } from '../services/geminiService';
import { Loader2, Trash2, Sparkles, RefreshCw, X, CheckCircle2, Filter, Search, Link as LinkIcon, Anchor, Info, Compass, ShieldCheck, Target, ChevronRight, Binary, Orbit, Zap, Activity, Fingerprint, Waves, Play, Pause, Volume2, Shield, Plus, Layers, PenTool, Layout, Save, Wand2, Pencil, FolderPlus, FolderOpen, ArrowLeft, Copy, Check, Send, Radio, Briefcase, Eye, EyeOff, Globe2, Radar, ExternalLink, ImageIcon, Wallet, ScrollText, DollarSign, PieChart, Coins, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENTS ---

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

const FinancialBriefOverlay: React.FC<{ report: InvestmentReport; onClose: () => void }> = ({ report, onClose }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[6000] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-4xl bg-[#0A0A0A] border border-stone-800 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="flex justify-between items-center p-8 border-b border-stone-800 bg-black/50 shrink-0">
                <div className="flex items-center gap-4 text-emerald-500">
                    <Wallet size={20} />
                    <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">The Strategist // Fiscal Audit</span>
                </div>
                <button onClick={onClose} className="p-2 text-stone-500 hover:text-white"><X size={20} /></button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
                <section className="space-y-6">
                    <div className="flex justify-between items-start">
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-500">Executive Thesis</span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <Activity size={12} className="text-emerald-500" />
                            <span className="font-mono text-[9px] text-emerald-400 font-bold">IMPACT: {report.capsule_impact_score}/100</span>
                        </div>
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl italic text-white leading-tight">{report.thesis}</h2>
                    {report.tailor_alignment_note && (
                        <p className="font-serif italic text-sm text-stone-400 border-l-2 border-stone-800 pl-4">{report.tailor_alignment_note}</p>
                    )}
                </section>

                <section className="space-y-8">
                    <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-500 border-b border-stone-800 pb-2 block">Capital Allocation Roadmap</span>
                    <div className="grid gap-4">
                        {report.capital_allocation.map((item, i) => (
                            <div key={i} className="p-6 bg-stone-900/50 border border-stone-800 rounded-sm flex flex-col md:flex-row gap-6">
                                <div className="md:w-1/4 space-y-2 shrink-0">
                                    <span className={`font-sans text-[8px] uppercase tracking-widest font-black px-2 py-1 rounded-sm ${item.category === 'KEYSTONE ASSET' ? 'bg-emerald-500 text-black' : item.category === 'VANITY METRIC' ? 'bg-red-500/20 text-red-400' : 'bg-stone-800 text-stone-300'}`}>
                                        {item.category}
                                    </span>
                                    <p className="font-mono text-[9px] text-stone-500 pt-2">{item.fiscal_route}</p>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {item.items.map((prod, j) => (
                                            <span key={j} className="font-serif italic text-lg text-white border-b border-stone-700">{prod}</span>
                                        ))}
                                    </div>
                                    <p className="font-serif text-sm text-stone-400 leading-relaxed">{item.reasoning}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {report.missing_infrastructure && (
                    <section className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-sm space-y-2">
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black text-amber-500 flex items-center gap-2"><AlertTriangle size={12} /> Missing Infrastructure</span>
                        <p className="font-serif italic text-stone-300">{report.missing_infrastructure}</p>
                    </section>
                )}
            </div>
        </div>
    </motion.div>
);

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
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
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
      // If we are at root, allow items that are NOT in a folder OR are folders themselves
      const isFolder = item.type === 'moodboard';
      const isInAnyFolder = items.some(mb => mb.type === 'moodboard' && mb.content.itemIds?.includes(item.id));
      // Show everything for simplicity in archive, filtering logic can be enhanced later
      return true;
    });
  }, [items, activeBoard]);

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
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Curator Analysis Complete.", icon: <Briefcase size={14} /> } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Audit Failed.", type: 'error' } }));
    } finally { setIsAnalyzing(false); setActiveAgent(null); }
  };

  const handleFinancialAnalysis = async () => {
    const targetItems = getSelection();
    if (targetItems.length === 0) return;

    setIsAnalyzing(true);
    setActiveAgent('strategist');

    try {
        // Collect notes from all items to give context
        const collectiveNotes = targetItems.map(i => i.notes).filter(Boolean).join('\n');
        const res = await generateInvestmentStrategy(targetItems, collectiveNotes, profile);
        setActiveInvestment(res);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Fiscal Strategy Generated.", icon: <Wallet size={14} /> } }));
    } catch (e) {
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Strategist Disconnected.", type: 'error' } }));
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
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Trend Scry Failed.", type: 'error' } }));
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
    try {
      await createMoodboard(user?.uid || 'ghost', newFolderName, Array.from(selectedIds));
      setNewFolderName(''); setShowFolderModal(false); setIsSelectionMode(false); setSelectedIds(new Set());
      await loadPocket(true);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Stack Created.", icon: <FolderPlus size={14} /> } }));
    } catch (e) { console.error(e); }
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
      // else open detail view (omitted for brevity)
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-nous-base dark:bg-stone-950 transition-colors duration-1000 overflow-hidden relative">
      <AnimatePresence>
          {isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl flex flex-col items-center justify-center gap-8">
                  <Loader2 size={48} className={`animate-spin ${activeAgent === 'strategist' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                  <div className="text-center space-y-2">
                      <h3 className="font-serif text-3xl italic text-nous-text dark:text-white">
                          {activeAgent === 'strategist' ? "Summoning The Strategist..." : "Invoking The Curator..."}
                      </h3>
                      <p className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-stone-400">
                          {activeAgent === 'strategist' ? "Calculating Fiscal Velocity" : "Auditing Aesthetic Patterns"}
                      </p>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <header className="px-8 md:px-12 pt-12 md:pt-16 pb-8 border-b border-stone-100 dark:border-stone-900 bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                 {activeBoard && <button onClick={() => setActiveBoard(null)} className="p-2 -ml-2 text-stone-400 hover:text-nous-text transition-all"><ArrowLeft size={20}/></button>}
                 <span className="font-sans text-[10px] uppercase tracking-[0.5em] text-stone-400 font-black italic">{activeBoard ? 'Collection Focus' : 'Archive: Sovereign Material'}</span>
              </div>
              <h1 className="font-serif text-5xl md:text-7xl italic tracking-tighter text-nous-text dark:text-white leading-none">
                 {activeBoard ? activeBoard.content.name : 'The Pocket.'}
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-stone-50 dark:bg-stone-800 rounded-full border border-black/5">
                    <Shield size={10} className={systemStatus.auth === 'anchored' ? 'text-emerald-500' : 'text-stone-300'} />
                    <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">{systemStatus.auth === 'anchored' ? 'SYNC ACTIVE' : 'LOCAL'}</span>
                </div>
            </div>
          </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-8 md:px-12 pt-12 pb-64">
         {/* REPORT OVERLAYS */}
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
                        <div className="space-y-6 pt-8 border-t border-stone-50 dark:border-stone-800">
                           <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Color Story</span>
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
              <motion.div key={item.id} layout onClick={() => handleItemClick(item)} className={`group relative bg-white dark:bg-stone-900 border p-1 shadow-sm rounded-sm flex flex-col transition-all cursor-pointer ${isSelectionMode && selectedIds.has(item.id) ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-stone-100 dark:border-stone-800'}`}>
                  <div className="relative aspect-[3/4] bg-stone-50 dark:bg-stone-950 overflow-hidden">
                     {item.type === 'image' && <img src={item.content.imageUrl} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 duration-[2s]" />}
                     {item.type === 'moodboard' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-stone-900 text-white gap-6 text-center border-4 border-double border-emerald-500/20">
                           <FolderOpen size={48} className="text-emerald-500" />
                           <h3 className="font-serif italic text-2xl line-clamp-2">{item.content.name}</h3>
                           <span className="font-sans text-[6px] uppercase tracking-widest text-emerald-500 font-black">{item.content.itemIds?.length} Fragments</span>
                        </div>
                     )}
                     {(item.type === 'voicenote' || item.type === 'audio') && <SonicShardPlayer url={item.content.audioUrl} />}
                     {item.type === 'analysis_report' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-stone-50 dark:bg-stone-900 text-stone-400 gap-6 text-center">
                           <Briefcase size={32} />
                           <h3 className="font-serif italic text-xl line-clamp-3">{item.content.title}</h3>
                        </div>
                     )}
                     
                     {/* SELECTION CHECKBOX */}
                     {isSelectionMode && (
                        <div className="absolute inset-0 bg-black/10 flex items-start justify-end p-3">
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id) ? 'bg-emerald-500 border-emerald-400' : 'bg-white/20 border-white/60'}`}>
                              {selectedIds.has(item.id) && <CheckCircle2 size={12} className="text-white" />}
                           </div>
                        </div>
                     )}
                  </div>
                  <div className="p-4 md:p-6">
                     <h5 className="font-serif italic text-lg md:text-xl text-stone-900 dark:text-white line-clamp-1">{item.content.prompt || item.content.name || item.content.title || 'Untitled'}</h5>
                  </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* FOOTER TOOLBAR */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[4000] w-full max-w-2xl px-6">
         <AnimatePresence mode="wait">
            {isSelectionMode ? (
                <motion.div 
                    key="toolbar"
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    exit={{ y: 20, opacity: 0 }}
                    className="bg-stone-900/95 backdrop-blur-3xl p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 gap-2"
                >
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setShowFolderModal(true)} 
                            disabled={selectedIds.size === 0}
                            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
                        >
                            <FolderPlus size={18} />
                            <span className="font-sans text-[7px] uppercase tracking-widest font-black">Stack</span>
                        </button>
                        <div className="w-px h-8 bg-white/10" />
                        <button 
                            onClick={handleDesignerAudit}
                            disabled={selectedIds.size === 0}
                            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-stone-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-30"
                        >
                            <Briefcase size={18} />
                            <span className="font-sans text-[7px] uppercase tracking-widest font-black">Audit</span>
                        </button>
                        <button 
                            onClick={handleFinancialAnalysis}
                            disabled={selectedIds.size === 0}
                            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-stone-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-30"
                        >
                            <Wallet size={18} />
                            <span className="font-sans text-[7px] uppercase tracking-widest font-black">Acquire</span>
                        </button>
                        <button 
                            onClick={handleProposal}
                            disabled={selectedIds.size === 0}
                            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-30"
                        >
                            <ScrollText size={18} />
                            <span className="font-sans text-[7px] uppercase tracking-widest font-black">Proposal</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-4 px-4 border-l border-white/10">
                        <span className="font-mono text-xs text-white hidden md:inline">{selectedIds.size} Selected</span>
                        <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 bg-white/10 rounded-full hover:bg-red-500 hover:text-white text-stone-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="standard"
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    exit={{ y: 20, opacity: 0 }}
                    className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-3xl p-2 rounded-full shadow-2xl flex items-center justify-between border border-black/5 gap-4 px-6"
                >
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 text-stone-500 hover:text-nous-text dark:hover:text-white transition-colors group">
                        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Plus size={18} />
                        </div>
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black hidden md:block">Add Debris</span>
                    </button>

                    <div className="w-px h-6 bg-stone-200 dark:bg-stone-800" />

                    <button onClick={handleTrendSynthesis} className="flex items-center gap-3 text-stone-500 hover:text-amber-500 transition-colors group" title="Scry Trends">
                        <Radar size={18} />
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black hidden md:block">Radar</span>
                    </button>

                    <div className="w-px h-6 bg-stone-200 dark:bg-stone-800" />

                    <button 
                        onClick={() => setIsSelectionMode(true)}
                        className="flex items-center gap-3 text-stone-500 hover:text-indigo-500 transition-colors group"
                    >
                        <CheckCircle2 size={18} />
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black hidden md:block">Select</span>
                    </button>
                </motion.div>
            )}
         </AnimatePresence>
      </div>

      <AnimatePresence>
         {showFolderModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[8000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-stone-900 p-10 rounded-sm border border-stone-200 dark:border-stone-800 shadow-2xl max-w-sm w-full space-y-8">
                  <div className="space-y-2">
                     <h3 className="font-serif text-3xl italic tracking-tighter">Stack Shards.</h3>
                     <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Group {selectedIds.size} fragments into a collection</p>
                  </div>
                  <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Collection Name..." className="w-full bg-stone-50 dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 p-4 font-serif italic text-xl focus:outline-none" />
                  <div className="flex gap-4">
                     <button onClick={() => setShowFolderModal(false)} className="flex-1 py-4 font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-nous-text transition-all">Cancel</button>
                     <button onClick={handleCreateFolder} className="flex-[2] py-4 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[8px] uppercase tracking-widest font-black rounded-full shadow-xl hover:scale-105 transition-transform">Create Stack</button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*,audio/*" />
    </div>
  );
};
