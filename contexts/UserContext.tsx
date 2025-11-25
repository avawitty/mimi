
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, getUserProfile, saveUserProfile } from '../services/firebase';
import { UserProfile } from '../types';

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (profile: UserProfile) => Promise<void>;
  isOnboardingComplete: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.uid);
        setProfile(userProfile);
      } else {
        // Auto-sign in anonymously if not logged in
        signInAnonymously(auth).catch((error) => console.error("Auth Error:", error));
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateProfile = async (newProfile: UserProfile) => {
    await saveUserProfile(newProfile);
    setProfile(newProfile);
  };

  const isOnboardingComplete = !!profile;

  return (
    <UserContext.Provider value={{ user, profile, loading, updateProfile, isOnboardingComplete }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
