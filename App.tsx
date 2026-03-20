
import React, { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { ThimbleDashboard } from './components/ThimbleDashboard';
import { CommandDrawer } from './components/CommandDrawer';
import { ThimbleIndex } from './components/ThimbleIndex';
import { PublicSharePage } from './components/PublicSharePage';
import { StackView } from './components/StackView';
import { AppState, ToneTag, ZineMetadata, DriftEvent, MediaFile } from './types';
import { generateThreadZineSpine, generateZineTitlesFromThreads } from './services/geminiService';
import { createZine } from './services/zineGenerator';
import { saveZineToProfile, fetchZineById, auth, isCaptiveInWebview, updateZineMetadata } from './services/firebase';
import { ZineConfiguration } from './components/ZineConfiguration';
import { ZineGenerationOptions } from './types';
import { InputStudio } from './components/InputStudio';

import { SUPERINTELLIGENCE_PROMPTS } from './constants';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ElevatorLoader } from './components/ElevatorLoader';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AgentProvider, useAgents } from './contexts/AgentContext';

// Lazy load views to reduce initial request count and prevent 429 errors
const ArchiveCloudNebula = lazy(() => import('./components/ArchiveCloudNebula').then(m => ({ default: m.ArchiveCloudNebula })));
const ArchivalView = lazy(() => import('./components/ArchivalView').then(m => ({ default: m.ArchivalView })));
const UserProfileView = lazy(() => import('./components/UserProfileView').then(m => ({ default: m.UserProfileView })));
const SignatureView = lazy(() => import('./components/SignatureView').then(m => ({ default: m.SignatureView })));
const MesopicLens = lazy(() => import('./components/MesopicLens').then(m => ({ default: m.MesopicLens })));
const TheEdit = lazy(() => import('./components/TheEdit').then(m => ({ default: m.TheEdit })));
const SanctuaryView = lazy(() => import('./components/SanctuaryView').then(m => ({ default: m.SanctuaryView })));
const TailorView = lazy(() => import('./components/TailorView').then(m => ({ default: m.TailorView })));
const ScryView = lazy(() => import('./components/ScryView').then(m => ({ default: m.ScryView })));
const DarkroomView = lazy(() => import('./components/DarkroomView').then(m => ({ default: m.DarkroomView })));
const ApiKeyShield = lazy(() => import('./components/ApiKeyShield').then(m => ({ default: m.ApiKeyShield })));
const ProsceniumView = lazy(() => import('./components/ProsceniumView').then(m => ({ default: m.ProsceniumView })));
const AmbientSoundscape = lazy(() => import('./components/AmbientSoundscape').then(m => ({ default: m.AmbientSoundscape })));
const CaptiveSentinel = lazy(() => import('./components/CaptiveSentinel').then(m => ({ default: m.CaptiveSentinel })));
const TheWard = lazy(() => import('./components/TheWard').then(m => ({ default: m.TheWard })));
const PatronMintView = lazy(() => import('./components/PatronMintView').then(m => ({ default: m.PatronMintView })));
const DossierView = lazy(() => import('./components/DossierView'));
const ThreadsView = lazy(() => import('./components/ThreadsView').then(m => ({ default: m.ThreadsView })));
const NarrativeThreadsView = lazy(() => import('./components/NarrativeThreadsView').then(m => ({ default: m.NarrativeThreadsView })));
const TasteGraph = lazy(() => import('./components/TasteGraph').then(m => ({ default: m.TasteGraph })));
const NotificationsView = lazy(() => import('./components/NotificationsView').then(m => ({ default: m.NotificationsView })));

