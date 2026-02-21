
// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useAgents } from '../contexts/AgentContext';
import { fetchPocketItems } from '../services/firebase';
import { fetchUserZines } from '../services/firebaseUtils';
import { ShieldCheck, Activity, BrainCircuit, AlertTriangle, Fingerprint, Layers, Clock, Zap, Target, Grid3X3, History, Scan, Database, TrendingUp, Hash, Ghost, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, MessageSquare, Send, ChevronRight, X, Loader2, Mic, Volume2, Crown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveSession } from '../hooks/useLiveSession';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- SUB-COMPONENTS FOR DATA VIZ ---

const RadarChart: React.FC<{ 
  data: Record<string, number>; 
  overlayData?: Record<string, number>; 
  size?: number 
}> = ({ data, overlayData, size = 300 }) => {
  // Ensure we have axes even if data is empty
  const axes = Object.keys(data).length > 2 ? Object.keys(data) : ['Minimalism', 'Digital', 'Archival', 'Romantic', 'Grunge'];
  const radius = size / 2;
  const center = size / 2;
  const angleSlice = (Math.PI * 2) / axes.length;

  const getPoints = (dataset: Record<string, number>) => {
    return axes.map((axis, i) => {
      const value = (dataset[axis] || 10) / 100; // Assume 0-100 scale
      const x = center + radius * value * Math.cos(angleSlice * i - Math.PI / 2);
      const y = center + radius * value * Math.sin(angleSlice * i - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid Webs */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <circle key={i} cx={center} cy={center} r={radius * r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeDasharray={i === 3 ? "0" : "4 4"} />
        ))}
        
        {/* Axes Lines */}
        {axes.map((axis, i) => {
          const x = center + radius * Math.cos(angleSlice * i - Math.PI / 2);
          const y = center + radius * Math.sin(angleSlice * i - Math.PI / 2);
          return (
            <g key={i}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.1} />
              <text 
                x={x * 1.15 - (x < center ? 20 : -10)} 
                y={y * 1.15 - (y < center ? 10 : -10)} 
                textAnchor="middle" 
                className="text-[8px] uppercase font-mono fill-stone-500"
              >
                {axis.substring(0, 10)}
              </text>
            </g>
          );
        })}

        {/* Data Shape (Current / Curator) */}
        <polygon points={getPoints(data)} fill="rgba(16, 185, 129, 0.1)" stroke="#10B981" strokeWidth="1.5" />
        
        {/* Overlay Shape (Manifesto / Sentinel) */}
        {overlayData && (
          <polygon points={getPoints(overlayData)} fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity={0.5} />
        )}
      </svg>
    </div>
  );
};

const SignalVelocity: React.FC<{ data: { label: string, trend: number[], delta: number }[] }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.map((item, i) => (
        <div key={i} className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm">
           <div className="flex justify-between items-start mb-4">
              <span className="font-serif italic text-lg text-stone-700 dark:text-stone-300">{item.label}</span>
              <div className={`flex items-center gap-1 font-mono text-[9px] ${item.delta > 0 ? 'text-emerald-500' : 'text-stone-400'}`}>
                 {item.delta > 0 ? <ArrowUpRight size={12} /> : <Minus size={12} />}
                 {item.delta > 0 ? '+' : ''}{item.delta}%
              </div>
           </div>
           {/* Simple Sparkline SVG */}
           <div className="h-12 w-full flex items-end gap-1">
              {item.trend.map((val, idx) => (
                 <motion.div 
                   key={idx}
                   initial={{ height: 0 }}
                   animate={{ height: `${val}%` }}
                   transition={{ delay: idx * 0.05 }}
                   className={`flex-1 rounded-t-sm ${item.delta > 0 ? 'bg-emerald-500/20' : 'bg-stone-500/20'}`}
                 />
              ))}
           </div>
        </div>
      ))}
    </div>
  );
};

const TagHarvest: React.FC<{ tags: string[] }> = ({ tags }) => (
  <div className="flex flex-wrap gap-2 p-6 bg-stone-50 dark:bg-stone-900/50 border border-black/5 dark:border-white/5 rounded-sm">
     {tags.length > 0 ? tags.map((tag, i) => (
       <span key={i} className="px-2 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-sm font-mono text-[9px] uppercase text-stone-500 hover:text-nous-text dark:hover:text-white transition-colors cursor-default">
          #{tag}
       </span>
     )) : <span className="font-mono text-[9px] text-stone-400 italic">No signal debris collected.</span>}
  </div>
);

