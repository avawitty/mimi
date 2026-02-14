
// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTasteLogging } from '../hooks/useTasteLogging';
import { scryTrendSynthesis } from '../services/geminiService';
import { scryShadowMemory } from '../services/vectorSearch';
import { fetchPocketItems } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Radar, ArrowRight, Eye, RefreshCw, X, BrainCircuit, Search, Ghost, Filter, Clock, Layers, Info, CornerDownRight, Terminal, Zap, Hash, AlignCenter, Radio, Activity, Link as LinkIcon } from 'lucide-react';

export const ScryView: React.FC = () => {
  const { user, profile } = useUser();
  const { logEvent } = useTasteLogging();
  
  const [activeTab, setActiveTab] = useState<'trend' | 'shadow' | 'pattern'>('trend');
  
  // Trend Scry State
  const [trendQuery, setTrendQuery] = useState('');
  const [scryResult, setScryResult] = useState<any>(null);
  const [isScrying, setIsScrying] = useState(false);

  // Shadow Scry State
  const [shadowQuery, setShadowQuery] = useState('');
  const [shadowResults, setShadowResults] = useState<any[]>([]);
  const [isShadowSearching, setIsShadowSearching] = useState(false);
  
  // Predictive State
  const [predictiveSuggestions, setPredictiveSuggestions] = useState<any[]>([]);
  
  // Erratic VFX State
  const [staticIntensity, setStaticIntensity] = useState(0.05);

  // Handle Incoming Signal from Zine View
  useEffect(() => {
      const handleIncomingSignal = (e: any) => {
          if (e.detail === 'scry' && e.detail_data?.signal) {
              const signal = e.detail_data.signal;
              setTrendQuery(signal);
              setActiveTab('trend'); 
          }
      };
      window.addEventListener('mimi:change_view', handleIncomingSignal);
      return () => window.removeEventListener('mimi:change_view', handleIncomingSignal);
  }, []);

  // Predictive Logic
  useEffect(() => {
      if (activeTab !== 'shadow' || !shadowQuery || shadowQuery.length < 3) {
          setPredictiveSuggestions([]);
          return;
      }

      const timer = setTimeout(async () => {
          try {
              const results = await scryShadowMemory(shadowQuery);
              setPredictiveSuggestions(results.slice(0, 4));
          } catch(e) { console.error(e); } 
      }, 600); // 600ms debounce

      return () => clearTimeout(timer);
  }, [shadowQuery, activeTab]);

  const handleTrendScry = async () => {
    // Allow scrying even if user is anonymous/ghost
    setIsScrying(true);
    setStaticIntensity(0.15); // Ramp up noise
    
    try {
      let contextItems: any[] = [];
      
      // Attempt to fetch context, but fail gracefully if permissions deny it (e.g. ghost user)
      if (user?.uid) {
          try {
            contextItems = await fetchPocketItems(user.uid);
          } catch (err) {
            console.warn("MIMI // Scry: Archive context unavailable (Permissions or Network). Proceeding with Cold Start.");
          }
      }
      
      // Fallback for empty pocket: Send generic request context
      const safeContext = contextItems && contextItems.length > 0 ? contextItems : []; 
      
      const result = await scryTrendSynthesis(safeContext, profile, trendQuery);
      setScryResult(result);
      setActiveTab('pattern'); // Switch to pattern view for results
      
      logEvent('scry', {
        raw_text: trendQuery || 'Aesthetic divination from pocket archive',
        user_intent: 'Understanding taste trajectory'
      }, {
        scry_insights: result,
        taste_snapshot: profile?.tasteProfile
      }).catch(err => console.warn(err));
    } catch (e) {
      console.error("MIMI // Scry Failed:", e);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Oracle Dissonance. The signal failed.", type: 'error' } }));
    } finally {
      setIsScrying(false);
      setStaticIntensity(0.05); // Reset noise
    }
  };

  const handleShadowSearch = async () => {
    if (!shadowQuery.trim()) return;
    setIsShadowSearching(true);
    setPredictiveSuggestions([]); // Clear predictions on commit
    
    try {
        const results = await scryShadowMemory(shadowQuery);
        setShadowResults(results);
    } catch (e) {
        console.error("MIMI // Shadow Search Failed:", e);
    } finally {
        setIsShadowSearching(false);
    }
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
    <div className="w-full h-full overflow-hidden bg-[#050505] text-stone-300 flex flex-col items-center relative transition-colors duration-1000">
        
        {/* ERRATIC STATIC OVERLAY */}
        <div 
            className="absolute inset-0 pointer-events-none mix-blend-overlay z-0 transition-opacity duration-500"
            style={{ 
                backgroundImage: "url('https://www.transparenttextures.com/patterns/noise.png')",
                opacity: staticIntensity 
            }} 
        />
        
        {/* EDITORIAL HEADER / TOGGLE */}
        <div className="w-full max-w-4xl text-center pt-24 md:pt-32 px-6 space-y-8 shrink-0 z-10 relative">
            <div className="flex items-center justify-center gap-12 border-b border-white/10 pb-6">
                <button 
                    onClick={() => setActiveTab('trend')}
                    className={`font-sans text-[10px] uppercase tracking-[0.4em] font-black transition-all ${activeTab === 'trend' ? 'text-white scale-110' : 'text-stone-600 hover:text-stone-400'}`}
                >
                    Oracle_Logic
                </button>
                <div className="w-px h-4 bg-stone-800" />
                <button 
                    onClick={() => setActiveTab('shadow')}
                    className={`font-sans text-[10px] uppercase tracking-[0.4em] font-black transition-all ${activeTab === 'shadow' ? 'text-white scale-110' : 'text-stone-600 hover:text-stone-400'}`}
                >
                    Shadow_Recall
                </button>
                <div className="w-px h-4 bg-stone-800" />
                <button 
                    onClick={() => setActiveTab('pattern')}
                    className={`font-sans text-[10px] uppercase tracking-[0.4em] font-black transition-all flex items-center gap-2 ${activeTab === 'pattern' ? 'text-emerald-500 scale-110' : 'text-stone-600 hover:text-stone-400'}`}
                >
                    <Activity size={12} className={scryResult ? "animate-pulse" : ""} /> Pattern_Rec
                </button>
            </div>

            {/* DEFINITION BLOCK */}
            <div className="min-h-[40px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {activeTab === 'trend' && (
                        <motion.p key="trend-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-serif italic text-sm text-stone-500">
                            "Synthesize future trajectories from current debris."
                        </motion.p>
                    )}
                    {activeTab === 'shadow' && (
                        <motion.p key="shadow-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-serif italic text-sm text-stone-500">
                            "Query the latent space of your archived material."
                        </motion.p>
                    )}
                    {activeTab === 'pattern' && (
                        <motion.p key="pattern-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-serif italic text-sm text-stone-500">
                            {scryResult ? "High-fidelity structural analysis of the current query." : "No signal analyzed yet."}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative group min-h-[120px] w-full flex items-center justify-center mt-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'trend' && (
                        <motion.div key="trend-input" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full relative">
                            <div className="relative w-full max-w-2xl mx-auto group">
                                <LinkIcon size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                <input 
                                    type="text"
                                    value={trendQuery}
                                    onChange={(e) => setTrendQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleTrendScry()}
                                    placeholder="Enter trajectory coordinates..."
                                    className="w-full bg-transparent border-b border-stone-800 py-4 pl-8 pr-12 font-mono text-xl text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-700"
                                    autoFocus
                                />
                                <button 
                                    onClick={handleTrendScry} 
                                    disabled={isScrying || !trendQuery.trim()}
                                    className="absolute right-0 top-1/2 -translate-x-0 -translate-y-1/2 text-stone-500 hover:text-emerald-500 disabled:opacity-30 transition-colors p-2"
                                >
                                    {isScrying ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'shadow' && (
                        <motion.div key="shadow-input" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full relative">
                            <div className="relative w-full max-w-2xl mx-auto group">
                                <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-500 opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                <input 
                                    type="text"
                                    value={shadowQuery}
                                    onChange={(e) => setShadowQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleShadowSearch()}
                                    placeholder="Search the void..."
                                    className="w-full bg-transparent border-b border-stone-800 py-4 pl-8 pr-12 font-mono text-xl text-white focus:outline-none focus:border-stone-500 transition-colors placeholder:text-stone-700"
                                    autoFocus
                                />
                                <button 
                                    onClick={handleShadowSearch} 
                                    disabled={isShadowSearching || !shadowQuery.trim()}
                                    className="absolute right-0 top-1/2 -translate-x-0 -translate-y-1/2 text-stone-500 hover:text-white disabled:opacity-30 transition-colors p-2"
                                >
                                    {isShadowSearching ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                                </button>
                            </div>
                            
                            {predictiveSuggestions.length > 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center flex-wrap gap-2 mt-6">
                                    {predictiveSuggestions.map((s, i) => (
                                        <button key={i} onClick={() => { setShadowQuery(s.content_preview); handleShadowSearch(); }} className="px-3 py-1 border border-stone-800 rounded-full text-stone-500 hover:text-emerald-500 hover:border-emerald-500 transition-all font-mono text-[9px] uppercase">
                                            {s.content_preview}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'pattern' && (
                        <motion.div key="pattern-output" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full text-left space-y-12">
                            {scryResult ? (
                                <>
                                    <div className="flex flex-col md:flex-row gap-12 items-start justify-center border-b border-white/10 pb-12">
                                        <div className="space-y-4 max-w-lg">
                                            <span className="font-sans text-[9px] uppercase tracking-[0.3em] font-black text-emerald-500 flex items-center gap-2">
                                                <Radio size={14} className="animate-pulse" /> Horizon Signal
                                            </span>
                                            <h2 className="font-serif text-5xl md:text-6xl italic tracking-tighter leading-[0.9] text-white">
                                                {scryResult.time_horizon}
                                            </h2>
                                            <p className="font-serif italic text-xl text-stone-400 leading-relaxed text-balance">
                                                "{scryResult.structural_shifts}"
                                            </p>
                                        </div>
                                        <div className="p-6 bg-[#0A0A0A] border border-stone-800 rounded-sm w-full md:w-80 font-mono text-[10px] text-stone-300 space-y-4 shadow-2xl relative overflow-hidden">
                                            {/* Scanline Effect */}
                                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
                                            
                                            <div className="flex justify-between border-b border-stone-700 pb-2">
                                                <span>DATA_STREAM</span>
                                                <span className="text-emerald-500 animate-pulse">ACTIVE</span>
                                            </div>
                                            <div className="space-y-2">
                                                {scryResult.pattern_signals?.map((s, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <span className="text-stone-500">0{i+1}:</span>
                                                        <span className="uppercase text-emerald-400/80">{s}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-stone-700 text-stone-500 italic">
                                                {scryResult.cultural_forces}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        <button onClick={() => { window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'tailor', detail_data: { suggestedExperiments: scryResult.pattern_signals } })); }} className="px-8 py-3 border border-stone-800 rounded-full font-sans text-[9px] uppercase tracking-widest font-black hover:bg-stone-900 transition-colors text-stone-400 hover:text-white">
                                            Inject Logic into Tailor
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 gap-6 opacity-30">
                                    <Activity size={48} className="text-stone-500" />
                                    <p className="font-serif italic text-2xl">“The pattern buffer is empty.”</p>
                                    <button onClick={() => setActiveTab('trend')} className="text-emerald-500 font-sans text-[9px] uppercase tracking-widest font-black border-b border-emerald-500 pb-1">Initialize Oracle Logic</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* SHADOW RESULTS GRID */}
        {shadowResults.length > 0 && activeTab === 'shadow' && (
            <div className="flex-1 w-full overflow-y-auto no-scrollbar px-6 pb-32">
                <div className="max-w-6xl mx-auto pt-12">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {shadowResults.map((result, idx) => (
                            <motion.div 
                                key={result.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleNavigateToResult(result)}
                                className="group cursor-pointer space-y-4"
                            >
                                <div className="aspect-[4/3] bg-stone-900 overflow-hidden relative border border-stone-800 rounded-sm">
                                    {result.display_image ? (
                                        <img src={result.display_image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-700">
                                            {result.type === 'zine' ? <Layers size={24} /> : <Terminal size={24} />}
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-black/90 px-2 py-1 rounded-sm text-[8px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                        {(result.similarity * 100).toFixed(0)}% MATCH
                                    </div>
                                </div>
                                <div className="space-y-2 px-2">
                                    <div className="flex items-center gap-2 text-stone-500">
                                        <span className="font-sans text-[7px] uppercase tracking-widest font-black">{result.type}</span>
                                        <div className="w-1 h-1 bg-stone-600 rounded-full" />
                                        <span className="font-mono text-[8px]">{new Date(result.synced_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="font-serif italic text-xl leading-tight text-stone-300 line-clamp-2 group-hover:text-emerald-500 transition-colors">
                                        "{result.content_preview}"
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        )}
        
        {/* VERSION MARKER FOR DEBUGGING */}
        <div className="absolute bottom-2 right-4 text-[7px] font-mono text-stone-800 pointer-events-none">v4.5-ERRATIC</div>
    </div>
  );
};
