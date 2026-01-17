
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ZineContent, ToneTag, ZineMetadata } from './types';
import { createZine, MediaFile } from './services/geminiService';
import { saveZineToProfile, fetchZineById, fetchCommunityZines } from './services/firebase';
import { InputStudio } from './components/InputStudio';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ElevatorLoader } from './components/ElevatorLoader';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider, useTheme, PALETTES, Palette } from './contexts/ThemeContext';
import { OnboardingModal } from './components/OnboardingModal';
import { CliqueRadar } from './components/CliqueRadar';
import { ArchiveView } from './components/ArchiveView';
import { UserProfileView } from './components/UserProfileView';
import { ObsidianMirror } from './components/ObsidianMirror';
import { StructuralPage } from './components/LegalPage';
import { ArchiveCloudNebula } from './components/ArchiveCloudNebula';
import { Pocket } from './components/Pocket';
import { CliqueProtocol } from './components/CliqueProtocol';
import { Sun, Moon, User as UserIcon, Palette as PaletteIcon, Info, ChevronDown, Plus, Bookmark, PenTool, Sparkles, UserPlus, Zap, Check, Loader2, X, Martini, Eye } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
};

type ViewMode = 'nebula' | 'studio' | 'season' | 'archive' | 'profile' | 'mirror' | 'pocket';
type SpineMode = 'orientation' | 'evolution' | 'access' | null;

const InfluencePortal: React.FC = () => {
  const { user, profile, linkAccount } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInfluenceRitual = async () => {
    if (user && !user.isAnonymous) {
      alert(`Identity Secured: @${profile?.handle} is anchored.`);
      return;
    }
    setIsSyncing(true);
    try {
      await linkAccount();
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (e) {
      console.warn("Handshake Interrupted.");
    } finally {
      setIsSyncing(false);
    }
  };

  const isAnchored = user && !user.isAnonymous;

  return (
    <div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[5500] pointer-events-none flex flex-col gap-4">
      <motion.button 
        initial={{ scale: 0, x: -50 }}
        animate={{ scale: 1, x: 0 }}
        whileHover={{ scale: 1.05, y: -5 }}
        onClick={handleInfluenceRitual}
        className={`p-4 md:p-6 bg-white/90 dark:bg-stone-900/90 backdrop-blur-3xl border ${isSuccess || isAnchored ? 'border-emerald-500' : 'border-stone-200 dark:border-stone-800'} rounded-full shadow-2xl flex items-center justify-center group pointer-events-auto transition-all duration-700`}
        title={isAnchored ? "Sovereign Identity Secured" : "Become a Mimi Müse"}
      >
        {isSyncing ? (
          <Loader2 size={18} className="animate-spin text-emerald-400 md:w-[22px]" />
        ) : isAnchored ? (
          <Sparkles size={18} className="text-emerald-500 md:w-[22px]" />
        ) : (
          <Eye size={18} className="text-emerald-400 group-hover:scale-110 transition-transform md:w-[22px]" />
        )}
        <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] group-hover:ml-4 transition-all duration-700 font-sans text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-black text-nous-text dark:text-white whitespace-nowrap">
          {isAnchored ? `Swan: @${profile?.handle}` : "Anchor to Cloud"}
        </span>
      </motion.button>

      <motion.button 
        initial={{ scale: 0, x: -50 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.05, y: -5 }}
        onClick={() => window.open('https://5282e004-0dda-445e-8f87-722c6884213d.paylinks.godaddy.com/mimizine', '_blank')}
        className="p-4 md:p-6 bg-white/90 dark:bg-stone-900/90 backdrop-blur-3xl border border-stone-200 dark:border-stone-800 rounded-full shadow-2xl flex items-center justify-center group pointer-events-auto"
        title="Royal Patronage"
      >
        <Martini size={18} className="text-pink-400 group-hover:animate-bounce transition-transform md:w-[22px]" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-4 transition-all duration-700 font-sans text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-black text-nous-text dark:text-white whitespace-nowrap">
          Support the Edit
        </span>
      </motion.button>
    </div>
  );
};

