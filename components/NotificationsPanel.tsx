import React, { useEffect, useState } from 'react';
import { Notification } from '../types';
import { subscribeToNotifications } from '../services/notificationService';
import { useUser } from '../contexts/UserContext';

export const NotificationsPanel: React.FC = () => {
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const { user } = useUser();

 useEffect(() => {
 if (!user) return;
 const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
 return () => unsubscribe();
 }, [user]);

 return (
 <div className="notifications-panel p-4 bg border border-stone-800">
 <h2 className="font-mono text-[9px] uppercase tracking-widest font-bold text-stone-500 mb-4">Notifications</h2>
 {notifications.length === 0 ? (
 <p className="font-serif italic text-sm text-stone-500">No new notifications.</p>
 ) : (
 <ul>
 {notifications.map(n => (
 <li key={n.id} className={`mb-2 p-3 border ${n.read ? 'bg-transparent border-stone-800 text-stone-500' : 'bg-stone-900 border-stone-700 text-stone-300'}`}>
 <h3 className="font-mono text-[9px] uppercase tracking-widest font-bold mb-1">{n.title}</h3>
 <p className="font-serif italic text-sm">{n.message}</p>
 </li>
 ))}
 </ul>
 )}
 </div>
 );
};
