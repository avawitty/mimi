
// @ts-nocheck
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserProfile, UserPreferences, Persona, TailorLogicDraft } from '../types';
import { getLocalProfile, saveProfileLocally } from '../services/localArchive';
import { 
  bootstrapAuth, ensureAuth, getUserProfile, saveUserProfile, 
  anchorIdentity, linkIdentity, handleAuthRedirect, startGhostSession, 
  initializeAuthPersistence, getUserPreferences, saveUserPreferences, 
  subscribeToUserProfile, subscribeToUserPreferences, migrateLocalToCloud, db 
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Star } from 'lucide-react';
import { setGlobalKeyRing } from '../services/geminiService';

interface SystemStatus {
  auth: 'syncing' | 'anchored' | 'offline';
  oracle: 'ready' | 'saturated' | 'unavailable';
  storage: 'nominal' | 'limited' | 'full';
}

export interface FeatureFlags {
  scry: boolean;
  darkroom: boolean;
  mesopic: boolean;
  tailor: boolean;
  proposal: boolean;
}

interface UserContextType {
  user: { uid: string, isAnonymous: boolean, email?: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (profile: UserProfile) => Promise<void>;
  toggleZineStar: (zineId: string) => Promise<void>;
  isOnboardingComplete: boolean;
  login: (forceRedirect?: boolean) => Promise<void>;
  ghostLogin: () => Promise<void>;
  speedGhostEntrance: () => Promise<void>;
  linkAccount: (forceRedirect?: boolean) => Promise<void>;
  isEnvironmentRestricted: boolean;
  isDatabaseMissing: boolean; 
  authError: string | null;
  hasApiKey: boolean;
  openKeySelector: () => Promise<void>;
  logout: () => Promise<void>;
  refreshHasApiKey: () => Promise<void>;
  systemStatus: SystemStatus;
  setOracleStatus: (status: SystemStatus['oracle']) => void;
  keyRing: string[];
  addKeyToRing: (key: string) => void;
  removeKeyFromRing: (key: string) => void;
  featureFlags: FeatureFlags;
  toggleFeature: (key: keyof FeatureFlags) => void;
  personas: Persona[];
  activePersonaId: string | undefined;
  activePersona: Persona | undefined;
  switchPersona: (personaId: string) => void;
  createPersona: (name: string, apiKey?: string) => Promise<void>;
  updatePersona: (persona: Persona) => Promise<void>;
  deletePersona: (personaId: string) => Promise<void>;
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
  mesopic: true,
  tailor: true,
  proposal: true
};

const DEFAULT_DRAFT: TailorLogicDraft = {
  interests: { anime: '', designer: '', topic: '', book: '', favoriteThing: '' },
  aestheticCore: { silhouettes: '', textures: '', eraFocus: '90s Minimal', manualEra: '', density: 50, developmentRoadmap: [], visualShards: [] },
  celestialCalibration: { zodiac: 'gemini', astrologicalLineage: '', seasonalAlignment: '' },
  chromaticRegistry: { primaryPalette: [], baseNeutral: '#F2F1ED', accentSignal: '#1C1917' },
  typographyIntent: { styleDescription: '', weightPreference: '' },
  narrativeVoice: { emotionalTemperature: 'CLINICAL', sentenceStructure: 'CONCISE', culturalRegister: ['EDITORIAL'] },
  desireVectors: { moreOf: '', lessOf: '', experimentingWith: '', avoiding: '', materialityAudit: '' },
  draftStatus: 'provisional',
  lastTailored: Date.now()
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string, isAnonymous: boolean, email?: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEnvironmentRestricted, setIsEnvironmentRestricted] = useState(false);
  const [isDatabaseMissing, setIsDatabaseMissing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    auth: 'syncing',
    oracle: 'ready',
    storage: 'nominal'
  });
  
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
      if (keyRing.length === 0) {
          setHasApiKey(false);
          setOracleStatus('unavailable');
      }
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
    if (!fbUser) {
      setUser(null); setProfile(null); setLoading(false);
      setSystemStatus(prev => ({ ...prev, auth: 'offline' }));
      // Cleanup listeners
      if (unsubscribeProfile.current) unsubscribeProfile.current();
      if (unsubscribePrefs.current) unsubscribePrefs.current();
      return;
    }
    
    if (reconciliationInProgress.current === fbUser.uid) return;
    reconciliationInProgress.current = fbUser.uid;
    setSystemStatus(prev => ({ ...prev, auth: 'syncing' }));

    // Clear existing listeners to prevent duplication
    if (unsubscribeProfile.current) unsubscribeProfile.current();
    if (unsubscribePrefs.current) unsubscribePrefs.current();

    try {
      const currentLocal = await getLocalProfile();
      let initialProfile = currentLocal;

      if (!fbUser.isAnonymous) {
          // SWAN PATH (Authenticated)
          
          // 1. Initial Cloud Check & potential Migration
          const [cloudProfileSnap, cloudPrefsSnap] = await Promise.all([
              getUserProfile(fbUser.uid),
              getUserPreferences(fbUser.uid)
          ]);
          
          // If no cloud data exists, but we have local data (fresh sign-up or first sync)
          if (!cloudProfileSnap && !cloudPrefsSnap && currentLocal) {
              await migrateLocalToCloud(fbUser.uid, currentLocal);
          }
          
          // 2. Setup Real-time Listeners
          unsubscribeProfile.current = subscribeToUserProfile(fbUser.uid, (pData) => {
             setProfile(prev => {
                 const merged = { ...(prev || {}), ...pData, uid: fbUser.uid } as UserProfile;
                 return ensurePersonas(merged);
             });
          });

          unsubscribePrefs.current = subscribeToUserPreferences(fbUser.uid, (prefsData) => {
             setProfile(prev => {
                 const merged = { ...(prev || {}), ...prefsData } as UserProfile;
                 return ensurePersonas(merged);
             });
          });
          
          // Construct initial state from one-time fetch to unblock UI immediately
          // (Listeners will follow up with updates)
          const mergedCloud = { 
              ...(cloudProfileSnap || {}), 
              ...(cloudPrefsSnap || {}),
              uid: fbUser.uid,
              isSwan: true,
              email: fbUser.email
          } as UserProfile;

          // If migration happened, local is the best source until listeners fire
          // If cloud data existed, use that.
          if (cloudProfileSnap || cloudPrefsSnap) {
              initialProfile = mergedCloud;
          } else if (currentLocal) {
              initialProfile = { ...currentLocal, uid: fbUser.uid, isSwan: true, email: fbUser.email };
          } else {
              // Brand new user, no local data either
              initialProfile = {
                  uid: fbUser.uid,
                  handle: 'Swan_' + fbUser.uid.slice(-4),
                  isSwan: true,
                  email: fbUser.email,
                  createdAt: Date.now(),
                  lastActive: Date.now(),
                  onboardingComplete: false,
                  tasteProfile: { archetype_weights: {}, color_frequency: {} },
                  starredZineIds: []
              };
          }

      } else {
          // GHOST PATH (Local Only)
          if (currentLocal && currentLocal.uid === fbUser.uid) {
             initialProfile = currentLocal;
          } else {
             initialProfile = {
                uid: fbUser.uid,
                handle: 'Ghost_' + fbUser.uid.slice(-4),
                isSwan: false,
                createdAt: Date.now(),
                lastActive: Date.now(),
                onboardingComplete: false,
                tasteProfile: { archetype_weights: {}, color_frequency: {} },
                starredZineIds: []
             };
          }
      }

      const safeProfile = ensurePersonas(initialProfile);
      setProfile(safeProfile);
      setUser({ uid: fbUser.uid, isAnonymous: !!fbUser.isAnonymous, email: fbUser.email });
      setAuthError(null);
      setSystemStatus(prev => ({ ...prev, auth: 'anchored' }));
      
      // Save local backup for offline resilience
      await saveProfileLocally(safeProfile);

    } catch (e: any) {
      console.error("Reconciliation Failed", e);
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
      onboardingComplete: true
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
    setLoading(true);
    try {
      const result = await startGhostSession();
      await reconcileProfile(result.user);
    } catch (e: any) {
      if (e.code === 'auth/unauthorized-domain') setIsEnvironmentRestricted(true);
      await speedGhostEntrance();
    }
  }, [reconcileProfile, speedGhostEntrance]);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;
    const safetyValve = setTimeout(() => {
      setLoading(false);
      setSystemStatus(prev => ({ ...prev, auth: 'offline' }));
      document.body.classList.add('hydrated');
    }, 4000); 
    const performRitual = async () => {
      try {
        await initializeAuthPersistence();
        const redirectResult = await handleAuthRedirect();
        if (redirectResult && redirectResult.uid) {
           await reconcileProfile(redirectResult);
        } else {
           const bUser = await bootstrapAuth();
           if (bUser) await reconcileProfile(bUser);
           else {
             const local = await getLocalProfile();
             if (local) {
               setProfile(ensurePersonas(local));
               setUser({ uid: local.uid, isAnonymous: !local.isSwan });
               setLoading(false);
               setSystemStatus(prev => ({ ...prev, auth: 'anchored' }));
               document.body.classList.add('hydrated');
             } else await speedGhostEntrance();
           }
        }
        const authInstance = await ensureAuth();
        onAuthStateChanged(authInstance, (fbUser) => {
          if (fbUser) reconcileProfile(fbUser);
          else {
             setUser(null); 
             // Cleanup listeners on auth state change to null
             if (unsubscribeProfile.current) unsubscribeProfile.current();
             if (unsubscribePrefs.current) unsubscribePrefs.current();
             setLoading(false);
          }
        });
      } catch (e) {
        setLoading(false);
        document.body.classList.add('hydrated');
      }
    };
    performRitual().finally(() => clearTimeout(safetyValve));
    return () => clearTimeout(safetyValve);
  }, [reconcileProfile, speedGhostEntrance]);

  const updateProfile = async (newProfile: UserProfile) => {
    try {
      const currentUid = user?.uid || newProfile.uid;
      const updated = { ...newProfile, uid: currentUid, lastActive: Date.now() };
      
      // Optimistic Update
      setProfile(updated);
      await saveProfileLocally(updated);
      
      if (navigator.onLine && user && !user.isAnonymous && !currentUid.startsWith('local_')) {
        // Split data into Identity (Public) and Preferences (Private)
        const { tailorDraft, personas, activePersonaId, tasteProfile, starredZineIds, lastAuditReport, ...identity } = updated;
        const preferences: UserPreferences = {
            tailorDraft,
            tasteProfile,
            starredZineIds,
            lastAuditReport,
            personas,
            activePersonaId
        };
        
        await Promise.all([
            saveUserProfile(identity as UserProfile), // Writes to 'profiles'
            saveUserPreferences(currentUid, preferences) // Writes to 'userPreferences'
        ]);
      }
    } catch (e) { throw e; }
  };

  const switchPersona = (personaId: string) => {
      if (!profile) return;
      const target = profile.personas?.find(p => p.id === personaId);
      if (target) {
          updateProfile({ ...profile, activePersonaId: personaId, tailorDraft: target.tailorDraft });
      }
  };

  const createPersona = async (name: string, apiKey?: string) => {
      if (!profile) return;
      const newPersona: Persona = {
          id: `persona_${Date.now()}`,
          name,
          tailorDraft: { ...DEFAULT_DRAFT },
          apiKey,
          createdAt: Date.now()
      };
      const updatedPersonas = [...(profile.personas || []), newPersona];
      await updateProfile({ ...profile, personas: updatedPersonas, activePersonaId: newPersona.id, tailorDraft: newPersona.tailorDraft });
  };

  const updatePersona = async (updatedPersona: Persona) => {
      if (!profile) return;
      const updatedPersonas = (profile.personas || []).map(p => p.id === updatedPersona.id ? updatedPersona : p);
      const isUpdatingActive = profile.activePersonaId === updatedPersona.id;
      await updateProfile({ ...profile, personas: updatedPersonas, tailorDraft: isUpdatingActive ? updatedPersona.tailorDraft : profile.tailorDraft });
  };

  const deletePersona = async (personaId: string) => {
      if (!profile || !profile.personas || profile.personas.length <= 1) return;
      const filtered = profile.personas.filter(p => p.id !== personaId);
      const newActiveId = profile.activePersonaId === personaId ? filtered[0].id : profile.activePersonaId;
      const newActiveDraft = filtered.find(p => p.id === newActiveId)?.tailorDraft || DEFAULT_DRAFT;
      await updateProfile({ ...profile, personas: filtered, activePersonaId: newActiveId, tailorDraft: newActiveDraft });
  };

  const toggleZineStar = async (zineId: string) => {
    if (!profile) return;
    const currentStars = profile.starredZineIds || [];
    const isStarred = currentStars.includes(zineId);
    const newStars = isStarred ? currentStars.filter(id => id !== zineId) : [...currentStars, zineId];
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: isStarred ? "Manifest removed from Favorites." : "Manifest anchored to Favorites.", icon: <Star size={14} className={isStarred ? "" : "text-amber-500 fill-amber-500"} /> } }));
    await updateProfile({ ...profile, starredZineIds: newStars });
  };

  const login = async (forceRedirect = false) => {
    setAuthError(null);
    try { await anchorIdentity(forceRedirect); } catch (e: any) { setAuthError(e.code || e.message); throw e; }
  };

  const linkAccount = async (forceRedirect = false) => {
    setAuthError(null);
    try { 
        if (user?.isAnonymous) {
            await linkIdentity();
        } else {
            // Already anchored, or switching
            await anchorIdentity(forceRedirect); 
        }
    } catch (e: any) { 
        setAuthError(e.code || e.message); 
        throw e; 
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
      setUser(null); setProfile(null);
      await speedGhostEntrance();
    } catch (e) { setLoading(false); }
  };

  const activePersona = profile?.personas?.find(p => p.id === profile.activePersonaId);

  return (
    <UserContext.Provider value={{ 
      user, profile, loading, updateProfile, toggleZineStar, isOnboardingComplete: !!profile?.onboardingComplete, 
      login, ghostLogin, speedGhostEntrance, linkAccount, isEnvironmentRestricted, isDatabaseMissing, authError,
      hasApiKey, openKeySelector, logout, refreshHasApiKey, systemStatus, setOracleStatus,
      keyRing, addKeyToRing, removeKeyFromRing,
      featureFlags, toggleFeature,
      personas: profile?.personas || [],
      activePersonaId: profile?.activePersonaId,
      activePersona,
      switchPersona,
      createPersona,
      updatePersona,
      deletePersona
    }}>
      {children}
    </UserContext.Provider>
  );
};
