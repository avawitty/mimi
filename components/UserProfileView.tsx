// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile, TypographicArchetype, Persona } from '../types';
import { isHandleAvailable, uploadBlob, fetchUserZines, fetchPocketItems } from '../services/firebaseUtils';
import { Loader2, Camera, Trash2, Download, ExternalLink, Shield, Key, Settings, Plus, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DeveloperSettings } from './DeveloperSettings';
import { TheWard } from './TheWard';
import { ImperialPatronageModal } from './ImperialPatronageModal';
import { ConnectionsManager } from './ConnectionsManager';

const detectIframeContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const ua = (navigator.userAgent || '').toLowerCase();
  const isSocial = /instagram|fb_iab|fban|fbav|tiktok|threads|wv\b|webview/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isSocial && !isStandalone;
};

export const UserProfileView: React.FC = () => {
  const { user, profile, updateProfile, logout, personas, activePersonaId, switchPersona, createPersona, updatePersona, deletePersona, linkAccount, featureFlags, keyRing } = useUser();
  
  const [isIframe, setIsIframe] = useState(false);
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [externalLinks, setExternalLinks] = useState<{ title: string; url: string }[]>([]);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showHandleConfirm, setShowHandleConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [archetype, setArchetype] = useState<TypographicArchetype>('minimalist-sans');
  const [tasteDefinition, setTasteDefinition] = useState('');

  // Agent Config
  const [curatorEnabled, setCuratorEnabled] = useState(true);
  const [sentinelEnabled, setSentinelEnabled] = useState(true);
  const [curatorBudget, setCuratorBudget] = useState(50);
  const [sentinelBudget, setSentinelBudget] = useState(50);

  // Mask Management
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaKey, setNewPersonaKey] = useState('');
  const [isEditingMask, setIsEditingMask] = useState(false);
  const [editingMaskTemp, setEditingMaskTemp] = useState(0.7);

  const [showWard, setShowWard] = useState(false);
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [showPatronageModal, setShowPatronageModal] = useState(false);
  const [isPatronActive, setIsPatronActive] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsIframe(detectIframeContext());
  }, []);

  useEffect(() => {
    const checkPatron = () => {
      const status = localStorage.getItem('mimi_patron_status');
      setIsPatronActive(status === 'active' || featureFlags.proposal);
    };
    checkPatron();
    const interval = setInterval(checkPatron, 1000);
    return () => clearInterval(interval);
  }, [featureFlags]);

  useEffect(() => {
    if (profile) {
      setHandle(profile.handle || '');
      setDisplayName(profile.displayName || '');
      setAvatar(profile.photoURL || null);
      setExternalLinks(profile.externalLinks || []);
      setArchetype((profile.tasteProfile?.dominant_archetypes?.[0] as TypographicArchetype) || 'minimalist-sans');
      setTasteDefinition(profile.tasteProfile?.inspirations || '');
      
      if (profile.agentConfig) {
        setCuratorEnabled(profile.agentConfig.curatorEnabled);
        setSentinelEnabled(profile.agentConfig.sentinelEnabled);
        setCuratorBudget(profile.agentConfig.curatorBudget);
        setSentinelBudget(profile.agentConfig.sentinelBudget);
      }
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              setAvatar(base64);
              setIsUploading(false);
          };
          reader.readAsDataURL(file);
      } catch (e) {
          setMessage({ text: "Upload Failed.", type: 'error' });
          setIsUploading(false);
      }
  };

  const handleSave = async () => {
    if (!profile || isSaving || handleAvailable === false) return;
    
    if (handle.trim().toLowerCase() !== profile.handle && !showHandleConfirm) {
        setShowHandleConfirm(true);
        return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ 
        ...profile, 
        handle: handle.trim().toLowerCase(), 
        displayName: displayName,
        photoURL: avatar,
        externalLinks: externalLinks,
        tasteProfile: {
            ...profile.tasteProfile,
            inspirations: tasteDefinition,
            dominant_archetypes: [archetype]
        },
        agentConfig: {
            curatorEnabled,
            sentinelEnabled,
            curatorBudget,
            sentinelBudget
        }
      });
      setMessage({ text: "Sovereign Registry Anchored.", type: 'success' });
      setShowHandleConfirm(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (e) { setMessage({ text: "Handshake Error.", type: 'error' }); } finally { setIsSaving(false); }
  };

