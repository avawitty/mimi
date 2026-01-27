// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { fetchCommunityZines } from '../services/firebase';
import { ZineMetadata, ProsceniumRole } from '../types';
import { Users, Radio, Info, Loader2, Sparkles, Handshake, Wind, ArrowUpRight, Fingerprint, Layers, Activity, Heart, Camera, Eye } from 'lucide-react';
import { ZineCard } from './ZineCard';

const MOCK_DEBRIS = [
  "Silk static in a brutalist concrete room.",
  "The ROI of a three-hour silence in lower Manhattan.",
  "High-fashion grief manifest as mercury glass.",
  "A structural requirement for 2014 tumblr nostalgia.",
  "Which architectural silhouette are you mourning tonight?",
  "Clinical clarity is the only sustainable vibe.",
  "Is your heart a curated landfill or a sacred void?",
  "Trace the scent of an expensive regret."
];

export const ProsceniumView: React.FC<{ onSelectZine: (z: ZineMetadata) => void, onCapture: (text: string) => void }> = ({ onSelectZine, onCapture }) => {
  const { user, profile } = useUser();
  const [publicZines, setPublicZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shards' | 'artifacts'>('artifacts');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const zines = await fetchCommunityZines(24);
        setPublicZines(zines || []);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const myRole: ProsceniumRole = useMemo(() => {
    if (!profile) return 'Ghost';
    const roles: ProsceniumRole[] = ['Editor', 'Witness', 'Ghost'];
    const index = (profile.handle.length + (new Date().getDate())) % 3;
    return roles[index];
  }, [profile]);

  const debrisCloud = useMemo(() => {
    const liveDebris = publicZines
      .map(z => z.content.originalThought || "")
      .filter(t => t.length > 5 && t.length < 200);
      
    const combined = [...liveDebris, ...MOCK_DEBRIS];
    return combined.sort(() => Math.random() - 0.5);
  }, [publicZines]);

  const handleArtifactSelect = (zine: ZineMetadata) => {
    if (zine.userId && !zine.userId.startsWith('ghost')) {
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { 
          message: "You are witnessing a sovereign manifest.",
          icon: <Eye size={16} className="text-white" />
        } 
      }));
    }
    onSelectZine(zine);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-y-auto no-scrollbar pb-64 relative">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 pt-12 md:pt-20 space-y-16">
        
        {/* HEADER & DEFINITION */}
        <div className="flex flex-col border-b border-stone-100 dark:border-stone-900 pb-12 gap-8">
           <div className="space-y-6">
              <div className="flex items-center gap-3 text-stone-400">
                <Camera size={16} className="animate-pulse" />
                <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">The Mediated Feed</span>
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-6xl md:text-9xl italic tracking-tighter luminescent-text text-nous-text dark:text-white leading-none">The Proscenium.</h2>
                <div className="pt-4 max-w-md">
                   <p className="font-serif italic text-base md:text-xl text-stone-400 leading-tight">
                     <span className="text-nous-text dark:text-white font-black italic">pro·sce·ni·um (n.)</span> The metaphorical arch separating the performance of the self from the void of the auditorium. Acknowledging that reality is always framed, seen, and mediated.
                   </p>
                </div>
              </div>
           </div>
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="flex gap-8">
                 <button onClick={() => setActiveTab('artifacts')} className={`font-serif italic text-xl md:text-2xl pb-2 border-b-2 transition-all ${activeTab === 'artifacts' ? 'text-nous-text dark:text-white border-nous-text dark:border-white' : 'text-stone-300 border-transparent hover:text-stone-500'}`}>Artifacts</button>
                 <button onClick={() => setActiveTab('shards')} className={`font-serif italic text-xl md:text-2xl pb-2 border-b-2 transition-all ${activeTab === 'shards' ? 'text-nous-text dark:text-white border-nous-text dark:border-white' : 'text-stone-300 border-transparent hover:text-stone-500'}`}>Debris Cloud</button>
              </div>
              
              <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-900 px-6 py-3 rounded-sm border border-stone-100 dark:border-stone-800 shadow-inner">
                  <div className="flex flex-col items-end">
                    <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Role Assignment</span>
                    <span className="font-serif italic text-sm text-nous-text dark:text-white">{myRole}</span>
                  </div>
                  <div className="h-6 w-px bg-stone-200 dark:bg-stone-800" />
                  <Radio size={14} className="text-emerald-500 animate-pulse" />
              </div>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'shards' ? (
            <motion.div key="shards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {debrisCloud.map((text, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 p-8 md:p-10 shadow-sm hover:shadow-2xl transition-all rounded-sm flex flex-col justify-between gap-10 relative overflow-hidden"
                      >
                         <div className="absolute -top-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity"><Fingerprint size={100} /></div>
                         <p className="font-serif italic text-xl md:text-2xl text-stone-600 dark:text-stone-300 leading-tight">"{text}"</p>
                         <div className="flex justify-between items-center pt-4 border-t border-stone-50 dark:border-stone-900">
                            <span className="font-sans text-[7px] uppercase tracking-widest text-stone-300 font-black italic">Anonymous Debris</span>
                            <button 
                              onClick={() => onCapture(text)}
                              className={`flex items-center gap-2 font-serif italic text-sm text-nous-text dark:text-white group-hover:translate-x-2 transition-all bg-stone-50 dark:bg-stone-900 px-4 py-2 rounded-full border border-stone-100 dark:border-stone-800`}
                            >
                               Capture <ArrowUpRight size={10} className="text-emerald-500" />
                            </button>
                         </div>
                      </motion.div>
                    ))}
                 </div>
            </motion.div>
          ) : (
            <motion.div key="artifacts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-16">
               {loading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="font-sans text-[8px] uppercase tracking-widest">Hydrating Artifacts...</span>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                   {publicZines.map(zine => (
                     <ZineCard key={zine.id} zine={zine} onClick={() => handleArtifactSelect(zine)} currentUserId={user?.uid} isSocialFloor />
                   ))}
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* PERFORMANCE LOGIC BANNER */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 mt-32">
          <div className="p-12 md:p-20 bg-stone-50/50 dark:bg-stone-900/30 rounded-3xl border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row items-center gap-12 md:gap-20">
             <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 text-stone-400">
                  <Info size={14} />
                  <span className="font-sans text-[9px] uppercase tracking-[0.5em] font-black italic">PROSCENIUM LOGIC</span>
                </div>
                <h3 className="font-serif text-4xl md:text-5xl italic tracking-tighter">Everything is a choice.</h3>
                <p className="font-serif italic text-lg md:text-xl text-stone-500 leading-relaxed max-w-2xl">
                  By witnessing these artifacts, you are participating in the **Collective Rehearsal**. We are not simply browsing; we are auditing the current trajectory of the groupthink comedy. Every like is a cue. Every capture is a re-scripting.
                </p>
                <div className="flex gap-4 items-center pt-4">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">STAGE STATUS: ACTIVE // ARCH CALIBRATED</span>
                </div>
             </div>
             <div className="w-48 h-48 md:w-64 md:h-64 border-2 border-stone-200 dark:border-stone-800 flex items-center justify-center relative group shrink-0 shadow-2xl">
                <div className="absolute inset-0 border border-stone-50 dark:border-stone-900 m-2" />
                <Layers size={56} className="text-stone-200 dark:text-stone-800 group-hover:scale-110 transition-transform duration-1000" />
             </div>
          </div>
      </div>
    </div>
  );
};