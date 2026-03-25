import React from 'react';

interface MenuItem {
 label: string;
 viewMode: string;
 note: string;
}

interface TopNavigationProps {
 currentViewMode: string;
 setViewMode: (mode: string) => void;
 onOpenCommandDrawer: () => void;
}

const MENU_STRUCTURE = [
 { section: 'Studio', items: [
 { mode: 'studio', label: 'Work Table', note: 'The Artifact Engine' },
 { mode: 'tailor', label: 'Tailor Tools', note: 'Materiality & Layout' },
 { mode: 'dossier', label: 'Presets', note: 'Historical Templates' }
 ]},
 { section: 'Signature', items: [
 { mode: 'signature', label: 'Dashboard', note: 'Identity & Analysis' },
 { mode: 'ward', label: 'The Ward', note: 'Calibration Ritual' },
 { mode: 'profile', label: 'Profile', note: 'Settings & Keys' }
 ]},
 { section: 'Archive', items: [
 { mode: 'archival', label: 'Library', note: 'Creative Memory' },
 { mode: 'the-lens', label: 'The Lens', note: 'Spatial Aesthetic Capture' },
 { mode: 'darkroom', label: 'Darkroom', note: 'Unprocessed Fragments' }
 ]},
 { section: 'Threads', items: [
 { mode: 'narrative-threads', label: 'Narrative Pathing', note: 'Semantic Paths' },
 { mode: 'scry', label: 'Trace & Scry', note: 'Aesthetic Drift Prediction' }
 ]},
 { section: 'Floor', items: [
 { mode: 'nebula', label: 'Resonance Feed', note: 'The Stand' },
 { mode: 'press', label: 'The Edit', note: 'Cultural Intelligence' },
 { mode: 'proscenium', label: 'Proscenium', note: 'Manifested Visions' }
 ]},
 { section: 'System', items: [
 { mode: 'help', label: 'Codex', note: 'Documentation' }
 ]}
];

export const TopNavigation: React.FC<TopNavigationProps> = ({ currentViewMode, setViewMode, onOpenCommandDrawer }) => {
 return (
 <nav className="flex items-center gap-6">
 {MENU_STRUCTURE.map((section, index) => (
 <React.Fragment key={section.section}>
 <div className="relative group">
 <button className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
 {section.section}
 </button>
 <div className="absolute top-full left-0 pt-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-[5000]">
 <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex flex-col gap-2">
 {section.items.map((item) => (
 <button
 key={item.mode}
 onClick={() => setViewMode(item.mode)}
 className={`text-[10px] uppercase tracking-[0.1em] text-left hover:text-stone-600 dark:hover:text-stone-400 transition-colors ${currentViewMode === item.mode ? 'text-stone-600 dark:text-stone-400 font-bold' : 'text-stone-600 dark:text-stone-400'}`}
 >
 {item.label}
 </button>
 ))}
 </div>
 </div>
 </div>
 {index < MENU_STRUCTURE.length - 1 && (
 <span className="text-stone-300 dark:text-stone-700">/</span>
 )}
 </React.Fragment>
 ))}
 <button 
 onClick={onOpenCommandDrawer}
 className="font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-stone-600 dark:hover:text-stone-400 transition-colors"
 >
 Command
 </button>
 </nav>
 );
};
