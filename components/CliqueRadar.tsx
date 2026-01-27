
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCommunityZines } from '../services/firebase';
import { generateSeasonReport } from '../services/geminiService';
// Corrected CliqueRole to ProsceniumRole as defined in types.ts
import { ZineMetadata, SeasonReport, ProsceniumRole } from '../types';
import { Radio, Activity, Clock, Shield, Eye, MessageSquare, Headphones, Loader2, Zap, ChevronRight, Sparkles, Layers, PenTool, Wind, Map, Info } from 'lucide-react';
import { ZineCard } from './ZineCard';
import { useUser } from '../contexts/UserContext';

export const CliqueRadar: React.FC<{ onSelectZine: (zine: ZineMetadata) => void }> = ({ onSelectZine }) => {
  const { profile } = useUser();
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const [report, setReport] = useState<SeasonReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeUntilShift, setTimeUntilShift] = useState(3600);
  const [syncLevel, setSyncLevel] = useState(90);
  const [showGuide, setShowGuide] = useState(true);

  // Corrected CliqueRole to ProsceniumRole usage
  const myRole: ProsceniumRole = useMemo(() => {
    if (!profile) return 'Ghost';
    // Corrected CliqueRole array type to ProsceniumRole
    const roles: ProsceniumRole[] = ['Editor', 'Witness', 'Ghost'];
    const index = (profile.handle.length + (new Date().getDate())) % 3;
    return roles[index];
  }, [profile]);

  useEffect(() => {
    const loadRadar = async () => {
      setLoading(true);
      try {
        const data = await fetchCommunityZines(30);
        setZines(data || []);
        if (data && data.length > 0) {
            try {
              const r = await generateSeasonReport(data.slice(0, 10));
              setReport(r);
            } catch (re) {
              console.warn("Mimi: Seasonal report failed to refract.", re);
            }
        }
      } catch (e) { 
        console.error("Mimi: Radar sweep failed.", e); 
      } finally { 
        setLoading(false); 
      }
    };
    loadRadar();

    const interval = setInterval(() => {
      setSyncLevel(prev => {
        const delta = (Math.random() - 0.5) * 5;
        return Math.min(100, Math.max(70, prev + delta));
      });
    }, 3000);

    const timer = setInterval(() => {
      setTimeUntilShift(prev => (prev <= 0 ? 3600 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const activeZine = zines[activeIndex];
  const queue = zines.filter((_, i) => i !== activeIndex).slice(0, 8);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-transparent gap-12">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border border-stone-100 dark:border-stone-900 rounded-full" 
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-t border-nous-text dark:border-white rounded-full opacity-20" 
        />
        <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-stone-300" size={32} />
      </div>
      <div className="space-y-2 text-center">
        <p className="font-serif italic text-3xl text-stone-400">Consulting the hivemind...</p>
        <p className="font-sans text-[8px] uppercase tracking-[0.6em] text-stone-300 font-black animate-pulse">Syncing frequencies across dimensions</p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex flex-col bg-nous-base dark:bg-nous-dark-base transition-colors duration-1000 relative">
        {/* Cinematic Background Elements */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_currentColor_1px,_transparent_1px)] bg-[length:60px_60px]" />
            <motion.div 
              animate={{ y: [-10, 10, -10], opacity: [0.01, 0.05, 0.01] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-nous-text dark:bg-white rounded-full blur-[200px]"
            />
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full px-8 pb-64 relative z-10">
            {/* Guide Notification */}
            <AnimatePresence>
              {showGuide && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-12 p-6 bg-white/80 dark:bg-stone-900/80 backdrop-blur-3xl border border-stone-100 dark:border-stone-800 rounded-3xl shadow-2xl flex items-center justify-between gap-8 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-3 bg-nous-text dark:bg-white text-white dark:text-black rounded-full">
                      <Info size={18} />
                    </div>
                    <div>
                      <h4 className="font-sans text-[10px] uppercase tracking-[0.3em] font-black">Radar Protocol</h4>
                      <p className="font-serif italic text-sm text-stone-500">Only zines explicitly set to **"Broadcasting"** manifest here for the Clique to witness.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowGuide(false)} className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 hover:text-nous-text transition-colors">Dismiss</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-32 border-b border-stone-100 dark:border-stone-900 pb-16 gap-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <span className="font-sans text-[10px] uppercase tracking-[1em] text-red-500 font-black flex items-center gap-4">
                          <Radio size={14} className="animate-pulse" /> LIVE_SYNC
                      </span>
                      <div className="h-px w-24 bg-stone-200 dark:bg-stone-800" />
                      <div className="flex items-center gap-3 px-4 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full shadow-inner">
                        <Clock size={10} className="text-stone-400" />
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">Cycle Reset: {formatTime(timeUntilShift)}</span>
                      </div>
                    </div>
                    <h2 className="font-serif text-6xl md:text-[10rem] italic tracking-tighter luminescent-text text-nous-text dark:text-white leading-[0.8] -ml-2">
                      The Social Floor.
                    </h2>
                </div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/40 dark:bg-black/40 p-8 border border-white/20 dark:border-white/5 rounded-sm backdrop-blur-3xl space-y-6 min-w-[320px] shadow-2xl"
                >
                    <div className="flex items-center justify-between">
                        <span className="font-sans text-[9px] uppercase tracking-[0.6em] font-black text-stone-400">Current Archetype</span>
                        <Shield size={14} className="text-nous-text dark:text-white" />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full border border-stone-100 dark:border-stone-800 flex items-center justify-center relative">
                            {myRole === 'Editor' ? <MessageSquare size={22} /> : myRole === 'Witness' ? <Headphones size={22} /> : <Eye size={22} />}
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 4, repeat: Infinity }}
                              className="absolute inset-0 rounded-full border-t border-emerald-400 opacity-40"
                            />
                        </div>
                        <div>
                            <p className="font-serif text-3xl italic leading-none text-nous-text dark:text-white">{myRole}</p>
                            <p className="font-sans text-[8px] uppercase tracking-widest text-stone-500 mt-2 max-w-[120px] leading-relaxed">
                                {myRole === 'Editor' ? 'Structural modifications permitted.' : myRole === 'Witness' ? 'Vibrational resonance authorized.' : 'Pure observation mode active.'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {zines.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-48 flex flex-col items-center text-center space-y-16"
              >
                <div className="relative w-48 h-48">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute inset-0 bg-stone-200 dark:bg-stone-800 rounded-full blur-3xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wind size={64} className="text-stone-200 dark:text-stone-800 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-6 max-w-xl">
                  <h3 className="font-serif text-5xl md:text-6xl italic tracking-tighter leading-tight">The archives are breathless.</h3>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="mb-64 relative">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                        <span className="font-sans text-[9px] uppercase tracking-[1em] text-stone-300 font-black">Center Focus</span>
                        <motion.div 
                          animate={{ y: [0, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <ChevronRight size={20} className="rotate-90 text-stone-200" />
                        </motion.div>
                    </div>
                    
                    <AnimatePresence mode="wait">
                        {activeZine && (
                            <motion.div
                                key={activeZine.id}
                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 1.05, filter: 'blur(40px)' }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                className="relative group/active"
                            >
                                <ZineCard 
                                    zine={activeZine} 
                                    onClick={() => onSelectZine(activeZine)} 
                                    currentUserId={profile?.uid} 
                                    isSocialFloor 
                                />
                                
                                <div className="mt-16 flex justify-center items-center gap-12">
                                    <div className="flex items-center gap-4">
                                        <div className="flex gap-2">
                                            {[...Array(5)].map((_, i) => (
                                                <motion.div 
                                                  key={i} 
                                                  animate={i < (activeZine.likes || 0) ? { scale: [1, 1.3, 1] } : {}}
                                                  className={`w-2 h-2 rounded-full ${i < (activeZine.likes || 0) ? 'bg-red-500' : 'bg-stone-200 dark:bg-stone-800'}`} 
                                                />
                                            ))}
                                        </div>
                                        <span className="font-sans text-[9px] uppercase tracking-widest text-stone-400 font-black italic">Resonance_Score</span>
                                    </div>
                                    <div className="h-4 w-px bg-stone-200 dark:bg-stone-800" />
                                    <div className="flex items-center gap-3">
                                      <Activity size={12} className="text-stone-300" />
                                      <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Trace_Index: 0.{activeZine.timestamp.toString().slice(-3)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="space-y-24 mb-64">
                    <div className="flex items-center gap-8">
                        <span className="font-sans text-[11px] uppercase tracking-[0.8em] text-stone-400 font-black">The Waiting Room</span>
                        <div className="flex-1 h-px bg-stone-100 dark:bg-stone-900" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        {queue.map((zine, i) => (
                            <motion.div 
                                key={zine.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                onClick={() => setActiveIndex(zines.indexOf(zine))}
                                className="group relative cursor-pointer border-l-2 border-stone-50 dark:border-stone-900 pl-8 py-4 transition-all hover:border-nous-text dark:hover:border-white"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                        <span className="font-sans text-[8px] uppercase tracking-widest text-stone-500 font-black">@{zine.userHandle}</span>
                                        <span className="font-mono text-[8px] text-stone-400">0{i+1}</span>
                                    </div>
                                    <h3 className="font-serif italic text-3xl text-nous-text dark:text-white leading-tight group-hover:italic transition-all">{zine.title}</h3>
                                    <div className="w-0 group-hover:w-full h-px bg-nous-text dark:bg-white transition-all duration-700 opacity-20" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
              </>
            )}

            {/* ROADMAP NOTICE */}
            <div className="mb-32 p-12 bg-white/5 border border-stone-200/10 dark:border-white/5 rounded-[2rem] backdrop-blur-3xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-full bg-amber-400/10 border border-amber-400/20">
                        <Map size={24} className="text-amber-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-sans text-[10px] uppercase tracking-[0.5em] text-stone-400 font-black">Evolutionary Roadmap</span>
                        <h4 className="font-serif text-3xl italic tracking-tighter text-nous-text dark:text-white">The Coming Shift.</h4>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">Phase_01</span>
                        <p className="font-serif italic text-lg text-stone-400 leading-relaxed">Vibrational Harmony: Automatic palette synchronization based on collective Clique mood.</p>
                    </div>
                    <div className="space-y-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">Phase_02</span>
                        <p className="font-serif italic text-lg text-stone-400 leading-relaxed">Echo Loops: Collaborative auditory layers allowing multiple witnesses to leave voice-notes on shared artifacts.</p>
                    </div>
                    <div className="space-y-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">Phase_03</span>
                        <p className="font-serif italic text-lg text-stone-400 leading-relaxed">Spatial Refraction: Full 3D curation floor for immersive issue leafing through high-fidelity VR portals.</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-16 pt-32 border-t border-stone-100 dark:border-stone-900">
                <div className="space-y-8 p-12 bg-stone-50/50 dark:bg-white/5 rounded-sm">
                    <div className="flex items-center gap-4 text-stone-400">
                        <Sparkles size={18} />
                        <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black">Evolutionary Path</span>
                    </div>
                    <h4 className="font-serif text-4xl italic tracking-tighter text-nous-text dark:text-white leading-none">Collective Auras.</h4>
                    <p className="font-serif italic text-xl text-stone-500 leading-relaxed">
                        The "Social Floor" will soon breathe in unison. A single, shared palette will manifest based on the dominant emotional debris of the Clique.
                    </p>
                </div>
                <div className="space-y-8 p-12 border border-stone-100 dark:border-stone-800 rounded-sm">
                    <div className="flex items-center gap-4 text-stone-400">
                        <Layers size={18} />
                        <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black">Frequency Log</span>
                    </div>
                    <h4 className="font-serif text-4xl italic tracking-tighter text-nous-text dark:text-white leading-none">The Witness Loop.</h4>
                    <p className="font-serif italic text-xl text-stone-500 leading-relaxed">
                        Every view is a trace. Every trace is a refraction. The machine learns your taste not to sell it, but to refine the collective mirror.
                    </p>
                </div>
            </div>
        </div>

        {/* Footer Bar */}
        <div className="fixed bottom-0 left-0 w-full z-[100] border-t border-stone-100 dark:border-stone-800 bg-white/95 dark:bg-black/95 backdrop-blur-3xl px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-12 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-12">
                 <div className="flex items-center gap-6">
                    <div className="relative">
                        <Zap size={20} className="text-amber-500 animate-pulse" />
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [0, 0.4, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-amber-400 rounded-full blur-md"
                        />
                    </div>
                    <div className="space-y-2">
                        <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 block">Hivemind Stability</span>
                        <div className="w-64 h-1.5 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                                animate={{ width: `${syncLevel}%`, backgroundColor: syncLevel > 80 ? '#10B981' : '#F59E0B' }}
                                className="h-full shadow-[0_0_10px_currentColor]"
                            />
                        </div>
                    </div>
                 </div>
            </div>
            
            <div className="flex items-center gap-4 px-6 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-full shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono text-[10px] text-stone-400 font-black tracking-widest">{syncLevel.toFixed(1)}% SYNCED</span>
            </div>
        </div>
    </div>
  );
};
