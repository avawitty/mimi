
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

export const linkIdentity = async (): Promise<void> => {
  if (!auth.currentUser) throw new Error("No active session to link.");
  const provider = new GoogleAuthProvider();
  // Optional: Add Drive scope for future data management features
  // provider.addScope('https://www.googleapis.com/auth/drive.file'); 
  
  try {
    await linkWithPopup(auth.currentUser, provider);
  } catch (e: any) {
    if (e.code === 'auth/credential-already-in-use') {
       throw new Error("This Google frequency is already occupied by another registry.");
    }
    throw e;
  }
};

export const saveZineToProfile = async (uid: string, handle: string, avatar: string | undefined, zine: ZineContent, tone: ToneTag, coverUrl?: string, deep?: boolean, isPublic?: boolean, isLite?: boolean, artifacts?: MediaFile[], originalInput?: string): Promise<string> => {
  const targetId = `zine_${uid}_${Date.now()}`;
  
  // Ensure we capture the original thought properly, falling back to metadata if arg is missing
  const rawInput = originalInput || zine.meta?.intent || "";

  const meta: ZineMetadata = {
    id: targetId, userId: uid, userHandle: handle, userAvatar: avatar || null,
    title: zine.title, tone, coverImageUrl: coverUrl || null, timestamp: Date.now(), likes: 0,
    content: zine, isDeepThinking: !!deep, isPublic: !!isPublic, isLite: !!isLite,
    artifacts: artifacts || [],
    originalInput: rawInput 
  };
  
  await saveZineLocally(meta);
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    try {
      await setDoc(doc(db, "zines", targetId), meta);
      syncToShadowMemory(meta);
    } catch (e) { console.warn("MIMI // Zine Sync Skipped:", e.code); }
  }
  return targetId;
};

export const addToPocket = async (uid: string, type: PocketItem['type'], content: any): Promise<void> => {
  const itemId = `item_${Date.now()}`;
  const item: PocketItem = { id: itemId, userId: uid, type, savedAt: Date.now(), content, notes: content.notes || "" };
  await savePocketItemLocally(item);
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    try {
      await setDoc(doc(db, "pocket", itemId), item);
      syncToShadowMemory(item);
    } catch (e) { console.warn("MIMI // Pocket Sync Skipped:", e.code); }
  }
  return itemId; // Returned ID for immediate reference
};

export const deleteFromPocket = async (itemId: string): Promise<void> => {
  await deleteLocalPocketItem(itemId);
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    try {
      await deleteDoc(doc(db, "pocket", itemId));
      deleteFromShadowMemory(itemId);
    } catch (e) { console.warn("MIMI // Pocket Del Skipped:", e.code); }
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
    try {
      await setDoc(doc(db, "pocket", boardId), item);
      syncToShadowMemory(item);
    } catch (e) { console.warn("MIMI // Board Sync Skipped:", e.code); }
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
    try {
      await updateDoc(doc(db, "pocket", itemId), patch);
    } catch (e) { console.warn("MIMI // Pocket Update Skipped:", e.code); }
  }
};

export const fetchPocketItems = async (uid: string) => {
    try {
      const q = query(collection(db, "pocket"), where("userId", "==", uid), orderBy("savedAt", "desc"));
      return (await getDocs(q)).docs.map(d => d.data() as PocketItem);
    } catch (e) { 
      console.warn("MIMI // Pocket Fetch Error:", e.code);
      return []; 
    }
};

export const fetchUserZines = async (uid: string) => {
    try {
      const q = query(collection(db, "zines"), where("userId", "==", uid), orderBy("timestamp", "desc"));
      return (await getDocs(q)).docs.map(d => d.data() as ZineMetadata);
    } catch (e) { 
      console.warn("MIMI // Zine Fetch Error:", e.code);
      return []; 
    }
};

export const fetchCommunityZines = async (count: number) => {
    try {
      const q = query(collection(db, "zines"), where("isPublic", "==", true), orderBy("timestamp", "desc"), limit(count));
      return (await getDocs(q)).docs.map(d => d.data() as ZineMetadata);
    } catch (e) {
      console.warn("MIMI // Community Fetch Error:", e.code);
      return [];
    }
};

export const subscribeToCommunityZines = (callback: (data: ZineMetadata[]) => void) => {
  const q = query(collection(db, "zines"), where("isPublic", "==", true), orderBy("timestamp", "desc"), limit(30));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => d.data() as ZineMetadata));
  }, (e) => console.warn("MIMI // Community Sub Error:", e.code));
};

export const fetchZineById = async (id: string) => {
    try {
      const s = await getDoc(doc(db, "zines", id));
      return s.exists() ? s.data() as ZineMetadata : null;
    } catch (e) { return null; }
};

export const createDossierFolder = async (uid: string, name: string): Promise<string> => {
  const id = `folder_${Date.now()}`;
  const folder: DossierFolder = { id, userId: uid, name, createdAt: Date.now() };
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    try { await setDoc(doc(db, "dossier_folders", id), folder); } catch (e) {}
  }
  return id;
};

export const updateDossierFolder = async (folderId: string, patch: Partial<DossierFolder>) => {
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    try { await updateDoc(doc(db, "dossier_folders", folderId), patch); } catch (e) {}
  }
};

export const fetchDossierFolders = async (uid: string) => {
  try {
    const q = query(collection(db, "dossier_folders"), where("userId", "==", uid), orderBy("createdAt", "desc"));
    return (await getDocs(q)).docs.map(d => d.data() as DossierFolder);
  } catch (e) { return []; }
};