// ... inside JSX
          <div className="mb-8 flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <Camera size={24} className="text-stone-400" />}
                <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white" />
                </button>
            </div>
            <div className="flex-grow space-y-2">
                <input 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)} 
                    className="w-full bg-transparent font-serif text-xl border-b border-stone-200 dark:border-stone-700 pb-1 focus:outline-none focus:border-stone-800 dark:focus:border-stone-400" 
                    placeholder="Display Name..."
                />
                <input 
                    value={handle} 
                    onChange={e => setHandle(e.target.value)} 
                    className="w-full bg-transparent font-mono text-sm text-stone-500 border-b border-stone-200 dark:border-stone-700 pb-1 focus:outline-none focus:border-stone-800 dark:focus:border-stone-400" 
                    placeholder="Handle..."
                />
            </div>
            <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-4 py-2 bg-stone-800 text-white text-[10px] uppercase tracking-widest hover:bg-stone-700 transition-colors"
            >
                {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

  const handleCreateMask = async () => {
      if(!newPersonaName.trim()) return;
      await createPersona(newPersonaName, newPersonaKey);
      setNewPersonaName(''); setNewPersonaKey(''); setIsAddingPersona(false);
      setMessage({ text: "New Mask Minted.", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateActiveMask = async () => {
      const activePersona = personas.find(p => p.id === activePersonaId);
      if (!activePersona) return;
      await updatePersona({
          ...activePersona,
          operationalParameters: {
              ...activePersona.operationalParameters,
              temperature: editingMaskTemp
          }
      });
      setIsEditingMask(false);
      setMessage({ text: "Mask Parameters Updated.", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
  };

  const handleGoogleLink = async () => {
      if (user?.isAnonymous) {
          try {
              await linkAccount(true);
          } catch(e: any) {
              setMessage({ text: e.message || "Link Failed.", type: 'error' });
          }
      }
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
      } catch(e) {
          setMessage({ text: "Backup Failed.", type: 'error' });
      } finally {
          setIsExporting(false);
      }
  };

  const activePersona = personas.find(p => p.id === activePersonaId);
  const activePersonaIndex = personas.findIndex(p => p.id === activePersonaId);

  const nextMask = () => {
      if (personas.length === 0) return;
      const nextIndex = (activePersonaIndex + 1) % personas.length;
      switchPersona(personas[nextIndex].id);
  };

  const prevMask = () => {
      if (personas.length === 0) return;
      const prevIndex = (activePersonaIndex - 1 + personas.length) % personas.length;
      switchPersona(personas[prevIndex].id);
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-[#F9F7F2] dark:bg-stone-950 text-[#1A1A1A] dark:text-stone-100 p-4 md:p-8">
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-24 z-[10000] px-8 py-3 rounded-full font-sans text-[10px] uppercase tracking-widest font-black shadow-2xl border ${message.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}>
            {message.text}
          </motion.div>
        )}
        {showDevSettings && <DeveloperSettings onClose={() => setShowDevSettings(false)} />}
        {showWard && <TheWard onClose={() => setShowWard(false)} />}
        {showPatronageModal && <ImperialPatronageModal isOpen={showPatronageModal} onClose={() => setShowPatronageModal(false)} prefillKey="" />}
      </AnimatePresence>

      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-stone-500 mb-1 block">System Profile // Access Level: Sovereign</span>
          <h1 className="font-serif text-4xl italic">Sovereign Profile & Logic Registry</h1>
        </div>
        <div className="text-right hidden md:block">
          <span className="text-[10px] uppercase tracking-widest font-mono text-stone-400">Registry ID: {user?.uid?.substring(0, 8).toUpperCase() || '00-MZ-892-X'}</span>
          <div className="flex items-center justify-end gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] uppercase tracking-widest font-mono">Status: Synced</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-[1px] bg-[#D4D1C9] dark:bg-stone-800 border border-[#D4D1C9] dark:border-stone-800">
        
        {/* Identity & Global Registry */}
        <section className="col-span-12 md:col-span-6 lg:col-span-3 order-1 bg-[#F9F7F2] dark:bg-stone-900 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-serif text-xl">Identity & Global Registry</h2>
            <Shield size={16} className="text-stone-400" />
          </div>
          
          <div className="mb-8">
            <label className="text-[10px] uppercase tracking-widest font-mono text-stone-500 block mb-2">Registry Handle</label>
            <input 
                value={handle} 
                onChange={e => setHandle(e.target.value)} 
                className="w-full bg-transparent font-mono text-lg border-b border-stone-200 dark:border-stone-700 pb-1 focus:outline-none focus:border-stone-800 dark:focus:border-stone-400" 
            />
            {handleAvailable === false && <p className="text-red-500 text-[10px] mt-1">Handle unavailable</p>}
          </div>

          <div className="mb-8">
            <label className="text-[10px] uppercase tracking-widest font-mono text-stone-500 block mb-4">External Resources</label>
            <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pr-2">
              {externalLinks.map((link, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-mono border-l-2 border-stone-300 dark:border-stone-600 pl-3 py-1">
                  <input value={link.url} onChange={e => {
                      const newLinks = [...externalLinks];
                      newLinks[i].url = e.target.value;
                      setExternalLinks(newLinks);
                  }} className="bg-transparent w-full focus:outline-none" placeholder="URL..." />
                  <button onClick={() => setExternalLinks(externalLinks.filter((_, idx) => idx !== i))} className="text-red-500 ml-2"><Trash2 size={12}/></button>
                </div>
              ))}
              <button onClick={() => setExternalLinks([...externalLinks, { title: 'Link', url: '' }])} className="w-full py-2 border border-dashed border-stone-300 dark:border-stone-700 text-[10px] uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  Add Resource
              </button>
            </div>
          </div>

          <div className="mt-auto">
            {user?.isAnonymous ? (
                <button onClick={() => handleGoogleLink()} className="w-full flex items-center justify-center gap-2 py-3 border border-stone-800 dark:border-stone-200 text-[10px] uppercase tracking-widest hover:bg-stone-800 hover:text-white dark:hover:bg-stone-200 dark:hover:text-black transition-all">
                    Sign in with Google
                </button>
            ) : (
                <div className="w-full flex items-center justify-center gap-2 py-3 border border-emerald-500/30 bg-emerald-500/10 text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    <Check size={14} /> Google Anchored
                </div>
            )}
          </div>
        </section>

        {/* Aesthetic Intelligence */}
        <section className="col-span-12 lg:col-span-6 lg:row-span-2 order-3 lg:order-2 bg-[#F9F7F2] dark:bg-stone-900 p-6 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-serif text-2xl italic">Aesthetic Intelligence</h2>
            <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'thimble' }))} className="text-[10px] uppercase tracking-widest border-b border-stone-800 dark:border-stone-200 pb-0.5">Taste Dashboard</button>
          </div>
          
          <div className="flex-grow flex flex-col items-center justify-center border border-dashed border-stone-300 dark:border-stone-700 relative group bg-stone-50/50 dark:bg-stone-800/50">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">hub</span>
            </div>
            <div className="text-center z-10 p-8">
              <p className="font-mono text-xs text-stone-400 mb-6 uppercase tracking-widest">No Graph Data Detected</p>
              <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'taste-graph' }))} className="px-8 py-3 bg-stone-800 dark:bg-stone-200 text-white dark:text-black text-[10px] uppercase tracking-[0.2em] hover:bg-stone-700 dark:hover:bg-white transition-colors">
                  Extract Graph
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 border border-stone-200 dark:border-stone-700">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-2">Taste Graph</h4>
              <p className="text-xs text-stone-400 leading-relaxed italic">Visualizing sensory benchmarks across ingested artifacts.</p>
            </div>
            <div className="p-4 border border-stone-200 dark:border-stone-700">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-2">Semantic Network</h4>
              <p className="text-xs text-stone-400 leading-relaxed italic">Mapping relationships between disparate creative nodes.</p>
            </div>
          </div>
        </section>

        {/* The Ward */}
        <section className="col-span-12 md:col-span-6 lg:col-span-3 order-2 lg:order-3 bg-[#F9F7F2] dark:bg-stone-900 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-serif text-xl">The Ward</h2>
            <button onClick={() => setShowWard(true)} className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"><Settings size={16} /></button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-mono text-stone-500 block mb-2">Protocols</label>
              <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar pr-2">
                {Object.entries(featureFlags).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-[11px] font-mono py-1 border-b border-stone-100 dark:border-stone-800">
                        <span className="uppercase truncate mr-2" title={key.replace(/_/g, ' ')}>{key.replace(/_/g, ' ')}</span>
                        <span className={`flex-shrink-0 ${value ? "text-emerald-500" : "text-stone-400"}`}>{value ? 'ON' : 'OFF'}</span>
                    </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-[10px] uppercase tracking-widest font-mono text-stone-500 block mb-2">Key Ring ({keyRing.length})</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar pr-2">
                {keyRing.map((k, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center" title={k.name}>
                        <Key size={12} className="text-stone-400" />
                    </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sovereign Mask System (AI Personas) */}
        <section className="col-span-12 md:col-span-6 lg:col-span-3 order-4 bg-[#F9F7F2] dark:bg-stone-900 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-serif text-xl">Sovereign Mask System</h2>
            <span className="material-symbols-outlined text-stone-400 text-sm">masks</span>
          </div>
          
          <div className="flex-grow flex flex-col justify-center py-6">
            {isAddingPersona ? (
                <div className="space-y-4">
                    <input value={newPersonaName} onChange={e => setNewPersonaName(e.target.value)} placeholder="Mask Name" className="w-full bg-transparent border-b border-stone-300 dark:border-stone-600 p-2 font-serif italic focus:outline-none" />
                    <input value={newPersonaKey} onChange={e => setNewPersonaKey(e.target.value)} placeholder="API Key (Optional)" type="password" className="w-full bg-transparent border-b border-stone-300 dark:border-stone-600 p-2 font-mono text-xs focus:outline-none" />
                    <div className="flex gap-2">
                        <button onClick={handleCreateMask} className="flex-1 py-2 bg-stone-800 text-white text-[10px] uppercase tracking-widest">Mint</button>
                        <button onClick={() => setIsAddingPersona(false)} className="flex-1 py-2 border border-stone-300 text-[10px] uppercase tracking-widest">Cancel</button>
                    </div>
                </div>
            ) : isEditingMask && activePersona ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-serif italic text-xl">{activePersona.name}</span>
                        <button onClick={() => setIsEditingMask(false)} className="text-stone-400"><Settings size={14}/></button>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-mono text-stone-500 block mb-2">Temperature: {editingMaskTemp}</label>
                        <input type="range" min="0" max="2" step="0.1" value={editingMaskTemp} onChange={e => setEditingMaskTemp(parseFloat(e.target.value))} className="w-full" />
                    </div>
                    <button onClick={handleUpdateActiveMask} className="w-full py-2 bg-stone-800 text-white text-[10px] uppercase tracking-widest">Save Parameters</button>
                </div>
            ) : (
                <>
                    <div className="text-center mb-6">
                        <span className="text-[10px] uppercase tracking-widest font-mono text-stone-400">Active Mask</span>
                        <div className="flex items-center justify-between mt-2">
                            <button onClick={prevMask} className="material-symbols-outlined text-stone-400">chevron_left</button>
                            <span className="font-serif text-3xl italic truncate px-2">{activePersona?.name || 'Personal'}</span>
                            <button onClick={nextMask} className="material-symbols-outlined text-stone-400">chevron_right</button>
                        </div>
                    </div>
                    
                    <div className="border-t border-stone-200 dark:border-stone-700 pt-4 mb-6">
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                            <span className="text-stone-500">Identity Namespace</span>
                            <span>{activePersona?.id.substring(0, 8).toUpperCase() || 'PN-8821'}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono mb-1 mt-2">
                            <span className="text-stone-500">Parameters</span>
                            <button onClick={() => {
                                setEditingMaskTemp(activePersona?.operationalParameters?.temperature || 0.7);
                                setIsEditingMask(true);
                            }} className="underline">Edit</button>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsAddingPersona(true)} className="w-full py-2 bg-stone-100 dark:bg-stone-800 text-[10px] uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                        Mint New Mask
                    </button>
                </>
            )}
          </div>
        </section>

        {/* Billing Registry & Social Resonance */}
        <section className="col-span-12 md:col-span-6 lg:col-span-3 order-5 bg-[#F9F7F2] dark:bg-stone-900 p-6 flex flex-col">
          <div className="mb-8 pb-6 border-b border-stone-200 dark:border-stone-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-serif text-lg">Billing Registry</h3>
              <span className="text-[10px] font-mono text-stone-400">Minted: {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-6 rounded-sm ${isPatronActive ? 'bg-emerald-500' : 'bg-stone-800 dark:bg-stone-200'}`}></div>
              <span className="text-xs font-mono">{isPatronActive ? 'PATRON ACTIVE' : 'STANDARD'}</span>
            </div>
            {!isPatronActive && (
                <button onClick={() => setShowPatronageModal(true)} className="mt-4 w-full py-2 border border-stone-300 dark:border-stone-700 text-[10px] uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    Upgrade to Patron
                </button>
            )}
          </div>
          
          <div className="flex-grow flex flex-col">
            <h3 className="font-serif text-lg mb-4">Social Resonance</h3>
            <div className="flex-grow overflow-y-auto no-scrollbar min-h-[150px]">
                <ConnectionsManager />
            </div>
          </div>
        </section>

        {/* Global Structural Logic (Agent Configuration) */}
        <section className="col-span-12 order-6 bg-[#F9F7F2] dark:bg-stone-900 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-serif text-xl italic">Global Structural Logic</h2>
            <span className="text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 border border-stone-800 dark:border-stone-200">Agent Configuration</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-mono text-stone-500 block mb-3">Grounding Logic Tags</label>
              <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => setArchetype('editorial-serif')} className={`text-[10px] font-mono border px-2 py-1 ${archetype === 'editorial-serif' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>Editorial</button>
                <button onClick={() => setArchetype('minimalist-sans')} className={`text-[10px] font-mono border px-2 py-1 ${archetype === 'minimalist-sans' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>Minimalist</button>
                <button onClick={() => setArchetype('brutalist-mono')} className={`text-[10px] font-mono border px-2 py-1 ${archetype === 'brutalist-mono' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>Brutalist</button>
              </div>
              
              <div className="space-y-4">
                  <div>
                      <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] uppercase tracking-widest font-mono text-stone-500">Curator Agent</label>
                          <button onClick={() => setCuratorEnabled(!curatorEnabled)} className={`text-[10px] font-mono ${curatorEnabled ? 'text-emerald-500' : 'text-stone-400'}`}>{curatorEnabled ? 'ENABLED' : 'DISABLED'}</button>
                      </div>
                      <input type="range" min="10" max="100" value={curatorBudget} onChange={e => setCuratorBudget(parseInt(e.target.value))} className="w-full" disabled={!curatorEnabled} />
                      <div className="text-[8px] font-mono text-stone-400 text-right">Budget: {curatorBudget}</div>
                  </div>
                  <div>
                      <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] uppercase tracking-widest font-mono text-stone-500">Sentinel Agent</label>
                          <button onClick={() => setSentinelEnabled(!sentinelEnabled)} className={`text-[10px] font-mono ${sentinelEnabled ? 'text-emerald-500' : 'text-stone-400'}`}>{sentinelEnabled ? 'ENABLED' : 'DISABLED'}</button>
                      </div>
                      <input type="range" min="10" max="100" value={sentinelBudget} onChange={e => setSentinelBudget(parseInt(e.target.value))} className="w-full" disabled={!sentinelEnabled} />
                      <div className="text-[8px] font-mono text-stone-400 text-right">Budget: {sentinelBudget}</div>
                  </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <textarea 
                  value={tasteDefinition}
                  onChange={e => setTasteDefinition(e.target.value)}
                  placeholder="The Eraser Line: Describe your baseline era, inspirations, and scotopic preferences..."
                  className="font-serif text-lg leading-snug text-stone-600 dark:text-stone-300 border-l-2 border-stone-300 dark:border-stone-600 pl-4 bg-transparent resize-none h-48 focus:outline-none w-full"
              />
            </div>
          </div>
        </section>

        {/* Sovereign Backup */}
        <section className="col-span-12 order-7 bg-[#F9F7F2] dark:bg-stone-900 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
              <div>
                <h2 className="font-serif text-xl mb-1">Sovereign Backup</h2>
                <p className="text-[10px] uppercase tracking-widest font-mono text-stone-500">Last commit: {new Date().toLocaleTimeString()} UTC</p>
              </div>
              <button onClick={handleExportData} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 border border-stone-200 dark:border-stone-700 text-[10px] uppercase tracking-widest hover:border-stone-800 dark:hover:border-stone-200 transition-colors">
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Export Archive (.json)
              </button>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <button onClick={handleSave} disabled={isSaving} className="flex-1 md:flex-none px-6 py-3 bg-stone-800 dark:bg-stone-200 text-white dark:text-black text-[10px] uppercase tracking-widest hover:bg-stone-700 dark:hover:bg-white transition-colors">
                  {isSaving ? 'Committing...' : 'Commit Global Handshake'}
              </button>
              <button onClick={logout} className="flex-1 md:flex-none px-6 py-3 border border-red-200 text-red-800 text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors">
                  De-Anchor Account
              </button>
            </div>
          </div>
        </section>

      </main>

      <footer className="max-w-7xl mx-auto mt-12 mb-8 flex flex-col md:flex-row justify-between items-center text-stone-400 font-mono text-[9px] uppercase tracking-widest">
        <div>© {new Date().getFullYear()} Mimi Zine Logic Registry</div>
        <div className="flex gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-stone-800 dark:hover:text-stone-200">Protocol Documentation</a>
          <a href="#" className="hover:text-stone-800 dark:hover:text-stone-200">Identity FAQ</a>
          <a href="#" className="hover:text-stone-800 dark:hover:text-stone-200">Terms of Sovereignty</a>
        </div>
      </footer>
    </div>
  );
};
