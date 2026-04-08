
import React, { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { ThimbleDashboard } from './components/ThimbleDashboard';
import { CommandDrawer } from './components/CommandDrawer';
import { ThimbleIndex } from './components/ThimbleIndex';
import { PublicSharePage } from './components/PublicSharePage';
import { PublicDnaBadge } from './components/PublicDnaBadge';
import { StackView } from './components/StackView';
import { AppState, ToneTag, ZineMetadata, DriftEvent, MediaFile, ZineContent } from './types';
import { t } from './lib/i18n';
import { generateThreadZineSpine, generateZineTitlesFromThreads } from './services/geminiService';
import { createZine } from './services/zineGenerator';
import { saveZineToProfile, fetchZineById, auth, isCaptiveInWebview, updateZineMetadata } from './services/firebase';
import { ZineConfiguration } from './components/ZineConfiguration';
import { ZineGenerationOptions } from './types';
import { InputStudio } from './components/InputStudio';

import { SUPERINTELLIGENCE_PROMPTS } from './constants';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { ElevatorLoader } from './components/ElevatorLoader';
import { ViewSkeleton } from './components/loaders/ViewSkeleton';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AgentProvider, useAgents } from './contexts/AgentContext';

// Lazy load views to reduce initial request count and prevent 429 errors
import { MobileNavigation } from './components/MobileNavigation';
import { MobileStudio } from './components/MobileStudio';
import { MobileProfileModal } from './components/MobileProfileModal';
import { TheStand } from './components/TheStand';
const ArchiveCloudNebula = lazy(() => import('./components/ArchiveCloudNebula'));
const ArchivalView = lazy(() => import('./components/ArchivalView').then(m => ({ default: m.ArchivalView })));
const UserProfileView = lazy(() => import('./components/UserProfileView').then(m => ({ default: m.UserProfileView })));
const SignatureView = lazy(() => import('./components/SignatureView').then(m => ({ default: m.SignatureView })));
const TheEdit = lazy(() => import('./components/TheEdit').then(m => ({ default: m.TheEdit })));
const SanctuaryView = lazy(() => import('./components/SanctuaryView').then(m => ({ default: m.SanctuaryView })));
const TailorView = lazy(() => import('./components/TailorView').then(m => ({ default: m.TailorView })));
const ScryView = lazy(() => import('./components/ScryView').then(m => ({ default: m.ScryView })));
const DarkroomView = lazy(() => import('./components/DarkroomView').then(m => ({ default: m.DarkroomView })));
const ApiKeyShield = lazy(() => import('./components/ApiKeyShield').then(m => ({ default: m.ApiKeyShield })));
const ProsceniumView = lazy(() => import('./components/ProsceniumView').then(m => ({ default: m.ProsceniumView })));
import { TheScribe } from './components/TheScribe';
import { AmbientSoundscape } from './components/AmbientSoundscape';
import MimiIntroSequence from './components/MimiIntroSequence';
const CaptiveSentinel = lazy(() => import('./components/CaptiveSentinel').then(m => ({ default: m.CaptiveSentinel })));
const TheWard = lazy(() => import('./components/TheWard').then(m => ({ default: m.TheWard })));
const PatronMintView = lazy(() => import('./components/PatronMintView').then(m => ({ default: m.PatronMintView })));
import { MimiGateway } from './components/MimiGateway';
import { ProfileHoverCard } from './components/ProfileHoverCard';
import { AuthAction } from './components/AuthAction';

import { AestheticOnboarding } from './components/AestheticOnboarding';

const DossierView = lazy(() => import('./components/DossierView'));
const StrategyStudio = lazy(() => import('./components/StrategyStudio').then(m => ({ default: m.StrategyStudio })));
const ThreadsView = lazy(() => import('./components/ThreadsView').then(m => ({ default: m.ThreadsView })));
const NarrativeThreadsView = lazy(() => import('./components/NarrativeThreadsView').then(m => ({ default: m.NarrativeThreadsView })));
const TasteGraph = lazy(() => import('./components/TasteGraph').then(m => ({ default: m.TasteGraph })));
const LatentConstellation = lazy(() => import('./components/LatentConstellation').then(m => ({ default: m.LatentConstellation })));
const TheLens = lazy(() => import('./components/TheLens').then(m => ({ default: m.TheLens })));
const NotificationsView = lazy(() => import('./components/NotificationsView').then(m => ({ default: m.NotificationsView })));
const TheOracle = lazy(() => import('./components/TheOracle').then(m => ({ default: m.TheOracle })));
const ActionBoard = lazy(() => import('./components/ActionBoard').then(m => ({ default: m.ActionBoard })));

const MoodboardComposer = lazy(() => import('./components/MoodboardComposer').then(m => ({ default: m.MoodboardComposer })));
const CodexView = lazy(() => import('./components/CodexView').then(m => ({ default: m.CodexView })));
const CommunityManifesto = lazy(() => import('./components/CommunityManifesto').then(m => ({ default: m.CommunityManifesto })));
const RegistryAlert = lazy(() => import('./components/RegistryAlert').then(m => ({ default: m.RegistryAlert })));
const ImperialPatronageModal = lazy(() => import('./components/ImperialPatronageModal').then(m => ({ default: m.ImperialPatronageModal })));
const Founding50Tracker = lazy(() => import('./components/Founding50Tracker'));
const CheckoutSuccessView = lazy(() => import('./components/CheckoutSuccessView').then(m => ({ default: m.CheckoutSuccessView })));

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, LayoutGrid, User, Menu, X, ChevronDown, Newspaper, LogOut, ShieldAlert, Zap, Camera, Key, Radio, Activity as ActivityIcon, Archive, Moon, Sun, Scissors, FlaskConical, Eye, Radar, Compass, Info, Cpu, ShieldCheck, Briefcase, BookOpen, Volume2, VolumeX, Target, Link2, Layers, History, Settings, Loader2 } from 'lucide-react';
import { NotificationsPanel } from './components/NotificationsPanel';
import { Analytics } from '@vercel/analytics/react';

