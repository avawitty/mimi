// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Archive, Briefcase, FileText, ChevronRight, Loader2, Radio } from 'lucide-react';
import { getLocalZines, getLocalPocket } from '../services/localArchive';
import { fetchUserZines, fetchPocketItems } from '../services/firebase';
import { ZineMetadata, PocketItem } from '../types';
import { useUser } from '../contexts/UserContext';

export const GlobalSearchOverlay: React.FC<{ isOpen: boolean; onClose: () => void; onSelectZine: (z: ZineMetadata) => void }> = ({ isOpen, onClose, onSelectZine }) => {
 const { user } = useUser();
 const [query, setQuery] = useState('');
 const [loading, setLoading] = useState(false);
 const [results, setResults] = useState<{ zines: ZineMetadata[], pocket: PocketItem[] }>({ zines: [], pocket: [] });

 const [allData, setAllData] = useState<{ zines: ZineMetadata[], pocket: PocketItem[] }>({ zines: [], pocket: [] });

 useEffect(() => {
 if (isOpen) {
 setLoading(true);
 const load = async () => {
 const localZines = await getLocalZines() || [];
 const localPocket = await getLocalPocket() || [];
 let cloudZines = [];
 let cloudPocket = [];
 
 if (user && !user.isAnonymous) {
 cloudZines = await fetchUserZines(user.uid) || [];
 cloudPocket = await fetchPocketItems(user.uid) || [];
 }

 const zinesMap = new Map();
 [...localZines, ...cloudZines].forEach(z => z && z.id && zinesMap.set(z.id, z));
 
 const pocketMap = new Map();
 [...localPocket, ...cloudPocket].forEach(p => p && p.id && pocketMap.set(p.id, p));

 setAllData({ 
 zines: Array.from(zinesMap.values()), 
 pocket: Array.from(pocketMap.values()) 
 });
 setLoading(false);
 };
 load().catch(e => {
 console.error("MIMI // GlobalSearch load failed", e);
 setLoading(false);
 });
 }
 }, [isOpen, user]);

 const filtered = useMemo(() => {
 if (!query.trim()) return { zines: [], pocket: [] };
 const q = query.toLowerCase();
 
 return {
 zines: allData.zines.filter(z => 
 z.title.toLowerCase().includes(q) || 
 (z.content?.headlines?.[0] && z.content.headlines[0].toLowerCase().includes(q)) ||
 z.tone.toLowerCase().includes(q) ||
 JSON.stringify(z.content).toLowerCase().includes(q)
 ).slice(0, 10),
 pocket: allData.pocket.filter(p => 
 (p.content.prompt || p.content.name || '').toLowerCase().includes(q) ||
 (p.notes || '').toLowerCase().includes(q)
 ).slice(0, 15)
 };
 }, [allData, query]);

 if (!isOpen) return null;

 return (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[12000] bg-white/95 dark:bg-stone-950/98 backdrop-blur-3xl flex flex-col items-center p-6 md:p-12 overflow-hidden"
 >
 <div className="w-full max-w-4xl flex flex-col h-full">
 <header className="flex justify-between items-center mb-12 shrink-0">
 <div className="flex items-center gap-4 text-stone-400">
 <Search size={18} />
 <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">Global Registry Audit</span>
 </div>
 <button onClick={onClose} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-none hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
 </header>

 <div className="relative mb-16 shrink-0">
 <input 
 autoFocus
 type="text"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Trace an artifact by intent or form..."
 className="w-full bg-transparent border-b-2 border-stone-100 dark:border-stone-800 py-8 font-serif italic text-3xl md:text-6xl text-nous-text dark:text-white focus:outline-none focus:border-stone-800 dark:focus:border-stone-300 transition-all placeholder:text-stone-200"
 />
 {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-stone-500"/></div>}
 </div>

 <div className="flex-1 overflow-y-auto no-scrollbar space-y-16 pb-32">
 {query.trim() ? (
 <>
 {filtered.zines.length > 0 && (
 <section className="space-y-8">
 <div className="flex items-center gap-3 text-stone-500">
 <FileText size={14} />
 <span className="font-sans text-[9px] uppercase tracking-widest font-black">Authored Manifests</span>
 </div>
 <div className="grid gap-4">
 {filtered.zines.map(z => (
 <button 
 key={z.id} 
 onClick={() => { onSelectZine(z); onClose(); }}
 className="w-full text-left p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-none hover:border-stone-800 dark:hover:border-stone-300 transition-all flex justify-between items-center group"
 >
 <div className="space-y-1">
 <h4 className="font-serif italic text-xl text-nous-text dark:text-white">{z.content?.headlines?.[0] || z.title ||"Untitled"}</h4>
 <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400">{z.tone} // {new Date(z.timestamp).toLocaleDateString()}</span>
 </div>
 <ChevronRight size={14} className="text-stone-300 group-hover:translate-x-1 transition-transform"/>
 </button>
 ))}
 </div>
 </section>
 )}

 {filtered.pocket.length > 0 && (
 <section className="space-y-8">
 <div className="flex items-center gap-3 text-amber-500">
 <Archive size={14} />
 <span className="font-sans text-[9px] uppercase tracking-widest font-black">Archival Shards</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {filtered.pocket.map(p => (
 <div 
 key={p.id} 
 className="p-5 bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 rounded-none flex gap-4 items-center group cursor-help"
 >
 <div className="w-12 h-12 bg-black overflow-hidden rounded-none flex-shrink-0">
 {p.type === 'image' && <img src={p.content.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0"/>}
 {p.type !== 'image' && <div className="w-full h-full flex items-center justify-center text-stone-500"><Radio size={16}/></div>}
 </div>
 <div className="flex-1 min-w-0">
 <h5 className="font-serif italic text-sm text-stone-700 dark:text-stone-300 truncate">{p.content.prompt || p.content.name || 'Untitled'}</h5>
 <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400">{p.type}</span>
 </div>
 </div>
 ))}
 </div>
 </section>
 )}

 {filtered.zines.length === 0 && filtered.pocket.length === 0 && (
 <div className="py-24 text-center opacity-30 space-y-6">
 <Radio size={48} className="mx-auto"/>
 <p className="font-serif italic text-2xl">“The query yielded no resonance.”</p>
 </div>
 )}
 </>
 ) : (
 <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-8 py-20">
 <div className="p-10 border border-stone-200 dark:border-stone-800 rounded-none">
 <Archive size={64} strokeWidth={1} />
 </div>
 <div className="space-y-2 text-center">
 <p className="font-serif italic text-3xl">Search Sovereign Registry.</p>
 <p className="font-sans text-[9px] uppercase tracking-widest font-black">All Authored and Curated Material</p>
 </div>
 </div>
 )}
 </div>
 
 <footer className="shrink-0 h-20 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center">
 <p className="font-serif italic text-stone-300 text-sm">"The archive is a mirror of consistent intent."</p>
 </footer>
 </div>
 </motion.div>
 );
};
