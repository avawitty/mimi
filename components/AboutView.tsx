
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, FolderOpen, ArrowRight, ArrowLeft, Loader2, 
  Briefcase, Layers, Target, CheckCircle2, 
  LayoutGrid, Archive, BrainCircuit, FileText
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { generateProposalFromFolder } from '../services/proposalOrchestrator';
import { ProposalWorkspace } from './ProposalWorkspace';
import { Proposal, PocketItem } from '../types';
import { fetchPocketItems } from '../services/firebase';

const PROPOSAL_PRESETS = [
  { id: 'creative_brief', label: 'Creative Brief', desc: 'Campaign ideation, visual language, mood references.' },
  { id: 'market_analysis', label: 'Market Analysis', desc: 'Competitor breakdown, trend synthesis, gap analysis.' },
  { id: 'product_proposal', label: 'Product Proposal', desc: 'Problem statement, user archetypes, solution architecture.' },
  { id: 'campaign_strategy', label: 'Campaign Strategy', desc: 'Audience targeting, content pillars, rollout calendar.' },
  { id: 'portfolio_case', label: 'Portfolio Case Study', desc: 'Problem, approach, process documentation, results.' },
  { id: 'reflection', label: 'Reflection Report', desc: 'Project audit, pattern analysis, forward alignment.' }
];

type ProposalViewState = 'ENTRY' | 'BINDING' | 'ASSEMBLY' | 'REFINEMENT';

