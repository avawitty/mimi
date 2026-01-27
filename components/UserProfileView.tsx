
// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile, ZodiacSign, TasteManifesto } from '../types';
import { isHandleAvailable } from '../services/firebaseUtils';
import { clearLocalMemory } from '../services/localArchive';
import { generateCustomPalette } from '../services/geminiService';
import { Loader2, Camera, Sparkles, Palette, Fingerprint, RefreshCw, Activity, Sun, FileText, ShieldCheck, Wand2, Plus, Trash2, Hash, ChevronLeft, ChevronRight, Layers, PenTool, Type, Target, Volume2, Mic, Check, AlertCircle, Anchor } from 'lucide-react';
import { useTheme, PALETTES } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ValidationLegend } from './ValidationLegend';
import { TitleLegend } from './TitleLegend';
import { Tooltip } from './Tooltip';

export const UserProfileView: React.FC = () => {
  const { user, profile, updateProfile, linkAccount, logout, isEnvironmentRestricted } = useUser();
  const { currentPalette, applyPalette, manifestPalette } = useTheme();
  
  const [handle, setHandle] = useState('');
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(true);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<UserProfile['currentSeason']>('blooming');
  const [birthDate, setBirthDate] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [manifestos, setManifestos] = useState<TasteManifesto[]>([]);
  const [activeManifestoId, setActiveManifestoId] = useState<string>('');
  const [isManifestingColors, setIsManifestingColors] = useState(false);

  useEffect(() => {
    if (profile) {
      setHandle(profile.handle || '');
      setCurrentSeason(profile.currentSeason || 'blooming');
      setPreviewUrl(profile.photoURL || null);
      if (profile.birthDate) setBirthDate(new Date(profile.birthDate).toISOString().split('T')[0]);
      
      const m = profile.manifestos || [];
      if (m.length === 0) {
        const initial: TasteManifesto = {
          id: 'default',
          name: 'Core Vision',
          hashtag: 'Core',
          inspirations: profile.tasteProfile?.inspirations || '',
          archetype: (profile.tasteProfile?.dominant_archetypes?.[0] as any) || 'minimalist-sans',
          paletteName: profile.tasteProfile?.primary_palette?.[0] || 'The Journal',
          voicePreference: 'female'
        };
        setManifestos([initial]);
        setActiveManifestoId('default');
      } else {
        setManifestos(m);
        setActiveManifestoId(profile.activeManifestoId || m[0].id);
      }
    }
  }, [profile]);

  useEffect(() => {
    const active = manifestos.find(m => m.id === activeManifestoId);
    if (active && active.paletteName && active.paletteName !== currentPalette.name) {
      applyPalette(active.paletteName);
    }
  }, [activeManifestoId, manifestos, applyPalette, currentPalette.name]);

  const activeManifesto = useMemo(() => 
    manifestos.find(m => m.id === activeManifestoId) || manifestos[0]
  , [manifestos, activeManifestoId]);

  const updateActiveManifesto = (patch: Partial<TasteManifesto>) => {
    setManifestos(prev => prev.map(m => m.id === activeManifestoId ? { ...m, ...patch } : m));
  };

  const handleAddManifesto = () => {
    const id = `persona_${Date.now()}`;
    const newItem: TasteManifesto = {
      id,
      name: 'New Persona',
      hashtag: 'NewVibe',
      inspirations: '',
      archetype: 'minimalist-sans',
      paletteName: 'The Journal',
      voicePreference: 'female'
    };
    setManifestos(prev => [...prev, newItem]);
    setActiveManifestoId(id);
  };

  const handleDeleteManifesto = (id: string) => {
    if (manifestos.length <= 1) return;
    setManifestos(prev => prev.filter(m => m.id !== id));
    if (activeManifestoId === id) {
       const remaining = manifestos.find(m => m.id !== id);
       setActiveManifestoId(remaining?.id || '');
    }
  };

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    const birthDateTimestamp = birthDate ? new Date(birthDate).getTime() : undefined;
    const profileManifestos = profile.manifestos || [];
    const manifestosChanged = JSON.stringify(manifestos) !== JSON.stringify(profileManifestos);
    return handle !== profile.handle || 
           currentSeason !== profile.currentSeason || 
           activeManifestoId !== profile.activeManifestoId ||
           manifestosChanged ||
           birthDateTimestamp !== profile.birthDate || 
           !!avatarFile;
  }, [profile, handle, currentSeason, activeManifestoId, manifestos, birthDate, avatarFile]);

  useEffect(() => {
    if (handle === profile?.handle) { 
      setHandleAvailable(true); 
      setIsCheckingHandle(false);
      return; 
    }
    if (handle.length < 2) { 
      setHandleAvailable(null); 
      setIsCheckingHandle(false);
      return; 
    }
    
    setIsCheckingHandle(true);
    const timer = setTimeout(async () => {
      try {
        const available = await isHandleAvailable(handle, user?.uid || '');
        setHandleAvailable(available);
      } catch (e) { 
        setHandleAvailable(true); 
      } finally {
        setIsCheckingHandle(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [handle, profile?.handle, user?.uid]);

  const handleAnchor = async () => {
    setIsAnchoring(true);
    try {
      await linkAccount();
      setMessage({ text: "Identity Anchored.", type: 'success' });
    } catch (e) {
      setMessage({ text: "Handshake Failed.", type: 'error' });
    } finally {
      setIsAnchoring(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleManifestEssence = async () => {
    if (!profile || !activeManifesto) return;
    setIsManifestingColors(true);
    try {
      const palette = await generateCustomPalette({ 
        ...profile, 
        tasteProfile: { ...profile.tasteProfile, inspirations: activeManifesto.inspirations } 
      });
      manifestPalette({ ...palette, name: `Manifest: ${palette.name}` });
      updateActiveManifesto({ paletteName: `Manifest: ${palette.name}` });
      setMessage({ text: `Calibrated: ${palette.name}`, type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (e) {
      setMessage({ text: "Refraction blocked.", type: 'error' });
    } finally { setIsManifestingColors(false); }
  };

  const handleSave = useCallback(async () => {
    if (!profile || isSaving || (handleAvailable === false && handle !== profile.handle) || !handle.trim()) return;
    setIsSaving(true);
    try {
      let photoURL = profile.photoURL;
      if (avatarFile) {
        photoURL = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(avatarFile);
        });
      }
      const birthDateTimestamp = birthDate ? new Date(birthDate).getTime() : undefined;
      const updatedProfile: UserProfile = { 
        ...profile, 
        handle: handle.trim().toLowerCase(), 
        photoURL, 
        currentSeason, 
        activeManifestoId,
        manifestos,
        birthDate: birthDateTimestamp,
        lastActive: Date.now()
      };
      await updateProfile(updatedProfile);
      setAvatarFile(null);
      setMessage({ text: "Success.", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) { setMessage({ text: "Sync Error.", type: 'error' }); } finally { setIsSaving(false); }
  }, [profile, isSaving, handleAvailable, handle, avatarFile, currentSeason, activeManifestoId, manifestos, birthDate, updateProfile]);

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar relative flex flex-col items-center selection:bg-nous-text selection:text-white pb-64 pt-6 md:pt-10">
      
      <div className="fixed bottom-8 right-6 md:bottom-12 md:right-12 z-[5000] pb-safe flex flex-col items-center">
        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {hasChanges && !message && (
              <motion.div initial={{ opacity: 0, scale: 0.8, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute -top-10 right-0 whitespace-nowrap bg-amber-500 text-white px-3 py-1 rounded-full font-sans text-[8px] uppercase tracking-widest font-black shadow-lg">Persona Drift</motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`absolute -top-10 right-0 whitespace-nowrap px-3 py-1 rounded-full font-sans text-[8px] uppercase tracking-widest font-black shadow-lg ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{message.text}</motion.div>
            )}
          </AnimatePresence>
          <motion.button onClick={handleSave} disabled={isSaving || !hasChanges} whileTap={{ scale: 0.95 }} className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-2 transition-all shadow-2xl flex items-center justify-center bg-white/40 dark:bg-stone-900/60 backdrop-blur-3xl ${isSaving ? 'border-stone-200' : hasChanges ? 'bg-amber-500 border-white text-white cursor-pointer' : 'border-stone-100 dark:border-stone-800 text-stone-200 dark:text-stone-800'}`}>
              {isSaving ? <Loader2 size={24} className="animate-spin text-stone-300" /> : <Fingerprint className={`transition-all duration-700 w-8 h-8 md:w-12 md:h-12 ${hasChanges ? 'scale-110 opacity-100' : 'scale-100 opacity-40'}`} />}
          </motion.button>
        </div>
      </div>

      <div className="w-full max-w-4xl px-4 md:px-12 space-y-12">
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-14">
          <div className="relative group cursor-pointer shrink-0" onClick={() => (document.getElementById('avatarInput') as any)?.click()}>
            <div className={`w-32 h-32 md:w-56 md:h-56 rounded-full overflow-hidden border-2 shadow-xl transition-all duration-1000 ${user && !user.isAnonymous ? 'border-emerald-500' : 'border-stone-100 dark:border-stone-800'}`}>
              {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover grayscale" /> : <div className="w-full h-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center text-3xl font-serif italic text-stone-200">+</div>}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 rounded-full"><Camera size={24} className="text-white" /></div>
            </div>
            <input id="avatarInput" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          
          <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
             <div className="space-y-1 relative input-container group">
                <div className="flex items-center justify-center md:justify-start gap-2 text-stone-400">
                   <span className="font-sans text-[8px] md:text-[10px] uppercase tracking-widest font-black italic">{user?.isAnonymous ? 'Ephemeral Frequency' : 'Anchored Identity'}</span>
                   {!user?.isAnonymous && <ShieldCheck size={12} className="text-emerald-500" />}
                </div>
                <div className="relative">
                    <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} required pattern="^[a-zA-Z0-9_]{2,15}$" className={`w-full bg-transparent border-none p-0 text-center md:text-left font-serif text-4xl md:text-8xl italic tracking-tighter focus:outline-none transition-all leading-none ${handleAvailable === false ? 'text-red-500' : 'text-stone-900 dark:text-white'}`} placeholder="Subject" />
                    <div className="absolute -right-4 md:right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isCheckingHandle && <Loader2 size={24} className="animate-spin text-stone-300" />}
                        {handleAvailable === true && handle !== profile?.handle && <Check size={24} className="text-emerald-500" />}
                        {handleAvailable === false && handle !== profile?.handle && <AlertCircle size={24} className="text-red-500 animate-pulse" />}
                    </div>
                </div>
                <ValidationLegend />
             </div>
          </div>
        </header>

        {/* SWAN REGISTRY ANCHOR */}
        {user?.isAnonymous && (
          <section className="bg-stone-50 dark:bg-stone-900/50 p-8 md:p-12 rounded-[2.5rem] border border-emerald-500/20 shadow-xl space-y-8">
             <div className="flex items-center gap-4 text-emerald-600">
                <Sparkles size={20} className="animate-pulse" />
                <span className="font-sans text-[10px] uppercase tracking-[0.5em] font-black italic">The Swan Registry</span>
             </div>
             <div className="space-y-4">
                <h3 className="font-serif text-3xl md:text-5xl italic tracking-tighter leading-none">Anchor your debris.</h3>
                <p className="font-serif italic text-lg text-stone-500 leading-relaxed max-w-xl">
                  Ephemeral identities exist only in shadow-memory. Secure your artifacts across frequencies by anchoring to a permanent Google identity.
                </p>
             </div>
             <button 
               onClick={handleAnchor} 
               disabled={isAnchoring}
               className="w-full md:w-auto px-10 py-6 bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-sans text-xs tracking-[0.4em] uppercase font-black rounded-full shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
             >
                {isAnchoring ? <Loader2 size={16} className="animate-spin" /> : <Anchor size={16} />}
                Anchor Identity to Google
             </button>
          </section>
        )}

        {/* MANIFESTO PERSONA SELECTOR */}
        <section className="space-y-8 py-12 border-y border-stone-100 dark:border-stone-900">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                 <h3 className="font-header text-4xl md:text-6xl italic tracking-tighter leading-none">The Persona Carousel.</h3>
                 <p className="font-sans text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-stone-400 font-black">Oscillate between specialized frequencies</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex gap-2 mr-4">
                    {manifestos.map((m) => (
                      <button key={m.id} onClick={() => setActiveManifestoId(m.id)} className={`w-3 h-3 rounded-full transition-all ${activeManifestoId === m.id ? 'bg-nous-text dark:bg-white scale-125' : 'bg-stone-200 dark:border-stone-800'}`} />
                    ))}
                 </div>
                 <button onClick={handleAddManifesto} className="p-3 bg-stone-50 dark:bg-stone-900 rounded-full border border-stone-100 dark:border-stone-800 text-stone-400 hover:text-nous-text transition-all active:scale-90"><Plus size={16} /></button>
              </div>
           </div>

           <AnimatePresence mode="wait">
             {activeManifesto && (
               <motion.div key={activeManifestoId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10 bg-white dark:bg-stone-950 p-8 md:p-12 rounded-3xl border border-black/5 shadow-inner">
                  <div className="flex flex-col md:flex-row gap-8 justify-between">
                     <div className="space-y-4 flex-1 relative group/title">
                        <label className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Persona Title</label>
                        <input value={activeManifesto.name} onChange={(e) => updateActiveManifesto({ name: e.target.value })} className="w-full bg-transparent border-b border-stone-100 dark:border-stone-800 py-2 font-serif italic text-3xl md:text-5xl focus:outline-none focus:border-nous-text" />
                        <TitleLegend />
                     </div>
                     <div className="space-y-4 w-full md:w-64">
                        <label className="font-sans text-[8px] uppercase tracking-widest font-black text-stone-400">Archival Hashtag</label>
                        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 py-2">
                           <Hash size={18} className="text-stone-300" />
                           <input value={activeManifesto.hashtag} onChange={(e) => updateActiveManifesto({ hashtag: e.target.value.replace(/\s/g, '') })} className="w-full bg-transparent font-sans text-lg font-black uppercase tracking-widest focus:outline-none" placeholder="MODE_TAG" />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-black/5">
                     <section className="space-y-4">
                        <div className="flex items-center gap-3">
                           <FileText size={16} className="text-stone-300" />
                           <h4 className="font-sans text-[9px] uppercase tracking-widest text-stone-500 font-black">Visual Signifiers</h4>
                        </div>
                        <textarea value={activeManifesto.inspirations} onChange={(e) => updateActiveManifesto({ inspirations: e.target.value })} placeholder="Clinical silence, 90s grain..." className="w-full bg-stone-50/50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-6 font-serif text-xl italic focus:outline-none h-40 resize-none rounded-xl" />
                        
                        <div className="space-y-4 pt-6 border-t border-black/5">
                            <div className="flex items-center gap-3 text-stone-400">
                                <Volume2 size={16} />
                                <span className="font-sans text-[8px] uppercase tracking-widest font-black">Sonic Frequency</span>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                  onClick={() => updateActiveManifesto({ voicePreference: 'female' })} 
                                  className={`flex-1 py-4 border rounded-xl font-sans text-[8px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 ${activeManifesto.voicePreference === 'female' ? 'bg-nous-text text-white border-nous-text dark:bg-white dark:text-stone-900' : 'border-stone-100 dark:border-stone-800 text-stone-400 opacity-40'}`}
                                >
                                   <Sparkles size={12} /> The Oracle [Mimi]
                                </button>
                                <button 
                                  onClick={() => updateActiveManifesto({ voicePreference: 'male' })} 
                                  className={`flex-1 py-4 border rounded-xl font-sans text-[8px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 ${activeManifesto.voicePreference === 'male' ? 'bg-nous-text text-white border-nous-text dark:bg-white dark:text-stone-900' : 'border-stone-100 dark:border-stone-800 text-stone-400 opacity-40'}`}
                                >
                                   <Target size={12} /> The Handler [Core]
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                           <button onClick={handleManifestEssence} disabled={isManifestingColors || activeManifesto.inspirations.length < 10} className="px-8 py-3 bg-nous-text dark:bg-stone-100 text-white dark:text-stone-900 font-sans text-[8px] uppercase tracking-widest font-black rounded-full shadow-lg active:scale-95 flex items-center gap-3 disabled:opacity-20">
                              {isManifestingColors ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                              Manifest Persona DNA
                           </button>
                        </div>
                     </section>

                     <section className="space-y-8">
                        <div className="space-y-4">
                           <div className="flex items-center gap-3"><Target size={16} className="text-stone-300" /><h4 className="font-sans text-[9px] uppercase tracking-widest text-stone-500 font-black">Typographic DNA</h4></div>
                           <div className="grid grid-cols-3 gap-2">
                              {[
                                { key: 'minimalist-sans', icon: <Type size={18} /> },
                                { key: 'editorial-serif', icon: <PenTool size={18} /> },
                                { key: 'brutalist-mono', icon: <Layers size={18} /> }
                              ].map((m) => (
                                <button key={m.key} onClick={() => updateActiveManifesto({ archetype: m.key })} className={`p-4 border rounded-sm flex flex-col items-center gap-2 transition-all ${activeManifesto.archetype === m.key ? 'bg-white dark:bg-stone-800 border-nous-text dark:border-white shadow-md' : 'opacity-30 border-stone-100 dark:border-stone-900 grayscale'}`}>
                                   {m.icon}
                                   <span className="font-sans text-[6px] uppercase font-black">{m.key.split('-')[0]}</span>
                                </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center gap-3"><Palette size={16} className="text-stone-300" /><h4 className="font-sans text-[9px] uppercase tracking-widest text-stone-500 font-black">Chromatic Profile</h4></div>
                           <div className="grid grid-cols-2 gap-2">
                             {Object.values(PALETTES).slice(0, 4).map(p => (
                               <button key={p.name} onClick={() => updateActiveManifesto({ paletteName: p.name })} className={`p-3 border transition-all rounded-xl text-left flex items-center gap-4 ${activeManifesto.paletteName === p.name ? 'border-nous-text dark:border-white shadow-sm' : 'opacity-30 grayscale'}`} style={{ backgroundColor: p.base }}>
                                 <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: p.accent }} />
                                 <span className="font-sans text-[7px] uppercase tracking-widest font-black" style={{ color: p.text }}>{p.name}</span>
                               </button>
                             ))}
                           </div>
                        </div>
                     </section>
                  </div>

                  <div className="pt-8 border-t border-black/5 flex justify-end">
                     <button onClick={() => handleDeleteManifesto(activeManifestoId)} className="flex items-center gap-2 text-red-400 hover:text-red-600 transition-colors font-sans text-[8px] uppercase tracking-widest font-black"><Trash2 size={12} /> Purge Persona</button>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            <section className="space-y-4">
                <div className="flex items-center gap-3 border-b border-stone-50 dark:border-stone-900 pb-2"><Activity size={16} className="text-stone-300" /><h3 className="font-sans text-[9px] md:text-[11px] uppercase tracking-[0.5em] text-stone-500 font-black">Season</h3></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['rotting', 'blooming', 'frozen', 'burning'].map(opt => (
                      <button key={opt} onClick={() => setCurrentSeason(opt as any)} className={`py-4 md:py-8 border transition-all rounded-xl ${currentSeason === opt ? 'bg-nous-text text-white dark:bg-white dark:text-stone-950 border-transparent shadow-lg' : 'border-stone-50 dark:border-stone-900 text-stone-300'}`}>
                        <span className="font-sans text-[8px] md:text-[11px] uppercase tracking-widest font-black">{opt}</span>
                      </button>
                  ))}
                </div>
            </section>
            <section className="space-y-4">
                <div className="flex items-center gap-3 border-b border-stone-50 dark:border-stone-900 pb-2"><Sun size={16} className="text-amber-400" /><h3 className="font-sans text-[9px] md:text-[11px] uppercase tracking-[0.5em] text-stone-500 font-black">Celestial</h3></div>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 p-4 font-mono text-[10px] focus:outline-none rounded-xl" />
            </section>
        </section>

        <section className="mt-16 md:mt-32 pt-12 border-t border-stone-50 dark:border-stone-900 flex flex-col items-center gap-8">
              {!user?.isAnonymous && (
                <button onClick={logout} className="font-sans text-[9px] uppercase tracking-widest text-red-500 font-black hover:underline decoration-2">De-Anchor Identity</button>
              )}
              <button onClick={() => { if (confirm("Mandate: Purge cache?")) clearLocalMemory(); }} className="flex items-center gap-4 px-6 py-4 bg-red-50/20 hover:bg-red-600 transition-all border border-red-100 dark:border-red-900/10 rounded-full group">
                  <span className="font-sans text-[9px] uppercase tracking-[0.3em] font-black group-hover:text-white">Purge Local Memory</span>
                  <RefreshCw size={14} className="text-red-300 group-hover:text-white group-hover:rotate-180 transition-transform duration-700" />
              </button>
              <div className="opacity-20 pointer-events-none select-none py-10"><h1 className="font-header italic text-5xl text-stone-900">Mimi.</h1></div>
        </section>
      </div>
    </div>
  );
};
