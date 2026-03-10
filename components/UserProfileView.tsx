
// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile, TypographicArchetype, Persona } from '../types';
import { isHandleAvailable, uploadBlob, saveUserProfile, fetchUserZines, fetchPocketItems } from '../services/firebaseUtils';
import { Loader2, Camera, Check, Type, PenTool, Layers, Moon, Orbit, ShieldCheck, Fingerprint, Palette, Scissors, Anchor, Heart, Info, ArrowRight, MapPin, Clock, Calendar, Cloud, Save, MousePointer2, Radio, Upload, Settings, Plus, X, Trash2, Key, ExternalLink, ToggleLeft, ToggleRight, Box, CheckCircle2, Zap, Wallet, User, ChevronRight, ChevronLeft, Sparkles, Eraser, Shield, Cpu, Link, Database, Crown, Download, FileJson, RefreshCw, Users, BookOpen, Activity } from 'lucide-react';
import { useTheme, PALETTES } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DeveloperSettings } from './DeveloperSettings';
import { ImperialPatronageModal } from './ImperialPatronageModal';
import { ConnectionsManager } from './ConnectionsManager';
import { ArchetypeIndex } from './ArchetypeIndex';
import { TasteGraph } from './TasteGraph';
import { SovereignIdentityCardView } from './SovereignIdentityCardView'; // NEW

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

