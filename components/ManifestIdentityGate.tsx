import React from 'react';
import { useUser } from '../contexts/UserContext';
import { Auth } from './Auth';
import { Sparkles } from 'lucide-react';

export const ManifestIdentityGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useUser();

  // 1. Still loading the Firebase handshake
  if (loading) return null; 

  // 2. User is a Ghost (Anonymous) - They must anchor before subscribing
  if (!user || user.isAnonymous) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-emerald-500/20 bg-stone-900/40 rounded-lg backdrop-blur-md">
        <Sparkles className="w-8 h-8 text-emerald-500 mb-4 animate-pulse" />
        <h3 className="font-serif italic text-xl text-stone-200 mb-2">Identity Required</h3>
        <p className="text-stone-400 text-sm text-center mb-6 max-w-xs">
          To bridge into a subscription, your shadow memory must be anchored to a Sovereign Identity.
        </p>
        <Auth /> 
      </div>
    );
  }

  // 3. User is Anchored (Google Auth) - Show the checkout/subscription content
  return <>{children}</>;
};
