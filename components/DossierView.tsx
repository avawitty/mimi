// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { fetchDossierFolders, fetchDossierArtifacts, createDossierFolder, createDossierArtifactFromImage, createDossierArtifactFromText, updateDossierFolder, fetchPocketItems } from '../services/firebase';
import { DossierFolder, DossierArtifact, FruitionTrajectory, Task, UserProfile } from '../types';
import { Briefcase, Folder, Plus, ChevronRight, FileText, Share2, Layout, ArrowRight, Loader2, X, Archive, Eye, Trash2, Globe, ExternalLink, Upload, ImageIcon, HeartHandshake, FolderOpen, LayoutGrid, FolderPlus, PenTool, Save, Quote, Info, StickyNote, Compass, Map, Terminal, Check, Calendar, AlertTriangle, ListChecks, Sparkles, Clock, Target, CalendarDays, GripVertical, Users, UserPlus, Search, Cpu, Activity, Lock } from 'lucide-react';
import { DossierArtifactView } from './DossierArtifactView';
import { MoodboardComposer } from './MoodboardComposer';
import { CollabModal } from './CollabModal';
import { generateStrategicBlueprint, generateProjectTasks, generateFolderTasks } from '../services/geminiService';
import { db } from '../services/firebaseInit';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firebaseUtils';

