
// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile, TypographicArchetype, Persona } from '../types';
import { isHandleAvailable, uploadBlob, saveUserProfile } from '../services/firebaseUtils';
import { Loader2, Camera, Check, Type, PenTool, Layers, Moon, Orbit, ShieldCheck, Fingerprint, Palette, Scissors, Anchor, Heart, Info, ArrowRight, MapPin, Clock, Calendar, Cloud, Save, MousePointer2, Radio, Upload, Settings, Plus, X, Trash2, Key, ExternalLink, ToggleLeft, ToggleRight, Box, CheckCircle2, Zap, Wallet, User, ChevronRight, ChevronLeft, Sparkles, Eraser, Shield, Cpu, Link, Database, Crown } from 'lucide-react';
import { useTheme, PALETTES } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DeveloperSettings } from './DeveloperSettings';
import { ImperialPatronageModal } from './ImperialPatronageModal';

const DNAButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-3 py-6 md:py-10 transition-all duration-700 relative overflow-hidden group ${active ? 'text-nous-text dark:text-white' : 'text-stone-300 dark:text-stone-700 hover:text-stone-400'}`}
  >
    <div className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>{icon}</div>
    <span className="font-sans text-[7px] uppercase tracking-[0.4em] font-black">{label}</span>
    {active && <motion.div layoutId="dna-pill" className="absolute bottom-0 w-8 h-0.5 bg-emerald-500" />}
  </button>
);

const MaskCard: React.FC<{ persona: Persona; isActive: boolean; onSelect: () => void; onDelete: () => void }> = ({ persona, isActive, onSelect, onDelete }) => (
    <motion.div 
        layout
        whileHover={{ y: -5 }}
        onClick={onSelect}
        className={`relative shrink-0 w-64 md:w-80 p-8 rounded-sm border transition-all duration-700 cursor-pointer group ${isActive ? 'bg-white dark:bg-stone-900 border-emerald-500 shadow-2xl ring-1 ring-emerald-500/20' : 'bg-stone-50 dark:bg-black/20 border-stone-100 dark:border-stone-800 opacity-60 hover:opacity-100 shadow-sm'}`}
    >
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
            <User size={120} />
        </div>
        
        <div className="flex justify-between items-start mb-10 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${isActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'}`}>
                <User size={18} />
            </div>
            {isActive && (
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="font-sans text-[7px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400">Active Mask</span>
                </div>
            )}
        </div>

        <div className="space-y-6 relative z-10">
            <div className="space-y-1">
                <h3 className={`font-serif text-3xl italic tracking-tighter transition-colors ${isActive ? 'text-nous-text dark:text-white' : 'text-stone-500'}`}>{persona.name}.</h3>
                <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Identity Namespace</p>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 text-stone-400">
                    <Wallet size={10} className={persona.apiKey ? 'text-emerald-500' : ''} />
                    <span className="font-sans text-[7px] uppercase tracking-widest font-black">
                        {persona.apiKey ? 'Specific Billing Enabled' : 'Global Billing Registry'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-stone-400">
                    <Calendar size={10} />
                    <span className="font-sans text-[7px] uppercase tracking-widest font-black">Minted: {new Date(persona.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>

        {!isActive && (
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute bottom-6 right-6 p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 size={14} />
            </button>
        )}
    </motion.div>
);

export const UserProfileView: React.FC = () => {
  const { user, profile, updateProfile, logout, personas, activePersonaId, switchPersona, createPersona, deletePersona, linkAccount, featureFlags, toggleFeature } = useUser();
  const { currentPalette } = useTheme();
  
  const [handle, setHandle] = useState('');
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [archetype, setArchetype] = useState<TypographicArchetype>('minimalist-sans');
  const [tasteDefinition, setTasteDefinition] = useState('');
  
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaKey, setNewPersonaKey] = useState('');
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [showPatronageModal, setShowPatronageModal] = useState(false);
  const [patronagePrefill, setPatronagePrefill] = useState('');
  const [isPatronActive, setIsPatronActive] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const maskSliderRef = useRef<HTMLDivElement>(null);

  // Check patronage status on mount and when modal closes
  useEffect(() => {
      const checkPatron = () => {
          const status = localStorage.getItem('mimi_patron_status');
          setIsPatronActive(status === 'active' || featureFlags.proposal);
      };
      checkPatron();
      // Listen for local storage changes or modal closes
      const interval = setInterval(checkPatron, 1000);
      return () => clearInterval(interval);
  }, [featureFlags]);

  useEffect(() => {
    // If opened via Members link in footer or Redirect Flow
    const handleViewChange = (e) => {
        if(e.detail?.section === 'patronage') {
            if(e.detail.prefill) {
                setPatronagePrefill(e.detail.prefill);
                // Auto-confirm visually if we have a key (it will be validated in modal)
                // We'll let the modal validation handle the actual persistent state
            }
            setShowPatronageModal(true);
        }
    };
    window.addEventListener('mimi:change_view', handleViewChange);
    return () => window.removeEventListener('mimi:change_view', handleViewChange);
  }, []);

  useEffect(() => {
    if (profile) {
      setHandle(profile.handle || '');
      setArchetype((profile.tasteProfile?.dominant_archetypes?.[0] as TypographicArchetype) || 'minimalist-sans');
      setTasteDefinition(profile.tasteProfile?.inspirations || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!handle || handle === profile?.handle) {
      setHandleAvailable(true);
      return;
    }
    if (handle.length < 2) {
      setHandleAvailable(null);
      return;
    }
    setIsCheckingHandle(true);
    const timer = setTimeout(async () => {
      const available = await isHandleAvailable(handle, user?.uid || '');
      setHandleAvailable(available);
      setIsCheckingHandle(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [handle, user?.uid, profile?.handle]);

  const handleSave = async () => {
    if (!profile || isSaving || handleAvailable === false) return;
    setIsSaving(true);
    try {
      await updateProfile({ 
        ...profile, 
        handle: handle.trim().toLowerCase(), 
        tasteProfile: {
            ...profile.tasteProfile,
            inspirations: tasteDefinition,
            dominant_archetypes: [archetype]
        }
      });
      setMessage({ text: "Sovereign Registry Anchored.", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) { setMessage({ text: "Handshake Error.", type: 'error' }); } finally { setIsSaving(false); }
  };

  const handleCreateMask = async () => {
      if(!newPersonaName.trim()) return;
      await createPersona(newPersonaName, newPersonaKey);
      setNewPersonaName(''); setNewPersonaKey(''); setIsAddingPersona(false);
      setMessage({ text: "New Mask Minted.", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
  };

  const handleGoogleLink = async () => {
      if (user?.isAnonymous) {
          try {
              await linkAccount();
              setMessage({ text: "Identity Anchored to Google.", type: 'success' });
          } catch(e) {
              setMessage({ text: e.message || "Link Failed.", type: 'error' });
          }
      }
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center transition-colors duration-1000 bg-nous-base dark:bg-stone-950 pb-64 px-4 md:px-8 relative">
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-24 z-[10000] px-8 py-3 rounded-full font-sans text-[10px] uppercase tracking-widest font-black shadow-2xl border ${message.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}>
            {message.text}
          </motion.div>
        )}
        {showDevSettings && <DeveloperSettings onClose={() => setShowDevSettings(false)} />}
        {showPatronageModal && <ImperialPatronageModal isOpen={showPatronageModal} onClose={() => setShowPatronageModal(false)} prefillKey={patronagePrefill} />}
      </AnimatePresence>

      <div className="w-full max-w-5xl pt-16 md:pt-32 space-y-24 md:space-y-40">
        
        {/* IDENTITY OVERVIEW */}
        <section className="flex flex-col items-center gap-10 text-center relative">
            <div className="relative group">
                <div onClick={() => avatarInputRef.current?.click()} className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border border-black/5 dark:border-white/5 cursor-pointer shadow-2xl bg-stone-50 dark:bg-stone-900 relative">
                    <img src={profile?.photoURL || `https://ui-avatars.com/api/?name=${handle || 'G'}&background=1c1917&color=fff`} className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0" alt="" />
                    <div className="absolute inset-0 bg-nous-text/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-500"><Camera size={24} className="text-white" /></div>
                </div>
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => {}} />
            </div>

            <div className="space-y-6 w-full">
                <div className="flex flex-col items-center">
                    <span className="font-sans text-[7px] uppercase tracking-[0.6em] text-stone-400 font-black mb-2 italic">Global Registry Handle</span>
                    <div className="relative inline-flex items-center gap-4">
                        <span className="font-header text-3xl md:text-5xl text-stone-200">@</span>
                        <input type="text" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} className={`bg-transparent border-none p-0 font-header text-4xl md:text-7xl italic tracking-tighter focus:outline-none leading-none text-center ${handleAvailable === false ? 'text-red-500' : 'text-nous-text dark:text-white'}`} />
                    </div>
                </div>
                
                {/* DISCRETE GOOGLE ANCHOR / AGENT PROTOCOLS / SOVEREIGN KEY */}
                <div className="flex items-center gap-6 justify-center">
                    {user?.isAnonymous ? (
                        <button 
                          onClick={handleGoogleLink} 
                          className="inline-flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-stone-300 hover:text-emerald-500 transition-colors"
                        >
                           <Link size={10} /> Anchor Identity (Google)
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400 cursor-default bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                               <Shield size={10} /> Identity Anchored
                            </span>
                            {user?.email && (
                                <span className="font-serif italic text-xs text-stone-400 hidden md:inline">{user.email}</span>
                            )}
                        </div>
                    )}
                    
                    <div className="w-px h-4 bg-stone-200 dark:bg-stone-800" />

                    <button 
                      onClick={() => setShowDevSettings(true)}
                      className="inline-flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-stone-300 hover:text-indigo-400 transition-colors"
                    >
                       <Cpu size={10} /> Agent Protocols
                    </button>

                    <div className="w-px h-4 bg-stone-200 dark:bg-stone-800" />

                    {isPatronActive ? (
                        <button 
                          onClick={() => setShowPatronageModal(true)}
                          className="inline-flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-white bg-amber-500 px-4 py-1.5 rounded-full shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
                        >
                           <Crown size={10} className="fill-current" /> Imperial Patron
                        </button>
                    ) : (
                        <button 
                          onClick={() => setShowPatronageModal(true)}
                          className="inline-flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-stone-300 hover:text-amber-500 transition-colors"
                        >
                           <Key size={10} /> Sovereign Key
                        </button>
                    )}
                </div>
            </div>
        </section>

        {/* SOVEREIGN MASK SLIDER */}
        <section className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-6">
               <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 text-emerald-500">
                    <Layers size={18} className="animate-pulse" />
                    <h3 className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Sovereign Mask Slider</h3>
                  </div>
                  <p className="font-serif italic text-lg text-stone-500">Rotate across sectoral identities. Each mask is a separate strategic unit.</p>
               </div>
               <button onClick={() => setIsAddingPersona(true)} className="flex items-center gap-3 px-8 py-3 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-xl active:scale-95 transition-all">
                  <Plus size={14} /> Mint New Mask
               </button>
            </div>
            
            <div className="relative">
                <div ref={maskSliderRef} className="flex gap-8 overflow-x-auto no-scrollbar snap-x px-4 md:px-12 py-10">
                    {personas.map(p => (
                        <MaskCard 
                            key={p.id} 
                            persona={p} 
                            isActive={p.id === activePersonaId} 
                            onSelect={() => {
                                switchPersona(p.id);
                                window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: `Mask Alignment: ${p.name}`, icon: <Layers size={14} /> } }));
                            }}
                            onDelete={() => deletePersona(p.id)}
                        />
                    ))}
                </div>
                <div className="absolute top-0 left-0 bottom-0 w-20 bg-gradient-to-r from-nous-base dark:from-stone-950 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-nous-base dark:from-stone-950 to-transparent pointer-events-none" />
            </div>

            <AnimatePresence>
               {isAddingPersona && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-md">
                     <div className="w-full max-w-lg bg-white dark:bg-stone-900 p-12 rounded-sm border border-stone-200 dark:border-stone-800 shadow-2xl space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Sparkles size={120} />
                        </div>
                        <div className="space-y-3">
                           <h3 className="font-serif text-4xl italic tracking-tighter">Mint Logic.</h3>
                           <p className="font-sans text-[9px] uppercase tracking-widest text-stone-400 font-black">Establish a new compartmentalized identity.</p>
                        </div>
                        
                        <div className="space-y-8">
                           <div className="space-y-2">
                              <label className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Mask Identity Name</label>
                              <input value={newPersonaName} onChange={e => setNewPersonaName(e.target.value)} className="w-full bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-stone-800 p-4 font-serif text-xl italic focus:outline-none focus:border-emerald-500 rounded-sm" placeholder="e.g. Freelance Studio..." autoFocus />
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <label className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2"><Wallet size={12} /> Specific API Key (Optional)</label>
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center gap-1.5 font-sans text-[7px] uppercase tracking-widest font-black text-emerald-500 hover:text-emerald-400 transition-colors">
                                    Get Key <ExternalLink size={8} />
                                </a>
                              </div>
                              <input type="password" value={newPersonaKey} onChange={e => setNewPersonaKey(e.target.value)} className="w-full bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-stone-800 p-4 font-mono text-xs focus:outline-none focus:border-emerald-500 rounded-sm" placeholder="AIza..." />
                              <p className="font-serif italic text-xs text-stone-400">Essential for corporate billing or project isolation. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline decoration-emerald-500/30">Billing Docs</a></p>
                           </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                           <button onClick={() => setIsAddingPersona(false)} className="flex-1 py-4 font-sans text-[9px] uppercase tracking-widest font-black text-stone-400 hover:text-stone-600">Abort</button>
                           <button onClick={handleCreateMask} className="flex-[2] py-4 bg-nous-text dark:bg-white text-white dark:text-black rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-xl active:scale-95 transition-all">Manifest Mask</button>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
        </section>

        {/* TYPOGRAPHIC ARCHETYPE */}
        <section className="space-y-12">
            <div className="flex items-center justify-center gap-4">
               <div className="h-px w-12 bg-stone-100 dark:bg-stone-900" />
               <h3 className="font-sans text-[8px] md:text-[9px] uppercase tracking-[0.4em] font-black text-stone-400">Global Structural Logic</h3>
               <div className="h-px w-12 bg-stone-100 dark:bg-stone-900" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <DNAButton active={archetype === 'editorial-serif'} onClick={() => setArchetype('editorial-serif')} icon={<PenTool size={20} />} label="Editorial" />
                <DNAButton active={archetype === 'minimalist-sans'} onClick={() => setArchetype('minimalist-sans')} icon={<Type size={20} />} label="Minimalist" />
                <DNAButton active={archetype === 'brutalist-mono'} onClick={() => setArchetype('brutalist-mono')} icon={<Layers size={20} />} label="Brutalist" />
            </div>
        </section>

        {/* TASTE DEFINITION: THE ERASER LINE */}
        <section className="space-y-10">
            <div className="flex flex-col items-center gap-4 text-center">
               <div className="flex items-center gap-3 text-stone-400">
                  <Eraser size={16} />
                  <h3 className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">The Eraser Line</h3>
               </div>
               <p className="font-serif italic text-lg text-stone-500 max-w-md">Your grounding logic. This informs the Oracle whenever specific Mask data is unavailable—your aesthetic floor.</p>
            </div>
            <div className="p-10 bg-stone-50/50 dark:bg-stone-900/30 rounded-sm border border-black/5 dark:border-white/5 space-y-8 shadow-inner">
                <textarea value={tasteDefinition} onChange={e => setTasteDefinition(e.target.value)} placeholder="Describe your baseline era, inspirations, and scotopic preferences. e.g. Editorial flat flash, 16mm grain, direct lighting..." className="w-full bg-white dark:bg-stone-900 border border-black/5 dark:border-white/5 p-8 font-serif text-xl italic text-nous-text dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all resize-none h-64 rounded-sm shadow-sm" />
                <div className="flex justify-between items-center">
                    <p className="font-serif italic text-xs text-stone-400 max-w-sm">"This threshold ensures consistent quality across all your creative accounts."</p>
                    <button onClick={handleSave} className="flex items-center gap-2 font-sans text-[8px] uppercase tracking-widest font-black text-emerald-500 hover:text-emerald-400">
                        <Anchor size={12} /> Anchor Registry
                    </button>
                </div>
            </div>
        </section>

        <div className="pt-20 space-y-12 flex flex-col items-center">
            <button onClick={handleSave} disabled={isSaving || handleAvailable === false} className="w-full max-w-sm py-6 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full font-sans text-[11px] tracking-[0.5em] uppercase font-black shadow-2xl active:scale-95 transition-all">
                {isSaving ? "Syncing Logic..." : "Commit Global Handshake"}
            </button>
            <div className="h-px w-32 bg-stone-100 dark:bg-stone-900" />
            <button onClick={logout} className="font-sans text-[8px] uppercase tracking-[0.4em] text-red-400 font-black hover:text-red-500 transition-colors py-4">De-Anchor Account</button>
        </div>
      </div>
    </div>
  );
};
