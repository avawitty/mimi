
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PocketItem, ZineMetadata, UserProfile } from '../types';
import { fetchPocketItems, deleteFromPocket } from '../services/firebase';
import { getLocalPocket } from '../services/localArchive';
import { useUser } from '../contexts/UserContext';
import { analyzeTasteManifesto, TasteAuditReport, generateAudio } from '../services/geminiService';
import { Loader2, Trash2, Eye, Sparkles, FileText, Activity, Info, RefreshCcw, Palette, Compass, Binary, Layers, X, Moon, Hash, Search, Folder, ChevronRight, Bookmark, Volume2, Waves, CheckCircle2, Circle, Filter, LayoutGrid, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_POCKET_CAPACITY_GHOST = 12;
const MAX_POCKET_CAPACITY_SWAN = 48;

const FOLDERS = [
  { id: 'all', label: 'All Debris', icon: <LayoutGrid size={14} /> },
  { id: 'image', label: 'Visions', icon: <Eye size={14} /> },
  { id: 'zine_card', label: 'Issues', icon: <Layers size={14} /> },
  { id: 'palette', label: 'Analyses', icon: <Palette size={14} /> },
  { id: 'omen', label: 'Omens', icon: <Moon size={14} /> },
  { id: 'script', label: 'Scripts', icon: <FileText size={14} /> }
];

export const Pocket: React.FC<{ onSelectZine: (zine: ZineMetadata) => void }> = ({ onSelectZine }) => {
  const { user, profile } = useUser();
  const [items, setItems] = useState<PocketItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // SELECTION RITUAL STATE
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOracleTired, setIsOracleTired] = useState(false);
  const [audit, setAudit] = useState<TasteAuditReport | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // SONIC CALIBRATION STATE
  const [isTransmitting, setIsTransmitting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const maxCapacity = profile?.isSwan ? MAX_POCKET_CAPACITY_SWAN : MAX_POCKET_CAPACITY_GHOST;

  const loadPocket = async () => {
    setLoading(true);
    setAuditError(null);
    setIsOracleTired(false);
    try {
      const localData = await getLocalPocket();
      let cloudData: PocketItem[] = [];
      if (user && !user.isAnonymous) { cloudData = await fetchPocketItems(user.uid); }
      const merged = [...cloudData];
      localData.forEach(li => { if (!merged.find(mi => mi.id === li.id)) merged.push(li); });
      setItems(merged.sort((a,b) => b.savedAt - a.savedAt));
    } catch (e) { console.warn("MIMI // Pocket load friction."); } finally { setLoading(false); }
  };

  useEffect(() => { loadPocket(); }, [user]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      if (item.tags) item.tags.forEach(t => tags.add(t));
      if (item.content?.tags) item.content.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesFolder = activeFolder === 'all' || item.type === activeFolder;
      const itemTags = [...(item.tags || []), ...(item.content?.tags || [])];
      const matchesTag = !activeTag || itemTags.includes(activeTag);
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        itemTags.some(t => t.toLowerCase().includes(searchLower)) ||
        (item.content?.zineTitle?.toLowerCase().includes(searchLower)) ||
        (item.content?.prompt?.toLowerCase().includes(searchLower)) ||
        (item.content?.omenText?.toLowerCase().includes(searchLower));
      return matchesFolder && matchesTag && matchesSearch;
    });
  }, [items, activeFolder, activeTag, searchQuery]);

  const handleToggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    const allInViewIds = filteredItems.map(i => i.id);
    const areAllSelected = allInViewIds.every(id => selectedIds.has(id));
    
    const next = new Set(selectedIds);
    if (areAllSelected) {
      allInViewIds.forEach(id => next.delete(id));
    } else {
      allInViewIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const handleAnalyzeTaste = async () => {
      const targetItems = isSelectionMode && selectedIds.size > 0 
        ? items.filter(i => selectedIds.has(i.id))
        : items;

      if (targetItems.length < 2) {
        setAuditError("Artifact Deficit: Calibration requires at least 2 shards.");
        setTimeout(() => setAuditError(null), 5000);
        return;
      }
      
      setIsAnalyzing(true);
      setAuditError(null);
      setIsOracleTired(false);

      try {
          const report = await analyzeTasteManifesto(targetItems);
          setAudit(report);
          if (report.diagnosis) await speakDiagnosis(report.diagnosis);
          setIsSelectionMode(false);
          setSelectedIds(new Set());
      } catch (e: any) {
          setIsOracleTired(true);
          setAuditError("The Oracle is tired. Return when the frequency has stabilized.");
          setTimeout(() => { setAuditError(null); setIsOracleTired(false); }, 8000);
      } finally { setIsAnalyzing(false); }
  };

  const speakDiagnosis = async (text: string) => {
    if (isTransmitting) {
      if (sourceNodeRef.current) { try { sourceNodeRef.current.stop(); } catch(e) {} }
      setIsTransmitting(false);
      return;
    }
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      const bytes = await generateAudio(text);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioCtxRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) { channelData[i] = dataInt16[i] / 32768.0; }
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsTransmitting(false);
      source.start(0);
      sourceNodeRef.current = source;
      setIsTransmitting(true);
    } catch (e) { console.error("MIMI // Taste Oracle Muted:", e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Mandate: Purge this shard?")) return;
    try {
      if (user && !user.isAnonymous) { await deleteFromPocket(user.uid, id); }
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {}
  };

  const capacityUsed = (items.length / maxCapacity) * 100;
  const isFull = items.length >= maxCapacity;

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-24 gap-4">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <span className="font-sans text-[8px] uppercase tracking-[0.4em] text-stone-400 font-black">Scanning Vault...</span>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-12 pt-12 animate-fade-in pb-48 relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-stone-100 dark:border-stone-800 pb-8 gap-8">
        <div className="space-y-4">
           <div className="flex items-center gap-4">
             <h2 className="font-header text-3xl md:text-6xl italic text-nous-text dark:text-white tracking-tighter">The Pocket.</h2>
             {profile?.isSwan && <span className="px-3 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-sans text-[7px] font-black uppercase tracking-widest border border-emerald-100">Swan Tier</span>}
           </div>
           <p className="font-serif italic text-sm text-stone-500 max-w-xs">Sectional registry for high-fidelity debris.</p>
        </div>
        
        <div className="flex flex-col items-end gap-4 w-full md:w-auto">
            <div className="flex items-center gap-6 justify-between w-full md:w-auto">
                <div className="flex flex-col items-end mr-4">
                    <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Archive Load</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 md:w-32 h-1 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${capacityUsed}%` }} className={`h-full ${isFull ? 'bg-red-500' : 'bg-nous-text dark:bg-white'}`} />
                        </div>
                        <span className={`font-mono text-[10px] font-black ${isFull ? 'text-red-500' : 'text-stone-500'}`}>{items.length}/{maxCapacity}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
                    className={`px-6 py-3 font-sans text-[8px] uppercase tracking-[0.4em] font-black flex items-center gap-3 rounded-full transition-all border ${isSelectionMode ? 'bg-nous-text text-white border-nous-text' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-100'}`}
                  >
                      {isSelectionMode ? <X size={12} /> : <Filter size={12} />}
                      {isSelectionMode ? 'Cancel' : 'Curate'}
                  </button>
                  <button onClick={loadPocket} className="p-2 text-stone-300 hover:text-stone-600 transition-colors"><RefreshCcw size={16} /></button>
                </div>
            </div>
        </div>
      </div>

      {/* FOLDER CAROUSEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-stone-50 dark:border-stone-900 pb-6">
          <div className="flex overflow-x-auto no-scrollbar gap-4 flex-1">
              {FOLDERS.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => setActiveFolder(f.id)} 
                  className={`flex items-center gap-3 px-6 py-3 rounded-full border shrink-0 transition-all ${activeFolder === f.id ? 'bg-nous-text text-white border-nous-text dark:bg-white dark:text-stone-900 shadow-lg' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 text-stone-400 opacity-60'}`}
                >
                   {f.icon}
                   <span className="font-sans text-[9px] uppercase tracking-widest font-black">{f.label}</span>
                   {activeFolder === f.id && <span className="font-mono text-[10px] ml-2 opacity-50">{f.id === 'all' ? items.length : items.filter(i => i.type === f.id).length}</span>}
                </button>
              ))}
          </div>

          <AnimatePresence>
            {isSelectionMode && filteredItems.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={handleSelectAllFiltered}
                className="flex items-center gap-2 px-6 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text transition-all"
              >
                {filteredItems.every(i => selectedIds.has(i.id)) ? <CheckSquare size={12} /> : <Square size={12} />}
                {filteredItems.every(i => selectedIds.has(i.id)) ? 'Deselect In View' : 'Select All In View'}
              </motion.button>
            )}
          </AnimatePresence>
      </div>

      {/* SEARCH / TAGS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-8 relative group">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3 pl-4 pointer-events-none">
                 <Search size={14} className="text-stone-300 group-focus-within:text-nous-text dark:group-focus-within:text-white transition-colors" />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Trace by coordinate..."
                className="w-full bg-stone-50/50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 py-5 pl-12 pr-8 font-serif italic text-xl focus:outline-none focus:border-nous-text transition-all placeholder:text-stone-300"
              />
          </div>
          <div className="md:col-span-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black shrink-0">Tags:</span>
              <div className="flex gap-2">
                  <button onClick={() => setActiveTag(null)} className={`px-4 py-1.5 rounded-sm font-sans text-[8px] uppercase border transition-all ${!activeTag ? 'border-nous-text' : 'border-stone-100 text-stone-300'}`}>All</button>
                  {allTags.slice(0, 4).map(t => (
                    <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)} className={`px-4 py-1.5 rounded-sm font-sans text-[8px] uppercase border transition-all ${activeTag === t ? 'bg-nous-text text-white border-nous-text' : 'border-stone-100 text-stone-400'}`}>#{t}</button>
                  ))}
              </div>
          </div>
      </div>

      <AnimatePresence>
        {audit && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-24 p-8 md:p-16 bg-stone-50/50 dark:bg-stone-900/50 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-2xl relative overflow-hidden">
            <button onClick={() => setAudit(null)} className="absolute top-6 right-6 p-2 text-stone-300 hover:text-stone-600"><X size={20}/></button>
            <div className="flex justify-between items-start mb-16">
               <div className="space-y-2"><span className="font-sans text-[10px] uppercase tracking-[0.8em] text-stone-400 font-black">Contextual Calibration</span><h3 className="font-header text-5xl md:text-7xl italic text-nous-text dark:text-white leading-none">{audit.core_frequency}</h3></div>
               <div className="flex flex-col items-end">
                 <span className="font-mono text-[12px] text-emerald-500 font-black">{audit.resonance_score}% SYNC</span>
                 <button onClick={() => speakDiagnosis(audit.diagnosis)} className="mt-4 p-3 rounded-full bg-white dark:bg-stone-800 shadow-xl text-stone-400 hover:text-emerald-500 transition-all">
                   {isTransmitting ? <Waves size={16} className="text-emerald-500" /> : <Volume2 size={16} />}
                 </button>
               </div>
            </div>
            <div className="grid md:grid-cols-2 gap-16">
               <section className="space-y-4"><h4 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Registry Diagnosis</h4><p className="font-serif italic text-xl md:text-3xl leading-relaxed">"{audit.diagnosis}"</p></section>
               <section className="space-y-4 pt-8 border-t border-stone-100 md:border-t-0 md:border-l md:pl-16"><div className="flex items-center gap-4"><Palette size={20} className="text-stone-300" /><span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Chromatic Mandate</span></div><p className="font-serif italic text-3xl text-nous-text dark:text-white">{audit.chromatic_mandate}</p></section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 pb-32">
          {filteredItems.map(item => {
              const isSelected = selectedIds.has(item.id);
              return (
                <motion.div 
                  layout 
                  key={item.id} 
                  onClick={() => isSelectionMode ? handleToggleSelection(item.id) : null}
                  className={`group relative bg-white dark:bg-stone-900 border p-8 shadow-sm transition-all rounded-sm flex flex-col pt-16 cursor-pointer ${isSelectionMode ? (isSelected ? 'border-emerald-500 scale-[1.02] shadow-2xl bg-emerald-50/5' : 'border-stone-100 opacity-60 grayscale') : 'border-stone-100 hover:shadow-xl'}`}
                >
                    <div className="absolute top-0 left-0 right-0 flex px-8">
                       <div className={`px-4 py-1.5 rounded-b-lg border-x border-b flex items-center gap-2 transition-all ${isSelected ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-nous-text dark:bg-white text-white dark:text-black border-white/10'}`}>
                           {isSelectionMode ? (isSelected ? <CheckCircle2 size={10} /> : <Circle size={10} />) : <Bookmark size={10} />}
                           <span className="font-sans text-[7px] font-black uppercase tracking-widest">
                             {FOLDERS.find(f => f.id === item.type)?.label || 'Other'}
                           </span>
                       </div>
                    </div>

                    {!isSelectionMode && <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all z-10"><Trash2 size={18} /></button>}
                    
                    <div className="flex-1 space-y-6">
                      {item.type === 'image' && (
                          <div className="space-y-4">
                              <div className="aspect-square bg-stone-50 dark:bg-stone-950 overflow-hidden rounded-sm relative shadow-inner">
                                  <img src={item.content.imageUrl} className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0" alt="" />
                              </div>
                              <p className="font-serif italic text-base text-stone-500 line-clamp-2">"{item.content.prompt}"</p>
                          </div>
                      )}
                      {item.type === 'zine_card' && (
                          <div className="space-y-6 pt-4">
                             <div className="space-y-1">
                                 <span className="font-sans text-[7px] uppercase tracking-[0.4em] text-stone-400 font-black">Archive Manifest</span>
                                 <h3 className="font-header text-3xl md:text-4xl italic leading-none tracking-tighter">{item.content.zineTitle}</h3>
                             </div>
                             {!isSelectionMode && <button onClick={(e) => { e.stopPropagation(); onSelectZine({ id: item.content.zineId, content: { title: item.content.zineTitle } } as any); }} className="w-full py-4 border border-nous-text dark:border-white font-sans text-[10px] uppercase tracking-[0.4em] font-black hover:bg-nous-text hover:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-full shadow-lg">Re-Open</button>}
                          </div>
                      )}
                      {item.type === 'omen' && (
                          <div className="py-12 text-center space-y-8">
                              <Sparkles size={24} className="mx-auto text-amber-500 animate-pulse" />
                              <p className="font-serif italic text-xl md:text-2xl leading-snug text-nous-text dark:text-white px-4">"{item.content.omenText}"</p>
                          </div>
                      )}
                      {item.type === 'palette' && (
                          <div className="space-y-6 py-4">
                              <div className="space-y-1">
                                <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Chromatic Registry</span>
                                <h3 className="font-header italic text-2xl md:text-3xl">{item.content.name}</h3>
                              </div>
                              <div className="flex -space-x-3">
                                  {[item.content.base, item.content.text, item.content.accent].map((c, i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-white dark:border-stone-900 shadow-xl" style={{ backgroundColor: c }} />
                                  ))}
                              </div>
                          </div>
                      )}
                      {item.type === 'script' && (
                        <div className="space-y-4 pt-4">
                           <div className="flex items-center gap-3">
                             <Volume2 size={16} className="text-stone-300" />
                             <h3 className="font-header italic text-xl">{item.content.title}</h3>
                           </div>
                           <p className="font-serif italic text-sm text-stone-500 line-clamp-4 leading-relaxed">"{item.content.headline}"</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-stone-50 dark:border-stone-800 flex justify-between items-center opacity-40">
                       <span className="font-mono text-[8px] uppercase tracking-widest">{new Date(item.savedAt).toLocaleDateString()}</span>
                       <Binary size={14} className="text-stone-300" />
                    </div>
                </motion.div>
              );
          })}
      </div>

      {/* FLOATING CURATION ACTION BAR */}
      <AnimatePresence>
        {(isSelectionMode || selectedIds.size > 0) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[5000] w-full max-w-xl px-6"
          >
            <div className="bg-nous-text dark:bg-white text-white dark:text-stone-900 p-6 md:p-8 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex items-center justify-between gap-8 border border-white/10 dark:border-black/5">
                <div className="flex flex-col">
                  <span className="font-sans text-[8px] uppercase tracking-widest font-black opacity-60">Selection Active</span>
                  <span className="font-serif italic text-xl md:text-2xl">{selectedIds.size || 'No'} Shards Witnessed</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleAnalyzeTaste}
                    disabled={isAnalyzing || selectedIds.size < 2}
                    className="px-10 py-4 bg-emerald-500 text-white rounded-full font-sans text-[9px] uppercase tracking-[0.5em] font-black shadow-xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
                  >
                    {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Calibrate
                  </button>
                  <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="p-4 border border-white/20 dark:border-black/20 rounded-full hover:bg-white/10 transition-all"><X size={18} /></button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && items.length === 0 && (
        <div className="text-center py-48 opacity-30 flex flex-col items-center gap-10">
            <div className="w-32 h-32 rounded-full border border-stone-200 flex items-center justify-center animate-pulse"><Eye size={64} className="text-stone-200" /></div>
            <p className="font-serif italic text-3xl md:text-5xl">Silence in the pocket.</p>
        </div>
      )}
    </div>
  );
};
