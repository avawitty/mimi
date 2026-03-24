import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { handleFirestoreError, OperationType } from '../services/firebaseUtils';
import { Notification } from '../types';

export const NotificationsPanel: React.FC = () => {
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
    <div className="notifications-panel p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-lg font-bold mb-4">Notifications</h2>
      {notifications.length === 0 ? (
        <p>No new notifications.</p>
      ) : (
        <ul>
          {notifications.map(n => (
            <li key={n.id} className={`mb-2 p-2 rounded ${n.read ? 'bg-gray-100' : 'bg-blue-50'}`}>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="text-sm">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