export const ProposalView: React.FC<{ folderData?: any; onClose?: () => void }> = ({ folderData, onClose }) => {
  const { user, profile } = useUser();
  
  // -- STATE MACHINE --
  const [viewState, setViewState] = useState<ProposalViewState>(folderData ? 'BINDING' : 'ENTRY');
  
  // -- DATA --
  const [availableFolders, setAvailableFolders] = useState<PocketItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderData?.id || null);
  const [selectedPreset, setSelectedPreset] = useState('creative_brief');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  
  // -- LOADING STATES --
  const [loadingText, setLoadingText] = useState('');

  // Initial Load: Fetch Folders if in Entry Mode
  useEffect(() => {
    if (viewState === 'ENTRY' && user?.uid) {
        const loadFolders = async () => {
            try {
                const items = await fetchPocketItems(user.uid);
                setAvailableFolders(items.filter(i => i.type === 'moodboard'));
            } catch(e) { console.error(e); }
        };
        loadFolders();
    }
  }, [viewState, user]);

  // Binding: Determine Folder ID if passed via props
  useEffect(() => {
      if (viewState === 'BINDING' && folderData) {
          // Data is already bound, ready for configuration
          if (!selectedFolderId && folderData.id) {
              setSelectedFolderId(folderData.id);
          }
      }
  }, [viewState, folderData]);

  const handleClose = () => {
    if (onClose) onClose();
    else window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'studio' }));
  };

  const handleSelectFolder = (id: string) => {
      setSelectedFolderId(id);
      setViewState('BINDING');
  };

  const handleStartAssembly = async () => {
      if (!selectedFolderId || !user?.uid) return;
      
      setViewState('ASSEMBLY');
      setLoadingText('Accessing Folder Registry...');
      
      try {
          // Simulate steps for UX
          await new Promise(r => setTimeout(r, 800));
          setLoadingText('Auditing Artifacts...');
          await new Promise(r => setTimeout(r, 800));
          setLoadingText('Consulting Oracle...');

          const newProposal = await generateProposalFromFolder({
              userId: user.uid,
              folderId: selectedFolderId,
              selectedPreset,
              selectedModules: [], // Default all for now
              profile
          });

          setProposal(newProposal);
          setViewState('REFINEMENT');
      } catch (e) {
          console.error("Assembly Failed:", e);
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Strategy Assembly Failed.", type: 'error' } }));
          setViewState('ENTRY');
      }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-[#EBE9E4] dark:bg-[#050505] flex flex-col transition-colors duration-1000 overflow-hidden">
        
        {/* REFINEMENT LAYER (Workspace) */}
        {viewState === 'REFINEMENT' && proposal && (
            <ProposalWorkspace 
                proposal={proposal} 
                onUpdateProposal={setProposal} 
                onClose={handleClose} 
            />
        )}

        {/* LOADING STATES (Assembly) */}
        {viewState === 'ASSEMBLY' && (
            <div className="absolute inset-0 z-[7000] bg-stone-950 flex flex-col items-center justify-center gap-12">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                    <BrainCircuit size={64} className="text-white relative z-10 animate-pulse" />
                </div>
                <div className="space-y-4 text-center">
                    <h3 className="font-serif text-3xl italic text-white tracking-tighter">Assisted Assembly.</h3>
                    <p className="font-sans text-[10px] uppercase tracking-[0.4em] font-black text-emerald-500 animate-pulse">
                        {loadingText}
                    </p>
                </div>
            </div>
        )}

        {/* BINDING STATE (Configuration) */}
        {viewState === 'BINDING' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
                <button onClick={() => setViewState('ENTRY')} className="absolute top-8 left-8 p-3 text-stone-400 hover:text-stone-600 dark:hover:text-white"><ArrowLeft size={20}/></button>
                
                <div className="w-full max-w-4xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm shadow-2xl p-10 md:p-16 space-y-12">
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-emerald-500">
                            <Layers size={20} />
                            <span className="font-sans text-[9px] uppercase tracking-[0.5em] font-black italic">Material Binding</span>
                        </div>
                        <h2 className="font-serif text-4xl md:text-5xl italic tracking-tighter text-nous-text dark:text-white">Configure Output.</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 border-b border-stone-100 dark:border-stone-800 pb-2 block">Strategic Logic</span>
                            <div className="space-y-3">
                                {PROPOSAL_PRESETS.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => setSelectedPreset(p.id)}
                                        className={`w-full text-left p-4 rounded-sm border transition-all ${selectedPreset === p.id ? 'bg-nous-text dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-transparent border-stone-100 dark:border-stone-800 text-stone-500 hover:border-stone-300'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-serif italic text-lg leading-none">{p.label}</span>
                                            {selectedPreset === p.id && <CheckCircle2 size={14} />}
                                        </div>
                                        <p className="font-sans text-[7px] uppercase tracking-wide opacity-70">{p.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex flex-col justify-between space-y-8">
                            <div className="p-8 bg-stone-50 dark:bg-black/40 border border-stone-100 dark:border-stone-800 rounded-sm space-y-6">
                                <span className="font-sans text-[9px] uppercase tracking-widest font-black text-stone-400">Target Source</span>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
                                        <FolderOpen size={20} />
                                    </div>
                                    <div>
                                        <p className="font-serif italic text-xl text-nous-text dark:text-white">
                                            {folderData?.name || availableFolders.find(f => f.id === selectedFolderId)?.content.name || 'Selected Folder'}
                                        </p>
                                        <p className="font-sans text-[8px] uppercase tracking-widest text-emerald-500 font-black">Source Locked</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleStartAssembly} className="w-full py-6 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[10px] uppercase tracking-[0.5em] font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                                <Sparkles size={16} /> Execute Assembly
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}

        {/* ENTRY STATE (Selection) */}
        {viewState === 'ENTRY' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
                <button onClick={handleClose} className="absolute top-8 left-8 p-3 text-stone-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                
                <div className="text-center space-y-6 mb-16">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                        <Briefcase size={12} />
                        <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black">Strategic Suite</span>
                    </div>
                    <h1 className="font-serif text-6xl md:text-8xl italic tracking-tighter text-nous-text dark:text-white leading-none">The Proposal.</h1>
                    <p className="font-serif italic text-xl md:text-2xl text-stone-500 dark:text-stone-400 leading-relaxed max-w-xl mx-auto">
                        Transmute your archival debris into defensible strategic artifacts. Select a source folder to begin.
                    </p>
                </div>

                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableFolders.map(folder => (
                        <button 
                            key={folder.id} 
                            onClick={() => handleSelectFolder(folder.id)}
                            className="group p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-sm hover:border-emerald-500 hover:shadow-xl transition-all text-left flex flex-col gap-6"
                        >
                            <div className="flex justify-between items-start">
                                <FolderOpen size={24} className="text-stone-300 group-hover:text-emerald-500 transition-colors" />
                                <ArrowRight size={16} className="text-stone-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </div>
                            <div>
                                <h4 className="font-serif italic text-2xl text-nous-text dark:text-white line-clamp-1">{folder.content.name}</h4>
                                <span className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">{folder.content.itemIds?.length || 0} Artifacts</span>
                            </div>
                        </button>
                    ))}
                    {availableFolders.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-stone-300 dark:border-stone-800 rounded-sm">
                            <Archive size={48} className="mx-auto mb-4" />
                            <p className="font-serif italic text-2xl">No Stacks Found in Registry.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
    </div>
  );
};