export default function DossierView() {
  const { user, profile } = useUser();
  const [folders, setFolders] = useState<DossierFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<DossierFolder | null>(null);
  const [artifacts, setArtifacts] = useState<DossierArtifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<DossierArtifact | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [folderSearchTerm, setFolderSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'moodboard'>('grid');
  const [showImportModal, setShowImportModal] = useState(false);
  const [pocketItems, setPocketItems] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
  const [selectedPocketItemIds, setSelectedPocketItemIds] = useState<string[]>([]);
  const [isSelectingForMoodboard, setIsSelectingForMoodboard] = useState(false);
  const [isSelectingFromPocketForMoodboard, setIsSelectingFromPocketForMoodboard] = useState(false);
  const [moodboardTitle, setMoodboardTitle] = useState('');
  const [isSavingMoodboard, setIsSavingMoodboard] = useState(false);

  // Collaborator State
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabSearchTerm, setCollabSearchTerm] = useState('');
  const [collabSearchResults, setCollabSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingCollab, setIsSearchingCollab] = useState(false);
  const [collabProfiles, setCollabProfiles] = useState<UserProfile[]>([]);

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
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);

  // Task Management State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar'>('list');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFolders = async () => {
    if (folders.length === 0) setLoadingFolders(true);
    try {
      const data = await fetchDossierFolders(user?.uid || 'ghost');
      setFolders(data || []);
    } catch (e) {
      console.error("Dossier Registry Obscured:", e);
    } finally { setLoadingFolders(false); }
  };

  const loadArtifacts = async (folderId: string) => {
    setLoadingArtifacts(true);
    try {
      const data = await fetchDossierArtifacts(folderId);
      setArtifacts(data || []);
    } catch (e) {
      console.error("Artifact Extraction Failed:", e);
    } finally { setLoadingArtifacts(false); }
  };

  useEffect(() => { loadFolders(); }, [user]);

  useEffect(() => {
    if (activeFolder) {
        loadArtifacts(activeFolder.id);
        setFolderMemo(activeFolder.notes || '');
        setTasks(activeFolder.tasks || []);
        loadCollaboratorProfiles(activeFolder.collaborators || []);
    }
    else {
        setArtifacts([]);
        setFolderMemo('');
        setTasks([]);
        setCollabProfiles([]);
    }
  }, [activeFolder]);

  const loadCollaboratorProfiles = async (uids: string[]) => {
      if (!uids.length) {
          setCollabProfiles([]);
          return;
      }
      try {
          // Chunking to avoid 'in' query limits (max 10)
          const chunks = [];
          for (let i = 0; i < uids.length; i += 10) {
              chunks.push(uids.slice(i, i + 10));
          }
          
          let profiles: UserProfile[] = [];
          for (const chunk of chunks) {
              const q = query(collection(db, 'profiles'), where('uid', 'in', chunk));
              try {
                const snap = await getDocs(q);
                profiles = [...profiles, ...snap.docs.map(d => d.data() as UserProfile)];
              } catch (e) {
                handleFirestoreError(e, OperationType.LIST, 'profiles');
              }
          }
          setCollabProfiles(profiles);
      } catch (e) {
          console.error("Failed to load collaborator profiles", e);
      }
  };

  const handleSearchCollaborators = async () => {
      if (!collabSearchTerm.trim()) return;
      setIsSearchingCollab(true);
      try {
          // Simple prefix search on handle
          const q = query(
              collection(db, 'profiles'), 
              where('handle', '>=', collabSearchTerm.toLowerCase()),
              where('handle', '<=', collabSearchTerm.toLowerCase() + '\uf8ff')
          );
          try {
            const snap = await getDocs(q);
            const results = snap.docs.map(d => d.data() as UserProfile).filter(p => p.uid !== user?.uid);
            setCollabSearchResults(results);
          } catch (e) {
            handleFirestoreError(e, OperationType.LIST, 'profiles');
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSearchingCollab(false);
      }
  };

  const handleAddCollaborator = async (collabUid: string) => {
      if (!activeFolder) return;
      const currentCollabs = activeFolder.collaborators || [];
      if (currentCollabs.includes(collabUid)) return;
      
      const updatedCollabs = [...currentCollabs, collabUid];
      try {
          await updateDossierFolder(activeFolder.id, { collaborators: updatedCollabs });
          setActiveFolder({ ...activeFolder, collaborators: updatedCollabs });
          setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, collaborators: updatedCollabs } : f));
          loadCollaboratorProfiles(updatedCollabs);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Collaborator Added.", icon: <UserPlus size={14} /> } }));
      } catch (e) {
          console.error(e);
      }
  };

  const handleRemoveCollaborator = async (collabUid: string) => {
      if (!activeFolder) return;
      const updatedCollabs = (activeFolder.collaborators || []).filter(id => id !== collabUid);
      try {
          await updateDossierFolder(activeFolder.id, { collaborators: updatedCollabs });
          setActiveFolder({ ...activeFolder, collaborators: updatedCollabs });
          setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, collaborators: updatedCollabs } : f));
          loadCollaboratorProfiles(updatedCollabs);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Collaborator Removed.", icon: <Trash2 size={14} /> } }));
      } catch (e) {
          console.error(e);
      }
  };

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
          const res = await generateStrategicBlueprint(artifacts, folderMemo, profile);
          setActiveBlueprint(res);
          setShowBlueprintModal(true);
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

  const handleGenerateTasks = async () => {
      if (!activeFolder || isPlanning) return;
      setIsPlanning(true);
      try {
          const generatedTasks = await generateFolderTasks(activeFolder.name, folderMemo, artifacts);
          if (generatedTasks && generatedTasks.length > 0) {
              const newTasks = generatedTasks.map(t => ({
                  id: `task_${Date.now()}_${Math.random()}`,
                  text: t.title + ': ' + t.description,
                  completed: false,
                  dueDate: t.dueDate,
                  createdAt: Date.now()
              }));
              const mergedTasks = [...tasks, ...newTasks];
              setTasks(mergedTasks);
              await updateDossierFolder(activeFolder.id, { tasks: mergedTasks });
              setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, tasks: mergedTasks } : f));
              window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Tasks Manifested.", icon: <Sparkles size={14} /> } }));
          }
      } catch (e) {
          console.error("Task Generation Failed", e);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "The Strategist was obstructed.", type: 'error' } }));
      } finally {
          setIsPlanning(false);
      }
  };

  const handleVent = () => {
    window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'sanctuary' }));
  };

  const handleGenerateFinalZine = () => {
    if (!activeFolder) return;
    
    const textContext = artifacts
      .filter(a => a.type === 'text')
      .map(a => `[${a.title}]: ${a.content}`)
      .join('\n\n');
      
    const fullContext = `PROJECT: ${activeFolder.name}\nMEMO: ${folderMemo}\n\nARTIFACTS:\n${textContext}`;
    
    const initialMedia = artifacts
      .filter(a => a.type === 'image' && a.content)
      .map(a => ({
        type: 'image',
        data: a.content,
        mimeType: 'image/jpeg'
      }));

    window.dispatchEvent(new CustomEvent('mimi:change_view', { 
      detail: 'studio', 
      detail_data: { 
        context: fullContext, 
        initialMedia: initialMedia,
        isHighFidelity: true 
      } 
    }));
  };

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(folderSearchTerm.toLowerCase()));

  const handleExportFolder = () => {
    if (!activeFolder) return;
    const data = {
      folder: activeFolder,
      artifacts: artifacts,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mimi-dossier-${activeFolder.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Dossier Exported.", icon: <Archive size={14} /> } }));
  };

  const handleOpenImport = async () => {
    setShowImportModal(true);
    setIsImporting(true);
    try {
      const items = await fetchPocketItems(user?.uid || 'ghost');
      setPocketItems(items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportItem = async (item: any) => {
    if (!activeFolder) return;
    try {
      if (item.type === 'image' || item.type === 'zine_card') {
        await createDossierArtifactFromImage(user?.uid || 'ghost', activeFolder.id, item.content.prompt || item.content.title || 'Imported Shard', item.content.imageUrl);
      } else if (item.type === 'voicenote' || item.type === 'audio') {
        // For now, we'll just treat audio as a text artifact with the URL or similar if we don't have a specific audio artifact type yet
        await createDossierArtifactFromText(user?.uid || 'ghost', activeFolder.id, item.content.prompt || 'Sonic Shard', `Audio Source: ${item.content.audioUrl}`);
      }
      await loadArtifacts(activeFolder.id);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Shard Imported.", icon: <Check size={14} /> } }));
    } catch (e) {
      console.error(e);
    }
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

  const handleFinalizeMoodboard = async (elements: any[], config: any) => {
    if (!user) return;
    setIsSavingMoodboard(true);
    try {
      const moodboardItem: any = {
        id: `mood_${Date.now()}`,
        userId: user.uid,
        title: moodboardTitle || 'Untitled Moodboard',
        source: 'Dossier Composer',
        timestamp: Date.now(),
        savedAt: Date.now(),
        type: 'moodboard',
        content: {
          title: moodboardTitle || 'Untitled Moodboard',
          artifactIds: selectedArtifactIds,
          pocketItemIds: selectedPocketItemIds,
          elements,
          config
        }
      };
      
      const { savePocketItem } = await import('../services/firebase');
      await savePocketItem(moodboardItem);
      
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Moodboard Manifested in Archive.", icon: <Check size={14} className="text-emerald-500" /> } 
      }));
      
      setViewMode('grid');
      setIsSelectingForMoodboard(false);
      setIsSelectingFromPocketForMoodboard(false);
      setSelectedArtifactIds([]);
      setSelectedPocketItemIds([]);
      setMoodboardTitle('');
    } catch (e) {
      console.error("MIMI // Moodboard Manifestation Failed:", e);
    } finally {
      setIsSavingMoodboard(false);
    }
  };

  const toggleArtifactSelection = (id: string) => {
    setSelectedArtifactIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const togglePocketItemSelection = (id: string) => {
    setSelectedPocketItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startMoodboardCreation = () => {
    if (selectedArtifactIds.length === 0 && selectedPocketItemIds.length === 0) {
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Select fragments first.", icon: <X size={14} className="text-red-500" /> } 
      }));
      return;
    }
    setViewMode('moodboard');
  };

  const selectedArtifactsAsPocketItems = React.useMemo(() => {
    const fromArtifacts = artifacts
      .filter(a => selectedArtifactIds.includes(a.id))
      .map(a => ({
        id: a.id,
        userId: a.userId,
        title: a.title,
        source: 'Dossier',
        timestamp: a.createdAt,
        savedAt: a.createdAt,
        type: a.elements[0]?.type === 'image' ? 'image' : 'text',
        content: a.elements[0]?.type === 'image' ? { imageUrl: a.elements[0].content } : { text: a.elements[0].content },
        notes: a.elements[0]?.notes
      }));

    const fromPocket = pocketItems
      .filter(p => selectedPocketItemIds.includes(p.id))
      .map(p => ({ ...p }));

    return [...fromArtifacts, ...fromPocket];
  }, [artifacts, selectedArtifactIds, pocketItems, selectedPocketItemIds]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] text-stone-200 font-mono transition-colors duration-1000 overflow-hidden relative">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

      <AnimatePresence>
        {taskToDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-[#111] p-8 rounded-sm shadow-2xl max-w-sm w-full space-y-6 border border-stone-800">
                    <div className="space-y-2">
                        <h3 className="font-serif italic text-xl text-stone-200">Purge Imperative?</h3>
                        <p className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setTaskToDelete(null)} className="flex-1 py-3 text-stone-500 hover:text-stone-300 font-mono text-[9px] uppercase tracking-widest font-bold border border-stone-800 hover:border-stone-600 transition-all">Cancel</button>
                        <button onClick={confirmDeleteTask} className="flex-1 py-3 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 rounded-sm font-mono text-[9px] uppercase tracking-widest font-bold transition-all">Confirm</button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden z-10">
        
        {/* SIDEBAR: FOLDERS */}
        <aside className="w-72 border-r border-stone-800 bg-[#0a0a0a]/90 backdrop-blur-md flex flex-col hidden md:flex shrink-0">
           <div className="p-6 border-b border-stone-800 space-y-6">
              <div className="flex items-center gap-3 text-emerald-500">
                 <Briefcase size={14} />
                 <span className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold">Project Registry</span>
              </div>
              
              <div className="relative group">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  value={folderSearchTerm}
                  onChange={e => setFolderSearchTerm(e.target.value)}
                  placeholder="Filter Dossiers..."
                  className="w-full pl-9 pr-4 py-2.5 bg-stone-900/50 border border-stone-800 rounded-sm font-mono text-[10px] focus:outline-none focus:border-emerald-500/50 transition-all text-stone-300 placeholder:text-stone-700"
                />
              </div>

              <button 
                onClick={() => setShowNewFolder(true)}
                className="w-full py-3 border border-dashed border-stone-800 hover:border-emerald-500/50 rounded-sm font-mono text-[9px] uppercase tracking-widest font-bold text-stone-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 group"
              >
                 <Plus size={12} className="group-hover:rotate-90 transition-transform" /> Initialize Project
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
              {loadingFolders ? (
                 <div className="p-8 text-center"><Loader2 size={16} className="animate-spin mx-auto text-stone-600" /></div>
              ) : (
                 filteredFolders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => setActiveFolder(folder)}
                      className={`w-full text-left px-4 py-3 border border-transparent rounded-sm transition-all group relative overflow-hidden ${activeFolder?.id === folder.id ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'hover:bg-stone-900 hover:border-stone-800 text-stone-500'}`}
                    >
                       <div className="flex justify-between items-start relative z-10">
                           <h4 className={`font-serif italic text-sm truncate pr-4 transition-colors ${activeFolder?.id === folder.id ? 'text-emerald-400' : 'group-hover:text-stone-300'}`}>{folder.name}</h4>
                           <span className="font-mono text-[8px] opacity-50">{new Date(folder.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
                       </div>
                       {activeFolder?.id === folder.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500" />}
                    </button>
                 ))
              )}
              {filteredFolders.length === 0 && folderSearchTerm && (
                <div className="p-8 text-center opacity-30 font-mono text-[9px] uppercase tracking-widest text-stone-500">No matches found.</div>
              )}
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#050505]">
           
           {/* MOBILE FOLDER SELECTOR */}
           <div className="md:hidden p-4 border-b border-stone-800 bg-stone-900 flex gap-2 items-center">
               <select 
                   className="flex-1 bg-transparent font-serif italic text-lg outline-none text-stone-200"
                   value={activeFolder?.id || ''}
                   onChange={(e) => {
                       if (e.target.value === 'new') {
                           setShowNewFolder(true);
                       } else {
                           const folder = folders.find(f => f.id === e.target.value);
                           if (folder) setActiveFolder(folder);
                       }
                   }}
               >
                   <option value="" disabled>Select Dossier...</option>
                   {folders.map(f => (
                       <option key={f.id} value={f.id}>{f.name}</option>
                   ))}
                   <option value="new">+ New Dossier</option>
               </select>
           </div>

           {activeFolder ? (
             <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12 pb-32">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start gap-6 border-b border-stone-800 pb-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 text-emerald-500">
                         <FolderOpen size={14} />
                         <span className="font-mono text-[9px] uppercase tracking-[0.4em] font-bold">Active Dossier</span>
                      </div>
                      <h2 className="font-serif text-4xl md:text-6xl italic tracking-tighter text-stone-100 leading-none">{activeFolder.name}</h2>
                   </div>
                   <div className="flex flex-wrap gap-2 md:gap-4">
                      <button onClick={() => setShowCollabModal(true)} className="p-3 border border-stone-800 rounded-full hover:border-emerald-500 hover:text-emerald-500 text-stone-500 transition-all" title="Manage Collaborators">
                         <Users size={16} />
                      </button>
                      <button onClick={handleOpenImport} className="p-3 border border-stone-800 rounded-full hover:border-emerald-500 hover:text-emerald-500 text-stone-500 transition-all" title="Import from Archival">
                         <Archive size={16} />
                      </button>
                      <button onClick={handleExportFolder} className="p-3 border border-stone-800 rounded-full hover:border-emerald-500 hover:text-emerald-500 text-stone-500 transition-all" title="Export Dossier">
                         <Upload size={16} className="rotate-180" />
                      </button>
                      <button onClick={handleGenerateBlueprint} disabled={isGeneratingBlueprint} className="p-3 border border-stone-800 rounded-full hover:border-emerald-500 hover:text-emerald-500 text-stone-500 transition-all group" title="Generate Strategic Blueprint">
                         {isGeneratingBlueprint ? <Loader2 size={16} className="animate-spin" /> : <Compass size={16} />}
                      </button>
                      <button onClick={() => setShowNoteModal(true)} className="p-3 border border-stone-800 rounded-full hover:border-emerald-500 hover:text-emerald-500 text-stone-500 transition-all" title="Add Note">
                         <StickyNote size={16} />
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 border border-stone-800 text-stone-300 rounded-full font-mono text-[9px] uppercase tracking-widest font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center gap-2">
                         <Upload size={12} /> Add Artifact
                      </button>
                      <button onClick={handleGenerateFinalZine} className="px-6 py-3 bg-emerald-500 text-black rounded-full font-mono text-[9px] uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 transition-all flex items-center gap-2">
                         <Sparkles size={12} /> Compile to Studio
                      </button>
                   </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   
                   {/* LEFT COL: STRATEGY & TASKS */}
                   <div className="lg:col-span-4 space-y-12">
                      <section className="space-y-4">
                         <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-500">Strategic Memo</span>
                            {isSavingMemo ? <Loader2 size={10} className="animate-spin text-emerald-500" /> : <Save size={12} className="cursor-pointer text-stone-600 hover:text-emerald-500 transition-colors" onClick={handleSaveFolderMemo} />}
                         </div>
                         <div className="relative group">
                             <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-sm blur-sm" />
                             <textarea 
                                value={folderMemo}
                                onChange={(e) => setFolderMemo(e.target.value)}
                                onBlur={handleSaveFolderMemo}
                                className="w-full h-40 bg-stone-900/50 border border-stone-800 p-4 font-serif italic text-sm leading-relaxed resize-none focus:outline-none focus:border-emerald-500/50 transition-colors rounded-sm placeholder:text-stone-700 text-stone-300 relative z-10"
                                placeholder="Define the project intent, core pillars, and desired outcomes..."
                             />
                         </div>
                      </section>

                      <section className="space-y-6">
                         <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                            <div className="flex items-center gap-2">
                                <ListChecks size={14} className="text-stone-500" />
                                <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-500">Execution Plan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setTaskViewMode(taskViewMode === 'list' ? 'calendar' : 'list')} className="text-stone-600 hover:text-emerald-500 transition-colors" title={taskViewMode === 'list' ? "Calendar View" : "List View"}>
                                    {taskViewMode === 'list' ? <CalendarDays size={12} /> : <ListChecks size={12} />}
                                </button>
                                <button onClick={handleAutoPlan} disabled={isPlanning} className={`text-stone-600 hover:text-emerald-500 transition-colors ${isPlanning ? 'animate-pulse' : ''}`} title="Manifest Plan with AI">
                                    <Sparkles size={12} />
                                </button>
                                <button onClick={handleGenerateTasks} disabled={isPlanning} className={`text-stone-600 hover:text-emerald-500 transition-colors ${isPlanning ? 'animate-pulse' : ''}`} title="Generate Tasks with AI">
                                    <ListChecks size={12} />
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
                                    className="flex-1 bg-transparent border-b border-stone-800 py-2 font-mono text-xs focus:outline-none focus:border-emerald-500 text-stone-300 placeholder:text-stone-700" 
                                />
                                <input 
                                    type="date" 
                                    value={newTaskDate} 
                                    onChange={e => setNewTaskDate(e.target.value)} 
                                    className="w-24 bg-transparent border-b border-stone-800 py-2 font-mono text-[10px] focus:outline-none focus:border-emerald-500 text-stone-500"
                                />
                                <button onClick={handleAddTask} disabled={!newTaskText.trim()} className="text-stone-600 hover:text-emerald-500 disabled:opacity-30"><Plus size={14} /></button>
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
                                            <button onClick={() => toggleTask(task.id)} className={`mt-0.5 w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-700 hover:border-emerald-500'}`}>
                                                {task.completed && (
                                                    <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} viewBox="0 0 24 24" className="w-3 h-3 text-black stroke-current stroke-[3] fill-none">
                                                        <motion.path d="M20 6L9 17l-5-5" />
                                                    </motion.svg>
                                                )}
                                            </button>
                                            <div className="flex-1 flex flex-col">
                                                <span className={`font-serif italic text-sm transition-all ${task.completed ? 'text-stone-600 line-through' : 'text-stone-300'}`}>{task.text}</span>
                                                {task.dueDate && <span className="font-mono text-[8px] text-stone-500 flex items-center gap-1"><Clock size={8} /> {new Date(task.dueDate).toLocaleDateString()}</span>}
                                            </div>
                                            <button onClick={() => setTaskToDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-500 transition-all"><X size={12} /></button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {tasks.length === 0 && <p className="text-center font-serif italic text-xs text-stone-600 py-4">No active mandates.</p>}
                             </div>
                         ) : (
                             <div className="bg-stone-900/30 border border-stone-800 rounded-sm p-4 max-h-[400px] overflow-y-auto no-scrollbar">
                                 {Object.keys(tasksByDate).length === 0 && <p className="text-center font-serif italic text-xs text-stone-600">Timeline Empty.</p>}
                                 {Object.entries(tasksByDate).sort().map(([date, groupTasks]) => (
                                     <div key={date} className="mb-6 last:mb-0">
                                         <div className="font-mono text-[8px] uppercase tracking-widest font-bold text-stone-500 border-b border-stone-800 pb-1 mb-2 sticky top-0 bg-[#0a0a0a] z-10">
                                             {date === 'Unscheduled' ? 'Backlog' : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                         </div>
                                         <div className="space-y-2">
                                             {groupTasks.map(t => (
                                                 <div key={t.id} className={`p-2 border rounded-sm text-xs font-serif ${t.completed ? 'bg-emerald-500/5 border-emerald-500/10 text-stone-600 line-through' : 'bg-stone-900 border-stone-800 text-stone-300'}`}>
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
                      <div className="flex justify-between items-center border-b border-stone-800 pb-4 mb-8">
                         <div className="flex items-center gap-4">
                            <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-500">Visual Evidence ({artifacts.length})</span>
                            {isSelectingForMoodboard && (
                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                                    <span className="font-mono text-[8px] text-emerald-500 uppercase tracking-widest font-bold">
                                        {selectedArtifactIds.length + selectedPocketItemIds.length} Selected
                                    </span>
                                </div>
                            )}
                          </div>
                         <div className="flex items-center gap-4">
                            {loadingArtifacts && <Loader2 size={14} className="animate-spin text-stone-500" />}
                            
                            {isSelectingForMoodboard ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  value={moodboardTitle}
                                  onChange={e => setMoodboardTitle(e.target.value)}
                                  placeholder="Moodboard Title..."
                                  className="bg-transparent border-b border-stone-800 py-1 font-mono text-[10px] focus:outline-none focus:border-emerald-500 text-stone-300 w-32"
                                />
                                <button 
                                  onClick={startMoodboardCreation}
                                  disabled={selectedArtifactIds.length === 0 && selectedPocketItemIds.length === 0}
                                  className="px-3 py-1 bg-emerald-500 text-black rounded-sm font-mono text-[8px] uppercase font-bold tracking-widest disabled:opacity-30"
                                >
                                  Compose ({selectedArtifactIds.length + selectedPocketItemIds.length})
                                </button>
                                <button 
                                  onClick={() => { setIsSelectingForMoodboard(false); setSelectedArtifactIds([]); }}
                                  className="p-2 text-stone-500 hover:text-stone-300"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setIsSelectingForMoodboard(true)}
                                className="flex items-center gap-2 px-3 py-1 border border-stone-800 rounded-sm text-stone-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all font-mono text-[8px] uppercase tracking-widest"
                              >
                                <Plus size={12} /> Create Moodboard
                              </button>
                            )}

                            <div className="w-px h-4 bg-stone-800 mx-2" />

                            <button 
                              onClick={() => setViewMode('grid')}
                              className={`p-2 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-stone-800 text-emerald-500' : 'text-stone-600 hover:text-stone-400'}`}
                            >
                               <LayoutGrid size={14} />
                            </button>
                            <button 
                              onClick={() => setViewMode('moodboard')}
                              className={`p-2 rounded-sm transition-all ${viewMode === 'moodboard' ? 'bg-stone-800 text-emerald-500' : 'text-stone-600 hover:text-stone-400'}`}
                            >
                               <Layout size={14} />
                            </button>
                         </div>
                      </div>
                      
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                           <AnimatePresence>
                              {artifacts.map(art => (
                                 <motion.div 
                                   key={art.id} 
                                   layout
                                   initial={{ opacity: 0, scale: 0.9 }} 
                                   animate={{ opacity: 1, scale: 1 }}
                                   onClick={() => isSelectingForMoodboard ? toggleArtifactSelection(art.id) : setActiveArtifact(art)}
                                   className={`group relative aspect-[3/4] bg-stone-900 cursor-pointer overflow-hidden rounded-sm border transition-all ${
                                     isSelectingForMoodboard && selectedArtifactIds.includes(art.id) 
                                       ? 'border-emerald-500 ring-1 ring-emerald-500/50' 
                                       : 'border-stone-800 hover:border-emerald-500/50'
                                   }`}
                                 >
                                    {isSelectingForMoodboard && (
                                      <div className={`absolute top-2 right-2 z-20 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                        selectedArtifactIds.includes(art.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-black/40 border-white/20'
                                      }`}>
                                        {selectedArtifactIds.includes(art.id) && <Check size={10} className="text-black" />}
                                      </div>
                                    )}
                                    {art.elements[0].type === 'image' ? (
                                       <img src={art.elements[0].content} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                                    ) : (
                                       <div className="w-full h-full p-6 flex flex-col justify-center bg-stone-900">
                                          <Quote size={24} className="text-stone-700 mb-4" />
                                          <p className="font-serif italic text-sm text-stone-400 line-clamp-4">"{art.elements[0].content}"</p>
                                       </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                       <span className="font-mono text-[8px] text-emerald-400 uppercase tracking-widest truncate block">{art.title}</span>
                                    </div>
                                 </motion.div>
                              ))}
                           </AnimatePresence>
                           {artifacts.length === 0 && (
                              <div className="col-span-full py-24 text-center opacity-20 border border-dashed border-stone-800 rounded-sm">
                                 <LayoutGrid size={32} className="mx-auto mb-4 text-stone-500" />
                                 <p className="font-serif italic text-lg text-stone-500">No artifacts found.</p>
                              </div>
                           )}
                        </div>
                      ) : (
                        <MoodboardComposer 
                            selectedItems={selectedArtifactsAsPocketItems} 
                            onCancel={() => setViewMode('grid')}
                            onFinalize={handleFinalizeMoodboard}
                        />
                      )}
                   </div>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 opacity-20">
                <Briefcase size={64} strokeWidth={1} className="text-stone-500" />
                <div className="space-y-2">
                   <h3 className="font-serif italic text-3xl text-stone-400">Select a Project Dossier.</h3>
                   <p className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-600">Or initialize a new container from the registry.</p>
                </div>
             </div>
           )}
        </main>
      </div>

      {/* NEW FOLDER MODAL */}
      <AnimatePresence>
         {showNewFolder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-[#111] p-10 rounded-sm shadow-2xl max-w-sm w-full space-y-8 border border-stone-800 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-50" />
                   <div className="text-center space-y-2">
                      <FolderPlus size={32} className="mx-auto text-emerald-500" />
                      <h3 className="font-serif italic text-2xl text-stone-200">New Dossier.</h3>
                   </div>
                   <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Project Name..." className="w-full border-b border-stone-800 bg-transparent py-2 text-center font-mono text-lg focus:outline-none focus:border-emerald-500 transition-colors text-emerald-500 placeholder:text-stone-700" autoFocus />
                   <div className="flex gap-4">
                      <button onClick={() => setShowNewFolder(false)} className="flex-1 py-3 text-stone-500 hover:text-stone-300 font-mono text-[9px] uppercase font-bold tracking-widest border border-stone-800 hover:border-stone-600 transition-all">Cancel</button>
                      <button onClick={handleCreateFolder} className="flex-[2] py-3 bg-emerald-500 text-black rounded-sm font-mono text-[9px] uppercase font-bold tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 transition-all">Initialize</button>
                   </div>
                </div>
            </motion.div>
         )}
         
         {showNoteModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-[#111] p-8 rounded-sm shadow-2xl max-w-lg w-full space-y-6 border border-stone-800">
                   <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                      <h3 className="font-serif italic text-2xl text-stone-200">New Field Note.</h3>
                      <button onClick={() => setShowNoteModal(false)}><X size={20} className="text-stone-500 hover:text-stone-300" /></button>
                   </div>
                   <div className="space-y-4">
                      <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Note Title..." className="w-full bg-stone-900/50 border border-stone-800 p-3 font-mono text-sm focus:outline-none focus:border-emerald-500 rounded-sm text-stone-300 placeholder:text-stone-700" />
                      <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Capture thought..." className="w-full h-48 bg-stone-900/50 border border-stone-800 p-4 font-serif italic text-base focus:outline-none focus:border-emerald-500 rounded-sm resize-none text-stone-300 placeholder:text-stone-700" />
                   </div>
                   <button onClick={handleSaveNote} disabled={isSavingNote || !noteContent.trim()} className="w-full py-4 bg-emerald-900/20 border border-emerald-500/50 text-emerald-500 rounded-sm font-mono text-[9px] uppercase font-bold tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-900/40 transition-colors disabled:opacity-50">
                      {isSavingNote ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Anchor Note
                   </button>
                </div>
            </motion.div>
         )}

         {showBlueprintModal && activeBlueprint && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-[#111] p-8 rounded-sm shadow-2xl max-w-2xl w-full space-y-6 border border-stone-800 max-h-[80vh] overflow-y-auto">
                   <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                      <h3 className="font-serif italic text-2xl text-emerald-500">Strategic Blueprint.</h3>
                      <button onClick={() => setShowBlueprintModal(false)}><X size={20} className="text-stone-500 hover:text-stone-300" /></button>
                   </div>
                   <div className="space-y-6 font-mono text-xs text-stone-300">
                      <div><h4 className="text-emerald-500 uppercase tracking-widest mb-1">Inciting Debris</h4><p>{activeBlueprint.inciting_debris}</p></div>
                      <div><h4 className="text-emerald-500 uppercase tracking-widest mb-1">Structural Pivot</h4><p>{activeBlueprint.structural_pivot}</p></div>
                      <div><h4 className="text-emerald-500 uppercase tracking-widest mb-1">Climax Manifest</h4><p>{activeBlueprint.climax_manifest}</p></div>
                      <div><h4 className="text-emerald-500 uppercase tracking-widest mb-1">End Product Spec</h4><p>{activeBlueprint.end_product_spec}</p></div>
                   </div>
                   <button onClick={() => setShowBlueprintModal(false)} className="w-full py-3 border border-stone-800 text-stone-500 hover:text-stone-300 font-mono text-[9px] uppercase font-bold tracking-widest hover:border-stone-600 transition-all">Close</button>
                </div>
            </motion.div>
         )}

         {showImportModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[7000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-[#111] p-8 rounded-sm shadow-2xl max-w-2xl w-full space-y-6 border border-stone-800 flex flex-col max-h-[80vh]">
                   <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                      <div className="space-y-1">
                         <h3 className="font-serif italic text-2xl text-stone-200">Import from Archival.</h3>
                         <p className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-500">Select shards to manifest in this dossier.</p>
                      </div>
                      <button onClick={() => setShowImportModal(false)}><X size={20} className="text-stone-500 hover:text-stone-300" /></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto no-scrollbar min-h-[300px]">
                      {isImporting ? (
                         <div className="h-full flex items-center justify-center"><Loader2 size={24} className="animate-spin text-stone-600" /></div>
                      ) : (
                         <div className="grid grid-cols-2 gap-4">
                            {pocketItems.map(item => (
                               <div 
                                 key={item.id} 
                                 onClick={() => handleImportItem(item)}
                                 className="group relative aspect-video bg-stone-900 border border-stone-800 rounded-sm overflow-hidden cursor-pointer hover:border-emerald-500 transition-all"
                               >
                                  {item.type === 'image' || item.type === 'zine_card' ? (
                                     <img src={item.content.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100" />
                                  ) : (
                                     <div className="w-full h-full p-4 flex flex-col justify-center">
                                        <span className="font-mono text-[8px] uppercase font-bold text-stone-500 mb-1">{item.type}</span>
                                        <p className="font-serif italic text-xs line-clamp-3 text-stone-400">"{item.content.prompt || item.content.text || 'Sonic shard'}"</p>
                                     </div>
                                  )}
                                  <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     <Plus size={24} className="text-white drop-shadow-lg" />
                                  </div>
                               </div>
                            ))}
                            {pocketItems.length === 0 && (
                               <div className="col-span-full py-12 text-center opacity-30 font-serif italic text-stone-500">The Pocket is empty.</div>
                            )}
                         </div>
                      )}
                   </div>
                   
                   <button onClick={() => setShowImportModal(false)} className="w-full py-4 border border-stone-800 rounded-sm font-mono text-[9px] uppercase font-bold tracking-widest hover:bg-stone-900 transition-colors text-stone-400">
                      Close Registry
                   </button>
                </div>
            </motion.div>
         )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleManualUpload} />
    </div>
  );
};
