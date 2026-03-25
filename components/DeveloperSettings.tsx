
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SemanticSteps } from './SemanticSteps';
import { X, Cpu, ShieldCheck, Sparkles, Activity, Terminal, Play, Settings } from 'lucide-react';
import { useAgents } from '../contexts/AgentContext';

export const DeveloperSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
 const { agentConfig, setAgentConfig, agentLogs, triggerManualSentinel, activeAgents } = useAgents();
 const [activeTab, setActiveTab] = useState<'config' | 'console'>('config');
 const logsEndRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [agentLogs, activeTab]);

 return (
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-[12000] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-6"
 >
 <div className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-none p-8 md:p-12 space-y-10 flex flex-col max-h-[85vh]">
 <div className="flex justify-between items-start shrink-0">
 <div className="space-y-2">
 <div className="flex items-center gap-3 text-stone-500">
 <Cpu size={18} />
 <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">System Logic</span>
 </div>
 <h2 className="font-serif text-3xl italic text-white">Agent Protocols.</h2>
 </div>
 <button onClick={onClose} className="p-2 text-stone-500 hover:text-white"><X size={24} /></button>
 </div>

 <div className="flex gap-8 border-b border-white/5 shrink-0">
 <button onClick={() => setActiveTab('config')} className={`pb-3 font-sans text-[9px] uppercase tracking-widest font-black transition-all ${activeTab === 'config' ? 'text-white border-b-2 border-white' : 'text-stone-500'}`}>
 Configuration
 </button>
 <button onClick={() => setActiveTab('console')} className={`pb-3 font-sans text-[9px] uppercase tracking-widest font-black transition-all ${activeTab === 'console' ? 'text-white border-b-2 border-white' : 'text-stone-500'}`}>
 Live Console
 </button>
 </div>

 <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
 <AnimatePresence mode="wait">
 {activeTab === 'config' ? (
 <motion.div key="config"initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
 <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-none">
 <div className="space-y-1">
 <div className="flex items-center gap-2 text-white">
 <Sparkles size={14} className="text-indigo-400"/>
 <span className="font-sans text-[8px] uppercase tracking-widest font-black">The Curator</span>
 </div>
 <p className="font-serif italic text-xs text-stone-500">Auto-enrich uploads with cultural metadata.</p>
 </div>
 <button 
 onClick={() => setAgentConfig({ ...agentConfig, curatorEnabled: !agentConfig.curatorEnabled })}
 className={`w-12 h-6 rounded-none transition-colors relative ${agentConfig.curatorEnabled ? 'bg-stone-600' : 'bg-stone-800'}`}
 >
 <div className={`absolute top-1 w-4 h-4 bg-white rounded-none transition-all ${agentConfig.curatorEnabled ? 'left-7' : 'left-1'}`} />
 </button>
 </div>

 <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-none">
 <div className="space-y-1">
 <div className="flex items-center gap-2 text-white">
 <ShieldCheck size={14} className="text-red-400"/>
 <span className="font-sans text-[8px] uppercase tracking-widest font-black">The Sentinel</span>
 </div>
 <p className="font-serif italic text-xs text-stone-500">Audit aesthetic drift against manifesto.</p>
 </div>
 <button 
 onClick={() => setAgentConfig({ ...agentConfig, sentinelEnabled: !agentConfig.sentinelEnabled })}
 className={`w-12 h-6 rounded-none transition-colors relative ${agentConfig.sentinelEnabled ? 'bg-stone-600' : 'bg-stone-800'}`}
 >
 <div className={`absolute top-1 w-4 h-4 bg-white rounded-none transition-all ${agentConfig.sentinelEnabled ? 'left-7' : 'left-1'}`} />
 </button>
 </div>

 <div className="space-y-6 pt-4 border-t border-white/5">
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <div className="flex flex-col">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Curator Thinking Budget</span>
 <span className="font-serif italic text-[10px] text-stone-600">Impact: Semiotic depth of shard analysis.</span>
 </div>
 <span className="font-mono text-[10px] text-stone-500">{agentConfig.curatorThinkingBudget} Tokens</span>
 </div>
 <SemanticSteps 
 steps={[
 { label: 'Low', value: 1024 },
 { label: 'Medium', value: 4096 },
 { label: 'High', value: 8192 },
 { label: 'Max', value: 16384 }
 ]}
 value={agentConfig.curatorThinkingBudget}
 onChange={(val) => setAgentConfig({ ...agentConfig, curatorThinkingBudget: val })}
 />
 <p className="font-serif italic text-[10px] text-stone-500 leading-relaxed">
 A higher budget for the Curator allows it to perform deeper cultural cross-referencing and more sophisticated semiotic decoding of your shards. 
 <span className="text-amber-500/60 ml-1">Warning: High values increase analysis latency.</span>
 </p>
 </div>

 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <div className="flex flex-col">
 <span className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Sentinel Thinking Budget</span>
 <span className="font-serif italic text-[10px] text-stone-600">Impact: Precision of aesthetic drift detection.</span>
 </div>
 <span className="font-mono text-[10px] text-stone-500">{agentConfig.sentinelThinkingBudget} Tokens</span>
 </div>
 <SemanticSteps 
 steps={[
 { label: 'Low', value: 1024 },
 { label: 'Medium', value: 4096 },
 { label: 'High', value: 8192 },
 { label: 'Max', value: 16384 }
 ]}
 value={agentConfig.sentinelThinkingBudget}
 onChange={(val) => setAgentConfig({ ...agentConfig, sentinelThinkingBudget: val })}
 />
 <p className="font-serif italic text-[10px] text-stone-500 leading-relaxed">
 The Sentinel uses this budget to audit your recent debris against your stated Manifesto. 
 Higher budgets result in more nuanced detection of aesthetic drift and more insightful clinical observations.
 </p>
 </div>

 <div className="p-4 bg-stone-500/5 border border-stone-500/10 rounded-none">
 <p className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 mb-2 flex items-center gap-2">
 <Activity size={10} /> Performance Note
 </p>
 <p className="font-serif italic text-[10px] text-stone-400 leading-relaxed">
 Thinking budgets determine the maximum reasoning effort the model can expend. 
 Increasing these values improves generation quality and reasoning depth but will result in longer"thinking"times before the agent files its report.
 </p>
 </div>
 </div>
 </motion.div>
 ) : (
 <motion.div key="console"initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full space-y-6">
 <div className="flex-1 bg-black/60 border border-stone-800 p-4 rounded-none font-mono text-[10px] text-stone-300 overflow-y-auto min-h-[300px] space-y-2">
 {agentLogs.length === 0 && <span className="text-stone-600 italic">System quiet. No agents active.</span>}
 {agentLogs.map(log => (
 <div key={log.id} className="border-b border-stone-900 pb-2 mb-2 last:border-0">
 <div className="flex gap-2 items-center mb-1">
 <span className="text-stone-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
 <span className={`uppercase font-bold ${log.agent === 'curator' ? 'text-indigo-400' : 'text-red-400'}`}>[{log.agent}]</span>
 </div>
 <p className="pl-14">{log.message}</p>
 {log.data && (
 <pre className="pl-14 mt-1 text-stone-500 overflow-x-auto">{JSON.stringify(log.data, null, 2)}</pre>
 )}
 </div>
 ))}
 <div ref={logsEndRef} />
 </div>
 
 <div className="flex gap-4">
 <button 
 onClick={triggerManualSentinel}
 disabled={activeAgents.includes('sentinel')}
 className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-none font-sans text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
 >
 {activeAgents.includes('sentinel') ? <Activity size={12} className="animate-spin"/> : <Play size={12} />}
 Run Sentinel Audit
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </motion.div>
 );
};
