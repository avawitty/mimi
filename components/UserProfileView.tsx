
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile } from '../types';
import { uploadBlob } from '../services/firebase';
import { Loader2, Camera, Sparkles, Layers, Palette, Zap, Type, PenTool, ShieldCheck, Anchor, Ghost, Check, Fingerprint, Lock, Shield, Mail } from 'lucide-react';
import { useTheme, PALETTES } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export const UserProfileView: React.FC = () => {
  const { user, profile, updateProfile, linkAccount } = useUser();
  const { currentPalette, applyPalette } = useTheme();
  
  const [handle, setHandle] = useState('');
  const [processingMode, setProcessingMode] = useState<UserProfile['processingMode']>('movie');
  const [currentSeason, setCurrentSeason] = useState<UserProfile['currentSeason']>('blooming');
  const [performanceMode, setPerformanceMode] = useState<'minimalist-sans' | 'editorial-serif' | 'brutalist-mono'>('minimalist-sans');
  const [inspirations, setInspirations] = useState('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isPermanent = user && !user.isAnonymous;

  useEffect(() => {
    if (profile) {
      setHandle(profile.handle);
      setProcessingMode(profile.processingMode);
      setCurrentSeason(profile.currentSeason);
      setPreviewUrl(profile.photoURL || null);
      if (profile.tasteProfile) {
        setPerformanceMode((profile.tasteProfile.dominant_archetypes?.[0] as any) || 'minimalist-sans');
        setInspirations(profile.tasteProfile.inspirations || '');
      }
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAnchorIdentity = async () => {
    setIsLinking(true);
    setMessage(null);
    try {
      await linkAccount();
      // On redirect-based mobile auth, the page might reload, but on popup it won't.
      setMessage("Identity Anchored, Sovereign.");
    } catch (e: any) {
      console.error(e);
      setMessage(e.code === 'auth/popup-blocked' ? "Popup blocked. Redirecting..." : "Handshake interrupted.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    setMessage(null);
    try {
      let photoURL = profile.photoURL;
      if (avatarFile) {
        photoURL = await uploadBlob(avatarFile, `bins/avatars/${user.uid}/identity_${Date.now()}.jpg`);
      }
      
      const updatedProfile: UserProfile = {
        ...profile,
        handle: handle.trim(),
        photoURL,
        processingMode,
        currentSeason,
        isSwan: isPermanent,
        tasteProfile: {
           ...profile.tasteProfile,
           inspirations,
           primary_palette: [currentPalette.name, currentPalette.base, currentPalette.text, currentPalette.accent],
           dominant_archetypes: [performanceMode]
        }
      };
      await updateProfile(updatedProfile);
      setMessage("Identity preserved.");
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage("Preservation failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return <div className="flex justify-center p-24"><Loader2 className="animate-spin text-stone-300" /></div>;

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 pb-64 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="relative group cursor-pointer" onClick={() => (document.getElementById('avatarInput') as any)?.click()}>
            <div className={`w-44 h-44 rounded-full overflow-hidden border-2 shadow-2xl transition-all ${isPermanent ? 'border-emerald-500/30 group-hover:border-emerald-500' : 'border-stone-200 dark:border-stone-800 group-hover:border-nous-text'}`}>
              {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" /> : <div className="w-full h-full bg-stone-50 dark:bg-stone-900 flex items-center justify-center text-5xl font-serif italic text-stone-200">+</div>}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input id="avatarInput" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          
          <div className="flex-1 space-y-6 text-center md:text-left">
             <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-3 text-stone-400">
                   <span className="font-sans text-[9px] uppercase tracking-[0.6em] font-black">Identity_Refraction</span>
                   {isPermanent ? <ShieldCheck size={12} className="text-emerald-500" /> : <Ghost size={12} className="opacity-50" />}
                </div>
                <input 
                  type="text" 
                  value={handle} 
                  onChange={(e) => setHandle(e.target.value)} 
                  className="w-full bg-transparent border-none text-center md:text-left font-serif text-5xl md:text-7xl italic tracking-tighter focus:outline-none dark:text-white luminescent-text" 
                  placeholder="Handle" 
                />
                {user?.email && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-stone-400 mt-2">
                    <Mail size={10} />
                    <span className="font-mono text-[9px] uppercase tracking-widest">{user.email}</span>
                  </div>
                )}
             </div>
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {isPermanent ? (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-full">
                      <Sparkles size={12} className="text-emerald-500" />
                      <span className="font-sans text-[8px] uppercase tracking-widest text-emerald-600 font-black">Permanent Muse Anchor</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleAnchorIdentity}
                    disabled={isLinking}
                    className="flex items-center gap-2 px-6 py-3 bg-nous-text dark:bg-white text-white dark:text-stone-950 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all bg-emerald-400/10 border border-emerald-500/20 group"
                  >
                    {isLinking ? <Loader2 size={12} className="animate-spin" /> : <Anchor size={12} className="group-hover:rotate-12 transition-transform" />}
                    <span className="font-sans text-[9px] uppercase tracking-widest font-black">Anchor to Cloud</span>
                  </button>
                )}
             </div>
          </div>
      </div>

      <div className="grid md:grid-cols-2 gap-16">
        <div className="space-y-16">
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
               <Palette size={18} className="text-stone-400" />
               <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-500 font-black">Aesthetic Frequency</span>
            </div>
            
            <div className="space-y-10">
                <div className="grid grid-cols-5 gap-3">
                   {Object.values(PALETTES).map(p => (
                     <button 
                       key={p.name}
                       onClick={() => applyPalette(p.name)}
                       className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center group relative overflow-hidden ${currentPalette.name === p.name ? 'border-nous-text dark:border-white scale-110 shadow-xl' : 'border-stone-100 dark:border-stone-900 grayscale hover:grayscale-0'}`}
                       style={{ backgroundColor: p.base }}
                     >
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.accent }} />
                     </button>
                   ))}
                </div>
            </div>
          </section>
        </div>

        <div className="space-y-16">
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
               <Layers size={18} className="text-stone-400" />
               <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-500 font-black">Masthead Logic</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'minimalist-sans', label: 'Minimalist Sans', desc: 'Clinical, airy, Swiss-inspired logic.', icon: <Type size={14}/> },
                  { id: 'editorial-serif', label: 'Editorial Serif', desc: 'High-contrast, shadowed 90s glamour.', icon: <PenTool size={14}/> },
                  { id: 'brutalist-mono', label: 'Brutalist Mono', desc: 'Structural honesty and raw architecture.', icon: <Layers size={14}/> }
                ].map(mode => (
                  <button 
                    key={mode.id} 
                    onClick={() => setPerformanceMode(mode.id as any)}
                    className={`p-6 border rounded-sm text-left transition-all flex gap-6 ${performanceMode === mode.id ? 'border-nous-text dark:border-white bg-white dark:bg-stone-950 shadow-lg' : 'border-stone-100 dark:border-stone-900 grayscale opacity-40 hover:opacity-80'}`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border border-stone-200">
                      {mode.icon}
                    </div>
                    <div className="space-y-1">
                      <span className="font-sans text-[9px] uppercase tracking-widest font-black block">{mode.label}</span>
                      <p className="font-serif italic text-xs text-stone-500">{mode.desc}</p>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-10 right-10 z-[5000]">
        <motion.button 
          onClick={handleSave} 
          disabled={isSaving} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-[0_25px_50px_rgba(0,0,0,0.2)] transition-all overflow-hidden ${isPermanent ? 'bg-emerald-500 dark:bg-emerald-400 text-white dark:text-stone-950' : 'bg-nous-text dark:bg-white text-white dark:text-stone-950'}`}
        >
          {isSaving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Fingerprint className={`w-8 h-8 ${isPermanent ? 'animate-pulse' : ''}`} />}
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
        </motion.button>
        
        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: -140 }} exit={{ opacity: 0, x: 20 }} className="absolute top-1/2 -translate-y-1/2 right-full mr-8">
              <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl px-6 py-2 rounded-full border border-stone-200 dark:border-stone-800 shadow-xl">
                 <span className="font-sans text-[9px] uppercase tracking-[0.4em] font-black text-nous-text dark:text-white whitespace-nowrap">{message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