const MoodboardComposer = lazy(() => import('./components/MoodboardComposer').then(m => ({ default: m.MoodboardComposer })));
const HelpView = lazy(() => import('./components/HelpView').then(m => ({ default: m.HelpView })));
const RegistryAlert = lazy(() => import('./components/RegistryAlert').then(m => ({ default: m.RegistryAlert })));
const Auth = lazy(() => import('./components/Auth').then(m => ({ default: m.Auth })));
const ImperialPatronageModal = lazy(() => import('./components/ImperialPatronageModal').then(m => ({ default: m.ImperialPatronageModal })));
const Founding50Tracker = lazy(() => import('./components/Founding50Tracker'));

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, LayoutGrid, User, Menu, X, ChevronDown, Newspaper, LogOut, ShieldAlert, Zap, Camera, Key, Radio, Activity as ActivityIcon, Archive, Moon, Sun, Scissors, FlaskConical, Eye, Radar, Compass, Info, Cpu, ShieldCheck, Briefcase, BookOpen, Volume2, VolumeX, Target, Link2, Layers, History, Settings } from 'lucide-react';
import { NotificationsPanel } from './components/NotificationsPanel';

// ... (Rest of existing subcomponents: BinderRing, NavigationDrawer, DatabaseVoid) ...
// BINDER RING COMPONENT
const BinderRing = ({ className }: { className?: string }) => (
  <div className={`absolute right-[-10px] w-5 h-5 rounded-full bg-[#151412] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9),1px_1px_1px_rgba(255,255,255,0.1)] z-50 flex items-center justify-center ${className}`}>
    <div className="w-8 h-2.5 bg-gradient-to-r from-stone-600 via-stone-300 to-stone-600 rounded-sm shadow-lg transform translate-x-1" />
  </div>
);

