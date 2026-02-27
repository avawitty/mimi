
// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowRight, BookOpen, Compass, Grid3X3, List, Search, ArrowUpRight, Hash, FileText, Layers, Archive, Zap, Lock, Unlock, Eye } from 'lucide-react';
import { EditorialSpread } from './EditorialSpread';
import { useUser } from '../contexts/UserContext';
import { fetchUserZines } from '../services/firebaseUtils';
import { ZineMetadata } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseInit';

// --- DATA ---

const FIELD_GUIDE_CONTENT = [
  {
    domain: "CREATION",
    modules: [
      { 
        name: "Studio", 
        role: "Composition Engine",
        desc: "Studio is where you compose. Use it to draft zines, arrange text and image, structure ideas into form, and build visual narratives.",
        bestPractice: "Do not start with a blank concept. Pull material from Archive or insights from The Ward first. Studio performs best when fed."
      },
      { 
        name: "The Stand", 
        role: "Presentation Layer", 
        desc: "This is where work becomes visible. Published zines, public-facing artifacts, and sharable outputs live here. Think of The Stand as your editorial storefront." 
      },
      { 
        name: "Scry", 
        role: "Semantic Retrieval", 
        desc: "Scry is semantic retrieval. It does not search filenames; it searches meaning. Use it to surface images by tone or discover latent clusters.",
        bestPractice: "Search 'austere severity', not 'black coat'. If results feel thin, your Archive may need density."
      }
    ]
  },
  {
    domain: "ALCHEMY",
    modules: [
      {
        name: "Tailor",
        role: "Manifesto Layer",
        desc: "Tailor is your declared direction. Define aesthetic principles, articulate tone, and state constraints. The Sentinel inside The Ward reads Tailor.",
        bestPractice: "Write Tailor as principle, not trend. Weak: 'Minimal fashion'. Strong: 'Structured femininity through shadow and restraint'."
      },
      {
        name: "The Ward",
        role: "Governance System",
        desc: "Contains The Curator (analyzes patterns) and The Sentinel (compares Archive activity against Tailor). Use The Ward to view emerging motifs and detect drift."
      },
      {
        name: "Archive",
        role: "Memory Field",
        desc: "Everything uploaded enters here. Patterns reveal themselves through proximity. Archive is not Pinterest; it is a dataset."
      },
      {
        name: "Mesopic",
        role: "Perception Adjustment",
        desc: "Use Mesopic to shift contrast and recalibrate tonal perception. It is about seeing differently, not just editing."
      },
      {
        name: "Darkroom",
        role: "Transformation",
        desc: "Where active intervention occurs. Image manipulation, controlled distortion, and texture refinement."
      }
    ]
  },
  {
    domain: "DISCOVER",
    modules: [
      {
        name: "Proposal",
        role: "Structure Generator",
        desc: "Converts fragments into structure. Use Proposal to generate creative briefs, editorial decks, and concept outlines.",
        bestPractice: "Proposal scaffolds. You direct."
      },
      {
        name: "Press",
        role: "Narrative Positioning",
        desc: "Where Mimi explains itself. Platform philosophy and public-facing framing."
      },
      {
        name: "Profile",
        role: "Identity Management",
        desc: "Account presence and published works. The human layer of the system."
      }
    ]
  }
];

