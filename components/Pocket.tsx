
import React, { useEffect, useState } from 'react';
import { PocketItem, ZineMetadata } from '../types';
import { fetchPocketItems, deleteFromPocket } from '../services/firebase';
import { getLocalPocket } from '../services/localArchive';
import { useUser } from '../contexts/UserContext';
import { analyzeTasteManifesto } from '../services/geminiService';
import { ZineCard } from './ZineCard';
import { Loader2, Trash2, Eye, Sparkles, FileText, Wand2, Activity, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from './Tooltip';

const MAX_POCKET_CAPACITY_GHOST = 12;
const MAX_POCKET_CAPACITY_SWAN = 48;

export const Pocket: React.FC<{ onSelectZine: (zine: ZineMetadata) => void }> = ({ onSelectZine }) => {
  const { user, profile } = useUser();
  const [items, setItems] = useState<PocketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manifesto, setManifesto] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'zine_card' | 'palette' | 'omen' | 'script'>('all');

  const maxCapacity = profile?.isSwan ? MAX_POCKET_CAPACITY_SWAN : MAX_POCKET_CAPACITY_GHOST;

  useEffect(() => {
    const loadPocket = async () => {
      setLoading(true);
      const localData = getLocalPocket();
      let cloudData: PocketItem[] = [];
      if (user && !user.isAnonymous) { cloudData = await fetchPocketItems(user.uid); }
      const merged = [...cloudData];
      localData.forEach(li => { if (!merged.find(mi => mi.id === li.id)) merged.push(li); });
      setItems(merged.sort((a,b) => b.savedAt - a.savedAt));
      setLoading(false);
    };
    loadPocket();
  }, [user]);

  const handleAnalyzeTaste = async () => {
      if (items.length < 3) {
        alert("The pocket needs more debris to generate a manifesto.");
        return;
      }
      setIsAnalyzing(true);
      try {
          const reflection = await analyzeTasteManifesto(items);
          setManifesto(reflection);
      } catch (e) {
          setManifesto("The analysis was reclaimed by the void.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleDelete = async (id: string) => {
    if (!user) { setItems(prev => prev.filter(i => i.id !== id)); return; }
    try { await deleteFromPocket(user.uid, id); setItems(prev => prev.filter(i => i.id !== id)); } catch (e) {}
  };

  const filteredItems = items.filter(item => filter === 'all' || item.type === filter);
  const capacityUsed = (items.length / maxCapacity) * 100;
  const isFull = items.length >= maxCapacity;

  if (loading) return <div className="flex justify-center p-24"><Loader2 className="animate-spin text-nous-text dark:text-white" /></div>;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-12 pt-8 md:pt-12 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-stone-100 dark:border-stone-800 pb-8 gap-8">
        <div>
           <div className="flex items-center gap-4 mb-2">
             <h2 className="font-serif text-3xl md:text-4xl italic text-nous-text dark:text-white tracking-tighter">The Pocket.</h2>
             {profile?.isSwan && <span className="px-3 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-sans text-[7px] font-black uppercase tracking-widest border border-emerald-100">Swan Tier</span>}
           </div>
           <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-500 font-bold">Curated Debris // Temporal Archive</p>
        </div>
        
        <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Curation Load</span>
                    <div className="flex items-center gap-2">
                        <div className="w-32 h-1 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              animate={{ width: `${capacityUsed}%` }}
                              className={`h-full ${isFull ? 'bg-red-500' : 'bg-nous-text dark:bg-white'}`}
                            />
                        </div>
                        <span className={`font-mono text-[10px] font-black ${isFull ? 'text-red-500' : 'text-stone-500'}`}>{items.length}/{maxCapacity}</span>
                    </div>
                </div>
                <Tooltip text="Reverse-Engineer Taste Logic">
                  <button 
                      onClick={handleAnalyzeTaste}
                      disabled={isAnalyzing || items.length === 0}
                      className="px-8 py-4 bg-nous-text dark:bg-stone-100 text-white dark:text-stone-900 font-sans text-[9px] uppercase tracking-[0.4em] font-black flex items-center gap-3 rounded-full shadow-2xl disabled:opacity-30 active:scale-95 transition-all border dark:border-white"
                  >
                      {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      Calibrate Taste
                  </button>
                </Tooltip>
            </div>
            {isFull && (
                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                    <AlertTriangle size={10} />
                    <span className="font-sans text-[7px] uppercase tracking-widest font-black">Storage Saturated. Pruning Required.</span>
                </div>
            )}
        </div>
      </div>

      <AnimatePresence>
          {manifesto && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-12 p-8 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                      <Activity size={14} className="text-emerald-600" />
                      <span className="font-sans text-[8px] uppercase tracking-widest text-emerald-700 font-black">Aura Logic Analysis // Manifesto</span>
                  </div>
                  <p className="font-serif italic text-2xl text-emerald-900 dark:text-emerald-400">"{manifesto}"</p>
                  <button onClick={() => setManifesto(null)} className="mt-6 text-[8px] uppercase tracking-widest font-black text-emerald-600 hover:underline">Dismiss Analysis</button>
              </motion.div>
          )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-x-6 gap-y-3 mb-12">
           {(['all', 'image', 'zine_card', 'palette', 'omen', 'script'] as const).map(f => (
             <button key={f} onClick={() => setFilter(f)} className={`text-[9px] uppercase tracking-[0.4em] pb-1 transition-all font-black border-b ${filter === f ? 'text-nous-text dark:text-white border-nous-text dark:border-white' : 'text-stone-300 dark:text-stone-700 border-transparent hover:text-nous-text'}`}>
                {f === 'zine_card' ? 'Issues' : f === 'image' ? 'Visions' : f === 'palette' ? 'Analyses' : f === 'omen' ? 'Omens' : f === 'script' ? 'Scripts' : 'Everything'}
             </button>
           ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-32 opacity-30">
            <Eye size={48} className="mx-auto mb-6" />
            <p className="font-serif italic text-2xl">Silence in the pocket.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredItems.map(item => (
                <div key={item.id} className="group relative bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-6 shadow-sm hover:shadow-xl transition-all">
                    <button 
                        onClick={() => handleDelete(item.id)}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all z-10"
                    >
                        <Trash2 size={14} />
                    </button>
                    
                    {item.type === 'image' && (
                        <div className="space-y-4">
                            <div className="aspect-square bg-stone-50 dark:bg-stone-950 overflow-hidden">
                                <img src={item.content.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                            </div>
                            <p className="font-serif italic text-sm text-stone-500 line-clamp-2">"{item.content.prompt}"</p>
                        </div>
                    )}
                    
                    {item.type === 'omen' && (
                        <div className="py-8 text-center space-y-6">
                            <Sparkles size={20} className="mx-auto text-amber-500" />
                            <p className="font-serif italic text-xl leading-relaxed">"{item.content.omenText}"</p>
                            <span className="font-sans text-[7px] uppercase tracking-widest text-stone-300 font-black block">Transverse Omen Log</span>
                        </div>
                    )}

                    {item.type === 'zine_card' && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-start">
                               <div className="flex flex-col">
                                   <span className="font-sans text-[7px] uppercase tracking-widest text-stone-400 font-black">Issue Archive</span>
                                   <h3 className="font-serif text-2xl italic">{item.content.zineTitle}</h3>
                               </div>
                               <FileText size={16} className="text-stone-300" />
                           </div>
                           <button onClick={() => onSelectZine({ id: item.content.zineId } as ZineMetadata)} className="w-full py-3 border border-stone-100 dark:border-stone-800 font-sans text-[8px] uppercase tracking-widest font-black hover:bg-nous-text hover:text-white transition-all">Re-Open Accession</button>
                        </div>
                    )}

                    <div className="mt-6 flex justify-between items-center opacity-30">
                         <span className="font-mono text-[7px] uppercase">{new Date(item.savedAt).toLocaleDateString()}</span>
                         <span className="font-sans text-[7px] uppercase tracking-widest font-bold">{item.type.replace('_', ' ')}</span>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
