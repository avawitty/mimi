
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, ArrowRight, Eye, Loader2, Beer as Martini, ShieldCheck, Type, PenTool, Layers, Sparkles, Anchor, Lock, Cloud } from 'lucide-react';
import { getLocalProfile } from '../services/localArchive';
import { useTheme, PALETTES } from '../contexts/ThemeContext';

type OnboardingStep = 'identity' | 'calibration' | 'taste' | 'commitment';

export const OnboardingModal: React.FC = () => {
  const { user, profile, updateProfile, login, ghostLogin, linkAccount } = useUser();
  const { applyPalette, currentPalette } = useTheme();
  const [step, setStep] = useState<OnboardingStep>('identity');
  
  const [handle, setHandle] = useState('');
  const [processingMode, setProcessingMode] = useState<UserProfile['processingMode']>('movie');
  const [currentSeason, setCurrentSeason] = useState<UserProfile['currentSeason']>('blooming');
  const [coreNeed, setCoreNeed] = useState<UserProfile['coreNeed']>('truth');
  const [performanceMode, setPerformanceMode] = useState<'minimalist-sans' | 'editorial-serif' | 'brutalist-mono'>('minimalist-sans');

  const [inspirations, setInspirations] = useState('');
  const [keywords, setKeywords] = useState('');
  const [selectedPaletteName, setSelectedPaletteName] = useState<string>(currentPalette.name);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const local = getLocalProfile();
    if (local && !handle) {
      setHandle(local.handle);
      setProcessingMode(local.processingMode);
      setCurrentSeason(local.currentSeason);
      setCoreNeed(local.coreNeed);
      if (local.tasteProfile) {
          setInspirations(local.tasteProfile.inspirations || '');
          setKeywords(local.tasteProfile.keywords || '');
          const pName = local.tasteProfile.primary_palette?.[0] || 'Stone';
          setSelectedPaletteName(pName);
          applyPalette(pName);
      }
    }
  }, []);

  const handleQuickEntry = async () => {
      if (!handle.trim()) return;
      setIsLoggingIn(true);
      try {
          await ghostLogin();
          setStep('calibration');
      } catch (e: any) {
          setLoginError("Ghost path obstructed.");
      } finally {
          setIsLoggingIn(false);
      }
  };

  const handlePaletteSelect = (name: string) => {
    setSelectedPaletteName(name);
    applyPalette(name); 
  };

  const handleSubmitProfile = async (useGoogle: boolean = false) => {
    if (!handle.trim()) return;
    setIsSubmitting(true);
    setLoginError(null);
    
    // Create the profile locally first to ensure "Active Subject" status
    const palette = PALETTES[selectedPaletteName] || PALETTES.Stone;
    const baseUid = user?.uid || `ghost_${Date.now()}`;
    
    const newProfile: UserProfile = {
      uid: baseUid,
      handle: handle.trim(),
      photoURL: `https://ui-avatars.com/api/?name=${handle}&background=random&color=fff`,
      processingMode,
      currentSeason,
      coreNeed,
      createdAt: Date.now(),
      tasteProfile: {
        inspirations,
        keywords,
        primary_palette: [palette.name, palette.base, palette.text, palette.accent],
        dominant_archetypes: [performanceMode]
      }
    };

    try {
      // Always secure local form first
      await updateProfile(newProfile);

      if (useGoogle) {
        // Now that we have a local profile, we link it to Google
        try {
          await linkAccount();
        } catch (linkErr: any) {
          console.warn("MIMI // Anchor failed:", linkErr);
          setLoginError("Identity Anchor failed. Proceeding as Ghost.");
          // We still keep the profile as a Ghost
        }
      }
    } catch (e: any) {
      console.error("MIMI // Accession Failure:", e);
      setLoginError(e.message || "Structural failure during manifestation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] bg-nous-base dark:bg-stone-950 flex items-center justify-center p-4 md:p-12 overflow-y-auto transition-colors duration-500">
      <AnimatePresence mode="wait">
        
        {step === 'identity' && (
          <motion.div key="identity" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md w-full space-y-12 text-center py-8">
            <div className="space-y-4">
               <div className="w-16 h-16 border border-stone-200 dark:border-stone-800 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                  <Ghost size={24} className="text-stone-400 animate-pulse" />
                  <div className="absolute inset-0 border-t border-nous-text dark:border-white rounded-full animate-[spin_4s_linear_infinite]" />
               </div>
               <h1 className="font-serif text-5xl md:text-7xl italic text-nous-text dark:text-white tracking-tighter">Enter as Ghost.</h1>
               <p className="font-sans text-[9px] md:text-[11px] uppercase tracking-[0.6em] text-stone-500 dark:text-stone-400 font-black">Assumption of a Temporary Form</p>
            </div>
            <div className="space-y-8">
               <div className="relative">
                  <input 
                    type="text" 
                    value={handle} 
                    onChange={(e) => setHandle(e.target.value)} 
                    placeholder="Ghost Handle" 
                    className="bg-transparent border-b border-stone-200 dark:border-stone-800 text-center font-serif text-3xl md:text-5xl py-6 focus:outline-none focus:border-nous-text dark:focus:border-white text-nous-text dark:text-white w-full placeholder:opacity-20" 
                    autoFocus 
                  />
               </div>
               <div className="flex flex-col gap-4">
                   <button 
                     onClick={handleQuickEntry} 
                     disabled={isLoggingIn || !handle.trim()} 
                     className="w-full py-6 bg-nous-text dark:bg-white text-white dark:text-stone-950 font-sans text-xs tracking-[0.5em] uppercase shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all font-black"
                   >
                       Witness Season <Eye size={16} />
                   </button>
                   {loginError && <p className="text-red-500 font-sans text-[8px] uppercase tracking-widest">{loginError}</p>}
               </div>
            </div>
          </motion.div>
        )}

        {step === 'calibration' && (
           <motion.div key="calibration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl w-full space-y-16 py-8">
                <div className="text-center space-y-4">
                    <h2 className="font-serif text-5xl italic tracking-tighter">Masthead Logic.</h2>
                    <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-stone-600 dark:text-stone-400 font-black">Which font is your soul?</p>
                </div>
                <div className="space-y-12">
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => setPerformanceMode('minimalist-sans')} className={`p-6 border rounded-sm flex flex-col items-center gap-4 transition-all ${performanceMode === 'minimalist-sans' ? 'bg-white dark:bg-stone-800 border-nous-text dark:border-white' : 'border-stone-100 dark:border-stone-900 grayscale opacity-40'}`}>
                                <Type size={24} className="text-nous-text dark:text-white" />
                                <span className="font-sans text-[7px] uppercase tracking-widest font-black">Minimalist Sans</span>
                            </button>
                            <button onClick={() => setPerformanceMode('editorial-serif')} className={`p-6 border rounded-sm flex flex-col items-center gap-4 transition-all ${performanceMode === 'editorial-serif' ? 'bg-white dark:bg-stone-800 border-nous-text dark:border-white' : 'border-stone-100 dark:border-stone-900 grayscale opacity-40'}`}>
                                <PenTool size={24} className="text-nous-text dark:text-white" />
                                <span className="font-sans text-[7px] uppercase tracking-widest font-black">Editorial Serif</span>
                            </button>
                            <button onClick={() => setPerformanceMode('brutalist-mono')} className={`p-6 border rounded-sm flex flex-col items-center gap-4 transition-all ${performanceMode === 'brutalist-mono' ? 'bg-white dark:bg-stone-800 border-nous-text dark:border-white' : 'border-stone-100 dark:border-stone-900 grayscale opacity-40'}`}>
                                <Layers size={24} className="text-nous-text dark:text-white" />
                                <span className="font-sans text-[7px] uppercase tracking-widest font-black">Brutalist Mono</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-stone-100 dark:border-stone-900 text-center">
                        <span className="font-sans text-[8px] uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400 font-black block">Temporal Season</span>
                        <div className="flex flex-wrap justify-center gap-3">
                            {['rotting', 'blooming', 'frozen', 'burning'].map(opt => (
                                <button key={opt} onClick={() => setCurrentSeason(opt as any)} className={`px-6 py-3 border rounded-full text-[10px] uppercase tracking-widest transition-all font-black ${currentSeason === opt ? 'bg-nous-text dark:bg-white text-white dark:text-stone-950' : 'border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:border-nous-text'}`}>{opt}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={() => setStep('taste')} className="w-full py-6 border border-stone-200 dark:border-stone-800 hover:border-nous-text dark:hover:border-white font-sans text-[11px] tracking-[0.5em] uppercase transition-all flex items-center justify-center gap-3 font-black">
                    Anchor Taste Archive <ArrowRight size={14} />
                </button>
           </motion.div>
        )}

        {step === 'taste' && (
           <motion.div key="taste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl w-full space-y-12 py-8">
                <div className="text-center space-y-4">
                    <h2 className="font-serif text-5xl italic tracking-tighter">Taste Logic.</h2>
                    <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-stone-600 dark:text-stone-400 font-black">Aesthetic Frequency Mapping</p>
                </div>
                <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="font-sans text-[8px] uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400 font-black">Visual Signifiers</label>
                        <textarea value={inspirations} onChange={(e) => setInspirations(e.target.value)} placeholder="e.g. brutalist, 90s, lace, fog..." className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-6 font-serif text-xl italic focus:outline-none focus:border-nous-text h-32 resize-none" />
                    </div>
                    <div className="space-y-6">
                        <label className="font-sans text-[8px] uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400 font-black text-center block">Chromatic Profile</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {Object.values(PALETTES).map((p) => (
                                <button key={p.name} onClick={() => handlePaletteSelect(p.name)} className={`p-4 border transition-all text-left flex flex-col gap-3 ${selectedPaletteName === p.name ? 'border-nous-text bg-white/50' : 'border-stone-100 hover:border-stone-300'}`}>
                                    <div className="flex -space-x-2">
                                        {[p.base, p.text, p.accent].map((c, i) => (<div key={i} className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: c }} />))}
                                    </div>
                                    <span className="font-sans text-[8px] uppercase tracking-widest font-black">{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={() => setStep('commitment')} className="w-full py-6 border border-stone-200 dark:border-stone-800 hover:border-nous-text dark:hover:border-white font-sans text-[11px] tracking-[0.5em] uppercase transition-all flex items-center justify-center gap-3 font-black">
                    Finalize Assumption <ArrowRight size={14} />
                </button>
           </motion.div>
        )}

        {step === 'commitment' && (
            <motion.div key="commitment" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-12 py-8">
                 <div className="space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 border border-stone-200 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-0 border-t-2 border-nous-text rounded-full animate-[spin_3s_ease-in-out_infinite]" />
                        <Martini size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 animate-pulse" />
                    </div>
                    <h2 className="font-serif text-5xl italic tracking-tighter">Manifest.</h2>
                    <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-stone-600 dark:text-stone-400 font-black">Choose your level of structural permanence</p>
                 </div>
                 
                 <div className="flex flex-col gap-4">
                    <button 
                        onClick={() => handleSubmitProfile(true)} 
                        disabled={isSubmitting} 
                        className="group w-full py-6 bg-nous-text dark:bg-white text-white dark:text-stone-950 font-sans text-xs tracking-[0.6em] uppercase font-black shadow-2xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-4 border border-emerald-500/20"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-emerald-400" />}
                        Mimi Müse (Swan)
                    </button>
                    
                    <button 
                        onClick={() => handleSubmitProfile(false)} 
                        disabled={isSubmitting} 
                        className="w-full py-5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-nous-text dark:hover:text-white font-sans text-[10px] tracking-[0.5em] uppercase font-black transition-all flex items-center justify-center gap-4"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Ghost size={14} className="mr-3" />}
                        Ephemeral Echo (Ghost)
                    </button>
                 </div>

                 {loginError && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-sans text-[9px] uppercase tracking-widest font-black">
                      {loginError}
                    </motion.p>
                 )}

                 <div className="space-y-4 px-8">
                    <p className="font-serif italic text-stone-400 text-xs">
                       *Mimi Müses enjoy cloud-registry persistence. Ghosts live only in the shadow-memory of this browser.
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-4 opacity-30">
                        <Cloud size={14} />
                        <div className="h-px w-12 bg-stone-300" />
                        <Anchor size={14} />
                    </div>
                 </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
