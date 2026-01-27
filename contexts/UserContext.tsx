
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserProfile } from '../types';
import { getLocalProfile, saveProfileLocally } from '../services/localArchive';
import { bootstrapAuth, ensureAuth, getUserProfile, saveUserProfile, anchorIdentity, handleAuthRedirect, startGhostSession, initializeAuthPersistence } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../services/firebaseInit';

interface UserContextType {
  user: { uid: string, isAnonymous: boolean, email?: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (profile: UserProfile) => Promise<void>;
  isOnboardingComplete: boolean;
  login: (forceRedirect?: boolean) => Promise<void>;
  ghostLogin: () => Promise<void>;
  speedGhostEntrance: () => Promise<void>;
  linkAccount: (forceRedirect?: boolean) => Promise<void>;
  isEnvironmentRestricted: boolean;
  authError: string | null;
  hasApiKey: boolean;
  openKeySelector: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string, isAnonymous: boolean, email?: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEnvironmentRestricted, setIsEnvironmentRestricted] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  
  const initStarted = useRef(false);
  const reconciliationInProgress = useRef<string | null>(null);

  const reconcileProfile = useCallback(async (fbUser: any) => {
    if (!fbUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (reconciliationInProgress.current === fbUser.uid) return;
    reconciliationInProgress.current = fbUser.uid;
    
    try {
      const cloudProfile = await getUserProfile(fbUser.uid);
      const currentLocal = await getLocalProfile();
      
      let finalProfile: UserProfile;

      if (cloudProfile) {
        finalProfile = { ...cloudProfile, uid: fbUser.uid, isSwan: !fbUser.isAnonymous, email: fbUser.email, lastActive: Date.now() };
      } else {
        finalProfile = {
          uid: fbUser.uid,
          handle: fbUser.displayName?.split(' ')[0] || currentLocal?.handle || 'Subject_' + fbUser.uid.slice(-4),
          photoURL: fbUser.photoURL || currentLocal?.photoURL || null,
          isSwan: !fbUser.isAnonymous,
          processingMode: currentLocal?.processingMode || 'movie',
          currentSeason: currentLocal?.currentSeason || 'blooming',
          coreNeed: currentLocal?.coreNeed || 'truth',
          createdAt: currentLocal?.createdAt || Date.now(),
          email: fbUser.email,
          lastActive: Date.now(),
          zodiacSign: currentLocal?.zodiacSign,
          tasteProfile: currentLocal?.tasteProfile,
          manifestos: currentLocal?.manifestos || []
        };
      }

      await saveProfileLocally(finalProfile);
      
      if (!isEnvironmentRestricted && !fbUser.isAnonymous) {
        try { await saveUserProfile(finalProfile); } catch (e) {}
      }
      
      setProfile(finalProfile);
      setUser({ uid: fbUser.uid, isAnonymous: !!fbUser.isAnonymous, email: fbUser.email });
      setAuthError(null);
    } catch (e: any) {
      console.error("MIMI // Reconcile Failure:", e);
    } finally {
      setLoading(false);
      reconciliationInProgress.current = null;
    }
  }, [isEnvironmentRestricted]);

  const ghostLogin = useCallback(async () => {
    try {
      setLoading(true);
      const result = await startGhostSession();
      await reconcileProfile(result.user);
    } catch (e: any) {
      if (e.code === 'auth/unauthorized-domain') setIsEnvironmentRestricted(true);
      setLoading(false);
    }
  }, [reconcileProfile]);

  const speedGhostEntrance = useCallback(async () => {
    try {
      setLoading(true);
      const result = await startGhostSession();
      const fbUser = result.user;
      
      const speedProfile: UserProfile = {
        uid: fbUser.uid,
        handle: 'Ghost_' + fbUser.uid.slice(-4),
        photoURL: `https://ui-avatars.com/api/?name=G&background=1c1917&color=fff`,
        isSwan: false,
        processingMode: 'movie',
        currentSeason: 'blooming',
        coreNeed: 'chaos',
        createdAt: Date.now(),
        lastActive: Date.now(),
        tasteProfile: {
          inspirations: "Clinical, Siberian, High-Fidelity",
          keywords: "minimalist, ghost, void",
          dominant_archetypes: ["minimalist-sans"]
        },
        manifestos: []
      };

      await saveProfileLocally(speedProfile);
      setProfile(speedProfile);
      setUser({ uid: fbUser.uid, isAnonymous: true });
      setAuthError(null);
    } catch (e: any) {
      console.error("MIMI // Speed Ghost Failure:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;
    
    const performRitual = async () => {
      const authRitual = async () => {
        try {
          await initializeAuthPersistence();
          
          const redirectResult = await handleAuthRedirect();
          if (redirectResult && redirectResult.uid) {
             await reconcileProfile(redirectResult);
          } else {
             const bUser = await bootstrapAuth();
             if (bUser) {
               await reconcileProfile(bUser);
             } else {
               // SILENT GHOST INITIATION: No gateway required.
               await speedGhostEntrance();
             }
          }

          const authInstance = await ensureAuth();
          onAuthStateChanged(authInstance, (fbUser) => {
            if (fbUser) reconcileProfile(fbUser);
            else setLoading(false);
          });
        } catch (e) {
          console.warn("MIMI // Ritual Error:", e);
          setLoading(false);
        }
      };

      await authRitual();
    };

    performRitual();
  }, [reconcileProfile, speedGhostEntrance]);

  const updateProfile = async (newProfile: UserProfile) => {
    try {
      const currentUid = user?.uid || newProfile.uid;
      const updated = { ...newProfile, uid: currentUid, lastActive: Date.now() };
      await saveProfileLocally(updated);
      setProfile(updated);
      if (!isEnvironmentRestricted && user && !user.isAnonymous) {
        await saveUserProfile(updated);
      }
    } catch (e) {
      throw e;
    }
  };

  const login = async (forceRedirect = false) => {
    setAuthError(null);
    try {
      await anchorIdentity(forceRedirect);
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
      } else {
        alert("The Imperial Key Registry is currently obscured.");
      }
    } catch (e) {}
  };

  const logout = async () => {
    const authInstance = await ensureAuth();
    await authInstance.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
    // Restart as ghost immediately
    await speedGhostEntrance();
  };

  return (
    <UserContext.Provider value={{ 
      user, profile, loading, updateProfile, isOnboardingComplete: !!profile, 
      login, ghostLogin, speedGhostEntrance, linkAccount: login, isEnvironmentRestricted, authError,
      hasApiKey, openKeySelector, logout
    }}>
      {children}
    </UserContext.Provider>
  );
};
