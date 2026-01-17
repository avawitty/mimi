
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile } from '../types';
import { getLocalProfile, saveProfileLocally } from '../services/localArchive';
import { ensureAuth, getUserProfile, saveUserProfile, linkGoogleAccount } from '../services/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

interface UserContextType {
  user: { uid: string, isAnonymous: boolean, email?: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (profile: UserProfile) => Promise<void>;
  isOnboardingComplete: boolean;
  login: () => Promise<void>;
  ghostLogin: () => Promise<void>;
  linkAccount: () => Promise<void>;
  isEnvironmentRestricted: boolean;
  authError: string | null;
  openKeySelector?: () => void;
  hasApiKey?: boolean;
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
  const [isEnvironmentRestricted, setIsEnvironmentRestricted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const reconcileProfile = useCallback(async (fbUser: any) => {
    try {
      console.log(`MIMI // Identity Trace: Analyzing signal for ${fbUser.email || fbUser.uid}`);
      
      // Step 1: Query the Sovereign Cloud for an existing profile
      const cloudProfile = await getUserProfile(fbUser.uid);
      const local = getLocalProfile();
      
      let finalProfile: UserProfile;

      if (cloudProfile) {
        // Cloud Profile is the absolute truth. If you are logged in elsewhere, this is you.
        console.log("MIMI // Cloud Registry: Match found. Manifesting Sovereign Identity.");
        finalProfile = {
          ...cloudProfile,
          // Merge in any fresh local taste debris if we don't have it in cloud
          tasteProfile: cloudProfile.tasteProfile || local?.tasteProfile
        };
      } else if (local && local.uid === fbUser.uid) {
        // We have local data that matches the current auth - use it
        finalProfile = local;
      } else {
        // Truly a new Muse in the registry
        console.log("MIMI // Registry: Initiating new Muse record.");
        finalProfile = {
          uid: fbUser.uid,
          handle: fbUser.displayName?.split(' ')[0] || local?.handle || 'Subject_' + fbUser.uid.slice(0, 4),
          photoURL: fbUser.photoURL || local?.photoURL || null,
          isSwan: !fbUser.isAnonymous,
          processingMode: local?.processingMode || 'movie',
          currentSeason: local?.currentSeason || 'blooming',
          coreNeed: local?.coreNeed || 'truth',
          createdAt: Date.now()
        };
      }

      // Ensure the email is anchored in the record for cross-device certainty
      if (fbUser.email) {
        (finalProfile as any).email = fbUser.email;
      }

      // Synchronize back to Cloud and Local
      await saveUserProfile(finalProfile);
      saveProfileLocally(finalProfile);
      
      setProfile(finalProfile);
      setUser({ uid: fbUser.uid, isAnonymous: fbUser.isAnonymous, email: fbUser.email });

    } catch (e) {
      console.error("MIMI // Identity reconciliation failed in O2.", e);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initAuth = async () => {
      try {
        const auth = await ensureAuth();

        // Check for redirect results (crucial for mobile handshakes)
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await reconcileProfile(result.user);
        }

        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            await reconcileProfile(fbUser);
          } else {
            // If no user, stay with local profile if it exists as a fallback
            const local = getLocalProfile();
            if (local) {
              setProfile(local);
              setUser({ uid: local.uid, isAnonymous: !local.isSwan });
            }
          }
          setLoading(false);
        });
      } catch (err) {
        console.warn("MIMI // O2 Restricted Environment detected.");
        setIsEnvironmentRestricted(true);
        setLoading(false);
      }
    };

    initAuth();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [reconcileProfile]);

  const updateProfile = async (newProfile: UserProfile) => {
    saveProfileLocally(newProfile);
    setProfile(newProfile);
    if (newProfile.uid && !newProfile.uid.startsWith('ghost_')) {
      await saveUserProfile(newProfile);
    }
  };

  const login = async () => {
    setAuthError(null);
    try {
      await linkGoogleAccount();
    } catch (e: any) {
      setAuthError(e.message || "Handshake Rejected by O2.");
      throw e;
    }
  };

  const ghostLogin = async () => {
    const local = getLocalProfile();
    const uid = local?.uid && local.uid.startsWith('ghost_') ? local.uid : `ghost_${Date.now()}`;
    const ephemeral: UserProfile = {
      uid, 
      handle: local?.handle || 'Ghost', 
      processingMode: local?.processingMode || 'movie', 
      currentSeason: local?.currentSeason || 'blooming',
      coreNeed: local?.coreNeed || 'chaos', 
      createdAt: local?.createdAt || Date.now(),
      isSwan: false,
      tasteProfile: local?.tasteProfile || { inspirations: '', keywords: '' }
    };
    setUser({ uid, isAnonymous: true });
    setProfile(ephemeral);
    saveProfileLocally(ephemeral);
    setLoading(false);
  };

  const linkAccount = async () => {
    setAuthError(null);
    try {
      await linkGoogleAccount();
    } catch (e: any) {
      setAuthError(e.code === 'auth/credential-already-in-use' ? "Identity collision in O2." : "O2 Link Failed.");
      throw e;
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, profile, loading, updateProfile, isOnboardingComplete: !!profile, 
      login, ghostLogin, linkAccount, isEnvironmentRestricted, authError,
      openKeySelector: () => {},
      hasApiKey: true
    }}>
      {children}
    </UserContext.Provider>
  );
};
