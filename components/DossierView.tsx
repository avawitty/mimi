
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { fetchDossierFolders, fetchDossierArtifacts, createDossierFolder, createDossierArtifactFromImage, createDossierArtifactFromText, updateDossierFolder, fetchPocketItems } from '../services/firebase';
import { DossierFolder, DossierArtifact, FruitionTrajectory, Task } from '../types';
import { Briefcase, Folder, Plus, ChevronRight, FileText, Share2, Layout, ArrowRight, Loader2, X, Archive, Eye, Trash2, Globe, ExternalLink, Upload, ImageIcon, HeartHandshake, FolderOpen, LayoutGrid, FolderPlus, PenTool, Save, Quote, Info, StickyNote, Compass, Map, Terminal, Check, Calendar, AlertTriangle, ListChecks, Sparkles, Clock, Target, CalendarDays, GripVertical } from 'lucide-react';
import { DossierArtifactView } from './DossierArtifactView';
import { generateStrategicBlueprint, generateProjectTasks } from '../services/geminiService';

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

  // Task Management State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar'>('list');

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
        setTasks(activeFolder.tasks || []);
    }
    else {
        setArtifacts([]);
        setFolderMemo('');
        setTasks([]);
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
          const res = await generateStrategicBlueprint([], folderMemo, profile);
          setActiveBlueprint(res);
      } catch (e) {
          console.error(e);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Blueprint Generation Failed.", type: 'error' } }));
      } finally {
          setIsGeneratingBlueprint(false);
      }
  };

  // --- TASK MANAGEMENT LOGIC ---

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !activeFolder) return;
    const newTask: Task = {
        id: `task_${Date.now()}`,
        text: newTaskText.trim(),
        completed: false,
        dueDate: newTaskDate || undefined,
        createdAt: Date.now()
    };
    const updatedTasks = [...tasks, newTask];
    
    setTasks(updatedTasks);
    setNewTaskText('');
    setNewTaskDate('');
    
    // Persist
    try {
        await updateDossierFolder(activeFolder.id, { tasks: updatedTasks });
        // Update local folders list to reflect state
        setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, tasks: updatedTasks } : f));
    } catch(e) {
        console.error("Task persistence failed", e);
    }
  };

  const toggleTask = async (taskId: string) => {
      if (!activeFolder) return;
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      setTasks(updatedTasks);
      try {
          await updateDossierFolder(activeFolder.id, { tasks: updatedTasks });
          setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, tasks: updatedTasks } : f));
      } catch(e) {}
  };

  const confirmDeleteTask = async () => {
      if (!activeFolder || !taskToDelete) return;
      const updatedTasks = tasks.filter(t => t.id !== taskToDelete);
      setTasks(updatedTasks);
      setTaskToDelete(null);
      try {
          await updateDossierFolder(activeFolder.id, { tasks: updatedTasks });
          setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, tasks: updatedTasks } : f));
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Imperative Purged.", icon: <Trash2 size={14} /> } }));
      } catch(e) {}
  };

  const handleAutoPlan = async () => {
      if (!activeFolder || isPlanning) return;
      setIsPlanning(true);
      try {
          const generatedTasks = await generateProjectTasks(activeFolder.name, folderMemo, artifacts, profile);
          if (generatedTasks && generatedTasks.length > 0) {
              const mergedTasks = [...tasks, ...generatedTasks];
              setTasks(mergedTasks);
              await updateDossierFolder(activeFolder.id, { tasks: mergedTasks });
              setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, tasks: mergedTasks } : f));
              window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Strategy Manifested into Action.", icon: <Sparkles size={14} /> } }));
          }
      } catch (e) {
          console.error("Auto Plan Failed", e);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "The Strategist was obstructed.", type: 'error' } }));
      } finally {
          setIsPlanning(false);
      }
  };

  const handleVent = () => {
    window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'sanctuary' }));
  };

  if (activeArtifact) {
    return <DossierArtifactView artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />;
  }

  // Group tasks by date for calendar view
  const tasksByDate = React.useMemo(() => {
      const groups: Record<string, Task[]> = {};
      const sorted = [...tasks].sort((a,b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
      });
      
      sorted.forEach(t => {
          const key = t.dueDate || 'Unscheduled';
          if (!groups[key]) groups[key] = [];
          groups[key].push(t);
      });
      return groups;
  }, [tasks]);

  return (
    <div className="w-full h-full flex flex-col bg-nous-base dark:bg-stone-950 transition-colors duration-1000 overflow-hidden relative">
      <AnimatePresence>
        {taskToDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-stone-900 p-8 rounded-sm shadow-xl max-w-sm w-full space-y-6 border border-stone-200 dark:border-stone-800">
                    <div className="space-y-2">
                        <h3 className="font-serif italic text-xl">Purge Imperative?</h3>
                        <p className="font-sans text-xs text-stone-500">This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setTaskToDelete(null)} className="flex-1 py-3 text-stone-500 hover:text-stone-800 font-sans text-[9px] uppercase tracking-widest font-black">Cancel</button>
                        <button onClick={confirmDeleteTask} className="flex-1 py-3 bg-red-500 text-white rounded-sm font-sans text-[9px] uppercase tracking-widest font-black hover:bg-red-600 transition-colors">Confirm</button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR: FOLDERS */}
        <aside className="w-64 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20 flex flex-col hidden md:flex shrink-0">
           <div className="p-6 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3 text-stone-400 mb-6">
                 <Briefcase size={16} />
                 <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black italic">Project Registry</span>
              </div>
              <button 
                onClick={() => setShowNewFolder(true)}
                className="w-full py-3 border border-dashed border-stone-300 dark:border-stone-700 rounded-sm font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 hover:text-nous-text hover:border-nous-text transition-all flex items-center justify-center gap-2"
              >
                 <Plus size={12} /> New Project
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar">
              {loading ? (
                 <div className="p-8 text-center"><Loader2 size={16} className="animate-spin mx-auto text-stone-300" /></div>
              ) : (
                 <div className="flex flex-col">
                    {folders.map(folder => (
                       <button
                         key={folder.id}
                         onClick={() => setActiveFolder(folder)}
                         className={`text-left px-6 py-4 border-b border-stone-100 dark:border-stone-800 transition-all hover:bg-stone-100 dark:hover:bg-stone-800 group ${activeFolder?.id === folder.id ? 'bg-white dark:bg-stone-800 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                       >
                          <h4 className={`font-serif italic text-lg leading-tight group-hover:text-emerald-500 transition-colors ${activeFolder?.id === folder.id ? 'text-nous-text dark:text-white' : 'text-stone-500'}`}>{folder.name}</h4>
                          <span className="font-mono text-[9px] text-stone-300 uppercase">{new Date(folder.createdAt).toLocaleDateString()}</span>
                       </button>
                    ))}
                 </div>
              )}
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-stone-950">
           {activeFolder ? (
             <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12 pb-32">
                <header className="mb-12 flex justify-between items-start">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 text-emerald-500">
                         <FolderOpen size={18} />
                         <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black">Active Dossier</span>
                      </div>
                      <h2 className="font-serif text-5xl md:text-6xl italic tracking-tighter text-nous-text dark:text-white leading-none">{activeFolder.name}</h2>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={handleGenerateBlueprint} disabled={isGeneratingBlueprint} className="p-3 border border-stone-200 dark:border-stone-800 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition-all group" title="Generate Strategic Blueprint">
                         {isGeneratingBlueprint ? <Loader2 size={18} className="animate-spin" /> : <Compass size={18} />}
                      </button>
                      <button onClick={() => setShowNoteModal(true)} className="p-3 border border-stone-200 dark:border-stone-800 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all" title="Add Note">
                         <StickyNote size={18} />
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                         <Upload size={12} /> Add Artifact
                      </button>
                   </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   
                   {/* LEFT COL: STRATEGY & TASKS */}
                   <div className="lg:col-span-4 space-y-12">
                      <section className="space-y-4">
                         <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-2">
                            <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Strategic Memo</span>
                            {isSavingMemo ? <Loader2 size={10} className="animate-spin" /> : <Save size={12} className="cursor-pointer hover:text-emerald-500" onClick={handleSaveFolderMemo} />}
                         </div>
                         <textarea 
                            value={folderMemo}
                            onChange={(e) => setFolderMemo(e.target.value)}
                            onBlur={handleSaveFolderMemo}
                            className="w-full h-40 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 font-serif italic text-sm leading-relaxed resize-none focus:outline-none focus:border-emerald-500 transition-colors rounded-sm placeholder:text-stone-300"
                            placeholder="Define the project intent, core pillars, and desired outcomes..."
                         />
                      </section>

                      <section className="space-y-6">
                         <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-2">
                            <div className="flex items-center gap-2">
                                <ListChecks size={14} className="text-stone-400" />
                                <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Execution Plan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setTaskViewMode(taskViewMode === 'list' ? 'calendar' : 'list')} className="text-stone-400 hover:text-nous-text transition-colors" title={taskViewMode === 'list' ? "Calendar View" : "List View"}>
                                    {taskViewMode === 'list' ? <CalendarDays size={12} /> : <ListChecks size={12} />}
                                </button>
                                <button onClick={handleAutoPlan} disabled={isPlanning} className={`text-stone-400 hover:text-emerald-500 transition-colors ${isPlanning ? 'animate-pulse' : ''}`} title="Manifest Plan with AI">
                                    <Sparkles size={12} />
                                </button>
                            </div>
                         </div>

                         <div className="space-y-2">
                            <div className="flex gap-2">
                                <input 
                                    value={newTaskText} 
                                    onChange={e => setNewTaskText(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                                    placeholder="Add imperative..." 
                                    className="flex-1 bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-xs focus:outline-none focus:border-emerald-500" 
                                />
                                <input 
                                    type="date" 
                                    value={newTaskDate} 
                                    onChange={e => setNewTaskDate(e.target.value)} 
                                    className="w-24 bg-transparent border-b border-stone-200 dark:border-stone-800 py-2 font-mono text-[10px] focus:outline-none focus:border-emerald-500 text-stone-500"
                                />
                                <button onClick={handleAddTask} disabled={!newTaskText.trim()} className="text-stone-400 hover:text-nous-text disabled:opacity-30"><Plus size={14} /></button>
                            </div>
                         </div>

                         {taskViewMode === 'list' ? (
                             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                <AnimatePresence>
                                    {tasks.map(task => (
                                        <motion.div 
                                            key={task.id} 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }} 
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-start gap-3 group"
                                        >
                                            <button onClick={() => toggleTask(task.id)} className={`mt-0.5 w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-emerald-500'}`}>
                                                {task.completed && (
                                                    <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} viewBox="0 0 24 24" className="w-3 h-3 text-white stroke-current stroke-[3] fill-none">
                                                        <motion.path d="M20 6L9 17l-5-5" />
                                                    </motion.svg>
                                                )}
                                            </button>
                                            <div className="flex-1 flex flex-col">
                                                <span className={`font-serif italic text-sm transition-all ${task.completed ? 'text-stone-300 line-through' : 'text-stone-600 dark:text-stone-300'}`}>{task.text}</span>
                                                {task.dueDate && <span className="font-mono text-[8px] text-stone-400 flex items-center gap-1"><Clock size={8} /> {new Date(task.dueDate).toLocaleDateString()}</span>}
                                            </div>
                                            <button onClick={() => setTaskToDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all"><X size={12} /></button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {tasks.length === 0 && <p className="text-center font-serif italic text-xs text-stone-300 py-4">No active mandates.</p>}
                             </div>
                         ) : (
                             <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm p-4 max-h-[400px] overflow-y-auto no-scrollbar">
                                 {Object.keys(tasksByDate).length === 0 && <p className="text-center font-serif italic text-xs text-stone-400">Timeline Empty.</p>}
                                 {Object.entries(tasksByDate).sort().map(([date, groupTasks]) => (
                                     <div key={date} className="mb-6 last:mb-0">
                                         <div className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 border-b border-stone-200 dark:border-stone-700 pb-1 mb-2 sticky top-0 bg-stone-50 dark:bg-stone-900 z-10">
                                             {date === 'Unscheduled' ? 'Backlog' : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                         </div>
                                         <div className="space-y-2">
                                             {groupTasks.map(t => (
                                                 <div key={t.id} className={`p-2 border rounded-sm text-xs font-serif ${t.completed ? 'bg-emerald-500/10 border-emerald-500/20 text-stone-400 line-through' : 'bg-white dark:bg-black border-stone-200 dark:border-stone-800'}`}>
                                                     {t.text}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                      </section>
                   </div>

                   {/* RIGHT COL: ARTIFACT GRID */}
                   <div className="lg:col-span-8">
                      <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-4 mb-8">
                         <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Visual Evidence ({artifacts.length})</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                         <AnimatePresence>
                            {artifacts.map(art => (
                               <motion.div 
                                 key={art.id} 
                                 layout
                                 initial={{ opacity: 0, scale: 0.9 }} 
                                 animate={{ opacity: 1, scale: 1 }}
                                 onClick={() => setActiveArtifact(art)}
                                 className="group relative aspect-[3/4] bg-stone-100 dark:bg-stone-900 cursor-pointer overflow-hidden rounded-sm border border-transparent hover:border-emerald-500 transition-all"
                               >
                                  {art.elements[0].type === 'image' ? (
                                     <img src={art.elements[0].content} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                  ) : (
                                     <div className="w-full h-full p-6 flex flex-col justify-center bg-white dark:bg-stone-800">
                                        <Quote size={24} className="text-stone-300 mb-4" />
                                        <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 line-clamp-4">"{art.elements[0].content}"</p>
                                     </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                     <span className="font-mono text-[8px] text-white uppercase tracking-widest truncate block">{art.title}</span>
                                  </div>
                               </motion.div>
                            ))}
                         </AnimatePresence>
                         {artifacts.length === 0 && (
                            <div className="col-span-full py-24 text-center opacity-30 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-sm">
                               <LayoutGrid size={32} className="mx-auto mb-4" />
                               <p className="font-serif italic text-lg">No artifacts found.</p>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 opacity-40">
                <Briefcase size={64} strokeWidth={1} />
                <div className="space-y-2">
                   <h3 className="font-serif italic text-3xl">Select a Project Dossier.</h3>
                   <p className="font-sans text-[9px] uppercase tracking-widest font-black">Or initialize a new container from the registry.</p>
                </div>
             </div>
           )}
        </main>
      </div>

      {/* NEW FOLDER MODAL */}
      <AnimatePresence>
         {showNewFolder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white dark:bg-stone-900 p-10 rounded-sm shadow-2xl max-w-sm w-full space-y-8 border border-stone-200 dark:border-stone-800">
                   <div className="text-center space-y-2">
                      <FolderPlus size={32} className="mx-auto text-emerald-500" />
                      <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">New Dossier.</h3>
                   </div>
                   <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Project Name..." className="w-full border-b-2 border-stone-200 dark:border-stone-700 bg-transparent py-2 text-center font-mono text-lg focus:outline-none focus:border-emerald-500 transition-colors" autoFocus />
                   <div className="flex gap-4">
                      <button onClick={() => setShowNewFolder(false)} className="flex-1 py-3 text-stone-400 hover:text-stone-600 font-sans text-[9px] uppercase font-black tracking-widest">Cancel</button>
                      <button onClick={handleCreateFolder} className="flex-[2] py-3 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase font-black tracking-widest shadow-xl hover:scale-105 transition-transform">Initialize</button>
                   </div>
                </div>
            </motion.div>
         )}
         
         {showNoteModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white dark:bg-stone-900 p-8 rounded-sm shadow-2xl max-w-lg w-full space-y-6 border border-stone-200 dark:border-stone-800">
                   <div className="flex justify-between items-center">
                      <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">New Field Note.</h3>
                      <button onClick={() => setShowNoteModal(false)}><X size={20} className="text-stone-400" /></button>
                   </div>
                   <div className="space-y-4">
                      <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Note Title..." className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-3 font-mono text-sm focus:outline-none focus:border-emerald-500 rounded-sm" />
                      <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Capture thought..." className="w-full h-48 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-4 font-serif italic text-base focus:outline-none focus:border-emerald-500 rounded-sm resize-none" />
                   </div>
                   <button onClick={handleSaveNote} disabled={isSavingNote || !noteContent.trim()} className="w-full py-4 bg-emerald-600 text-white rounded-sm font-sans text-[9px] uppercase font-black tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors disabled:opacity-50">
                      {isSavingNote ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Anchor Note
                   </button>
                </div>
            </motion.div>
         )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleManualUpload} />
    </div>
  );
};
