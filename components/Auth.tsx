// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { MimiGateway } from './MimiGateway';
import { ElevatorLoader } from './ElevatorLoader';

export const Auth: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { login, ghostLogin, authError, user } = useUser();
  const [isAccessing, setIsAccessing] = useState<'google' | 'ghost' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [handshakeStatus, setHandshakeStatus] = useState<string | null>(null);

  const displayError = authError || localError;

  // Handle successful anchoring
  useEffect(() => {
    if (user && !user.isAnonymous && isAccessing) {
      setHandshakeStatus('Identity Anchored.');
      if (onSuccess) onSuccess();
      
      // Critical: Clear accessing state after a delay to allow 
      // Firestore listeners to stabilize with the new Auth token
      const timer = setTimeout(() => setIsAccessing(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isAccessing, onSuccess]);

  const handleGoogleLogin = async (forceRedirect = false) => {
    setIsAccessing('google');
    setLocalError(null);
    setHandshakeStatus(forceRedirect ? 'Initiating Redirection Protocol...' : 'Initiating Sovereign Handshake...');
    try {
      await login(forceRedirect);
      // Popup success: onAuthStateChanged fires in UserContext, no further action needed
    } catch (e: any) {
      if (
        e.code === 'auth/popup-blocked' ||
        e.code === 'auth/cancelled-popup-request' ||
        e.code === 'auth/popup-closed-by-user'
      ) {
        setHandshakeStatus('Popup obstructed. Redirect initiated — or force below.');
      } else if (e.code === 'auth/unauthorized-domain' || e.code === 'auth/invalid-continue-uri') {
        setHandshakeStatus('Registry linkage error. Domain not whitelisted.');
        setLocalError(e.code);
        setIsAccessing(null);
      } else {
        console.error('MIMI // Auth Trace:', e);
        setLocalError(e.message || 'Handshake failed.');
        setIsAccessing(null);
        setHandshakeStatus(null);
      }
    }
  };

  const handleGhostLogin = async () => {
    setIsAccessing('ghost');
    setLocalError(null);
    setHandshakeStatus('Manifesting Shadow Memory...');
    try {
      await ghostLogin();
    } catch (e: any) {
      setLocalError(e.message || 'The shadow memory failed to manifest.');
      setIsAccessing(null);
      setHandshakeStatus(null);
    }
  };

  if (isAccessing === 'ghost') {
    return <ElevatorLoader loadingMessage={handshakeStatus || "Manifesting..."} />;
  }

  return (
    <MimiGateway 
      onGoogleLogin={() => handleGoogleLogin(false)}
      onGhostLogin={handleGhostLogin}
      onSystemStatus={() => setHandshakeStatus('Protocols: Sovereign & Shadow only.')}
      error={displayError}
    />
  );
};