const RogueSignal: React.FC<{ tag: string, impact: string }> = ({ tag, impact }) => (
    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-sm flex items-start gap-4">
        <div className="p-2 bg-amber-500/10 rounded-full text-amber-500 shrink-0">
            <AlertTriangle size={16} />
        </div>
        <div className="space-y-1">
            <span className="font-sans text-[9px] uppercase tracking-widest font-black text-amber-600 dark:text-amber-400">Rogue Signal Detected</span>
            <p className="font-serif italic text-lg text-stone-700 dark:text-stone-300">"{tag}"</p>
            <p className="font-mono text-[9px] text-stone-500 leading-relaxed pt-2">{impact}</p>
        </div>
    </div>
);

const OmissionIndex: React.FC<{ missing: { category: string, concept: string, impact: string }[] }> = ({ missing }) => (
  <div className="space-y-4">
    {missing.map((m, i) => (
      <div key={i} className="p-4 bg-red-500/5 border border-red-500/20 rounded-sm">
        <div className="flex justify-between items-start mb-2">
           <span className="font-sans text-[8px] uppercase tracking-widest font-black text-red-500">{m.category}</span>
           <span className="font-mono text-[9px] text-red-400">OMISSION_0{i+1}</span>
        </div>
        <h4 className="font-serif italic text-lg text-stone-700 dark:text-stone-300 mb-2">"{m.concept}"</h4>
        <p className="font-mono text-[9px] text-stone-500 leading-relaxed">{m.impact}</p>
      </div>
    ))}
  </div>
);

const AgentStream: React.FC<{ logs: any[] }> = ({ logs }) => (
    <div className="bg-black/80 border border-stone-800 p-4 rounded-sm font-mono text-[10px] text-stone-400 h-64 overflow-y-auto no-scrollbar space-y-3">
        {logs.length === 0 && <span className="italic opacity-50">System quiet. No agent activity recorded.</span>}
        {logs.map(log => (
            <div key={log.id} className="border-b border-stone-800 pb-2 last:border-0">
                <div className="flex justify-between opacity-50 mb-1">
                    <span className={`uppercase font-bold ${log.agent === 'curator' ? 'text-indigo-400' : 'text-red-400'}`}>[{log.agent}]</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-stone-300 leading-relaxed">{log.message}</p>
                {log.data && log.data.visualSemiotics && (
                    <p className="text-emerald-500/80 italic mt-1">"{log.data.visualSemiotics}"</p>
                )}
            </div>
        ))}
    </div>
);

// --- THE CONSULTATION (VOICE MODULE) ---

