import { db, isFullyAuthenticated } from "./firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./firebaseUtils";
import { Notification } from "../types";

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  if (!userId || userId === 'ghost' || userId.startsWith('local_ghost_') || !isFullyAuthenticated()) {
    callback([]);
    return () => {};
  }
  
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    callback(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'notifications');
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  if (!isFullyAuthenticated()) return;
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
};
