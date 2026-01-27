
// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ToneTag, ZineMetadata } from './types';
import { createZine, MediaFile } from './services/geminiService';
import { saveZineToProfile, fetchZineById, auth } from './services/firebase';
import { getArchiveCounts } from './services/localArchive';
import { InputStudio } from './components/InputStudio';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ElevatorLoader } from './components/ElevatorLoader';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ArchiveCloudNebula } from './components/ArchiveCloudNebula';
import { Pocket } from './components/Pocket';
import { UserProfileView } from './components/UserProfileView';
import { MesopicLens } from './components/MesopicLens';
import { ProsceniumView } from './components/CliqueView'; 
import { ThePress } from './components/ThePress';
import { SanctuaryView } from './components/SanctuaryView';
import { ApiKeyShield } from './components/ApiKeyShield';
import { OnboardingModal } from './components/OnboardingModal';
import { AboutView } from './components/AboutView';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LayoutGrid, User, Inbox, Eye, Menu, X, Users, Newspaper, LogOut, ShieldAlert, Info, Zap, Heart, ChevronDown } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
};

const RegistryCount: React.FC = () => {
  const [counts, setCounts] = useState({ zines: 0, pocket: 0 });
  useEffect(() => {
    const update = async () => setCounts(await getArchiveCounts());
    update();
    const interval = setInterval(update, 15000);
    window.addEventListener('mimi:artifact_finalized', update);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mimi:artifact_finalized', update);
    };
  }, []);

  const total = counts.zines + counts.pocket;

  return (
    <div className="px-4 py-8 border-t border-red-500/10 dark:border-emerald-500/10 space-y-4 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-700 bg-stone-50/50 dark:bg-stone-900/40">
      <div className="flex items-center gap-2 text-red-500 dark:text-emerald-400">
        <Zap size={10} className="animate-pulse" />
        <span className="font-sans text-[7px] uppercase tracking-[0.3em] font-black italic">Structural Density</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="font-mono text-xs text-nous-text dark:text-white font-black">{counts.zines}</span>
            <span className="font-sans text-[5px] uppercase text-stone-400">Authored</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-xs text-nous-text dark:text-white font-black">{counts.pocket}</span>
            <span className="font-sans text-[5px] uppercase text-stone-400">Curated</span>
          </div>
        </div>
        <div className="h-0.5 w-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
           <motion.div animate={{ width: `${Math.min((total/20)*100, 100)}%` }} className="h-full bg-red-500 dark:bg-emerald-500" />
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, profile, loading: authLoading, logout, speedGhostEntrance } = useUser();
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [viewMode, setViewMode] = useState<string>('studio');
  const [zineMetadata, setZineMetadata] = useState<ZineMetadata | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const handleChangeView = (e: any) => {
      if (e.detail) { setViewMode(e.detail); setZineMetadata(null); setAppState(AppState.IDLE); }
    };
    const handleEmergencyReset = () => { setAppState(AppState.IDLE); setZineMetadata(null); };
    
    window.addEventListener('mimi:change_view', handleChangeView);
    window.addEventListener('mimi:emergency_reset', handleEmergencyReset);
    return () => {
      window.removeEventListener('mimi:change_view', handleChangeView);
      window.removeEventListener('mimi:emergency_reset', handleEmergencyReset);
    };
  }, []);

  const resetToIdle = () => { setViewMode('studio'); setAppState(AppState.IDLE); setZineMetadata(null); };

  const handleRefine = useCallback(async (text, media, tone, opts) => {
    setAppState(AppState.THINKING);
    try {
      const result = await createZine(text, media, tone, profile, opts);
      const targetUid = profile?.uid || user?.uid || 'ghost';
      const id = await saveZineToProfile(targetUid, profile?.handle || 'Ghost', profile?.photoURL, result.content, tone, undefined, opts.deepThinking, opts.isPublic);
      
      const finalMetadata: ZineMetadata = {
        id,
        userId: targetUid,
        userHandle: profile?.handle || 'Ghost',
        userAvatar: profile?.photoURL || null,
        title: result.content.title,
        tone,
        timestamp: Date.now(),
        likes: 0,
        content: result.content,
        isDeepThinking: !!opts.deepThinking,
        isPublic: !!opts.isPublic
      };

      setZineMetadata(finalMetadata);
      setAppState(AppState.REVEALED);
    } catch (e: any) {
      setAppState(AppState.IDLE);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: `Ascension Failed: ${e.message || "Signal obscured."}`, icon: <ShieldAlert size={16} className="text-red-500" /> } 
      }));
    }
  }, [user, profile]);

  if (authLoading) return <ElevatorLoader />;
  if (user && !profile) return <OnboardingModal />;

  return (
    <div className="h-full w-full bg-nous-base dark:bg-stone-950">
      <div className="pericardium-seal flex flex-col md:flex-row pb-safe pt-safe">
        <ApiKeyShield />
        
        {!zineMetadata && !isNavOpen && (
          <div className="md:hidden fixed top-3 left-6 z-[9000] pt-safe">
            <button onClick={() => setIsNavOpen(true)} className="text-stone-400 p-2 bg-white/20 dark:bg-stone-900/20 rounded-full backdrop-blur-md border border-black/5 hover:bg-white/40 transition-all">
              <Menu size={18} />
            </button>
          </div>
        )}
        
        {!zineMetadata && appState !== AppState.REVEALED && (
          <header className="fixed top-0 right-0 left-0 md:left-20 h-20 md:h-28 z-[50] flex items-center px-8 backdrop-blur-xl bg-nous-base/40 dark:bg-stone-950/40 border-b border-black/5 justify-center overflow-hidden pt-safe transition-all duration-700">
              <div className="cursor-pointer pt-2 md:pt-4" onClick={resetToIdle}>
                <h1 className="text-5xl md:text-8xl tracking-[-0.08em] font-header italic text-stone-900 dark:text-white opacity-80 hover:opacity-100 transition-all duration-1000 leading-none select-none">Mimi</h1>
              </div>
          </header>
        )}

        <AnimatePresence>
          {isNavOpen && (
            <motion.div 
              initial={{ x: -100, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -100, opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-0 z-[8500] bg-white dark:bg-stone-950 p-1 flex flex-col pt-safe overflow-hidden"
            >
              <div className="flex-1 m-2 border-[0.5px] border-stone-200 dark:border-stone-800 rounded-sm bg-stone-50/10 dark:bg-stone-900/5 p-8 flex flex-col overflow-y-auto no-scrollbar relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-1 bg-stone-200 dark:bg-stone-800 rounded-full opacity-30" />
                
                <div className="flex justify-between items-center mb-12 pt-10">
                  <h2 className="font-header italic text-3xl opacity-10">Mimi Registry</h2>
                  <button onClick={() => setIsNavOpen(false)} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-col gap-8 pb-20">
                  <DrawerItem onClick={() => { setViewMode('studio'); setIsNavOpen(false); }} label="The Studio" icon={<Sparkles size={16} />} />
                  <DrawerItem onClick={() => { setViewMode('nebula'); setIsNavOpen(false); }} label="The Stand" icon={<LayoutGrid size={16} />} />
                  <DrawerItem onClick={() => { setViewMode('mesopic'); setIsNavOpen(false); }} label="The Mesopic" icon={<Eye size={16} />} />
                  <DrawerItem onClick={() => { setViewMode('pocket'); setIsNavOpen(false); }} label="The Pocket" icon={<Inbox size={16} />} />
                  <div className="h-px w-8 bg-black/5 dark:bg-white/5 my-2" />
                  <DrawerItem onClick={() => { setViewMode('proscenium'); setIsNavOpen(false); }} label="The Proscenium" icon={<Users size={16} />} />
                  <DrawerItem onClick={() => { setViewMode('press'); setIsNavOpen(false); }} label="The Press" icon={<Newspaper size={16} />} />
                  <DrawerItem onClick={() => { setViewMode('profile'); setIsNavOpen(false); }} label="The Profile" icon={<User size={16} />} />
                  <DrawerItem onClick={() => { setViewMode('about'); setIsNavOpen(false); }} label="The Colophon" icon={<Info size={16} />} isSubtle />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className={`relative flex-1 flex flex-col overflow-y-auto no-scrollbar transition-all duration-1000 ${zineMetadata ? 'md:pl-0 pt-0' : 'md:pl-20 pt-20 md:pt-28'}`}>
          <AnimatePresence mode="wait">
            {appState === AppState.THINKING ? (
              <ElevatorLoader key="thinking" isDeep={true} />
            ) : zineMetadata ? (
              <AnalysisDisplay key="reveal" metadata={zineMetadata} onReset={resetToIdle} onSanctuary={() => setViewMode('sanctuary')} />
            ) : (
              <motion.div key={viewMode} className="flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                {viewMode === 'studio' && <InputStudio onRefine={handleRefine} isThinking={false} />}
                {viewMode === 'sanctuary' && <SanctuaryView />}
                {viewMode === 'nebula' && <ArchiveCloudNebula onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
                {viewMode === 'mesopic' && <MesopicLens />}
                {viewMode === 'pocket' && <Pocket onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
                {viewMode === 'profile' && <UserProfileView />}
                {viewMode === 'proscenium' && <ProsceniumView onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} onCapture={(t) => setViewMode('studio')} />}
                {viewMode === 'press' && <ThePress />}
                {viewMode === 'about' && <AboutView />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {!zineMetadata && (
          <aside className="hidden md:flex fixed left-0 top-0 h-full z-[2000] flex-col group/sidebar">
            <div className="h-full bg-white/60 dark:bg-stone-900/60 backdrop-blur-3xl border-r border-black/5 flex flex-col pt-24 px-4 w-[80px] group-hover/sidebar:w-72 transition-all duration-700">
              <div className="flex-1 space-y-1">
                <SidebarBtn active={viewMode === 'studio'} onClick={() => setViewMode('studio')} icon={<Sparkles size={16} />} label="The Studio" />
                <SidebarBtn active={viewMode === 'nebula'} onClick={() => setViewMode('nebula')} icon={<LayoutGrid size={16} />} label="The Stand" />
                <SidebarBtn active={viewMode === 'mesopic'} onClick={() => setViewMode('mesopic')} icon={<Eye size={16} />} label="The Mesopic" />
                <SidebarBtn active={viewMode === 'pocket'} onClick={() => setViewMode('pocket')} icon={<Inbox size={16} />} label="The Pocket" />
                <SidebarBtn active={viewMode === 'profile'} onClick={() => setViewMode('profile')} icon={<User size={16} />} label="The Profile" />
                <div className="my-8 h-px bg-black/5" />
                <SidebarBtn active={viewMode === 'proscenium'} onClick={() => setViewMode('proscenium')} icon={<Users size={16} />} label="The Proscenium" />
                <SidebarBtn active={viewMode === 'press'} onClick={() => setViewMode('press')} icon={<Newspaper size={16} />} label="The Press" />
                <SidebarBtn active={viewMode === 'about'} onClick={() => setViewMode('about')} icon={<Info size={16} className="text-stone-400" />} label="The Colophon" />
              </div>
              <RegistryCount />
              <div className="mt-auto mb-8">
                <SidebarBtn active={false} onClick={logout} icon={<LogOut size={16} className="text-red-300" />} label="De-Anchor" />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

const DrawerItem = ({ onClick, label, icon, isSubtle }) => (
  <button onClick={onClick} className={`flex items-center gap-6 group/item transition-all ${isSubtle ? 'text-stone-400' : 'text-nous-text dark:text-white'}`}>
    <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center opacity-40 group-hover/item:opacity-100 transition-opacity">
       {icon}
    </div>
    <span className="font-serif italic text-2xl tracking-tighter group-hover/item:pl-1 transition-all">{label}</span>
  </button>
);

const SidebarBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center w-full py-4 px-4 gap-6 transition-all ${active ? 'text-nous-text dark:text-white bg-black/5 dark:bg-white/5 rounded-sm' : 'text-stone-300 hover:text-stone-500'}`}>
    <div className="w-6 shrink-0 flex justify-center">{icon}</div>
    <span className="font-serif italic text-xl opacity-0 group-hover/sidebar:opacity-100 transition-all">{label}</span>
  </button>
);
