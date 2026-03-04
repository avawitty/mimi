import { doc, updateDoc, arrayUnion, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

export const recordSession = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const now = Date.now();
  
  await updateDoc(userRef, {
    lastVisitAt: now,
    visitCount: (await getDoc(userRef)).data()?.visitCount + 1 || 1,
    sessionDates: arrayUnion(now)
  });

  const sessionRef = doc(collection(db, `retention_events/${userId}/sessions`), now.toString());
  await setDoc(sessionRef, { timestamp: now });
};

export const computeRetentionMetrics = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  
  const userData = userSnap.data() as UserProfile;
  const firstVisit = userData.firstVisitAt || userData.createdAt;
  const sessionDates = userData.sessionDates || [];
  
  const d7 = sessionDates.filter(date => (date - firstVisit) >= 7 * 24 * 60 * 60 * 1000).length > 0;
  const d30 = sessionDates.filter(date => (date - firstVisit) >= 30 * 24 * 60 * 60 * 1000).length > 0;
  
  return { d7, d30 };
};
