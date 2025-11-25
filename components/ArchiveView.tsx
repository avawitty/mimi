

import React, { useState } from 'react';
import { Shelf } from './Shelf';
import { Pocket } from './Pocket';
import { ZineMetadata } from '../types';

interface ArchiveViewProps {
  onSelectZine: (zine: ZineMetadata) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onSelectZine }) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'pocket'>('issues');

  return (
    <div className="w-full pt-24 md:pt-48 animate-fade-in">
       
       <div className="px-6 md:px-12 mb-8 mt-4 md:mt-12 flex flex-col md:flex-row md:items-baseline justify-between gap-6 border-b border-stone-100 pb-8">
           <div>
               <h2 className="font-serif text-3xl italic text-nous-text">The Archive</h2>
               <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle mt-1">
                 {activeTab === 'issues' ? 'Your Personal Collection' : 'Curated Fragments & Saves'}
               </p>
           </div>

           <div className="flex gap-8">
               <button 
                 onClick={() => setActiveTab('issues')}
                 className={`font-sans text-[9px] uppercase tracking-[0.25em] pb-1 transition-all ${activeTab === 'issues' ? 'text-nous-text border-b border-nous-text' : 'text-stone-400 border-transparent hover:text-nous-text'}`}
               >
                  My Issues
               </button>
               <button 
                 onClick={() => setActiveTab('pocket')}
                 className={`font-sans text-[9px] uppercase tracking-[0.25em] pb-1 transition-all ${activeTab === 'pocket' ? 'text-nous-text border-b border-nous-text' : 'text-stone-400 border-transparent hover:text-nous-text'}`}
               >
                  The Pocket
               </button>
           </div>
       </div>

       <div className="w-full min-h-[50vh]">
          {activeTab === 'issues' ? (
             <Shelf variant="personal" onSelectZine={onSelectZine} />
          ) : (
             <div className="-mt-12">
               {/* Pocket has its own internal padding so we offset slightly */}
               <Pocket onSelectZine={onSelectZine} />
             </div>
          )}
       </div>

    </div>
  );
};