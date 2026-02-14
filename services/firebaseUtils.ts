
// @ts-nocheck
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc, addDoc, updateDoc, arrayUnion, increment, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, linkWithPopup, linkWithRedirect, signInAnonymously, ActionCodeSettings } from "firebase/auth";
import { auth, db, storage } from "./firebaseInit";
import { ZineContent, ZineMetadata, ToneTag, PocketItem, UserProfile, DossierFolder, DossierArtifact, Treatment, UserPreferences, MediaFile, Proposal, ContextEntry } from "../types";
import { saveZineLocally, savePocketItemLocally, getLocalProfile, getLocalPocket, getLocalZines, deleteLocalPocketItem } from "./localArchive";
import { syncToShadowMemory, deleteFromShadowMemory } from "./vectorSearch";

export const isCaptiveInWebview = () => {
  if (typeof window === 'undefined' || !navigator) return false;
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const isSocial = /instagram|fb_iab|fban|fbav|tiktok|threads|wv|webview/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isSocial && !isStandalone;
};

export const anchorIdentity = async (forceRedirect = false): Promise<void> => {
  const provider = new GoogleAuthProvider();
  if (isCaptiveInWebview() || forceRedirect) return signInWithRedirect(auth, provider);
  try { await signInWithPopup(auth, provider); } catch (e) { await signInWithRedirect(auth, provider); }
};

export const saveZineToProfile = async (uid: string, handle: string, avatar: string | undefined, zine: ZineContent, tone: ToneTag, coverUrl?: string, deep?: boolean, isPublic?: boolean, isLite?: boolean, artifacts?: MediaFile[], originalInput?: string): Promise<string> => {
  const targetId = `zine_${uid}_${Date.now()}`;
  const meta: ZineMetadata = {
    id: targetId, userId: uid, userHandle: handle, userAvatar: avatar || null,
    title: zine.title, tone, coverImageUrl: coverUrl || null, timestamp: Date.now(), likes: 0,
    content: zine, isDeepThinking: !!deep, isPublic: !!isPublic, isLite: !!isLite,
    artifacts: artifacts || [],
    originalInput: originalInput || ""
  };
  await saveZineLocally(meta);
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await setDoc(doc(db, "zines", targetId), meta);
    syncToShadowMemory(meta);
  }
  return targetId;
};

export const addToPocket = async (uid: string, type: PocketItem['type'], content: any): Promise<void> => {
  const itemId = `item_${Date.now()}`;
  const item: PocketItem = { id: itemId, userId: uid, type, savedAt: Date.now(), content, notes: content.notes || "" };
  await savePocketItemLocally(item);
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await setDoc(doc(db, "pocket", itemId), item);
    syncToShadowMemory(item);
  }
};

export const deleteFromPocket = async (itemId: string): Promise<void> => {
  await deleteLocalPocketItem(itemId);
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await deleteDoc(doc(db, "pocket", itemId));
    deleteFromShadowMemory(itemId);
  }
};

export const createMoodboard = async (uid: string, name: string, itemIds: string[]): Promise<string> => {
  const boardId = `moodboard_${Date.now()}`;
  const item: PocketItem = { 
    id: boardId, 
    userId: uid, 
    type: 'moodboard', 
    savedAt: Date.now(), 
    content: { name, itemIds } 
  };
  await savePocketItemLocally(item);
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await setDoc(doc(db, "pocket", boardId), item);
    syncToShadowMemory(item);
  }
  return boardId;
};

export const updatePocketItem = async (itemId: string, patch: Partial<PocketItem>): Promise<void> => {
  const localPocket = await getLocalPocket();
  const index = localPocket.findIndex(i => i.id === itemId);
  if (index !== -1) {
    const updated = { ...localPocket[index], ...patch };
    await savePocketItemLocally(updated);
  }
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await updateDoc(doc(db, "pocket", itemId), patch);
  }
};

export const fetchPocketItems = async (uid: string) => {
    const q = query(collection(db, "pocket"), where("userId", "==", uid), orderBy("savedAt", "desc"));
    return (await getDocs(q)).docs.map(d => d.data() as PocketItem);
};

export const fetchUserZines = async (uid: string) => {
    const q = query(collection(db, "zines"), where("userId", "==", uid), orderBy("timestamp", "desc"));
    return (await getDocs(q)).docs.map(d => d.data() as ZineMetadata);
};

export const fetchCommunityZines = async (count: number) => {
    const q = query(collection(db, "zines"), where("isPublic", "==", true), orderBy("timestamp", "desc"), limit(count));
    return (await getDocs(q)).docs.map(d => d.data() as ZineMetadata);
};

