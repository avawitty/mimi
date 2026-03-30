import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
 label: string;
 viewMode: string;
}

const MENU_STRUCTURE: Record<string, MenuItem[]> = {
 Studio: [
 { label: 'Work Table', viewMode: 'studio' },
 { label: 'Tailor Tools', viewMode: 'tailor' },
 { label: 'Projects', viewMode: 'dossier' },
 ],
 Signature: [
 { label: 'Dashboard', viewMode: 'signature' },
 { label: 'The Ward', viewMode: 'ward' },
 { label: 'Profile', viewMode: 'profile' },
 ],
 Archive: [
 { label: 'Library', viewMode: 'archival' },
 { label: 'The Lens', viewMode: 'the-lens' },
 { label: 'Darkroom', viewMode: 'darkroom' },
 ],
 Threads: [
 { label: 'Narrative Pathing', viewMode: 'threads' },
 { label: 'Narrative Threads', viewMode: 'narrative-threads' },
 { label: 'Taste Graph', viewMode: 'taste-graph' },
 { label: 'Constellations', viewMode: 'taste-constellation' },
 { label: 'Trace & Scry', viewMode: 'scry' },
 ],
 Floor: [
 { label: 'Resonance Feed', viewMode: 'nebula' },
 { label: 'The Edit', viewMode: 'press' },
 { label: 'Proscenium', viewMode: 'proscenium' },
 ],
 System: [
 { label: 'Codex', viewMode: 'codex' },
 { label: 'Observation Engine', viewMode: 'thimble' },
 { label: 'Signal Index', viewMode: 'signals' },
 ],
};

interface NavigationMenuProps {
 currentViewMode: string;
 setViewMode: (mode: string) => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentViewMode, setViewMode }) => {
 const [hoveredItem, setHoveredItem] = useState<string | null>(null);

 return (
 <div className="flex items-center gap-8">
 {Object.entries(MENU_STRUCTURE).map(([category, items]) => (
 <div 
 key={category}
 className="relative group"
 onMouseEnter={() => setHoveredItem(category)}
 onMouseLeave={() => setHoveredItem(null)}
 >
 <button className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-nous-subtle hover:text-nous-text transition-colors">
 {category}
 </button>

 <AnimatePresence>
 {hoveredItem === category && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="absolute top-full left-0 pt-4 w-48 z-[5000]"
 >
 <div className="bg-nous-base border border-nous-border p-4 flex flex-col gap-2">
 {items.map((item) => (
 <button
 key={item.viewMode}
 onClick={() => setViewMode(item.viewMode)}
 className={`text-[10px] uppercase tracking-[0.1em] text-left hover:text-nous-subtle transition-colors ${currentViewMode === item.viewMode ? 'text-white font-bold' : 'text-nous-subtle'}`}
 >
 {item.label}
 </button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 ))}
 </div>
 );
};
