
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Loader2, Beer as Martini, AlertTriangle, RefreshCw, Check, Scale, EyeOff, Anchor, ExternalLink, Mail, Key, ArrowRight, Cpu, X, Globe, Settings, Copy, ShieldAlert, Sparkles, LogIn, Compass, ShieldCheck, ZapOff, Fingerprint, Zap, FastForward } from 'lucide-react';
import { LegalOverlay } from './LegalOverlay';
import { ensureAuth, auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const Auth: React.FC = () => {
  const { login, ghostLogin, speedGhostEntrance, authError, user } = useUser();
  const [isAccessing, setIsAccessing] = useState<'google' | 'ghost' | 'email' | 'speed' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);
  const [authMode, setAuthMode] = useState<'ritual' | 'email-form'>('ritual');
  const [handshakeStatus, setHandshakeStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const displayError = authError || localError;
  const isApiBlocked = displayError?.includes('signup-are-blocked');
  const isPopupBlocked = displayError?.includes('popup-blocked') || displayError?.includes('cancelled-popup-request') || displayError?.includes('popup-closed-by-user');
  const isUriMismatch = displayError?.includes('invalid-continue-uri') || 
                        displayError?.includes('unauthorized-domain') || 
                        displayError?.includes('unauthorized-continue-uri');

  useEffect(() => {
    if (user && (isAccessing === 'google' || isAccessing === 'email' || isAccessing === 'speed')) {
      setIsSuccess(true);
      setHandshakeStatus("Identity Anchored.");
      const timer = setTimeout(() => setIsSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isAccessing]);

  const handleGoogleLogin = async (forceRedirect = false) => {
    setIsAccessing('google');
    setLocalError(null);
    setHandshakeStatus(forceRedirect ? "Initiating Redirection Protocol..." : "Initiating Sovereign Handshake...");
    try {
      await login(forceRedirect);
    } catch (e: any) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request' || e.code === 'auth/popup-closed-by-user') {
        setHandshakeStatus("Handshake Obstructed. Switching to Redirection...");
      } else if (e.code === 'auth/unauthorized-domain' || e.code === 'auth/invalid-continue-uri') {
        setHandshakeStatus("Registry Linkage Error.");
        setIsAccessing(null);
      } else {
        console.error("MIMI // Auth Trace:", e);
        setIsAccessing(null);
        setHandshakeStatus(null);
      }
    }
  };

  const handleEmailRitual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsAccessing('email');
    setLocalError(null);
    setHandshakeStatus("Calibrating Manual Access...");
    try {
      const activeAuth = await ensureAuth();
      if (isSignUp) {
        await createUserWithEmailAndPassword(activeAuth, email, password);
      } else {
        await signInWithEmailAndPassword(activeAuth, email, password);
      }
    } catch (e: any) {
      setLocalError(e.message || "Email protocol rejected.");
      setIsAccessing(null);
      setHandshakeStatus(null);
    }
  };

  const handleSpeedEntrance = async () => {
    setIsAccessing('speed');
    setLocalError(null);
    setHandshakeStatus("Opening Shadow Pathway...");
    try {
      await speedGhostEntrance();
    } catch (e: any) {
      setLocalError("The speed pathway is currently obstructed.");
      setIsAccessing(null);
      setHandshakeStatus(null);
    }
  };

  const handleGhostLogin = async () => {
    setIsAccessing('ghost');
    setLocalError(null);
    setHandshakeStatus("Manifesting Shadow Memory...");
    try {
      await ghostLogin();
    } catch (e: any) {
      setLocalError(e.message || "The shadow memory failed to manifest.");
      setIsAccessing(null);
      setHandshakeStatus(null);
    }
  };

  const activeProjectId = (auth.app as any).options.projectId;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const domainOnly = currentOrigin.replace(/^https?:\/\//, '');

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
                
                <AnimatePresence>
                  {handshakeStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl flex items-center gap-4 justify-center"
                    >
                      <Loader2 size={12} className="animate-spin text-stone-400" />
                      <span className="font-serif italic text-sm text-stone-500">{handshakeStatus}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isUriMismatch ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-amber-50 dark:bg-stone-900 border border-amber-200 dark:border-amber-900/40 rounded-3xl text-left space-y-6 shadow-xl">
                    <div className="flex items-center gap-3 text-amber-600"><ZapOff size={20} /><span className="font-sans text-[10px] uppercase tracking-widest font-black">Dissonance: Redirect Error</span></div>
                    <div className="space-y-4 font-serif italic text-sm text-stone-600 dark:text-stone-400 leading-relaxed text-balance">
                      <p>Mimi detected an "Unauthorized Origin." This domain must be manually whitelisted in your Firebase registry.</p>
                      <div className="p-5 bg-white/50 dark:bg-black/20 rounded-xl space-y-3 border border-amber-200 dark:border-amber-900/20">
                        <code className="text-[9px] p-2 bg-white dark:bg-stone-800 rounded border block truncate text-emerald-600 font-bold">{domainOnly}</code>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <button onClick={handleSpeedEntrance} className="w-full py-4 bg-nous-text text-white rounded-full font-sans text-[9px] uppercase tracking-[0.4em] font-black">Speed Entrance (Ghost)</button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* SWAN PATH */}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
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
                       <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black py-2 px-6 border border-stone-100 dark:border-stone-800 rounded-full group-hover:bg-nous-text group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">Google Anchor</span>
                    </motion.button>

                    {/* DIRECT GHOST PATHWAY */}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSpeedEntrance} 
                      disabled={!!isAccessing}
                      className="group relative flex flex-col items-center justify-between p-8 md:p-10 bg-stone-50 dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center gap-6"
                    >
                       <div className="space-y-4 flex flex-col items-center">
                          <div className="p-4 bg-white dark:bg-stone-800 rounded-full border border-stone-100 dark:border-stone-700 group-hover:bg-nous-text group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                             <FastForward size={24} />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-serif text-3xl italic tracking-tighter">Enter Ghost.</h3>
                            <p className="font-serif italic text-sm text-stone-400 leading-tight">Immediate Studio Access. Ephemeral Memory. No Manual Ritual.</p>
                          </div>
                       </div>
                       <span className="font-sans text-[8px] uppercase tracking-[0.4em] font-black py-2 px-6 border border-stone-100 dark:border-stone-800 rounded-full group-hover:bg-nous-text group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">Instant Pathway</span>
                    </motion.button>
                  </div>
                )}

                <div className="flex items-center gap-4 py-4">
                  <div className="h-px flex-1 bg-stone-100 dark:bg-stone-900" /><span className="font-sans text-[8px] uppercase tracking-widest text-stone-300">Alternate Frequencies</span><div className="h-px flex-1 bg-stone-100 dark:bg-stone-900" />
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button onClick={() => setAuthMode('email-form')} className="px-8 py-4 border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-nous-text dark:hover:text-white font-sans text-[9px] uppercase tracking-widest font-black transition-all rounded-full flex items-center justify-center gap-2"><Mail size={12} /> Manual Email Registry</button>
                    {(isPopupBlocked || isAccessing === 'google') && (
                      <button onClick={() => handleGoogleLogin(true)} className="px-8 py-4 bg-amber-500 text-white font-sans text-[9px] uppercase tracking-widest font-black rounded-full flex items-center justify-center gap-2"><Compass size={12} className="animate-spin" /> Redirect Protocol</button>
                    )}
                    <button onClick={handleGhostLogin} className="px-8 py-4 border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-nous-text dark:hover:text-white font-sans text-[9px] uppercase tracking-widest font-black transition-all rounded-full flex items-center justify-center gap-2"><Ghost size={12} /> Calibration Path (Ghost)</button>
                </div>

                {displayError && !isApiBlocked && !isPopupBlocked && !isUriMismatch && (
                  <p className="font-serif italic text-xs text-red-500 animate-fade-in">{displayError}</p>
                )}
            </motion.div>
          ) : (
            <motion.form key="email-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleEmailRitual} className="space-y-8 text-left max-w-md mx-auto">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Registry Email" className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl py-5 pl-12 pr-4 font-mono text-xs focus:outline-none focus:border-nous-text transition-all" required />
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Passphrase" className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl py-5 pl-12 pr-4 font-mono text-xs focus:outline-none focus:border-nous-text transition-all" required />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <button type="submit" disabled={!!isAccessing} className="w-full py-6 bg-nous-text dark:bg-white text-white dark:text-black font-sans text-[10px] tracking-[0.5em] uppercase font-black rounded-full flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">
                  {isAccessing === 'email' ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>{isSignUp ? 'Manifest Identity' : 'Consult Registry'}</span>
                </button>
                <div className="flex justify-between px-2 pt-2">
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-sans text-[8px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors">{isSignUp ? 'Switch to Access' : 'New Refraction? Sign Up'}</button>
                  <button type="button" onClick={() => setAuthMode('ritual')} className="font-sans text-[8px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors">Return</button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center gap-6 pt-12 border-t border-stone-100 dark:border-stone-900">
             <p className="font-serif italic text-xs text-stone-400 max-w-xs mx-auto">"Access requires a commitment to structural aesthetics."</p>
             <div className="flex gap-12">
                <button onClick={() => setLegalType('terms')} className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text flex items-center gap-2 transition-colors"><Scale size={10} /> Terms</button>
                <button onClick={() => setLegalType('privacy')} className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text flex items-center gap-2 transition-colors"><EyeOff size={10} /> Privacy</button>
             </div>
        </div>
      </motion.div>
    </div>
  );
};
