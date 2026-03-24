
// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToUserZines, subscribeToCommunityZines, getUserProfile } from '../services/firebaseUtils';
import { getLocalZines } from '../services/localArchive';
import { fetchFollowing, Connection } from '../services/connections';
import { ZineMetadata, ToneTag, UserProfile } from '../types';
import { useUser } from '../contexts/UserContext';
import { Archive, Search, Hash, X, Eye, Folder, Loader2, Radio, Zap, Wind, Ghost, Star, Info, Layers, Target, Compass, Sparkles, User, Network, BrainCircuit, LayoutGrid, Maximize2 } from 'lucide-react';
import { VibeGraph } from './VibeGraph';
import { PublicProfileModal } from './PublicProfileModal';
import { analyzeCollectionIntent } from '../services/geminiService';

const TONE_MAP: Record<ToneTag, { bg: string, text: string, accent: string }> = {
  'Cinematic Witness': { bg: 'bg-[#F5F5F0]', text: 'text-stone-900', accent: 'border-stone-300' },
  'Editorial Stillness': { bg: 'bg-[#FDFBF7]', text: 'text-[#1C1917]', accent: 'border-stone-200' },
  'Romantic Interior': { bg: 'bg-[#FFF9F9]', text: 'text-rose-950', accent: 'border-rose-100' },
  'Structured Desire': { bg: 'bg-[#0A0A0A]', text: 'text-white', accent: 'border-red-900' },
  'Documentary B&W': { bg: 'bg-stone-300', text: 'text-stone-900', accent: 'border-stone-400' },
  'chic': { bg: 'bg-[#F5F5F0]', text: 'text-stone-900', accent: 'border-stone-300' },
  'nostalgia': { bg: 'bg-[#FDF6E3]', text: 'text-amber-950', accent: 'border-amber-200' },
  'dream': { bg: 'bg-[#FFF0F5]', text: 'text-rose-900', accent: 'border-rose-100' },
  'panic': { bg: 'bg-black', text: 'text-red-500', accent: 'border-red-600' },
  'unhinged': { bg: 'bg-[#111827]', text: 'text-green-400', accent: 'border-indigo-500' },
  'editorial': { bg: 'bg-white', text: 'text-black', accent: 'border-stone-100' }
};