const NavigationDrawer: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  viewMode: string; 
  setViewMode: (mode: string) => void;
  logout: () => void;
  profile: any;
  systemStatus: any;
}> = ({ isOpen, onClose, viewMode, setViewMode, logout, profile, systemStatus }) => {
  const handleNav = (mode: string) => { setViewMode(mode); onClose(); };
  
  const menuItems = [
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
        { mode: 'mesopic', label: 'Temporal Nebula', note: 'Living Map' },
        { mode: 'darkroom', label: 'Darkroom', note: 'Unprocessed Fragments' }
    ]},
    { section: 'Threads', items: [
        { mode: 'threads', label: 'Narrative Pathing', note: 'Semantic Paths' },
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/20 z-[9999]"
          />
          
          {/* Mega Drawer */}
          <motion.div 
            initial={{ x: '-100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-[10000] bg-stone-950 border-r border-stone-800 text-white shadow-2xl w-80 h-full overflow-y-auto no-scrollbar"
          >
            <div className="px-8 py-12">
              <div className="mb-12 flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="font-serif italic text-4xl tracking-tighter text-white">The Dossier.</h2>
                  <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-stone-500 font-black mt-2">NAVIGATION INDEX AND ACCESS</p>
                </div>
                <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors">
                  <X size={20}/>
                </button>
              </div>

              <div className="flex flex-col gap-10">
                {menuItems.map((section) => (
                  <div key={section.section} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-3 bg-emerald-500" />
                      <span className="font-sans text-[9px] uppercase tracking-[0.2em] font-black text-stone-400">
                        {section.section}
                      </span>
                    </div>
                    <div className="flex flex-col gap-5 pl-4">
                      {menuItems.find(s => s.section === section.section)?.items.map((item) => (
                        <button 
                          key={item.mode} 
                          onClick={() => handleNav(item.mode)} 
                          className="w-full text-left group flex flex-col gap-0.5"
                        >
                          <div className={`font-serif italic text-xl transition-all duration-300 ${viewMode === item.mode ? 'text-emerald-400' : 'text-stone-300 group-hover:text-white'}`}>
                            {item.label}
                          </div>
                          <div className="font-sans text-[8px] uppercase tracking-widest text-stone-600 group-hover:text-stone-400 transition-colors">
                            {item.note}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
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
  const { user, profile, keyRing, updateProfile, loading: authLoading, isElevatorLoading, logout, setOracleStatus, systemStatus, activePersona, isDatabaseMissing, isOnboardingComplete, canGenerate, incrementGeneration, recordSession, generationsRemaining } = useUser();
  const { currentPalette, toggleMode } = useTheme();
  const { activeAgents } = useAgents();

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [commandDrawerOpen, setCommandDrawerOpen] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [viewMode, setViewMode] = useState<string>('studio');
  const [showQuotaShield, setShowQuotaShield] = useState(false);
  const [zineMetadata, setZineMetadata] = useState<ZineMetadata | null>(null);
  const [zineOptions, setZineOptions] = useState<ZineGenerationOptions>({
    style: 'balanced',
    theme: 'vibrant',
    contentFocus: 'balanced',
    artStyle: '',
    aestheticTone: undefined,
    goals: ''
  });
  const [isDeepRefraction, setIsDeepRefraction] = useState(false);
  const [threadValue, setThreadValue] = useState<string>('');
  const [threadMedia, setThreadMedia] = useState<MediaFile[]>([]); 
  const [threadHighFidelity, setThreadHighFidelity] = useState(false);
  const [showCaptiveSentinel, setShowCaptiveSentinel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isHeaderTranslucent, setIsHeaderTranslucent] = useState(false);
  const [tailorOverrides, setTailorOverrides] = useState<any>(null);
  const [isPatronMint, setIsPatronMint] = useState(false);
  const [showPatronModal, setShowPatronModal] = useState(false);
  const [proposalContext, setProposalContext] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('mimi_sound_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('mimi_volume');
    return saved === null ? 0.5 : parseFloat(saved);
  });
  const hasRecordedSession = useRef(false);

  useEffect(() => {
    import('./services/firebaseInit').then(({ auth }) => {
      if (user && !user.isAnonymous && auth.currentUser && !hasRecordedSession.current) {
          recordSession();
          hasRecordedSession.current = true;
      }
    });
  }, [user]);

  useEffect(() => {
    localStorage.setItem('mimi_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('mimi_volume', volume.toString());
  }, [volume]);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      // Small delay to ensure audio context can start on user interaction
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'click' } }));
      }, 50);
    }
  };

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
         window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'transition' } }));
         try {
           const zine = await fetchZineById(e.detail_id);
           if (zine) { setZineMetadata(zine); setAppState(AppState.REVEALED); }
         } catch(err) { setAppState(AppState.IDLE); }
         return;
      }
      if (e.detail) { 
        window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'click' } }));
        setViewMode(e.detail); setZineMetadata(null); setAppState(AppState.IDLE);
        if (e.detail === 'studio' && e.detail_data) {
            setThreadValue(e.detail_data.context || e.detail_data);
            if (e.detail_data.initialMedia) {
                setThreadMedia(e.detail_data.initialMedia);
            }
            if (e.detail_data.isHighFidelity) {
                setThreadHighFidelity(true);
            } else {
                setThreadHighFidelity(false);
            }
        }
        if (e.detail === 'about' && e.detail_data?.folder) {
            setProposalContext(e.detail_data.folder);
        }
      }
    };
    const handleSelectZine = (e: any) => {
      if (e.detail?.zine) {
        setZineMetadata(e.detail.zine);
        setAppState(AppState.REVEALED);
      }
    };
    const handleShowQuota = () => setShowQuotaShield(true);

    window.addEventListener('mimi:change_view', handleChangeView);
    window.addEventListener('mimi:select_zine', handleSelectZine);
    window.addEventListener('mimi:show_quota_shield', handleShowQuota);
    return () => {
      window.removeEventListener('mimi:change_view', handleChangeView);
      window.removeEventListener('mimi:select_zine', handleSelectZine);
      window.removeEventListener('mimi:show_quota_shield', handleShowQuota);
    };
  }, []);

  const handleGenerateThreadZine = useCallback(async (thread: any) => {
    if (!canGenerate) {
        setShowPatronModal(true);
        return;
    }
    setAppState(AppState.THINKING);
    setLoadingMessage("Weaving thread into narrative...");
    try {
      const pages = await generateThreadZineSpine(thread, profile, activePersona?.apiKey);
      const titles = await generateZineTitlesFromThreads([thread], profile, activePersona?.apiKey);
      const title = titles[0] || "Thread Atlas";
      
      const zineContent = {
        meta: {
          mode: "editorial" as const,
          intent: thread.narrative,
          timestamp: Date.now()
        },
        title,
        pages,
        taste_context: {
          active_archetype: "The Curator",
          active_palette: ["#000000", "#FFFFFF"],
          last_audit_summary: "Generated from thread"
        },
        structure: {
          hero_prompt: "A beautifully curated editorial view of the user's thread",
          pages: pages
        },
        visual_guidance: {
          strict_palette: ["#000000", "#FFFFFF"],
          negative_prompt: "cluttered, messy, uncurated",
          composition_density: 0.5
        }
      };

      const targetUid = profile?.uid || user?.uid || 'ghost';
      const tone = 'Editorial Stillness'; // Default tone for threads
      const id = await saveZineToProfile(targetUid, profile?.handle || 'Ghost', profile?.photoURL, zineContent, tone, undefined, false, false, false, [], thread.narrative, [], false);
      
      setZineMetadata({ 
          id, userId: targetUid, userHandle: profile?.handle || 'Ghost', title: zineContent.title, tone, timestamp: Date.now(), likes: 0, content: zineContent,
          artifacts: [], 
          originalInput: thread.narrative,
          transmissionsUsed: []
      });
      setAppState(AppState.REVEALED);
    } catch (e) {
      console.error(e);
      setAppState(AppState.IDLE);
    }
  }, [profile, user, activePersona, canGenerate]);

  const handleRefine = useCallback(async (text, media, tone, opts) => {
    if (!canGenerate) {
        setShowPatronModal(true);
        return;
    }
    setIsDeepRefraction(!!opts.deepThinking);
    setAppState(AppState.THINKING);
    window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'shimmer' } }));
    
    const personaKey = activePersona?.apiKey ? activePersona.apiKey : undefined;

    try {
      // Fetch recent transmissions to provide cultural context
      let transmissions = [];
      try {
          const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
          const { db } = await import('./services/firebase');
          const q = query(collection(db, 'public_transmissions'), orderBy('timestamp', 'desc'), limit(10));
          const snapshot = await getDocs(q);
          transmissions = snapshot.docs.map(doc => doc.data());
      } catch (e) { console.warn("MIMI // Transmission context failed to load.", e); }

      const result = await createZine(text, media, tone, profile, { ...opts, bypassTailor: true }, personaKey, transmissions, undefined, opts.selectedComponents, opts.zineOptions);
      await incrementGeneration();
      const targetUid = profile?.uid || user?.uid || 'ghost';
      const id = await saveZineToProfile(targetUid, profile?.handle || 'Ghost', profile?.photoURL, result.content, tone, undefined, opts.deepThinking, opts.isPublic, opts.isLite, media, text, transmissions, opts.isHighFidelity, opts.tags);
      setZineMetadata({ 
          id, userId: targetUid, userHandle: profile?.handle || 'Ghost', title: result.content.title, tone, timestamp: Date.now(), likes: 0, content: result.content,
          artifacts: media, 
          originalInput: text,
          transmissionsUsed: transmissions,
          isHighFidelity: opts.isHighFidelity,
          tags: opts.tags && opts.tags.length > 0 ? opts.tags : undefined
      });
      window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'success' } }));
      setAppState(AppState.REVEALED);
    } catch (e) { 
        console.error("Zine Creation Failed:", e);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "Oracle Disconnected. Please try again.", type: 'error' } 
        }));
        setAppState(AppState.IDLE); 
    }
  }, [user, profile, activePersona, canGenerate, incrementGeneration]);

  if (isDatabaseMissing) return <DatabaseVoid />;
  if (authLoading || isElevatorLoading) return <ElevatorLoader />;
  if (!user) return <Auth />;

  if (window.location.pathname.startsWith('/@')) {
      return <PublicSharePage />;
  }

  if (window.location.pathname.startsWith('/stacks/')) {
      const stackId = window.location.pathname.split('/stacks/')[1];
      return <StackView stackId={stackId} />;
  }

  if (window.location.pathname === '/privacy' || window.location.pathname === '/terms') {
      const type = window.location.pathname === '/privacy' ? 'privacy' : 'terms';
      return (
          <div className="min-h-screen bg-nous-base dark:bg-stone-950 flex flex-col items-center justify-center p-8">
              <div className="max-w-2xl w-full bg-white dark:bg-stone-900 p-12 rounded-2xl shadow-xl">
                  <h1 className="font-serif text-4xl italic mb-8">{type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h1>
                  <p className="font-sans text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                      {type === 'privacy' 
                          ? "Your debris (data) is yours. We do not sell your taste to the pedestrian masses. We merely store it in the vault so you may perceive yourself more clearly. Anchored identities (Google Auth) transmit data to the Cloud Registry. This data is encrypted and used solely for your personal archive and collective 'Social Floor' anonymized trends."
                          : "You are responsible for the debris you manifest. Mimi is an editor, not a censor, but we decree that violence and harm are aesthetically wretched and grounds for vault suspension. You own your refractions. Mimi owns the machine that refines them. It is a partnership of velvet and logic."
                      }
                  </p>
                  <button onClick={() => window.location.href = '/'} className="font-sans text-xs uppercase tracking-widest font-black text-nous-text dark:text-white border-b border-current pb-1">Return to Vault</button>
              </div>
          </div>
      );
  }

  if (isPatronMint) {
      return <PatronMintView onExit={() => setIsPatronMint(false)} />;
  }

  const viewModeTitles: Record<string, string> = {
    studio: 'Studio View',
    archival: 'Archive View',
    signature: 'Signature View',
    threads: 'Threads View',
    nebula: 'Floor View',
    help: 'System View',
    profile: 'Profile View',
    tailor: 'Tailor View',
    scry: 'Scry View',
    press: 'The Edit',
    proscenium: 'Proscenium View',
    darkroom: 'Darkroom View',
    sanctuary: 'Sanctuary View',
    ward: 'The Ward',
    dossier: 'Dossier View',
    thimble: 'Thimble Dashboard',
    signals: 'Thimble Index',
    'narrative-threads': 'Narrative Threads',
    'taste-graph': 'Taste Graph',
    'taste-constellation': 'Taste Constellation',
    'notifications': 'Registry Updates',
  };

  const currentTitle = viewModeTitles[viewMode] || 'Studio View';

  return (
    <div className="h-full w-full bg-white dark:bg-background-dark text-primary dark:text-white transition-colors duration-500 flex flex-col relative overflow-hidden">
      {/* Subtle Texture Overlay Removed for clarity */}
      
      <AmbientSoundscape enabled={soundEnabled} volume={volume} />
      <AnimatePresence>{showCaptiveSentinel && <CaptiveSentinel onClose={() => setShowCaptiveSentinel(false)} />}</AnimatePresence>
      
      <RegistryAlert />
      <ImperialPatronageModal isOpen={showPatronModal} onClose={() => setShowPatronModal(false)} isLimitReached={!canGenerate} />
      
      {showNotifications && (
        <div className="fixed top-16 right-4 z-[100]">
          <NotificationsPanel />
        </div>
      )}
      
      {/* Header */}
      <header className="canvas-texture border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-background-dark sticky top-0 z-[20] w-full px-8 py-2 flex flex-col items-center">
        <div className="absolute right-8 top-4">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-stone-500 hover:text-emerald-500 transition-colors">
            <Bell size={16} />
          </button>
        </div>
        <motion.h1 
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="font-serif text-3xl text-primary dark:text-white"
        >
          Mimi
        </motion.h1>
        <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-stone-500 mt-0.5">A CREATIVE SANCTUARY FOR YOUR DIGITAL THREADS.</p>
        <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-stone-400 mt-0.5">Home / {currentTitle}</p>
        
        <nav className="flex gap-6 mt-4">
          {[
            { label: 'STUDIO', mode: 'studio' },
            { label: 'SIGNATURE', mode: 'signature' },
            { label: 'ARCHIVE', mode: 'nebula' },
            { label: 'NARRATIVE PATHING', mode: 'narrative-threads' },
            { label: 'FLOOR', mode: 'press' },
            { label: 'UPDATES', mode: 'notifications' },
            { label: 'SYSTEM', mode: 'profile' }
          ].map(item => (
            <button 
              key={item.label} 
              onClick={() => {
                setViewMode(item.mode);
                setIsNavOpen(false);
              }}
              className="font-sans text-[9px] uppercase tracking-[0.2em] font-medium text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </button>
          ))}
          <button 
            onClick={() => setCommandDrawerOpen(true)}
            className="font-sans text-[9px] uppercase tracking-[0.2em] font-medium text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Command
          </button>
          <button 
            onClick={toggleMode}
            className="font-sans text-[9px] uppercase tracking-[0.2em] font-medium text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {currentPalette?.isDark ? 'Light' : 'Dark'}
          </button>
        </nav>
      </header>

      <NavigationDrawer 
        isOpen={isNavOpen} 
        onClose={() => setIsNavOpen(false)} 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        logout={logout}
        profile={profile}
        systemStatus={systemStatus}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Dark Spine Sidebar */}
        <aside 
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="w-16 bg-primary dark:bg-black flex flex-col items-center py-6 border-r border-canvas-border dark:border-white relative z-10 hidden md:flex cursor-pointer hover:bg-stone-900 transition-colors"
        >
          {/* Binder Rings */}
          <div className="absolute -right-1.5 top-0 bottom-0 flex flex-col justify-around py-20 pointer-events-none z-20">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-3 h-6 bg-gradient-to-r from-[#2a2a2a] via-[#4a4a4a] to-[#2a2a2a] rounded-full border border-black/50 shadow-[inset_1px_0_2px_rgba(255,255,255,0.1),1px_1px_3px_rgba(0,0,0,0.4)]"></div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-y-auto bg-white dark:bg-background-dark">
          <CommandDrawer isOpen={commandDrawerOpen} onClose={() => setCommandDrawerOpen(false)} />
          
          <AnimatePresence mode="wait">
            {appState === AppState.THINKING ? (
              <ElevatorLoader key="thinking" isDeep={isDeepRefraction} loadingMessage={loadingMessage} onBypass={(r) => { setAppState(AppState.IDLE); setThreadValue(r || ''); }} />
            ) : (
              <motion.div 
                key={viewMode} 
                className="flex-1 w-full h-full" 
                initial={{ opacity: 0, y: 5, filter: 'blur(2px)' }} 
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Suspense fallback={<div className="flex-1 flex items-center justify-center h-full text-stone-400 font-serif italic">Loading view...</div>}>
                  {appState === AppState.REVEALED && zineMetadata ? (
                    <AnalysisDisplay metadata={zineMetadata} onReset={() => { setZineMetadata(null); setAppState(AppState.IDLE); }} onUpdateMetadata={(updated) => { setZineMetadata(updated); updateZineMetadata(updated); }} />
                  ) : (
                    <>
                      {viewMode === 'studio' && (
                        <InputStudio onRefine={handleRefine} isThinking={appState === AppState.THINKING} initialValue={threadValue} initialMedia={threadMedia} initialHighFidelity={threadHighFidelity} zineOptions={zineOptions} setZineOptions={setZineOptions} />
                      )}
                      {viewMode !== 'studio' && (
                        <>
                          {viewMode === 'nebula' && <ArchiveCloudNebula onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} onGenerateThreadZine={handleGenerateThreadZine} />}
                          {viewMode === 'mesopic' && <MesopicLens />}
                          {viewMode === 'archival' && <ArchivalView onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
                          {viewMode === 'profile' && <UserProfileView />}
                          {viewMode === 'signature' && <SignatureView />}
                          {viewMode === 'tailor' && <TailorView initialOverrides={tailorOverrides} />}
                          {viewMode === 'scry' && <ScryView />}
                          {viewMode === 'press' && <TheEdit />}
                          {viewMode === 'proscenium' && <ProsceniumView onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
                          {viewMode === 'darkroom' && <DarkroomView />}
                          {viewMode === 'sanctuary' && <SanctuaryView />}
                          {viewMode === 'ward' && <TheWard />}
                          {viewMode === 'dossier' && <DossierView />}
                          {viewMode === 'thimble' && <ThimbleDashboard />}
                          {viewMode === 'signals' && <ThimbleIndex />}
                          {viewMode === 'threads' && <ThreadsView />}
                          {viewMode === 'narrative-threads' && <NarrativeThreadsView />}
                          {viewMode === 'taste-graph' && <TasteGraph />}
                          {viewMode === 'notifications' && <NotificationsView />}
                          {viewMode === 'help' && <HelpView />}
                        </>
                      )}
                    </>
                  )}
                </Suspense>
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
