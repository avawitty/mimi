
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { scryTrendSynthesis } from '../services/geminiService';
import { scryShadowMemory } from '../services/vectorSearch';
import { fetchPocketItems } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Radar, ArrowRight, Eye, RefreshCw, X, BrainCircuit, Search, Ghost, Filter, Clock, Layers, Info, CornerDownRight } from 'lucide-react';

export const ScryView: React.FC = () => {
  const { user, profile } = useUser();
  const { logEvent } = useTasteLogging();
  
  const [activeTab, setActiveTab] = useState<'trend' | 'shadow'>('trend');
  
  // Trend Scry State
  const [scryResult, setScryResult] = useState<any>(null);
  const [isScrying, setIsScrying] = useState(false);

  // Shadow Scry State
  const [shadowQuery, setShadowQuery] = useState('');
  const [shadowResults, setShadowResults] = useState<any[]>([]);
  const [isShadowSearching, setIsShadowSearching] = useState(false);
  
  // New Filters
  const [filterType, setFilterType] = useState<'all' | 'zine' | 'shard'>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  const handleTrendScry = async () => {
    if (!user) return;
    setIsScrying(true);
    try {
      const pocket = await fetchPocketItems(user.uid);
      const result = await scryTrendSynthesis(pocket, profile);
      setScryResult(result);
      
      logEvent('scry', {
        raw_text: 'Aesthetic divination from pocket archive',
        user_intent: 'Understanding taste trajectory'
      }, {
        scry_insights: result,
        taste_snapshot: profile?.tasteProfile
      }).catch(err => console.warn(err));
    } catch (e) {
      console.error("MIMI // Scry Failed:", e);
    } finally {
      setIsScrying(false);
    }
  };

  const handleShadowSearch = async () => {
    if (!shadowQuery.trim()) return;
    setIsShadowSearching(true);
    try {
        const results = await scryShadowMemory(shadowQuery, { filterType, timeRange });
        setShadowResults(results);
    } catch (e) {
        console.error("MIMI // Shadow Search Failed:", e);
    } finally {
        setIsShadowSearching(false);
    }
  };

  const handleApplyInsights = () => {
    if (!scryResult) return;
    const payload = {
        suggestedExperiments: scryResult.pattern_signals || [],
        identifiedDrifts: scryResult.structural_shifts || "",
        culturalContext: scryResult.cultural_forces || ""
    };
    window.dispatchEvent(new CustomEvent('mimi:change_view', {
      detail: 'tailor',
      detail_data: payload
    }));
  };

  const handleNavigateToResult = (result: any) => {
    if (result.type === 'zine') {
        window.dispatchEvent(new CustomEvent('mimi:change_view', { 
            detail: 'reveal_artifact', 
            detail_id: result.originalId 
        }));
    } else {
        window.dispatchEvent(new CustomEvent('mimi:change_view', { 
            detail: 'archival', 
            detail_data: { focusId: result.originalId }
        }));
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar pb-64 px-6 md:px-16 pt-12 md:pt-20 bg-[#050505] text-white transition-all duration-1000 relative selection:bg-emerald-500 selection:text-white">
        
        <div className="max-w-4xl mx-auto space-y-16 py-12">
            <header className="space-y-6 text-center">
                <div className="flex items-center justify-center gap-3 text-emerald-500">
                    <Eye size={24} className="animate-pulse" />
                    <span className="font-sans text-[10px] uppercase tracking-[0.6em] font-black italic">The Oracle Divines</span>
                </div>
                <h1 className="font-header text-6xl md:text-8xl italic tracking-tighter leading-none text-white">Trajectory.</h1>
                <p className="font-serif italic text-xl text-stone-400 max-w-lg mx-auto leading-tight">
                    Cast the runes against your accumulated debris. See where your taste is drifting before it arrives.
                </p>
                
                <div className="flex justify-center gap-8 pt-8">
                    <button 
                        onClick={() => setActiveTab('trend')} 
                        className={`font-sans text-[9px] uppercase tracking-widest font-black pb-2 border-b-2 transition-all ${activeTab === 'trend' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
                    >
                        Trend Synthesis
                    </button>
                    <button 
                        onClick={() => setActiveTab('shadow')} 
                        className={`font-sans text-[9px] uppercase tracking-widest font-black pb-2 border-b-2 transition-all ${activeTab === 'shadow' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
                    >
                        Shadow Memory
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'trend' ? (
                    <motion.div key="trend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                        {!scryResult ? (
                            <div className="flex justify-center py-12">
                                <button 
                                    onClick={handleTrendScry} 
                                    disabled={isScrying}
                                    className="group relative px-12 py-6 bg-emerald-500/10 border border-emerald-500/30 rounded-full overflow-hidden hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        {isScrying ? <Loader2 size={20} className="animate-spin text-emerald-400" /> : <Sparkles size={20} className="text-emerald-400" />}
                                        <span className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-emerald-100">
                                            {isScrying ? 'Parsing Resonance...' : 'Cast Runes'}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                <div className="grid md:grid-cols-2 gap-12 border-t border-emerald-900/30 pt-12">
                                    <section className="space-y-6">
                                        <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-500 block border-b border-white/10 pb-2">Pattern Signals</span>
                                        <ul className="space-y-4">
                                            {scryResult.pattern_signals?.map((signal: string, i: number) => (
                                                <motion.li 
                                                    key={i} 
                                                    initial={{ opacity: 0, x: -10 }} 
                                                    animate={{ opacity: 1, x: 0 }} 
                                                    transition={{ delay: i * 0.1 }}
                                                    className="pl-4 border-l-2 border-emerald-500 font-serif italic text-xl md:text-2xl text-stone-200"
                                                >
                                                    {signal}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className="space-y-10">
                                        <div className="space-y-4">
                                            <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-500 block border-b border-white/10 pb-2">Structural Shifts</span>
                                            <p className="font-serif italic text-lg text-emerald-100/80 leading-relaxed">
                                                "{scryResult.structural_shifts}"
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-500 block border-b border-white/10 pb-2">Cultural Forces</span>
                                            <p className="font-serif italic text-lg text-stone-400 leading-relaxed">
                                                {scryResult.cultural_forces}
                                            </p>
                                        </div>
                                    </section>
                                </div>

                                <section className="p-8 bg-emerald-950/20 border border-emerald-900/40 rounded-sm text-center space-y-4">
                                    <span className="font-sans text-[8px] uppercase tracking-widest font-black text-emerald-600">Projected Horizon</span>
                                    <p className="font-serif text-3xl italic text-white tracking-tight">{scryResult.time_horizon}</p>
                                </section>

                                <div className="flex flex-col md:flex-row justify-center gap-6 pt-8">
                                    <button onClick={handleApplyInsights} className="px-10 py-4 bg-white text-black rounded-full font-sans text-[9px] uppercase tracking-[0.3em] font-black hover:bg-emerald-400 transition-all flex items-center gap-4 shadow-xl">
                                        Apply to Tailor <ArrowRight size={14} />
                                    </button>
                                    <button onClick={() => setScryResult(null)} className="px-10 py-4 border border-white/10 text-stone-400 rounded-full font-sans text-[9px] uppercase tracking-[0.3em] font-black hover:text-white transition-all flex items-center gap-4">
                                        <RefreshCw size={14} /> Recalibrate
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="shadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                        
                        <div className="flex items-start gap-4 p-6 bg-indigo-900/20 border border-indigo-500/20 rounded-xl">
                           <Info size={18} className="text-indigo-400 shrink-0 mt-1" />
                           <div className="space-y-2">
                              <span className="font-sans text-[9px] uppercase tracking-widest font-black text-indigo-300">Shadow Memory Protocol</span>
                              <p className="font-serif italic text-sm text-indigo-100/80 leading-relaxed">
                                Local-first, vector indexing, and sovereign privacy mandate. Query the conceptual shadow of your archive. Vector embeddings identify resonance over exact terminology.
                              </p>
                           </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                           <div className="inline-flex bg-stone-900/80 border border-indigo-900/30 rounded-full p-1 gap-1">
                              <button onClick={() => setFilterType('all')} className={`px-4 py-1.5 rounded-full font-sans text-[9px] uppercase font-black tracking-widest transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>All Signals</button>
                              <button onClick={() => setFilterType('zine')} className={`px-4 py-1.5 rounded-full font-sans text-[9px] uppercase font-black tracking-widest transition-all ${filterType === 'zine' ? 'bg-indigo-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>Zines</button>
                              <button onClick={() => setFilterType('shard')} className={`px-4 py-1.5 rounded-full font-sans text-[9px] uppercase font-black tracking-widest transition-all ${filterType === 'shard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>Shards</button>
                           </div>

                           <div className="inline-flex bg-stone-900/80 border border-indigo-900/30 rounded-full p-1 gap-1">
                              <button onClick={() => setTimeRange('all')} className={`px-4 py-1.5 rounded-full font-sans text-[9px] uppercase font-black tracking-widest transition-all ${timeRange === 'all' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}>Ever</button>
                              <button onClick={() => setTimeRange('week')} className={`px-4 py-1.5 rounded-full font-sans text-[9px] uppercase font-black tracking-widest transition-all ${timeRange === 'week' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}>Week</button>
                              <button onClick={() => setTimeRange('month')} className={`px-4 py-1.5 rounded-full font-sans text-[9px] uppercase font-black tracking-widest transition-all ${timeRange === 'month' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}>Month</button>
                           </div>
                        </div>

                        <div className="relative max-w-xl mx-auto group">
                            <input 
                                type="text" 
                                value={shadowQuery}
                                onChange={(e) => setShadowQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleShadowSearch()}
                                placeholder="e.g. Themes of sadness, or specific moods..."
                                className="w-full bg-stone-900/50 border border-indigo-900/30 rounded-full py-5 pl-8 pr-16 text-white font-serif italic text-2xl focus:outline-none focus:border-indigo-500 transition-all shadow-[0_0_40px_rgba(79,70,229,0.05)] placeholder:text-stone-700"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={handleShadowSearch}
                                    disabled={isShadowSearching || !shadowQuery.trim()}
                                    className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xl active:scale-95"
                                >
                                    {isShadowSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 min-h-[400px] pt-8">
                            <AnimatePresence>
                                {shadowResults.map((result, idx) => (
                                    <motion.div 
                                        key={result.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => handleNavigateToResult(result)}
                                        className="group p-8 bg-stone-900/40 border border-white/5 rounded-sm flex items-start gap-6 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        {result.display_image ? (
                                            <div className="w-20 h-28 shrink-0 bg-black rounded-sm overflow-hidden border border-white/5 shadow-2xl">
                                                <img src={result.display_image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1s]" />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-28 shrink-0 bg-stone-800 rounded-sm flex items-center justify-center text-stone-600 border border-white/5">
                                                {result.type === 'zine' ? <Layers size={32} /> : <Filter size={32} />}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="font-sans text-[8px] uppercase tracking-widest font-black text-indigo-400">
                                                    {result.type.toUpperCase()} • {(result.similarity * 100).toFixed(0)}% Refraction
                                                </span>
                                                <CornerDownRight size={12} className="text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="font-serif italic text-stone-300 text-lg md:text-xl line-clamp-4 leading-snug group-hover:text-white transition-colors">
                                                "{result.content_preview}"
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            
                            {shadowResults.length === 0 && !isShadowSearching && shadowQuery && (
                                <div className="col-span-full py-32 text-center opacity-20 space-y-6">
                                    <Ghost size={64} className="mx-auto" />
                                    <p className="font-serif italic text-3xl">“No resonance found in the shadow.”</p>
                                    <button onClick={() => setShadowQuery('')} className="font-sans text-[8px] uppercase tracking-widest font-black text-indigo-400 border-b border-indigo-400 pb-0.5">Clear Threshold</button>
                                </div>
                            )}
                            
                            {!shadowQuery && shadowResults.length === 0 && !isShadowSearching && (
                                <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-10 gap-6">
                                    <BrainCircuit size={80} strokeWidth={0.5} />
                                    <p className="font-sans text-[10px] uppercase tracking-[0.8em] font-black">Shadow_Registry_Standby</p>
                                </div>
                            )}
                        </div>
                        
                        <footer className="text-center pt-12 opacity-30 border-t border-stone-900">
                            <p className="font-sans text-[8px] uppercase tracking-[0.5em] font-black text-stone-500">
                                Local-First Vector Indexing // Sovereign Privacy Mandate
                            </p>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};
