
// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ToneTag, ZineMetadata, DriftEvent } from '../types';
import { createZine } from '../services/geminiService';
import { saveZineToProfile, fetchZineById, auth, isCaptiveInWebview } from '../services/firebase';
import { InputStudio } from '../components/InputStudio';
import { AnalysisDisplay } from '../components/AnalysisDisplay';
import { ElevatorLoader } from '../components/ElevatorLoader';
import { UserProvider, useUser } from '../contexts/UserContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { ArchiveCloudNebula } from '../components/ArchiveCloudNebula';
import { ArchivalView } from '../components/ArchivalView';
import { UserProfileView } from '../components/UserProfileView';
import { MesopicLens } from '../components/MesopicLens'; 
import { ThePress } from '../components/ThePress';
import { SanctuaryView } from '../components/SanctuaryView';
import { TailorView } from '../components/TailorView';
import { ScryView } from '../components/ScryView';
import { DarkroomView } from '../components/DarkroomView';
import { ApiKeyShield } from '../components/ApiKeyShield';
import { ProposalView } from '../components/AboutView'; 
import { CaptiveSentinel } from '../components/CaptiveSentinel';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LayoutGrid, User, Menu, X, Newspaper, LogOut, ShieldAlert, Zap, Camera, Key, Radio, Activity as ActivityIcon, Archive, Moon, Sun, Scissors, FlaskConical, Eye, Radar, Compass, Info } from 'lucide-react';

const SidebarBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-1.5 transition-all duration-500 group/btn border-l-2 ${active ? 'border-nous-text dark:border-white text-nous-text dark:text-white bg-stone-50/50 dark:bg-stone-900/50' : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
  >
    <div className={`shrink-0 transition-transform duration-500 ${active ? 'scale-110' : 'group-hover/btn:scale-110'}`}>
      {React.cloneElement(icon as React.ReactElement, { strokeWidth: 1, size: 14 })}
    </div>
    <span className={`font-sans text-[8px] uppercase tracking-[0.3em] font-black opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-700 whitespace-nowrap ${active ? 'text-nous-text dark:text-white' : ''}`}>
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
          className="fixed inset-0 z-[10000] bg-nous-base dark:bg-stone-950 flex flex-col p-6 overflow-y-auto no-scrollbar"
        >
          <div className="flex justify-between items-center mb-6">
             <h2 className="font-header italic text-3xl text-nous-text dark:text-white">Menu</h2>
             <button onClick={onClose} className="p-2 text-stone-400"><X size={20}/></button>
          </div>
          <div className="space-y-4 flex-1">
             <div className="space-y-1">
                <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 block border-b border-stone-100 dark:border-stone-800 pb-1">Creation</span>
                <button onClick={() => handleNav('studio')} className="w-full text-left font-serif italic text-2xl py-1">Studio</button>
                <button onClick={() => handleNav('nebula')} className="w-full text-left font-serif italic text-2xl py-1">The Stand</button>
                <button onClick={() => handleNav('scry')} className="w-full text-left font-serif italic text-2xl py-1">Scry</button>
             </div>
             <div className="space-y-1">
                <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 block border-b border-stone-100 dark:border-stone-800 pb-1">Alchemy</span>
                <button onClick={() => handleNav('tailor')} className="w-full text-left font-serif italic text-2xl py-1">Tailor</button>
                <button onClick={() => handleNav('archival')} className="w-full text-left font-serif italic text-2xl py-1">Deep Archive</button>
                <button onClick={() => handleNav('mesopic')} className="w-full text-left font-serif italic text-2xl py-1">The M.E.S.</button>
                <button onClick={() => handleNav('darkroom')} className="w-full text-left font-serif italic text-2xl py-1">Darkroom</button>
             </div>
             <div className="space-y-1">
                <span className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 block border-b border-stone-100 dark:border-stone-800 pb-1">Discover</span>
                <button onClick={() => handleNav('about')} className="w-full text-left font-serif italic text-2xl py-1">Proposal</button>
                <button onClick={() => handleNav('press')} className="w-full text-left font-serif italic text-2xl py-1">Press</button>
                <button onClick={() => handleNav('profile')} className="w-full text-left font-serif italic text-2xl py-1">Profile</button>
             </div>
          </div>
          <div className="pt-6 border-t border-stone-200 dark:border-stone-800">
             <button onClick={() => { logout(); onClose(); }} className="w-full text-center py-2 text-red-400 font-sans text-[8px] uppercase tracking-widest font-black">De-Anchor Protocol</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  const { user, profile, updateProfile, loading: authLoading, logout, setOracleStatus, systemStatus } = useUser();
  const { currentPalette, toggleMode } = useTheme();
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [viewMode, setViewMode] = useState<string>('studio');
  const [zineMetadata, setZineMetadata] = useState<ZineMetadata | null>(null);
  const [isDeepRefraction, setIsDeepRefraction] = useState(false);
  const [threadValue, setThreadValue] = useState<string>('');
  const [showCaptiveSentinel, setShowCaptiveSentinel] = useState(false);
  const [isHeaderTranslucent, setIsHeaderTranslucent] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tailorOverrides, setTailorOverrides] = useState<any>(null);

  useEffect(() => {
    if (isCaptiveInWebview()) setShowCaptiveSentinel(true);
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
        if (e.detail === 'studio' && e.detail_data) setThreadValue(e.detail_data);
      }
    };
    window.addEventListener('mimi:change_view', handleChangeView);
    return () => window.removeEventListener('mimi:change_view', handleChangeView);
  }, []);

  const handleRefine = useCallback(async (text, media, tone, opts) => {
    setIsDeepRefraction(!!opts.deepThinking);
    setAppState(AppState.THINKING);
    try {
      const result = await createZine(text, media, tone, profile, opts);
      const targetUid = profile?.uid || user?.uid || 'ghost';
      const id = await saveZineToProfile(targetUid, profile?.handle || 'Ghost', profile?.photoURL, result.content, tone, undefined, opts.deepThinking, opts.isPublic);
      setZineMetadata({ id, userId: targetUid, userHandle: profile?.handle || 'Ghost', title: result.content.title, tone, timestamp: Date.now(), likes: 0, content: result.content });
      setAppState(AppState.REVEALED);
    } catch (e) { setAppState(AppState.IDLE); }
  }, [user, profile]);

  if (authLoading) return <ElevatorLoader />;

  return (
    <div className="h-full w-full bg-nous-base dark:bg-stone-950">
      <AnimatePresence>{showCaptiveSentinel && <CaptiveSentinel onClose={() => setShowCaptiveSentinel(false)} />}</AnimatePresence>
      <div className="pericardium-seal flex flex-col md:flex-row pb-safe pt-safe overflow-hidden">
        <ApiKeyShield />
        <button onClick={toggleMode} className="fixed top-6 right-6 md:right-12 z-[5000] p-3 rounded-full bg-stone-100/50 dark:bg-stone-900/50 text-stone-400 hover:text-nous-text dark:hover:text-white transition-all backdrop-blur-sm border border-stone-200/20">
           {currentPalette?.isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {!zineMetadata && <button onClick={() => setMobileMenuOpen(true)} className="md:hidden fixed top-6 left-6 z-[5001] p-3 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-nous-text dark:text-white border border-stone-200 shadow-lg"><Menu size={20} /></button>}
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} viewMode={viewMode} setViewMode={setViewMode} logout={logout} />
        {!zineMetadata && appState !== AppState.REVEALED && (
          <header className={`fixed top-0 right-0 left-0 md:left-20 h-20 md:h-24 z-[50] flex items-center justify-center px-8 transition-all duration-1000 pt-safe overflow-hidden ${isHeaderTranslucent ? 'bg-nous-base/20 dark:bg-stone-950/20 backdrop-blur-3xl opacity-60' : 'bg-nous-base/60 dark:bg-stone-950/60 backdrop-blur-xl border-b border-black/5'}`}>
              <div onClick={() => { setViewMode('studio'); setZineMetadata(null); setAppState(AppState.IDLE); }} className="cursor-pointer">
                <h1 className="text-3xl md:text-6xl tracking-[-0.08em] font-serif italic text-stone-950 dark:text-white opacity-95 transition-all luminescent-text">Mimi</h1>
              </div>
          </header>
        )}
        <main className={`relative flex-1 flex flex-col overflow-y-auto no-scrollbar transition-all duration-1000 ${zineMetadata ? 'md:pl-0 pt-0' : 'md:pl-20 pt-20 md:pt-24'}`}>
          <AnimatePresence mode="wait">
            {appState === AppState.THINKING ? (
              <ElevatorLoader key="thinking" isDeep={isDeepRefraction} onBypass={(r) => { setAppState(AppState.IDLE); setThreadValue(r || ''); }} />
            ) : zineMetadata ? (
              <AnalysisDisplay key="reveal" metadata={zineMetadata} onReset={() => { setZineMetadata(null); setAppState(AppState.IDLE); }} />
            ) : (
              <motion.div key={viewMode} className="flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                {viewMode === 'studio' && <InputStudio onRefine={handleRefine} isThinking={appState === AppState.THINKING} initialValue={threadValue} />}
                {viewMode === 'nebula' && <ArchiveCloudNebula onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
                {viewMode === 'mesopic' && <MesopicLens />}
                {viewMode === 'archival' && <ArchivalView onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
                {viewMode === 'profile' && <UserProfileView />}
                {viewMode === 'tailor' && <TailorView initialOverrides={tailorOverrides} />}
                {viewMode === 'scry' && <ScryView />}
                {viewMode === 'press' && <ThePress />}
                {viewMode === 'about' && <ProposalView />}
                {viewMode === 'darkroom' && <DarkroomView />}
                {viewMode === 'sanctuary' && <SanctuaryView />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        {!zineMetadata && (
          <aside className="hidden md:flex fixed left-0 top-0 h-full z-[2000] flex-col group/sidebar">
            <div className="h-full bg-white/60 dark:bg-stone-900/60 backdrop-blur-3xl border-r border-black/5 dark:border-white/5 flex flex-col pt-16 w-[80px] group-hover/sidebar:w-56 transition-all duration-700 overflow-hidden shadow-2xl">
              <div className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar pb-6">
                <div className="px-6 py-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"><span className="font-sans text-[6px] uppercase tracking-widest font-black text-stone-300">Creation</span></div>
                <SidebarBtn active={viewMode === 'studio'} onClick={() => setViewMode('studio')} icon={<Sparkles />} label="Studio" />
                <SidebarBtn active={viewMode === 'nebula'} onClick={() => setViewMode('nebula')} icon={<LayoutGrid />} label="Stand" />
                <SidebarBtn active={viewMode === 'scry'} onClick={() => setViewMode('scry')} icon={<Compass />} label="Scry" />
                <div className="px-6 py-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"><span className="font-sans text-[6px] uppercase tracking-widest font-black text-stone-300">Archive</span></div>
                <SidebarBtn active={viewMode === 'archival'} onClick={() => setViewMode('archival')} icon={<Archive />} label="Archival" />
                <SidebarBtn active={viewMode === 'mesopic'} onClick={() => setViewMode('mesopic')} icon={<Camera />} label="The M.E.S." />
                <SidebarBtn active={viewMode === 'darkroom'} onClick={() => setViewMode('darkroom')} icon={<FlaskConical />} label="Darkroom" />
                <div className="px-6 py-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"><span className="font-sans text-[6px] uppercase tracking-widest font-black text-stone-300">Alchemy</span></div>
                <SidebarBtn active={viewMode === 'tailor'} onClick={() => setViewMode('tailor')} icon={<Scissors />} label="Tailor" />
                <SidebarBtn active={viewMode === 'profile'} onClick={() => setViewMode('profile')} icon={<User />} label="Profile" />
                <div className="px-6 py-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity"><span className="font-sans text-[6px] uppercase tracking-widest font-black text-stone-300">Discover</span></div>
                <SidebarBtn active={viewMode === 'about'} onClick={() => setViewMode('about')} icon={<Info />} label="Proposal" />
                <SidebarBtn active={viewMode === 'press'} onClick={() => setViewMode('press')} icon={<Newspaper />} label="Press" />
              </div>
              <div className="px-4 py-3 border-t border-black/5 dark:border-white/5 space-y-1 group-hover/sidebar:opacity-100 opacity-0 transition-opacity duration-700">
                <div className="flex justify-between items-center"><span className="font-sans text-[5px] uppercase text-stone-500 tracking-widest">Oracle</span><div className={`w-1 h-1 rounded-full ${systemStatus.oracle === 'ready' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} /></div>
              </div>
              <div className="mt-auto mb-6"><SidebarBtn active={false} onClick={logout} icon={<LogOut className="text-red-300" />} label="De-Anchor" /></div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <ThemeProvider><UserProvider><AppContent /></UserProvider></ThemeProvider>
);