const MaskCard: React.FC<{ persona: Persona; isActive: boolean; onSelect: () => void; onDelete: () => void; onUpdate: (p: Persona) => void; userUid: string }> = ({ persona, isActive, onSelect, onDelete, onUpdate, userUid }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const url = await uploadBlob(file, `avatars/${userUid}_mask_${persona.id}_${Date.now()}`);
                onUpdate({ ...persona, photoURL: url });
                window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Mask Visual Anchored.", type: 'success' } }));
            } catch (err) {
                console.error("Mask upload failed", err);
                window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Upload Failed.", type: 'error' } }));
            }
        }
    };

    return (
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
                <div 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner overflow-hidden border border-black/5 dark:border-white/5 cursor-pointer relative group/avatar ${isActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'}`}
                >
                    {persona.photoURL ? (
                        <img src={persona.photoURL} className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover/avatar:grayscale-0" alt="" />
                    ) : (
                        <User size={18} />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <Camera size={14} className="text-white" />
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                />
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
};

export const UserProfileView: React.FC = () => {
  const { user, profile, updateProfile, logout, personas, activePersonaId, switchPersona, createPersona, updatePersona, deletePersona, linkAccount, verifyIdentity, featureFlags, toggleFeature, keyRing, addKeyToRing, removeKeyFromRing, openKeySelector, signInWithGooglePopup } = useUser();
  const { currentPalette } = useTheme();
  
  const [handle, setHandle] = useState('');
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showHandleConfirm, setShowHandleConfirm] = useState(false);
  
  const [archetype, setArchetype] = useState<TypographicArchetype>('minimalist-sans');
  const [tasteDefinition, setTasteDefinition] = useState('');
  
  const handleGenerateDescription = async () => {
    if (!profile) return;
    setIsGeneratingDescription(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `Generate a short, poetic, and evocative description for a user profile based on their taste profile: ${JSON.stringify(profile.tasteProfile)}. The description should be in the style of a creative director or curator.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      if (response.text) {
        await updateProfile({ ...profile, bio: response.text });
        setMessage({ text: "Description generated and anchored.", type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setMessage({ text: "Generation failed.", type: 'error' });
    } finally {
      setIsGeneratingDescription(false);
    }
  };
  
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaKey, setNewPersonaKey] = useState('');
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [showPatronageModal, setShowPatronageModal] = useState(false);
  const [patronagePrefill, setPatronagePrefill] = useState('');
  const [isPatronActive, setIsPatronActive] = useState(false);
  
  const [showKeyRing, setShowKeyRing] = useState(false);
  const [newRingKey, setNewRingKey] = useState('');

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
    
    // If handle changed, require confirmation
    if (handle.trim().toLowerCase() !== profile.handle && !showHandleConfirm) {
        setShowHandleConfirm(true);
        return;
    }

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
      setShowHandleConfirm(false);
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

  const handleGoogleLink = async (forceRedirect = false) => {
      if (user?.isAnonymous) {
          try {
              if (forceRedirect) {
                  await linkAccount(true);
                  return;
              }
              await linkAccount();
              setMessage({ text: "Identity Anchored to Google.", type: 'success' });
          } catch(e) {
              console.error("Link Error:", e);
              setMessage({ text: e.message || "Link Failed.", type: 'error' });
              // If it's an internal error, show troubleshooting
              if (e.code === 'auth/internal-error' || e.message?.includes('internal-error')) {
                  window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
                      detail: { 
                          message: "Auth Internal Error detected. Try Redirect Flow.", 
                          type: 'error' 
                      } 
                  }));
              }
          }
      }
  };

  const handleAddRingKey = () => {
      if (!newRingKey.trim()) return;
      addKeyToRing(newRingKey);
      setNewRingKey('');
      setMessage({ text: "Key Added to Ring.", type: 'success' });
      setTimeout(() => setMessage(null), 2000);
  };

  const handleExportData = async () => {
      if (!user) return;
      setIsExporting(true);
      try {
          const zines = await fetchUserZines(user.uid);
          const pocket = await fetchPocketItems(user.uid);
          const fullData = {
              profile: profile,
              manifests: zines,
              artifacts: pocket,
              exportDate: new Date().toISOString(),
              version: "Mimi_v4.5"
          };
          
          const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Mimi_Archive_${handle || 'Sovereign'}_${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
              detail: { message: "Archive Download Initiated.", icon: <Download size={14} /> } 
          }));
      } catch(e) {
          console.error("Export Failed", e);
          setMessage({ text: "Backup Failed.", type: 'error' });
      } finally {
          setIsExporting(false);
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
                <input 
                    type="file" 
                    id="avatarUpload" 
                    name="avatarUpload" 
                    ref={avatarInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && profile) {
                            try {
                                const url = await uploadBlob(file, `avatars/${user?.uid}_${Date.now()}`);
                                await updateProfile({ ...profile, photoURL: url });
                                setMessage({ text: "Identity Visual Anchored.", type: 'success' });
                                setTimeout(() => setMessage(null), 3000);
                            } catch (err) {
                                setMessage({ text: "Upload Failed.", type: 'error' });
                                setTimeout(() => setMessage(null), 3000);
                            }
                        }
                    }} 
                />
            </div>

            <div className="space-y-4 w-full">
                <div className="flex flex-col items-center">
                    <span className="font-sans text-[7px] uppercase tracking-[0.6em] text-stone-400 font-black mb-1 italic">Global Registry Handle</span>
                    <div className="relative inline-flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                            <span className="font-header text-2xl md:text-4xl text-stone-200">@</span>
                            <input 
                                type="text" 
                                id="userHandle" 
                                name="userHandle" 
                                value={handle} 
                                onChange={(e) => {
                                    setHandle(e.target.value.toLowerCase());
                                    setShowHandleConfirm(false);
                                }} 
                                className={`bg-transparent border-none p-0 font-header text-3xl md:text-6xl italic tracking-tighter focus:outline-none leading-none text-center ${handleAvailable === false ? 'text-red-500' : 'text-nous-text dark:text-white'}`} 
                            />
                        </div>
                        
                        <button 
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDescription}
                            className="mt-2 text-[8px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors flex items-center gap-2"
                        >
                            {isGeneratingDescription ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            {isGeneratingDescription ? 'Generating...' : 'Generate Description'}
                        </button>
                        
                        {showHandleConfirm && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-sm space-y-3 max-w-xs"
                            >
                                <p className="font-sans text-[8px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-black">Confirm Registry Handle Change?</p>
                                <div className="flex gap-3 justify-center">
                                    <button 
                                        onClick={handleSave}
                                        className="px-4 py-1.5 bg-amber-500 text-white text-[8px] uppercase tracking-widest font-black rounded-full hover:bg-amber-600 transition-colors shadow-lg"
                                    >
                                        Confirm
                                    </button>
                                    <button 
                                        onClick={() => { setHandle(profile?.handle || ''); setShowHandleConfirm(false); }}
                                        className="px-4 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-500 text-[8px] uppercase tracking-widest font-black rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
                
                {/* DISCRETE GOOGLE ANCHOR / AGENT PROTOCOLS / SOVEREIGN KEY */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full max-w-4xl">
                        <button 
                          onClick={signInWithGooglePopup} 
                          className="h-9 px-4 rounded-full border border-stone-200 dark:border-stone-800 font-sans text-[7px] uppercase tracking-widest font-black text-stone-500 hover:text-emerald-600 hover:border-emerald-500/50 transition-all flex items-center gap-2 bg-white dark:bg-stone-900 shadow-sm whitespace-nowrap"
                        >
                           <Link size={10} /> Sign in with Google
                        </button>
                        <button 
                          onClick={() => handleGoogleLink(false)} 
                          className="h-9 px-4 rounded-full border border-stone-200 dark:border-stone-800 font-sans text-[7px] uppercase tracking-widest font-black text-stone-500 hover:text-emerald-600 hover:border-emerald-500/50 transition-all flex items-center gap-2 bg-white dark:bg-stone-900 shadow-sm whitespace-nowrap"
                        >
                           <Link size={10} /> Anchor Identity (Legacy)
                        </button>
                        <button 
                          onClick={() => handleGoogleLink(true)} 
                          className="h-9 px-4 rounded-full border border-stone-200 dark:border-stone-800 font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 hover:text-amber-600 hover:border-amber-500/50 transition-all flex items-center gap-2 bg-white dark:bg-stone-900 shadow-sm whitespace-nowrap"
                          title="Use this if the standard login fails"
                        >
                           <RefreshCw size={10} /> Force Redirect
                        </button>
                        <button 
                          onClick={verifyIdentity} 
                          className="h-9 px-4 rounded-full border border-stone-200 dark:border-stone-800 font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 hover:text-emerald-600 hover:border-emerald-500/50 transition-all flex items-center gap-2 bg-white dark:bg-stone-900 shadow-sm whitespace-nowrap"
                          title="Manually verify identity if state is stuck"
                        >
                           <ShieldCheck size={10} /> Verify Handshake
                        </button>
                        
                        <button 
                          onClick={() => setShowDevSettings(true)}
                          className="h-9 px-4 rounded-full border border-stone-200 dark:border-stone-800 font-sans text-[7px] uppercase tracking-widest font-black text-stone-500 hover:text-indigo-500 hover:border-indigo-500/50 transition-all flex items-center gap-2 bg-white dark:bg-stone-900 shadow-sm whitespace-nowrap"
                        >
                           <Cpu size={10} /> Protocols
                        </button>

                        <button 
                          onClick={() => setShowKeyRing(!showKeyRing)}
                          className={`h-9 px-4 rounded-full border font-sans text-[7px] uppercase tracking-widest font-black transition-all flex items-center gap-2 bg-white dark:bg-stone-900 shadow-sm whitespace-nowrap ${showKeyRing || keyRing.length > 0 ? 'border-amber-500/50 text-amber-600 dark:text-amber-500' : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:text-amber-500 hover:border-amber-500/50'}`}
                        >
                           <Key size={10} /> Key Ring ({keyRing.length})
                        </button>
                    </div>
                </div>
                
                {/* KEY RING EXPANDER */}
                <AnimatePresence>
                    {showKeyRing && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-6 rounded-sm max-w-lg mx-auto space-y-4">
                                <div className="space-y-1 text-center">
                                    <h4 className="font-serif italic text-lg text-nous-text dark:text-white">The Key Ring.</h4>
                                    <p className="font-sans text-[8px] uppercase tracking-widest text-stone-400 font-black">Multi-Key Resilience Architecture</p>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar border-y border-stone-200 dark:border-stone-800 py-2">
                                    {keyRing.length === 0 && <p className="text-center font-serif italic text-xs text-stone-400 py-2">No keys anchored. Operating on default limits.</p>}
                                    {keyRing.map((k, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white dark:bg-black/20 p-2 rounded-sm border border-stone-100 dark:border-stone-800">
                                            <span className="font-mono text-[9px] text-stone-500">••••••••{k.slice(-4)}</span>
                                            <button onClick={() => removeKeyFromRing(k)} className="text-stone-300 hover:text-red-500"><Trash2 size={10}/></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="password" value={newRingKey} onChange={e => setNewRingKey(e.target.value)} placeholder="Paste AI Studio Key..." className="flex-1 bg-white dark:bg-black border border-stone-200 dark:border-stone-800 p-2 font-mono text-xs focus:outline-none focus:border-amber-500 rounded-sm" />
                                    <button onClick={handleAddRingKey} className="px-4 bg-amber-500 text-white font-sans text-[8px] uppercase font-black rounded-sm hover:bg-amber-600 transition-colors">Add</button>
                                </div>
                                <div className="pt-2">
                                    <button 
                                        onClick={openKeySelector}
                                        className="w-full py-3 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-sans text-[8px] uppercase tracking-widest font-black rounded-sm hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={10} /> Select Sovereign Key (Paid Registry)
                                    </button>
                                </div>
                                <p className="text-[9px] text-stone-400 text-center px-4 leading-tight">
                                    Adding multiple keys enables automatic rotation if one frequency becomes saturated (429/Quota Limit). Keys are stored locally.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>

        {/* THE TASTE GRAPH */}
        <section className="space-y-12">
            <div className="flex flex-col items-center gap-2 text-center">
               <div className="flex items-center gap-3 text-stone-400">
                 <Activity size={18} />
                 <span className="font-sans text-[9px] uppercase tracking-[0.5em] font-black italic">Aesthetic Intelligence</span>
               </div>
               <p className="font-serif italic text-sm text-stone-500 max-w-md">
                 Your semantic taste vector, mapped from your saved fragments and generated artifacts.
               </p>
            </div>
            <div className="max-w-3xl mx-auto w-full px-4">
                <TasteGraph tasteVector={profile?.tasteVector} variant="portrait" />
            </div>
        </section>

        {/* SOVEREIGN IDENTITY CARD */}
        {profile?.tasteProfile?.sovereignIdentity && (
            <section className="space-y-12">
                <div className="flex flex-col items-center gap-2 text-center">
                   <div className="flex items-center gap-3 text-stone-400">
                     <Fingerprint size={18} />
                     <span className="font-sans text-[9px] uppercase tracking-[0.5em] font-black italic">Sovereign Identity</span>
                   </div>
                </div>
                <div className="max-w-md mx-auto w-full px-4">
                    <SovereignIdentityCardView card={profile.tasteProfile.sovereignIdentity} />
                </div>
            </section>
        )}

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
               <button onClick={() => setIsAddingPersona(true)} className="flex items-center gap-3 px-8 py-3 bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-500 rounded-full font-sans text-[9px] uppercase tracking-widest font-black shadow-lg hover:shadow-xl hover:text-stone-600 dark:hover:text-stone-300 active:scale-95 transition-all border border-stone-100 dark:border-stone-800">
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
                            onUpdate={updatePersona}
                            userUid={user?.uid || 'ghost'}
                        />
                    ))}
                </div>
                <div className="absolute top-0 left-0 bottom-0 w-20 bg-gradient-to-r from-nous-base dark:from-stone-950 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-nous-base dark:from-stone-900 to-transparent pointer-events-none" />
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
                              <label htmlFor="personaName" className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400">Mask Identity Name</label>
                              <input id="personaName" name="personaName" value={newPersonaName} onChange={e => setNewPersonaName(e.target.value)} className="w-full bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-stone-800 p-4 font-serif text-xl italic focus:outline-none focus:border-emerald-500 rounded-sm" placeholder="e.g. Freelance Studio..." autoFocus />
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <label htmlFor="personaKey" className="font-sans text-[7px] uppercase tracking-widest font-black text-stone-400 flex items-center gap-2"><Wallet size={12} /> Specific API Key (Optional)</label>
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center gap-1.5 font-sans text-[7px] uppercase tracking-widest font-black text-emerald-500 hover:text-emerald-400 transition-colors">
                                    Get Key <ExternalLink size={8} />
                                </a>
                              </div>
                              <input type="password" id="personaKey" name="personaKey" value={newPersonaKey} onChange={e => setNewPersonaKey(e.target.value)} className="w-full bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-stone-800 p-4 font-mono text-xs focus:outline-none focus:border-emerald-500 rounded-sm" placeholder="AIza..." />
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
        
        {/* ARCHETYPE INDEX */}
        <section className="space-y-12">
            <div className="flex flex-col items-center gap-2 text-center">
               <div className="flex items-center gap-3 text-stone-400">
                  <BookOpen size={18} />
                  <h3 className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Archetype Index</h3>
               </div>
               <p className="font-serif italic text-lg text-stone-500 max-w-md">The compendium of detected states across the collective registry.</p>
            </div>
            <div className="bg-white dark:bg-stone-900/20 border border-stone-100 dark:border-stone-800 rounded-sm overflow-hidden">
                <ArchetypeIndex onSelectZine={(zine) => {
                    window.dispatchEvent(new CustomEvent('mimi:select_zine', { detail: { zine } }));
                }} />
            </div>
        </section>

        {/* SOCIAL GRAPH / CONNECTIONS */}
        <section className="space-y-12">
            <div className="flex flex-col items-center gap-2 text-center">
               <div className="flex items-center gap-3 text-stone-400">
                  <Users size={18} />
                  <h3 className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Social Resonance Graph</h3>
               </div>
               <p className="font-serif italic text-lg text-stone-500 max-w-md">Manage your network of resonators and established connections.</p>
            </div>
            <ConnectionsManager />
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
                <textarea id="tasteDefinition" name="tasteDefinition" value={tasteDefinition} onChange={e => setTasteDefinition(e.target.value)} placeholder="Describe your baseline era, inspirations, and scotopic preferences. e.g. Editorial flat flash, 16mm grain, direct lighting..." className="w-full bg-white dark:bg-stone-900 border border-black/5 dark:border-white/5 p-8 font-serif text-xl italic text-nous-text dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all resize-none h-64 rounded-sm shadow-sm" />
                <div className="flex justify-between items-center">
                    <p className="font-serif italic text-xs text-stone-400 max-w-sm">"This threshold ensures consistent quality across all your creative accounts."</p>
                    <button onClick={handleSave} className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-full font-sans text-[8px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all flex items-center gap-2 shadow-sm">
                        <Anchor size={12} /> Anchor Registry
                    </button>
                </div>
            </div>
        </section>

        {/* SOVEREIGN BACKUP (NEW) */}
        <section className="space-y-10 pt-8 border-t border-black/5 dark:border-white/5">
            <div className="flex flex-col items-center gap-2 text-center">
               <div className="flex items-center gap-3 text-stone-400">
                  <Database size={16} />
                  <h3 className="font-sans text-[9px] uppercase tracking-[0.4em] font-black">Sovereign Backup</h3>
               </div>
               <p className="font-serif italic text-sm text-stone-500 max-w-md">
                  Download your entire digital footprint (Manifests & Artifacts) as a structured JSON file.
               </p>
            </div>
            <div className="flex justify-center">
               <button 
                 onClick={handleExportData} 
                 disabled={isExporting}
                 className="px-10 py-4 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full font-sans text-[9px] uppercase tracking-widest font-black text-stone-500 hover:text-nous-text dark:hover:text-white transition-all flex items-center gap-3 shadow-sm hover:shadow-md disabled:opacity-50"
               >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileJson size={14} />}
                  Export Archive
               </button>
            </div>
        </section>

        <div className="pt-20 space-y-12 flex flex-col items-center">
            <button onClick={handleSave} disabled={isSaving || handleAvailable === false} className="w-full max-w-sm py-6 bg-nous-text dark:bg-white text-white dark:text-stone-900 rounded-full font-sans text-[11px] tracking-[0.5em] uppercase font-black shadow-2xl active:scale-95 transition-all">
                {isSaving ? "Syncing Logic..." : "Commit Global Handshake"}
            </button>
            <div className="h-px w-32 bg-stone-100 dark:bg-stone-900" />
            <button onClick={logout} className="px-8 py-3 border border-red-200 dark:border-red-900/30 rounded-full font-sans text-[8px] uppercase tracking-[0.2em] text-red-500 font-black hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">De-Anchor Account</button>
        </div>
      </div>
    </div>
  );
};
