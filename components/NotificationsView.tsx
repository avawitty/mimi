import React, { useEffect, useState } from 'react';
import { Notification } from '../types';
import { motion } from 'framer-motion';
import { subscribeToNotifications } from '../services/notificationService';
import { useUser } from '../contexts/UserContext';

export const NotificationsView: React.FC = () => {
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const { user } = useUser();

 useEffect(() => {
 if (!user) return;
 const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
 return () => unsubscribe();
 }, [user]);

 return (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 className="p-8 md:p-16 max-w-4xl mx-auto"
 >
 <h2 className="font-serif text-4xl italic text-nous-text dark:text-white mb-8">Registry Updates</h2>
 {notifications.length === 0 ? (
 <p className="font-sans text-stone-500">No updates in the registry.</p>
 ) : (
 <ul className="space-y-4">
 {notifications.map(n => (
 <li key={n.id} className={`p-6 rounded-none border ${n.read ? 'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700' : 'bg-white dark:bg-stone-900 border-stone-500/20'}`}>
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-sans font-black text-xs uppercase tracking-widest text-nous-text dark:text-white">{n.title}</h3>
 <span className="font-sans text-[9px] text-stone-400">{new Date(n.timestamp).toLocaleString()}</span>
 </div>
 <p className="font-sans text-sm text-stone-600 dark:text-stone-300">{n.message}</p>
 </li>
 ))}
 </ul>
 )}
 </motion.div>
 );
};
