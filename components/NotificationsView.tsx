import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { handleFirestoreError, OperationType } from '../services/firebaseUtils';
import { Notification } from '../types';
import { motion } from 'framer-motion';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      setNotifications(fetchedNotifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

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
            <li key={n.id} className={`p-6 rounded-sm border ${n.read ? 'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700' : 'bg-white dark:bg-stone-900 border-emerald-500/20'}`}>
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