export const createDossierArtifactFromImage = async (uid: string, folderId: string, title: string, imageUrl: string) => {
  const id = `artifact_${Date.now()}`;
  const artifact: DossierArtifact = {
    id, userId: uid, folderId, type: 'moodboard', title, createdAt: Date.now(),
    elements: [{ id: 'el_0', type: 'image', content: imageUrl }]
  };
  if (uid && auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    try { await setDoc(doc(db, "dossier_artifacts", id), artifact); } catch (e) {}
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
    try { await setDoc(doc(db, "dossier_artifacts", id), artifact); } catch (e) {}
  }
  return id;
};

export const fetchDossierArtifacts = async (folderId: string) => {
  try {
    const q = query(collection(db, "dossier_artifacts"), where("folderId", "==", folderId), orderBy("createdAt", "desc"));
    return (await getDocs(q)).docs.map(d => d.data() as DossierArtifact);
  } catch (e) { return []; }
};

// -- PROPOSAL SYSTEM CRUD -- //

export const saveProposal = async (proposal: Proposal): Promise<void> => {
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    try { await setDoc(doc(db, "proposals", proposal.id), proposal); } catch (e) {}
  }
};

export const fetchUserProposals = async (uid: string) => {
  try {
    const q = query(collection(db, "proposals"), where("userId", "==", uid), orderBy("updatedAt", "desc"));
    return (await getDocs(q)).docs.map(d => d.data() as Proposal);
  } catch (e) { return []; }
};

export const getProposalById = async (id: string) => {
  try {
    const s = await getDoc(doc(db, "proposals", id));
    return s.exists() ? s.data() as Proposal : null;
  } catch (e) { return null; }
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
    try { await setDoc(doc(db, "context", id), entry); } catch (e) {}
  }
  return id;
};

export const fetchContextEntries = async (limitCount: number = 50) => {
  try {
    const q = query(collection(db, "context"), orderBy("timestamp", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ContextEntry);
  } catch (e) { return []; }
};

export const deleteContextEntry = async (id: string) => {
  if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
    try { await deleteDoc(doc(db, "context", id)); } catch (e) {}
  }
};

// -- REAL-TIME LISTENERS & PROFILES --

// Updated: 'profiles' collection for Identity
export const getUserProfile = async (uid: string) => {
  try {
    const d = await getDoc(doc(db, "profiles", uid));
    return d.exists() ? d.data() as UserProfile : null;
  } catch (e: any) {
    console.warn("MIMI // Profile Read Blocked:", e.code);
    return null;
  }
};

export const saveUserProfile = async (p: UserProfile) => {
  try {
    await setDoc(doc(db, "profiles", p.uid), p, { merge: true });
  } catch (e: any) {
    console.warn("MIMI // Profile Write Blocked:", e.code);
  }
};

// Updated: 'userPreferences' collection for private data (drafts, personas, etc)
export const getUserPreferences = async (uid: string) => {
  try {
    const d = await getDoc(doc(db, "userPreferences", uid));
    return d.exists() ? d.data() as UserPreferences : null;
  } catch (e: any) {
    console.warn("MIMI // Prefs Read Blocked:", e.code);
    return null;
  }
};

export const saveUserPreferences = async (uid: string, p: UserPreferences) => {
  try {
    await setDoc(doc(db, "userPreferences", uid), p, { merge: true });
  } catch (e: any) {
    console.warn("MIMI // Prefs Write Blocked:", e.code);
  }
};

// REAL-TIME SUBSCRIPTIONS
export const subscribeToUserProfile = (uid: string, callback: (p: UserProfile | null) => void) => {
  return onSnapshot(doc(db, "profiles", uid), 
    (doc) => callback(doc.exists() ? doc.data() as UserProfile : null),
    (error) => console.warn("MIMI // Profile Sub Blocked:", error.code)
  );
};

export const subscribeToUserPreferences = (uid: string, callback: (p: UserPreferences | null) => void) => {
  return onSnapshot(doc(db, "userPreferences", uid), 
    (doc) => callback(doc.exists() ? doc.data() as UserPreferences : null),
    (error) => console.warn("MIMI // Prefs Sub Blocked:", error.code)
  );
};

// MIGRATION LOGIC
export const migrateLocalToCloud = async (uid: string, localProfile: UserProfile) => {
  if (!uid || !localProfile) return;
  
  // 1. Prepare Identity Data (Public/Shared)
  const profileData: Partial<UserProfile> = { ...localProfile, uid };
  delete profileData.tailorDraft;
  delete profileData.tasteProfile;
  delete profileData.starredZineIds;
  delete profileData.lastAuditReport;
  delete profileData.personas;
  delete profileData.activePersonaId;

  // 2. Prepare Preferences Data (Private)
  const preferencesData: UserPreferences = {
    tailorDraft: localProfile.tailorDraft,
    tasteProfile: localProfile.tasteProfile,
    starredZineIds: localProfile.starredZineIds,
    lastAuditReport: localProfile.lastAuditReport,
    personas: localProfile.personas,
    activePersonaId: localProfile.activePersonaId
  };

  // 3. Parallel Write
  try {
    await Promise.all([
      setDoc(doc(db, "profiles", uid), profileData, { merge: true }),
      setDoc(doc(db, "userPreferences", uid), preferencesData, { merge: true })
    ]);
  } catch (e: any) {
    console.warn("MIMI // Migration Partial/Blocked:", e.code);
  }
};

export const startGhostSession = () => signInAnonymously(auth);

// SAFER REDIRECT HANDLER
export const handleAuthRedirect = async () => {
  try {
    return await getRedirectResult(auth);
  } catch(e) {
    console.warn("MIMI // Redirect Result Error (Ignored):", e);
    return null;
  }
};

export const isHandleAvailable = async () => true; 
export const uploadBlob = async (b: any, p: string) => b;
