
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Sparkles, Radio, ScanLine, Database, ArrowRight, Globe, ExternalLink } from 'lucide-react';
import { scryShadowMemory } from '../services/vectorSearch';
import { scryWebSignals } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { PocketItem, ZineMetadata } from '../types';

export const ScryView: React.FC = () => {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [webResults, setWebResults] = useState<any[]>([]);
  const [isScrying, setIsScrying] = useState(false);
  const [isWebScrying, setIsWebScrying] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'zine' | 'shard' | 'web'>('all');

  const handleScry = async () => {
    if (!query.trim() || isScrying) return;
    setIsScrying(true);
    setWebResults([]);
    try {
      if (activeFilter === 'web') {
        setIsWebScrying(true);
        const webHits = await scryWebSignals(query);
        setWebResults(webHits);
        setResults([]);
      } else {
        const hits = await scryShadowMemory(query, { filterType: activeFilter });
        setResults(hits);
        
        // If no local results, suggest web scry
        if (hits.length === 0) {
           // Optional: auto-trigger or just show button
        }
      }
    } catch (e) {
      console.error("Scrying failed", e);
    } finally {
      setIsScrying(false);
      setIsWebScrying(false);
    }
  };

  const handleWebScry = async () => {
    if (!query.trim() || isWebScrying) return;
    setIsWebScrying(true);
    setActiveFilter('web');
    try {
      const webHits = await scryWebSignals(query);
      setWebResults(webHits);
      setResults([]);
    } catch (e) {
      console.error("Web Scrying failed", e);
    } finally {
      setIsWebScrying(false);
    }
  };

  // Handle incoming detail_data from other views (e.g., clicking 'Scry Signal' in AnalysisDisplay)
  useEffect(() => {
      const handleNav = (e: any) => {
          if (e.detail === 'scry' && e.detail_data?.signal) {
              setQuery(e.detail_data.signal);
              // Auto-trigger if mounting with data? 
              // Better to let user confirm, or trigger effect if query changes.
          }
      };
      window.addEventListener('mimi:change_view', handleNav);
      return () => window.removeEventListener('mimi:change_view', handleNav);
  }, []);

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-stone-950 text-white relative flex flex-col items-center transition-colors duration-1000">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="w-full max-w-4xl px-6 md:px-12 pt-20 pb-32 flex flex-col h-full z-10">
            
            <header className="space-y-6 mb-12 text-center">
                <div className="inline-flex items-center gap-2 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full bg-emerald-500/5">
                    <Radio size={12} className="animate-pulse" />
                    <span className="font-sans text-[8px] uppercase tracking-widest font-black">Semantic Retrieval</span>
                </div>
                <h1 className="font-serif text-5xl md:text-7xl italic tracking-tighter">Scry.</h1>
                <p className="font-serif italic text-lg text-stone-400">Search the latent space of your registry.</p>
            </header>

            <div className="w-full max-w-2xl mx-auto space-y-8">
                <div className="relative group">
                    <input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleScry()}
                        placeholder="Describe the texture, mood, or concept..."
                        className="w-full bg-stone-900/50 border-b border-stone-800 py-6 px-4 font-serif text-2xl italic focus:outline-none focus:border-emerald-500 transition-colors text-center placeholder:text-stone-700"
                        autoFocus
                    />
                    <button 
                        onClick={handleScry}
                        disabled={isScrying || !query.trim()}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-3 text-stone-500 hover:text-emerald-500 transition-colors disabled:opacity-50"
                    >
                        {isScrying ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                    </button>
                </div>

                <div className="flex justify-center gap-4">
                    {['all', 'zine', 'shard', 'web'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setActiveFilter(f as any)}
                            className={`px-4 py-2 rounded-sm font-sans text-[9px] uppercase tracking-widest font-black transition-all border ${activeFilter === f ? 'bg-white text-black border-white' : 'border-stone-800 text-stone-500 hover:border-stone-600'}`}
                        >
                            {f === 'web' ? <div className="flex items-center gap-2"><Globe size={10} /> {f}</div> : f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar mt-12 space-y-4 pr-2">
                <AnimatePresence>
                    {results.map((r, i) => (
                        <motion.div 
                            key={r.id || i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-6 bg-stone-900/30 border border-stone-800/50 rounded-sm flex items-start gap-6 hover:border-emerald-500/30 transition-colors group cursor-pointer"
                            onClick={() => {
                                // Navigate to the artifact or display details
                                if (r.type === 'zine') {
                                    window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'reveal_artifact', detail_id: r.originalId }));
                                }
                            }}
                        >
                            <div className="w-16 h-16 bg-stone-900 rounded-sm overflow-hidden flex-shrink-0 border border-stone-800">
                                {r.display_image ? (
                                    <img src={r.display_image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-700"><Database size={16} /></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest">Similarity: {(r.similarity * 100).toFixed(1)}%</span>
                                    <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest">{new Date(r.synced_at).toLocaleDateString()}</span>
                                </div>
                                <p className="font-serif text-stone-300 line-clamp-2">{r.content_preview}</p>
                            </div>
                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={16} className="text-stone-500" />
                            </div>
                        </motion.div>
                    ))}

                    {webResults.map((r, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-6 bg-emerald-950/10 border border-emerald-900/20 rounded-sm flex items-start gap-6 hover:border-emerald-500/30 transition-colors group"
                        >
                            <div className="w-16 h-16 bg-stone-900 rounded-sm overflow-hidden flex-shrink-0 border border-stone-800 flex items-center justify-center text-emerald-500/50">
                                <Globe size={24} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest">Web Signal</span>
                                    <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest">{r.relevance}</span>
                                </div>
                                <h4 className="font-serif text-xl text-white italic">{r.title}</h4>
                                <p className="font-serif text-stone-400 text-sm line-clamp-3">{r.snippet}</p>
                                <a 
                                    href={r.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[9px] font-mono text-emerald-500 uppercase tracking-widest hover:underline pt-2"
                                >
                                    <ExternalLink size={10} /> Source URL
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {!isScrying && results.length === 0 && webResults.length === 0 && query && (
                    <div className="text-center py-20 opacity-30 flex flex-col items-center gap-6">
                        <ScanLine size={48} className="mx-auto mb-4" />
                        <p className="font-serif italic text-lg">"The void returned no echoes."</p>
                        <button 
                            onClick={handleWebScry}
                            className="px-6 py-3 border border-stone-800 hover:border-emerald-500 text-stone-500 hover:text-emerald-500 font-sans text-[10px] uppercase tracking-widest font-black transition-all rounded-full flex items-center gap-3"
                        >
                            <Globe size={14} /> Scry the Web
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
