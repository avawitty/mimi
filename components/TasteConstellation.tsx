import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, Link2, GripVertical, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { getAllShadowMemory } from '../services/vectorSearch';
import { getConstellations, saveConstellation, deleteConstellation } from '../services/constellationService';
import { generateThreadFromConstellation } from '../services/threadService';
import { Constellation, PocketItem } from '../types';

const ItemTypes = {
  ARTIFACT: 'artifact',
};

const DraggableArtifact: React.FC<{ artifact: PocketItem }> = ({ artifact }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ARTIFACT,
    item: { id: artifact.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md cursor-grab active:cursor-grabbing flex items-start gap-3 transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <GripVertical size={16} className="text-stone-400 mt-1 shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-serif italic text-sm truncate">{artifact.title || 'Untitled'}</h4>
        <p className="font-sans text-[10px] text-stone-500 truncate mt-1">{(artifact as any).url || 'No URL'}</p>
      </div>
    </div>
  );
};

const ConstellationDropZone: React.FC<{
  constellation: Constellation;
  artifacts: PocketItem[];
  onDrop: (artifactId: string, constellationId: string) => void;
  onRemoveArtifact: (artifactId: string, constellationId: string) => void;
  onDelete: (id: string) => void;
  onGenerateThread: (constellation: Constellation, artifacts: PocketItem[]) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onClear: (id: string) => void;
}> = ({ constellation, artifacts, onDrop, onRemoveArtifact, onDelete, onGenerateThread, onUpdateDescription, onClear }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.ARTIFACT,
    drop: (item: { id: string }) => onDrop(item.id, constellation.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const constellationArtifacts = artifacts.filter(a => constellation.artifactIds.includes(a.id));

  return (
    <div
      ref={drop as any}
      className={`p-6 border-2 border-dashed rounded-xl transition-colors flex flex-col h-full ${
        isOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50'
      }`}
    >
      <div className="flex justify-between items-center mb-4 border-b border-stone-200 dark:border-stone-800 pb-4 shrink-0">
        <h3 className="font-serif italic text-2xl">{constellation.title}</h3>
        <div className="flex gap-2">
          <button onClick={() => onClear(constellation.id)} className="text-stone-400 hover:text-stone-600 transition-colors">
            Clear
          </button>
          <button onClick={() => onDelete(constellation.id)} className="text-stone-400 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <textarea
        className="w-full bg-transparent font-sans text-xs text-stone-500 mb-6 resize-none outline-none"
        placeholder="Add a description..."
        value={constellation.description || ''}
        onChange={(e) => onUpdateDescription(constellation.id, e.target.value)}
      />
      
      <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar min-h-[100px]">
        {constellationArtifacts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 py-8">
            <Link2 size={24} className="opacity-20 mb-2" />
            <p className="font-sans text-[10px] uppercase tracking-widest">Drop artifacts here</p>
          </div>
        ) : (
          <AnimatePresence>
            {constellationArtifacts.map(artifact => (
              <motion.div
                key={artifact.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-md flex justify-between items-center group"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif italic text-sm truncate">{artifact.title || 'Untitled'}</h4>
                </div>
                <button 
                  onClick={() => onRemoveArtifact(artifact.id, constellation.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all p-1"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      
      {constellationArtifacts.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 shrink-0">
          <button
            onClick={() => onGenerateThread(constellation, constellationArtifacts)}
            className="w-full py-2 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-md font-sans text-xs uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            Generate Narrative Thread
          </button>
        </div>
      )}
    </div>
  );
};

export const TasteConstellation: React.FC = () => {
  const { user } = useUser();
  const [artifacts, setArtifacts] = useState<PocketItem[]>([]);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const [loadedArtifacts, loadedConstellations] = await Promise.all([
          getAllShadowMemory(),
          getConstellations()
        ]);
        setArtifacts(loadedArtifacts as any);
        setConstellations(loadedConstellations);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleCreateConstellation = async () => {
    if (!user?.uid) return;
    const title = prompt("Enter a name for this constellation:");
    if (!title) return;

    const newConstellation: Constellation = {
      id: `constellation_${Date.now()}`,
      userId: user.uid,
      title,
      artifactIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setConstellations(prev => [...prev, newConstellation]);
    try {
      await saveConstellation(newConstellation);
    } catch (e) {
      console.error("MIMI // Failed to save constellation:", e);
    }
  };

  const handleDeleteConstellation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this constellation?")) return;
    setConstellations(prev => prev.filter(c => c.id !== id));
    try {
      await deleteConstellation(id);
    } catch (e) {
      console.error("MIMI // Failed to delete constellation:", e);
    }
  };

  const handleDropArtifact = async (artifactId: string, constellationId: string) => {
    setConstellations(prev => prev.map(c => {
      if (c.id === constellationId) {
        if (c.artifactIds.includes(artifactId)) return c;
        const updated = { ...c, artifactIds: [...c.artifactIds, artifactId], updatedAt: Date.now() };
        saveConstellation(updated).catch(e => console.error("MIMI // Failed to save constellation:", e));
        return updated;
      }
      return c;
    }));
  };

  const handleRemoveArtifact = async (artifactId: string, constellationId: string) => {
    setConstellations(prev => prev.map(c => {
      if (c.id === constellationId) {
        const updated = { ...c, artifactIds: c.artifactIds.filter(id => id !== artifactId), updatedAt: Date.now() };
        saveConstellation(updated).catch(e => console.error("MIMI // Failed to save constellation:", e));
        return updated;
      }
      return c;
    }));
  };

  const handleUpdateDescription = async (id: string, description: string) => {
    setConstellations(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, description, updatedAt: Date.now() };
        saveConstellation(updated).catch(e => console.error("MIMI // Failed to save constellation:", e));
        return updated;
      }
      return c;
    }));
  };

  const handleClearConstellation = async (id: string) => {
    if (!confirm("Are you sure you want to clear all artifacts from this constellation?")) return;
    setConstellations(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, artifactIds: [], updatedAt: Date.now() };
        saveConstellation(updated).catch(e => console.error("MIMI // Failed to save constellation:", e));
        return updated;
      }
      return c;
    }));
  };

  const handleGenerateThread = async (constellation: Constellation, constellationArtifacts: PocketItem[]) => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const thread = await generateThreadFromConstellation(constellation.id, constellation.title, constellationArtifacts);
      if (thread) {
        window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'narrative-threads' }));
      } else {
        alert("Not enough artifacts to generate a thread.");
      }
    } catch (e) {
      console.error("Failed to generate thread:", e);
      alert("Failed to generate thread.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex h-full bg-[#f5f2ed] dark:bg-[#050505] text-stone-900 dark:text-stone-100 overflow-hidden">
        
        {/* Sidebar: Artifacts */}
        <div className="w-64 border-r border-stone-200 dark:border-stone-800 flex flex-col bg-white/50 dark:bg-black/20 shrink-0">
          <div className="p-6 border-b border-stone-200 dark:border-stone-800">
            <h3 className="font-serif italic text-2xl">Artifacts</h3>
            <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500 mt-2">Drag to group</p>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {artifacts.map(artifact => (
              <DraggableArtifact key={artifact.id} artifact={artifact} />
            ))}
          </div>
        </div>

        {/* Main Area: Constellations */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-8 md:p-12 border-b border-stone-200 dark:border-stone-800 flex justify-between items-end shrink-0">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif italic">Taste Constellations</h2>
              <p className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.2em] mt-4">Manual Semantic Grouping</p>
            </div>
            <button 
              onClick={handleCreateConstellation}
              className="flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-black rounded-full hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors font-sans text-[10px] uppercase tracking-widest"
            >
              <Plus size={14} />
              New Constellation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12">
            {constellations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                <Link2 size={32} className="opacity-20" />
                <p className="font-serif italic text-xl">No Constellations</p>
                <p className="font-sans text-[10px] uppercase tracking-widest max-w-md text-center">Create a constellation to start grouping your artifacts manually.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {constellations.map(constellation => (
                  <ConstellationDropZone
                    key={constellation.id}
                    constellation={constellation}
                    artifacts={artifacts}
                    onDrop={handleDropArtifact}
                    onRemoveArtifact={handleRemoveArtifact}
                    onDelete={handleDeleteConstellation}
                    onGenerateThread={handleGenerateThread}
                    onUpdateDescription={handleUpdateDescription}
                    onClear={handleClearConstellation}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
