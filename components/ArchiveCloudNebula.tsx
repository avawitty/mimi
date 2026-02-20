
// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToUserZines, subscribeToCommunityZines } from '../services/firebase';
import { getLocalZines } from '../services/localArchive';
import { ZineMetadata, ToneTag } from '../types';
import { useUser } from '../contexts/UserContext';
import { Archive, Search, Hash, X, Eye, Folder, Loader2, Radio, Zap, Wind, Ghost, Star, Info, Layers, Target, Compass, Sparkles } from 'lucide-react';

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

export const ArchiveCloudNebula: React.FC<{ onSelectZine: (zine: ZineMetadata) => void }> = ({ onSelectZine }) => {
  const { user, profile, toggleZineStar } = useUser();
  const [localZines, setLocalZines] = useState<ZineMetadata[]>([]);
  const [cloudZines, setCloudZines] = useState<ZineMetadata[]>([]);
  const [communityZines, setCommunityZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [nebulaMode, setNebulaMode] = useState<'strategist' | 'shadow' | 'starred'>('strategist');

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

    if (nebulaMode === 'shadow') {
       return baseSet.filter(z => z.tone === 'Structured Desire' || z.tone === 'Documentary B&W' || !z.isPublic);
    }
    if (nebulaMode === 'starred') {
       return baseSet.filter(z => profile?.starredZineIds?.includes(z.id));
    }
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
                    <span className="font-sans text-[8px] uppercase tracking-[0.5em] font-black italic">Sovereign Registry // The Stands</span>
                 </div>
                 <h2 className="font-serif text-6xl md:text-8xl italic tracking-tighter text-nous-text dark:text-white leading-none luminescent-text">The Stand.</h2>
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
                      onClick={() => setNebulaMode('starred')}
                      className={`flex items-center gap-3 px-6 md:px-8 py-3 transition-all ${nebulaMode === 'starred' ? 'bg-amber-500 text-white' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                       <Star size={14} fill={nebulaMode === 'starred' ? 'white' : 'none'} />
                       <span className="font-sans text-[8px] uppercase tracking-widest font-black">Favorites</span>
                    </button>
                    <div className="w-px h-8 bg-stone-200 dark:bg-stone-800" />
                    <button 
                      onClick={() => setNebulaMode('shadow')}
                      className={`flex items-center gap-3 px-6 md:px-8 py-3 transition-all ${nebulaMode === 'shadow' ? 'bg-stone-950 text-white' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                       <Ghost size={14} />
                       <span className="font-sans text-[8px] uppercase tracking-widest font-black">Shadow</span>
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

        <div className="w-full relative group">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-12">
          {filteredZines.map(zine => (
            <ZineShelfItem 
              key={zine.id} 
              zine={zine} 
              onSelect={() => onSelectZine(zine)} 
              isCloud={zine.userId && !zine.userId.startsWith('ghost')} 
              isStarred={profile?.starredZineIds?.includes(zine.id)}
              onToggleStar={() => toggleZineStar(zine.id)}
            />
          ))}
          {filteredZines.length === 0 && (
            <div className="col-span-full py-48 text-center opacity-30 space-y-8">
               <Ghost size={64} className="mx-auto" />
               <p className="font-serif italic text-3xl">“This frequency is currently void.”</p>
               <button onClick={() => setNebulaMode('strategist')} className="font-sans text-[9px] uppercase tracking-widest font-black text-emerald-500 border-b border-emerald-500">Return to Strategist</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ZineShelfItem: React.FC<{ zine: ZineMetadata, onSelect: () => void, isCloud?: boolean, isStarred?: boolean, onToggleStar: () => void }> = ({ zine, onSelect, isCloud, isStarred, onToggleStar }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white dark:bg-[#1C1C1C] border border-stone-200 dark:border-stone-800 p-8 md:p-12 shadow-sm hover:shadow-2xl hover:border-stone-300 dark:hover:border-stone-700 transition-all flex flex-col gap-10 rounded-sm pt-14"
    >
       <div className="absolute top-0 left-0 right-0 flex px-8 justify-between items-start pointer-events-none">
          <div className="bg-stone-50 dark:bg-stone-900 px-4 py-1.5 border-x border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
              <Hash size={10} className="text-stone-400" />
              <span className="font-sans text-[7px] font-black uppercase tracking-widest text-stone-500">{zine.tone}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
            className={`pointer-events-auto p-2 mt-2 -mr-2 rounded-full transition-all ${isStarred ? 'text-amber-500 scale-110' : 'text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400'}`}
          >
             <Star size={16} fill={isStarred ? "currentColor" : "none"} strokeWidth={isStarred ? 0 : 1.5} />
          </button>
       </div>
       <div className="flex flex-col gap-10 flex-1 cursor-pointer" onClick={onSelect}>
           <span className="font-mono text-[8px] uppercase tracking-widest opacity-40 text-stone-500 dark:text-stone-400">REF_{zine.id.slice(-4)}</span>
           <h3 className="font-serif text-3xl md:text-4xl italic tracking-tighter leading-[0.9] text-nous-text dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{zine.title}</h3>
       </div>
       <div className="flex justify-between items-center z-10 opacity-30 pt-4 border-t border-stone-100 dark:border-stone-800 cursor-pointer" onClick={onSelect}>
         <span className="font-mono text-[8px] uppercase tracking-widest text-stone-500">{new Date(zine.timestamp).toLocaleDateString()}</span>
         {isCloud && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
       </div>
    </motion.div>
  );
};