const PRESS_ITEMS = [
  {
    id: 'field-guide',
    ref: '001.FD',
    timestamp: '10:42 AM',
    brand: "Mimi Field Manual",
    tag: "Protocol",
    headline: "The Architecture of Sovereign Aesthetics.",
    subtitle: "A working guide to the interface.",
    isLocked: false,
    hex: "#064E3B", // Deep Emerald
    content: {
       author: "System Registry",
       intro: "Mimi Zine is structured in three domains: Creation, Alchemy, and Discover. Each menu item has a role. Use them in sequence. Return to them cyclically.",
       sections: FIELD_GUIDE_CONTENT,
       outro: "Mimi does not automate taste. It externalizes it. The more intentional your inputs, the more precise the system becomes."
    },
    stats: "Read Time: 5m"
  },
  {
    id: 'fragment-direction',
    ref: '002.CS',
    timestamp: '09:15 AM',
    brand: "Fragment to Direction",
    tag: "Case Study",
    headline: "Unified Creative Systems.",
    subtitle: "How one creator transformed scattered references.",
    isLocked: false,
    hex: "#78350F", // Deep Amber/Bronze
    content: {
       author: "User Report",
       intro: "When creative work is fast-moving, references pile up quickly. Screenshots live in camera rolls. Notes live in apps. Ideas remain unspoken because they’re hard to summarize.",
       sections: [],
       bodyText: "A Mimi Zine user—working across creative strategy, design, and digital publishing—entered the platform with a familiar problem: too much material, no unifying structure. Using Mimi, the workflow unfolded in three phases: Selection, Synthesis, and Integration."
    },
    stats: "Read Time: 4m"
  },
  {
    id: 'creative-infra',
    ref: '003.PR',
    timestamp: 'Yesterday',
    brand: "Creative Infrastructure",
    tag: "Professional",
    headline: "Systems for Taste.",
    subtitle: "Bridging the gap between intuition and execution.",
    isLocked: true,
    hex: "#312E81", // Deep Indigo
    content: {
       author: "Strategic Brief",
       intro: "Modern creative work is increasingly interdisciplinary. Strategy, design, content, and product thinking now overlap—but the tools used to support them remain siloed.",
       sections: [],
       bodyText: "Mimi Zine addresses a structural gap: the absence of shared infrastructure for early-stage creative thinking. For teams, Mimi functions as a centralized visual research layer."
    },
    stats: "Read Time: 6m"
  },
  {
    id: 'foundational',
    ref: '004.TH',
    timestamp: 'Archived',
    brand: "What Is Mimi Zine?",
    tag: "Theory",
    headline: "Foundational Theory.",
    subtitle: "A visual research system for turning fragmented inspiration.",
    isLocked: false,
    hex: "#18181B", // Zinc 900
    content: {
       author: "Mimi Editorial",
       intro: "Mimi Zine is a visual research and synthesis tool designed for creatives who work in fragments long before anything becomes public.",
       sections: [],
       bodyText: "Most creative work doesn’t begin with a brief—it begins with screenshots, half-formed references, aesthetic instincts, and unarticulated taste. Mimi Zine exists to formalize that early stage without flattening it."
    },
    stats: "Read Time: 3m"
  }
];

// --- COMPONENTS ---

