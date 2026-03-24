import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Loader2, Activity, Network, UserCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { fetchUserZines } from '../services/firebaseUtils';
import { ZineMetadata, NarrativeThread, TasteGraphNode, TasteGraphEdge } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { saveNarrativeThread, fetchNarrativeThreads } from '../services/firebaseUtils';
import { generateNarrativeThread, analyzeThreadPath, generateTrajectoryReadout } from '../services/geminiService';
import { ThreadPathVisualization } from './ThreadPathVisualization';

type ThreadMode = 'biographical' | 'influence' | 'emotional';

const WEAVER_CONFIG = {
  emotional: { bg: '#FDFBF7', accent: '#10B981', icon: Activity, label: 'Emotional' },
  influence: { bg: '#050510', accent: '#06B6D4', icon: Network, label: 'Influence' },
  biographical: { bg: '#080808', accent: '#A855F7', icon: UserCircle, label: 'Biography' }
};

const SegmentedControl: React.FC<{ mode: string, onChange: (mode: string) => void }> = ({ mode, onChange }) => {
  return (
    <div className="flex justify-center w-full my-8">
      <div className="bg-stone-200/50 dark:bg-stone-800/50 p-1 rounded-full flex items-center gap-1 backdrop-blur-md border border-stone-300/50 dark:border-stone-700/50">
        {(Object.keys(WEAVER_CONFIG) as Array<keyof typeof WEAVER_CONFIG>).map((key) => {
          const config = WEAVER_CONFIG[key];
          const isActive = mode === key;
          const Icon = config.icon;
          
          return (
            <button
              key={key}
              onClick={() => {
                if (!isActive) {
                  window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'click' } }));
                  onChange(key);
                }
              }}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-sans uppercase tracking-widest transition-colors z-10 ${
                isActive ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-segment"
                  className="absolute inset-0 bg-white dark:bg-stone-900 rounded-full shadow-sm border border-stone-200 dark:border-stone-800"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={14} style={{ color: isActive ? config.accent : undefined }} />
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const ThreadsView: React.FC = () => {
  const { user, loading: userLoading, activeThread, setActiveThread } = useUser();
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const [threads, setThreads] = useState<NarrativeThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<ThreadMode>('emotional');
  const [newNote, setNewNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: TasteGraphNode[], edges: TasteGraphEdge[] } | null>(null);
  const [trajectoryReadout, setTrajectoryReadout] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (activeThread) {
      setIsAnalyzing(true);
      Promise.all([
        analyzeThreadPath(activeThread, zines),
        generateTrajectoryReadout(activeThread, zines)
      ]).then(([data, readout]) => {
        setGraphData(data);
        setTrajectoryReadout(readout);
        setIsAnalyzing(false);
      });
    }
  }, [activeThread, zines]);

  useEffect(() => {
    if (userLoading) return;
    if (user?.uid) {
      setLoading(true);
      Promise.all([
        fetchUserZines(user.uid),
        fetchNarrativeThreads(user.uid)
      ]).then(([fetchedZines, fetchedThreads]) => {
        // Sort by timestamp ascending for timeline
        const sorted = fetchedZines.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setZines(sorted);
        setThreads(fetchedThreads);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, userLoading]);

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
        name: zine.content?.headlines?.[0] || zine.title || `Artifact ${index + 1}`,
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
      const motifs = zine.content?.semiotic_signals?.map(t => t.motif) || [];
      
      motifs.forEach((motif, mIndex) => {
        data.push({
          x: index, // Timeline index
          y: mIndex % 5, // Spread vertically
          z: 1, // Size
          name: zine.content?.headlines?.[0] || zine.title,
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
      const motifs = zine.content?.semiotic_signals?.map(t => t.motif) || [];
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

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f2ed] dark:bg-[#050505] text-stone-900 dark:text-stone-100 font-serif selection:bg-emerald-500/20 pb-32 custom-scrollbar">
      <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-16">
        
        {/* Header */}
        <div className="border-b border-stone-300 dark:border-stone-800 pb-8">
          <h2 className="text-4xl md:text-5xl font-serif italic text-stone-900 dark:text-stone-100">Narrative Pathing</h2>
          <p className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.2em] mt-4">Semantic Paths Through Creative History</p>
        </div>

        {/* Navigation Tabs */}
        <SegmentedControl mode={activeMode} onChange={(mode) => setActiveMode(mode as ThreadMode)} />

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
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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

        {/* Thread Management Section */}
        <div className="border-t border-stone-300 dark:border-stone-800 pt-12">
          <h3 className="text-2xl italic mb-8">Narrative Threads</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Thread List */}
            <div className="md:col-span-1 space-y-4">
              {threads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThread(activeThread?.id === thread.id ? null : thread)}
                  className={`w-full text-left p-4 border ${activeThread?.id === thread.id ? 'border-stone-900 dark:border-stone-100' : 'border-stone-200 dark:border-stone-800'} transition-all`}
                >
                  <h4 className="font-serif italic text-lg">{thread.title}</h4>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-stone-500">{thread.mode}</p>
                </button>
              ))}
              <button
                onClick={() => {
                  setActiveThread({
                    id: Date.now().toString(),
                    userId: user?.uid || '',
                    title: 'New Narrative Thread',
                    narrative: '',
                    mode: 'emotional',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  });
                }}
                className="w-full p-4 border border-dashed border-stone-400 text-stone-500 font-sans text-[10px] uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition-all"
              >
                + Create New Thread
              </button>
            </div>

            {/* Thread Editor */}
            <div className="md:col-span-2 space-y-4">
              {activeThread ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={activeThread.title}
                    onChange={(e) => setActiveThread({ ...activeThread, title: e.target.value })}
                    className="w-full p-2 bg-transparent border-b border-stone-300 dark:border-stone-700 font-serif text-xl italic"
                  />
                  <textarea
                    value={activeThread.narrative}
                    onChange={(e) => setActiveThread({ ...activeThread, narrative: e.target.value })}
                    className="w-full p-2 bg-transparent border border-stone-300 dark:border-stone-700 font-sans text-sm min-h-[200px]"
                    placeholder="Narrative..."
                  />
                  <input
                    type="text"
                    value={activeThread.notes || ''}
                    onChange={(e) => setActiveThread({ ...activeThread, notes: e.target.value })}
                    className="w-full p-2 bg-transparent border border-stone-300 dark:border-stone-700 font-sans text-sm"
                    placeholder="Notes for AI analysis..."
                  />
                  <div className="flex gap-4">
                    <select
                      value={activeThread.mode}
                      onChange={(e) => setActiveThread({ ...activeThread, mode: e.target.value as 'emotional' | 'biographical' | 'influence' })}
                      className="p-2 bg-transparent border border-stone-300 dark:border-stone-700 font-sans text-sm"
                    >
                      <option value="emotional">Emotional</option>
                      <option value="biographical">Biographical</option>
                      <option value="influence">Influence</option>
                    </select>
                  </div>
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center h-[400px] text-stone-400 font-sans text-[10px] uppercase tracking-widest">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="ml-2">Analyzing path...</span>
                    </div>
                  ) : graphData && (
                    <div className="space-y-4">
                      <div className="border border-stone-300 dark:border-stone-700">
                        <ThreadPathVisualization nodes={graphData.nodes} edges={graphData.edges} />
                      </div>
                      {trajectoryReadout && (
                        <div className="p-6 bg-stone-200/50 dark:bg-stone-800/50 border border-stone-300 dark:border-stone-700 rounded-xl space-y-4">
                          <h4 className="font-serif italic text-xl text-stone-900 dark:text-stone-100">Trajectory Readout</h4>
                          <p className="font-sans text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                            {trajectoryReadout}
                          </p>
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('mimi:nav', { detail: 'studio' }))}
                            className="text-xs font-sans uppercase tracking-widest text-stone-900 dark:text-stone-100 hover:opacity-70 transition-opacity flex items-center gap-2"
                          >
                            Draft in Studio <Compass size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        if (activeThread && user?.uid) {
                          await saveNarrativeThread({ ...activeThread, updatedAt: Date.now() });
                          const updatedThreads = await fetchNarrativeThreads(user.uid);
                          setThreads(updatedThreads);
                        }
                      }}
                      className="px-6 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-sans text-[10px] uppercase tracking-widest"
                    >
                      Save Thread
                    </button>
                    <button
                      onClick={async () => {
                        setIsGenerating(true);
                        const newNarrative = await generateNarrativeThread(activeThread.narrative, threads);
                        setActiveThread({ ...activeThread, narrative: activeThread.narrative + '\n\n' + newNarrative });
                        setIsGenerating(false);
                      }}
                      disabled={isGenerating}
                      className="px-6 py-2 border border-stone-900 dark:border-stone-100 font-sans text-[10px] uppercase tracking-widest"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Continuation'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-stone-400 font-sans text-[10px] uppercase tracking-widest">
                  Select or create a thread to begin.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
