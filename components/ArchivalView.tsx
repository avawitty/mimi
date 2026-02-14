
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { PocketItem, ZineMetadata, AspectRatio, TrendSynthesisReport, TasteAuditReport, VideoAuditReport, InvestmentReport } from '../types';
import { fetchPocketItems, addToPocket, createMoodboard, deleteFromPocket, updatePocketItem } from '../services/firebase';
import { getLocalPocket } from '../services/localArchive';
import { useUser } from '../contexts/UserContext';
import { analyzeCollectionIntent, scryTrendSynthesis, generateInvestmentStrategy, compressImage } from '../services/geminiService';
import { useRecorder } from '../hooks/useRecorder';
import { Loader2, X, Check, Filter, ArrowLeft, Plus, FolderPlus, Archive, Trash2, Radar, Briefcase, ScrollText, Pencil, Download, Mic, Film, Search, Play, Pause, Clapperboard, Video as VideoIcon, Save, StickyNote, PenTool, Link as LinkIcon, Wallet, Paperclip, Waves, Info, Binary, ExternalLink, Tag, MapPin, Hash, User, ImageIcon, DollarSign, CornerDownRight, Square, Layers, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProposalView } from './AboutView';

const SonicShardPlayer = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);
    const togglePlay = (e) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error("Playback error", e));
            setIsPlaying(true);
        }
    };
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-stone-50 dark:bg-stone-900 gap-6 text-center group min-h-[200px]">
            <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden" />
            <div className="relative">
                <div className={`absolute inset-0 bg-emerald-500/20 blur-xl rounded-full transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
                <button onClick={togglePlay} className="relative z-10 p-5 bg-white dark:bg-stone-800 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all text-emerald-500 border border-stone-100 dark:border-stone-700">
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

const AuditResultModal = ({ report, onClose, onSave, onToProposal }) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-4xl bg-white dark:bg-[#0A0A0A] border border-stone-200 dark:border-stone-800 shadow-2xl rounded-sm p-10 md:p-16 space-y-12 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-8 right-8 text-stone-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                
                <header className="space-y-4 border-b border-black/5 dark:border-white/5 pb-8">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <Briefcase size={20} />
                        <span className="font-sans text-[9px] uppercase tracking-[0.6em] font-black italic">Strategic Audit Report</span>
                    </div>
                    <h2 className="font-serif text-4xl md:text-6xl italic tracking-tighter text-nous-text dark:text-white leading-none">{report.conceptualThroughline || report.coreFrequency}</h2>
                </header>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Diagnosis</span>
                            <p className="font-serif italic text-lg text-stone-600 dark:text-stone-300 leading-relaxed text-balance">{report.diagnosis}</p>
                        </div>
                        <div className="space-y-2">
                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Strategic Brief</span>
                            <p className="font-serif italic text-lg text-stone-600 dark:text-stone-300 leading-relaxed text-balance border-l-2 border-emerald-500/30 pl-4">{report.designBrief}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Color Story</span>
                            <div className="flex gap-2 flex-wrap">
                                {report.colorStory?.map((c, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 group">
                                        <div className="w-10 h-10 rounded-full border border-black/10 dark:border-white/10 shadow-sm" style={{ backgroundColor: c.hex }} title={c.name} />
                                        <span className="font-mono text-[7px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase">{c.hex}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {report.keyTouchpoints && report.keyTouchpoints.length > 0 && (
                            <div className="space-y-4">
                                <span className="font-sans text-[8px] uppercase tracking-widest font-black text-amber-500">Key Touchpoints</span>
                                <ul className="space-y-2">
                                    {report.keyTouchpoints.map((tp, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Target size={12} className="mt-1 text-stone-300" />
                                            <span className="font-serif italic text-sm text-stone-600 dark:text-stone-300">{tp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-black/5 dark:border-white/5">
                    <button onClick={onSave} className="flex-1 py-4 border border-stone-200 dark:border-stone-800 rounded-full font-sans text-[9px] uppercase tracking-widest font-black hover:text-emerald-500 hover:border-emerald-500 transition-all flex items-center justify-center gap-2">
                        <Archive size={14} /> Anchor Report
                    </button>
                    <button onClick={onToProposal} className="flex-[2] py-4 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-[0.4em] font-black shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                        <ScrollText size={14} /> Initialize Proposal
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const AcquireReportModal = ({ report, onClose }) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-4xl bg-white dark:bg-[#0A0A0A] border border-stone-200 dark:border-stone-800 shadow-2xl rounded-sm p-10 md:p-16 space-y-12 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-8 right-8 text-stone-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                
                <header className="space-y-6 border-b border-black/5 dark:border-white/5 pb-8">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <Wallet size={20} />
                        <span className="font-sans text-[9px] uppercase tracking-[0.6em] font-black italic">Acquisition Board Brief</span>
                    </div>
                    <h2 className="font-serif text-3xl md:text-5xl italic tracking-tighter text-nous-text dark:text-white leading-none">
                        {report.thesis}
                    </h2>
                    {report.tailor_alignment_note && (
                        <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-sm">
                            <span className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400 block mb-2">Tailor Profile Alignment</span>
                            <p className="font-serif italic text-lg text-emerald-800 dark:text-emerald-200 leading-snug">{report.tailor_alignment_note}</p>
                        </div>
                    )}
                </header>

                <div className="space-y-8">
                    {report.capital_allocation.map((alloc, i) => (
                        <div key={i} className="p-8 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-sm space-y-6">
                            <div className="flex justify-between items-center">
                                <span className={`font-sans text-[9px] uppercase tracking-widest font-black px-3 py-1 rounded-sm ${alloc.category.includes('KEYSTONE') ? 'bg-emerald-500 text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>{alloc.category}</span>
                                <span className="font-mono text-[9px] text-stone-400 uppercase">{alloc.fiscal_route}</span>
                            </div>
                            <p className="font-serif italic text-xl text-stone-700 dark:text-stone-300 leading-relaxed">"{alloc.reasoning}"</p>
                            {alloc.items.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {alloc.items.map((it, j) => (
                                        <span key={j} className="px-3 py-1 bg-white dark:bg-black border border-black/5 dark:border-white/10 rounded-full text-xs font-mono">{it}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="pt-8 border-t border-black/5 dark:border-white/5 flex justify-between items-center opacity-70">
                    <div className="flex items-center gap-4">
                        <Activity size={16} className="text-emerald-500" />
                        <span className="font-sans text-[8px] uppercase tracking-widest font-black">Long-Term Impact: {report.capsule_impact_score}/100</span>
                    </div>
                    <span className="font-serif italic text-xs text-red-400">Missing: {report.missing_infrastructure}</span>
                </div>
            </div>
        </motion.div>
    );
};

export const ArchivalView = ({ onSelectZine }) => {
    const { user, profile } = useUser();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [activeBoard, setActiveBoard] = useState(null);
    const [focusedItem, setFocusedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showStackModal, setShowStackModal] = useState(false);
    const [stackName, setStackName] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [investmentReport, setInvestmentReport] = useState(null);
    const [auditReport, setAuditReport] = useState(null);
    const [showProposalMode, setShowProposalMode] = useState(false);
    const [tempProposalData, setTempProposalData] = useState(null);
    const { isRecording, startRecording, stopRecording, audioBlob } = useRecorder();
    const fileInputRef = useRef(null);
    const [injectTarget, setInjectTarget] = useState(null); 
    const [draggedItem, setDraggedItem] = useState(null);
    const [showLegend, setShowLegend] = useState(false);

    const loadArchival = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const localData = await getLocalPocket() || [];
            let cloudData = [];
            if (user && !user.isAnonymous) cloudData = await fetchPocketItems(user.uid) || [];
            const registry = new Map();
            localData.forEach(item => { if (item?.id) registry.set(item.id, item); });
            cloudData.forEach(item => { if (item?.id) registry.set(item.id, item); });
            setItems(Array.from(registry.values()).sort((a,b) => b.savedAt - a.savedAt));
        } catch (e) {} finally { setLoading(false); }
    }, [user]);

    useEffect(() => { loadArchival(); }, [loadArchival]);

    const handleManualUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setLoading(true);
        try {
            const newIds = [];
            for (const file of Array.from(files)) {
                const reader = new FileReader();
                const base64 = await new Promise((resolve) => {
                    reader.onload = async (ev) => {
                        const raw = ev.target?.result as string;
                        const compressed = await compressImage(raw, 0.6, 1024);
                        resolve(compressed);
                    };
                    reader.readAsDataURL(file);
                });
                const type = file.type.startsWith('audio') ? 'voicenote' : 'image';
                const newItemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                await addToPocket(user?.uid || 'ghost', type, {
                    imageUrl: type === 'image' ? base64 : undefined,
                    audioUrl: type === 'voicenote' ? base64 : undefined,
                    prompt: file.name,
                    timestamp: Date.now()
                }, newItemId); 
                newIds.push(newItemId);
            }
            if (injectTarget && injectTarget.type === 'image') {
               const folder = items.find(i => i.id === injectTarget.id);
               if (folder) {
                   const updatedIds = [...(folder.content.itemIds || []), ...newIds];
                   await updatePocketItem(folder.id, { content: { ...folder.content, itemIds: updatedIds } });
                   window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Shards Injected into Stack.", icon: <FolderPlus size={14} /> } }));
               }
               setInjectTarget(null);
            }
            await loadArchival(true);
            if (!injectTarget) window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Assets Anchored to Lab.", icon: <Check size={14} /> } }));
        } catch (err) {} finally { setLoading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };

    const handleQuickInject = (folderId, type) => {
        setInjectTarget({ id: folderId, type });
        if (type === 'image') fileInputRef.current?.click();
    };

    const handleCreateBoard = async () => {
        if (!stackName.trim()) return;
        try {
            await createMoodboard(user?.uid || 'ghost', stackName, Array.from(selectedIds));
            setStackName(''); setShowStackModal(false); setIsSelectionMode(false); setSelectedIds(new Set());
            loadArchival(true);
        } catch (e) {}
    };

    const handleItemClick = (item) => {
        if (!isSelectionMode) {
            if (item.type === 'moodboard') setActiveBoard(item);
            else setFocusedItem(item);
        } else {
            setSelectedIds(p => { const n = new Set(p); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; });
        }
    };

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDropOnFolder = async (e, folderItem) => {
        if (!draggedItem || draggedItem.id === folderItem.id) return;
        try {
            const currentIds = folderItem.content.itemIds || [];
            if (!currentIds.includes(draggedItem.id)) {
                const updatedIds = [...currentIds, draggedItem.id];
                await updatePocketItem(folderItem.id, { content: { ...folderItem.content, itemIds: updatedIds } });
                await updatePocketItem(draggedItem.id, { parentShardId: folderItem.id });
                window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Shard Filed to Stack.", icon: <FolderPlus size={14} /> } }));
                loadArchival(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDraggedItem(null);
        }
    };

    const filteredItems = useMemo(() => {
        const nestedItemIds = new Set();
        items.forEach(i => { if (i.type === 'moodboard' && i.content.itemIds) i.content.itemIds.forEach(id => nestedItemIds.add(id)); });
        const base = activeBoard ? items.filter(i => activeBoard.content.itemIds?.includes(i.id)) : items.filter(i => i.type === 'moodboard' || !nestedItemIds.has(i.id));
        return base.filter(item => !searchQuery || JSON.stringify(item.content).toLowerCase().includes(searchQuery.toLowerCase()));
    }, [items, searchQuery, activeBoard]);

    const TOOLBAR_ITEMS = useMemo(() => [
        { id: 'selection', icon: Filter, label: "Select" },
        { id: 'board', icon: FolderPlus, label: "Stack" },
        { id: 'audit', icon: Briefcase, label: "Audit" },
        { id: 'acquire', icon: Wallet, label: "Acquire" },
        { id: 'proposal', icon: ScrollText, label: "Proposal" }
    ], [isSelectionMode]);

    const handleToolAction = (id) => {
        switch(id) {
            case 'selection': setIsSelectionMode(p => !p); setSelectedIds(new Set()); break;
            case 'board': if (selectedIds.size > 0) setShowStackModal(true); else window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Select shards to create a stack.", type: 'error' } })); break;
            case 'audit': handleDesignerAudit(); break;
            case 'acquire': handleInvestmentStrategy(); break;
            case 'proposal': handleProposal(); break;
        }
    };

    const handleDesignerAudit = async () => {
        const targetItems = activeBoard ? items.filter(i => activeBoard.content.itemIds?.includes(i.id)) : (selectedIds.size > 0 ? items.filter(i => selectedIds.has(i.id)) : items.slice(0, 8));
        if (targetItems.length === 0) return;
        setIsAnalyzing(true);
        try {
            const res = await analyzeCollectionIntent(targetItems, profile);
            setAuditReport(res); // Show modal instead of just alert
        } catch (e) {
            window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Audit Failed.", type: 'error' } }));
        } finally { setIsAnalyzing(false); }
    };

    const handleSaveAudit = async () => {
        if (!auditReport) return;
        try {
            await addToPocket(user?.uid || 'ghost', 'analysis_report', {
                ...auditReport,
                title: auditReport.conceptualThroughline || "Strategic Audit",
                timestamp: Date.now()
            });
            window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Audit Report Anchored.", icon: <Check size={14} /> } }));
            setAuditReport(null);
            loadArchival(true);
        } catch (e) {}
    };

    const handleProposalFromAudit = () => {
        if (!auditReport) return;
        // Seed proposal with audit data
        const auditItems = activeBoard ? items.filter(i => activeBoard.content.itemIds?.includes(i.id)) : (selectedIds.size > 0 ? items.filter(i => selectedIds.has(i.id)) : []);
        setTempProposalData({
            name: auditReport.conceptualThroughline || "Strategic Proposal",
            items: auditItems,
            notes: `AUDIT BRIEF: ${auditReport.designBrief}\n\nDIAGNOSIS: ${auditReport.diagnosis}`
        });
        setAuditReport(null);
        setShowProposalMode(true);
    };

    const handleInvestmentStrategy = async () => {
        const targetItems = activeBoard ? items.filter(i => activeBoard.content.itemIds?.includes(i.id)) : (selectedIds.size > 0 ? items.filter(i => selectedIds.has(i.id)) : []);
        if (targetItems.length === 0) {
             window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Select items or open a folder to analyze budget.", type: 'error' } }));
             return;
        }
        setIsAnalyzing(true);
        try {
            const res = await generateInvestmentStrategy(targetItems, activeBoard?.notes || "Budgetary Analysis", profile);
            setInvestmentReport(res);
        } catch (e) {
            window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Economic Briefing Failed.", type: 'error' } }));
        } finally { setIsAnalyzing(false); }
    };

    const handleProposal = () => {
        if (activeBoard) { 
            setTempProposalData({ name: activeBoard.content.name, items: items.filter(i => activeBoard.content.itemIds?.includes(i.id)), notes: activeBoard.notes || '' }); 
            setShowProposalMode(true); 
            return; 
        }
        if (selectedIds.size > 0) { 
            setTempProposalData({ name: "Selection Brief", items: items.filter(i => selectedIds.has(i.id)), notes: "Direct audit from manual selection." }); 
            setShowProposalMode(true); 
            return; 
        }
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Select shards or open a Board to generate a Proposal.", type: 'error' } }));
    };

    const handleUpdateItem = async (id, updates) => {
        await updatePocketItem(id, updates);
        loadArchival(true);
    };

    return (
        <div className="w-full h-full flex flex-col bg-nous-base dark:bg-stone-950 text-nous-text dark:text-white transition-all duration-1000 overflow-hidden relative">
            <AnimatePresence>
                {showProposalMode && tempProposalData && <ProposalView folderData={tempProposalData} onClose={() => { setShowProposalMode(false); setTempProposalData(null); }} />}
                {focusedItem && <ItemDetailOverlay item={focusedItem} onClose={() => setFocusedItem(null)} onDelete={() => deleteFromPocket(focusedItem.id).then(() => { setFocusedItem(null); loadArchival(true); })} onUpdate={handleUpdateItem} />}
                {showStackModal && <div className="fixed inset-0 z-[7000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"><div className="bg-white dark:bg-stone-900 p-10 rounded-sm border border-stone-200 dark:border-stone-800 shadow-2xl max-w-sm w-full space-y-8"><h3 className="font-serif text-3xl italic tracking-tighter">Stack Shards.</h3><input type="text" value={stackName} onChange={e => setStackName(e.target.value)} placeholder="Collection Name..." className="w-full bg-stone-50 p-4 font-serif italic text-xl focus:outline-none" autoFocus /><div className="flex gap-4"><button onClick={() => setShowStackModal(false)} className="flex-1 py-4 font-sans text-[9px] font-black text-stone-400">Cancel</button><button onClick={handleCreateBoard} className="flex-[2] py-4 bg-nous-text text-white font-sans text-[9px] font-black rounded-full">Secure Stack</button></div></div></div>}
                
                {/* INVESTMENT REPORT MODAL */}
                {investmentReport && (
                    <AcquireReportModal 
                        report={investmentReport} 
                        onClose={() => setInvestmentReport(null)} 
                    />
                )}
                
                {/* AUDIT REPORT MODAL (NEW) */}
                {auditReport && (
                    <AuditResultModal 
                        report={auditReport} 
                        onClose={() => setAuditReport(null)} 
                        onSave={handleSaveAudit} 
                        onToProposal={handleProposalFromAudit} 
                    />
                )}
            </AnimatePresence>

            <header className="px-6 md:px-12 py-10 md:py-16 shrink-0 z-10 bg-white/50 dark:bg-stone-950/50 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Archive size={16} className="text-emerald-500" />
                            <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black italic text-stone-400">Archive: Deep Storage</span>
                        </div>
                        <div>
                            <h1 className="font-serif text-5xl md:text-8xl italic tracking-tighter leading-none luminescent-text">{activeBoard ? activeBoard.content.name : 'The Archival.'}</h1>
                            {!activeBoard && (
                                <p className="font-serif italic text-lg text-stone-500 dark:text-stone-400 pt-2 opacity-80 max-w-xl">
                                    "A sovereign vault for high-fidelity debris. Only what is worth saving remains."
                                </p>
                            )}
                        </div>
                        {activeBoard && <button onClick={() => setActiveBoard(null)} className="flex items-center gap-2 font-sans text-[8px] uppercase font-black text-stone-400 hover:text-emerald-500"><ArrowLeft size={10} /> Back to Repository</button>}
                    </div>
                    
                    <div className="flex flex-col gap-4 items-end w-full md:w-auto">
                        <div className="relative w-full md:w-[300px]">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Audit registry..." className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full py-3 pl-10 pr-4 font-serif italic text-sm focus:outline-none focus:border-emerald-500/50" />
                        </div>
                        <button onClick={() => setShowLegend(!showLegend)} className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-emerald-500 flex items-center gap-2">
                            {showLegend ? 'Hide Legend' : 'System Legend'} <Info size={10} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showLegend && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-8 overflow-hidden">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {TOOLBAR_ITEMS.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-lg">
                                        <item.icon size={14} className="text-stone-400" />
                                        <div className="flex flex-col">
                                            <span className="font-sans text-[8px] uppercase font-black tracking-widest">{item.label}</span>
                                            <span className="font-serif italic text-[10px] text-stone-500">
                                                {item.id === 'selection' ? "Isolate shards." :
                                                 item.id === 'board' ? "Stack into folder." :
                                                 item.id === 'audit' ? "Strategic report." :
                                                 item.id === 'acquire' ? "Economic briefing." : "Generate deck."}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-12 pt-8 pb-64">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-12">
                    {filteredItems.map(item => (
                        <ShardCard 
                            key={item.id} 
                            item={item} 
                            isSelected={selectedIds.has(item.id)} 
                            isSelectionMode={isSelectionMode} 
                            onClick={() => handleItemClick(item)} 
                            items={items} 
                            onInject={handleQuickInject}
                            onDragStart={handleDragStart}
                            onDrop={handleDropOnFolder}
                        />
                    ))}
                </div>
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[4000] w-full max-w-2xl px-6">
                <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-3xl p-1.5 rounded-full shadow-2xl flex items-center justify-between border border-black/5 dark:border-white/5 gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {TOOLBAR_ITEMS.map((t) => (
                            <button 
                                key={t.id}
                                onClick={() => handleToolAction(t.id)} 
                                disabled={isAnalyzing && (t.id === 'audit' || t.id === 'acquire')}
                                className={`p-3 md:px-5 md:py-3 rounded-full transition-all flex items-center gap-2 ${t.id === 'selection' && isSelectionMode ? 'bg-emerald-500 text-white' : 'text-stone-400 hover:text-emerald-500 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                                title={t.label}
                            >
                                {isAnalyzing && (t.id === 'audit' || t.id === 'acquire') ? <Loader2 size={18} className="animate-spin" /> : <t.icon size={18} />}
                                <span className="hidden md:inline font-sans text-[8px] uppercase tracking-widest font-black">{t.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200 dark:border-stone-800">
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleManualUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full shadow-lg active:scale-95 transition-all">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Inline definition of ShardCard to ensure dependency availability
const ShardCard = ({ item, isSelected, isSelectionMode, onClick, items, onInject, onDragStart, onDrop }) => {
    const isFolder = item.type === 'moodboard';
    const subCount = isFolder ? (item.content.itemIds?.length || 0) : 0;
    
    return (
        <motion.div 
            layout 
            onClick={onClick}
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => isFolder ? onDrop(e, item) : null}
            className={`group relative flex flex-col cursor-pointer transition-all ${isSelected ? 'ring-2 ring-emerald-500 rounded-sm' : ''}`}
        >
            <div className="aspect-[3/4] bg-stone-100 dark:bg-stone-900 overflow-hidden relative rounded-sm shadow-sm hover:shadow-xl transition-all border border-stone-200 dark:border-stone-800">
                {item.type === 'image' && <img src={item.content.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1.5s]" loading="lazy" />}
                {isFolder && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-stone-900 text-white">
                        <FolderPlus size={32} className="text-emerald-500 mb-2" />
                        <span className="font-serif italic text-sm line-clamp-2">{item.content.name}</span>
                        <span className="font-sans text-[6px] uppercase tracking-widest text-emerald-500 font-black mt-2">{subCount} Shards</span>
                    </div>
                )}
                {item.type !== 'image' && !isFolder && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-stone-50 dark:bg-stone-950">
                        {item.type === 'zine_card' ? <Layers size={24} className="text-stone-400" /> : 
                         item.type === 'voicenote' ? <Mic size={24} className="text-stone-400" /> :
                         item.type === 'analysis_report' ? <Briefcase size={24} className="text-emerald-500" /> :
                         <StickyNote size={24} className="text-stone-400" />}
                        <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black mt-2">{item.type}</span>
                    </div>
                )}
                
                {isSelectionMode && (
                    <div className="absolute top-2 left-2 z-20">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-black/40 border-white/50'}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                        </div>
                    </div>
                )}
                
                {/* QUICK INJECT OVERLAY FOR FOLDERS */}
                {isFolder && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onInject(item.id, 'image'); }} className="p-2 bg-white/10 rounded-full hover:bg-emerald-500 hover:text-white transition-all"><ImageIcon size={14} /></button>
                    </div>
                )}
            </div>
            <div className="pt-3 px-1">
                <h5 className="font-serif italic text-sm text-stone-800 dark:text-stone-200 line-clamp-1">{item.content.prompt || item.content.name || item.content.title || 'Untitled'}</h5>
                <span className="font-mono text-[8px] text-stone-400 uppercase">{new Date(item.savedAt).toLocaleDateString()}</span>
            </div>
        </motion.div>
    );
};

const ItemDetailOverlay = ({ item, onClose, onDelete, onUpdate }) => {
    const [note, setNote] = useState(item.notes || '');
    const [url, setUrl] = useState(item.content.url || '');
    const [price, setPrice] = useState(item.content.price || '');
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        onUpdate(item.id, { 
            notes: note,
            content: { ...item.content, url, price } 
        });
        setIsEditing(false);
    };

    const isReport = item.type === 'analysis_report';

    return (
        <div className="fixed inset-0 z-[9000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <button onClick={onClose} className="absolute top-6 right-6 text-stone-500 hover:text-white"><X size={24}/></button>
            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 h-[80vh]">
                <div className="flex items-center justify-center bg-stone-900 rounded-sm overflow-hidden border border-white/5 relative">
                    {item.type === 'image' ? (
                        <img src={item.content.imageUrl} className="max-h-full max-w-full object-contain" />
                    ) : isReport ? (
                        <div className="p-12 text-center space-y-6">
                            <Briefcase size={64} className="text-emerald-500 mx-auto" />
                            <h3 className="font-serif italic text-3xl text-white">{item.content.title}</h3>
                            <div className="space-y-4 text-left border-t border-white/10 pt-6">
                                <div className="space-y-1">
                                    <span className="font-sans text-[8px] uppercase tracking-widest text-emerald-500 font-black">Diagnosis</span>
                                    <p className="font-serif text-sm text-stone-400">{item.content.diagnosis}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-sans text-[8px] uppercase tracking-widest text-emerald-500 font-black">Design Brief</span>
                                    <p className="font-serif text-sm text-stone-400">{item.content.designBrief}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-stone-500 font-serif italic text-2xl uppercase tracking-widest">{item.type}</div>
                    )}
                </div>
                
                <div className="flex flex-col gap-6 text-white overflow-y-auto">
                    <div>
                        <span className="font-sans text-[8px] uppercase tracking-widest text-emerald-500 font-black">Shard Detail</span>
                        <h2 className="font-serif text-4xl italic mt-2">{item.content.prompt || item.content.name || item.content.title || 'Untitled'}</h2>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="font-sans text-[8px] uppercase tracking-widest text-stone-500 font-black">Acquisition Data</span>
                            <button onClick={() => setIsEditing(!isEditing)} className={`text-stone-400 hover:text-white transition-colors ${isEditing ? 'text-emerald-500' : ''}`}><Pencil size={14}/></button>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="font-sans text-[8px] uppercase tracking-widest text-stone-500">Link Drop</label>
                                    <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full bg-stone-800 border border-stone-700 p-2 font-mono text-xs text-white focus:outline-none focus:border-emerald-500 rounded-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-sans text-[8px] uppercase tracking-widest text-stone-500">Price Point</label>
                                    <input value={price} onChange={e => setPrice(e.target.value)} placeholder="$0.00" className="w-full bg-stone-800 border border-stone-700 p-2 font-mono text-xs text-white focus:outline-none focus:border-emerald-500 rounded-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-sans text-[8px] uppercase tracking-widest text-stone-500">Field Notes</label>
                                    <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full bg-stone-800 border border-stone-700 p-3 font-serif italic text-sm text-white focus:outline-none focus:border-emerald-500 h-32 rounded-sm resize-none" />
                                </div>
                                <button onClick={handleSave} className="w-full py-3 bg-emerald-600 text-white font-sans text-[9px] uppercase font-black rounded-sm hover:bg-emerald-500 transition-all">Update Shard</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-stone-900 rounded-sm border border-white/5 space-y-1">
                                        <div className="flex items-center gap-2 text-stone-500">
                                            <LinkIcon size={12} />
                                            <span className="font-sans text-[7px] uppercase tracking-widest font-black">Link</span>
                                        </div>
                                        {url ? (
                                            <a href={url} target="_blank" className="font-mono text-xs text-emerald-400 hover:underline truncate block">{url}</a>
                                        ) : <span className="font-mono text-xs text-stone-600">--</span>}
                                    </div>
                                    <div className="p-3 bg-stone-900 rounded-sm border border-white/5 space-y-1">
                                        <div className="flex items-center gap-2 text-stone-500">
                                            <DollarSign size={12} />
                                            <span className="font-sans text-[7px] uppercase tracking-widest font-black">Price</span>
                                        </div>
                                        <span className="font-mono text-xs text-white">{price || '--'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="font-sans text-[8px] uppercase tracking-widest text-stone-500 font-black">Notes</span>
                                    <p className="font-serif italic text-lg text-stone-300 leading-relaxed whitespace-pre-wrap">{note || "No notes attached."}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="border-t border-stone-800 pt-6 flex justify-between items-center">
                        <span className="font-mono text-[9px] text-stone-600">{item.id}</span>
                        <button onClick={onDelete} className="flex items-center gap-2 text-red-500 font-sans text-[9px] uppercase font-black hover:text-red-400 transition-colors"><Trash2 size={12}/> Delete Shard</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