export const ThePress: React.FC = () => {
  const { user } = useUser();
  const [activeArticle, setActiveArticle] = useState<any | null>(null);
  const [filter, setFilter] = useState('All Entries');
  const [myEditions, setMyEditions] = useState<ZineMetadata[]>([]);
  const [isLoadingEditions, setIsLoadingEditions] = useState(false);

  useEffect(() => {
    if (user && filter === 'My Editions') {
      setIsLoadingEditions(true);
      fetchUserZines(user.uid).then(zines => {
        // Only show public zines in the Press view
        setMyEditions(zines.filter(z => z.isPublic));
        setIsLoadingEditions(false);
      });
    }
  }, [user, filter]);

  const togglePublicStatus = async (zineId: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'zines', zineId), { isPublic: !currentStatus });
      setMyEditions(prev => prev.filter(z => z.id !== zineId)); // Remove from view if unpublished
    } catch (e) {
      console.error("Failed to update public status", e);
    }
  };

  const filteredItems = useMemo(() => {
      if (filter === 'All Entries') return PRESS_ITEMS;
      if (filter === 'Protocols') return PRESS_ITEMS.filter(i => i.tag === 'Protocol' || i.tag === 'Theory');
      if (filter === 'Case Studies') return PRESS_ITEMS.filter(i => i.tag === 'Case Study' || i.tag === 'Professional');
      if (filter === 'My Editions') return []; // Handled separately
      return PRESS_ITEMS;
  }, [filter]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar relative bg-[#F9F8F6] dark:bg-[#050505] transition-colors duration-1000 text-nous-text dark:text-white font-sans">
      
      {/* BACKGROUND GRID LINES */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px)', backgroundSize: '25% 100%' }} />

      {/* HEADER SECTION */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-[#F9F8F6]/90 dark:bg-[#050505]/90 backdrop-blur-sm sticky top-0 z-20">
         <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-6">
               <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-500">
                  <Globe size={16} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Strategic Demonstration</span>
               </div>
               <h1 className="font-serif text-7xl md:text-9xl italic tracking-tighter leading-[0.8]">The Press.</h1>
               <p className="font-serif italic text-2xl md:text-3xl text-stone-500 dark:text-stone-400 max-w-2xl leading-tight pt-2">
                  Insight into the <span className="border-b border-emerald-500 text-nous-text dark:text-white">Mimi Workflow</span> for creators. An index of sovereign aesthetics.
               </p>
            </div>
            
            <div className="flex flex-col items-end gap-1 text-right">
               <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">Current Edition</span>
               <span className="font-serif text-4xl">Oct — 24</span>
            </div>
         </div>

         {/* FILTER BAR */}
         <div className="flex flex-wrap justify-between items-center gap-4 px-6 md:px-12 py-4 border-t border-stone-200 dark:border-stone-800 bg-[#F9F8F6] dark:bg-[#050505]">
            <div className="flex gap-8 overflow-x-auto no-scrollbar">
                {['All Entries', 'Protocols', 'Case Studies', 'My Editions'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${filter === f ? 'text-emerald-600 dark:text-emerald-400 border-b border-emerald-500 pb-0.5' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-50 hover:opacity-100'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="font-mono text-[10px] text-stone-400 hidden md:block opacity-50">
                Displaying {filter === 'My Editions' ? myEditions.length : filteredItems.length} Records
            </div>
         </div>
      </header>

      {/* GRID LAYOUT */}
      <div className="max-w-[1920px] mx-auto border-l border-stone-200 dark:border-stone-800">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {filter === 'My Editions' ? (
               isLoadingEditions ? (
                  <div className="col-span-full p-12 text-center text-stone-400 font-mono text-xs uppercase tracking-widest">Loading Editions...</div>
               ) : myEditions.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-stone-400 font-mono text-xs uppercase tracking-widest">No public editions found. Publish from the Archive.</div>
               ) : (
                  myEditions.map((zine, i) => (
                     <motion.article 
                        key={zine.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative border-r border-b border-stone-200 dark:border-stone-800 min-h-[500px] flex flex-col justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors duration-500 overflow-hidden"
                     >
                        <div className="p-6 h-full flex flex-col cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'reveal_artifact', detail_id: zine.id }))}>
                            {/* TOP META */}
                            <div className="flex justify-between items-start mb-6 font-mono text-[10px] tracking-widest uppercase opacity-60">
                               <span>ID: {zine.id.slice(-6)}</span>
                               <span>{new Date(zine.timestamp).toLocaleDateString()}</span>
                            </div>

                            {/* VISUAL PLACEHOLDER (COVER) */}
                            <div className="aspect-[3/4] w-full mb-6 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-700 bg-stone-100 dark:bg-stone-900">
                               {zine.coverImageUrl ? (
                                  <img src={zine.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                               ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                     <span className="font-serif italic text-6xl text-stone-300 dark:text-stone-700 pr-4 select-none pointer-events-none">
                                         {zine.title.substring(0, 2).toUpperCase()}
                                     </span>
                                  </div>
                               )}
                               <div className="absolute top-4 left-4">
                                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/90 bg-black/50 backdrop-blur-md px-2 py-1">{zine.tone}</span>
                               </div>
                            </div>

                            <div className="mt-auto">
                                <h3 className="font-serif text-4xl leading-[0.9] mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                   {zine.title}
                                </h3>
                                <p className="font-mono text-[10px] uppercase tracking-wider opacity-70 mb-6 line-clamp-2">{zine.content.poetic_provocation}</p>
                            </div>
                        </div>

                        <div className="p-6 pt-0 border-t border-transparent group-hover:border-stone-200 dark:group-hover:border-stone-800 transition-colors flex justify-between items-center">
                           <div className="flex items-center gap-4 text-stone-400">
                              <span className="flex items-center gap-1 font-mono text-[9px]"><Eye size={12} /> {zine.likes || 0}</span>
                           </div>
                           <button 
                              onClick={(e) => { e.stopPropagation(); togglePublicStatus(zine.id, zine.isPublic); }}
                              className="font-mono text-[9px] uppercase border border-red-500/30 text-red-500 hover:bg-red-500/10 px-2 py-1 transition-colors flex items-center gap-2"
                           >
                              <Lock size={10} /> Unpublish
                           </button>
                        </div>
                     </motion.article>
                  ))
               )
            ) : (
               filteredItems.map((item, i) => (
                  <motion.article 
                     key={item.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     onClick={() => {
                        window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'click' } }));
                        setActiveArticle(item);
                     }}
                     className="group relative border-r border-b border-stone-200 dark:border-stone-800 min-h-[500px] flex flex-col justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors duration-500 cursor-pointer overflow-hidden"
                  >
                     <div className="p-6 h-full flex flex-col">
                         {/* TOP META */}
                         <div className="flex justify-between items-start mb-6 font-mono text-[10px] tracking-widest uppercase opacity-60">
                            <span>ID: {item.ref}</span>
                            <span>{item.timestamp}</span>
                         </div>

                         {/* VISUAL PLACEHOLDER (COLOR SWATCH) */}
                         <div className="aspect-[3/4] w-full mb-6 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-700" style={{ backgroundColor: item.hex }}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                            
                            <div className="absolute inset-0 flex items-center justify-center">
                               <span className="font-serif italic text-6xl text-white/10 mix-blend-overlay pr-4 select-none pointer-events-none">
                                   {item.ref.split('.')[0]}
                               </span>
                            </div>

                            <div className="absolute top-4 left-4">
                               <span className="font-mono text-[8px] uppercase tracking-widest text-white/90 bg-black/10 backdrop-blur-md px-2 py-1">{item.tag}</span>
                            </div>
                         </div>

                         <div className="mt-auto">
                             <h3 className="font-serif text-4xl leading-[0.9] mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {item.brand}
                             </h3>
                             <p className="font-mono text-[10px] uppercase tracking-wider opacity-70 mb-6">{item.headline}</p>
                         </div>
                     </div>

                     <div className="p-6 pt-0 border-t border-transparent group-hover:border-stone-200 dark:group-hover:border-stone-800 transition-colors">
                        <p className="font-serif italic text-lg text-stone-500 dark:text-stone-400 group-hover:text-nous-text dark:group-hover:text-white transition-colors leading-tight">
                           {item.subtitle}
                        </p>
                        <div className="mt-6 flex items-center justify-between">
                           <span className="font-mono text-[9px] uppercase border border-nous-text dark:border-white px-2 py-1">Read Entry</span>
                           <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                     </div>
                  </motion.article>
               ))
            )}
            
            {/* FILLER CELLS (For Grid Aesthetic) */}
            {Array.from({ length: Math.max(0, 4 - ((filter === 'My Editions' ? myEditions.length : filteredItems.length) % 4 === 0 ? 4 : (filter === 'My Editions' ? myEditions.length : filteredItems.length) % 4)) }).map((_, i) => (
                <div key={`filler-${i}`} className="hidden lg:block border-r border-b border-stone-200 dark:border-stone-800 min-h-[500px] bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-[0.03]" />
            ))}
         </div>
      </div>

      {/* FOOTER METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 border-b border-stone-200 dark:border-stone-800 bg-[#F9F8F6]/50 dark:bg-[#050505]/50">
         {[
            { label: 'The Muse', type: 'Visual Archive', ref: '01.99' },
            { label: 'Texture Packs', type: 'Resource Drop', ref: '02.4B' },
            { label: 'Editorial 09', type: 'Opinion Piece', ref: '05.AX' },
            { label: 'Sovereign', type: 'Concept', ref: '88.00' },
            { label: 'Interviews', type: 'People', ref: '12.12' },
            { label: 'Manifesto', type: 'Core Value', ref: 'XX.XX' }
         ].map((item, i) => (
            <div key={i} className="col-span-1 border-r border-stone-200 dark:border-stone-800 p-6 h-32 flex flex-col justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-default group">
               <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Ref: {item.ref}</span>
               <div>
                  <p className="font-serif text-xl italic group-hover:underline decoration-emerald-500 decoration-1 underline-offset-4">{item.label}</p>
                  <p className="text-[9px] font-mono mt-1 opacity-60 uppercase tracking-widest">{item.type}</p>
               </div>
            </div>
         ))}
      </div>

      <AnimatePresence>
        {activeArticle && (
          <EditorialSpread article={activeArticle} onClose={() => setActiveArticle(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
