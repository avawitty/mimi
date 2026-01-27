// @ts-nocheck
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, linkWithPopup, linkWithRedirect, signInAnonymously, ActionCodeSettings } from "firebase/auth";
import { auth, db, storage } from "./firebaseInit";
import { ZineContent, ZineMetadata, ToneTag, PocketItem, UserProfile, ZineComment } from "../types";
import { saveZineLocally, savePocketItemLocally } from "./localArchive";

const getSovereignActionSettings = (): ActionCodeSettings => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const authDomain = (auth.app as any).options.authDomain;
  const projectUrl = `https://${authDomain}`;
  const isWhitelisted = currentOrigin.includes('localhost') || currentOrigin.includes('firebaseapp.com') || currentOrigin.includes('web.app');
  return { url: isWhitelisted ? currentOrigin : projectUrl, handleCodeInApp: true };
};

export const isCaptiveInWebview = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isInstagram = /Instagram/i.test(ua) || ua.includes('FB_IAB');
  const isFB = /FBAN|FBAV/i.test(ua);
  const isTikTok = /TikTok/i.test(ua);
  return (isInstagram || isFB || isTikTok) && !window.matchMedia('(display-mode: standalone)').matches;
};

export const anchorIdentity = async (forceRedirect = false): Promise<void> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const currentUser = auth.currentUser;
  const captive = isCaptiveInWebview();
  if (captive || forceRedirect) {
    if (!currentUser) return await signInWithRedirect(auth, provider);
    else return await linkWithRedirect(currentUser, provider);
  }
  try {
    if (!currentUser) await signInWithPopup(auth, provider);
    else await linkWithPopup(currentUser, provider);
  } catch (error: any) {
    if (['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/popup-closed-by-user', 'auth/internal-error'].includes(error.code)) {
      if (!currentUser) return await signInWithRedirect(auth, provider);
      else return await linkWithRedirect(currentUser, provider);
    }
    throw error;
  }
};

export const handleAuthRedirect = async (): Promise<any> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (e: any) { return { code: e.code, message: e.message }; }
};

export const uploadBlob = async (data: string | Blob, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    let blob: Blob;
    if (typeof data === 'string' && data.startsWith('data:')) {
      const response = await fetch(data);
      blob = await response.blob();
    } else if (typeof data === 'string') {
      blob = new Blob([data], { type: 'text/plain' });
    } else {
      blob = data;
    }
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  } catch (e) { return typeof data === 'string' ? data : ''; }
};

export const updateZineVisibility = async (zineId: string, isPublic: boolean): Promise<void> => {
  if (!navigator.onLine) return;
  try {
    const docRef = doc(db, "zines", zineId);
    await updateDoc(docRef, { isPublic });
  } catch (e) { console.warn("MIMI // Visibility sync failed."); }
};

export const initiatePasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email, getSovereignActionSettings());
  } catch (e: any) { throw e; }
};

const scrubForRegistry = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (['safetyRatings', 'citationSources', 'requestFramePermissions'].includes(key)) return undefined;
      return value;
    }));
  } catch (e) { return obj; }
};

export const saveZineToProfile = async (uid: string, handle: string, avatar: string | undefined, zine: ZineContent, tone: ToneTag, coverUrl?: string, deep?: boolean, isPublic?: boolean): Promise<string> => {
  const targetId = `zine_${uid}_${Date.now()}`;
  const meta: ZineMetadata = {
    id: targetId,
    userId: uid, 
    userHandle: handle, 
    userAvatar: avatar || null,
    title: zine.title, 
    tone, 
    coverImageUrl: coverUrl || null,
    timestamp: Date.now(), 
    likes: 0, 
    content: scrubForRegistry(zine), 
    isDeepThinking: !!deep,
    isPublic: !!isPublic 
  };
  
  await saveZineLocally(meta);
  window.dispatchEvent(new CustomEvent('mimi:artifact_finalized', { detail: { id: targetId } }));

  // TRIGGER CLOUD SYNC IN BACKGROUND TO AVOID UI BLOCK
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && !uid.startsWith('ghost') && navigator.onLine) {
    (async () => {
      try {
        let anchoredCoverUrl = coverUrl;
        if (coverUrl && coverUrl.startsWith('data:')) {
          anchoredCoverUrl = await uploadBlob(coverUrl, `zines/${uid}/${targetId}_cover.png`);
          meta.coverImageUrl = anchoredCoverUrl;
          await saveZineLocally(meta);
        }
        await setDoc(doc(db, "zines", targetId), scrubForRegistry(meta));
      } catch (e) { console.warn(`MIMI // Cloud sync deferred.`); }
    })();
  }
  
  return targetId;
};

