// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUserZines } from '../services/firebase';
import { getLocalZines } from '../services/localArchive';
import { ZineMetadata, ToneTag } from '../types';
import { useUser } from '../contexts/UserContext';
import { Archive, Search, Hash, X, Eye, Folder, Loader2, Radio } from 'lucide-react';

const TONE_MAP: Record<ToneTag, { bg: string, text: string, accent: string }> = {
  'Dream': { bg: 'bg-slate-50', text: 'text-slate-900', accent: 'border-slate-200' },
  'Chic': { bg: 'bg-[#FDFBF7]', text: 'text-[#1C1917]', accent: 'border-stone-200' },
  'Unhinged': { bg: 'bg-[#0A0A0A]', text: 'text-white', accent: 'border-red-900' },
  'Romantic': { bg: 'bg-[#FFF9F9]', text: 'text-rose-950', accent: 'border-rose-100' },
  'Cryptic': { bg: 'bg-stone-200', text: 'text-stone-900', accent: 'border-stone-400' },
  'Nostalgia': { bg: 'bg-[#F5F3FF]', text: 'text-violet-950', accent: 'border-violet-200' },
  'Academic': { bg: 'bg-[#F2F1EC]', text: 'text-stone-900', accent: 'border-stone-300' },
  'Meme': { bg: 'bg-[#EEF2FF]', text: 'text-indigo-950', accent: 'border-indigo-200' },
};

export const ArchiveCloudNebula: React.FC<{ onSelectZine: (zine: ZineMetadata) => void }> = ({ onSelectZine }) => {
  const { user } = useUser();
  const [localZines, setLocalZines] = useState<ZineMetadata[]>([]);
  const [cloudZines, setCloudZines] = useState<ZineMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const local = await getLocalZines() || [];
      setLocalZines(local.filter(z => z && z.id && z.content));
      if (user && !user.isAnonymous) {
        try { 
          const cloud = await fetchUserZines(user.uid) || []; 
          setCloudZines(cloud.filter(z => z && z.id && z.content));
        } catch(e) {}
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const allZines = useMemo(() => [...localZines, ...cloudZines], [localZines, cloudZines]);
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allZines.forEach(zine => {
      if (zine.content?.tags) zine.content.tags.forEach(t => tags.add(t));
      tags.add(zine.tone);
    });
    return Array.from(tags).sort();
  }, [allZines]);

  const filterZines = (zines: ZineMetadata[]) => {
    return zines.filter(zine => {
      const zineTags = [...(zine.content?.tags || []), zine.tone];
      const matchesTag = !activeTag || zineTags.includes(activeTag);
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        zine.title.toLowerCase().includes(searchLower) ||
        zineTags.some(t => t.toLowerCase().includes(searchLower));
      return matchesTag && matchesSearch;
    });
  };

  const filteredLocal = useMemo(() => filterZines(localZines), [localZines, searchQuery, activeTag]);
  const filteredCloud = useMemo(() => filterZines(cloudZines), [cloudZines, searchQuery, activeTag]);

  if (loading && allZines.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
      <Loader2 className="w-12 h-12 text-stone-200 animate-spin" />
      <span className="font-sans text-[8px] uppercase tracking-[1em] text-stone-400 font-black">Hydrating The Stands</span>
    </div>
  );

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center overflow-y-auto no-scrollbar pb-64 px-6 md:px-16 pt-12 md:pt-20">
      <div className="w-full max-w-7xl space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-100 dark:border-stone-900 pb-12 gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3 text-stone-400"><Archive size={16} /><span className="font-sans text-[8px] uppercase tracking-[0.5em] font-black italic">Archive Protocol</span></div>
              <h2 className="font-serif text-6xl md:text-9xl italic tracking-tighter text-nous-text dark:text-white leading-none">The Stands.</h2>
           </div>
        </div>

        {/* AUDIT LOG BAR */}
        <div className="w-full relative group">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3 pl-4 pointer-events-none">
             <Search size={14} className="text-stone-300 group-focus-within:text-nous-text dark:group-focus-within:text-white transition-colors" />
             <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black text-stone-300/50">Audit_Log</span>
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Trace zine by name, theme, or folder anchor..."
            className="w-full bg-stone-50/50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 py-6 pl-32 pr-8 font-serif italic text-lg md:text-xl focus:outline-none focus:border-nous-text dark:focus:border-white transition-all placeholder:text-stone-300 placeholder:opacity-50"
          />
        </div>

        {/* FOLDER ANCHORS */}
        {allTags.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400"><Folder size={10} /><span className="font-sans text-[7px] uppercase tracking-widest font-black shrink-0">Folder Anchors:</span></div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setActiveTag(null)} className={`px-4 py-2 rounded-sm font-sans text-[9px] uppercase tracking-widest border transition-all ${!activeTag ? 'bg-nous-text text-white border-nous-text dark:bg-white dark:text-black font-black' : 'bg-stone-50 dark:bg-stone-900 border-stone-100 dark:border-stone-800 text-stone-400'}`}>All Artifacts</button>
              {allTags.map(t => (
                <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)} className={`px-4 py-2 rounded-sm font-sans text-[9px] uppercase tracking-widest border transition-all flex items-center gap-2 ${activeTag === t ? 'bg-nous-text text-white border-nous-text dark:bg-white dark:text-black shadow-xl font-black' : 'bg-stone-50 dark:bg-stone-900 border-stone-100 dark:border-stone-800 text-stone-500'}`}><Hash size={10} /> {t}</button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-12">
          {filteredLocal.map(zine => (
            <ZineShelfItem key={zine.id} zine={zine} onSelect={() => onSelectZine(zine)} />
          ))}
          {filteredCloud.map(zine => (
            <ZineShelfItem key={zine.id} zine={zine} onSelect={() => onSelectZine(zine)} isCloud />
          ))}
        </div>
      </div>
    </div>
  );
};

const ZineShelfItem: React.FC<{ zine: ZineMetadata, onSelect: () => void, isCloud?: boolean }> = ({ zine, onSelect, isCloud }) => {
  const colors = TONE_MAP[zine.tone] || TONE_MAP.Chic;
  const tags = zine.content?.tags || [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={onSelect}
      className={`group relative cursor-pointer ${colors.bg} border ${colors.accent} p-8 md:p-12 shadow-sm hover:shadow-2xl transition-all flex flex-col gap-10 rounded-sm pt-14`}
    >
       <div className="absolute top-0 left-0 right-0 flex px-8">
          <div className="bg-stone-100/50 dark:bg-black/20 px-4 py-1.5 rounded-b-lg border-x border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
              <Hash size={10} className="text-stone-400" />
              <span className="font-sans text-[7px] font-black uppercase tracking-widest text-stone-500">{tags[0] || 'Issue'}</span>
          </div>
       </div>
       <div className="flex justify-between items-start z-10">
         <span className={`font-mono text-[8px] uppercase tracking-widest opacity-40 ${colors.text}`}>LOG_{zine.id.slice(-4)}</span>
         <span className={`font-sans text-[8px] uppercase tracking-[0.5em] font-black ${colors.text}`}>{zine.tone}</span>
       </div>
       <h3 className={`font-serif text-3xl md:text-4xl italic tracking-tighter leading-[0.9] ${colors.text}`}>{zine.title}</h3>
       <div className={`flex justify-between items-center z-10 opacity-30 pt-4 border-t ${colors.accent}`}>
         <span className="font-mono text-[8px] uppercase tracking-widest">{new Date(zine.timestamp).toLocaleDateString()}</span>
         {isCloud && <Radio size={10} className="text-emerald-500" />}
       </div>
    </motion.div>
  );
};