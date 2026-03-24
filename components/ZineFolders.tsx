import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Plus, Trash2, Edit2, X, Check, Loader2, Search } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { fetchZineFolders, createZineFolder, updateZineFolder, deleteZineFolder, moveZineToFolder, subscribeToUserZines } from '../services/firebaseUtils';
import { getLocalZines } from '../services/localArchive';
import { ZineFolder, ZineMetadata } from '../types';
import { ZineCard } from './ZineCard';

interface ZineFoldersProps {
  onSelectZine: (zine: ZineMetadata) => void;
}

export const ZineFolders: React.FC<ZineFoldersProps> = ({ onSelectZine }) => {
  const { user } = useUser();
  const [folders, setFolders] = useState<ZineFolder[]>([]);
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<ZineFolder | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const loadData = async () => {
      if (!user || user.isAnonymous) {
        setLoading(false);
        return;
      }

      try {
        const fetchedFolders = await fetchZineFolders(user.uid);
        setFolders(fetchedFolders);

        // Load local zines first
        const local = await getLocalZines() || [];
        
        // Subscribe to cloud zines
        unsubscribe = subscribeToUserZines(user.uid, (cloudData) => {
          const registry = new Map<string, ZineMetadata>();
          cloudData.forEach(z => { if (z && z.id) registry.set(z.id, z); });
          local.forEach(z => { if (z && z.id && !registry.has(z.id)) registry.set(z.id, z); });
          
          const merged = Array.from(registry.values())
            .filter(z => z && z.id)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          
          setZines(merged);
          setLoading(false);
        });
      } catch (e) {
        console.error("Error loading folders data:", e);
        setLoading(false);
      }
    };

    loadData();
    return () => unsubscribe();
  }, [user]);

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    
    const folderId = await createZineFolder(user.uid, newFolderName.trim());
    if (folderId) {
      setFolders([...folders, { id: folderId, userId: user.uid, name: newFolderName.trim(), createdAt: Date.now() }]);
      setNewFolderName('');
      setShowCreateModal(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;
    
    const success = await updateZineFolder(editingFolder.id, newFolderName.trim());
    if (success) {
      setFolders(folders.map(f => f.id === editingFolder.id ? { ...f, name: newFolderName.trim() } : f));
      setEditingFolder(null);
      setNewFolderName('');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm("Are you sure you want to delete this folder? Zines inside will be moved to Quick Stash.")) {
      const success = await deleteZineFolder(folderId);
      if (success) {
        setFolders(folders.filter(f => f.id !== folderId));
        if (activeFolder === folderId) setActiveFolder(null);
        
        // Update local state for zines in this folder
        setZines(zines.map(z => z.folderId === folderId ? { ...z, folderId: undefined } : z));
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    const zineId = e.dataTransfer.getData('text/plain');
    if (!zineId) return;

    // Optimistic update
    setZines(zines.map(z => z.id === zineId ? { ...z, folderId: targetFolderId || undefined } : z));
    
    // Server update
    await moveZineToFolder(zineId, targetFolderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent, zineId: string) => {
    e.dataTransfer.setData('text/plain', zineId);
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-stone-300" />
      </div>
    );
  }

  const displayedZines = activeFolder === null 
    ? zines.filter(z => !z.folderId) // Quick Stash (no folder)
    : zines.filter(z => z.folderId === activeFolder);

  return (
    <div className="w-full flex flex-col md:flex-row gap-8">
      {/* Sidebar: Folders List */}
      <div className="w-full md:w-64 shrink-0 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone-400 font-black">Directories</h3>
          <button 
            onClick={() => { setShowCreateModal(true); setNewFolderName(''); }}
            className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-sm hover:bg-emerald-500 hover:text-white transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {/* Quick Stash (Uncategorized) */}
          <div 
            onClick={() => setActiveFolder(null)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
            className={`p-3 rounded-sm flex items-center gap-3 cursor-pointer transition-all ${activeFolder === null ? 'bg-nous-text dark:bg-white text-white dark:text-black shadow-md' : 'bg-stone-50 dark:bg-stone-900/50 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
          >
            <Folder size={16} className={activeFolder === null ? 'text-white dark:text-black' : 'text-stone-400'} />
            <span className="font-sans text-xs font-medium flex-1">Quick Stash</span>
            <span className="text-[10px] opacity-50">{zines.filter(z => !z.folderId).length}</span>
          </div>

          {/* User Folders */}
          {folders.map(folder => (
            <div 
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={`group p-3 rounded-sm flex items-center gap-3 cursor-pointer transition-all ${activeFolder === folder.id ? 'bg-nous-text dark:bg-white text-white dark:text-black shadow-md' : 'bg-stone-50 dark:bg-stone-900/50 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
            >
              <Folder size={16} className={activeFolder === folder.id ? 'text-white dark:text-black' : 'text-stone-400'} />
              <span className="font-sans text-xs font-medium flex-1 truncate">{folder.name}</span>
              <span className="text-[10px] opacity-50 group-hover:hidden">{zines.filter(z => z.folderId === folder.id).length}</span>
              
              {/* Folder Actions */}
              <div className="hidden group-hover:flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setNewFolderName(folder.name); }}
                  className="p-1 hover:text-emerald-500 transition-colors"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                  className="p-1 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Zines Grid */}
      <div className="flex-1 min-w-0">
        <div className="mb-8 border-b border-stone-100 dark:border-stone-800 pb-4">
          <h2 className="font-serif italic text-3xl text-nous-text dark:text-white">
            {activeFolder === null ? 'Quick Stash' : folders.find(f => f.id === activeFolder)?.name || 'Folder'}
          </h2>
          <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400 mt-2">
            {displayedZines.length} {displayedZines.length === 1 ? 'Manifestation' : 'Manifestations'}
          </p>
        </div>

        {displayedZines.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-sm">
            <Folder size={32} className="text-stone-300 mb-4" />
            <p className="font-serif italic text-xl text-stone-500">Empty Directory</p>
            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400 mt-2">Drag and drop zines here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence>
              {displayedZines.map((zine, index) => (
                <motion.div
                  key={zine.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, zine.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <ZineCard zine={zine} onClick={() => onSelectZine(zine)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Folder Modal */}
      <AnimatePresence>
        {(showCreateModal || editingFolder) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-stone-900 w-full max-w-md p-6 rounded-sm shadow-2xl border border-stone-200 dark:border-stone-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif italic text-2xl text-nous-text dark:text-white">
                  {editingFolder ? 'Rename Directory' : 'New Directory'}
                </h3>
                <button 
                  onClick={() => { setShowCreateModal(false); setEditingFolder(null); }}
                  className="text-stone-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 mb-2">Directory Name</label>
                  <input 
                    type="text" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Spring Collection, Brutalist References..."
                    className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-sm font-sans text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editingFolder ? handleUpdateFolder() : handleCreateFolder();
                      }
                    }}
                  />
                </div>
                
                <button 
                  onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="w-full py-3 bg-nous-text dark:bg-white text-white dark:text-black rounded-sm font-sans text-[10px] uppercase tracking-[0.2em] font-black hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {editingFolder ? 'Save Changes' : 'Create Directory'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