export const subscribeToCommunityZines = (callback: (data: ZineMetadata[]) => void) => {
  const q = query(collection(db, "zines"), where("isPublic", "==", true), orderBy("timestamp", "desc"), limit(30));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as ZineMetadata));
  });
};

export const fetchZineById = async (id: string) => {
    const s = await getDoc(doc(db, "zines", id));
    return s.exists() ? s.data() as ZineMetadata : null;
};

export const createDossierFolder = async (uid: string, name: string): Promise<string> => {
  const id = `folder_${Date.now()}`;
  const folder: DossierFolder = { id, userId: uid, name, createdAt: Date.now() };
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await setDoc(doc(db, "dossier_folders", id), folder);
  }
  return id;
};

export const updateDossierFolder = async (folderId: string, patch: Partial<DossierFolder>) => {
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await updateDoc(doc(db, "dossier_folders", folderId), patch);
  }
};

export const fetchDossierFolders = async (uid: string) => {
  const q = query(collection(db, "dossier_folders"), where("userId", "==", uid), orderBy("createdAt", "desc"));
  return (await getDocs(q)).docs.map(d => d.data() as DossierFolder);
};

export const createDossierArtifactFromImage = async (uid: string, folderId: string, title: string, imageUrl: string) => {
  const id = `artifact_${Date.now()}`;
  const artifact: DossierArtifact = {
    id, userId: uid, folderId, type: 'moodboard', title, createdAt: Date.now(),
    elements: [{ id: 'el_0', type: 'image', content: imageUrl }]
  };
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await setDoc(doc(db, "dossier_artifacts", id), artifact);
  }
  return id;
};

export const createDossierArtifactFromText = async (uid: string, folderId: string, title: string, text: string) => {
  const id = `artifact_${Date.now()}`;
  const artifact: DossierArtifact = {
    id, userId: uid, folderId, type: 'brief', title, createdAt: Date.now(),
    elements: [{ id: 'el_0', type: 'text', content: text }]
  };
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await setDoc(doc(db, "dossier_artifacts", id), artifact);
  }
  return id;
};

export const fetchDossierArtifacts = async (folderId: string) => {
  const q = query(collection(db, "dossier_artifacts"), where("folderId", "==", folderId), orderBy("createdAt", "desc"));
  return (await getDocs(q)).docs.map(d => d.data() as DossierArtifact);
};

// -- PROPOSAL SYSTEM CRUD -- //

export const saveProposal = async (proposal: Proposal): Promise<void> => {
  // Local persistence todo: add saveProposalLocally
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await setDoc(doc(db, "proposals", proposal.id), proposal);
  }
};

export const fetchUserProposals = async (uid: string) => {
  const q = query(collection(db, "proposals"), where("userId", "==", uid), orderBy("updatedAt", "desc"));
  return (await getDocs(q)).docs.map(d => d.data() as Proposal);
};

export const getProposalById = async (id: string) => {
  const s = await getDoc(doc(db, "proposals", id));
  return s.exists() ? s.data() as Proposal : null;
};

// -- SHARED CONTEXT SYSTEM -- //

export const addContextEntry = async (uid: string, text: string, type: 'note' | 'link' = 'note'): Promise<string> => {
  if (!uid || !text) throw new Error("Invalid Context Input");
  const id = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const entry: ContextEntry = {
    id,
    userId: uid,
    text,
    type,
    timestamp: Date.now()
  };
  
  if (navigator.onLine && auth.currentUser && !auth.currentUser.isAnonymous) {
    await setDoc(doc(db, "context", id), entry);
  }
  return id;
};

export const fetchContextEntries = async (limitCount: number = 50) => {
  const q = query(collection(db, "context"), orderBy("timestamp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as ContextEntry);
};

export const deleteContextEntry = async (id: string) => {
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    await deleteDoc(doc(db, "context", id));
  }
};

export const getUserProfile = async (uid: string) => (await getDoc(doc(db, "users", uid))).data() as UserProfile;
export const saveUserProfile = async (p: UserProfile) => setDoc(doc(db, "users", p.uid), p, { merge: true });

// PREFERENCES MIGRATION
export const getUserPreferences = async (uid: string) => (await getDoc(doc(db, "userPreferences", uid))).data() as UserPreferences;
export const saveUserPreferences = async (uid: string, p: UserPreferences) => setDoc(doc(db, "userPreferences", uid), p, { merge: true });

export const startGhostSession = () => signInAnonymously(auth);
export const handleAuthRedirect = () => getRedirectResult(auth);
export const isHandleAvailable = async () => true; 
export const uploadBlob = async (b: any, p: string) => b; 
export const migrateLocalToCloud = async () => {};
