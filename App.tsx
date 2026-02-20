
// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ToneTag, ZineMetadata, DriftEvent, MediaFile } from './types';
import { createZine } from './services/geminiService';
import { saveZineToProfile, fetchZineById, auth, isCaptiveInWebview } from './services/firebase';
import { InputStudio } from './components/InputStudio';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ElevatorLoader } from './components/ElevatorLoader';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AgentProvider, useAgents } from './contexts/AgentContext';
import { ArchiveCloudNebula } from './components/ArchiveCloudNebula';
import { ArchivalView } from './components/ArchivalView';
import { UserProfileView } from './components/UserProfileView';
import { MesopicLens } from './components/MesopicLens'; 
import { ThePress } from './components/ThePress';
import { SanctuaryView } from './components/SanctuaryView';
import { TailorView } from './components/TailorView';
import { ScryView } from './components/ScryView';
import { DarkroomView } from './components/DarkroomView';
import { ApiKeyShield } from './components/ApiKeyShield';
import { ProposalView } from './components/AboutView'; 
import { CaptiveSentinel } from './components/CaptiveSentinel';
import { TheWard } from './components/TheWard'; 
import { PatronMintView } from './components/PatronMintView';
import { DossierView } from './components/DossierView';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LayoutGrid, User, Menu, X, Newspaper, LogOut, ShieldAlert, Zap, Camera, Key, Radio, Activity as ActivityIcon, Archive, Moon, Sun, Scissors, FlaskConical, Eye, Radar, Compass, Info, Cpu, ShieldCheck, Briefcase } from 'lucide-react';

// ... (Rest of existing subcomponents: BinderRing, SidebarBtn, MobileMenu, DatabaseVoid) ...
// BINDER RING COMPONENT
const BinderRing = ({ className }: { className?: string }) => (
  <div className={`absolute right-[-10px] w-5 h-5 rounded-full bg-[#151412] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9),1px_1px_1px_rgba(255,255,255,0.1)] z-50 flex items-center justify-center ${className}`}>
    <div className="w-8 h-2.5 bg-gradient-to-r from-stone-600 via-stone-300 to-stone-600 rounded-sm shadow-lg transform translate-x-1" />
  </div>
);

const SidebarBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-5 px-6 py-3 transition-all duration-300 group/btn relative overflow-hidden ${active ? 'text-white' : 'text-stone-500 hover:text-stone-300'}`}
  >
    <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-white transition-all duration-300 ${active ? 'opacity-100 h-full' : 'opacity-0 h-0 group-hover/btn:h-full group-hover/btn:opacity-50'}`} />
    
    <div className={`shrink-0 transition-transform duration-300 ${active ? 'scale-110 text-white' : 'group-hover/btn:scale-110'}`}>
      {React.cloneElement(icon as React.ReactElement, { strokeWidth: 1.5, size: 18 })}
    </div>
    
    <span className={`font-sans text-[9px] uppercase tracking-[0.25em] font-bold opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap delay-75 ${active ? 'text-white' : ''}`}>
      {label}
    </span>
  </button>
);

