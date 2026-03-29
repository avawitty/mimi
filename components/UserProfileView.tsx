// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserProfile, TypographicArchetype, Persona } from '../types';
import { isHandleAvailable, fetchUserZines, fetchPocketItems } from '../services/firebaseUtils';
import { Loader2, Camera, Trash2, Download, ExternalLink, Shield, Key, Settings, Plus, Check, ChevronLeft, ChevronRight, UserCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DeveloperSettings } from './DeveloperSettings';
import { SemanticSteps } from './SemanticSteps';
import { TheWard } from './TheWard';
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
 const { user, profile, updateProfile, logout, personas, activePersonaId, switchPersona, createPersona, updatePersona, deletePersona, linkAccount, featureFlags, keyRing, addKeyToRing, removeKeyFromRing, loginWithEmail } = useUser();
 
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
 if (!file || !user) return;
 setIsUploading(true);
 try {
 const { archiveManager } = await import('../services/archiveManager');
 const url = await archiveManager.uploadMedia(user.uid, file, `avatars/${user.uid}_${Date.now()}`);
 setAvatar(url);
 setIsUploading(false);
 } catch (e) {
 setMessage({ text:"Upload Failed.", type: 'error' });
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
 setMessage({ text:"Sovereign Registry Anchored.", type: 'success' });
 setShowHandleConfirm(false);
 setTimeout(() => setMessage(null), 3000);
 } catch (e) { setMessage({ text:"Handshake Error.", type: 'error' }); } finally { setIsSaving(false); }
 };

 const handleCreateMask = async () => {
 if(!newPersonaName.trim()) return;
 await createPersona(newPersonaName, newPersonaKey);
 setNewPersonaName(''); setNewPersonaKey(''); setIsAddingPersona(false);
 setMessage({ text:"New Mask Minted.", type: 'success' });
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
 setMessage({ text:"Mask Parameters Updated.", type: 'success' });
 setTimeout(() => setMessage(null), 3000);
 };

 const handleGoogleLink = async () => {
 if (user?.isAnonymous) {
 try {
 await linkAccount(false);
 } catch(e: any) {
 setMessage({ text: e.message ||"Link Failed.", type: 'error' });
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
 version:"Mimi_v4.5"
 };
 
 const blob = new Blob([JSON.stringify(fullData, null, 2)], { type:"application/json"});
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `Mimi_Archive_${handle || 'Sovereign'}_${Date.now()}.json`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 } catch(e) {
 setMessage({ text:"Backup Failed.", type: 'error' });
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
 <div className="w-full h-full overflow-y-auto no-scrollbar bg text p-4 md:p-8">
 <AnimatePresence>
 {message && (
 <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-24 z-[10000] px-8 py-3 rounded-none font-sans text-[10px] uppercase tracking-widest font-black border ${message.type === 'success' ? 'bg-nous-text text-nous-base border-nous-text ' : 'bg-red-500 text-white border-red-400'}`}>
 {message.text}
 </motion.div>
 )}
 {showDevSettings && <DeveloperSettings onClose={() => setShowDevSettings(false)} />}
 {showWard && <TheWard onClose={() => setShowWard(false)} />}
 </AnimatePresence>

 <header className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
 <div>
 <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-nous-subtle mb-1 block">System Profile // Access Level: Sovereign</span>
 <h1 className="font-serif text-4xl italic">Sovereign Profile & Logic Registry</h1>
 </div>
 <div className="text-right hidden md:block">
 <span className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle">Registry ID: {user?.uid?.substring(0, 8).toUpperCase() || '00-MZ-892-X'}</span>
 <div className="flex items-center justify-end gap-2 mt-1">
 <span className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle">Status: Synced</span>
 </div>
 </div>
 </header>

 <main className="w-full max-w-3xl mx-auto flex flex-col gap-8 pb-20">
 
 {/* Clean Identity Card */}
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full bg-white rounded-none dark: overflow-hidden border border-nous-border p-8"
 >
 <div className="flex justify-between items-start mb-6">
 <h2 className="font-serif text-2xl italic">Identity & Global Registry</h2>
 <Shield size={16} className="text-nous-subtle"/>
 </div>
 
 <div className="mb-8 flex items-center gap-6">
 <div className="relative w-20 h-20 rounded-none overflow-hidden border border-nous-border bg-nous-base flex items-center justify-center shrink-0">
 {avatar ? <img src={avatar} className="w-full h-full object-cover"referrerPolicy="no-referrer"/> : <Camera size={24} className="text-nous-subtle"/>}
 <input type="file"ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden"accept="image/*"/>
 <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
 <Camera size={16} className="text-white"/>
 </button>
 </div>
 <div className="flex-grow space-y-2">
 <input 
 value={displayName} 
 onChange={e => setDisplayName(e.target.value)} 
 className="w-full bg-transparent font-serif text-xl border-b border-nous-border pb-1 focus:outline-none focus:border-nous-border dark:focus:border-nous-border"
 placeholder="Display Name..."
 />
 </div>
 </div>

 <div className="mb-8">
 <label className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle block mb-2">Registry Handle</label>
 <input 
 value={handle} 
 onChange={e => setHandle(e.target.value)} 
 className="w-full bg-transparent font-mono text-lg border-b border-nous-border pb-1 focus:outline-none focus:border-nous-border dark:focus:border-nous-border"
 />
 {handleAvailable === false && <p className="text-red-500 text-[10px] mt-1">Handle unavailable</p>}
 </div>

 <div className="mb-8">
 <label className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle block mb-4">External Resources</label>
 <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pr-2">
 {externalLinks.map((link, i) => (
 <div key={i} className="flex items-center justify-between text-xs font-mono border-l-2 border-nous-border pl-3 py-1">
 <input value={link.url} onChange={e => {
 const newLinks = [...externalLinks];
 newLinks[i].url = e.target.value;
 setExternalLinks(newLinks);
 }} className="bg-transparent w-full focus:outline-none"placeholder="URL..."/>
 <button onClick={() => setExternalLinks(externalLinks.filter((_, idx) => idx !== i))} className="text-red-500 ml-2"><Trash2 size={12}/></button>
 </div>
 ))}
 <button onClick={() => setExternalLinks([...externalLinks, { title: 'Link', url: '' }])} className="w-full py-2 border border-dashed border-nous-border text-[10px] uppercase tracking-widest hover:bg-nous-base transition-colors rounded-none">
 Add Resource
 </button>
 </div>
 </div>

 <div className="mt-auto space-y-2">
 {user?.isAnonymous ? (
 <>
 <button onClick={() => handleGoogleLink()} className="w-full flex items-center justify-center gap-2 py-4 border border-nous-border text-[10px] uppercase tracking-widest hover:bg-nous-base hover:text-nous-text dark:hover:bg-stone-200 dark:hover:text-black transition-all rounded-none">
 Sign in with Google
 </button>
 <button onClick={() => {
 const email = window.prompt("Enter your email address:");
 if (email) {
 loginWithEmail(email, window.location.href);
 }
 }} className="w-full flex items-center justify-center gap-2 py-4 border border-nous-border text-[10px] uppercase tracking-widest hover:bg-nous-base hover:text-nous-text dark:hover:bg-stone-200 dark:hover:text-black transition-all rounded-none">
 Sign in with Email Link
 </button>
 </>
 ) : (
 <div className="w-full flex items-center justify-center gap-2 py-4 border border-nous-border/30 /30 bg-nous-base/10 /10 text-[10px] uppercase tracking-widest text-nous-text rounded-none">
 <Check size={14} /> Identity Anchored
 </div>
 )}
 </div>
 </motion.div>

 {/* Clean Aesthetic Text-Summary Card (Replacing the Orb) */}
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="w-full bg-white rounded-none border border-nous-border p-8"
 >
 <div className="flex justify-between items-start mb-6">
 <div>
 <h2 className="font-serif italic text-2xl text-nous-text  mb-2">Aesthetic Identity</h2>
 <p className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle mb-6">Semantic Baseline</p>
 </div>
 <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'thimble' }))} className="text-[10px] uppercase tracking-widest border-b border-nous-border pb-0.5">Taste Dashboard</button>
 </div>

 {profile?.tasteProfile ? (
 <div className="space-y-6">
 <div>
 <h3 className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle mb-3">Dominant Archetypes</h3>
 <div className="flex flex-wrap gap-2">
 {profile.tasteProfile.dominant_archetypes?.map((archetype, i) => (
 <span key={i} className="px-4 py-2 bg-nous-base text-nous-text text-xs font-mono rounded-none border border-nous-border">
 {archetype}
 </span>
 ))}
 </div>
 </div>
 {profile.tasteProfile.constraints && profile.tasteProfile.constraints.length > 0 && (
 <div>
 <h3 className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle mb-3">Constraints</h3>
 <div className="flex flex-wrap gap-2">
 {profile.tasteProfile.constraints?.map((constraint, i) => (
 <span key={i} className="px-4 py-2 bg-nous-base /50 text-nous-subtle text-xs font-mono rounded-none border border-nous-border">
 {constraint}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="text-center p-8 border border-dashed border-nous-border rounded-none">
 <p className="font-mono text-xs text-nous-subtle mb-6 uppercase tracking-widest">No Graph Data Detected</p>
 <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'taste-graph' }))} className="px-8 py-4 bg-nous-base dark:bg-stone-200 text-nous-base text-[10px] uppercase tracking-[0.2em] hover:bg-stone-700 dark:hover:bg-white transition-colors rounded-none">
 Extract Graph
 </button>
 </div>
 )}

 <div className="grid grid-cols-2 gap-4 mt-8">
 <button 
 onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'taste-graph' }))}
 className="p-4 border border-nous-border text-left hover:bg-nous-base transition-colors rounded-none"
 >
 <h4 className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle mb-2">Taste Graph</h4>
 <p className="text-xs text-nous-subtle leading-relaxed italic">Visualizing sensory benchmarks across ingested artifacts.</p>
 </button>
 <button 
 onClick={() => window.dispatchEvent(new CustomEvent('mimi:change_view', { detail: 'taste-graph' }))}
 className="p-4 border border-nous-border text-left hover:bg-nous-base transition-colors rounded-none"
 >
 <h4 className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle mb-2">Semantic Network</h4>
 <p className="text-xs text-nous-subtle leading-relaxed italic">Mapping relationships between disparate creative nodes.</p>
 </button>
 </div>
 </motion.div>

 {/* Global Structural Logic (Agent Configuration) */}
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="w-full bg-white rounded-none border border-nous-border p-8"
 >
 <div className="flex justify-between items-start mb-6">
 <h2 className="font-serif text-2xl italic">Global Structural Logic</h2>
 <span className="text-[10px] uppercase tracking-widest font-mono px-3 py-1 border border-nous-border rounded-none text-nous-subtle">Agent Config</span>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div>
 <label className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle block mb-3">Grounding Logic Tags</label>
 <div className="flex flex-wrap gap-2 mb-6">
 <button onClick={() => setArchetype('editorial-serif')} className={`text-[10px] font-mono border px-4 py-2 rounded-none ${archetype === 'editorial-serif' ? 'bg-nous-text text-nous-base border-nous-text' : 'bg-white border-nous-border '}`}>Editorial</button>
 <button onClick={() => setArchetype('minimalist-sans')} className={`text-[10px] font-mono border px-4 py-2 rounded-none ${archetype === 'minimalist-sans' ? 'bg-nous-text text-nous-base border-nous-text' : 'bg-white border-nous-border '}`}>Minimalist</button>
 <button onClick={() => setArchetype('brutalist-mono')} className={`text-[10px] font-mono border px-4 py-2 rounded-none ${archetype === 'brutalist-mono' ? 'bg-nous-text text-nous-base border-nous-text' : 'bg-white border-nous-border '}`}>Brutalist</button>
 </div>
 
 <div className="space-y-6">
 <div>
 <div className="flex justify-between items-center mb-2">
 <label className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle">Curator Agent</label>
 <button onClick={() => setCuratorEnabled(!curatorEnabled)} className={`text-[10px] font-mono px-2 py-1 rounded-none border ${curatorEnabled ? 'text-nous-text border-nous-border bg-nous-base ' : 'text-nous-subtle border-nous-border '}`}>{curatorEnabled ? 'ENABLED' : 'DISABLED'}</button>
 </div>
 <SemanticSteps 
 steps={[
 { label: 'Low', value: 10 },
 { label: 'Med', value: 50 },
 { label: 'High', value: 100 }
 ]}
 value={curatorBudget}
 onChange={(val) => setCuratorBudget(val)}
 />
 <div className="text-[8px] font-mono text-nous-subtle text-right mt-1">Budget: {curatorBudget}</div>
 </div>
 <div>
 <div className="flex justify-between items-center mb-2">
 <label className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle">Sentinel Agent</label>
 <button onClick={() => setSentinelEnabled(!sentinelEnabled)} className={`text-[10px] font-mono px-2 py-1 rounded-none border ${sentinelEnabled ? 'text-nous-text border-nous-border bg-nous-base ' : 'text-nous-subtle border-nous-border '}`}>{sentinelEnabled ? 'ENABLED' : 'DISABLED'}</button>
 </div>
 <SemanticSteps 
 steps={[
 { label: 'Low', value: 10 },
 { label: 'Med', value: 50 },
 { label: 'High', value: 100 }
 ]}
 value={sentinelBudget}
 onChange={(val) => setSentinelBudget(val)}
 />
 <div className="text-[8px] font-mono text-nous-subtle text-right mt-1">Budget: {sentinelBudget}</div>
 </div>
 </div>
 </div>
 
 <div className="flex flex-col">
 <label className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle block mb-3">The Eraser Line</label>
 <textarea 
 value={tasteDefinition}
 onChange={e => setTasteDefinition(e.target.value)}
 placeholder="Describe your baseline era, inspirations, and scotopic preferences..."
 className="font-serif text-lg leading-snug text-nous-subtle border border-nous-border rounded-none p-4 bg-nous-base /50 resize-none flex-grow focus:outline-none focus:ring-1 focus:ring-stone-400 w-full"
 />
 </div>
 </div>
 </motion.div>

 {/* Sovereign Mask System (AI Personas) */}
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="w-full bg-white rounded-none border border-nous-border p-8"
 >
 <div className="flex justify-between items-start mb-6">
 <h2 className="font-serif text-2xl italic">Sovereign Mask System</h2>
 <UserCircle2 className="text-nous-subtle"size={16} />
 </div>
 
 <div className="flex-grow flex flex-col justify-center py-2">
 {isAddingPersona ? (
 <div className="space-y-4">
 <input value={newPersonaName} onChange={e => setNewPersonaName(e.target.value)} placeholder="Mask Name"className="w-full bg-transparent border-b border-nous-border p-2 font-serif italic focus:outline-none text-lg"/>
 <input value={newPersonaKey} onChange={e => setNewPersonaKey(e.target.value)} placeholder="API Key (Optional)"type="password"className="w-full bg-transparent border-b border-nous-border p-2 font-mono text-xs focus:outline-none"/>
 <div className="flex gap-4 mt-4">
 <button onClick={handleCreateMask} className="flex-1 py-4 bg-nous-text text-nous-base text-[10px] uppercase tracking-widest rounded-none hover:bg-nous-text0 transition-colors">Mint</button>
 <button onClick={() => setIsAddingPersona(false)} className="flex-1 py-4 border border-nous-border text-[10px] uppercase tracking-widest rounded-none hover:bg-nous-base transition-colors">Cancel</button>
 </div>
 </div>
 ) : isEditingMask && activePersona ? (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <span className="font-serif italic text-2xl">{activePersona.name}</span>
 <button onClick={() => setIsEditingMask(false)} className="text-nous-subtle hover:text-nous-text"><Settings size={16}/></button>
 </div>
 <div>
 <label className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle block mb-4">Temperature: {editingMaskTemp}</label>
 <SemanticSteps 
 steps={[
 { label: '0.0', value: 0 },
 { label: '0.5', value: 0.5 },
 { label: '1.0', value: 1 },
 { label: '1.5', value: 1.5 },
 { label: '2.0', value: 2 }
 ]}
 value={editingMaskTemp}
 onChange={(val) => setEditingMaskTemp(val)}
 />
 </div>
 <button onClick={handleUpdateActiveMask} className="w-full py-4 bg-nous-text text-nous-base text-[10px] uppercase tracking-widest rounded-none hover:bg-nous-text0 transition-colors mt-4">Save Parameters</button>
 </div>
 ) : (
 <>
 <div className="text-center mb-8">
 <span className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle">Active Mask</span>
 <div className="flex items-center justify-between mt-4">
 <button onClick={prevMask} className="text-nous-subtle hover:text-nous-text p-2"><ChevronLeft size={24} /></button>
 <span className="font-serif text-4xl italic truncate px-4">{activePersona?.name || 'Personal'}</span>
 <button onClick={nextMask} className="text-nous-subtle hover:text-nous-text p-2"><ChevronRight size={24} /></button>
 </div>
 </div>
 
 <div className="bg-nous-base /50 rounded-none p-4 mb-6 border border-nous-border">
 <div className="flex justify-between text-[10px] font-mono mb-2">
 <span className="text-nous-subtle">Identity Namespace</span>
 <span>{activePersona?.id.substring(0, 8).toUpperCase() || 'PN-8821'}</span>
 </div>
 <div className="flex justify-between text-[10px] font-mono">
 <span className="text-nous-subtle">Parameters</span>
 <button onClick={() => {
 setEditingMaskTemp(activePersona?.operationalParameters?.temperature || 0.7);
 setIsEditingMask(true);
 }} className="underline text-nous-text">Edit</button>
 </div>
 </div>
 
 <button onClick={() => setIsAddingPersona(true)} className="w-full py-4 bg-nous-base text-[10px] uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors rounded-none font-medium">
 Mint New Mask
 </button>
 </>
 )}
 </div>
 </motion.div>

 {/* Billing Registry & Social Resonance */}
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="w-full bg-white rounded-none border border-nous-border p-8"
 >
 <div className="mb-8 pb-8 border-b border-nous-border">
 <div className="flex justify-between items-start mb-6">
 <h3 className="font-serif text-2xl italic">Billing Registry</h3>
 <span className="text-[10px] font-mono text-nous-subtle bg-nous-base px-3 py-1 rounded-none border border-nous-border">Minted: {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}</span>
 </div>
 <div className="flex items-center gap-4">
 <div className={`w-12 h-6 rounded-none ${isPatronActive ? 'bg-nous-base ' : 'bg-stone-200 dark:bg-stone-700'}`}></div>
 <span className="text-xs font-mono tracking-widest">{isPatronActive ? 'PATRON ACTIVE' : 'STANDARD'}</span>
 </div>
 <div className="flex gap-4 mt-6">
 <a 
 href="https://billing.stripe.com/p/login/3cI4gtekA8L36kX3NDaEE00"
 target="_blank"
 rel="noopener noreferrer"
 className="flex-1 flex items-center justify-center gap-2 py-4 border border-nous-border text-[10px] uppercase tracking-widest hover:bg-nous-base transition-all rounded-none"
 >
 <ExternalLink size={14} /> Manage
 </a>
 {!isPatronActive && (
 <button onClick={() => window.dispatchEvent(new CustomEvent('mimi:open_patron_modal'))} className="flex-1 py-4 bg-nous-text text-nous-base text-[10px] uppercase tracking-widest hover:bg-nous-text0 transition-colors rounded-none">
 Upgrade to Patron
 </button>
 )}
 </div>
 </div>
 
 <div className="flex-grow flex flex-col">
 <h3 className="font-serif text-2xl italic mb-6">Social Resonance</h3>
 <div className="flex-grow overflow-y-auto no-scrollbar min-h-[150px]">
 <ConnectionsManager />
 </div>
 </div>
 </motion.div>

 {/* Sovereign Backup */}
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.5 }}
 className="w-full bg-white rounded-none border border-nous-border p-8"
 >
 <div className="flex flex-col md:flex-row justify-between items-center gap-8">
 <div className="flex flex-col gap-4 w-full md:w-auto">
 <div>
 <h2 className="font-serif text-2xl italic mb-2">Sovereign Backup</h2>
 <p className="text-[10px] uppercase tracking-widest font-mono text-nous-subtle">Last commit: {new Date().toLocaleTimeString()} UTC</p>
 </div>
 <button onClick={handleExportData} disabled={isExporting} className="flex items-center justify-center gap-2 px-6 py-4 border border-nous-border text-[10px] uppercase tracking-widest hover:bg-nous-base transition-colors rounded-none w-full">
 {isExporting ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} />}
 Export Archive (.json)
 </button>
 </div>
 
 <div className="flex flex-col gap-4 w-full md:w-auto">
 <button onClick={handleSave} disabled={isSaving} className="px-8 py-4 bg-nous-base dark:bg-stone-200 text-nous-base text-[10px] uppercase tracking-widest hover:bg-stone-700 dark:hover:bg-white transition-colors rounded-none font-medium">
 {isSaving ? 'Committing...' : 'Commit Global Handshake'}
 </button>
 <button onClick={logout} className="px-8 py-4 border border-red-200 text-red-600 text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors rounded-none">
 De-Anchor Account
 </button>
 </div>
 </div>
 </motion.div>

 </main>

 <footer className="max-w-7xl mx-auto mt-12 mb-8 flex flex-col md:flex-row justify-between items-center text-nous-subtle font-mono text-[9px] uppercase tracking-widest">
 <div>© {new Date().getFullYear()} Mimi Zine Logic Registry</div>
 <div className="flex gap-8 mt-4 md:mt-0">
 <a href="#"className="hover:text-nous-text">Protocol Documentation</a>
 <a href="#"className="hover:text-nous-text">Identity FAQ</a>
 <a href="#"className="hover:text-nous-text">Terms of Sovereignty</a>
 </div>
 </footer>
 </div>
 );
};
