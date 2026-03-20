// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Loader2, Martini, Scale, EyeOff, Mail, Key, Compass, ShieldCheck, ZapOff, Sparkles, FastForward, Check } from 'lucide-react';
import { LegalOverlay } from './LegalOverlay';
import { MimiGateway } from './MimiGateway';
import { ElevatorLoader } from './ElevatorLoader';
import { ensureAuth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Detects cross-origin iframes (AI Studio, social webviews) where Google OAuth is
// blocked by Google's own policy — not something we can code around.
const detectIframeContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true; // cross-origin access throws — definitely an iframe
  }
  const ua = (navigator.userAgent || '').toLowerCase();
  const isSocial = /instagram|fb_iab|fban|fbav|tiktok|threads|wv\b|webview/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isSocial && !isStandalone;
};

export const Auth: React.FC = () => {
  const { login, ghostLogin, speedGhostEntrance, authError, user } = useUser();
  const [isAccessing, setIsAccessing] = useState<'google' | 'ghost' | 'email' | 'speed' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);
  const [authMode, setAuthMode] = useState<'ritual' | 'email-form' | 'email-link-form'>('ritual');
  const [handshakeStatus, setHandshakeStatus] = useState<string | null>(null);
  const [showRedirectFallback, setShowRedirectFallback] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Detected once on mount
  const isIframe = detectIframeContext();

  const displayError = authError || localError;
  const isUriMismatch = displayError?.includes('invalid-continue-uri') ||
                        displayError?.includes('unauthorized-domain') ||
                        displayError?.includes('unauthorized-continue-uri');
  const isInternalError = displayError?.includes('internal-error');

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const domainOnly = currentOrigin.replace(/^https?:\/\//, '');

  // Success flash
  useEffect(() => {
    if (user && (isAccessing === 'google' || isAccessing === 'email' || isAccessing === 'speed')) {
      setIsSuccess(true);
      setHandshakeStatus('Identity Anchored.');
      const timer = setTimeout(() => setIsSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isAccessing]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  // Popup-first. anchorIdentity in firebaseUtils will auto-fallback to redirect if
  // popup is blocked. We also surface an explicit redirect button for edge cases.
  const handleGoogleLogin = async (forceRedirect = false) => {
    setIsAccessing('google');
    setLocalError(null);
    setShowRedirectFallback(false);
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
        setShowRedirectFallback(true);
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

  const handleEmailRitual = async (email: string, password: string, isSignUp: boolean) => {
    if (!email || !password) return;
    setIsAccessing('email');
    setLocalError(null);
    setHandshakeStatus('Calibrating Manual Access...');
    try {
      const activeAuth = await ensureAuth();
      if (isSignUp) {
        await createUserWithEmailAndPassword(activeAuth, email, password);
      } else {
        await signInWithEmailAndPassword(activeAuth, email, password);
      }
      window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'profile' }));
    } catch (e: any) {
      setLocalError(e.message || 'Email protocol rejected.');
      setIsAccessing(null);
      setHandshakeStatus(null);
    }
  };

  const handleSendEmailLink = async (email: string) => {
    setIsAccessing('email');
    setLocalError(null);
    setHandshakeStatus('Sending magic link...');
    try {
      await import('../services/firebaseUtils').then(m => m.sendEmailLink(email, {
        url: window.location.origin + '/auth/callback',
        handleCodeInApp: true,
      }));
      window.localStorage.setItem('emailForSignIn', email);
      setHandshakeStatus('Link sent! Check your email.');
    } catch (e: any) {
      setLocalError(e.message || 'Failed to send link.');
    } finally {
      setIsAccessing(null);
    }
  };

  const handleSpeedEntrance = async () => {
    setIsAccessing('speed');
    setLocalError(null);
    setHandshakeStatus('Opening Shadow Pathway...');
    try {
      await speedGhostEntrance();
    } catch (e: any) {
      setLocalError('The speed pathway is currently obstructed.');
      setIsAccessing(null);
      setHandshakeStatus(null);
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

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isAccessing === 'ghost') return <ElevatorLoader loadingMessage={handshakeStatus || "Manifesting..."} />;

  return (
    <MimiGateway 
      onGoogleLogin={() => handleGoogleLogin(false)}
      onGhostLogin={handleGhostLogin}
      onEmailLogin={handleEmailRitual}
      onSendEmailLink={handleSendEmailLink}
      onRequestCredentials={() => setLegalType('terms')}
      onSystemStatus={() => setHandshakeStatus('System Status: Operational')}
      error={displayError}
    />
  );
};