// ... (Rest of existing subcomponents: BinderRing, NavigationDrawer, DatabaseVoid) ...
// BINDER RING COMPONENT
const BinderRing = ({ className }: { className?: string }) => (
 <div className={`absolute right-[-10px] w-5 h-5 bg-[#050505] border border-nous-border z-50 flex items-center justify-center ${className}`}>
 <div className="w-8 h-2.5 bg-nous-base0 transform translate-x-1"/>
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
 { section: 'I. Create', items: [
 { mode: 'studio', label: 'Worktable', note: 'The Generative Field' },
 { mode: 'dossier', label: 'Presets', note: 'Historical Templates' },
 { mode: 'darkroom', label: 'Darkroom', note: 'Unprocessed Fragments' }
 ]},
 { section: 'II. Reflect', items: [
 { mode: 'oracle', label: 'Oracle', note: 'The Interpretive Chamber' },
 { mode: 'scribe', label: 'The Scribe', note: 'Deep Consultation' },
 { mode: 'thimble', label: 'The Thimble', note: 'Procurement & Sourcing' },
 { mode: 'archival', label: 'Archive', note: 'Creative Memory' },
 { mode: 'threads', label: 'Threads', note: 'Narrative Pathing' },
 { mode: 'latent-constellation', label: 'Constellation', note: 'Aesthetic Networking' }
 ]},
 { section: 'III. Refine', items: [
 { mode: 'tailor', label: 'Tailor Tools', note: 'Materiality & Layout' },
 { mode: 'loom', label: 'The Loom', note: 'Platform Strategy' },
 { mode: 'action-board', label: 'Action Board', note: 'Strategic Imperatives' },
 { mode: 'press', label: 'The Edit', note: 'Cultural Intelligence' }
 ]},
 { section: 'IV. Signature', items: [
 { mode: 'signature', label: 'Dashboard', note: 'Identity & Analysis' },
 { mode: 'ward', label: 'The Ward', note: 'Calibration Ritual' },
 { mode: 'profile', label: 'Profile', note: 'Settings & Keys' },
 { mode: 'taste-graph', label: 'Taste Graph', note: 'Aesthetic Embeddings' }
 ]},
 { section: 'V. Observe', items: [
 { mode: 'nebula', label: 'Feed', note: 'The Stand' },
 { mode: 'proscenium', label: 'Proscenium', note: 'Manifested Visions' }
 ]},
 { section: 'VI. System', items: [
 { mode: 'codex', label: 'Codex', note: 'Documentation' }
 ]}
 ];

 return (
 <motion.div 
 initial={{ width: 0 }} 
 animate={{ width: isOpen ? 280 : 0 }} 
 transition={{ type: 'spring', damping: 30, stiffness: 200 }}
 className="absolute top-0 left-full h-full z-10 bg-nous-base border-r border-nous-border text-nous-text overflow-hidden"
 >
 <div className="w-[280px] h-full overflow-y-auto no-scrollbar">
 <div className="px-8 py-12">
 <div className="mb-12">
 <h2 className="font-serif italic text-4xl tracking-tighter text-nous-text">The Dossier.</h2>
 <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-nous-subtle font-black mt-2">NAVIGATION INDEX AND ACCESS</p>
 </div>

 <div className="flex flex-col gap-10">
 {menuItems.map((section) => (
 <div key={section.section} className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-1 h-3 bg-nous-base0"/>
 <span className="font-sans text-[9px] uppercase tracking-[0.2em] font-black text-nous-subtle">
 {section.section}
 </span>
 </div>
 <div className="flex flex-col gap-2 pl-2">
 {section.items.map((item) => (
 <button 
 key={item.mode} 
 onClick={() => handleNav(item.mode)} 
 className={`w-full text-left group flex flex-col gap-0.5 px-4 py-2.5 rounded-full transition-all duration-300 ${viewMode === item.mode ? 'bg-[#E4E3E0] text-[#141414]' : 'hover:bg-nous-base0/30'}`}
 >
 <div className={`font-serif italic text-xl transition-all duration-300 ${viewMode === item.mode ? 'text-[#141414]' : 'text-nous-subtle group-hover:text-nous-text'}`}>
 {item.label}
 </div>
 <div className={`font-sans text-[8px] uppercase tracking-widest transition-colors ${viewMode === item.mode ? 'text-[#141414]/70' : 'text-nous-subtle group-hover:text-nous-subtle'}`}>
 {item.note}
 </div>
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </motion.div>
 );
};

const DatabaseVoid: React.FC = () => (
 <div className="fixed inset-0 z-[50000] bg-[#050505] flex flex-col items-center justify-center p-8 text-center space-y-12">
 <div className="space-y-6 max-w-lg">
 <div className="relative mx-auto w-24 h-24 border border-red-900/50 flex items-center justify-center">
 <div className="absolute inset-0 border-t border-red-500 animate-[spin_4s_linear_infinite]"/>
 <div className="absolute inset-0 flex items-center justify-center">
 <Radio size={32} className="text-red-500 animate-pulse"/>
 </div>
 </div>
 <div className="space-y-3">
 <h1 className="font-serif text-5xl italic tracking-tighter text-nous-subtle">Registry Void.</h1>
 <p className="font-mono text-[9px] uppercase tracking-widest text-red-500 font-bold">Connection Failure</p>
 </div>
 <p className="font-serif italic text-xl text-nous-subtle leading-relaxed text-balance">
 The app cannot locate the database. I have updated the configuration to look for 'mimizine'.
 </p>
 </div>

 <button onClick={() => window.location.reload()} className="px-8 py-4 border border-red-900 text-red-500 font-mono text-[9px] uppercase tracking-widest font-bold hover:bg-red-900/20 hover:text-red-400 transition-all flex items-center gap-4 animate-pulse">
 <ActivityIcon size={16} /> [ FORCE RE-INITIALIZATION ]
 </button>
 </div>
);

const OfflineBanner: React.FC = () => {
 const [isOffline, setIsOffline] = useState(!navigator.onLine);

 useEffect(() => {
 const handleOnline = () => setIsOffline(false);
 const handleOffline = () => setIsOffline(true);

 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);

 return () => {
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 };
 }, []);

 return (
 <AnimatePresence>
 {isOffline && (
 <motion.div
 initial={{ opacity: 0, y: -50 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -50 }}
 className="fixed top-0 left-0 right-0 z-[60000] bg-red-600 text-white text-center py-2 font-mono text-[10px] uppercase tracking-widest font-bold shadow-md"
 >
 <div className="flex items-center justify-center gap-2">
 <ShieldAlert size={14} />
 {t('app.offline')}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
};

import { CreditMeter } from './components/CreditMeter';

export const App: React.FC = () => {
 const { user, profile, keyRing, updateProfile, loading: authLoading, isElevatorLoading, setElevatorLoading, logout, setOracleStatus, systemStatus, activePersona, isDatabaseMissing, isOnboardingComplete, canGenerate, incrementGeneration, recordSession, login, completeEmailLogin } = useUser();
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
 theme: 'organic',
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
 const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
 const [showGateway, setShowGateway] = useState(false);
 const [hasSeenGateway, setHasSeenGateway] = useState(() => {
 return localStorage.getItem('mimi_has_seen_gateway') === 'true';
 });
 const [showProfileHover, setShowProfileHover] = useState(false);
 const [showIntro, setShowIntro] = useState(true);
 const [scribeTab, setScribeTab] = useState<'engine' | 'mimi' | 'cyrus' | 'synthesis' | null>(null);
 const profileButtonRef = useRef<HTMLDivElement>(null);
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
 recordSession().catch(err => console.error("MIMI // Record Session Unhandled Error:", err));
 hasRecordedSession.current = true;
 }
 }).catch(err => console.error("MIMI // FirebaseInit Import Error:", err));
 }, [user]);

 useEffect(() => {
 localStorage.setItem('mimi_sound_enabled', soundEnabled.toString());
 }, [soundEnabled]);

 useEffect(() => {
 localStorage.setItem('mimi_volume', volume.toString());
 }, [volume]);

 useEffect(() => {
 if (!showIntro && user?.isAnonymous && !hasSeenGateway) {
 setShowGateway(true);
 setHasSeenGateway(true);
 localStorage.setItem('mimi_has_seen_gateway', 'true');
 }
 }, [showIntro, user, hasSeenGateway]);

 const [checkoutPlan, setCheckoutPlan] = useState<'core' | 'pro' | 'lab' | null>(null);
 const [checkoutInterval, setCheckoutInterval] = useState<'month' | 'year'>('month');

 useEffect(() => {
 const params = new URLSearchParams(window.location.search);
 const checkoutStatus = params.get('checkout');
 const planParam = params.get('plan') || params.get('tier');
 const isSuccessPath = window.location.pathname.includes('/success');

 if ((checkoutStatus === 'success' || isSuccessPath) && planParam) {
 if (planParam === 'lab_annual') {
 setCheckoutPlan('lab');
 setCheckoutInterval('year');
 } else {
 setCheckoutPlan(planParam as 'core' | 'pro' | 'lab');
 setCheckoutInterval('month');
 }
 setViewMode('checkout-success');
 // Clean up URL
 window.history.replaceState({}, document.title, '/');
 } else if (checkoutStatus === 'canceled' || window.location.pathname.includes('/canceled')) {
 alert('Payment canceled.');
 window.history.replaceState({}, document.title, '/');
 }
 }, []);

 useEffect(() => {
 // Handle Email Link Sign In
 import('./services/firebaseInit').then(({ auth }) => {
 import('firebase/auth').then(({ isSignInWithEmailLink }) => {
 if (isSignInWithEmailLink(auth, window.location.href)) {
 completeEmailLogin(window.location.href).catch(err => console.error("MIMI // Complete Email Login Unhandled Error:", err));
 }
 }).catch(err => console.error("MIMI // Auth Import Error:", err));
 }).catch(err => console.error("MIMI // FirebaseInit Import Error:", err));
 }, [completeEmailLogin]);

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
 if (profile?.zineOptions) {
 setZineOptions(prev => ({ ...prev, ...profile.zineOptions }));
 }
 }, [profile?.zineOptions]);

 useEffect(() => {
 if (isCaptiveInWebview()) setShowCaptiveSentinel(true);
 
 // CHECK FOR PATRON MINT URL
 const searchParams = new URLSearchParams(window.location.search);
 if (searchParams.get('view') === 'patron_mint') {
 setIsPatronMint(true);
 // Clear query param to keep URL clean
 window.history.replaceState({}, document.title,"/");
 }

 const handleChangeView = async (e: any) => {
 if (e.detail === 'reveal_artifact' && e.detail_id) {
 window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'transition' } }));
 try {
 const zine = await fetchZineById(e.detail_id);
 if (zine) { setZineMetadata(zine); setAppState(AppState.REVEALED); }
 } catch(err) { 
 console.error("MIMI // Failed to fetch zine by id", err);
 setAppState(AppState.IDLE); 
 }
 return;
 }
 if (e.detail === 'scribe') {
 window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'click' } }));
 setScribeTab('mimi');
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
 const handleOpenPatronModal = () => setShowPatronModal(true);
 const handleOpenGateway = () => setShowGateway(true);
 const handleOpenScribe = (e: any) => {
 if (e.detail) {
 setScribeTab(e.detail);
 } else {
 setScribeTab('mimi');
 }
 };

 window.addEventListener('mimi:change_view', handleChangeView);
 window.addEventListener('mimi:select_zine', handleSelectZine);
 window.addEventListener('mimi:show_quota_shield', handleShowQuota);
 window.addEventListener('mimi:open_patron_modal', handleOpenPatronModal);
 window.addEventListener('mimi:open_gateway', handleOpenGateway);
 window.addEventListener('mimi:open_scribe', handleOpenScribe);
 return () => {
 window.removeEventListener('mimi:change_view', handleChangeView);
 window.removeEventListener('mimi:select_zine', handleSelectZine);
 window.removeEventListener('mimi:show_quota_shield', handleShowQuota);
 window.removeEventListener('mimi:open_patron_modal', handleOpenPatronModal);
 window.removeEventListener('mimi:open_gateway', handleOpenGateway);
 window.removeEventListener('mimi:open_scribe', handleOpenScribe);
 };
 }, []);

 const handleGenerateThreadZine = useCallback(async (thread: any) => {
 if (!canGenerate) {
 if (profile?.planStatus === 'ghost') {
 setShowGateway(true);
 } else {
 setShowPatronModal(true);
 }
 return;
 }
 setAppState(AppState.THINKING);
 setLoadingMessage("Weaving thread into narrative...");
 try {
 const pages = await generateThreadZineSpine(thread, profile, activePersona?.apiKey, zineOptions);
 const titles = await generateZineTitlesFromThreads([thread], profile, activePersona?.apiKey);
 const title = titles[0] ||"Thread Atlas";
 
 const zineContent = {
 meta: {
 mode:"editorial"as const,
 intent: thread.narrative,
 timestamp: Date.now()
 },
 title,
 pages,
 taste_context: {
 active_archetype:"The Curator",
 active_palette: ["#000000","#FFFFFF"],
 last_audit_summary:"Generated from thread"
 },
 structure: {
 hero_prompt:"A beautifully curated editorial view of the user's thread",
 pages: pages
 },
 visual_guidance: {
 strict_palette: ["#000000","#FFFFFF"],
 negative_prompt:"cluttered, messy, uncurated",
 composition_density: 0.5
 }
 };

 const targetUid = profile?.uid || user?.uid || 'ghost';
 const tone = 'Editorial Stillness'; // Default tone for threads
 
 await incrementGeneration(2); // Full zine cost
 
 const id = await saveZineToProfile(targetUid, profile?.handle || 'Ghost', profile?.photoURL, zineContent, tone, undefined, false, false, false, [], thread.narrative, [], false, undefined, undefined);
 
 setZineMetadata({ 
 id, userId: targetUid, userHandle: profile?.handle || 'Ghost', title: zineContent.title, tone, timestamp: Date.now(), likes: 0, content: zineContent,
 artifacts: [], 
 originalInput: thread.narrative,
 transmissionsUsed: [],
 fragmentsUsed: [],
 createdAt: Date.now(),
 theme: 'Editorial Stillness',
 aestheticVector: {}
 });
 setAppState(AppState.REVEALED);
 } catch (e) {
 console.error("MIMI // Failed to generate thread zine", e);
 setAppState(AppState.IDLE);
 }
 }, [profile, user, activePersona, canGenerate]);

 const handleRefine = useCallback(async (text, media, tone, opts) => {
 if (!canGenerate) {
 if (profile?.planStatus === 'ghost') {
 setShowGateway(true);
 } else {
 setShowPatronModal(true);
 }
 return;
 }
 setIsDeepRefraction(!!opts.deepThinking);
 setAppState(AppState.THINKING);
 window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'shimmer' } }));
 
 const personaKey = activePersona?.apiKey ? activePersona.apiKey : undefined;

 try {
 // Fetch recent transmissions to provide cultural context
 let transmissions: any[] = [];
 try {
 const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
 const { db } = await import('./services/firebase');
 const q = query(collection(db, 'public_transmissions'), orderBy('timestamp', 'desc'), limit(10));
 const snapshot = await getDocs(q);
 transmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 } catch (e) { console.warn("MIMI // Transmission context failed to load.", e); }

 const result = await createZine(text, media, tone, profile, opts, personaKey, transmissions, undefined, opts.selectedComponents, opts.zineOptions);
 
 // Inject theme from options
 if (opts.zineOptions?.theme) {
 result.content.meta = result.content.meta || {};
 result.content.meta.theme = opts.zineOptions.theme;
 }

 let cost = 2; // Default for full zine
 if (opts.isLite) cost = 1;
 if (opts.isHighFidelity || opts.deepThinking) cost = 3;

 await incrementGeneration(cost);
 const targetUid = profile?.uid || user?.uid || 'ghost';
 const id = await saveZineToProfile(targetUid, profile?.handle || 'Ghost', profile?.photoURL, result.content, tone, undefined, opts.deepThinking, opts.isPublic, opts.isLite, media, text, transmissions, opts.isHighFidelity, opts.tags, opts.zineOptions?.selectedTreatmentId);
 setZineMetadata({ 
 id, userId: targetUid, userHandle: profile?.handle || 'Ghost', title: result.content.title, tone, timestamp: Date.now(), likes: 0, content: result.content,
 artifacts: media, 
 originalInput: text,
 transmissionsUsed: transmissions,
 isHighFidelity: opts.isHighFidelity,
 treatmentId: opts.zineOptions?.selectedTreatmentId,
 tags: opts.tags && opts.tags.length > 0 ? opts.tags : undefined,
 fragmentsUsed: [],
 createdAt: Date.now(),
 theme: opts.zineOptions?.theme || 'Editorial Stillness',
 aestheticVector: {}
 });
 window.dispatchEvent(new CustomEvent('mimi:sound', { detail: { type: 'success' } }));
 setAppState(AppState.REVEALED);
 } catch (e) { 
 console.error("MIMI // Zine Creation Failed:", e);
 window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
 detail: { message:"Oracle Disconnected. Please try again.", type: 'error' } 
 }));
 setAppState(AppState.IDLE); 
 }
 }, [user, profile, activePersona, canGenerate, incrementGeneration]);

 if (isDatabaseMissing) return <DatabaseVoid />;
 
 if (authLoading || isElevatorLoading) {
 return (
 <AnimatePresence>
 <ElevatorLoader 
 minDuration={2000} 
 onComplete={() => setElevatorLoading(false)}
 />
 </AnimatePresence>
 );
 }

 if (window.location.pathname.startsWith('/auth/action')) {
 return <AuthAction />;
 }

 if (window.location.pathname.startsWith('/@')) {
 return <PublicSharePage />;
 }

 if (window.location.pathname.startsWith('/u/') && window.location.pathname.endsWith('/dna')) {
 const handle = window.location.pathname.split('/u/')[1].split('/dna')[0];
 return <PublicDnaBadge handle={handle} />;
 }

 if (window.location.pathname.startsWith('/stacks/')) {
 const stackId = window.location.pathname.split('/stacks/')[1];
 return <StackView stackId={stackId} />;
 }

 if (window.location.pathname === '/privacy' || window.location.pathname === '/terms') {
 const type = window.location.pathname === '/privacy' ? 'privacy' : 'terms';
 return (
 <div className="min-h-screen bg-nous-base flex flex-col items-center justify-center p-8">
 <div className="max-w-2xl w-full bg-[#050505] border border-nous-border p-12">
 <h1 className="font-serif text-4xl italic mb-8">{type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h1>
 <p className="font-sans text-nous-subtle leading-relaxed mb-6">
 {type === 'privacy' 
 ?"Your debris (data) is yours. We do not sell your taste to the pedestrian masses. We merely store it in the vault so you may perceive yourself more clearly. Anchored identities (Google Auth) transmit data to the Cloud Registry. This data is encrypted and used solely for your personal archive and collective 'Social Floor' anonymized trends."
 :"You are responsible for the debris you manifest. Mimi is an editor, not a censor, but we decree that violence and harm are aesthetically wretched and grounds for vault suspension. You own your refractions. Mimi owns the machine that refines them. It is a partnership of velvet and logic."
 }
 </p>
 <button onClick={() => window.location.href = '/'} className="font-sans text-xs uppercase tracking-widest font-black text-nous-text border-b border-current pb-1">Return to Vault</button>
 </div>
 </div>
 );
 }

 if (isPatronMint) {
 return <PatronMintView onExit={() => setIsPatronMint(false)} />;
 }

 if (user && profile && !isOnboardingComplete) {
  return <AestheticOnboarding />;
 }

 const viewModeTitles: Record<string, string> = {
 studio: 'Studio View',
 archival: 'Archive View',
 signature: 'Signature View',
 threads: 'Threads View',
 nebula: 'Floor View',
 codex: 'System View',
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
 'latent-constellation': 'Latent Constellation',
 'the-lens': 'The Lens',
 'notifications': 'Registry Updates',
 'oracle': 'The Oracle',
 'scribe': 'The Scribe',
 'action-board': 'Action Board',
 'loom': 'The Loom',
 };

 const currentTitle = viewModeTitles[viewMode] || 'Studio View';

 const getChamber = (mode: string) => {
 if (['studio', 'dossier', 'darkroom'].includes(mode)) return 'create';
 if (['oracle', 'scribe', 'thimble', 'archival', 'threads', 'latent-constellation', 'the-lens'].includes(mode)) return 'reflect';
 if (['tailor', 'loom', 'action-board', 'press'].includes(mode)) return 'refine';
 if (['signature', 'ward', 'profile', 'taste-graph'].includes(mode)) return 'signature';
 if (['nebula', 'proscenium'].includes(mode)) return 'observe';
 return 'system';
 };

 const chamber = getChamber(viewMode);

 const ChamberOverlay = ({ chamber }: { chamber: string }) => {
 if (chamber === 'reflect') {
 return <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0 mix-blend-overlay" />;
 }
 if (chamber === 'refine') {
 return <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 mix-blend-overlay" />;
 }
 if (chamber === 'signature') {
 return <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] z-0 mix-blend-overlay" />;
 }
 return null;
 };

 return (
 <div className="h-full w-full bg-nous-base text-nous-text transition-colors duration-500 flex flex-col relative overflow-hidden">
 <OfflineBanner />
 {showIntro && <MimiIntroSequence onComplete={() => setShowIntro(false)} />}
 {/* Subtle Texture Overlay Removed for clarity */}
 
 <AmbientSoundscape enabled={soundEnabled} volume={volume} />
 
 <AnimatePresence>{scribeTab && <TheScribe key={scribeTab} initialTab={scribeTab as 'mimi' | 'cyrus'} onClose={() => setScribeTab(null)} />}</AnimatePresence>
 <AnimatePresence>{showCaptiveSentinel && <CaptiveSentinel onClose={() => setShowCaptiveSentinel(false)} />}</AnimatePresence>
 
 <MimiGateway isOpen={showGateway} onClose={() => setShowGateway(false)} />
 
 <RegistryAlert />
 <AnimatePresence>
 {showPatronModal && (
 <ImperialPatronageModal isOpen={showPatronModal} onClose={() => setShowPatronModal(false)} isLimitReached={!canGenerate} />
 )}
 </AnimatePresence>
 <Suspense fallback={null}>
 <MobileProfileModal 
 isOpen={isMobileProfileOpen} 
 onClose={() => setIsMobileProfileOpen(false)} 
 onOpenSettings={() => {
 setIsMobileProfileOpen(false);
 setViewMode('profile');
 }} 
 />
 </Suspense>
 
 {showNotifications && (
 <div className="fixed top-16 right-4 z-[100]">
 <NotificationsPanel />
 </div>
 )}
 
 {/* Header */}
 {appState !== AppState.REVEALED && (
 <header className="hidden md:flex canvas-texture border-b border-nous-border bg-nous-base sticky top-0 z-[20] w-full px-8 py-4 items-center justify-between relative">
 {/* Texture Overlay */}
 <div className="absolute inset-0 pointer-events-none opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-0 mix-blend-overlay"/>

 <div className="flex flex-col items-start relative z-10">
 <motion.h1 
 animate={{ opacity: [1, 0.7, 1] }}
 transition={{ duration: 3, repeat: Infinity, ease:"easeInOut"}}
 className="font-serif text-4xl text-nous-text"
 >
 Mimi Zine
 </motion.h1>
 <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-nous-subtle mt-1">An AI-powered aesthetic archivist and moodboard generator.</p>
 <div className="flex items-center gap-3 mt-1">
 <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-nous-subtle">Home / {currentTitle}</p>
 <span className="text-nous-subtle text-[8px]">•</span>
 <a href="/privacy"className="font-sans text-[8px] uppercase tracking-[0.2em] text-nous-subtle hover:text-nous-subtle transition-colors">Privacy Policy</a>
 <span className="text-nous-subtle text-[8px]">•</span>
 <a href="/terms"className="font-sans text-[8px] uppercase tracking-[0.2em] text-nous-subtle hover:text-nous-subtle transition-colors">Terms of Service</a>
 </div>
 </div>
 
 <div className="flex gap-2 relative z-10 items-center">
 <CreditMeter />
 <button onClick={() => {
 if (profile?.planStatus === 'ghost') {
 window.dispatchEvent(new CustomEvent('mimi:open_gateway'));
 } else {
 window.dispatchEvent(new CustomEvent('mimi:open_patron_modal'));
 }
 }} className={`p-2 transition-colors ${
 profile?.plan === 'lab' ? 'text-nous-subtle hover:text-nous-subtle' :
 profile?.plan === 'pro' ? 'text-purple-500 hover:text-purple-400' :
 profile?.plan === 'core' ? 'text-orange-500 hover:text-orange-400' :
 'text-nous-subtle hover:text-nous-text'
 }`}>
 <ShieldCheck size={16} />
 </button>
 <button onClick={() => setScribeTab('mimi')} className="p-2 text-nous-subtle hover:text-nous-text transition-colors flex items-center gap-1.5" title="Mimi (The Archivist)">
 <Sparkles size={16} />
 <span className="font-sans text-[9px] uppercase tracking-widest font-bold hidden lg:block">Mimi</span>
 </button>
 <button onClick={() => setScribeTab('cyrus')} className="p-2 text-nous-subtle hover:text-nous-text transition-colors flex items-center gap-1.5" title="Cyrus (The Oracle)">
 <Briefcase size={16} />
 <span className="font-sans text-[9px] uppercase tracking-widest font-bold hidden lg:block">Cyrus</span>
 </button>
 <button onClick={toggleMode} className="p-2 text-nous-subtle hover:text-nous-text transition-colors">
 {currentPalette?.isDark ? <Sun size={16} /> : <Moon size={16} />}
 </button>
 <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-nous-subtle hover:text-nous-subtle transition-colors">
 <Bell size={16} />
 </button>
 {(!user || user.isAnonymous) ? (
 <button 
 onClick={() => setShowGateway(true)} 
 className="p-2 text-nous-subtle hover:text-nous-subtle transition-colors"
 title="Sign In"
 >
 <User size={16} />
 </button>
 ) : (
 <div className="relative"ref={profileButtonRef}>
 <button 
 onClick={() => setShowProfileHover(!showProfileHover)}
 className="ml-2 flex items-center gap-1.5 px-3 py-1.5 border border-nous-border hover:bg-nous-base transition-colors text-[9px] font-mono uppercase tracking-widest font-bold text-nous-subtle hover:text-nous-subtle"
 >
 {profile?.photoURL ? (
 <img src={profile.photoURL} alt="Profile"className="w-4 h-4 object-cover grayscale"referrerPolicy="no-referrer"/>
 ) : (
 <User size={12} />
 )}
 <span>{profile?.handle || 'Swan'}</span>
 </button>
 <ProfileHoverCard 
 isOpen={showProfileHover} 
 onClose={() => setShowProfileHover(false)} 
 triggerRef={profileButtonRef}
 />
 </div>
 )}
 </div>
 </header>
 )}

 {/* Mobile Header */}
 {appState !== AppState.REVEALED && (
 <header className="md:hidden flex flex-col p-6 mt-4 relative z-[20] bg-transparent">
 <div className="flex items-center justify-between w-full">
 <div className="font-['Cormorant_Garamond',serif] text-3xl font-light text-nous-text tracking-wide">Mimi Zine</div>
 <div className="flex items-center gap-2">
 <CreditMeter />
 <button onClick={() => setScribeTab('mimi')} className="p-2 text-nous-subtle hover:text-nous-text transition-opacity">
 <Sparkles size={24} strokeWidth={1.25} />
 </button>
 <button onClick={() => setScribeTab('cyrus')} className="p-2 text-nous-subtle hover:text-nous-text transition-opacity">
 <Briefcase size={24} strokeWidth={1.25} />
 </button>
 <button 
 onClick={() => {
 if (profile?.planStatus === 'ghost') {
 window.dispatchEvent(new CustomEvent('mimi:open_gateway'));
 } else {
 window.dispatchEvent(new CustomEvent('mimi:open_patron_modal'));
 }
 }} 
 className={`p-2 transition-opacity hover:opacity-70 ${
 profile?.plan === 'lab' ? 'text-nous-subtle' :
 profile?.plan === 'pro' ? 'text-purple-500' :
 profile?.plan === 'core' ? 'text-orange-500' :
 'text-nous-text '
 }`}
 >
 <ShieldCheck size={24} strokeWidth={1.25} />
 </button>
 <button 
 onClick={() => {
 if (!user || user.isAnonymous) {
 setShowGateway(true);
 } else {
 setIsMobileProfileOpen(true);
 }
 }} 
 className="p-2 text-nous-text hover:opacity-70 transition-opacity"
 >
 {profile?.photoURL ? (
 <img src={profile.photoURL} alt="Profile"className="w-6 h-6 object-cover grayscale"referrerPolicy="no-referrer"/>
 ) : (
 <User size={24} strokeWidth={1.25} />
 )}
 </button>
 </div>
 </div>
 <div className="flex flex-col mt-2">
 <p className="font-sans text-[8px] uppercase tracking-[0.1em] text-nous-subtle leading-tight">An AI-powered aesthetic archivist and moodboard generator.</p>
 <div className="flex items-center gap-2 mt-1">
 <a href="/privacy"className="font-sans text-[8px] uppercase tracking-[0.2em] text-nous-subtle hover:text-nous-subtle transition-colors">Privacy</a>
 <span className="text-nous-subtle text-[8px]">•</span>
 <a href="/terms"className="font-sans text-[8px] uppercase tracking-[0.2em] text-nous-subtle hover:text-nous-subtle transition-colors">Terms</a>
 </div>
 </div>
 </header>
 )}

 <div className="flex flex-1 overflow-hidden">
 {/* Dark Spine Sidebar */}
 {appState !== AppState.REVEALED && (
 <aside 
 onClick={() => setIsNavOpen(!isNavOpen)}
 className="w-16 bg-nous-text flex flex-col items-center py-6 border-r border-nous-border relative z-20 hidden md:flex cursor-pointer hover:bg-nous-base transition-colors"
 >
 {/* Binder Rings */}
 <div className="absolute -right-1.5 top-0 bottom-0 flex flex-col justify-around py-20 pointer-events-none z-20">
 {[...Array(8)].map((_, i) => (
 <div key={i} className="w-3 h-6 bg-[#050505] border border-nous-border"></div>
 ))}
 </div>
 
 {/* Drawer injected here */}
 <NavigationDrawer 
 isOpen={isNavOpen} 
 onClose={() => setIsNavOpen(false)} 
 viewMode={viewMode} 
 setViewMode={setViewMode} 
 logout={logout}
 profile={profile}
 systemStatus={systemStatus}
 />
 </aside>
 )}

 {/* Main Content Area */}
 <main className="flex-1 flex flex-col relative overflow-y-auto bg-nous-base">
 <CommandDrawer isOpen={commandDrawerOpen} onClose={() => setCommandDrawerOpen(false)} />
 
 <AnimatePresence mode="wait">
 <motion.div 
 key={viewMode} 
 className="flex-1 w-full h-full relative"
 initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }} 
 animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
 exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
 >
 <ChamberOverlay chamber={chamber} />
 <AnimatePresence>
 {appState === AppState.THINKING && (
 <ElevatorLoader 
 isDeep={isDeepRefraction} 
 loadingMessage={loadingMessage}
 />
 )}
 </AnimatePresence>
 <Suspense fallback={<ViewSkeleton />}>
 {appState === AppState.REVEALED && zineMetadata ? (
 <AnalysisDisplay 
 metadata={zineMetadata} 
 onReset={() => { setZineMetadata(null); setAppState(AppState.IDLE); }} 
 onUpdateMetadata={(updated) => { setZineMetadata(updated); updateZineMetadata(updated).catch(console.error); }} 
 onExtractTailorLogic={(logic) => {
 setTailorOverrides(logic);
 setViewMode('tailor');
 setAppState(AppState.IDLE);
 setZineMetadata(null);
 }}
 />
 ) : (
 <>
 {viewMode === 'studio' && (
 <>
 <div className="hidden md:block h-full">
 <InputStudio onRefine={handleRefine} isThinking={appState === AppState.THINKING} initialValue={threadValue} initialMedia={threadMedia} initialHighFidelity={threadHighFidelity} zineOptions={zineOptions} setZineOptions={setZineOptions} />
 </div>
 <div className="block md:hidden h-full">
 <MobileStudio 
 onPublish={async (content, title) => { 
 if (!user) return;
 try {
 const zineContent: ZineContent = {
 meta: { mode: 'editorial', intent: 'Mobile Zine', timestamp: Date.now() },
 taste_context: { active_archetype: 'Architect', active_palette: [] },
 structure: { hero_prompt: '', pages: [] },
 visual_guidance: { strict_palette: [], negative_prompt: '', composition_density: 5 },
 title,
 pages: [{
 pageNumber: 0,
 headline: title,
 bodyCopy: content,
 imagePrompt: ''
 }]
 };
 await saveZineToProfile(user.uid, profile?.handle || 'Swan', profile?.photoURL, zineContent, 'RAW');
 setViewMode('stand');
 } catch (e) {
 console.error('MIMI // Failed to save zine:', e);
 alert('Failed to save zine. Please try again.');
 }
 }} 
 onClose={() => setViewMode('stand')} 
 onOpenProfile={() => {
 if (!user || user.isAnonymous) {
 login();
 } else {
 setIsMobileProfileOpen(true);
 }
 }}
 />
 </div>
 </>
 )}
 {viewMode !== 'studio' && (
 <>
 {viewMode === 'stand' && <TheStand onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
 {viewMode === 'oracle' && <TheOracle />}
 {viewMode === 'nebula' && <ArchiveCloudNebula onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} onGenerateThreadZine={handleGenerateThreadZine} />}
 {viewMode === 'archival' && <ArchivalView onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
 {viewMode === 'profile' && <UserProfileView />}
 {viewMode === 'signature' && <SignatureView />}
 {viewMode === 'tailor' && <TailorView initialOverrides={tailorOverrides} onOverridesConsumed={() => setTailorOverrides(null)} />}
 {viewMode === 'scry' && <ScryView />}
 {viewMode === 'press' && <TheEdit />}
 {viewMode === 'proscenium' && <ProsceniumView onSelectZine={(z) => { setZineMetadata(z); setAppState(AppState.REVEALED); }} />}
 {viewMode === 'darkroom' && <DarkroomView />}
 {viewMode === 'sanctuary' && <SanctuaryView />}
 {viewMode === 'ward' && <TheWard onClose={() => setViewMode('studio')} />}
 {viewMode === 'dossier' && <DossierView />}
 {viewMode === 'thimble' && <ThimbleDashboard />}
 {viewMode === 'loom' && <StrategyStudio />}
 {viewMode === 'action-board' && <ActionBoard />}
 {viewMode === 'signals' && <ThimbleIndex />}
 {viewMode === 'threads' && <ThreadsView />}
 {viewMode === 'narrative-threads' && <NarrativeThreadsView />}
 {viewMode === 'taste-graph' && <TasteGraph />}
 {viewMode === 'latent-constellation' && <LatentConstellation />}
 {viewMode === 'the-lens' && <TheLens />}
 {viewMode === 'notifications' && <NotificationsView />}
 {viewMode === 'codex' && <CodexView />}
 {viewMode === 'manifesto' && <CommunityManifesto />}
 {viewMode === 'checkout-success' && checkoutPlan && (
 <CheckoutSuccessView 
 plan={checkoutPlan} 
 interval={checkoutInterval}
 onContinue={() => setViewMode('studio')} 
 />
 )}
 </>
 )}
 </>
 )}
 </Suspense>
 </motion.div>
 </AnimatePresence>
 <MobileNavigation currentView={viewMode} setViewMode={setViewMode} profile={profile} />
 </main>
 </div>
 <Analytics />
 </div>
 );
};
