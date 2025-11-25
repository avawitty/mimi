

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  increment 
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  uploadString 
} from "firebase/storage";
import { ZineContent, UserProfile, ZineMetadata, Echo, ToneTag, PocketItem } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyB72Rv0X1q5czfNWqKVNF7Avq73jXWmVWA",
  authDomain: "downtheline-d9112.firebaseapp.com",
  projectId: "downtheline-d9112",
  storageBucket: "downtheline-d9112.firebasestorage.app",
  messagingSenderId: "558297179245",
  appId: "1:558297179245:web:7a27f55f187c79b7a88b64",
  measurementId: "G-9SKWM6C82B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Helpers ---

// Sanitize objects to remove 'undefined' values (which Firestore rejects)
const sanitizeForFirestore = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === undefined ? null : value;
  }));
};

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const uploadBlob = async (blob: Blob, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

// Helper to handle base64 upload specifically for Pocket images
export const uploadBase64Image = async (base64: string, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  // Remove header if present
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  await uploadString(storageRef, cleanBase64, 'base64', { contentType: 'image/png' });
  return await getDownloadURL(storageRef);
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  await setDoc(doc(db, "users", profile.uid), sanitizeForFirestore(profile));
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docSnap = await getDoc(doc(db, "users", uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const saveZineToProfile = async (
  userId: string, 
  userHandle: string, 
  userAvatar: string | undefined, 
  zine: ZineContent, 
  tone: ToneTag, 
  coverImageUrl?: string
): Promise<string> => {
  const zineData: Omit<ZineMetadata, 'id'> = {
    userId,
    userHandle,
    userAvatar: userAvatar || null, 
    title: zine.title,
    tone: tone,
    coverImagePrompt: zine.pages.find(p => p.layoutType === 'cover')?.imagePrompt || null, 
    coverImageUrl: coverImageUrl || null,
    timestamp: Date.now(),
    likes: 0,
    content: zine
  };
  
  const docRef = await addDoc(collection(db, "zines"), sanitizeForFirestore(zineData));
  return docRef.id;
};

export const updateZine = async (zineId: string, data: Partial<ZineMetadata>): Promise<void> => {
  try {
    const docRef = doc(db, "zines", zineId);
    await updateDoc(docRef, sanitizeForFirestore(data));
  } catch (error) {
    console.error("Failed to update zine:", error);
    throw error;
  }
};

export const deleteZine = async (zineId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "zines", zineId));
    // Note: This does not delete subcollections (echoes) automatically due to Firestore structure,
    // but for this MVP scope, removing the main reference is sufficient to hide it.
  } catch (error) {
    console.error("Failed to delete zine", error);
    throw error;
  }
};

export const fetchCommunityZines = async (limitCount = 20): Promise<ZineMetadata[]> => {
  const q = query(
    collection(db, "zines"), 
    orderBy("timestamp", "desc"), 
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
    
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ZineMetadata));
};

export const fetchTrendingZines = async (limitCount = 5): Promise<ZineMetadata[]> => {
  const q = query(
    collection(db, "zines"), 
    orderBy("likes", "desc"), 
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
    
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ZineMetadata));
};

export const fetchTrendingArchetypes = async (): Promise<string[]> => {
  // We fetch a larger batch and calculate trending locally for now, 
  // as robust aggregation requires Cloud Functions.
  const q = query(
    collection(db, "zines"), 
    orderBy("likes", "desc"), 
    limit(50)
  );
  const snapshot = await getDocs(q);
  
  const frequency: Record<string, number> = {};
  
  snapshot.docs.forEach(doc => {
    const data = doc.data() as ZineMetadata; 
    const arch = data.content?.archetype_identity;
    
    if (arch) {
      const key = arch.trim();
      frequency[key] = (frequency[key] || 0) + 1;
    }
  });

  const sorted = Object.entries(frequency)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([key]) => key);

  return sorted.slice(0, 3);
};

export const fetchArchive = async (): Promise<ZineMetadata[]> => {
  const q = query(
    collection(db, "zines"), 
    orderBy("timestamp", "desc"), 
    limit(50)
  );
  const querySnapshot = await getDocs(q);
    
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ZineMetadata));
};

export const fetchUserZines = async (userId: string): Promise<ZineMetadata[]> => {
  const q = query(
    collection(db, "zines"), 
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
    
  const zines = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ZineMetadata));
  
  return zines.sort((a, b) => b.timestamp - a.timestamp);
};

export const getZine = async (zineId: string): Promise<ZineMetadata | null> => {
  try {
    const docSnap = await getDoc(doc(db, "zines", zineId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ZineMetadata;
    }
    return null;
  } catch (error) {
    console.error("Error fetching zine:", error);
    return null;
  }
};

// --- Echoes ---

export const addEcho = async (zineId: string, echo: Omit<Echo, 'id'>): Promise<string> => {
  const echoesCol = collection(db, "zines", zineId, "echoes");
  
  // Ensure we default type if missing
  const echoData = {
      ...echo,
      type: echo.type || 'audio'
  };

  const docRef = await addDoc(echoesCol, sanitizeForFirestore(echoData));
  
  // Increment likes on the parent zine
  await updateDoc(doc(db, "zines", zineId), {
    likes: increment(1)
  });

  return docRef.id;
};

export const deleteEcho = async (zineId: string, echoId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "zines", zineId, "echoes", echoId));
  } catch (error) {
    console.error("Failed to delete echo", error);
    throw error;
  }
};

export const fetchEchoes = async (zineId: string): Promise<Echo[]> => {
  const echoesCol = collection(db, "zines", zineId, "echoes");
  const q = query(echoesCol, orderBy("timestamp", "asc"));
  const querySnapshot = await getDocs(q);
    
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Echo));
};

// --- Pocket (Bookmarks) ---

export const addToPocket = async (
  userId: string, 
  type: PocketItem['type'],
  content: PocketItem['content']
): Promise<string> => {
  try {
    let finalContent = { ...content };

    if (type === 'image' && content.imageUrl?.startsWith('data:')) {
      const path = `pocket/${userId}/${Date.now()}.png`;
      const publicUrl = await uploadBase64Image(content.imageUrl, path);
      finalContent.imageUrl = publicUrl;
    }

    const pocketCol = collection(db, "users", userId, "pocket");
    const docRef = await addDoc(pocketCol, {
      userId,
      type,
      savedAt: Date.now(),
      content: sanitizeForFirestore(finalContent)
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Failed to pocket item:", error);
    throw error;
  }
};

export const fetchPocketItems = async (userId: string): Promise<PocketItem[]> => {
  try {
    const pocketCol = collection(db, "users", userId, "pocket");
    const q = query(pocketCol, orderBy("savedAt", "desc"));
    const snapshot = await getDocs(q);
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PocketItem));
  } catch (error) {
    console.error("Failed to fetch pocket:", error);
    return [];
  }
};

export const deleteFromPocket = async (userId: string, itemId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "users", userId, "pocket", itemId));
  } catch (error) {
    console.error("Failed to remove from pocket:", error);
    throw error;
  }
};

export { app, analytics };