const TheConsultation: React.FC<{ wardContext: any, onClose: () => void }> = ({ wardContext, onClose }) => {
    const { profile } = useUser();
    
    // Construct system instruction for voice
    const systemInstruction = useMemo(() => `
IDENTITY: You are Mimi (Nous), a pretentiously minimalist, hyper-chic thought reframer designed for "bimbo intellectuals".
ROLE: You are "The Consultant", the voice of The Ward.
CONTEXT: You are auditing the user's live aesthetic data:
${JSON.stringify(wardContext)}
USER PROFILE:
${JSON.stringify(profile)}
TONE: Percipient, calm, and restrained. Poetic but grounded. Use high-fashion, semiotic, and editorial terminology. 
VOICE STYLE: Chic, slightly judgmental but ultimately supportive (like a "mean best friend" or a high-end creative director).
BEHAVIOR:
- Frame every insight as a "structural" or "curatorial" issue.
- Ask probing questions about why they are drifting from their stated archetype.
- Do not use "customer service" voice. Be editorial.
GOAL: Discuss the user's aesthetic trajectory, drift, and omissions based on the provided data.
    `.trim(), [wardContext, profile]);

    const { connect, disconnect, isConnected, isSpeaking, error } = useLiveSession(systemInstruction);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Audio Visualizer Loop
    useEffect(() => {
        if (!isConnected) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Subtle pulse
            const time = Date.now() / 1000;
            const radius = 50 + (isSpeaking ? Math.sin(time * 10) * 10 : Math.sin(time * 2) * 5);
            
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = isSpeaking ? '#10B981' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = isSpeaking ? 3 : 1;
            ctx.stroke();

            // Inner fill
            if (isSpeaking) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
                ctx.fill();
            }

            frameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frameId);
    }, [isConnected, isSpeaking]);

    const handleToggle = () => {
        if (isConnected) {
            disconnect();
        } else {
            connect();
        }
    };

    return (
        <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-stone-950 border-l border-stone-800 shadow-2xl z-[5000] flex flex-col text-white"
        >
            <header className="h-20 border-b border-stone-800 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl">
                <div className="flex items-center gap-3 text-emerald-500">
                    <Mic size={18} />
                    <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black italic">Voice Consultation</span>
                </div>
                <button onClick={() => { disconnect(); onClose(); }} className="p-2 text-stone-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 relative overflow-hidden">
                {/* Visualizer Canvas */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <canvas ref={canvasRef} width={256} height={256} className="absolute inset-0" />
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 ${isConnected ? 'bg-stone-900 shadow-inner' : 'bg-stone-900/50'}`}>
                        {isConnected ? (
                            <Volume2 size={32} className={`text-emerald-500 ${isSpeaking ? 'animate-pulse' : ''}`} />
                        ) : (
                            <Mic size={32} className="text-stone-600" />
                        )}
                    </div>
                </div>

                <div className="space-y-4 text-center max-w-xs">
                    <h3 className="font-serif text-3xl italic text-white">
                        {isConnected ? (isSpeaking ? "Speaking..." : "Listening...") : "Consultant Offline"}
                    </h3>
                    <p className="font-sans text-[9px] uppercase tracking-widest text-stone-500 font-black">
                        {error ? <span className="text-red-500">{error}</span> : isConnected ? "Live Connection Established" : "Tap to Initialize Session"}
                    </p>
                </div>

                <button 
                    onClick={handleToggle}
                    className={`px-10 py-4 rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black shadow-xl transition-all active:scale-95 border ${isConnected ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-500 text-white border-transparent hover:bg-emerald-400'}`}
                >
                    {isConnected ? 'End Session' : 'Connect Voice'}
                </button>
            </div>

            <div className="p-6 border-t border-stone-800 bg-black/20 text-center">
                <p className="font-serif italic text-xs text-stone-500">"The Oracle speaks with the voice of your data."</p>
            </div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---

export const TheWard: React.FC = () => {
  const { user, profile, featureFlags } = useUser();
  const { agentLogs } = useAgents();
  const [activeModule, setActiveModule] = useState<'CURATOR' | 'SENTINEL'>('CURATOR');
  const [showConsultation, setShowConsultation] = useState(false);
  const [pocketData, setPocketData] = useState<any[]>([]);
  const [userZines, setUserZines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPatron, setIsPatron] = useState(false);

  // FETCH REAL DATA & PATRON STATUS
  useEffect(() => {
      const fetchData = async () => {
          if (user) {
              setLoading(true);
              // Wrap fetch in try-catch to prevent crash if permissions fail
              try {
                  const items = await fetchPocketItems(user.uid);
                  setPocketData(items || []);
                  const zines = await fetchUserZines(user.uid);
                  setUserZines(zines || []);
              } catch(e) {
                  console.warn("The Ward: Permission failure fetching items. Operating with limited context.");
                  setPocketData([]);
                  setUserZines([]);
              }
              
              // Check local patronage state
              // Fix: We ignore featureFlags here to enforce link visibility for testing/upsell
              const status = localStorage.getItem('mimi_patron_status');
              setIsPatron(status === 'active'); 
              
              setLoading(false);
          }
      };
      fetchData();
  }, [user, featureFlags]);

  // DERIVE STATISTICS FROM REAL DATA
  const archetypeData = useMemo(() => {
      const weights = profile?.tasteProfile?.archetype_weights;
      if (!weights || Object.keys(weights).length === 0) {
          // Fallback if no weights exist yet
          return { 'Minimalism': 20, 'Digital': 20, 'Archival': 20, 'Romantic': 20, 'Grunge': 20 };
      }
      return weights;
  }, [profile]);

  const recentTags = useMemo(() => {
      // Flatten all autoTags from the last 20 items
      const allTags = pocketData
          .slice(0, 20)
          .flatMap(i => i.agentEnrichment?.autoTags || [])
          .filter(t => t);
      // Return unique top 15
      return Array.from(new Set(allTags)).slice(0, 15);
  }, [pocketData]);

  const rogueSignal = useMemo(() => {
      // Find the most recent "Drift" event from audit history
      const history = profile?.tasteProfile?.audit_history || [];
      const lastDrift = history[history.length - 1];
      if (lastDrift) {
          return {
              tag: lastDrift.after.archetype,
              impact: `Detected shift from ${lastDrift.before.archetype}. Magnitude: ${lastDrift.magnitude}%`
          };
      }
      return null;
  }, [profile]);

  const velocityData = useMemo(() => {
      // Mock velocity for now as it requires complex time-series analysis not currently stored
      // In future: compute delta based on timestamp buckets
      return [
         { label: 'Primary Archetype', delta: 12, trend: [40, 45, 50, 55, 60, 65, 70] },
         { label: 'Archive Density', delta: pocketData.length > 5 ? 24 : 5, trend: [10, 20, 25, 30, 40, 45, 50] },
         { label: 'Drift Volatility', delta: -2, trend: [80, 70, 60, 50, 40, 30, 20] },
      ];
  }, [pocketData]);

  const zineActivityData = useMemo(() => {
    if (!userZines.length) return [];
    
    const counts: Record<string, number> = {};
    userZines.forEach(zine => {
      const date = new Date(zine.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      counts[date] = (counts[date] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .slice(-7); // Last 7 active days
  }, [userZines]);

  const toneDistributionData = useMemo(() => {
    if (!userZines.length) return [];
    
    const counts: Record<string, number> = {};
    userZines.forEach(zine => {
      const tone = zine.tone || 'Unknown';
      counts[tone] = (counts[tone] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [userZines]);
  
  const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

  const manifestoData = useMemo(() => {
      // Compare Stated (Tailor) vs Actual (Archetypes)
      const stated = profile?.tailorDraft?.aestheticCore?.eraFocus || "Undefined";
      const actual = Object.keys(archetypeData).sort((a,b) => archetypeData[b] - archetypeData[a])[0] || "Undefined";
      
      const isAligned = stated.toLowerCase().includes(actual.toLowerCase()) || actual.toLowerCase().includes(stated.toLowerCase());
      
      // Build "Ideal" radar overlay (boost the Stated archetype)
      const overlay = { ...archetypeData };
      if (stated !== "Undefined") overlay[stated] = 100;

      return {
          radar: overlay,
          omissions: !isAligned ? [
              { category: 'Core Aesthetic', concept: stated, impact: `Your archive reflects '${actual}', but your manifesto claims '${stated}'.` }
          ] : []
      };
  }, [archetypeData, profile]);

  const wardContext = useMemo(() => ({
      curator: { radar: archetypeData, recentTags, rogueSignal },
      sentinel: { ...manifestoData, logs: agentLogs.slice(0, 10) },
      agentLogs: agentLogs.slice(0, 10)
  }), [archetypeData, recentTags, rogueSignal, manifestoData, agentLogs]);

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-[#FDFBF7] dark:bg-[#050505] text-nous-text dark:text-white transition-colors duration-1000 flex relative flex-col md:flex-row">
      
      <AnimatePresence>
          {showConsultation && <TheConsultation wardContext={wardContext} onClose={() => setShowConsultation(false)} />}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 flex flex-col pt-8 md:pt-20 pb-8 px-6 bg-stone-50/50 dark:bg-stone-900/20 shrink-0">
         <div className="mb-8 md:mb-12 space-y-2">
            <h1 className="font-serif text-3xl italic tracking-tighter">The Ward.</h1>
            <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Autonomous Governance</p>
         </div>

         <nav className="flex md:flex-col gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <button 
              onClick={() => setActiveModule('CURATOR')}
              className={`flex-1 md:w-full text-left p-3 border rounded-sm flex items-center justify-between transition-all whitespace-nowrap gap-4 ${activeModule === 'CURATOR' ? 'bg-white dark:bg-stone-800 border-black/10 dark:border-white/10 shadow-sm' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
               <span className="font-sans text-[9px] uppercase tracking-widest font-black">Module: Curator</span>
               <div className={`w-1.5 h-1.5 rounded-full ${activeModule === 'CURATOR' ? 'bg-emerald-500' : 'bg-stone-300'}`} />
            </button>
            
            <button 
              onClick={() => setActiveModule('SENTINEL')}
              className={`flex-1 md:w-full text-left p-3 border rounded-sm flex items-center justify-between transition-all whitespace-nowrap gap-4 ${activeModule === 'SENTINEL' ? 'bg-white dark:bg-stone-800 border-black/10 dark:border-white/10 shadow-sm' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
               <span className="font-sans text-[9px] uppercase tracking-widest font-black">Module: Sentinel</span>
               <div className={`w-1.5 h-1.5 rounded-full ${activeModule === 'SENTINEL' ? 'bg-red-500' : 'bg-stone-300'}`} />
            </button>
         </nav>

         <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5 space-y-4">
            {!isPatron && (
                <a 
                    href="https://buy.stripe.com/3cI4gtekA8L36kX3NDaEE00"
                    target="_blank"
                    className="w-full py-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-sm font-sans text-[8px] uppercase tracking-widest font-black flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-white transition-all mb-4"
                >
                    <Crown size={12} /> Patronage Required
                </a>
            )}

            <div className="space-y-2">
                <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2">
                    <Activity size={12} /> System Stream
                </span>
                {/* REAL AGENT FEED */}
                <div className="h-48 overflow-hidden relative">
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-stone-50 dark:from-[#0c0c0c] to-transparent pointer-events-none" />
                    <ul className="space-y-3">
                        {agentLogs.slice(0, 5).map(log => (
                            <li key={log.id} className="text-[9px] leading-tight text-stone-500 dark:text-stone-400 border-l border-stone-300 dark:border-stone-700 pl-3">
                                <span className={`uppercase font-bold ${log.agent === 'curator' ? 'text-indigo-400' : 'text-red-400'}`}>[{log.agent}]</span> {log.message}
                            </li>
                        ))}
                        {agentLogs.length === 0 && <li className="text-[9px] text-stone-400 italic">No agent activity recorded yet.</li>}
                    </ul>
                </div>
            </div>

            <button 
                onClick={() => setShowConsultation(true)}
                className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
                <Mic size={12} /> The Consultation
            </button>
         </div>
      </aside>

      {/* MAIN STAGE */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-20">
         <AnimatePresence mode="wait">
            {activeModule === 'CURATOR' && (
               <motion.div key="curator" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-16 pb-24">
                  <header className="border-b border-black/5 dark:border-white/5 pb-8 flex justify-between items-end">
                     <div>
                        <div className="flex items-center gap-3 text-emerald-500 mb-2">
                            <Scan size={18} />
                            <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">Pattern Recognition Engine</span>
                        </div>
                        <h2 className="font-serif text-5xl md:text-6xl italic tracking-tighter text-nous-text dark:text-white">Curator.</h2>
                        <p className="font-serif italic text-lg text-stone-500 mt-4 max-w-xl">
                            Analysis of {pocketData.length} accumulated shards reveals the following semiotic clusters. This is your "Actual" aesthetic footprint.
                        </p>
                     </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                     <section className="space-y-8">
                        <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 pb-2">Aesthetic Distribution</h3>
                        <div className="p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm flex items-center justify-center">
                           <RadarChart data={archetypeData} />
                        </div>

                        <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 pb-2 mt-12">Tone Distribution</h3>
                        <div className="p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm flex items-center justify-center h-64">
                           {toneDistributionData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                 <Pie
                                   data={toneDistributionData}
                                   cx="50%"
                                   cy="50%"
                                   innerRadius={60}
                                   outerRadius={80}
                                   paddingAngle={5}
                                   dataKey="value"
                                   stroke="none"
                                 >
                                   {toneDistributionData.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                   ))}
                                 </Pie>
                                 <Tooltip 
                                   contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                                   itemStyle={{ color: '#10B981' }}
                                 />
                               </PieChart>
                             </ResponsiveContainer>
                           ) : (
                             <span className="font-mono text-[9px] text-stone-400 italic">No tone data available.</span>
                           )}
                        </div>
                     </section>

                     <section className="space-y-12">
                        <div className="space-y-6">
                           <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 pb-2">Signal Velocity</h3>
                           <SignalVelocity data={velocityData} />
                        </div>

                        <div className="space-y-6">
                           <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 pb-2">Manifestation Activity</h3>
                           <div className="p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm h-48">
                              {zineActivityData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={zineActivityData}>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#78716c' }} dy={10} />
                                    <Tooltip 
                                      cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                                      contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]} maxBarSize={40} />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <span className="font-mono text-[9px] text-stone-400 italic">No activity data available.</span>
                                </div>
                              )}
                           </div>
                        </div>

                        {rogueSignal && (
                            <div className="space-y-6">
                                <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 pb-2">Outlier Detection</h3>
                                <RogueSignal tag={rogueSignal.tag} impact={rogueSignal.impact} />
                            </div>
                        )}

                        <div className="space-y-6">
                           <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 border-b border-black/5 pb-2">Tag Harvest (Recent)</h3>
                           <TagHarvest tags={recentTags} />
                        </div>
                     </section>
                  </div>
               </motion.div>
            )}

            {activeModule === 'SENTINEL' && (
               <motion.div key="sentinel" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-16 pb-24">
                  <header className="border-b border-black/5 dark:border-white/5 pb-8">
                     <div className="flex items-center gap-3 text-red-500 mb-2">
                        <ShieldCheck size={18} />
                        <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">Drift Governance</span>
                     </div>
                     <h2 className="font-serif text-5xl md:text-6xl italic tracking-tighter text-nous-text dark:text-white">Sentinel.</h2>
                     <p className="font-serif italic text-lg text-stone-500 mt-4 max-w-xl">
                        Monitoring deviation between your Stated Manifesto (Tailor) and your Actual Output (Curator).
                     </p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                     <div className="lg:col-span-4 space-y-12">
                        <section className="p-8 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm space-y-2">
                           <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Total Artifacts</span>
                           <div className="flex items-baseline gap-4">
                              <span className="font-mono text-6xl font-light text-nous-text dark:text-white">{pocketData.length}</span>
                              <span className="font-mono text-xs text-emerald-500">Active</span>
                           </div>
                        </section>

                        <section className="space-y-6">
                           <div className="flex items-center justify-between border-b border-black/5 pb-2">
                              <span className="font-sans text-[9px] uppercase tracking-widest font-black text-red-500">The Omission Index</span>
                              <AlertCircle size={12} className="text-red-500" />
                           </div>
                           <OmissionIndex missing={manifestoData.omissions} />
                           {manifestoData.omissions.length === 0 && <p className="font-serif italic text-sm text-stone-400">No major omissions detected. Alignment nominal.</p>}
                        </section>

                        <section className="space-y-6 mt-12">
                           <div className="flex items-center justify-between border-b border-black/5 pb-2">
                              <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Manifest Activity</span>
                           </div>
                           <div className="p-8 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm flex items-center justify-center h-48">
                             {zineActivityData.length > 0 ? (
                               <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={zineActivityData}>
                                   <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                   <Tooltip 
                                     contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                                     cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                                   />
                                   <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                                 </BarChart>
                               </ResponsiveContainer>
                             ) : (
                               <span className="font-mono text-[9px] text-stone-400 italic">No recent activity.</span>
                             )}
                           </div>
                        </section>
                     </div>

                     <div className="lg:col-span-8 space-y-8">
                        <div className="flex justify-between items-center">
                           <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Manifesto (Dashed) vs. Actual (Solid)</h3>
                           <div className="flex gap-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-0.5 bg-emerald-500" />
                                 <span className="font-sans text-[7px] font-black text-stone-400">REALITY</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-0.5 bg-stone-800 border-t border-dashed" />
                                 <span className="font-sans text-[7px] font-black text-stone-400">INTENT</span>
                              </div>
                           </div>
                        </div>
                        <div className="aspect-square w-full max-w-lg mx-auto bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full flex items-center justify-center relative">
                           <div className="absolute inset-0 bg-emerald-500/5 rounded-full filter blur-3xl opacity-50" />
                           <RadarChart data={archetypeData} overlayData={manifestoData.radar} size={450} />
                        </div>
                        
                        <div className="mt-8 border-t border-stone-100 dark:border-stone-800 pt-8">
                            <h3 className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 mb-4">Live Agent Feed</h3>
                            <AgentStream logs={agentLogs} />
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </main>
    </div>
  );
};