const MobileMenu: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  viewMode: string; 
  setViewMode: (mode: string) => void;
  logout: () => void;
}> = ({ isOpen, onClose, viewMode, setViewMode, logout }) => {
  const handleNav = (mode: string) => { setViewMode(mode); onClose(); };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: '-100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '-100%' }}
          className="fixed inset-0 z-[10000] bg-stone-950 flex flex-col p-8 overflow-y-auto no-scrollbar text-white"
        >
          <div className="flex justify-between items-center mb-12">
             <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-white" />
                <h2 className="font-header italic text-4xl">Mimi.</h2>
             </div>
             <button onClick={onClose} className="p-2 text-stone-400"><X size={24}/></button>
          </div>
          <div className="space-y-8 flex-1">
             <div className="space-y-4">
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] font-black text-stone-500 block border-b border-stone-800 pb-2">Creation</span>
                <button onClick={() => handleNav('studio')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-emerald-400 transition-colors">Studio</button>
                <button onClick={() => handleNav('dossier')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-emerald-400 transition-colors">Projects</button>
                <button onClick={() => handleNav('nebula')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-emerald-400 transition-colors">The Stand</button>
                <button onClick={() => handleNav('scry')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-emerald-400 transition-colors">Scry</button>
             </div>
             <div className="space-y-4">
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] font-black text-stone-500 block border-b border-stone-800 pb-2">Alchemy</span>
                <button onClick={() => handleNav('tailor')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-indigo-400 transition-colors">Tailor</button>
                {/* <button onClick={() => handleNav('ward')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-indigo-400 transition-colors">The Ward</button> */}
                <button onClick={() => handleNav('archival')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-indigo-400 transition-colors">Archive</button>
                <button onClick={() => handleNav('mesopic')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-indigo-400 transition-colors">Mesopic</button>
                <button onClick={() => handleNav('darkroom')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-indigo-400 transition-colors">Darkroom</button>
             </div>
             <div className="space-y-4">
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] font-black text-stone-500 block border-b border-stone-800 pb-2">Discover</span>
                <button onClick={() => handleNav('about')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-amber-400 transition-colors">Proposal</button>
                <button onClick={() => handleNav('press')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-amber-400 transition-colors">Press</button>
                <button onClick={() => handleNav('profile')} className="w-full text-left font-serif italic text-3xl py-1 hover:text-amber-400 transition-colors">Profile</button>
             </div>
          </div>
          <div className="pt-8 border-t border-stone-800">
             <button onClick={() => { logout(); onClose(); }} className="w-full text-center py-4 text-red-400 font-sans text-[9px] uppercase tracking-[0.3em] font-black border border-red-900/30 rounded-sm">De-Anchor Protocol</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DatabaseVoid: React.FC = () => (
  <div className="fixed inset-0 z-[50000] bg-stone-950 flex flex-col items-center justify-center p-8 text-center space-y-12">
    <div className="space-y-6 max-w-lg">
      <div className="relative mx-auto w-24 h-24">
         <div className="absolute inset-0 border-t-2 border-red-500 rounded-full animate-[spin_4s_linear_infinite]" />
         <div className="absolute inset-0 flex items-center justify-center">
            <Radio size={32} className="text-red-500 animate-pulse" />
         </div>
      </div>
      <div className="space-y-3">
         <h1 className="font-serif text-5xl italic tracking-tighter text-white">Registry Void.</h1>
         <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-red-500 font-black">Connection Failure</p>
      </div>
      <p className="font-serif italic text-xl text-stone-400 leading-relaxed text-balance">
         The app cannot locate the database. I have updated the configuration to look for 'mimizine'.
      </p>
    </div>

    <button onClick={() => window.location.reload()} className="px-12 py-5 bg-red-600 text-white rounded-full font-sans text-[10px] uppercase tracking-[0.4em] font-black shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:bg-red-500 hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] transition-all flex items-center gap-4 animate-pulse">
       <ActivityIcon size={16} /> Force Re-Initialization
    </button>
  </div>
);

const AppContent: React.FC = () => {
  const { user, profile, updateProfile, loading: authLoading, logout, setOracleStatus, systemStatus, activePersona, isDatabaseMissing } = useUser();
  const { currentPalette, toggleMode } = useTheme();
  const { activeAgents } = useAgents();
  
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [viewMode, setViewMode] = useState<string>('studio');
  const [zineMetadata, setZineMetadata] = useState<ZineMetadata | null>(null);
  const [isDeepRefraction, setIsDeepRefraction] = useState(false);
  const [threadValue, setThreadValue] = useState<string>('');
  const [threadMedia, setThreadMedia] = useState<MediaFile[]>([]); 
  const [showCaptiveSentinel, setShowCaptiveSentinel] = useState(false);
  const [isHeaderTranslucent, setIsHeaderTranslucent] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tailorOverrides, setTailorOverrides] = useState<any>(null);
  const [isPatronMint, setIsPatronMint] = useState(false);
  const [proposalContext, setProposalContext] = useState<any>(null);

  useEffect(() => {
    if (isCaptiveInWebview()) setShowCaptiveSentinel(true);
    
    // CHECK FOR PATRON MINT URL
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('view') === 'patron_mint') {
        setIsPatronMint(true);
        // Clear query param to keep URL clean
        window.history.replaceState({}, document.title, "/");
    }

    const handleChangeView = async (e: any) => {
      if (e.detail === 'reveal_artifact' && e.detail_id) {
         try {
           const zine = await fetchZineById(e.detail_id);
           if (zine) { setZineMetadata(zine); setAppState(AppState.REVEALED); }
         } catch(err) { setAppState(AppState.IDLE); }
         return;
      }
      if (e.detail) { 
        setViewMode(e.detail); setZineMetadata(null); setAppState(AppState.IDLE);
        if (e.detail === 'studio' && e.detail_data) {
            setThreadValue(e.detail_data.context || e.detail_data);
            if (e.detail_data.initialMedia) {
                setThreadMedia(e.detail_data.initialMedia);
            }
        }
        if (e.detail === 'about' && e.detail_data?.folder) {
            setProposalContext(e.detail_data.folder);
        }
      }
    };
    window.addEventListener('mimi:change_view', handleChangeView);
    return () => window.removeEventListener('mimi:change_view', handleChangeView);
  }, []);

  const handleRefine = useCallback(async (text, media, tone, opts) => {
    setIsDeepRefraction(!!opts.deepThinking);
    setAppState(AppState.THINKING);
    
    const personaKey = activePersona?.apiKey ? activePersona.apiKey : undefined;

    try {
      const result = await createZine(text, media, tone, profile, opts, personaKey);
      const targetUid = profile?.uid || user?.uid || 'ghost';
      const id = await saveZineToProfile(targetUid, profile?.handle || 'Ghost', profile?.photoURL, result.content, tone, undefined, opts.deepThinking, opts.isPublic, opts.isLite, media, text);
      setZineMetadata({ 
          id, userId: targetUid, userHandle: profile?.handle || 'Ghost', title: result.content.title, tone, timestamp: Date.now(), likes: 0, content: result.content,
          artifacts: media, 
          originalInput: text 
      });
      setAppState(AppState.REVEALED);
    } catch (e) { 
        console.error("Zine Creation Failed:", e);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "Oracle Disconnected. " + (e.message || "Unknown Error"), type: 'error' } 
        }));
        setAppState(AppState.IDLE); 
    }
  }, [user, profile, activePersona]);

  if (isDatabaseMissing) return <DatabaseVoid />;
  if (authLoading) return <ElevatorLoader />;

  if (isPatronMint) {
      return <PatronMintView onExit={() => setIsPatronMint(false)} />;
  }

  return (
    <div className="h-full w-full bg-transparent dark:bg-stone-950 transition-colors duration-500 flex">
      <AnimatePresence>{showCaptiveSentinel && <CaptiveSentinel onClose={() => setShowCaptiveSentinel(false)} />}</AnimatePresence>
      
      {!zineMetadata && (
        <aside className="hidden md:flex flex-col h-full shrink-0 z-[2000] relative group/sidebar w-[88px] hover:w-72 transition-all duration-500 bg-[#1c1917] shadow-2xl">
            <BinderRing className="top-[15%]" />
            <BinderRing className="top-[50%]" />
            <BinderRing className="top-[85%]" />

            <div className="flex-1 flex flex-col pt-12 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[88px] flex items-center justify-center pointer-events-none group-hover/sidebar:opacity-0 transition-opacity duration-300">
                    <h1 className="text-stone-600 font-[Cormorant] font-light italic text-4xl tracking-widest whitespace-nowrap transform -rotate-90 origin-center">
                        Mimi Zine
                    </h1>
                </div>

                <div className="flex-1 flex flex-col opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-500 delay-100 w-72 px-4 pb-8 overflow-y-auto no-scrollbar">
                    <div className="mb-10 pl-6 pt-2">
                        <h1 className="text-white font-[Cormorant] font-light italic text-4xl tracking-tighter">Mimi.</h1>
                        <p className="text-stone-500 font-sans text-[9px] uppercase tracking-widest font-black mt-1">Sovereign Registry</p>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-1">
                            <div className="px-6 py-2"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-600">Creation</span></div>
                            <SidebarBtn active={viewMode === 'studio'} onClick={() => setViewMode('studio')} icon={<Sparkles />} label="Studio" />
                            <SidebarBtn active={viewMode === 'dossier'} onClick={() => setViewMode('dossier')} icon={<Briefcase />} label="Projects" />
                            <SidebarBtn active={viewMode === 'nebula'} onClick={() => setViewMode('nebula')} icon={<LayoutGrid />} label="Stand" />
                            <SidebarBtn active={viewMode === 'scry'} onClick={() => setViewMode('scry')} icon={<Compass />} label="Scry" />
                        </div>

                        <div className="space-y-1">
                            <div className="px-6 py-2"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-600">Archive</span></div>
                            <SidebarBtn active={viewMode === 'archival'} onClick={() => setViewMode('archival')} icon={<Archive />} label="Archive" />
                            <SidebarBtn active={viewMode === 'mesopic'} onClick={() => setViewMode('mesopic')} icon={<Camera />} label="Mesopic" />
                            <SidebarBtn active={viewMode === 'darkroom'} onClick={() => setViewMode('darkroom')} icon={<FlaskConical />} label="Darkroom" />
                        </div>

                        <div className="space-y-1">
                            <div className="px-6 py-2"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-600">Alchemy</span></div>
                            <SidebarBtn active={viewMode === 'tailor'} onClick={() => setViewMode('tailor')} icon={<Scissors />} label="Tailor" />
                            {/* <SidebarBtn active={viewMode === 'ward'} onClick={() => setViewMode('ward')} icon={<ShieldCheck />} label="The Ward" /> */}
                            <SidebarBtn active={viewMode === 'profile'} onClick={() => setViewMode('profile')} icon={<User />} label="Profile" />
                        </div>

                        <div className="space-y-1">
                            <div className="px-6 py-2"><span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-600">Discover</span></div>
                            <SidebarBtn active={viewMode === 'about'} onClick={() => setViewMode('about')} icon={<Info />} label="Proposal" />
                            <SidebarBtn active={viewMode === 'press'} onClick={() => setViewMode('press')} icon={<Newspaper />} label="Press" />
                        </div>
                    </div>

                    <div className="mt-auto pt-8">
                        <SidebarBtn active={false} onClick={logout} icon={<LogOut className="text-red-900" />} label="De-Anchor" />
                    </div>
                </div>
                
                <div className="absolute bottom-12 left-0 w-[88px] flex flex-col items-center gap-4 group-hover/sidebar:opacity-0 transition-opacity">
                    <div className={`w-1.5 h-1.5 rounded-full ${systemStatus.oracle === 'ready' ? 'bg-emerald-600' : 'bg-red-900'}`} />
                    {activeAgents.length > 0 && <Cpu size={12} className="text-indigo-900 animate-pulse" />}
                </div>
            </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-nous-base dark:bg-stone-950 transition-colors duration-500">
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-20 mix-blend-multiply dark:mix-blend-overlay" />

        <ApiKeyShield />
        <button onClick={toggleMode} className="fixed top-6 right-6 md:right-12 z-[5000] p-3 rounded-full bg-stone-100/50 dark:bg-stone-900/50 text-stone-400 hover:text-nous-text dark:hover:text-white transition-all backdrop-blur-sm border border-stone-200/20">
           {currentPalette?.isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {!zineMetadata && <button onClick={() => setMobileMenuOpen(true)} className="md:hidden fixed top-6 left-6 z-[5001] p-3 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-nous-text dark:text-white border border-stone-200 shadow-lg"><Menu size={20} /></button>}
        
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} viewMode={viewMode} setViewMode={setViewMode} logout={logout} />
        
        <AnimatePresence>
          {!zineMetadata && appState !== AppState.REVEALED && (
            <motion.header 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className={`fixed top-0 right-0 left-0 md:left-[88px] h-20 md:h-24 z-[50] flex items-center justify-center px-8 transition-all duration-1000 pt-safe overflow-hidden border-b border-black/5 dark:border-white/10 bg-nous-base dark:bg-[#1C1C1C] backdrop-blur-xl`}
            >
                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply dark:mix-blend-overlay" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/noise.png')" }} />
                <div onClick={() => { setViewMode('studio'); setZineMetadata(null); setAppState(AppState.IDLE); }} className="cursor-pointer flex flex-col items-center group relative z-10">
                  <h1 className="text-3xl md:text-6xl tracking-[-0.08em] font-[Cormorant] font-light italic text-nous-text dark:text-white opacity-95 transition-all luminescent-text">Mimi</h1>
                  <div className="w-12 h-px bg-nous-text dark:bg-white opacity-20 mt-1 group-hover:w-24 transition-all duration-700" />
                </div>
            </motion.header>
          )}
        </AnimatePresence>

        <main className={`relative flex-1 flex flex-col overflow-y-auto no-scrollbar transition-all duration-1000 ${zineMetadata ? 'md:pl-0 pt-0' : 'pt-20 md:pt-24'}`}>
          <AnimatePresence mode="wait">
            {appState === AppState.THINKING ? (
              <ElevatorLoader key="thinking" isDeep={isDeepRefraction} onBypass={(r) => { setAppState(AppState.IDLE); setThreadValue(r || ''); }} />
            ) : zineMetadata ? (
              <AnalysisDisplay key="reveal" metadata={zineMetadata} onReset={() => { setZineMetadata(null); setAppState(AppState.IDLE); }} />
            ) : (
              <motion.div 
                key={viewMode} 
                className="flex-1" 
                initial={{ opacity: 0, y: 5, filter: 'blur(2px)' }} 
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {viewMode === 'studio' && <InputStudio onRefine={handleRefine} isThinking={appState === AppState.THINKING} initialValue={threadValue} initialMedia={threadMedia} />}
                {viewMode === 'nebula' && <ArchiveCloudNebula onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
                {viewMode === 'mesopic' && <MesopicLens />}
                {viewMode === 'archival' && <ArchivalView onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
                {viewMode === 'profile' && <UserProfileView />}
                {viewMode === 'tailor' && <TailorView initialOverrides={tailorOverrides} />}
                {viewMode === 'scry' && <ScryView />}
                {viewMode === 'press' && <ThePress />}
                {viewMode === 'about' && <ProposalView folderData={proposalContext} />}
                {viewMode === 'darkroom' && <DarkroomView />}
                {viewMode === 'sanctuary' && <SanctuaryView />}
                {viewMode === 'ward' && <TheWard />}
                {viewMode === 'dossier' && <DossierView />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider><UserProvider><AgentProvider><AppContent /></AgentProvider></UserProvider></ThemeProvider>
);
