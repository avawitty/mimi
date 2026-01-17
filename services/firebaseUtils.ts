
import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, deleteDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleAuthProvider, linkWithPopup, linkWithRedirect, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { ensureDb, ensureStorage, ensureAuth } from "./firebase";
import { ZineContent, ZineMetadata, Echo, ToneTag, PocketItem, UserProfile } from "../types";
import { saveZineLocally, savePocketItemLocally, saveProfileLocally, getLocalZines, getLocalProfile } from "./localArchive";

const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const uploadBlob = async (blob: Blob | string, path: string): Promise<string> => {
  try {
    const storage = await ensureStorage();
    const sRef = ref(storage, path);
    const finalBlob = typeof blob === 'string' ? dataURLtoBlob(blob) : blob;
    await uploadBytes(sRef, finalBlob);
    return getDownloadURL(sRef);
  } catch (e) {
    console.warn("MIMI // Storage Handshake failed. The asset is ephemeral.");
    return typeof blob === 'string' ? blob : URL.createObjectURL(blob);
  }
};

export const fetchZineById = async (id: string): Promise<ZineMetadata | null> => {
  try {
    const db = await ensureDb();
    const snap = await getDoc(doc(db, "zines", id));
    if (snap.exists()) return snap.data() as ZineMetadata;
    return null;
  } catch (e) {
    const local = getLocalZines();
    return local.find(z => z.id === id) || null;
  }
};

export const saveZineToProfile = async (uid: string, handle: string, avatar: string | undefined, zine: ZineContent, tone: ToneTag, coverUrl?: string, deep?: boolean, isPublic?: boolean): Promise<string> => {
  const targetId = `9_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  
  let anchoredCoverUrl = coverUrl;
  if (coverUrl && coverUrl.startsWith('data:')) {
    anchoredCoverUrl = await uploadBlob(coverUrl, `zines/${uid}/${targetId}_cover.png`);
  }

  const meta: ZineMetadata = {
    id: targetId,
    userId: uid, userHandle: handle, userAvatar: avatar || null,
    title: zine.title, tone, coverImageUrl: anchoredCoverUrl || null,
    timestamp: Date.now(), likes: 0, content: zine, isDeepThinking: !!deep,
    isPublic: !!isPublic 
  };
  
  saveZineLocally(meta);
  
  if (uid.startsWith('ghost_')) return targetId;
  try {
    const db = await ensureDb();
    // Explicitly manifest the collection by writing the document
    await setDoc(doc(db, "zines", targetId), meta);
    console.log(`%c MIMI // Manifested: Zine ${targetId} anchored in Cloud.`, "color: #10B981;");
    return targetId;
  } catch (e) { 
    console.warn("MIMI // Cloud manifestation deferred. Local archive holds the trace.", e);
    return targetId; 
  }
};

export const fetchUserZines = async (uid: string): Promise<ZineMetadata[]> => {
  if (!uid || uid.startsWith('ghost_')) return []; 
  try {
    const db = await ensureDb();
    const q = query(collection(db, "zines"), where("userId", "==", uid), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ZineMetadata));
  } catch (e) { 
    return getLocalZines().filter(z => z.userId === uid); 
  }
};

export const fetchCommunityZines = async (count = 20): Promise<ZineMetadata[]> => {
  try {
    const db = await ensureDb();
    const q = query(collection(db, "zines"), where("isPublic", "==", true), orderBy("timestamp", "desc"), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ZineMetadata));
  } catch (e) { 
    return []; 
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid || uid.startsWith('ghost_')) return null;
  try {
    const db = await ensureDb();
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (e) { 
    return getLocalProfile(); 
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  saveProfileLocally(profile);
  if (!profile.uid || profile.uid.startsWith('ghost_')) return;
  try {
    const db = await ensureDb();
    // Use setDoc with merge to ensure we don't overwrite but always update
    await setDoc(doc(db, "users", profile.uid), {
      ...profile,
      lastActive: serverTimestamp()
    }, { merge: true });
    console.log(`%c MIMI // Registry: Identity anchored in Project O2 for ${profile.handle}`, "color: #10B981;");
  } catch (e) {
    console.error("MIMI // Data Bank rejection:", e);
  }
};

export const linkGoogleAccount = async () => {
  const auth = await ensureAuth();
  const provider = new GoogleAuthProvider();
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
  
  if (!auth.currentUser) {
    // We explicitly use redirect on mobile as popups are often blocked by safari/ios
    if (isMobile) {
      return await signInWithRedirect(auth, provider);
    } else {
      return await signInWithPopup(auth, provider);
    }
  }
  
  if (isMobile) {
    return await linkWithRedirect(auth.currentUser, provider);
  } else {
    return await linkWithPopup(auth.currentUser, provider);
  }
};

export const addToPocket = async (uid: string, type: PocketItem['type'], content: any): Promise<string> => {
  const localId = 'pkt_' + Date.now();
  let processedContent = { ...content };
  if (content.imageUrl && content.imageUrl.startsWith('data:')) {
    processedContent.imageUrl = await uploadBlob(content.imageUrl, `pocket/${uid}/${localId}.png`);
  }
  
  const item: PocketItem = { id: localId, userId: uid, type, savedAt: Date.now(), content: processedContent };
  savePocketItemLocally(item);
  
  if (!uid || uid.startsWith('ghost_')) return localId;
  try {
    const db = await ensureDb();
    await setDoc(doc(db, "pocket", localId), item);
    return localId;
  } catch (e) { return localId; }
};

export const fetchPocketItems = async (uid: string): Promise<PocketItem[]> => {
  if (!uid || uid.startsWith('ghost_')) return [];
  try {
    const db = await ensureDb();
    const q = query(collection(db, "pocket"), where("userId", "==", uid), orderBy("savedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PocketItem));
  } catch (e) { return []; }
};

export const deleteFromPocket = async (uid: string, itemId: string) => {
  try {
    const db = await ensureDb();
    return deleteDoc(doc(db, "pocket", itemId));
  } catch (e) { console.warn("MIMI // Cloud delete failed."); }
};

export const recordTasteEdit = async (uid: string, orig: string, gen: string, base: string, edit: string) => {
  try {
    const db = await ensureDb();
    return addDoc(collection(db, "taste_records"), { userId: uid, originalImageUrl: orig, generatedImageUrl: gen, basePrompt: base, editPrompt: edit, timestamp: Date.now() });
  } catch (e) { console.error(e); }
};
