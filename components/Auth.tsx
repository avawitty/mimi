// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Loader2, Martini, Scale, EyeOff, Mail, Key, Compass, ShieldCheck, ZapOff, Sparkles, FastForward, Check } from 'lucide-react';
import { LegalOverlay } from './LegalOverlay';
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
  const [authMode, setAuthMode] = useState<'ritual' | 'email-form'>('ritual');
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

  const handleEmailRitual = async () => {
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

  return (
    <div className="fixed inset-0 z-[2000] bg-white dark:bg-stone-950 flex items-center justify-center p-6 md:p-12 overflow-y-auto no-scrollbar selection:bg-nous-text selection:text-white">
      <AnimatePresence>
        {legalType && <LegalOverlay type={legalType} onClose={() => setLegalType(null)} />}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-stone-100 dark:bg-stone-900/10 rounded-full blur-[140px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl text-center space-y-12 py-10"
      >
        {/* ── Header ── */}
        <div className="space-y-6">
          <div className="w-24 h-24 border border-stone-200 dark:border-stone-800 rounded-full flex items-center justify-center mx-auto relative group">
            <div className="absolute inset-0 border-t-2 border-nous-text dark:border-white rounded-full animate-[spin_4s_linear_infinite]" />
            <Martini size={32} className="text-nous-text dark:text-white group-hover:scale-110 transition-transform duration-700" />
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-6xl md:text-8xl italic tracking-tighter luminescent-text text-nous-text dark:text-white leading-none">Mimi Gateway.</h1>
            <p className="font-sans text-[10px] uppercase tracking-[0.8em] text-stone-400 font-black">Choose Your Path to Manifestation</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {authMode === 'ritual' ? (
            <motion.div key="ritual" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="space-y-10">

              {/* Status pill */}
              <AnimatePresence>
                {handshakeStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-4 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl flex items-center gap-4 justify-center"
                  >
                    {isSuccess
                      ? <Check size={12} className="text-emerald-500" />
                      : <Loader2 size={12} className="animate-spin text-stone-400" />
                    }
                    <span className="font-serif italic text-sm text-stone-500">{handshakeStatus}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Domain error state ── */}
              {(isUriMismatch || isInternalError) ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-amber-50 dark:bg-stone-900 border border-amber-200 dark:border-amber-900/40 rounded-3xl text-left space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 text-amber-600">
                    <ZapOff size={20} />
                    <span className="font-sans text-[10px] uppercase tracking-widest font-black">
                      Dissonance: {isInternalError ? 'Registry Error' : 'Domain Not Whitelisted'}
                    </span>
                  </div>
                  <div className="space-y-4 font-serif italic text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {isInternalError
                      ? <p>The authentication service encountered internal turbulence. Proceed via Ghost or email.</p>
                      : <>
                          <p>This domain must be added to Firebase's Authorized Domains before Google Sign-In will work.</p>
                          <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-amber-200 dark:border-amber-900/20 space-y-2">
                            <p className="font-sans text-[9px] uppercase tracking-widest not-italic text-stone-400">
                              Firebase Console → Authentication → Settings → Authorized Domains → Add:
                            </p>
                            <code className="text-[10px] p-2 bg-white dark:bg-stone-800 rounded border block text-emerald-600 font-bold break-all">{domainOnly}</code>
                          </div>
                        </>
                    }
                  </div>
                  <button onClick={handleSpeedEntrance} disabled={!!isAccessing} className="w-full py-4 bg-nous-text text-white rounded-full font-sans text-[9px] uppercase tracking-[0.4em] font-black hover:opacity-90 transition-opacity">
                    Enter Ghost While You Fix It
                  </button>
                </motion.div>

              ) : (
                /* ── Main path cards ── */
                <div className={`grid gap-6 md:gap-8 ${isIframe ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>

                  {/* SWAN — hidden in iframes: Google blocks OAuth cross-origin by policy */}
                  {!isIframe && (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleGoogleLogin(false)}
                      disabled={!!isAccessing || isSuccess}
                      className="group relative flex flex-col items-center justify-between p-8 md:p-10 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all text-center gap-6"
                    >
                      <div className="space-y-4 flex flex-col items-center">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-full border border-emerald-100 dark:border-emerald-800 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Sparkles size={24} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-serif text-3xl italic tracking-tighter">The Swan.</h3>
                          <p className="font-serif italic text-sm text-stone-400 leading-tight">Persistent Identity. Cloud Sync. Community Presence.</p>
                        </div>
                      </div>
                      <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black py-2 px-6 border border-stone-100 dark:border-stone-800 rounded-full group-hover:bg-nous-text group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                        Google Anchor
                      </span>
                    </motion.button>
                  )}

                  {/* GHOST */}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSpeedEntrance}
                    disabled={!!isAccessing}
                    className={`group relative flex flex-col items-center justify-between p-8 md:p-10 border rounded-[2.5rem] transition-all text-center gap-6 ${
                      isIframe 
                        ? 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 shadow-xl hover:shadow-2xl w-full max-w-sm mx-auto' 
                        : 'bg-stone-50 dark:bg-stone-900/30 border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-xl'
                    }`}
                  >
                    <div className="space-y-4 flex flex-col items-center">
                      <div className={`p-4 rounded-full border transition-all ${
                        isIframe 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800 group-hover:bg-emerald-500 group-hover:text-white' 
                          : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 group-hover:bg-nous-text group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black'
                      }`}>
                        <FastForward size={24} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-serif text-3xl italic tracking-tighter">Enter Ghost.</h3>
                        <p className="font-serif italic text-sm text-stone-400 leading-tight">Immediate Studio Access. Ephemeral Memory. No Manual Ritual.</p>
                        {isIframe && (
                          <p className="font-sans text-[8px] uppercase tracking-widest text-emerald-500 font-black mt-2">Recommended in this environment</p>
                        )}
                      </div>
                    </div>
                    <span className={`font-sans text-[8px] uppercase tracking-[0.4em] font-black py-2 px-6 border rounded-full transition-all ${
                      isIframe
                        ? 'border-stone-100 dark:border-stone-800 group-hover:bg-nous-text group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black'
                        : 'border-stone-100 dark:border-stone-800 group-hover:bg-nous-text group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black'
                    }`}>
                      Instant Pathway
                    </span>
                  </motion.button>
                </div>
              )}

              {/* Redirect fallback button — appears when popup was blocked */}
              <AnimatePresence>
                {showRedirectFallback && !isIframe && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <button
                      onClick={() => handleGoogleLogin(true)}
                      className="w-full py-4 bg-amber-500 text-white font-sans text-[9px] uppercase tracking-[0.4em] font-black rounded-full flex items-center justify-center gap-3"
                    >
                      <Compass size={14} className="animate-spin" /> Force Redirect Protocol
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alternate frequencies */}
              {!isUriMismatch && !isInternalError && (
                <>
                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-stone-100 dark:bg-stone-900" />
                    <span className="font-sans text-[8px] uppercase tracking-widest text-stone-300">Alternate Frequencies</span>
                    <div className="h-px flex-1 bg-stone-100 dark:bg-stone-900" />
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 justify-center flex-wrap">
                    <button onClick={() => setAuthMode('email-form')} className="px-8 py-4 border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-nous-text dark:hover:text-white font-sans text-[9px] uppercase tracking-widest font-black transition-all rounded-full flex items-center justify-center gap-2">
                      <Mail size={12} /> Manual Email Registry
                    </button>
                    {!isIframe && (
                      <button onClick={() => handleGoogleLogin(true)} className="px-8 py-4 border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-nous-text dark:hover:text-white font-sans text-[9px] uppercase tracking-widest font-black transition-all rounded-full flex items-center justify-center gap-2">
                        <Compass size={12} /> Google via Redirect
                      </button>
                    )}
                    <button onClick={handleGhostLogin} className="px-8 py-4 border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-nous-text dark:hover:text-white font-sans text-[9px] uppercase tracking-widest font-black transition-all rounded-full flex items-center justify-center gap-2">
                      <Ghost size={12} /> Ghost (Firebase Anon)
                    </button>
                  </div>
                </>
              )}

              {displayError && !isUriMismatch && !isInternalError && (
                <p className="font-serif italic text-xs text-red-500 animate-fade-in">{displayError}</p>
              )}

            </motion.div>
          ) : (
            /* ── Email form ── */
            <motion.div key="email-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-left max-w-md mx-auto">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                  <input
                    type="email" id="email" name="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Registry Email"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl py-5 pl-12 pr-4 font-mono text-xs focus:outline-none focus:border-nous-text transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                  <input
                    type="password" id="password" name="password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Passphrase"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl py-5 pl-12 pr-4 font-mono text-xs focus:outline-none focus:border-nous-text transition-all"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleEmailRitual}
                  disabled={!!isAccessing}
                  className="w-full py-6 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[10px] tracking-[0.5em] uppercase font-black rounded-full flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                >
                  {isAccessing === 'email' ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>{isSignUp ? 'Manifest Identity' : 'Consult Registry'}</span>
                </button>
                <div className="flex justify-between px-2 pt-2">
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-sans text-[8px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors">
                    {isSignUp ? 'Switch to Access' : 'New Refraction? Sign Up'}
                  </button>
                  <button type="button" onClick={() => setAuthMode('ritual')} className="font-sans text-[8px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors">
                    Return
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ── */}
        <div className="flex flex-col items-center gap-6 pt-12 border-t border-stone-100 dark:border-stone-900">
          <p className="font-serif italic text-xs text-stone-400 max-w-xs mx-auto">"Access requires a commitment to structural aesthetics."</p>
          <div className="flex gap-12">
            <button onClick={() => setLegalType('terms')} className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text flex items-center gap-2 transition-colors">
              <Scale size={10} /> Terms
            </button>
            <button onClick={() => setLegalType('privacy')} className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text flex items-center gap-2 transition-colors">
              <EyeOff size={10} /> Privacy
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
