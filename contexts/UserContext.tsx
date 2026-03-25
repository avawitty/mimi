// @ts-nocheck
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserProfile, UserPreferences, Persona, TailorLogicDraft, NarrativeThread } from '../types';
import { getLocalProfile, saveProfileLocally } from '../services/localArchive';
import { 
  bootstrapAuth, ensureAuth, getUserProfile, saveUserProfile, commitGlobalHandshake,
  anchorIdentity, linkIdentity, handleAuthRedirect, startGhostSession, 
  initializeAuthPersistence, getUserPreferences, saveUserPreferences, 
  subscribeToUserProfile, subscribeToUserPreferences, migrateLocalToCloud, db, auth,
  isCaptiveInWebview
} from '../services/firebase';
import { recordSession as recordSessionService } from '../services/retentionService';
import { onAuthStateChanged } from 'firebase/auth';
import { Star } from 'lucide-react';
import { setGlobalKeyRing } from '../services/geminiService';
import { hasAccess } from '../constants';
import { fetchUserSubscription } from '../services/membershipPipeline';

interface SystemStatus {
  auth: 'syncing' | 'anchored' | 'offline';
  oracle: 'ready' | 'saturated' | 'unavailable';
  storage: 'nominal' | 'limited' | 'full';
}

export interface FeatureFlags {
  scry: boolean;
  darkroom: boolean;
  theLens: boolean;
  tailor: boolean;
  proposal: boolean;
}

