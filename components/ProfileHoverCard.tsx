import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { CheckCircle2, User, LogOut, Edit2, Loader2 } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { isHandleAvailable } from '../services/firebaseUtils';

interface ProfileHoverCardProps {
 isOpen: boolean;
 onClose: () => void;
 triggerRef: React.RefObject<HTMLDivElement>;
}

export const ProfileHoverCard: React.FC<ProfileHoverCardProps> = ({ isOpen, onClose, triggerRef }) => {
 const { user, profile, updateProfile } = useUser();
 const [isEditingUsername, setIsEditingUsername] = useState(false);
 const [newUsername, setNewUsername] = useState(profile?.handle || '');
 const [isSaving, setIsSaving] = useState(false);
 const [isCheckingHandle, setIsCheckingHandle] = useState(false);
 const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
 const cardRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 setNewUsername(profile?.handle || '');
 }, [profile?.handle]);

 useEffect(() => {
 if (!isEditingUsername) return;
 if (!newUsername || newUsername === profile?.handle) {
 setHandleAvailable(true);
 return;
 }
 if (newUsername.length < 2) {
 setHandleAvailable(null);
 return;
 }
 setIsCheckingHandle(true);
 const timer = setTimeout(async () => {
 const available = await isHandleAvailable(newUsername, user?.uid || '');
 setHandleAvailable(available);
 setIsCheckingHandle(false);
 }, 500);
 return () => clearTimeout(timer);
 }, [newUsername, user?.uid, profile?.handle, isEditingUsername]);

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (
 cardRef.current && 
 !cardRef.current.contains(event.target as Node) &&
 triggerRef.current &&
 !triggerRef.current.contains(event.target as Node)
 ) {
 onClose();
 }
 };

 if (isOpen) {
 document.addEventListener('mousedown', handleClickOutside);
 }
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [isOpen, onClose, triggerRef]);

 const handleSaveUsername = async () => {
 if (!profile || !newUsername.trim() || newUsername === profile.handle || handleAvailable === false) {
 setIsEditingUsername(false);
 return;
 }
 setIsSaving(true);
 try {
 await updateProfile({ ...profile, handle: newUsername.trim().toLowerCase() });
 setIsEditingUsername(false);
 } catch (e) {
 console.error("Failed to update username", e);
 } finally {
 setIsSaving(false);
 }
 };

 const handleSignOut = async () => {
 try {
 await signOut(getAuth());
 onClose();
 } catch (e) {
 console.error("Failed to sign out", e);
 }
 };

 const authProvider = user?.email?.includes('gmail') ? 'Google' : 'Email';

 return (
 <AnimatePresence>
 {isOpen && user && (
 <motion.div
 ref={cardRef}
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 transition={{ duration: 0.2 }}
 className="absolute top-full right-0 mt-2 w-80 bg dark:bg border border-nous-border rounded-none dark: overflow-hidden z-[100] relative"
 >
 {/* Texture Overlay */}
 <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/noise.png')] z-0 mix-blend-overlay"/>
 
 <div className="p-6 relative z-10">
 <div className="flex items-start gap-4 mb-6">
 <div className="w-16 h-16 rounded-none bg-nous-base border border-nous-border flex items-center justify-center overflow-hidden shrink-0">
 {profile?.photoURL ? (
 <img src={profile.photoURL} alt="Profile"className="w-full h-full object-cover"referrerPolicy="no-referrer"/>
 ) : (
 <User size={24} className="text-nous-subtle"/>
 )}
 </div>
 
 <div className="flex-1 min-w-0">
 {isEditingUsername ? (
 <div className="flex flex-col gap-1 mb-1">
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={newUsername}
 onChange={(e) => setNewUsername(e.target.value)}
 className="w-full bg-nous-base border border-nous-border rounded-none px-2 py-1 text-sm focus:outline-none focus:border-nous-border dark:focus:border-nous-border text-nous-text "
 autoFocus
 onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
 />
 <button 
 onClick={handleSaveUsername}
 disabled={isSaving || handleAvailable === false}
 className="text-nous-subtle hover:text-nous-subtle text-xs font-bold uppercase tracking-wider disabled:opacity-50"
 >
 Save
 </button>
 </div>
 {isCheckingHandle && <div className="text-[10px] text-nous-subtle flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Checking...</div>}
 {!isCheckingHandle && handleAvailable === false && <div className="text-[10px] text-red-500">Handle unavailable</div>}
 {!isCheckingHandle && handleAvailable === true && newUsername !== profile?.handle && newUsername.length >= 2 && <div className="text-[10px] text-nous-subtle">Handle available</div>}
 </div>
 ) : (
 <div className="flex items-center gap-2 mb-1 group cursor-pointer"onClick={() => setIsEditingUsername(true)}>
 <h3 className="font-serif italic text-xl text-nous-text text-nous-text truncate">
 @{profile?.handle || 'Swan'}
 </h3>
 <Edit2 size={12} className="text-nous-subtle opacity-0 group-hover:opacity-100 transition-opacity"/>
 </div>
 )}
 
 <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-nous-subtle mb-1 truncate">
 <span>{authProvider} Authorized</span>
 <CheckCircle2 size={10} className="text-nous-subtle"/>
 </div>
 <div className="text-[10px] uppercase tracking-widest text-nous-subtle truncate">
 {user.email}
 </div>
 </div>
 </div>

 <div className="space-y-3 pt-4 border-t border-nous-border">
 <div className="flex justify-between items-center">
 <span className="font-sans text-[10px] uppercase tracking-widest text-nous-subtle">Membership Tier</span>
 <span className={`font-serif italic text-sm ${
 profile?.plan === 'lab' ? 'text-nous-subtle ' :
 profile?.plan === 'pro' ? 'text-purple-600 dark:text-purple-400' :
 profile?.plan === 'core' ? 'text-orange-600 dark:text-orange-400' :
 'text-nous-subtle '
 }`}>
 Mimi {profile?.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Free'}
 {profile?.subscriptionInterval === 'year' && ' (Annual)'}
 </span>
 </div>
 </div>
 </div>

 <div className="bg-nous-base /50 p-4 border-t border-nous-border">
 <button
 onClick={handleSignOut}
 className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-sans uppercase tracking-widest font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-colors"
 >
 <LogOut size={14} />
 Sign Out
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
};
