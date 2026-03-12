import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Activity, Route, Loader2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { fetchUserZines } from '../services/firebaseUtils';
import { ZineMetadata } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

type ThreadMode = 'biographical' | 'influence' | 'emotional';

export const ThreadsView: React.FC = () => {
  const { user } = useUser();
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<ThreadMode>('emotional');

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      fetchUserZines(user.uid).then(fetchedZines => {
        // Sort by timestamp ascending for timeline
        const sorted = fetchedZines.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setZines(sorted);
        setLoading(false);
      });
    }
  }, [user]);

  // Emotional Thread Data (Tone mapping)
  const emotionalData = useMemo(() => {
    const toneMap: Record<string, number> = {
      'Euphoric': 5,
      'Vibrant': 4,
      'Dreamy': 3,
      'Editorial Stillness': 2,
      'Melancholic': 1,
      'Industrial': 0,
      'Noir': -1,
      'Brutalist': -2,
      'Clinical': -3,
    };

    return zines.map((zine, index) => {
      const date = new Date(zine.timestamp || Date.now());
      return {
        name: zine.title || `Artifact ${index + 1}`,
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        toneScore: toneMap[zine.tone] || 2, // Default to neutral/editorial
        tone: zine.tone
      };
    });
  }, [zines]);

  // Biographical Thread Data (Motif occurrences over time)
  const biographicalData = useMemo(() => {
    const data: any[] = [];
    zines.forEach((zine, index) => {
      const date = new Date(zine.timestamp || Date.now());
      const motifs = zine.content?.aesthetic_touchpoints?.map(t => t.motif) || [];
      
      motifs.forEach((motif, mIndex) => {
        data.push({
          x: index, // Timeline index
          y: mIndex % 5, // Spread vertically
          z: 1, // Size
          name: zine.title,
          motif: motif,
          date: `${date.getMonth() + 1}/${date.getDate()}`
        });
      });
    });
    return data;
  }, [zines]);

  // Influence Thread Data (Top motifs distribution)
  const influenceData = useMemo(() => {
    const motifCounts: Record<string, number> = {};
    let totalMotifs = 0;
    zines.forEach(zine => {
      const motifs = zine.content?.aesthetic_touchpoints?.map(t => t.motif) || [];
      motifs.forEach(motif => {
        motifCounts[motif] = (motifCounts[motif] || 0) + 1;
        totalMotifs++;
      });
    });

    // Get top motifs
    const sortedMotifs = Object.entries(motifCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // Top 8 for the list

    return sortedMotifs.map(([motif, count]) => ({
      subject: motif,
      count: count,
      percentage: totalMotifs > 0 ? Math.round((count / totalMotifs) * 100) : 0,
    }));
  }, [zines]);

  const tabs = [
    { id: 'emotional', label: 'Emotional Thread', icon: Activity, desc: 'Analyze the tonal shifts in your artifacts.' },
    { id: 'influence', label: 'Influence Thread', icon: Compass, desc: 'Map the lineage of external inspirations.' },
    { id: 'biographical', label: 'Biographical Thread', icon: Route, desc: 'Trace the evolution of your motifs across time.' },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f2ed] dark:bg-[#050505] text-stone-900 dark:text-stone-100 font-serif selection:bg-emerald-500/20 pb-32 custom-scrollbar">
      <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-16">
        
        {/* Header */}
        <div className="border-b border-stone-300 dark:border-stone-800 pb-8">
          <h2 className="text-4xl md:text-5xl font-serif italic text-stone-900 dark:text-stone-100">Narrative Pathing</h2>
          <p className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.2em] mt-4">Semantic Paths Through Creative History</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 border-b border-stone-200 dark:border-stone-800 pb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMode(tab.id as ThreadMode)}
                className={`group flex flex-col items-start text-left transition-all ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon size={16} className={isActive ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500'} />
                  <h3 className={`text-xl italic ${isActive ? 'underline decoration-1 underline-offset-8' : ''}`}>
                    {tab.label}
                  </h3>
                </div>
                <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500 max-w-[200px]">
                  {tab.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px] relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-4">
              <Loader2 size={24} className="animate-spin" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em]">Analyzing Archive...</p>
            </div>
          ) : zines.length < 2 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-4 text-center px-6">
              <Compass size={32} className="opacity-20" />
              <p className="font-serif italic text-xl">Insufficient Data</p>
              <p className="font-sans text-[10px] uppercase tracking-widest max-w-md">The Narrative Engine requires at least two artifacts in your archive to construct a semantic pathway.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeMode === 'emotional' && (
                <motion.div key="emotional" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[400px] w-full flex flex-col">
                  <div className="mb-8">
                    <h3 className="text-3xl italic text-stone-900 dark:text-stone-100">Tonal Trajectory</h3>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={emotionalData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis dataKey="date" stroke="#a8a29e" tick={{ fill: '#a8a29e', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#a8a29e" tick={false} axisLine={false} tickLine={false} domain={[-4, 6]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: '0px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                          itemStyle={{ color: '#e7e5e4', fontFamily: 'serif', fontStyle: 'italic' }}
                          labelStyle={{ color: '#a8a29e', fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                          formatter={(value: any, name: any, props: any) => [props.payload.tone, 'Tone']}
                        />
                        <Line type="monotone" dataKey="toneScore" stroke="currentColor" className="text-stone-900 dark:text-stone-100" strokeWidth={1} dot={{ fill: 'currentColor', r: 3, strokeWidth: 0, className: 'text-stone-900 dark:text-stone-100' }} activeDot={{ r: 5, fill: 'currentColor', className: 'text-stone-900 dark:text-stone-100' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {activeMode === 'biographical' && (
                <motion.div key="biographical" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[400px] w-full flex flex-col">
                  <div className="mb-8">
                    <h3 className="text-3xl italic text-stone-900 dark:text-stone-100">Motif Constellation</h3>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" name="Timeline" stroke="#a8a29e" tick={false} axisLine={false} tickLine={false} />
                        <YAxis type="number" dataKey="y" name="Spread" stroke="#a8a29e" tick={false} axisLine={false} tickLine={false} domain={[-1, 6]} />
                        <ZAxis type="number" dataKey="z" range={[40, 120]} />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3', stroke: '#a8a29e' }}
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: '0px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                          itemStyle={{ color: '#e7e5e4', fontFamily: 'serif', fontStyle: 'italic' }}
                          labelStyle={{ color: '#a8a29e', fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase' }}
                          formatter={(value: any, name: any, props: any) => {
                            if (name === 'Timeline') return [props.payload.date, 'Date'];
                            if (name === 'Spread') return [props.payload.motif, 'Motif'];
                            return [];
                          }}
                        />
                        <Scatter name="Motifs" data={biographicalData} fill="currentColor" className="text-stone-900 dark:text-stone-100" opacity={0.4} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {activeMode === 'influence' && (
                <motion.div key="influence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full flex flex-col">
                  <div className="mb-8">
                    <h3 className="text-3xl italic text-stone-900 dark:text-stone-100">Influence Lineage</h3>
                  </div>
                  <div className="w-full max-w-3xl">
                    {influenceData.length > 0 ? (
                      <div className="space-y-0">
                        {influenceData.map((item, idx) => (
                          <div key={idx} className="flex flex-col py-6 border-b border-stone-200 dark:border-stone-800 last:border-0 group">
                            <div className="flex justify-between items-end mb-4">
                              <span className="font-serif italic text-2xl text-stone-900 dark:text-stone-100 group-hover:pl-2 transition-all">{item.subject}</span>
                              <span className="font-mono text-xs text-stone-400">{item.percentage}%</span>
                            </div>
                            <div className="w-full h-[1px] bg-stone-200 dark:bg-stone-800 relative">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                className="absolute top-0 left-0 h-full bg-stone-900 dark:bg-stone-100"
                              />
                            </div>
                            <div className="flex justify-between items-center pt-3">
                              <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-stone-400">Occurrences: {item.count}</span>
                              <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-stone-400">Rank 0{idx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <Compass size={32} className="text-stone-300 opacity-50" />
                        <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400 max-w-md">Insufficient motif data to map influence lineage. Continue creating artifacts to build your semantic graph.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
