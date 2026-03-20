import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Compass, ArrowRight, Edit2, X, Save, Link2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { db } from '../services/firebaseInit';
import { collection, getDocs } from 'firebase/firestore';
import { Thread, updateThread } from '../services/threadService';

export const NarrativeThreadsView: React.FC = () => {
  const { user } = useUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingThread, setEditingThread] = useState<Thread | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNarrative, setEditNarrative] = useState('');

  const fetchThreads = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const threadsCol = collection(db, `users/${user.uid}/threads`);
      const snapshot = await getDocs(threadsCol);
      const fetchedThreads = snapshot.docs.map(d => d.data() as Thread);
      setThreads(fetchedThreads.sort((a, b) => b.created_at - a.created_at));
    } catch (e) {
      console.error("Error fetching threads:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const handleViewChange = (e: any) => {
      if (e.detail === 'narrative-threads') {
        fetchThreads();
      }
    };
    window.addEventListener('mimi:change_view', handleViewChange);
    return () => window.removeEventListener('mimi:change_view', handleViewChange);
  }, [user]);

  const handleEdit = (thread: Thread) => {
    setEditingThread(thread);
    setEditTitle(thread.title || '');
    setEditNarrative(thread.narrative);
  };

  const handleSave = async () => {
    if (!editingThread) return;
    const updatedThread = { ...editingThread, title: editTitle, narrative: editNarrative };
    await updateThread(updatedThread);
    setThreads(threads.map(t => t.id === updatedThread.id ? updatedThread : t));
    setEditingThread(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f2ed] dark:bg-[#050505] text-stone-900 dark:text-stone-100 font-serif p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <h2 className="text-5xl italic font-serif">Narrative Threads</h2>
          <button onClick={fetchThreads} className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
            <Compass size={20} />
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center gap-4 text-stone-500">
            <Loader2 className="animate-spin" />
            <p className="font-sans text-xs uppercase tracking-widest">Unraveling threads...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-stone-500 italic">No threads manifested yet.</div>
        ) : (
          <div className="space-y-8">
            {threads.map(thread => (
              <motion.div 
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 border border-stone-200 dark:border-stone-800 rounded-sm hover:bg-white/50 dark:hover:bg-stone-900 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl italic">{thread.title || "Untitled Thread"}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(thread)} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => {
                        const shareUrl = `${window.location.origin}/threads/${thread.id}`;
                        navigator.clipboard.writeText(shareUrl);
                        alert("Link copied to clipboard!");
                    }} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
                      <Link2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-stone-600 dark:text-stone-400 mb-6 font-sans text-sm leading-relaxed">{thread.narrative}</p>
                <div className="flex items-center gap-2 text-emerald-600 font-sans text-[10px] uppercase tracking-widest">
                  <span>{thread.mode}</span>
                  <ArrowRight size={12} />
                  <span>{thread.path.length} nodes</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingThread && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-white dark:bg-stone-900 p-8 rounded-sm max-w-lg w-full space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl italic">Edit Thread</h3>
                <button onClick={() => setEditingThread(null)}><X size={20} /></button>
              </div>
              <input 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-2 border border-stone-300 dark:border-stone-700 bg-transparent"
                placeholder="Title"
              />
              <textarea 
                value={editNarrative}
                onChange={(e) => setEditNarrative(e.target.value)}
                className="w-full p-2 border border-stone-300 dark:border-stone-700 bg-transparent h-40"
                placeholder="Narrative"
              />
              <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-sm">
                <Save size={16} /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
