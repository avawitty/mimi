
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { fetchDossierFolders, fetchDossierArtifacts, createDossierFolder, createDossierArtifactFromImage, createDossierArtifactFromText, updateDossierFolder, fetchPocketItems } from '../services/firebase';
import { DossierFolder, DossierArtifact, FruitionTrajectory } from '../types';
import { Briefcase, Folder, Plus, ChevronRight, FileText, Share2, Layout, ArrowRight, Loader2, X, Archive, Eye, Trash2, Globe, ExternalLink, Upload, ImageIcon, HeartHandshake, FolderOpen, LayoutGrid, FolderPlus, PenTool, Save, Quote, Info, StickyNote, Compass, Map, Terminal } from 'lucide-react';
import { DossierArtifactView } from './DossierArtifactView';
import { generateStrategicBlueprint } from '../services/geminiService';

export const DossierView: React.FC = () => {
  const { user, profile } = useUser();
  const [folders, setFolders] = useState<DossierFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<DossierFolder | null>(null);
  const [artifacts, setArtifacts] = useState<DossierArtifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<DossierArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Note Modal State (Artifact Note)
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  // Folder Memo State
  const [folderMemo, setFolderMemo] = useState('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  // Strategic Blueprint State
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [activeBlueprint, setActiveBlueprint] = useState<FruitionTrajectory | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const data = await fetchDossierFolders(user?.uid || 'ghost');
      setFolders(data || []);
    } catch (e) {
      console.error("Dossier Registry Obscured:", e);
    } finally { setLoading(false); }
  };

  const loadArtifacts = async (folderId: string) => {
    setLoading(true);
    try {
      const data = await fetchDossierArtifacts(folderId);
      setArtifacts(data || []);
    } catch (e) {
      console.error("Artifact Extraction Failed:", e);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadFolders(); }, [user]);

  useEffect(() => {
    if (activeFolder) {
        loadArtifacts(activeFolder.id);
        setFolderMemo(activeFolder.notes || '');
    }
    else {
        setArtifacts([]);
        setFolderMemo('');
    }
  }, [activeFolder]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createDossierFolder(user?.uid || 'ghost', newFolderName);
      setNewFolderName(''); 
      setShowNewFolder(false);
      await loadFolders();
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Project Space Manifested.", icon: <FolderPlus size={14} /> } }));
    } catch (e) {}
  };

  const handleSaveFolderMemo = async () => {
    if (!activeFolder) return;
    setIsSavingMemo(true);
    try {
      await updateDossierFolder(activeFolder.id, { notes: folderMemo });
      // Update local state
      setActiveFolder(prev => prev ? { ...prev, notes: folderMemo } : null);
      setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, notes: folderMemo } : f));
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Folder Strategic Memo Anchored.", icon: <Check size={14} /> } }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFolder) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      await createDossierArtifactFromImage(user?.uid || 'ghost', activeFolder.id, file.name, base64);
      await loadArtifacts(activeFolder.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !activeFolder) return;
    setIsSavingNote(true);
    try {
      const title = noteTitle.trim() || "Semiotic Fragment";
      await createDossierArtifactFromText(user?.uid || 'ghost', activeFolder.id, title, noteContent);
      setNoteTitle('');
      setNoteContent('');
      setShowNoteModal(false);
      await loadArtifacts(activeFolder.id);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Semiotic Shard Anchored.", icon: <PenTool size={14} /> } }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleGenerateBlueprint = async () => {
      if (!activeFolder) return;
      setIsGeneratingBlueprint(true);
      try {
          // For now, we simulate pulling items from pocket that might be related, or just pass empty if Dossier items aren't fully PocketItems yet.
          // In a full implementation, DossierArtifacts would need to be convertible to PocketItems or handled directly.
          // Here we'll pass an empty array and rely on the memo for context if no items found.
          const res = await generateStrategicBlueprint([], folderMemo, profile);
          setActiveBlueprint(res);
      } catch (e) {
          console.error(e);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Blueprint Generation Failed.", type: 'error' } }));
      } finally {
          setIsGeneratingBlueprint(false);
      }
  };

  const handleVent = () => {
    window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'sanctuary' }));
  };

  if (activeArtifact) {
    return <DossierArtifactView artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />;
  }

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-64 px-8 md:px-16 pt-12 md:pt-20 bg-white dark:bg-stone-950 transition-colors duration-1000 selection:bg-nous-text selection:text-white">
      <div className="max-w-6xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-100 dark:border-stone-900 pb-12 gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-4 text-stone-400">
                 <Briefcase size={16} />
                 <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">The Dossier // Strategic Work</span>
              </div>
              <h2 className="font-serif text-6xl md:text-8xl italic tracking-tighter text-nous-text dark:text-white leading-none">Folders.</h2>
           </div>
           <div className="flex gap-4">
              <button onClick={handleVent} className="px-6 py-3 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-3 group">
                 <HeartHandshake size={14} className="group-hover:animate-pulse" /> The Clearing
              </button>
              <button onClick={() => setShowNewFolder(true)} className="px-8 py-3 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full font-sans text-[9px] uppercase tracking-widest font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all">
                 <Plus size={14} /> New Folder
              </button>
           </div>
        </header>
        
        <AnimatePresence mode="wait">
          {loading && !activeFolder ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 flex flex-col items-center gap-6">
                <Loader2 size={32} className="animate-spin text-stone-200" />
                <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Hydrating Registry...</span>
            </motion.div>
          ) : !activeFolder ? (
            <motion.div key="folders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {folders.map(folder => (
                 <motion.div key={folder.id} onClick={() => setActiveFolder(folder)} whileHover={{ y: -5 }} className="group cursor-pointer p-12 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm space-y-8 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                        <FolderOpen size={120} />
                    </div>
                    <Folder size={32} strokeWidth={1} className="text-stone-300 group-hover:text-nous-text dark:group-hover:text-white transition-colors" />
                    <div className="space-y-2">
                       <h3 className="font-serif text-3xl italic tracking-tighter">{folder.name}</h3>
                       <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Project Container</p>
                    </div>
                    {folder.notes && (
                      <div className="flex items-center gap-2 text-emerald-500/60">
                        <StickyNote size={10} />
                        <span className="font-sans text-[7px] uppercase tracking-widest font-black">Strategic Memo Bound</span>
                      </div>
                    )}
                    <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
                       <span className="font-mono text-[8px] uppercase text-stone-300">{new Date(folder.createdAt).toLocaleDateString()}</span>
                       <div className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={14} className="text-nous-text dark:text-white" />
                       </div>
                    </div>
                 </motion.div>
               ))}
               {folders.length === 0 && (
                 <div className="col-span-full py-48 text-center opacity-20 space-y-8 border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-sm">
                    <Archive size={48} strokeWidth={1} className="mx-auto" />
                    <p className="font-serif italic text-3xl">“Registry currently void.”</p>
                 </div>
               )}
            </motion.div>
          ) : (
            <motion.div key="artifacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
               {/* FOLDER CONTROLS */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-stone-50 dark:bg-stone-900 p-8 rounded-sm border border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-6">
                    <button onClick={() => setActiveFolder(null)} className="p-4 bg-white dark:bg-stone-800 rounded-full border border-black/5 text-stone-400 hover:text-nous-text transition-all shadow-sm"><ArrowRight size={20} className="rotate-180" /></button>
                    <div className="space-y-1">
                      <h3 className="font-serif text-4xl italic tracking-tighter">{activeFolder.name}</h3>
                      <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Active Context</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={handleGenerateBlueprint} disabled={isGeneratingBlueprint} className="px-6 py-3 bg-white dark:bg-stone-800 text-stone-500 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-3 border border-black/5 hover:border-emerald-500 hover:text-emerald-500 disabled:opacity-50">
                         {isGeneratingBlueprint ? <Loader2 size={16} className="animate-spin" /> : <Compass size={16} />} Strategic Blueprint
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleManualUpload} />
                      <button onClick={() => setShowNoteModal(true)} className="px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-full font-sans text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-3 border border-black/5">
                         <PenTool size={16} /> Semiotic Fragment
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-8 py-3 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full font-sans text-[9px] uppercase tracking-widest font-black active:scale-95 transition-all flex items-center gap-3 shadow-xl">
                         {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                         Inject Shard
                      </button>
                  </div>
               </div>

               {/* BLUEPRINT DISPLAY */}
               <AnimatePresence>
                   {activeBlueprint && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-stone-200 dark:border-stone-800 pt-12 overflow-hidden">
                           <div className="flex justify-between items-center mb-8">
                               <div className="flex items-center gap-3 text-emerald-500">
                                   <Map size={18} />
                                   <span className="font-sans text-[9px] uppercase tracking-[0.5em] font-black">Fruition Trajectory</span>
                               </div>
                               <button onClick={() => setActiveBlueprint(null)} className="p-2 text-stone-400 hover:text-red-500"><X size={16}/></button>
                           </div>
                           <div className="grid md:grid-cols-2 gap-8 bg-stone-50 dark:bg-stone-900 p-8 rounded-sm">
                               {Object.entries(activeBlueprint).map(([key, val], i) => (
                                   <div key={i} className="space-y-2 p-6 bg-white dark:bg-black border border-stone-100 dark:border-stone-800 rounded-sm">
                                       <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 block">{key.replace('_', ' ')}</span>
                                       <p className="font-serif italic text-lg text-stone-800 dark:text-stone-200 leading-snug">{String(val)}</p>
                                   </div>
                               ))}
                           </div>
                       </motion.div>
                   )}
               </AnimatePresence>

               {/* FOLDER STRATEGIC MEMO (FOLDER LEVEL NOTES) */}
               <section className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
                     <div className="flex items-center gap-3 text-stone-400">
                        <StickyNote size={14} className="text-emerald-500" />
                        <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black">Semiotic Touchpoint Registry</span>
                     </div>
                     <button 
                        onClick={handleSaveFolderMemo} 
                        disabled={isSavingMemo || folderMemo === (activeFolder.notes || '')}
                        className="flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500 disabled:opacity-30 transition-all"
                     >
                        {isSavingMemo ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Anchor Semiotics
                     </button>
                  </div>
                  <textarea 
                    value={folderMemo} 
                    onChange={e => setFolderMemo(e.target.value)} 
                    placeholder="Describe the semiotic throughline. High-density copy-pasting of references, motifs, and conceptual debris is encouraged here..." 
                    className="w-full bg-[#FDFBF7] dark:bg-stone-950 border border-stone-100 dark:border-stone-800 p-8 font-serif italic text-lg md:text-xl focus:outline-none min-h-[200px] rounded-sm text-stone-600 dark:text-stone-300 shadow-inner resize-none border-l-4 border-l-emerald-500/20"
                  />
                  <div className="flex items-center gap-3 opacity-30">
                     <Info size={12} />
                     <p className="font-serif italic text-xs">"Constituent fragments require a singular strategic logic to manifest as form."</p>
                  </div>
               </section>

               {/* ARTIFACTS GRID */}
               <div className="space-y-8">
                  <div className="flex items-center gap-3 text-stone-300">
                     <LayoutGrid size={14} />
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Constituent Shards</span>
                  </div>
                  {loading ? (
                     <div className="py-24 flex flex-col items-center gap-4 opacity-30">
                       <Loader2 size={24} className="animate-spin" />
                       <span className="font-sans text-[8px] uppercase tracking-widest font-black">Parsing Shards...</span>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                       {artifacts.map(artifact => (
                         <motion.div key={artifact.id} onClick={() => setActiveArtifact(artifact)} whileHover={{ y: -5 }} className="group cursor-pointer bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-1 shadow-sm hover:shadow-2xl transition-all rounded-sm flex flex-col">
                           <div className="aspect-[4/3] bg-stone-50 dark:bg-stone-950 overflow-hidden relative">
                               {artifact.elements?.[0]?.type === 'image' ? (
                                 <img src={artifact.elements[0].content} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 duration-[2s]" />
                               ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-stone-900 text-white italic text-center gap-4">
                                   <FileText size={32} className="text-emerald-500 opacity-50" />
                                   <p className="text-sm line-clamp-4 leading-relaxed">"{artifact.elements?.[0]?.content}"</p>
                                 </div>
                               )}
                               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-700" />
                               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <div className="p-2 bg-white/90 rounded-full shadow-lg">
                                     <Eye size={14} className="text-black" />
                                   </div>
                               </div>
                               <div className="absolute bottom-4 left-4">
                                   <div className="bg-white/95 dark:bg-stone-800/95 px-3 py-1 rounded-sm border border-black/5 shadow-sm">
                                     <span className="font-sans text-[7px] uppercase tracking-widest font-black text-nous-text dark:text-white">{artifact.type?.toUpperCase() || 'ARTIFACT'}</span>
                                   </div>
                               </div>
                           </div>
                           <div className="p-8 space-y-2">
                               <h4 className="font-serif text-2xl italic tracking-tighter line-clamp-1">{artifact.title}</h4>
                               <div className="flex justify-between items-center opacity-30">
                                 <span className="font-mono text-[8px] uppercase">{new Date(artifact.createdAt).toLocaleDateString()}</span>
                                 <span className="font-sans text-[7px] uppercase tracking-widest font-black">LOG_ID: {artifact.id.slice(-4)}</span>
                               </div>
                           </div>
                         </motion.div>
                       ))}
                       {artifacts.length === 0 && (
                         <div className="col-span-full py-48 text-center opacity-10 space-y-6 border border-dashed border-stone-100 dark:border-stone-800">
                           <LayoutGrid size={64} className="mx-auto" />
                           <p className="font-serif italic text-3xl">“Folder contains no active form.”</p>
                         </div>
                       )}
                     </div>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
         {showNewFolder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-md">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-stone-900 p-12 rounded-sm border border-stone-200 dark:border-stone-800 shadow-2xl max-sm w-full space-y-10">
                  <div className="space-y-3">
                     <h3 className="font-serif text-4xl italic tracking-tighter">Anchor Space.</h3>
                     <p className="font-sans text-[9px] uppercase tracking-widest text-stone-400 font-black">Establish a new container for your strategic work.</p>
                  </div>
                  <input 
                    type="text" 
                    value={newFolderName} 
                    onChange={e => setNewFolderName(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                    placeholder="Project Namespace..." 
                    className="w-full bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800 p-4 font-serif italic text-2xl focus:outline-none focus:border-emerald-500 transition-colors" 
                    autoFocus
                  />
                  <div className="flex gap-4">
                     <button onClick={() => setShowNewFolder(false)} className="flex-1 py-5 font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 hover:text-stone-600 transition-all">Abort</button>
                     <button onClick={handleCreateFolder} className="flex-[2] py-5 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[9px] uppercase tracking-widest font-black rounded-full shadow-xl active:scale-95 transition-all">Secure Space</button>
                  </div>
               </motion.div>
            </motion.div>
         )}

         {showNoteModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-md">
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-stone-900 p-10 rounded-sm border border-stone-200 dark:border-stone-800 shadow-2xl max-w-2xl w-full space-y-8">
                  <div className="space-y-2">
                     <div className="flex items-center gap-3 text-emerald-500">
                        <PenTool size={18} />
                        <h3 className="font-serif text-3xl italic tracking-tighter">Thought Shard.</h3>
                     </div>
                     <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Anchor text-based semiotics to this project.</p>
                  </div>
                  <div className="space-y-6">
                     <input 
                        type="text" 
                        value={noteTitle} 
                        onChange={e => setNoteTitle(e.target.value)} 
                        placeholder="Observation Title (optional)..." 
                        className="w-full bg-transparent border-b border-stone-100 dark:border-stone-800 py-2 font-serif italic text-xl focus:outline-none"
                        autoFocus
                     />
                     <textarea 
                        value={noteContent} 
                        onChange={e => setNoteContent(e.target.value)} 
                        placeholder="Paste semiotic touchpoints, fragments, or transcripts here..." 
                        className="w-full bg-[#FDFBF7] dark:bg-stone-950 border border-stone-100 dark:border-stone-800 p-8 font-serif italic text-lg focus:outline-none min-h-[300px] rounded-sm text-stone-600 dark:text-stone-300 shadow-inner resize-none"
                     />
                  </div>
                  <div className="flex gap-4 pt-4">
                     <button onClick={() => setShowNoteModal(false)} className="flex-1 py-4 font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 hover:text-nous-text transition-all">Cancel</button>
                     <button onClick={handleSaveNote} disabled={isSavingNote || !noteContent.trim()} className="flex-[2] py-4 bg-nous-text dark:bg-white text-white dark:text-stone-950 font-sans text-[9px] uppercase tracking-widest font-black rounded-full shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isSavingNote ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                        Secure Shard
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" />
    </div>
  );
};