const EditorialSelector: React.FC = () => {
  const { applyPalette, currentPalette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMobile && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile]);
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const PaletteItem = ({ p, mobile = false }: { p: Palette, mobile?: boolean }) => (
    <button 
      type="button"
      onClick={(e) => { 
        e.preventDefault();
        e.stopPropagation();
        applyPalette(p.name); 
        if (!mobile) setIsOpen(false); 
      }} 
      className={`flex items-center gap-3 transition-all shrink-0 ${mobile ? 'px-4 py-3 rounded-2xl border w-full text-left bg-white/50 dark:bg-black/20' : 'w-full justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-900 rounded-2xl'} ${currentPalette.name === p.name ? 'border-nous-text dark:border-white bg-stone-100 dark:bg-white/10' : 'border-stone-100 dark:border-stone-800'}`}
    >
      <div className="flex items-center gap-3 pointer-events-none">
        <div className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center" style={{ backgroundColor: p.base }}>
           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.accent }} />
        </div>
        <div className="flex flex-col">
          <span className={`font-sans text-[9px] uppercase tracking-widest font-black ${currentPalette.name === p.name ? 'text-nous-text dark:text-white' : 'text-stone-400'}`}>
            {p.genre}
          </span>
          {mobile && <span className="font-serif italic text-[10px] text-stone-300 dark:text-stone-600 leading-none">{p.name}</span>}
        </div>
      </div>
      {currentPalette.name === p.name && (
        <motion.div layoutId="active-genre-indicator" className="w-1 h-1 bg-nous-text dark:bg-white rounded-full" />
      )}
    </button>
  );

  return (
    <div ref={containerRef} className="relative z-[9500] pointer-events-auto">
      <button 
        type="button"
        onClick={handleToggle} 
        className={`flex items-center gap-2 md:gap-4 px-3 md:px-5 py-2 md:py-2.5 rounded-full border transition-all duration-500 bg-white/95 dark:bg-stone-900/95 backdrop-blur-3xl hover:bg-white/80 dark:hover:bg-stone-800 ${isOpen ? 'text-nous-text dark:text-white border-nous-text dark:border-white ring-2 ring-nous-text/10' : 'text-stone-400 border-stone-200 dark:border-stone-800'}`}
      >
        <PaletteIcon size={12} className="text-stone-400" />
        <span className="font-sans text-[8px] md:text-[9px] uppercase tracking-widest font-black pointer-events-none shrink-0">{currentPalette.genre}</span>
        <ChevronDown size={8} className={`transition-transform duration-500 md:w-[10px] pointer-events-none ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: isMobile ? -10 : 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: isMobile ? -10 : 10, scale: 1 }} 
              exit={{ opacity: 0, y: isMobile ? -10 : 10, scale: 0.95 }} 
              className={`absolute right-0 ${isMobile ? 'bottom-full mb-4' : 'top-full mt-4'} w-64 md:w-72 bg-white/95 dark:bg-stone-950/95 backdrop-blur-3xl border border-stone-200 dark:border-stone-800 shadow-[0_50px_100px_rgba(0,0,0,0.3)] z-[9600] p-4 md:p-5 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden pointer-events-auto`}
            >
              <div className="mb-4 px-2 md:px-4 text-left">
                <span className="font-sans text-[7px] uppercase tracking-[0.4em] text-stone-400 font-black">Editorial Genre</span>
              </div>
              <div className="space-y-1 max-h-[50vh] overflow-y-auto no-scrollbar">
                {Object.values(PALETTES).map(p => (
                  <div key={p.name}>
                    <PaletteItem p={p} mobile={isMobile} />
                  </div>
                ))}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MimiLogo: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { user } = useUser();
  const isAnchored = user && !user.isAnonymous;
  
  return (
    <div onClick={onClick} className="flex flex-col items-center cursor-pointer group px-4 pointer-events-auto">
      <div className="relative flex items-center justify-center">
         <span className={`font-header italic text-4xl md:text-6xl tracking-tighter text-nous-text dark:text-white leading-[0.7] luminescent-text transition-all duration-700 group-hover:scale-[1.01] ${isAnchored ? 'animate-pulse' : ''}`}>Mimi.</span>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ label: string, active: boolean, onClick: () => void, hasEcho?: boolean }> = ({ label, active, onClick, hasEcho }) => (
  <button onClick={onClick} className={`group flex flex-col items-center px-3 md:px-7 py-2 transition-all duration-700 relative shrink-0 pointer-events-auto`}>
    <div className="relative">
      <span className={`font-sans text-[8px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.5em] transition-all duration-700 whitespace-nowrap ${active ? 'text-nous-text dark:text-white font-black' : 'text-stone-300 dark:text-stone-700 group-hover:text-stone-500'}`}>
        {label}
      </span>
      {hasEcho && !active && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
        />
      )}
    </div>
    {active && (
      <motion.div 
        layoutId="nav-active" 
        className="absolute -bottom-1 w-3 md:w-4 h-[1.5px] bg-nous-text dark:bg-white" 
      />
    )}
  </button>
);

const AppContent: React.FC = () => {
  const { user, profile, loading: authLoading } = useUser();
  const { toggleTheme, theme, currentPalette } = useTheme();
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [viewMode, setViewMode] = useState<ViewMode>('studio');
  const [zineMetadata, setZineMetadata] = useState<ZineMetadata | null>(null);
  const [spineMode, setSpineMode] = useState<SpineMode>(null);
  const [cliqueProtocolOpen, setCliqueProtocolOpen] = useState(false);
  const [isInitializingLink, setIsInitializingLink] = useState(false);
  const [hasNewSignals, setHasNewSignals] = useState(false);

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 400], [0, -100]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0.95]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedZineId = params.get('zine');
    if (sharedZineId && !zineMetadata) {
      setIsInitializingLink(true);
      fetchZineById(sharedZineId).then(data => {
        if (data) {
          setZineMetadata(data);
          setAppState(AppState.REVEALED);
        }
        setIsInitializingLink(false);
      }).catch(() => setIsInitializingLink(false));
    }

    const checkSignals = async () => {
      const community = await fetchCommunityZines(1);
      if (community.length > 0) {
        const lastSignal = localStorage.getItem('mimi_last_witnessed_signal');
        if (lastSignal !== community[0].id) {
          setHasNewSignals(true);
        }
      }
    };
    checkSignals();
    const interval = setInterval(checkSignals, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefine = useCallback(async (text: string, mediaFiles: MediaFile[], tone: ToneTag, options: any, coverImageUrl?: string) => {
    setAppState(AppState.THINKING);
    setZineMetadata(null);

    try {
      const content = await createZine(text, mediaFiles, tone, profile, options);
      content.originalThought = text; 
      
      const id = await saveZineToProfile(user?.uid || 'ghost', profile?.handle || 'Ghost', profile?.photoURL, content, tone, coverImageUrl, options.deepThinking, options.isPublic);
      
      const metadata: ZineMetadata = { 
        id, 
        userId: user?.uid || 'ghost', 
        userHandle: profile?.handle || 'Ghost', 
        userAvatar: profile?.photoURL || undefined, 
        title: content.title, 
        tone, 
        coverImageUrl: coverImageUrl || null, 
        timestamp: Date.now(), 
        likes: 0, 
        content, 
        isDeepThinking: !!options.deepThinking,
        isPublic: !!options.isPublic
      };
      
      setZineMetadata(metadata);
    } catch (e: any) { 
      console.error("MIMI // Accession Failed:", e);
      setAppState(AppState.ERROR); 
    }
  }, [user, profile]);

  const onElevatorComplete = useCallback(() => {
    setAppState(AppState.IDLE);
    setViewMode('nebula');
  }, []);

  const resetToIdle = () => {
    setZineMetadata(null);
    setAppState(AppState.IDLE);
    setViewMode('studio');
    window.history.replaceState({}, document.title, "/");
  };

  const handleNavClick = (mode: ViewMode) => {
    setViewMode(mode);
    setAppState(AppState.IDLE);
    if (mode === 'season') {
      setHasNewSignals(false);
      fetchCommunityZines(1).then(c => {
        if(c.length > 0) localStorage.setItem('mimi_last_witnessed_signal', c[0].id);
      });
    }
  };

  if (isInitializingLink) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950">
      <Loader2 size={32} className="animate-spin text-stone-200 mb-4" />
      <span className="font-sans text-[8px] uppercase tracking-[1em] text-stone-400 font-black">Hydrating Transmission...</span>
    </div>
  );

  if (!profile) {
    if (authLoading) return <ElevatorLoader />;
    return <OnboardingModal />;
  }

  return (
    <div 
      className="min-h-full w-full text-nous-text dark:text-white font-dynamic transition-colors duration-1000 flex flex-col" 
      style={{ backgroundColor: currentPalette.base }}
    >
      <AnimatePresence>
        {spineMode && <StructuralPage type={spineMode} onClose={() => setSpineMode(null)} />}
        {cliqueProtocolOpen && <CliqueProtocol isOpen={cliqueProtocolOpen} onClose={() => setCliqueProtocolOpen(false)} />}
      </AnimatePresence>
      
      <motion.header 
        style={{ y: headerY, opacity: headerOpacity }}
        className="fixed top-0 left-0 w-full z-[8000] px-2 md:px-12 pt-4 md:pt-10 flex flex-col items-center gap-2 md:gap-4 pointer-events-none"
      >
          <MimiLogo onClick={resetToIdle} />
          
          <div className="w-full flex flex-col items-center justify-center pointer-events-none gap-2">
             <div className="flex items-center max-w-[98vw] md:max-w-fit bg-white/70 dark:bg-black/60 backdrop-blur-3xl rounded-full px-1 md:px-3 border border-stone-200/20 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto overflow-hidden">
                <div className="flex items-center h-10 md:h-12 overflow-x-auto no-scrollbar mask-fade-edges relative px-1 pointer-events-auto shrink min-w-0">
                    <NavItem label="Studio" active={viewMode === 'studio' && appState !== AppState.REVEALED} onClick={() => handleNavClick('studio')} />
                    <NavItem label="Stand" active={viewMode === 'nebula'} onClick={() => handleNavClick('nebula')} />
                    <NavItem label="Season" active={viewMode === 'season'} onClick={() => handleNavClick('season')} hasEcho={hasNewSignals} />
                    <NavItem label="Mirror" active={viewMode === 'mirror'} onClick={() => handleNavClick('mirror')} />
                </div>
                
                <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-800 pl-1 md:pl-3 h-8 md:h-10 shrink-0 pointer-events-auto">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCliqueProtocolOpen(true); }} 
                      className="p-2 md:p-3 rounded-full text-stone-400 dark:text-stone-700 hover:text-nous-text dark:hover:text-white transition-all bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-transparent"
                    >
                      <UserPlus size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNavClick('pocket'); }} 
                      className={`p-2 md:p-3 rounded-full transition-all bg-white/60 dark:bg-black/40 backdrop-blur-3xl border ${viewMode === 'pocket' ? 'text-nous-text dark:text-white border-stone-300' : 'text-stone-400 dark:text-stone-700 hover:text-nous-text border-transparent'}`}
                    >
                      <Bookmark size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNavClick('profile'); }} 
                      className={`p-2 md:p-3 rounded-full transition-all bg-white/60 dark:bg-black/40 backdrop-blur-3xl border ${viewMode === 'profile' ? 'text-nous-text dark:text-white border-stone-300' : 'text-stone-400 dark:text-stone-700 hover:text-nous-text border-transparent'}`}
                    >
                      {profile?.isSwan ? <Sparkles size={12} className="text-emerald-500" /> : <UserIcon size={12} />}
                    </button>
                    <div className="hidden md:block">
                      <EditorialSelector />
                    </div>
                </div>
             </div>
             
             <div className="md:hidden w-full flex justify-center px-4 pointer-events-auto">
                <EditorialSelector />
             </div>
          </div>
      </motion.header>

      <main className="relative flex-1 flex flex-col pt-40 md:pt-64">
        <AnimatePresence mode="wait">
          {appState === AppState.THINKING && (
            <motion.div 
              key="elevator-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000]"
            >
              <ElevatorLoader onComplete={onElevatorComplete} />
            </motion.div>
          )}

          {appState === AppState.REVEALED && zineMetadata ? (
            <motion.div 
              key={`reveal-${zineMetadata.id}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="flex-1 w-full"
            >
              <AnalysisDisplay metadata={zineMetadata} onReset={resetToIdle} />
            </motion.div>
          ) : (
            // Fix: Removed the redundant AppState check that caused the comparison error.
            // AppState.THINKING is already caught in the previous block.
            <motion.div 
              key={viewMode} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.5 }} 
              className="flex-1 flex flex-col"
            >
              {viewMode === 'studio' && <InputStudio onRefine={handleRefine} isThinking={appState === AppState.THINKING} />}
              {viewMode === 'nebula' && <ArchiveCloudNebula onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
              {viewMode === 'season' && <CliqueRadar onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
              {viewMode === 'archive' && <ArchiveView onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
              {viewMode === 'profile' && <UserProfileView />}
              {viewMode === 'mirror' && <ObsidianMirror />}
              {viewMode === 'pocket' && <Pocket onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full py-8 md:py-10 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center bg-transparent border-t border-stone-100/30 dark:border-stone-900/30 opacity-40 hover:opacity-100 transition-opacity duration-700 gap-6">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-stone-400">MIMI // PRIVATE EDITORIAL // 2024</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => setSpineMode('orientation')} className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.5em] md:tracking-[0.6em] font-black hover:text-nous-text dark:hover:text-white transition-colors flex items-center gap-2">
              <Info size={12} /> Colophon
            </button>
          </div>
      </footer>
      <InfluencePortal />
    </div>
  );
};