export const ArchiveCloudNebula: React.FC<{ onSelectZine: (zine: ZineMetadata) => void, onGenerateThreadZine?: (thread: any) => void }> = ({ onSelectZine, onGenerateThreadZine }) => {
  const { user, profile, toggleZineStar } = useUser();
  const [localZines, setLocalZines] = useState<ZineMetadata[]>([]);
  const [cloudZines, setCloudZines] = useState<ZineMetadata[]>([]);
  const [communityZines, setCommunityZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [nebulaMode, setNebulaMode] = useState<'strategist' | 'shadow' | 'starred' | 'network' | 'vibe'>('strategist');
  const [showcaseMode, setShowcaseMode] = useState<'bento' | 'dossier' | 'minimalist'>('dossier');
  const [followingProfiles, setFollowingProfiles] = useState<UserProfile[]>([]);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeCollectionIntent(filteredZines, profile);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // 1. Subscribe to Real-time Community Feed
    const unsubCommunity = subscribeToCommunityZines(setCommunityZines);
    
    let unsubUser = () => {};
    
    // 2. Load Personal Data with Real-time Sync
    const loadPersonal = async () => {
      setLoading(true);
      const local = await getLocalZines() || [];
      setLocalZines(local.filter(z => z && z.id && z.content));
      
      if (user && !user.isAnonymous) {
        unsubUser = subscribeToUserZines(user.uid, (data) => {
            setCloudZines(data.filter(z => z && z.id && z.content));
            setLoading(false);
        });
        
        // Load network
        try {
          const connections = await fetchFollowing(user.uid);
          const profiles = await Promise.all(connections.map(c => getUserProfile(c.followingId)));
          setFollowingProfiles(profiles.filter(Boolean) as UserProfile[]);
        } catch (e) {
          console.error("Failed to load network", e);
        }
      } else {
        setLoading(false);
      }
    };
    loadPersonal();

    return () => {
        unsubCommunity();
        unsubUser();
    };
  }, [user]);

  const allZines = useMemo(() => {
    // Merge personal sources
    const mergedPersonal = [...localZines, ...cloudZines];
    const uniquePersonal = Array.from(new Map(mergedPersonal.map(item => [item.id, item])).values());
    
    const baseSet = uniquePersonal;

    return baseSet;
  }, [localZines, cloudZines, nebulaMode, profile?.starredZineIds]);

  const filteredZines = useMemo(() => {
    return allZines.filter(zine => {
      const zineTags = [...(zine.content?.tags || []), zine.tone];
      const matchesTag = !activeTag || zineTags.includes(activeTag);
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        zine.title.toLowerCase().includes(searchLower) ||
        zineTags.some(t => t.toLowerCase().includes(searchLower));
      return matchesTag && matchesSearch;
    });
  }, [allZines, searchQuery, activeTag]);

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center overflow-y-auto no-scrollbar pb-64 px-6 md:px-16 pt-12 md:pt-20 bg-nous-base dark:bg-stone-950 transition-colors duration-1000">
      <div className="w-full max-w-7xl space-y-12">
        <header className="flex flex-col border-b border-stone-100 dark:border-stone-900 pb-12 gap-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-stone-400">
                    <Archive size={16} />
                    <span className="font-sans text-[8px] uppercase tracking-[0.5em] font-black italic">Sovereign Registry // Your Public Storefront</span>
                 </div>
                 <h2 className="font-serif text-6xl md:text-8xl italic tracking-tighter text-nous-text dark:text-white leading-none luminescent-text">Your Stand.</h2>
              </div>
              <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setNebulaMode('strategist')}
                      className={`flex items-center gap-3 px-6 md:px-8 py-3 transition-all ${nebulaMode === 'strategist' ? 'bg-stone-100 dark:bg-stone-800 text-nous-text dark:text-white' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                       <Wind size={14} />
                       <span className="font-sans text-[8px] uppercase tracking-widest font-black">Strategist</span>
                    </button>
                    <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />
                    <button 
                      onClick={() => setNebulaMode('vibe')}
                      className={`flex items-center gap-3 px-6 md:px-8 py-3 transition-all ${nebulaMode === 'vibe' ? 'bg-emerald-500 text-white' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                       <Network size={14} />
                       <span className="font-sans text-[8px] uppercase tracking-widest font-black">Vibe</span>
                    </button>
                    <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />
                    <button 
                      onClick={() => setNebulaMode('network')}
                      className={`flex items-center gap-3 px-6 md:px-8 py-3 transition-all ${nebulaMode === 'network' ? 'bg-indigo-500 text-white' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                       <Radio size={14} />
                       <span className="font-sans text-[8px] uppercase tracking-widest font-black">Network</span>
                    </button>
                    <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />
                    <button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className={`flex items-center gap-3 px-6 md:px-8 py-3 transition-all ${isAnalyzing ? 'bg-emerald-500 text-white' : 'text-stone-400 hover:text-emerald-500'}`}
                    >
                       {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                       <span className="font-sans text-[8px] uppercase tracking-widest font-black">Analyze</span>
                    </button>
                 </div>
              </div>
           </div>

           <div className="hidden md:grid md:grid-cols-3 gap-12 pt-8">
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-emerald-500">
                    <Layers size={14} />
                    <h4 className="font-sans text-[9px] uppercase tracking-widest font-black">Manifest History</h4>
                 </div>
                 <p className="font-serif italic text-base text-stone-500 leading-snug">
                    Every authored issue is anchored here. Community feed is live: <span className="text-emerald-500 font-bold">{communityZines.length} signals active.</span>
                 </p>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-amber-500">
                    <Star size={14} className="fill-amber-500" />
                    <h4 className="font-sans text-[9px] uppercase tracking-widest font-black">Curation Canon</h4>
                 </div>
                 <p className="font-serif italic text-base text-stone-500 leading-snug">
                    Filter by Favorites to isolate the pinnacle of your current personal canon. These artifacts represent your most stable frequencies.
                 </p>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-indigo-500">
                    <Compass size={14} />
                    <h4 className="font-sans text-[9px] uppercase tracking-widest font-black">Global Audit</h4>
                 </div>
                 <p className="font-serif italic text-base text-stone-500 leading-snug">
                    Use Folder Anchors to filter by frequency. Identify patterns in your debris to refine future manifestations.
                 </p>
              </div>
           </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="w-full relative group flex-grow">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3 pl-8 pointer-events-none">
               <Search size={16} className="text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
               <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black text-stone-300/50">Audit_Log</span>
            </div>
            <input 
              id="archiveSearch"
              name="archiveSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Trace an issue by title, theme, or frequency..."
              className="w-full bg-stone-50/50 dark:bg-stone-900/50 border-b-2 border-stone-100 dark:border-stone-800 py-10 pl-40 pr-8 font-serif italic text-2xl md:text-3xl focus:outline-none focus:border-emerald-500 transition-all placeholder:text-stone-200 placeholder:opacity-50 text-nous-text dark:text-white shadow-inner"
            />
          </div>
          {nebulaMode === 'strategist' && (
            <div className="flex border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 p-2 gap-2 self-start lg:self-center">
              <button 
                onClick={() => setShowcaseMode('bento')}
                className={`px-4 py-2 flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono transition-colors ${showcaseMode === 'bento' ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-white' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
              >
                <LayoutGrid size={14} /> Bento Archive
              </button>
              <button 
                onClick={() => setShowcaseMode('dossier')}
                className={`px-4 py-2 flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono transition-colors ${showcaseMode === 'dossier' ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-white' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
              >
                <Archive size={14} /> Archival Dossier
              </button>
              <button 
                onClick={() => setShowcaseMode('minimalist')}
                className={`px-4 py-2 flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono transition-colors ${showcaseMode === 'minimalist' ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-white' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
              >
                <Maximize2 size={14} /> Minimalist
              </button>
            </div>
          )}
        </div>

        {nebulaMode === 'network' ? (
          <div className="w-full pt-12">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] font-black text-stone-400 mb-8 text-center">Your Resonating Network</h3>
            {followingProfiles.length === 0 ? (
              <div className="py-32 text-center opacity-30 space-y-8">
                <Radio size={64} className="mx-auto" />
                <p className="font-serif italic text-3xl">“No active connections.”</p>
                <p className="font-sans text-[9px] uppercase tracking-widest text-stone-500">Find signals in the Proscenium.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {followingProfiles.map(p => (
                  <div 
                    key={p.uid} 
                    onClick={() => setViewingProfileId(p.uid)}
                    className="bg-white dark:bg-[#1C1C1C] border border-stone-200 dark:border-stone-800 p-6 flex flex-col items-center text-center cursor-pointer hover:border-indigo-500 transition-colors group"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-4 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <img src={p.photoURL || `https://ui-avatars.com/api/?name=${p.handle || 'U'}&background=1c1917&color=fff`} className="w-full h-full object-cover transition-all" alt="" />
                    </div>
                    <h4 className="font-serif text-2xl italic text-nous-text dark:text-white group-hover:text-indigo-500 transition-colors">@{p.handle}</h4>
                    {p.tasteProfile?.definition && (
                      <p className="mt-3 font-serif italic text-xs text-stone-500 line-clamp-2">"{p.tasteProfile.definition}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : nebulaMode === 'vibe' ? (
          <div className="w-full h-[600px] pt-12">
            <VibeGraph onGenerateZine={onGenerateThreadZine} />
          </div>
        ) : (
          <div className={`pt-12 ${
            showcaseMode === 'dossier' ? 'grid grid-cols-1 md:grid-cols-12 gap-[1px] bg-stone-300 dark:bg-stone-800 border border-stone-300 dark:border-stone-800' : 
            showcaseMode === 'bento' ? 'grid grid-cols-1 md:grid-cols-12 gap-4' : 
            'grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16'
          }`}>
            {filteredZines.map(zine => (
              <ZineShelfItem 
                key={zine.id} 
                zine={zine} 
                onSelect={() => onSelectZine(zine)} 
                isCloud={zine.userId && !zine.userId.startsWith('ghost')} 
                isStarred={profile?.starredZineIds?.includes(zine.id)}
                onToggleStar={() => toggleZineStar(zine.id)}
                mode={showcaseMode}
              />
            ))}
            <InitSequenceCard mode={showcaseMode} />
            {filteredZines.length === 0 && (
              <div className="col-span-full py-48 text-center opacity-30 space-y-8 bg-nous-base dark:bg-stone-950">
                 <Ghost size={64} className="mx-auto" />
                 <p className="font-serif italic text-3xl">“This frequency is currently void.”</p>
                 <button onClick={() => setNebulaMode('strategist')} className="font-sans text-[9px] uppercase tracking-widest font-black text-emerald-500 border-b border-emerald-500">Return to Strategist</button>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewingProfileId && (
          <PublicProfileModal 
            userId={viewingProfileId} 
            onClose={() => setViewingProfileId(null)} 
            onSelectZine={onSelectZine}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ZineShelfItem: React.FC<{ zine: ZineMetadata, onSelect: () => void, isCloud?: boolean, isStarred?: boolean, onToggleStar: () => void, mode?: string }> = ({ zine, onSelect, isCloud, isStarred, onToggleStar, mode = 'dossier' }) => {
  const dateStr = new Date(zine.timestamp).toISOString().split('T')[0];
  const shortId = zine.id.slice(-4);
  const synthesisScore = (Math.random() * (0.99 - 0.70) + 0.70).toFixed(2); // Mock score for aesthetics

  const hasNote = Math.random() > 0.7;
  const noteRotation = Math.random() > 0.5 ? 'rotate-3' : '-rotate-2';
  const notePosition = Math.random() > 0.5 ? 'bottom-16 right-4' : 'top-24 left-4';

  if (mode === 'dossier') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-1 md:col-span-6 lg:col-span-4 bg-[#F9F7F2] dark:bg-stone-900 flex flex-col relative overflow-hidden"
      >
        <div className="p-6 pb-0 flex justify-between items-start border-b border-stone-200 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-mono text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-1"># {zine.tone}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
            className={`transition-colors z-20 ${isStarred ? 'text-amber-500' : 'text-stone-300 hover:text-amber-500'}`}
          >
            <Star size={16} fill={isStarred ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="p-6 flex-grow flex flex-col justify-center cursor-pointer z-10" onClick={onSelect}>
          <div className="text-[10px] uppercase tracking-widest font-mono text-stone-400 mb-4">REF_{shortId}</div>
          <h2 className="font-serif text-4xl italic leading-tight mb-2 text-stone-900 dark:text-white hover:text-emerald-600 transition-colors">{zine.title}</h2>
          <p className="font-mono text-xs text-stone-500 mt-4">SYNTHESIS_SCORE: {synthesisScore}</p>
        </div>
        <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 grid grid-cols-2 gap-4 font-mono text-[9px] uppercase tracking-widest text-stone-500 cursor-pointer z-10" onClick={onSelect}>
          <div>
            <span className="block text-stone-400 mb-1">Anchored</span>
            <span className="text-stone-800 dark:text-stone-300">{dateStr}</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <span className="block text-stone-400 mb-1">Frequency</span>
              <span className="text-stone-800 dark:text-stone-300">Alpha-Decay</span>
            </div>
            {isCloud && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mb-1" />}
          </div>
        </div>
        
        {hasNote && (
          <div className={`absolute bg-[#F9F7F2]/90 dark:bg-stone-800/90 border border-[#D4D1C9] dark:border-stone-700 shadow-sm backdrop-blur-sm p-3 w-36 z-20 ${notePosition} ${noteRotation}`}>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 -rotate-2 w-10 h-3 bg-white/40 dark:bg-white/10 border border-black/10 dark:border-white/10 shadow-sm"></div>
            <p className="font-serif italic text-xs text-stone-600 dark:text-stone-300 leading-tight">Aesthetic resonance detected in recent scans.</p>
          </div>
        )}
      </motion.div>
    );
  } else if (mode === 'bento') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-1 md:col-span-6 lg:col-span-4 bg-[#F4F1E8] dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-sm flex flex-col p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start mb-8">
          <span className="text-[9px] uppercase tracking-widest font-mono text-stone-500 border border-stone-300 dark:border-stone-700 px-2 py-1 rounded-sm"># {zine.tone}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
            className={`transition-colors ${isStarred ? 'text-amber-500' : 'text-stone-400 hover:text-amber-500'}`}
          >
            <Star size={14} fill={isStarred ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="flex-grow cursor-pointer" onClick={onSelect}>
          <div className="text-[9px] uppercase tracking-widest font-mono text-stone-400 mb-2">REF_{shortId}</div>
          <h2 className="font-serif text-3xl italic leading-tight text-stone-800 dark:text-white hover:text-emerald-600 transition-colors">{zine.title}</h2>
        </div>
        <div className="mt-8 pt-4 border-t border-stone-300/50 dark:border-stone-700/50 flex justify-between items-end cursor-pointer" onClick={onSelect}>
           <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500">
             <span className="block mb-1">Score</span>
             <span className="text-stone-800 dark:text-stone-300">{synthesisScore}</span>
           </div>
           <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 text-right flex items-center gap-2">
             {isCloud && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
             <div>
               <span className="block mb-1">Alpha-Decay</span>
               <span className="text-stone-800 dark:text-stone-300">{dateStr}</span>
             </div>
           </div>
        </div>
      </motion.div>
    );
  } else {
    // minimalist
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-1 md:col-span-6 lg:col-span-4 group cursor-pointer flex flex-col"
        onClick={onSelect}
      >
        <div className="flex-grow flex items-center justify-between">
          <h2 className="font-serif text-4xl md:text-5xl italic leading-tight text-stone-800 dark:text-stone-200 group-hover:text-black dark:group-hover:text-white transition-colors">{zine.title}</h2>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
            className={`ml-4 opacity-0 group-hover:opacity-100 transition-all ${isStarred ? 'text-amber-500 opacity-100' : 'text-stone-300 hover:text-amber-500'}`}
          >
            <Star size={18} fill={isStarred ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center border-t border-stone-200 dark:border-stone-800 pt-4">
           <span className="text-[9px] uppercase tracking-widest font-mono text-stone-400">REF_{shortId} // {zine.tone}</span>
           <div className="flex items-center gap-2">
             {isCloud && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
             <span className="text-[9px] uppercase tracking-widest font-mono text-stone-400">{dateStr}</span>
           </div>
        </div>
      </motion.div>
    );
  }
};

const InitSequenceCard: React.FC<{ mode: string }> = ({ mode }) => {
  const handleInit = () => {
    window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'studio' }));
  };

  if (mode === 'dossier') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-1 md:col-span-6 lg:col-span-4 bg-stone-900 text-stone-300 p-8 flex flex-col justify-between"
      >
        <div>
          <h3 className="font-serif text-2xl italic text-white mb-4">Initialize Sequence</h3>
          <p className="font-sans text-xs text-stone-400 mb-8 leading-relaxed">
            Begin a new manifestation. Connect disparate nodes to form a cohesive dossier.
          </p>
        </div>
        <button 
          onClick={handleInit}
          className="w-full py-4 border border-stone-700 text-white font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-stone-900 transition-colors flex items-center justify-center gap-2"
        >
          <Zap size={14} />
          Draft New Protocol
        </button>
      </motion.div>
    );
  } else if (mode === 'bento') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="col-span-1 md:col-span-6 lg:col-span-4 bg-stone-800 text-stone-200 p-8 flex flex-col justify-between rounded-sm shadow-sm hover:shadow-md transition-shadow"
      >
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse"></span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">System Ready</span>
          </div>
          <h3 className="font-serif text-3xl italic text-white mb-4">New Archive Entry</h3>
          <p className="font-sans text-sm text-stone-400 mb-8 leading-relaxed">
            Catalog a new module into the canon.
          </p>
        </div>
        <button 
          onClick={handleInit}
          className="w-full py-3 bg-stone-700 text-white font-mono text-[9px] uppercase tracking-widest hover:bg-stone-600 transition-colors rounded-sm flex items-center justify-center gap-2"
        >
          <Zap size={12} />
          Initialize
        </button>
      </motion.div>
    );
  } else {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onClick={handleInit}
        className="col-span-1 md:col-span-6 lg:col-span-4 flex items-center justify-center border border-dashed border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-colors min-h-[200px] group cursor-pointer"
      >
         <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
            <Zap size={24} className="mx-auto mb-4 text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">Draft Protocol</span>
         </div>
      </motion.div>
    );
  }
};