export const startGhostSession = async () => {
  try { return await signInAnonymously(auth); } catch (e: any) { throw e; }
};

export const fetchZineById = async (id: string, retries = 2): Promise<ZineMetadata | null> => {
  if (!navigator.onLine) return null;
  try {
    const docRef = doc(db, "zines", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as ZineMetadata : null;
  } catch (e: any) { 
    if (e.code === 'unavailable') return null;
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchZineById(id, retries - 1);
    }
    return null; 
  }
};

export const addToPocket = async (uid: string, type: PocketItem['type'], content: any): Promise<void> => {
  const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const item: PocketItem = {
    id: itemId,
    userId: uid, 
    type, 
    savedAt: Date.now(), 
    content: scrubForRegistry(content)
  };

  await savePocketItemLocally(item);

  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && !uid.startsWith('ghost') && navigator.onLine) {
    (async () => {
      try {
        if (content.imageUrl && content.imageUrl.startsWith('data:')) {
          const cloudUrl = await uploadBlob(content.imageUrl, `pocket/${uid}/${itemId}.png`);
          item.content.imageUrl = cloudUrl;
          await savePocketItemLocally(item);
        }
        await setDoc(doc(db, "pocket", itemId), scrubForRegistry(item));
      } catch (e) { console.warn("MIMI // Vault sync deferred."); }
    })();
  }
};

export const fetchPocketItems = async (uid: string): Promise<PocketItem[]> => {
  if (!navigator.onLine) return [];
  try {
    const q = query(collection(db, "pocket"), where("userId", "==", uid), orderBy("savedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as PocketItem);
  } catch (e: any) { return []; }
};

export const deleteFromPocket = async (uid: string, itemId: string): Promise<void> => {
  try {
    const docRef = doc(db, "pocket", itemId);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().userId === uid) {
      await deleteDoc(docRef);
    }
  } catch (e) {}
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  if (!navigator.onLine) return;
  try {
    const userRef = doc(db, "users", profile.uid);
    await setDoc(userRef, scrubForRegistry(profile), { merge: true });
  } catch (e: any) { throw e; }
};

export const fetchUserZines = async (uid: string): Promise<ZineMetadata[]> => {
  if (!navigator.onLine) return [];
  try {
    const q = query(collection(db, "zines"), where("userId", "==", uid), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ZineMetadata);
  } catch (e) { return []; }
};

export const fetchCommunityZines = async (count: number = 20): Promise<ZineMetadata[]> => {
  if (!navigator.onLine) return [];
  try {
    const q = query(collection(db, "zines"), where("isPublic", "==", true), orderBy("timestamp", "desc"), limit(count));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ZineMetadata);
  } catch (e) { return []; }
};

export const isHandleAvailable = async (handle: string, uid: string): Promise<boolean> => {
  if (!navigator.onLine) return true;
  try {
    const q = query(collection(db, "users"), where("handle", "==", handle.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;
    return snapshot.docs[0].id === uid;
  } catch (e) { return true; }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  
  // Safety timeout for profile fetch
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000));
  
  try {
    const fetchPromise = (async () => {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as UserProfile : null;
    })();
    
    return await Promise.race([fetchPromise, timeout]);
  } catch (e: any) { 
    console.warn("MIMI // Profile access deferred due to frequency noise.");
    return null; 
  }
};