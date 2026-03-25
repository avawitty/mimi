import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface Props {
 isOpen: boolean;
 onClose: () => void;
 onOpenSettings: () => void;
}

export const MobileProfileModal: React.FC<Props> = ({ isOpen, onClose, onOpenSettings }) => {
 const { user, profile, logout } = useUser();

 if (!isOpen || !user) return null;

 return (
 <AnimatePresence>
 {isOpen && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
 onClick={onClose}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full sm:w-96 bg-stone-50 dark:bg-stone-900 rounded-none sm:rounded-none p-6 border-t border-stone-200 dark:border-stone-800 pb-12"
 >
 <div className="flex justify-between items-center mb-8">
 <h2 className="text-2xl font-serif italic text-stone-800 dark:text-stone-200">Profile</h2>
 <button onClick={onClose} className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
 <X size={20} />
 </button>
 </div>

 <div className="flex flex-col items-center mb-8">
 {profile?.photoURL ? (
 <img src={profile.photoURL} alt="Profile"className="w-24 h-24 rounded-none object-cover border-4 border-white dark:border-stone-800 mb-4"/>
 ) : (
 <div className="w-24 h-24 rounded-none bg-stone-200 dark:bg-stone-800 flex items-center justify-center border-4 border-white dark:border-stone-800 mb-4">
 <UserIcon size={40} className="text-stone-400"/>
 </div>
 )}
 <h3 className="text-xl font-medium text-stone-900 dark:text-stone-100">{profile?.displayName || 'Anonymous'}</h3>
 <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{user.email}</p>
 
 {profile?.plan && profile.plan !== 'free' && (
 <div className={`mt-4 px-4 py-1.5 rounded-none text-xs font-bold uppercase tracking-widest border ${
 profile.plan === 'lab' ? 'bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-900/20 dark:text-stone-400 dark:border-stone-800' :
 profile.plan === 'pro' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' :
 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
 }`}>
 Mimi {profile.plan}
 </div>
 )}
 </div>

 <div className="space-y-3">
 <button 
 onClick={() => { onClose(); onOpenSettings(); }}
 className="w-full flex items-center justify-between p-4 bg-white dark:bg-stone-950 rounded-none border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
 >
 <div className="flex items-center gap-3">
 <Settings size={18} />
 <span className="font-medium">Full Settings</span>
 </div>
 </button>
 
 <button 
 onClick={() => { logout(); onClose(); }}
 className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-none border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
 >
 <div className="flex items-center gap-3">
 <LogOut size={18} />
 <span className="font-medium">Log Out</span>
 </div>
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 );
};
