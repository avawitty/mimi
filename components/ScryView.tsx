
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Sparkles, Radio, ScanLine, Database, ArrowRight, Globe, ExternalLink, PenTool, BookOpen, Mic, Square, Hash, Layers, Eye, Wind, Terminal, Activity, Cpu, Signal, Lock, Settings, Moon, Volume2, ChevronRight } from 'lucide-react';
import { scryShadowMemory } from '../services/vectorSearch';
import { scryWebSignals, generateScribeReading, generateRawImage } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { useRecorder } from '../hooks/useRecorder';
import { PocketItem, ZineMetadata } from '../types';

export const ScryView: React.FC = () => {
  const { user, profile, activePersona } = useUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [webResults, setWebResults] = useState<any[]>([]);
  const [scribeReading, setScribeReading] = useState<string | null>(null);
  const [isScrying, setIsScrying] = useState(false);
  const [isWebScrying, setIsWebScrying] = useState(false);
  const [visualState, setVisualState] = useState<'void' | 'image' | 'loading'>('void');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const { isRecording, startRecording, stopRecording, audioBlob } = useRecorder();

  const handleScry = async () => {
    if (!query.trim() || isScrying) return;
    setIsScrying(true);
    setVisualState('loading');
    setWebResults([]);
    setResults([]);
    setScribeReading(null);
    setGeneratedImage(null);

    try {
      setIsWebScrying(true);

      // Run text-based scrying in parallel so they populate quickly
      const textPromises = [
        scryWebSignals(query).then(data => {
          setWebResults(data.results);
          // Use data.groundingChunks here
          if (data.groundingChunks && data.groundingChunks.length > 0) {
              setResults(prev => [...prev, ...data.groundingChunks.map((c: any) => ({
                  title: c.web?.title || 'Grounded Insight',
                  snippet: 'Grounded in real-time data',
                  url: c.web?.uri
              }))]);
          }
          setIsWebScrying(false);
        }).catch(e => console.error("Web scry failed", e)),
        
        generateScribeReading(profile, query, activePersona?.apiKey).then(reading => {
          setScribeReading(reading);
        }).catch(e => console.error("Scribe failed", e)),
        
        scryShadowMemory(query).then(hits => {
          setResults(hits);
        }).catch(e => console.error("Shadow memory failed", e))
      ];

      // Start the slow image generation
      const imagePromise = generateRawImage(query, '1:1', profile).then(img => {
        if (img) {
          setGeneratedImage(img);
          setVisualState('image');
        } else {
          setVisualState('void');
        }
      }).catch(e => {
        console.error("Image generation failed", e);
        setVisualState('void');
      });

      // Wait for all promises to settle
      await Promise.allSettled([...textPromises, imagePromise]);

    } catch (e: any) {
      console.error("Scrying failed", e);
      setVisualState('void');
    } finally {
      setIsScrying(false);
      setIsWebScrying(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleScry();
    }
  };

  return (
    <div className="flex w-full h-full bg-[#f5f2ed] dark:bg-[#050505] text-[#1c1917] dark:text-[#E4E3E0] font-serif overflow-hidden relative selection:bg-emerald-500/20">
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center relative overflow-y-auto scrollbar-hide">
              <div className="w-full max-w-5xl flex flex-col items-center pt-16 px-8 min-h-screen pb-32">
                
                {/* The Void / Scry Circle */}
                <div className="relative group mt-12">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="w-[400px] h-[400px] md:w-[500px] md:h-[500px] rounded-full bg-black shadow-2xl flex items-center justify-center overflow-hidden relative z-10"
                    >
                        {/* Inner Texture/Gradient */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#2a2a2a_0%,#000000_70%)] opacity-80" />
                        
                        {/* Loading State */}
                        <AnimatePresence>
                            {visualState === 'loading' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <div className="w-full h-full absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,#10B981_360deg)] animate-spin opacity-20" />
                                    <div className="w-[98%] h-[98%] bg-black rounded-full absolute" />
                                    <Loader2 className="text-emerald-500 animate-spin relative z-10" size={48} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Image State */}
                        <AnimatePresence>
                            {visualState === 'image' && generatedImage && (
                                <motion.img 
                                    src={generatedImage}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
                                />
                            )}
                        </AnimatePresence>

                        {/* Latent Space Badge */}
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-stone-800/50 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${visualState === 'loading' ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-300 font-medium">Latent Space Retrieval</span>
                        </div>
                    </motion.div>

                    {/* Glow Effect behind circle */}
                    <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full -z-10 transform scale-110 pointer-events-none" />
                </div>

                {/* Subtext */}
                <p className="font-serif italic text-stone-500 text-xl mt-16 mb-10 text-center max-w-md leading-relaxed">
                    Scan the cultural horizon for web signals, generate new artifacts, and consult the Oracle simultaneously.
                </p>

                {/* Input Area */}
                <div className="w-full max-w-2xl relative group mb-20">
                    <input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="will i be a lover girl again?"
                        className="w-full bg-transparent border-b border-[#10B981]/30 py-4 px-12 font-serif italic text-3xl text-center text-[#1c1917] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#10B981] transition-colors"
                    />
                    
                    {/* Mic Icon */}
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#1c1917] transition-colors ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
                    >
                        <Mic size={20} />
                    </button>

                    {/* Submit Arrow */}
                    <button 
                        onClick={handleScry}
                        disabled={isScrying}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1c1917] rounded-full flex items-center justify-center text-[#f5f5f0] hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isScrying ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                    </button>
                </div>

                {/* Results Section - Populating Underneath */}
                <div className="w-full max-w-3xl space-y-8 pb-20">
                    
                    {/* Scribe Reading Result */}
                    <AnimatePresence>
                        {scribeReading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-white p-10 rounded-sm shadow-sm border border-[#e5e5e0] text-center"
                            >
                                <div className="flex justify-center mb-6">
                                    <Sparkles size={24} className="text-emerald-500" />
                                </div>
                                <p className="font-serif text-2xl leading-relaxed text-[#1c1917] italic">
                                    "{scribeReading}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Web Results */}
                    <AnimatePresence>
                        {webResults.map((r, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group border-b border-[#e5e5e0] py-6 hover:bg-white/50 transition-colors px-4 rounded-sm"
                            >
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="font-serif text-xl text-[#1c1917] group-hover:text-emerald-600 transition-colors">
                                        <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
                                    </h3>
                                    <span className="text-[9px] uppercase tracking-widest text-[#a8a29e]">{new URL(r.url).hostname}</span>
                                </div>
                                <p className="text-[#78716c] font-sans text-sm leading-relaxed max-w-2xl">{r.snippet}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Shadow Memory Results */}
                    <AnimatePresence>
                        {results.map((r, i) => (
                            <motion.div 
                                key={r.id || i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-6 items-center border-b border-[#e5e5e0] py-6 group cursor-pointer"
                                onClick={() => {
                                     // Dispatch event to open artifact in dossier view?
                                     // For now just log or visual feedback
                                }}
                            >
                                <div className="w-24 h-24 bg-[#e5e5e0] flex-shrink-0 overflow-hidden">
                                    {r.display_image ? (
                                        <img src={r.display_image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#a8a29e]"><Database size={20} /></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">{r.type}</span>
                                        <span className="text-[9px] uppercase tracking-widest text-[#a8a29e]">{(r.similarity * 100).toFixed(0)}% Resonance</span>
                                    </div>
                                    <p className="font-serif text-lg text-[#1c1917] italic group-hover:text-emerald-600 transition-colors line-clamp-2">
                                        {r.content_preview || r.content?.prompt || "Unnamed Artifact"}
                                    </p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                                    <ArrowRight size={20} className="text-[#1c1917]" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                </div>

            </div>
        </main>
    </div>
  );
};

