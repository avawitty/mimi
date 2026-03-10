
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Shelf } from './Shelf';
import { Pocket } from './Pocket';
import { ZineMetadata } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ArchiveViewProps {
  onSelectZine: (zine: ZineMetadata) => void;
}

import React, { useState, useEffect } from 'react';
import { Shelf } from './Shelf';
import { Pocket } from './Pocket';
import { ArchiveListView } from './ArchiveListView';
import { ZineMetadata, PocketItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List } from 'lucide-react';
import { fetchPocketItems } from '../services/firebase';
import { getLocalPocket } from '../services/localArchive';
import { fetchCommunityZines } from '../services/firebaseUtils';
import { useUser } from '../contexts/UserContext';

interface ArchiveViewProps {
  onSelectZine: (zine: ZineMetadata) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onSelectZine }) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'pocket' | 'list'>('pocket');
  const [items, setItems] = useState<PocketItem[]>([]);
  const [zines, setZines] = useState<ZineMetadata[]>([]);
  const { user } = useUser();

  const loadData = async () => {
    const localPocket = await getLocalPocket() || [];
    const cloudPocket = user && !user.isAnonymous ? await fetchPocketItems(user.uid) || [] : [];
    const registry = new Map<string, PocketItem>();
    localPocket.forEach(item => { if (item && item.id) registry.set(item.id, item); });
    cloudPocket.forEach(item => { if (item && item.id) registry.set(item.id, item); });
    setItems(Array.from(registry.values()));

    const zines = await fetchCommunityZines(100);
    setZines(zines || []);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  return (
    <div className="w-full pt-32 md:pt-48 animate-fade-in transition-all duration-1000">
       
       <div className="px-12 md:px-24 mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-stone-100 dark:border-stone-800 pb-16">
           <div className="space-y-4">
               <h2 className="font-serif text-7xl md:text-9xl italic text-nous-text dark:text-nous-dark-text tracking-tighter luminescent-text leading-none">The Archive.</h2>
               <p className="font-sans text-[10px] uppercase tracking-[1em] text-stone-400 font-black">
                 {activeTab === 'issues' ? 'Manifestations of Form' : activeTab === 'pocket' ? 'Curated Physical Debris' : 'List View'}
               </p>
           </div>

           <div className="flex gap-16 items-end">
               <button 
                 className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-sans text-[9px] uppercase tracking-widest font-black hover:bg-emerald-500 hover:text-white transition-all mb-1"
               >
                 + Inject Shard
               </button>
               <div className="flex gap-16">
                   <button 
                     onClick={() => setActiveTab('issues')}
                     className={`font-sans text-[12px] uppercase tracking-[0.6em] pb-3 transition-all font-black border-b-2 ${activeTab === 'issues' ? 'text-nous-text dark:text-white border-nous-text dark:border-white' : 'text-stone-300 border-transparent hover:text-stone-500'}`}
                   >
                      Authored
                   </button>
                   <button 
                     onClick={() => setActiveTab('pocket')}
                     className={`font-sans text-[12px] uppercase tracking-[0.6em] pb-3 transition-all font-black border-b-2 ${activeTab === 'pocket' ? 'text-nous-text dark:text-white border-nous-text dark:border-white' : 'text-stone-300 border-transparent hover:text-stone-500'}`}
                   >
                      Curated
                   </button>
                   <button 
                     onClick={() => setActiveTab('list')}
                     className={`font-sans text-[12px] uppercase tracking-[0.6em] pb-3 transition-all font-black border-b-2 ${activeTab === 'list' ? 'text-nous-text dark:text-white border-nous-text dark:border-white' : 'text-stone-300 border-transparent hover:text-stone-500'}`}
                   >
                      List
                   </button>
               </div>
           </div>
       </div>

       <div className="w-full min-h-[70vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'list' ? (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ArchiveListView items={items} zines={zines} onDelete={loadData} />
                </motion.div>
            ) : activeTab === 'issues' ? (
               <motion.div key="issues" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8 }}>
                 <Shelf variant="personal" onSelectZine={onSelectZine} />
               </motion.div>
            ) : (
               <motion.div key="pocket" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8 }}>
                 <Pocket onSelectZine={onSelectZine} />
               </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
};
