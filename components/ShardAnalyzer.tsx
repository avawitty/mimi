
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Target, X, Loader2, Sparkles, Activity, Layers, ArrowRight, Info, CheckCircle, AlertTriangle, Radio } from 'lucide-react';
import { analyzeVisualShards } from '../services/geminiService';
import { TailorLogicDraft } from '../types';

interface ShardAnalyzerProps {
  shards: string[];
  draft: TailorLogicDraft;
  onClose?: () => void;
}

export const ShardAnalyzer: React.FC<ShardAnalyzerProps> = ({ shards, draft, onClose }) => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAudit = async () => {
    if (!shards || shards.length === 0) return;
    setLoading(true);
    setReport(null);
    setError(null);
    try {
      const res = await analyzeVisualShards(shards, draft);
      if (!res) throw new Error("Visual signal lost in the threshold.");
      setReport(res);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Resonance Mapping Complete.", icon: <CheckCircle size={14} className="text-emerald-500" /> } 
      }));
    } catch (e) {
      console.error("MIMI // Shard Audit Failure:", e);
      setError(e.message || "Oracle Handshake Failed.");
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "The Shard Oracle is silent. Recalibrate fragments.", icon: <Radio size={14} className="text-red-500" /> } 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-12 py-12 border-t border-black/5 dark:border-white/5 animate-fade-in">
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-emerald-500">
            <Radar size={16} className={loading ? 'animate-spin' : ''} />
            <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black italic">Visual Language Reflection</span>
          </div>
          <p className="font-serif italic text-sm text-stone-500">Audit your visual artifacts against your stated core logic.</p>
        </div>
        {!report && !loading && (
          <button 
            onClick={performAudit}
            disabled={!shards || shards.length === 0}
            className="px-8 py-3 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-xl active:scale-95 transition-all disabled:opacity-30"
          >
            Conduct Audit
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center gap-6">
            <div className="relative">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <div className="absolute inset-0 border-t border-emerald-500 rounded-full animate-ping opacity-20" />
            </div>
            <span className="font-sans text-[8px] uppercase tracking-[0.6em] text-stone-500 font-black animate-pulse">Triangulating Frequencies...</span>
          </motion.div>
        ) : error ? (
           <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-6">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full border border-red-100 dark:border-red-900/30 inline-block">
                <AlertTriangle size={24} className="text-red-500 animate-pulse" />
              </div>
              <p className="font-serif italic text-xl text-stone-500">"{error}"</p>
              <button onClick={performAudit} className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500 border-b border-emerald-500 pb-1">Retry Analysis</button>
           </motion.div>
        ) : report ? (
          <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-12 gap-12 px-4">
             <div className="md:col-span-4 space-y-8">
                <div className="p-8 bg-stone-50 dark:bg-stone-900 rounded-sm border border-black/5 dark:border-white/5 space-y-6">
                   <div className="space-y-1">
                      <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Resonance Score</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-6xl italic leading-none">{report.resonanceScore}%</span>
                        <Activity size={18} className="text-emerald-500 animate-pulse" />
                      </div>
                   </div>
                   
                   <div className="space-y-2 pt-4 border-t border-black/5 dark:border-white/5">
                      <span className="font-sans text-[8px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-black">Generated Reflection</span>
                      <p className="font-serif italic text-base text-stone-600 dark:text-stone-300 leading-snug">"{report.summary}"</p>
                   </div>
                </div>

                <div className="p-8 border border-emerald-500/10 bg-emerald-50/5 rounded-sm space-y-4">
                   <div className="flex items-center gap-3 text-emerald-500">
                      <Layers size={14} />
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">Archival Redirects</span>
                   </div>
                   <ul className="space-y-2">
                      {report.archivalRedirects?.map((r, i) => (
                        <li key={i} className="font-serif italic text-sm text-stone-500">• {r}</li>
                      ))}
                   </ul>
                </div>
             </div>

             <div className="md:col-span-8 grid md:grid-cols-2 gap-12 border-l border-black/5 dark:border-white/5 pl-12">
                <section className="space-y-6">
                   <div className="flex items-center gap-3 text-emerald-500">
                      <CheckCircle size={14} />
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">Thematic Parallels</span>
                   </div>
                   <div className="space-y-4">
                      {report.resonanceClusters?.map((c, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-sm shadow-sm">
                           <p className="font-serif italic text-lg text-stone-600 dark:text-stone-300">"{c}"</p>
                        </div>
                      ))}
                   </div>
                </section>

                <section className="space-y-6">
                   <div className="flex items-center gap-3 text-amber-500">
                      <AlertTriangle size={14} />
                      <span className="font-sans text-[8px] uppercase tracking-widest font-black">Divergent Signals</span>
                   </div>
                   <div className="space-y-4">
                      {report.divergentSignals?.map((s, i) => (
                        <div key={i} className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-900 rounded-sm">
                           <p className="font-serif italic text-lg text-stone-500 group-hover:text-stone-300 transition-colors">"{s}"</p>
                        </div>
                      ))}
                   </div>
                </section>
             </div>

             <div className="md:col-span-12 pt-12 border-t border-black/5 flex justify-center">
                <button onClick={() => setReport(null)} className="font-sans text-[8px] uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors flex items-center gap-2">
                   <X size={12} /> Clear Audit Data
                </button>
             </div>
          </motion.div>
        ) : (!shards || shards.length === 0) ? (
          <div className="py-20 text-center opacity-20">
             <Target size={48} className="mx-auto mb-4" />
             <p className="font-serif italic text-2xl">Upload shards to begin analysis.</p>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
