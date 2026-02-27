import { collection, doc, setDoc, deleteDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db, auth } from "./firebaseInit";

export interface Connection {
  id: string;
  followerId: string;
  followingId: string;
  timestamp: number;
}

export const followUser = async (followingId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in to follow");
  
  const connectionId = `${currentUser.uid}_${followingId}`;
  const connection: Connection = {
    id: connectionId,
    followerId: currentUser.uid,
    followingId,
    timestamp: Date.now()
  };
  
  await setDoc(doc(db, "connections", connectionId), connection);
};

export const unfollowUser = async (followingId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Must be logged in to unfollow");
  
  const connectionId = `${currentUser.uid}_${followingId}`;
  await deleteDoc(doc(db, "connections", connectionId));
};

export const fetchFollowers = async (userId: string) => {
  const q = query(collection(db, "connections"), where("followingId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Connection);
};

export const fetchFollowing = async (userId: string) => {
  const q = query(collection(db, "connections"), where("followerId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Connection);
};

export const subscribeToFollowing = (userId: string, callback: (connections: Connection[]) => void) => {
  const q = query(collection(db, "connections"), where("followerId", "==", userId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as Connection));
  });
};
