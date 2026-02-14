
// @ts-nocheck
import React, { useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { useAgents } from '../contexts/AgentContext';
import { ShieldCheck, Activity, BrainCircuit, AlertTriangle, Fingerprint, Layers, Clock, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const IntegrityMeter: React.FC<{ score: number }> = ({ score }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Structural Integrity</span>
      <span className="font-mono text-xl font-black text-emerald-500">{score}%</span>
    </div>
    <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={`h-full ${score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
      />
    </div>
  </div>
);

const ArchetypeBar: React.FC<{ label: string, count: number, total: number }> = ({ label, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-serif italic text-sm text-stone-600 dark:text-stone-300">{label.replace(/-/g, ' ')}</span>
        <span className="font-mono text-[9px] text-stone-400">{Math.round(percentage)}%</span>
      </div>
      <div className="h-1 w-full bg-stone-50 dark:bg-stone-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className="h-full bg-nous-text dark:bg-white"
        />
      </div>
    </div>
  );
};

export const SentinelView: React.FC = () => {
  const { profile } = useUser();
  const { agentLogs } = useAgents();

  const archetypes = profile?.tasteProfile?.archetype_weights || {};
  const totalWeight = Object.values(archetypes).reduce((a, b) => a + b, 0);
  
  // Calculate "Integrity": How focused is the taste? (High dominance = High integrity)
  const integrityScore = useMemo(() => {
    if (totalWeight === 0) return 0;
    const max = Math.max(...Object.values(archetypes));
    // Normalize: If one archetype is 100% of weight, score is 100. If spread thin, score is lower.
    return Math.min(100, Math.round((max / totalWeight) * 100 * 1.5)); 
  }, [archetypes, totalWeight]);

  const recentDrifts = profile?.tasteProfile?.audit_history || [];

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-64 px-6 md:px-16 pt-12 md:pt-20 bg-nous-base dark:bg-[#050505] text-nous-text dark:text-white transition-all duration-1000 relative">
      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        
        {/* HEADER */}
        <header className="space-y-8 border-b border-black/5 dark:border-white/5 pb-12">
          <div className="flex items-center gap-4 text-emerald-500">
             <ShieldCheck size={18} className="animate-pulse" />
             <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">System Self-Reflection</span>
          </div>
          <div className="space-y-4">
            <h2 className="font-serif text-5xl md:text-7xl italic tracking-tighter leading-none">The Sentinel.</h2>
            <p className="font-serif italic text-xl text-stone-500 max-w-2xl">
               Visualization of your aesthetic algorithm. The Sentinel tracks consistency, drift, and structural integrity across all manifests.
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN: THE ALGORITHM */}
            <div className="md:col-span-7 space-y-12">
               
               {/* FINGERPRINT CARD */}
               <section className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-10 rounded-sm shadow-sm space-y-8">
                  <div className="flex items-start justify-between">
                     <div className="space-y-2">
                        <div className="flex items-center gap-3 text-stone-400">
                           <Fingerprint size={16} />
                           <span className="font-sans text-[8px] uppercase tracking-widest font-black">Aesthetic Fingerprint</span>
                        </div>
                        <h3 className="font-serif text-3xl italic tracking-tighter">Dominant Logic.</h3>
                     </div>
                     <IntegrityMeter score={integrityScore} />
                  </div>

                  <div className="space-y-6 pt-4">
                     {Object.entries(archetypes)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([key, count]) => (
                           <ArchetypeBar key={key} label={key} count={count} total={totalWeight} />
                        ))
                     }
                     {totalWeight === 0 && (
                        <div className="text-center py-8 opacity-40">
                           <Activity size={24} className="mx-auto mb-2" />
                           <p className="font-sans text-[8px] uppercase tracking-widest font-black">No Signal Detected</p>
                        </div>
                     )}
                  </div>
               </section>

               {/* RECENT AGENT LOGS */}
               <section className="space-y-6">
                  <div className="flex items-center gap-3 text-stone-400">
                     <BrainCircuit size={14} />
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Agent Activity Log</span>
                  </div>
                  <div className="border-l border-stone-200 dark:border-stone-800 space-y-8 pl-8 relative">
                     {agentLogs.length > 0 ? agentLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="relative">
                           <div className={`absolute -left-[37px] top-1 w-2 h-2 rounded-full ${log.agent === 'sentinel' ? 'bg-red-500' : 'bg-indigo-500'} ring-4 ring-white dark:ring-[#050505]`} />
                           <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-baseline">
                                 <span className={`font-sans text-[8px] uppercase tracking-widest font-black ${log.agent === 'sentinel' ? 'text-red-500' : 'text-indigo-500'}`}>{log.agent}</span>
                                 <span className="font-mono text-[8px] text-stone-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300">{log.message}</p>
                           </div>
                        </div>
                     )) : (
                        <p className="font-serif italic text-sm text-stone-400">System quiet. No agents active.</p>
                     )}
                  </div>
               </section>
            </div>

            {/* RIGHT COLUMN: DRIFT & ALERTS */}
            <div className="md:col-span-5 space-y-12">
               
               {/* DRIFT ALERT CARD */}
               <div className="p-8 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-sm space-y-6">
                  <div className="flex items-center gap-3 text-amber-500">
                     <AlertTriangle size={16} />
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Drift Detection</span>
                  </div>
                  <p className="font-serif italic text-lg text-stone-500 leading-relaxed text-balance">
                     The Sentinel monitors deviations from your stated "Tailor" manifesto. High drift indicates an evolving aesthetic or a loss of coherence.
                  </p>
                  
                  <div className="space-y-4 pt-4">
                     {recentDrifts.length > 0 ? recentDrifts.slice().reverse().slice(0, 3).map((drift, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-white dark:bg-stone-900 rounded-sm shadow-sm border border-black/5 dark:border-white/5">
                           <Zap size={14} className="text-amber-500 mt-1 shrink-0" />
                           <div className="space-y-1">
                              <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400 block">{new Date(drift.timestamp).toLocaleDateString()}</span>
                              <p className="font-serif italic text-sm text-stone-700 dark:text-stone-200">
                                 Shift from <span className="font-bold">{drift.before.archetype || 'Void'}</span> to <span className="font-bold">{drift.after.archetype}</span>
                              </p>
                           </div>
                        </div>
                     )) : (
                        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-emerald-600 dark:text-emerald-400">
                           <CheckCircle size={14} />
                           <span className="font-sans text-[9px] uppercase tracking-widest font-black">Zero Drift Detected</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* CURRENT MANDATE */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 text-stone-400">
                     <Target size={16} />
                     <span className="font-sans text-[8px] uppercase tracking-widest font-black">Active Mandate</span>
                  </div>
                  <div className="p-8 bg-black text-white rounded-sm space-y-6 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-20"><Layers size={64} /></div>
                     <div className="relative z-10 space-y-4">
                        <span className="font-sans text-[9px] uppercase tracking-widest text-emerald-500 font-black">Primary Logic</span>
                        <p className="font-header text-3xl italic tracking-tighter leading-none">
                           "{profile?.tailorDraft?.aestheticCore?.eraFocus || "Undefined Era"} / {profile?.tasteProfile?.dominant_archetypes?.[0] || "Unknown Archetype"}"
                        </p>
                        <p className="font-serif italic text-stone-400 text-sm border-t border-white/20 pt-4">
                           Use the Tailor view to recalibrate this core logic if the Sentinel reports high drift.
                        </p>
                     </div>
                  </div>
               </div>

            </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircle = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
