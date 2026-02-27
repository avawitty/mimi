import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Zap, Share2, Loader2, WifiOff, Maximize2, Users, User, MessageSquare } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ZineMetadata, VibeNote } from '../types';
import { subscribeToFollowing, Connection } from '../services/connections';
import { PublicProfileModal } from './PublicProfileModal';

interface Transmission {
  id: string;
  userId: string;
  userHandle: string;
  content: string; // The title or poetic blurb
  imageUrl?: string; // The visual artifact
  timestamp: any;
  type: 'manifest' | 'echo' | 'signal';
  likes: number; // Represents 'Witnesses'
  zineData?: ZineMetadata; // Optional full zine data if it's a published zine
  vibeNotes?: VibeNote[];
}

interface ProsceniumViewProps {
  onSelectZine?: (zine: ZineMetadata) => void;
}

export const ProsceniumView: React.FC<ProsceniumViewProps> = ({ onSelectZine }) => {
  const { user, profile, loading } = useUser();
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [activeChannel, setActiveChannel] = useState<'global' | 'following' | 'local'>('global');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Transmission | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [newVibeNote, setNewVibeNote] = useState('');
  const [isSubmittingVibe, setIsSubmittingVibe] = useState(false);

  // Local simulation state for the gallery
  const [localTransmissions, setLocalTransmissions] = useState<Transmission[]>([
      { 
          id: 'sim_1', 
          userId: 'ghost', 
          userHandle: 'oracle', 
          content: 'The aesthetic is not a choice, it is a biological imperative.', 
          imageUrl: 'https://picsum.photos/seed/mimi1/800/1200?blur=2',
          timestamp: Date.now(), 
          type: 'manifest', 
          likes: 42,
          vibeNotes: []
      },
      { 
          id: 'sim_2', 
          userId: 'user1', 
          userHandle: 'velvet_void', 
          content: 'Refracting the mundane through a lens of hyper-nostalgia.', 
          imageUrl: 'https://picsum.photos/seed/mimi2/800/1200?grayscale',
          timestamp: Date.now() - 100000, 
          type: 'manifest', 
          likes: 12,
          vibeNotes: []
      },
      { 
          id: 'sim_3', 
          userId: 'user2', 
          userHandle: 'chrome_heart', 
          content: 'Silence is the loudest texture.', 
          imageUrl: 'https://picsum.photos/seed/mimi3/800/1200',
          timestamp: Date.now() - 200000, 
          type: 'echo', 
          likes: 8,
          vibeNotes: []
      },
  ]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToFollowing(user.uid, (connections) => {
      setFollowingIds(connections.map(c => c.followingId));
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (loading) return;

    if (isOfflineMode || activeChannel === 'local') {
        setTransmissions(localTransmissions);
        return;
    }

    const q = query(collection(db, 'public_transmissions'), orderBy('timestamp', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d,
          timestamp: d.timestamp?.toMillis ? d.timestamp.toMillis() : Date.now()
        } as Transmission;
      });
      
      if (activeChannel === 'following') {
        data = data.filter(t => followingIds.includes(t.userId));
      }
      
      setTransmissions(data);
      
      // Update selected artifact if it's open
      if (selectedArtifact) {
        const updated = data.find(t => t.id === selectedArtifact.id);
        if (updated) setSelectedArtifact(updated);
      }
      
      setIsOfflineMode(false);
    }, (error) => {
        console.warn("Proscenium connection failed (switching to local protocol):", error.message);
        setIsOfflineMode(true);
        setTransmissions(localTransmissions);
    });

    return () => unsubscribe();
  }, [loading, isOfflineMode, localTransmissions, activeChannel, followingIds, selectedArtifact?.id]);

  const handleWitness = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the artifact
      if (isOfflineMode || activeChannel === 'local') {
          setTransmissions(prev => prev.map(t => t.id === id ? { ...t, likes: t.likes + 1 } : t));
          setLocalTransmissions(prev => prev.map(t => t.id === id ? { ...t, likes: t.likes + 1 } : t));
          return;
      }

      try {
          const ref = doc(db, 'public_transmissions', id);
          await updateDoc(ref, { likes: increment(1) });
      } catch (e) {
          console.error("Witness failed:", e);
      }
  };

  const handleAbsorb = (t: Transmission, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (t.zineData && onSelectZine) {
          onSelectZine(t.zineData);
      } else {
          setSelectedArtifact(t);
      }
  };

  const handleOpenProfile = (userId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewingProfileId(userId);
  };
  
  const handleAddVibeNote = async () => {
    if (!user || !profile || !selectedArtifact || !newVibeNote.trim()) return;
    
    setIsSubmittingVibe(true);
    const note: VibeNote = {
      id: `vibe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: user.uid,
      userHandle: profile.handle,
      note: newVibeNote.trim(),
      timestamp: Date.now()
    };
    
    try {
      if (isOfflineMode || activeChannel === 'local') {
        const updatedArtifact = {
          ...selectedArtifact,
          vibeNotes: [...(selectedArtifact.vibeNotes || []), note]
        };
        setLocalTransmissions(prev => prev.map(t => t.id === selectedArtifact.id ? updatedArtifact : t));
        setSelectedArtifact(updatedArtifact);
      } else {
        const ref = doc(db, 'public_transmissions', selectedArtifact.id);
        await updateDoc(ref, {
          vibeNotes: arrayUnion(note)
        });
      }
      setNewVibeNote('');
    } catch (e) {
      console.error("Failed to add vibe note:", e);
    } finally {
      setIsSubmittingVibe(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar bg-nous-base dark:bg-[#050505] text-nous-text dark:text-white transition-all duration-1000 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-20 pointer-events-none mix-blend-overlay" />
      
      <div className="max-w-7xl mx-auto pt-20 px-6 md:px-12 pb-32">
        <header className="mb-16 space-y-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full border font-sans text-[9px] uppercase tracking-[0.3em] font-black ${isOfflineMode ? 'border-stone-500/30 text-stone-500' : 'border-emerald-500/30 text-emerald-500'}`}>
            {isOfflineMode ? <WifiOff size={12} /> : activeChannel === 'following' ? <Users size={12} className="text-indigo-500" /> : <Eye size={12} className="animate-pulse" />} 
            {isOfflineMode ? 'Local Archive' : activeChannel === 'following' ? 'Inner Circle' : 'Live Exhibition'}
          </div>
          <h1 className="font-serif text-6xl md:text-8xl italic tracking-tighter leading-none luminescent-text">
            The Proscenium.
          </h1>
          <p className="font-serif italic text-xl text-stone-500 max-w-xl mx-auto">
            The collective gallery. Witness the aesthetic artifacts of the swarm.
          </p>
        </header>

        <div className="flex justify-center gap-8 mb-12 border-b border-stone-100 dark:border-stone-800 pb-4">
            <button 
                onClick={() => setActiveChannel('global')}
                className={`font-sans text-[10px] uppercase tracking-[0.2em] font-black pb-4 transition-all ${activeChannel === 'global' ? 'text-nous-text dark:text-white border-b-2 border-nous-text dark:border-white' : 'text-stone-400 hover:text-stone-500'}`}
            >
                Global Exhibition
            </button>
            {user && (
              <button 
                  onClick={() => setActiveChannel('following')}
                  className={`font-sans text-[10px] uppercase tracking-[0.2em] font-black pb-4 transition-all ${activeChannel === 'following' ? 'text-nous-text dark:text-white border-b-2 border-nous-text dark:border-white' : 'text-stone-400 hover:text-stone-500'}`}
              >
                  Following
              </button>
            )}
            <button 
                onClick={() => setActiveChannel('local')}
                className={`font-sans text-[10px] uppercase tracking-[0.2em] font-black pb-4 transition-all ${activeChannel === 'local' ? 'text-nous-text dark:text-white border-b-2 border-nous-text dark:border-white' : 'text-stone-400 hover:text-stone-500'}`}
            >
                Local Echoes
            </button>
        </div>

        {/* GALLERY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
            {transmissions.map((t, i) => (
                <motion.div 
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleAbsorb(t)}
                    className="group relative aspect-[3/4] bg-stone-100 dark:bg-stone-900 overflow-hidden cursor-pointer border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-500"
                >
                    {/* Visual Artifact */}
                    {t.imageUrl ? (
                        <img src={t.imageUrl} alt={t.content} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                            <p className="font-serif text-2xl italic text-center text-stone-500">"{t.content}"</p>
                        </div>
                    )}

                    {/* Overlay Chrome */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${t.type === 'signal' ? 'bg-emerald-500' : t.type === 'manifest' ? 'bg-indigo-500' : 'bg-stone-400'}`} />
                                <button 
                                  onClick={(e) => handleOpenProfile(t.userId, e)}
                                  className="font-sans text-[8px] uppercase tracking-widest font-black text-white/70 hover:text-white transition-colors"
                                >
                                  {t.userHandle}
                                </button>
                            </div>
                            <p className="font-serif text-lg italic text-white leading-tight mb-4 line-clamp-2">
                                {t.content}
                            </p>
                            
                            <div className="flex items-center gap-4 text-white/70">
                                <button onClick={(e) => handleWitness(t.id, e)} className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                                    <Eye size={12} /> <span className="font-mono text-[9px] uppercase tracking-widest">Witness ({t.likes})</span>
                                </button>
                                <button onClick={(e) => handleAbsorb(t, e)} className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto">
                                    <Maximize2 size={12} /> <span className="font-mono text-[9px] uppercase tracking-widest">Absorb</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
            </AnimatePresence>
        </div>
        
        {transmissions.length === 0 && (
            <div className="text-center py-32 opacity-50">
                <p className="font-serif text-2xl italic text-stone-400">The gallery is empty.</p>
            </div>
        )}
      </div>

      {/* ARTIFACT MODAL (Fallback if no ZineData) */}
      <AnimatePresence>
          {selectedArtifact && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl"
                  onClick={() => setSelectedArtifact(null)}
              >
                  <motion.div 
                      initial={{ scale: 0.95, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 20 }}
                      className="relative max-w-5xl w-full max-h-full flex flex-col md:flex-row bg-[#050505] border border-white/10 overflow-hidden shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                  >
                      {/* Image Side */}
                      <div className="w-full md:w-2/3 bg-black flex items-center justify-center relative">
                          {selectedArtifact.imageUrl ? (
                              <img src={selectedArtifact.imageUrl} alt="Artifact" className="max-w-full max-h-[70vh] md:max-h-[85vh] object-contain" referrerPolicy="no-referrer" />
                          ) : (
                              <div className="p-12 text-center">
                                  <p className="font-serif text-4xl italic text-white/50">"{selectedArtifact.content}"</p>
                              </div>
                          )}
                      </div>
                      
                      {/* Details Side */}
                      <div className="w-full md:w-1/3 p-8 md:p-12 flex flex-col border-t md:border-t-0 md:border-l border-white/10 overflow-y-auto max-h-[50vh] md:max-h-[85vh] no-scrollbar">
                          <div>
                              <div className="flex items-center gap-3 mb-8">
                                  <div className={`w-2 h-2 rounded-full ${selectedArtifact.type === 'signal' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                  <button 
                                    onClick={() => handleOpenProfile(selectedArtifact.userId)}
                                    className="font-sans text-[10px] uppercase tracking-widest font-black text-white/50 hover:text-white transition-colors"
                                  >
                                    {selectedArtifact.userHandle}
                                  </button>
                              </div>
                              <h2 className="font-serif text-3xl md:text-4xl italic text-white leading-tight mb-6">
                                  {selectedArtifact.content}
                              </h2>
                              <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                                  Archived: {new Date(selectedArtifact.timestamp).toLocaleString()}
                              </p>
                          </div>
                          
                          <div className="mt-8 space-y-4">
                              <button 
                                  onClick={(e) => handleWitness(selectedArtifact.id, e)}
                                  className="w-full py-4 border border-white/20 text-white font-sans text-[10px] uppercase tracking-[0.3em] font-black hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
                              >
                                  <Eye size={14} /> Witness ({selectedArtifact.likes})
                              </button>
                              <button className="w-full py-4 bg-white/5 text-white/50 font-sans text-[10px] uppercase tracking-[0.3em] font-black hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                  <Share2 size={14} /> Transmit
                              </button>
                          </div>
                          
                          {/* VIBE NOTES SECTION */}
                          <div className="mt-12 flex-1 flex flex-col">
                              <div className="flex items-center gap-2 mb-6 text-white/50">
                                  <MessageSquare size={14} />
                                  <span className="font-sans text-[10px] uppercase tracking-widest font-black">Vibe Notes</span>
                              </div>
                              
                              <div className="flex-1 overflow-y-auto space-y-4 mb-6 no-scrollbar min-h-[100px]">
                                  {!selectedArtifact.vibeNotes || selectedArtifact.vibeNotes.length === 0 ? (
                                      <p className="font-serif italic text-white/30 text-sm">No vibes recorded yet. Be the first.</p>
                                  ) : (
                                      selectedArtifact.vibeNotes.map((note) => (
                                          <div key={note.id} className="flex flex-col gap-1">
                                              <div className="flex items-center gap-2">
                                                  <button 
                                                    onClick={() => handleOpenProfile(note.userId)}
                                                    className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500 hover:text-emerald-400 transition-colors"
                                                  >
                                                      {note.userHandle}
                                                  </button>
                                                  <span className="font-mono text-[8px] text-white/30">{new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                              </div>
                                              <p className="font-serif text-sm text-white/80">{note.note}</p>
                                          </div>
                                      ))
                                  )}
                              </div>
                              
                              {user ? (
                                  <div className="flex gap-2">
                                      <input 
                                          type="text" 
                                          value={newVibeNote}
                                          onChange={(e) => setNewVibeNote(e.target.value)}
                                          onKeyDown={(e) => e.key === 'Enter' && handleAddVibeNote()}
                                          placeholder="Leave a vibe..."
                                          className="flex-1 bg-white/5 border border-white/10 rounded-none px-4 py-3 font-serif italic text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                      />
                                      <button 
                                          onClick={handleAddVibeNote}
                                          disabled={isSubmittingVibe || !newVibeNote.trim()}
                                          className="px-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors flex items-center justify-center"
                                      >
                                          {isSubmittingVibe ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                      </button>
                                  </div>
                              ) : (
                                  <p className="font-sans text-[8px] uppercase tracking-widest text-white/30 text-center">Sign in to leave a vibe note.</p>
                              )}
                          </div>
                      </div>
                      
                      <button 
                          onClick={() => setSelectedArtifact(null)}
                          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                      >
                          <Zap size={20} className="rotate-45" />
                      </button>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingProfileId && (
          <PublicProfileModal 
            userId={viewingProfileId} 
            onClose={() => setViewingProfileId(null)} 
            onSelectZine={onSelectZine}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