interface UserContextType {
  user: { uid: string, isAnonymous: boolean, email?: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
  isElevatorLoading: boolean;
  setElevatorLoading: (loading: boolean) => void;
  updateProfile: (profile: UserProfile) => Promise<void>;
  toggleZineStar: (zineId: string) => Promise<void>;
  isOnboardingComplete: boolean;
  login: (forceRedirect?: boolean) => Promise<void>;
  loginWithEmail: (email: string, redirectUrl: string) => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string) => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  upgradeGhostAccount: (email: string, password: string) => Promise<void>;
  completeEmailLogin: (url: string) => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  ghostLogin: () => Promise<void>;
  speedGhostEntrance: () => Promise<void>;
  linkAccount: (forceRedirect?: boolean) => Promise<void>;
  keyLogin: (handle: string, apiKey: string) => Promise<void>;
  verifyIdentity: () => Promise<void>;
  isEnvironmentRestricted: boolean;
  isDatabaseMissing: boolean; 
  authError: string | null;
  hasApiKey: boolean;
  openKeySelector: () => Promise<void>;
  logout: () => void;
  refreshHasApiKey: () => Promise<void>;
  systemStatus: SystemStatus;
  setOracleStatus: (status: SystemStatus['oracle']) => void;
  keyRing: string[];
  addKeyToRing: (key: string) => void;
  removeKeyFromRing: (key: string) => void;
  featureFlags: FeatureFlags;
  toggleFeature: (key: keyof FeatureFlags) => void;
  enabledAlgos: string[];
  toggleAlgo: (algoId: string) => void;
  personas: Persona[];
  activePersonaId: string | undefined;
  activePersona: Persona | undefined;
  switchPersona: (personaId: string) => void;
  createPersona: (name: string, apiKey?: string, identityReframe?: string) => Promise<void>;
  updatePersona: (persona: Persona) => Promise<void>;
  deletePersona: (personaId: string) => Promise<void>;
  // Patron & Generation Tracking
  canGenerate: boolean;
  generationsRemaining: number;
  activatePatron: (key: string) => Promise<void>;
  upgradePlan: (plan: 'core' | 'pro' | 'lab', interval?: 'month' | 'year') => Promise<void>;
  incrementGeneration: () => Promise<void>;
  recordSession: () => Promise<void>;
  activeThread: NarrativeThread | null;
  setActiveThread: (thread: NarrativeThread | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const DEFAULT_FLAGS: FeatureFlags = {
  scry: true,
  darkroom: true,
  theLens: true,
  tailor: true,
  proposal: true
};

const DEFAULT_DRAFT: TailorLogicDraft = {
  positioningCore: {
    anchors: { culturalReferences: ['Brutalism', 'Cyber-Noir', 'Analog-Glitch'], ideologicalBias: [] },
    aestheticCore: { silhouettes: [], materiality: [], eraBias: 'Post-Digital', presentation: 'Androgynous', density: 5, entropy: 5, tags: [] },
    positioningAxis: 'Signal vs Noise',
    authorityClaim: 'Aesthetic infrastructure for long-term cultural positioning.',
    exclusionPrinciples: ['Avoid reactive trend commentary', 'Refuse cross-cluster dilution without thesis']
  },
  algoDials: {
    webScry: 50,
    memorySynthesis: 50,
    dissonance: 10
  },
  expressionEngine: {
    chromaticRegistry: { primaryPalette: [], baseNeutral: '#F2F1ED', accentSignal: '#1C1917' },
    typographyIntent: { styleDescription: 'Cormorant Garamond', weightPreference: 'Light' },
    narrativeVoice: { emotionalTemperature: 'CLINICAL', structureBias: 'CONCISE', lexicalDensity: 5, restraintLevel: 8, voiceNotes: '' },
    brandIdentity: { fonts: { serif: 'Cormorant Garamond', sans: 'Inter', mono: 'Space Mono' }, logo: '', palette: ['#000000', '#FFFFFF'] }
  },
  strategicVectors: {
    expansionTolerance: 5,
    fiscalVelocity: 'measured',
    desireVectors: { deepen: [], reduce: [], experiment: [], refuse: [] },
    saturationAwareness: { oversaturatedClusters: [], fragileDifferentiators: [] }
  },
  diagnostics: {
    contradictionFlags: [],
    dilutionRisks: [],
    authorityStrengthScore: 50,
    driftVulnerability: 5
  },
  strategicSummary: {
    identityVector: 'A baseline identity vector focused on signal over noise.',
    authorityAnchor: 'Aesthetic infrastructure.',
    exclusionRules: [],
    elasticityIndex: 5,
    tonalConstraints: 'Restrained and precise.',
    aestheticDNA: 'Post-Digital Minimalism.'
  },
  celestialCalibration: { enabled: false, zodiac: 'gemini', astrologicalLineage: '', seasonalAlignment: '' },
  generationTemperature: 0.8,
  draftStatus: 'provisional',
  lastTailored: Date.now()
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.info("MIMI // UserProvider Rendering");
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<{ uid: string, isAnonymous: boolean, email?: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isElevatorLoading, setElevatorLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEnvironmentRestricted, setIsEnvironmentRestricted] = useState(false);
  const [isDatabaseMissing, setIsDatabaseMissing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    auth: 'syncing',
    oracle: 'ready',
    storage: 'nominal'
  });
  
  const [activeThread, setActiveThread] = useState<NarrativeThread | null>(null);
  
  const [keyRing, setKeyRing] = useState<string[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => {
    try {
      const stored = localStorage.getItem('mimi_feature_flags');
      return stored ? { ...DEFAULT_FLAGS, ...JSON.parse(stored) } : DEFAULT_FLAGS;
    } catch {
      return DEFAULT_FLAGS;
    }
  });

  // Listeners Ref
  const unsubscribeProfile = useRef<(() => void) | null>(null);
  const unsubscribePrefs = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("MIMI // Unhandled Rejection:", event.reason);
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mimi_key_ring');
      if (stored) {
          const keys = JSON.parse(stored);
          setKeyRing(keys);
          setGlobalKeyRing(keys);
      }
    } catch(e) {}
  }, []);

  const toggleFeature = (key: keyof FeatureFlags) => {
    setFeatureFlags(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('mimi_feature_flags', JSON.stringify(next));
      return next;
    });
  };

  const toggleAlgo = (algoId: string) => {
    if (!profile) return;
    const current = profile.enabledAlgos || [];
    const next = current.includes(algoId) ? current.filter(a => a !== algoId) : [...current, algoId];
    updateProfile({ ...profile, enabledAlgos: next });
  };

  const addKeyToRing = (key: string) => {
    const trimmed = key.trim();
    if (!trimmed || keyRing.includes(trimmed)) return;
    const updated = [...keyRing, trimmed];
    setKeyRing(updated);
    setGlobalKeyRing(updated);
    localStorage.setItem('mimi_key_ring', JSON.stringify(updated));
    setOracleStatus('ready');
  };

  const removeKeyFromRing = (key: string) => {
    const updated = keyRing.filter(k => k !== key);
    setKeyRing(updated);
    setGlobalKeyRing(updated);
    localStorage.setItem('mimi_key_ring', JSON.stringify(updated));
  };

  const initStarted = useRef(false);
  const reconciliationInProgress = useRef<string | null>(null);

  const refreshHasApiKey = useCallback(async () => {
    if (keyRing.length > 0) { setHasApiKey(true); return; }
    
    // If we have an environment key, we are technically "ready" for basic models
    if (process.env.API_KEY || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY)) {
        setHasApiKey(true);
        return;
    }

    try {
      const aistudio = (window as any).aistudio;
      if (aistudio?.hasSelectedApiKey) {
        const has = await aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      }
    } catch (e) { setHasApiKey(false); }
  }, [keyRing]);

  const setOracleStatus = (status: SystemStatus['oracle']) => {
    setSystemStatus(prev => ({ ...prev, oracle: status }));
  };

  useEffect(() => {
    refreshHasApiKey();
    const handleKeyVoid = () => {
      setOracleStatus('unavailable');
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
          detail: { 
              message: "Oracle frequency saturated. Add keys to Ring or wait.", 
              type: 'error' 
          } 
      }));
    };
    window.addEventListener('mimi:key_void', handleKeyVoid);
    return () => window.removeEventListener('mimi:key_void', handleKeyVoid);
  }, [refreshHasApiKey, keyRing]);

  const ensurePersonas = (p: UserProfile): UserProfile => {
    if (p.personas && p.personas.length > 0) {
        if (!p.activePersonaId) {
            return { ...p, activePersonaId: p.personas[0].id };
        }
        return p;
    }
    const defaultPersona: Persona = {
        id: 'persona_default',
        name: 'Personal',
        tailorDraft: p.tailorDraft || DEFAULT_DRAFT,
        createdAt: Date.now()
    };
    return {
        ...p,
        personas: [defaultPersona],
        activePersonaId: defaultPersona.id
    };
  };

  const reconcileProfile = useCallback(async (fbUser: any) => {
    const uid = auth.currentUser?.uid || fbUser.uid;
    if (!uid) {
      console.warn("MIMI // Reconcile: No UID available.");
      setUser(null); setProfile(null); setLoading(false);
      setSystemStatus(prev => ({ ...prev, auth: 'offline' }));
      if (unsubscribeProfile.current) unsubscribeProfile.current();
      if (unsubscribePrefs.current) unsubscribePrefs.current();
      reconciliationInProgress.current = null;
      return;
    }
    
    console.info("MIMI // Reconciling Profile for:", uid, fbUser.isAnonymous ? "(Ghost)" : "(Swan)");
    if (reconciliationInProgress.current === uid) {
      console.info("MIMI // Reconciliation already in progress for this UID. Skipping.");
      return;
    }
    reconciliationInProgress.current = uid;
    setSystemStatus(prev => ({ ...prev, auth: 'syncing' }));

    // Clear existing listeners to prevent duplication
    if (unsubscribeProfile.current) unsubscribeProfile.current();
    if (unsubscribePrefs.current) unsubscribePrefs.current();

    try {
      const currentLocal = await getLocalProfile();
      let initialProfile = currentLocal;

      // 1. Initial Cloud Check & potential Migration
      let cloudProfileSnap = null;
      let cloudPrefsSnap = null;
      
      // Retry logic for "permission-denied" which often happens during the auth-to-firestore propagation window
      let retries = 3;
      while (retries > 0) {
          try {
              [cloudProfileSnap, cloudPrefsSnap] = await Promise.all([
                  getUserProfile(uid),
                  getUserPreferences(uid)
              ]);
              break; 
          } catch (err: any) {
              if (err.code === 'permission-denied' && retries > 1) {
                  console.warn(`MIMI // Permission Denied. Retrying in 500ms... (${retries} left)`);
                  await new Promise(r => setTimeout(r, 500));
                  retries--;
              } else {
                  throw err;
              }
          }
      }
      
      if (reconciliationInProgress.current !== uid) {
          console.info("MIMI // User changed during reconciliation. Aborting.");
          return;
      }

      // Fetch subscription data
      const subscription = await fetchUserSubscription(uid);
      
      // 2. Setup Real-time Listeners
      unsubscribeProfile.current = subscribeToUserProfile(uid, async (pData) => {
         const subscription = await fetchUserSubscription(uid);
         setProfile(prev => {
             const merged = { ...(prev || {}), ...pData, uid: uid, subscription } as UserProfile;
             return ensurePersonas(merged);
         });
      });

      unsubscribePrefs.current = subscribeToUserPreferences(uid, async (prefsData) => {
         const subscription = await fetchUserSubscription(uid);
         setProfile(prev => {
             const merged = { ...(prev || {}), ...prefsData, subscription } as UserProfile;
             return ensurePersonas(merged);
         });
      });
      
      // Construct initial state from one-time fetch to unblock UI immediately
      // (Listeners will follow up with updates)
      const mergedCloud = { 
          ...(cloudProfileSnap || {}), 
          ...(cloudPrefsSnap || {}),
          uid: uid,
          isSwan: !fbUser.isAnonymous,
          email: fbUser.email,
          photoURL: (cloudProfileSnap?.photoURL) || fbUser.photoURL || null,
          subscription
      } as UserProfile;

      // If migration happened, local is the best source until listeners fire
      // If cloud data existed, use that.
      if (cloudProfileSnap || cloudPrefsSnap) {
          initialProfile = mergedCloud;
      } else if (currentLocal) {
          initialProfile = { 
            ...currentLocal, 
            uid: uid, 
            isSwan: !fbUser.isAnonymous, 
            email: fbUser.email,
            photoURL: currentLocal.photoURL || fbUser.photoURL || null,
            subscription
          };
      } else {
          // Brand new user, no local data either
          initialProfile = {
              uid: uid,
              handle: (fbUser.isAnonymous ? 'Ghost_' : 'Swan_') + uid.slice(-4),
              isSwan: !fbUser.isAnonymous,
              email: fbUser.email,
              photoURL: fbUser.photoURL || null,
              createdAt: Date.now(),
              lastActive: Date.now(),
              onboardingComplete: false,
              tasteProfile: { archetype_weights: {}, color_frequency: {} },
              starredZineIds: [],
              subscription
          };
      }

      const safeProfile = ensurePersonas(initialProfile);
      setProfile(safeProfile);
      setUser({ uid: fbUser.uid, isAnonymous: !!fbUser.isAnonymous, email: fbUser.email });
      setAuthError(null);
      setSystemStatus(prev => ({ ...prev, auth: 'anchored' }));
      
      // Save local backup for offline resilience
      await saveProfileLocally(safeProfile);
      
      // Ensure profile exists in cloud
      if (!cloudProfileSnap && navigator.onLine) {
          try {
              await saveUserProfile(safeProfile);
          } catch (e) {
              console.warn("MIMI // Failed to save initial profile to cloud", e);
          }
      }

    } catch (e: any) {
      console.error("MIMI // Reconciliation Failed", e);
      setSystemStatus(prev => ({ ...prev, auth: 'offline' }));
      // Fallback to local
      if (!profile) {
          const local = await getLocalProfile();
          if (local) setProfile(ensurePersonas(local));
      }
    } finally {
      setLoading(false);
      reconciliationInProgress.current = null;
      document.body.classList.add('hydrated');
    }
  }, [isEnvironmentRestricted]);

  const speedGhostEntrance = useCallback(async () => {
    let ghostUid = '';
    try {
      const result = await startGhostSession();
      ghostUid = result.user.uid;
    } catch (e: any) {
      ghostUid = 'local_ghost_' + Math.random().toString(36).substr(2, 6);
    }
      
    const speedProfile: UserProfile = {
      uid: ghostUid,
      handle: 'Ghost_' + ghostUid.slice(-4),
      photoURL: `https://ui-avatars.com/api/?name=G&background=1c1917&color=fff`,
      isSwan: false,
      currentSeason: 'blooming',
      createdAt: Date.now(),
      lastActive: Date.now(),
      tasteProfile: { archetype_weights: {}, color_frequency: {} },
      starredZineIds: [],
      onboardingComplete: false
    };

    const safeSpeedProfile = ensurePersonas(speedProfile);
    await saveProfileLocally(safeSpeedProfile);
    setProfile(safeSpeedProfile);
    setUser({ uid: ghostUid, isAnonymous: true });
    setLoading(false);
    setSystemStatus(prev => ({ ...prev, auth: 'anchored' }));
    document.body.classList.add('hydrated');
  }, []);

  const ghostLogin = useCallback(async () => {
    setElevatorLoading(true);
    try {
      const result = await startGhostSession();
      await reconcileProfile(result.user);
    } catch (e: any) {
      if (e.code === 'auth/unauthorized-domain') setIsEnvironmentRestricted(true);
      await speedGhostEntrance();
    } finally {
      setElevatorLoading(false);
    }
  }, [reconcileProfile, speedGhostEntrance]);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const performRitual = async () => {
      console.info("MIMI // Initiating Auth Ritual...");
      try {
        await initializeAuthPersistence();
        const authInstance = await ensureAuth();

        // 1. Handle Email Link Sign-In
        const emailForSignIn = window.localStorage.getItem('emailForSignIn');
        if (emailForSignIn) {
            try {
                const { checkAndSignInWithEmailLink } = await import('../services/firebaseUtils');
                const result = await checkAndSignInWithEmailLink(emailForSignIn, window.location.href);
                if (result) {
                    console.info("MIMI // Email Link Sign-In Successful");
                    window.localStorage.removeItem('emailForSignIn');
                    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
                        detail: { message: "Identity Anchored via Email Link.", type: 'success' } 
                    }));
                }
            } catch (e) {
                console.warn("MIMI // Email Link Sign-In Error:", e);
            }
        }

        // 1. Handle Redirect Result FIRST
        // We wait for this to resolve before we trust the onAuthStateChanged(null) signal
        let rResult = null;
        try {
          rResult = await handleAuthRedirect();
        } catch (e) {
          console.warn("MIMI // Redirect Result Error:", e);
        }

        if (rResult && rResult.user) {
           console.info("MIMI // Redirect Result Detected:", rResult.user.email);
           await reconcileProfile(rResult.user);
           
           // Notify user and switch to profile view
           setTimeout(() => {
             window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
                 detail: { message: "Identity Anchored Successfully.", type: 'success' } 
             }));
             window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }));
           }, 1000);
        }

        // 2. Setup Observer
        const unsubscribe = onAuthStateChanged(authInstance, async (fbUser) => {
          try {
            console.info("MIMI // onAuthStateChanged called with:", fbUser ? fbUser.uid : "null", fbUser ? "isAnonymous: " + fbUser.isAnonymous : "");
            if (fbUser) {
              console.info("MIMI // Auth State Changed: Active", fbUser.uid);
              await reconcileProfile(fbUser);
            } else {
               console.info("MIMI // Auth State Changed: Null");
               
               // CRITICAL: Only fallback to ghost if we are NOT in a redirect flow
               // and we don't already have a profile (to prevent flicker)
               if (!rResult && !profile) {
                   const local = await getLocalProfile();
                   // Only restore if it is explicitly a ghost profile
                   if (local && (local.uid.startsWith('local_ghost_') || local.isAnonymous === true || local.isSwan === false)) {
                     // Double check it's not a real Firebase UID that got mislabeled
                     if (local.uid.length > 20 && !local.uid.startsWith('local_ghost_')) {
                       console.info("MIMI // Stale Registered Profile Found. Entering Speed Ghost Flow.");
                       await speedGhostEntrance();
                     } else {
                       console.info("MIMI // Local Archive Found. Restoring Ghost Identity.");
                       setProfile(ensurePersonas(local));
                       setUser({ uid: local.uid, isAnonymous: true });
                       setSystemStatus(prev => ({ ...prev, auth: 'anchored' }));
                     }
                   } else {
                     console.info("MIMI // No Identity Found or Session Expired. Entering Speed Ghost Flow.");
                     await speedGhostEntrance();
                   }
               }
               
               if (!fbUser && !rResult) {
                  setLoading(false);
               }
            }
            setIsInitializing(false);
          } catch (err) {
            console.error("MIMI // onAuthStateChanged Error:", err);
            setLoading(false);
            setIsInitializing(false);
          }
        });

        unsubscribeProfile.current = unsubscribe;
      } catch (e) {
        console.error("MIMI // Ritual Failed:", e);
        setLoading(false);
        setIsInitializing(false);
        document.body.classList.add('hydrated');
      }
    };

    performRitual();
  }, [reconcileProfile, speedGhostEntrance]);

  const updateProfile = async (newProfile: UserProfile) => {
    try {
      const currentUid = user?.uid || newProfile.uid;
      const updated = { ...newProfile, uid: currentUid, lastActive: Date.now() };
      
      // Optimistic Update
      setProfile(updated);
      await saveProfileLocally(updated);
      
      if (navigator.onLine && user && !currentUid.startsWith('local_')) {
        // Split data into Identity (Public) and Preferences (Private)
        const { tailorDraft, personas, activePersonaId, starredZineIds, lastAuditReport, ...identity } = updated;
        const preferences: UserPreferences = {
            tailorDraft,
            starredZineIds,
            lastAuditReport,
            personas,
            activePersonaId,
            zineOptions: updated.zineOptions
        };
        
        await Promise.all([
            saveUserProfile(identity as UserProfile), // Writes to 'profiles_public'
            saveUserPreferences(currentUid, preferences) // Writes to 'userPreferences'
        ]);
        
        // If handle or photoURL changed, trigger global handshake
        if (profile && (profile.handle !== updated.handle || profile.photoURL !== updated.photoURL)) {
          await commitGlobalHandshake(currentUid, updated.handle, updated.photoURL || null);
        }
      }
    } catch (e) { 
      console.error("MIMI // updateProfile error:", e);
    }
  };

  const switchPersona = async (personaId: string) => {
      if (!profile) return;
      try {
        const target = profile.personas?.find(p => p.id === personaId);
        if (target) {
            await updateProfile({ ...profile, activePersonaId: personaId, tailorDraft: target.tailorDraft });
        }
      } catch (e) {
        console.error("MIMI // Failed to switch persona", e);
      }
  };

  const createPersona = async (name: string, apiKey?: string, identityReframe?: string) => {
      if (!profile) return;
      try {
        const newPersona: Persona = {
            id: `persona_${Date.now()}`,
            name,
            tailorDraft: { 
                ...DEFAULT_DRAFT,
                strategicSummary: {
                    ...DEFAULT_DRAFT.strategicSummary,
                    aestheticDNA: identityReframe || DEFAULT_DRAFT.strategicSummary.aestheticDNA
                }
            },
            apiKey,
            createdAt: Date.now()
        };
        const updatedPersonas = [...(profile.personas || []), newPersona];
        await updateProfile({ ...profile, personas: updatedPersonas, activePersonaId: newPersona.id, tailorDraft: newPersona.tailorDraft });
      } catch (e) {
        console.error("MIMI // Failed to create persona", e);
      }
  };

  const updatePersona = async (updatedPersona: Persona) => {
      if (!profile) return;
      try {
        const updatedPersonas = (profile.personas || []).map(p => p.id === updatedPersona.id ? updatedPersona : p);
        const isUpdatingActive = profile.activePersonaId === updatedPersona.id;
        await updateProfile({ ...profile, personas: updatedPersonas, tailorDraft: isUpdatingActive ? updatedPersona.tailorDraft : profile.tailorDraft });
      } catch (e) {
        console.error("MIMI // Failed to update persona", e);
      }
  };

  const deletePersona = async (personaId: string) => {
      if (!profile || !profile.personas || profile.personas.length <= 1) return;
      try {
        const filtered = profile.personas.filter(p => p.id !== personaId);
        const newActiveId = profile.activePersonaId === personaId ? filtered[0].id : profile.activePersonaId;
        const newActiveDraft = filtered.find(p => p.id === newActiveId)?.tailorDraft || DEFAULT_DRAFT;
        await updateProfile({ ...profile, personas: filtered, activePersonaId: newActiveId, tailorDraft: newActiveDraft });
      } catch (e) {
        console.error("MIMI // Failed to delete persona", e);
      }
  };

  const toggleZineStar = async (zineId: string) => {
    if (!profile) return;
    try {
      const currentStars = profile.starredZineIds || [];
      const isStarred = currentStars.includes(zineId);
      const newStars = isStarred ? currentStars.filter(id => id !== zineId) : [...currentStars, zineId];
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: isStarred ? "Manifest removed from Favorites." : "Manifest anchored to Favorites.", icon: <Star size={14} className={isStarred ? "" : "text-amber-500 fill-amber-500"} /> } }));
      await updateProfile({ ...profile, starredZineIds: newStars });
    } catch (e) {
      console.error("MIMI // Failed to toggle zine star", e);
    }
  };

  const loginWithEmail = async (email: string, redirectUrl: string) => {
    setAuthError(null);
    try {
      const { sendEmailLink } = await import('../services/firebaseUtils');
      await sendEmailLink(email, redirectUrl);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Access link sent to email.", icon: <Star size={14} className="text-stone-500 fill-stone-500" /> } }));
    } catch (e: any) {
      console.error("MIMI // Email Login Error:", e);
      setAuthError(e.code || e.message);
    }
  };

  const signUpWithEmailPassword = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { signUpWithEmailPassword } = await import('../services/firebaseUtils');
      await signUpWithEmailPassword(email, password);
      window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }));
    } catch (e: any) {
      console.error("MIMI // Sign Up Error:", e);
      setAuthError(e.code || e.message);
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { signInWithEmailPassword } = await import('../services/firebaseUtils');
      await signInWithEmailPassword(email, password);
      window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }));
    } catch (e: any) {
      console.error("MIMI // Sign In Error:", e);
      setAuthError(e.code || e.message);
    }
  };

  const upgradeGhostAccount = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { upgradeAnonymousWithEmail } = await import('../services/firebaseUtils');
      await upgradeAnonymousWithEmail(email, password);
      window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }));
    } catch (e: any) {
      console.error("MIMI // Upgrade Ghost Error:", e);
      setAuthError(e.code || e.message);
    }
  };

  const completeEmailLogin = async (url: string) => {
    setAuthError(null);
    try {
      const { completeEmailSignIn } = await import('../services/firebaseUtils');
      await completeEmailSignIn(url);
      window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }));
    } catch (e: any) {
      console.error("MIMI // Complete Email Login Error:", e);
      setAuthError(e.code || e.message);
    }
  };

  const login = async (forceRedirect = false) => {
    setAuthError(null);
    try { 
      await anchorIdentity(forceRedirect); 
      
      // Get the ID token
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        // Call the backend to set the session cookie
        await fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      }

      // For popup flow, auth state change fires immediately — navigate to profile
      if (!forceRedirect) {
        window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }));
      }
      // For redirect flow, page reloads — handleAuthRedirect in performRitual catches the result
    } catch (e: any) { 
      console.error("MIMI // Login Error:", e);
      setAuthError(e.code || e.message); 
    }
  };

  const signInWithGoogleRedirect = async () => {
    setAuthError(null);
    try { 
      await import('../services/firebaseUtils').then(m => m.anchorIdentity(false)); 
      window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }));
    } catch (e: any) { 
      console.error("MIMI // Sign In Error:", e);
      setAuthError(e.code || e.message); 
    }
  };

  const linkAccount = async (forceRedirect = false) => {
    console.log("MIMI // linkAccount called, user:", user);
    setAuthError(null);
    try { 
        const authInstance = await ensureAuth();
        console.log("MIMI // authInstance:", authInstance);
        if (user?.isAnonymous) {
            if (!authInstance.currentUser) {
                console.log("MIMI // User is Speed Ghost, signing in with Google");
                // User is a Speed Ghost (local only), no Firebase Auth session to link.
                // Just sign in, and reconcileProfile will migrate local data.
                await signInWithGoogleRedirect();
                return;
            }
            console.log("MIMI // User is anonymous, linking identity");
            await linkIdentity(forceRedirect);
            // If it was a popup, we need to manually reconcile to propagate the "Swan" state
            if (!forceRedirect && !isCaptiveInWebview()) {
                if (authInstance.currentUser) {
                    console.log("MIMI // Reconciling profile after link");
                    await reconcileProfile(authInstance.currentUser);
                }
            }
        } else {
            console.log("MIMI // Already anchored, signing in with Google");
            // Already anchored, or switching
            await signInWithGoogleRedirect(); 
        }
    } catch (e: any) { 
        console.error("MIMI // linkAccount error:", e);
        setAuthError(e.code || e.message); 
    }
  };

  const keyLogin = async (handle: string, apiKey: string) => {
    setLoading(true);
    try {
      const trimmedHandle = handle.trim().toLowerCase();
      const trimmedKey = apiKey.trim();
      
      if (!trimmedHandle || !trimmedKey) throw new Error("Handle and Key are required.");

      // 1. Add key to ring
      addKeyToRing(trimmedKey);

      // 2. Update profile
      if (profile) {
        const updated = { 
          ...profile, 
          handle: trimmedHandle, 
          onboardingComplete: true,
          lastActive: Date.now()
        };
        await updateProfile(updated);
      }
      
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: `Identity Anchored: @${trimmedHandle}`, type: 'success' } 
      }));
    } catch (e: any) {
      setAuthError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const verifyIdentity = async () => {
    setLoading(true);
    try {
      const authInstance = await ensureAuth();
      if (authInstance.currentUser) {
        // Force a fresh reconciliation
        reconciliationInProgress.current = null; 
        await reconcileProfile(authInstance.currentUser);
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "Identity Verified. Handshake complete.", type: 'success' } 
        }));
      }
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openKeySelector = async () => {
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio?.openSelectKey) {
        await aistudio.openSelectKey();
        setHasApiKey(true);
        setOracleStatus('ready');
      }
    } catch (e) {}
  };

  const logout = async () => {
    setLoading(true);
    // Unsubscribe listeners
    if (unsubscribeProfile.current) unsubscribeProfile.current();
    if (unsubscribePrefs.current) unsubscribePrefs.current();
    
    try {
      const authInstance = await ensureAuth();
      await authInstance.signOut();
      
      // Call the backend to clear the session cookie
      await fetch('/api/sessionLogout', { method: 'POST' });
      
      setUser(null); setProfile(null);
      await speedGhostEntrance();
    } catch (e) { setLoading(false); }
  };

  const activePersona = profile?.personas?.find(p => p.id === profile.activePersonaId);

  const canGenerate = hasAccess(profile?.plan, 'core') || profile?.isPatron || (profile?.generationCount || 0) < 5;
  const generationsRemaining = (hasAccess(profile?.plan, 'core') || profile?.isPatron) ? Infinity : Math.max(0, 5 - (profile?.generationCount || 0));

  const activatePatron = async (key: string) => {
    if (!profile || !user) return;
    try {
      const { applyPromoCode } = await import('../services/membershipPipeline');
      await applyPromoCode(user.uid, key);
      
      // Also update local profile state to reflect the change immediately
      await updateProfile({ ...profile, plan: 'lab', isPatron: true, patronActivatedAt: Date.now(), patronKey: key });
    } catch (e) {
      console.error("MIMI // Failed to activate patron", e);
      throw e;
    }
  };

  const upgradePlan = async (plan: 'core' | 'pro' | 'lab', interval?: 'month' | 'year') => {
    if (!profile) return;
    try {
      await updateProfile({ ...profile, plan, subscriptionInterval: interval || 'month', subscriptionStatus: 'active' });
    } catch (e) {
      console.error("MIMI // Failed to upgrade plan", e);
      throw e;
    }
  };

  const incrementGeneration = async () => {
    if (!profile) return;
    try {
      await updateProfile({ ...profile, generationCount: (profile.generationCount || 0) + 1 });
    } catch (e) {
      console.error("MIMI // Failed to increment generation count", e);
    }
  };

  const recordSession = async () => {
    if (!user || user.uid.startsWith('local_')) return;
    try {
      await recordSessionService(user.uid);
    } catch (e) {
      console.error("MIMI // Failed to record session", e);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, profile, loading, isElevatorLoading, setElevatorLoading, updateProfile, toggleZineStar, isOnboardingComplete: !!profile?.onboardingComplete, 
      login, loginWithEmail, completeEmailLogin, signUpWithEmailPassword, signInWithEmailPassword, upgradeGhostAccount, signInWithGoogleRedirect, ghostLogin, speedGhostEntrance, linkAccount, keyLogin, verifyIdentity, isEnvironmentRestricted, isDatabaseMissing, authError,
      hasApiKey, openKeySelector, logout, refreshHasApiKey, systemStatus, setOracleStatus,
      keyRing, addKeyToRing, removeKeyFromRing,
      featureFlags, toggleFeature,
      enabledAlgos: profile?.enabledAlgos || [],
      toggleAlgo,
      personas: profile?.personas || [],
      activePersonaId: profile?.activePersonaId,
      activePersona,
      switchPersona,
      createPersona,
      updatePersona,
      deletePersona,
      canGenerate,
      generationsRemaining,
      activatePatron,
      upgradePlan,
      incrementGeneration,
      recordSession,
      activeThread,
      setActiveThread
    }}>
      {children}
    </UserContext.Provider>
  );
};
