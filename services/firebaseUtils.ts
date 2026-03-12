// @ts-nocheck
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc, addDoc, updateDoc, arrayUnion, increment, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, linkWithPopup, linkWithRedirect, signInAnonymously, ActionCodeSettings } from "firebase/auth";
import { auth, db, storage } from "./firebaseInit";
import { ZineContent, ZineMetadata, ToneTag, PocketItem, UserProfile, DossierFolder, DossierArtifact, Treatment, UserPreferences, MediaFile, Proposal, ContextEntry } from "../types";
import { saveZineLocally, savePocketItemLocally, getLocalProfile, getLocalPocket, getLocalZines, deleteLocalPocketItem, saveFolderLocally, getLocalFolders, saveArtifactLocally, getLocalArtifacts } from "./localArchive";
import { syncToShadowMemory, deleteFromShadowMemory } from "./vectorSearch";
import { extractTasteVector } from "./geminiService";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const sanitizeFirestoreData = (data: any): any => {
  if (data === undefined) return null;
  if (data === null) return null;
  if (data instanceof Date) return data;
  if (Array.isArray(data)) return data.map(sanitizeFirestoreData);
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data[key] !== undefined) {
        sanitized[key] = sanitizeFirestoreData(data[key]);
      }
    }
    return sanitized;
  }
  return data;
};

export const isCaptiveInWebview = () => {
  if (typeof window === 'undefined' || !navigator) return false;
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const isSocial = /instagram|fb_iab|fban|fbav|tiktok|threads|wv|webview/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isSocial && !isStandalone;
};

export const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
  if (!searchTerm || searchTerm.length < 2) return [];
  const q = query(
    collection(db, "profiles"),
    where("handle", ">=", searchTerm.toLowerCase()),
    where("handle", "<=", searchTerm.toLowerCase() + "\uf8ff"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile);
};

export const createStack = async (uid: string, title: string, description: string) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return '';
  const id = `stack_${Date.now()}`;
  const stack: Stack = { id, userId: uid, title, description, fragmentIds: [], createdAt: Date.now() };
  await setDoc(doc(db, "stacks", id), stack);
  return id;
};

export const addFragmentToStack = async (stackId: string, fragmentId: string) => {
  await updateDoc(doc(db, "stacks", stackId), {
    fragmentIds: arrayUnion(fragmentId)
  });
  await updateDoc(doc(db, "dossier_artifacts", fragmentId), {
    stackIds: arrayUnion(stackId)
  });
};

export const getStacks = async (uid: string) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return [];
  const q = query(collection(db, "stacks"), where("userId", "==", uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Stack);
};


export const signInWithGoogleRedirect = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
  } catch (e: any) {
    console.error("Redirect failed:", e);
    throw e;
  }
};

export const anchorIdentity = async (forceRedirect = false): Promise<void> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  if (forceRedirect) {
    try {
      await signInWithRedirect(auth, provider);
    } catch (e: any) {
      console.error("MIMI // Redirect anchor failed:", e);
      throw e;
    }
    return;
  }

  // Popup-first — falls back to redirect if blocked
  try {
    await signInWithPopup(auth, provider);
  } catch (e: any) {
    if (
      e.code === 'auth/popup-blocked' ||
      e.code === 'auth/cancelled-popup-request' ||
      e.code === 'auth/popup-closed-by-user'
    ) {
      console.warn("MIMI // Popup obstructed — switching to redirect:", e.code);
      await signInWithRedirect(auth, provider);
    } else {
      console.error("MIMI // Popup anchor failed:", e);
      throw e;
    }
  }
};

export const linkIdentity = async (forceRedirect = false): Promise<void> => {
  if (!auth.currentUser) throw new Error("No active session to link.");
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  if (forceRedirect) {
    try {
      await linkWithRedirect(auth.currentUser, provider);
    } catch (e: any) {
      if (e.code === 'auth/credential-already-in-use') {
         throw new Error("This Google frequency is already occupied by another registry.");
      }
      console.error("Link redirect failed:", e);
      throw e;
    }
    return;
  }

  // Popup-first — falls back to redirect if blocked
  try {
    await linkWithPopup(auth.currentUser, provider);
  } catch (e: any) {
    if (
      e.code === 'auth/popup-blocked' ||
      e.code === 'auth/cancelled-popup-request' ||
      e.code === 'auth/popup-closed-by-user'
    ) {
      console.warn("MIMI // Popup obstructed — switching to redirect:", e.code);
      try {
        await linkWithRedirect(auth.currentUser, provider);
      } catch (redirectError: any) {
        if (redirectError.code === 'auth/credential-already-in-use') {
           throw new Error("This Google frequency is already occupied by another registry.");
        }
        throw redirectError;
      }
    } else {
      if (e.code === 'auth/credential-already-in-use') {
         throw new Error("This Google frequency is already occupied by another registry.");
      }
      console.error("Link popup failed:", e);
      throw e;
    }
  }
};

export const saveZineToProfile = async (uid: string, handle: string, avatar: string | undefined, zine: ZineContent, tone: ToneTag, coverUrl?: string, deep?: boolean, isPublic?: boolean, isLite?: boolean, artifacts?: MediaFile[], originalInput?: string, transmissionsUsed?: any[], isHighFidelity?: boolean): Promise<string> => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return '';
  const targetId = `zine_${uid}_${Date.now()}`;
  
  // Ensure we capture the original thought properly, falling back to metadata if arg is missing
  const rawInput = originalInput || zine.meta?.intent || "";

  const meta: ZineMetadata = {
    id: targetId, userId: uid, userHandle: handle, userAvatar: avatar || null,
    title: zine.title, tone, coverImageUrl: coverUrl || null, timestamp: Date.now(), likes: 0,
    content: zine, isDeepThinking: !!deep, isPublic: !!isPublic, isLite: !!isLite, isHighFidelity: !!isHighFidelity,
    artifacts: artifacts || [],
    originalInput: rawInput,
    transmissionsUsed: transmissionsUsed || []
  };
  
  await saveZineLocally(meta);
  if (uid && auth.currentUser && navigator.onLine) {
    try {
      await setDoc(doc(db, "zines", targetId), meta);
      syncToShadowMemory(meta);
      
      // Update taste graph with the generated zine content
      updateTasteGraph(uid, 'text', { content: `${zine.title} - ${zine.meta?.intent || ''} - ${zine.pages?.map(p => p.text).join(' ')}` });

      if (isPublic) {
        const transmission = {
          userId: uid,
          userHandle: handle,
          content: zine.title,
          imageUrl: coverUrl || (zine.pages && zine.pages[0]?.image_url) || '',
          timestamp: Date.now(),
          type: 'manifest',
          likes: 0,
          zineData: meta
        };
        const cleanTransmission = JSON.parse(JSON.stringify(transmission));
        await addDoc(collection(db, 'public_transmissions'), cleanTransmission);
      }
    } catch (e) { console.warn("MIMI // Zine Sync/Broadcast Skipped:", e.code); }
  }
  return targetId;
};

export const updateTasteGraph = async (uid: string, type: PocketItem['type'], content: any) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return;
  try {
    let textToAnalyze = '';
    let isImage = false;
    let mimeType = 'image/jpeg';

    if (type === 'image' && content.imageUrl) {
      textToAnalyze = content.imageUrl;
      isImage = true;
      if (content.imageUrl.startsWith('data:')) {
         const match = content.imageUrl.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
         if (match) {
            mimeType = match[1];
            textToAnalyze = match[2];
         } else {
            return; // Not a valid base64 image
         }
      } else {
         return; // Can't easily analyze external URLs without downloading
      }
    } else if (type === 'text' && content.content) {
      textToAnalyze = content.content;
    } else if (type === 'link' && content.url) {
      textToAnalyze = content.url + (content.title ? ` - ${content.title}` : '');
    } else {
      return; // Unsupported type for taste extraction
    }

    const newVector = await extractTasteVector(textToAnalyze, isImage, mimeType);
    if (!newVector || Object.keys(newVector).length === 0) return;

    // Fetch current profile
    const userRef = doc(db, "profiles", uid);
    const userSnap = await getDoc(userRef);
    const profile = userSnap.exists() ? userSnap.data() as UserProfile : {} as UserProfile;

    const currentVector = profile.tasteVector || {};
    const updatedVector = { ...currentVector };

    // Blend vectors with normalization
    // We use a weighted average approach to keep the sum around 1.0
    const learningRate = 0.2;
    const decayRate = 0.95;

    // 1. Apply decay to all existing tags
    for (const tag of Object.keys(updatedVector)) {
      updatedVector[tag] *= decayRate;
    }

    // 2. Blend in new intensities
    for (const [tag, intensity] of Object.entries(newVector)) {
       const currentVal = updatedVector[tag] || 0;
       updatedVector[tag] = (currentVal * (1 - learningRate)) + (intensity * learningRate);
    }

    // 3. Normalize so sum ≈ 1.0
    const sum = Object.values(updatedVector).reduce((a, b) => a + b, 0);
    if (sum > 0) {
       for (const tag of Object.keys(updatedVector)) {
          updatedVector[tag] = updatedVector[tag] / sum;
       }
    }

    await setDoc(userRef, { tasteVector: updatedVector }, { merge: true });
    console.info("MIMI // Taste Graph Updated");
  } catch (e) {
    console.warn("MIMI // Taste Graph Update Failed:", e);
  }
};

import { generateTags } from "./geminiService";

export const addToPocket = async (uid: string, type: PocketItem['type'], content: any): Promise<void> => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return;
  const itemId = `item_${Date.now()}`;
  
  // Generate tags automatically
  const tags = await generateTags(JSON.stringify(content));
  
  const item: PocketItem = { id: itemId, userId: uid, type, savedAt: Date.now(), content, notes: content.notes || "", tags };
  await savePocketItemLocally(item);
  if (uid && auth.currentUser && navigator.onLine) {
    try {
      await setDoc(doc(db, "pocket", itemId), sanitizeFirestoreData(item));
      syncToShadowMemory(item);
      // Asynchronously update the taste graph
      updateTasteGraph(uid, type, content);
    } catch (e) { console.warn("MIMI // Pocket Sync Skipped:", e.code); }
  }
  return itemId; // Returned ID for immediate reference
};

export const deleteFromPocket = async (itemId: string): Promise<void> => {
  await deleteLocalPocketItem(itemId);
  if (auth.currentUser && navigator.onLine) {
    try {
      await deleteDoc(doc(db, "pocket", itemId));
      deleteFromShadowMemory(itemId);
    } catch (e) { console.warn("MIMI // Pocket Del Skipped:", e.code); }
  }
};

export const createMoodboard = async (uid: string, name: string, itemIds: string[]): Promise<string> => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return '';
  const boardId = `moodboard_${Date.now()}`;
  const item: PocketItem = { 
    id: boardId, 
    userId: uid, 
    type: 'moodboard', 
    savedAt: Date.now(), 
    content: { name, itemIds } 
  };
  await savePocketItemLocally(item);
  if (uid && auth.currentUser && navigator.onLine) {
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
  if (auth.currentUser && navigator.onLine) {
    try {
      await updateDoc(doc(db, "pocket", itemId), patch);
    } catch (e) { console.warn("MIMI // Pocket Update Skipped:", e.code); }
  }
};

export const fetchPocketItems = async (uid: string) => {
    if (!uid || uid === 'ghost' || !auth.currentUser) return [];
    try {
      const q = query(collection(db, "pocket"), where("userId", "==", uid));
      const docs = (await getDocs(q)).docs.map(d => d.data() as PocketItem);
      return docs.sort((a, b) => b.savedAt - a.savedAt);
    } catch (e: any) { 
      console.warn("MIMI // Pocket Fetch Error:", e.code);
      return []; 
    }
};

export const subscribeToPocketItems = (uid: string, callback: (data: PocketItem[]) => void) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "pocket"), where("userId", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => d.data() as PocketItem);
    callback(docs.sort((a, b) => b.savedAt - a.savedAt));
  }, (e) => console.warn("MIMI // Pocket Sub Error:", e.code));
};

export const fetchUserZines = async (uid: string) => {
    if (!uid || uid === 'ghost' || !auth.currentUser) return [];
    try {
      const q = query(collection(db, "zines"), where("userId", "==", uid));
      const docs = (await getDocs(q)).docs.map(d => d.data() as ZineMetadata);
      return docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (e: any) { 
      console.warn("MIMI // Zine Fetch Error:", e.code);
      return []; 
    }
};

export const subscribeToUserZines = (uid: string, callback: (data: ZineMetadata[]) => void) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "zines"), where("userId", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => d.data() as ZineMetadata);
    callback(docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
  }, (e) => console.warn("MIMI // User Zine Sub Error:", e.code));
};

export const fetchCommunityZines = async (count: number) => {
    try {
      const q = query(collection(db, "zines"), where("isPublic", "==", true));
      const docs = (await getDocs(q)).docs.map(d => d.data() as ZineMetadata);
      return docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, count);
    } catch (e: any) {
      console.warn("MIMI // Community Fetch Error:", e.code);
      return [];
    }
};

export const subscribeToCommunityZines = (callback: (data: ZineMetadata[]) => void) => {
  const q = query(collection(db, "zines"), where("isPublic", "==", true));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => d.data() as ZineMetadata);
    callback(docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 30));
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
  const folder: DossierFolder = { id, userId: uid, name, createdAt: Date.now(), collaborators: [] };
  
  // Always save locally
  await saveFolderLocally(folder);
  
  if (uid && uid !== 'ghost' && auth.currentUser && navigator.onLine) {
    try { await setDoc(doc(db, "dossier_folders", id), folder); } catch (e) {}
  }
  return id;
};

export const absorbTransmission = async (uid: string, zineData: ZineMetadata): Promise<string> => {
  if (!uid || uid === 'ghost' || !auth.currentUser || !navigator.onLine) return '';
  
  try {
    // 1. Create a new Dossier Folder for the absorbed zine
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const folder: DossierFolder = { 
        id: folderId, 
        userId: uid, 
        name: `Absorbed: ${zineData.title}`, 
        createdAt: Date.now(), 
        collaborators: [],
        notes: `Absorbed from ${zineData.authorship || zineData.userHandle} on ${new Date().toLocaleDateString()}.\n\nOriginal Provocation: ${zineData.content.poetic_provocation || ''}`
    };
    await setDoc(doc(db, "dossier_folders", folderId), folder);

    // 2. Add the original input as a text artifact
    if (zineData.originalInput) {
        const textArtifactId = `art_${Date.now()}_text`;
        const textArtifact: DossierArtifact = {
            id: textArtifactId,
            userId: uid,
            folderId,
            type: 'text',
            title: 'Original Input',
            createdAt: Date.now(),
            elements: [{ id: `el_${Date.now()}`, type: 'text', content: zineData.originalInput, style: { zIndex: 1 } }]
        };
        await setDoc(doc(db, "dossier_artifacts", textArtifactId), textArtifact);
    }

    // 3. Add any media artifacts
    if (zineData.artifacts && zineData.artifacts.length > 0) {
        for (const media of zineData.artifacts) {
            const mediaArtifactId = `art_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const mediaArtifact: DossierArtifact = {
                id: mediaArtifactId,
                userId: uid,
                folderId,
                type: media.type,
                title: 'Absorbed Media',
                createdAt: Date.now(),
                elements: [{ id: `el_${Date.now()}`, type: media.type, content: media.url || media.data, style: { zIndex: 1 } }]
            };
            await setDoc(doc(db, "dossier_artifacts", mediaArtifactId), mediaArtifact);
        }
    }

    // 4. Add the generated zine content as a text artifact
    const contentArtifactId = `art_${Date.now()}_content`;
    const contentText = `
TITLE: ${zineData.content.title}
SUMMARY: ${zineData.content.vocal_summary_blurb || ''}
READING: ${zineData.content.the_reading || ''}
HYPOTHESIS: ${zineData.content.strategic_hypothesis || ''}
    `.trim();
    
    const contentArtifact: DossierArtifact = {
        id: contentArtifactId,
        userId: uid,
        folderId,
        type: 'text',
        title: 'Zine Manifest Content',
        createdAt: Date.now(),
        elements: [{ id: `el_${Date.now()}`, type: 'text', content: contentText, style: { zIndex: 1 } }]
    };
    await setDoc(doc(db, "dossier_artifacts", contentArtifactId), contentArtifact);

    return folderId;
  } catch (e) {
    console.error("Failed to absorb transmission:", e);
    return '';
  }
};

export const updateDossierFolder = async (folderId: string, patch: Partial<DossierFolder>) => {
  if (auth.currentUser && navigator.onLine) {
    try { await updateDoc(doc(db, "dossier_folders", folderId), patch); } catch (e) {}
  }
};

export const fetchDossierFolders = async (uid: string) => {
  const localFolders = await getLocalFolders();
  
  if (!uid || uid === 'ghost' || !auth.currentUser || !navigator.onLine) {
    return localFolders.sort((a, b) => b.createdAt - a.createdAt);
  }

  try {
    // We need to fetch folders where userId == uid OR collaborators array contains uid
    const q1 = query(collection(db, "dossier_folders"), where("userId", "==", uid));
    const q2 = query(collection(db, "dossier_folders"), where("collaborators", "array-contains", uid));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const foldersMap = new Map<string, DossierFolder>();
    // Add local folders first
    localFolders.forEach(f => foldersMap.set(f.id, f));
    // Overwrite with cloud folders
    snap1.docs.forEach(d => foldersMap.set(d.id, d.data() as DossierFolder));
    snap2.docs.forEach(d => foldersMap.set(d.id, d.data() as DossierFolder));
    
    return Array.from(foldersMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) { 
    console.error("MIMI // Dossier Fetch Error:", e);
    return localFolders.sort((a, b) => b.createdAt - a.createdAt); 
  }
};

export const createDossierArtifactFromImage = async (uid: string, folderId: string, title: string, imageUrl: string) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return '';
  const id = `artifact_${Date.now()}`;
  
  // Generate tags automatically
  const tags = await generateTags(`Image artifact: ${title}`);
  
  const artifact: DossierArtifact = {
    id, userId: uid, folderId, type: 'moodboard', title, createdAt: Date.now(),
    elements: [{ id: 'el_0', type: 'image', content: imageUrl }],
    tags, // Add tags
    status: 'active'
  };
  
  await saveArtifactLocally(artifact);
  
  if (uid && auth.currentUser && navigator.onLine) {
    try { 
      await setDoc(doc(db, "dossier_artifacts", id), artifact); 
      updateTasteGraph(uid, 'image', { imageUrl });
    } catch (e) {}
  }
  return id;
};

export const createDossierArtifactFromText = async (uid: string, folderId: string, title: string, text: string) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return '';
  const id = `artifact_${Date.now()}`;
  
  // Generate tags automatically
  const tags = await generateTags(`Text artifact: ${title} - ${text}`);
  
  const artifact: DossierArtifact = {
    id, userId: uid, folderId, type: 'brief', title, createdAt: Date.now(),
    elements: [{ id: 'el_0', type: 'text', content: text }],
    tags, // Add tags
    status: 'active'
  };
  
  await saveArtifactLocally(artifact);
  
  if (uid && auth.currentUser && navigator.onLine) {
    try { 
      await setDoc(doc(db, "dossier_artifacts", id), artifact); 
      updateTasteGraph(uid, 'text', { content: text });
    } catch (e) {}
  }
  return id;
};

export const fetchDossierArtifacts = async (folderId: string) => {
  const localArtifacts = await getLocalArtifacts(folderId);
  
  if (!auth.currentUser || !navigator.onLine) {
    return localArtifacts.sort((a, b) => b.createdAt - a.createdAt);
  }

  try {
    const q = query(collection(db, "dossier_artifacts"), where("folderId", "==", folderId));
    const snap = await getDocs(q);
    const cloudArtifacts = snap.docs.map(d => d.data() as DossierArtifact);
    
    const artifactsMap = new Map<string, DossierArtifact>();
    localArtifacts.forEach(a => artifactsMap.set(a.id, a));
    cloudArtifacts.forEach(a => artifactsMap.set(a.id, a));
    
    return Array.from(artifactsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) { 
    console.error("MIMI // Artifact Fetch Error:", e);
    return localArtifacts.sort((a, b) => b.createdAt - a.createdAt);
  }
};

// -- PROPOSAL SYSTEM CRUD -- //

export const saveProposal = async (proposal: Proposal): Promise<void> => {
  if (auth.currentUser && navigator.onLine) {
    try { await setDoc(doc(db, "proposals", proposal.id), proposal); } catch (e) {}
  }
};

export const fetchUserProposals = async (uid: string) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return [];
  try {
    const q = query(collection(db, "proposals"), where("userId", "==", uid));
    const docs = (await getDocs(q)).docs.map(d => d.data() as Proposal);
    return docs.sort((a, b) => b.updatedAt - a.updatedAt);
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
  if (!uid || uid === 'ghost' || !auth.currentUser || !text) throw new Error("Invalid Context Input");
  const id = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const entry: ContextEntry = {
    id,
    userId: uid,
    text,
    type,
    timestamp: Date.now()
  };
  
  if (navigator.onLine && auth.currentUser) {
    try { await setDoc(doc(db, "context", id), entry); } catch (e) {}
  }
  return id;
};

export const fetchContextEntries = async (limitCount: number = 50) => {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, "context"), 
      where("userId", "==", auth.currentUser.uid),
      orderBy("timestamp", "desc"), 
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ContextEntry);
  } catch (e) { return []; }
};

export const deleteContextEntry = async (id: string) => {
  if (auth.currentUser && navigator.onLine) {
    try { await deleteDoc(doc(db, "context", id)); } catch (e) {}
  }
};

// -- REAL-TIME LISTENERS & PROFILES --

// Updated: 'profiles' collection for Identity
export const getUserProfile = async (uid: string) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return null;
  try {
    const d = await getDoc(doc(db, "profiles", uid));
    return d.exists() ? d.data() as UserProfile : null;
  } catch (e: any) {
    console.warn("MIMI // Profile Read Blocked:", e.code);
    return null;
  }
};

export const saveUserProfile = async (p: UserProfile) => {
  if (!p.uid || p.uid === 'ghost' || !auth.currentUser) return;
  try {
    await setDoc(doc(db, "profiles", p.uid), sanitizeFirestoreData(p), { merge: true });
  } catch (e: any) {
    console.warn("MIMI // Profile Write Blocked:", e.code);
  }
};

// Updated: 'userPreferences' collection for private data (drafts, personas, etc)
export const getUserPreferences = async (uid: string) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return null;
  try {
    const d = await getDoc(doc(db, "userPreferences", uid));
    return d.exists() ? d.data() as UserPreferences : null;
  } catch (e: any) {
    console.warn("MIMI // Prefs Read Blocked:", e.code);
    return null;
  }
};

export const saveUserPreferences = async (uid: string, p: UserPreferences) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) return;
  try {
    await setDoc(doc(db, "userPreferences", uid), sanitizeFirestoreData(p), { merge: true });
  } catch (e: any) {
    console.warn("MIMI // Prefs Write Blocked:", e.code);
  }
};

// REAL-TIME SUBSCRIPTIONS
export const subscribeToUserProfile = (uid: string, callback: (p: UserProfile | null) => void) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, "profiles", uid), 
    (doc) => callback(doc.exists() ? doc.data() as UserProfile : null),
    (error) => console.warn("MIMI // Profile Sub Blocked:", error.code)
  );
};

export const subscribeToUserPreferences = (uid: string, callback: (p: UserPreferences | null) => void) => {
  if (!uid || uid === 'ghost' || !auth.currentUser) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, "userPreferences", uid), 
    (doc) => callback(doc.exists() ? doc.data() as UserPreferences : null),
    (error) => console.warn("MIMI // Prefs Sub Blocked:", error.code)
  );
};

// MIGRATION LOGIC
export const migrateLocalToCloud = async (uid: string, localProfile: UserProfile) => {
  if (!uid || uid === 'ghost' || !auth.currentUser || !localProfile) return;
  
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
      setDoc(doc(db, "profiles", uid), sanitizeFirestoreData(profileData), { merge: true }),
      setDoc(doc(db, "userPreferences", uid), sanitizeFirestoreData(preferencesData), { merge: true })
    ]);
  } catch (e: any) {
    console.warn("MIMI // Migration Partial/Blocked:", e.code);
  }
};

export const startGhostSession = () => signInAnonymously(auth);

// SAFER REDIRECT HANDLER
export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.info("MIMI // Redirect Handshake Successful:", result.user.email);
    }
    return result;
  } catch(e: any) {
    console.warn("MIMI // Redirect Handshake Error:", e.code, e.message);
    // Notify the user via a global event
    if (e.code === 'auth/credential-already-in-use') {
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: "This Google frequency is already occupied by another registry.", type: 'error' } 
        }));
    } else {
        window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
            detail: { message: `Identity Anchor Failed: ${e.message}`, type: 'error' } 
        }));
    }
    return null;
  }
};

export const isHandleAvailable = async (handle: string, excludeUid?: string): Promise<boolean> => {
  if (!handle || handle.length < 2) return false;
  const q = query(collection(db, "profiles"), where("handle", "==", handle.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return true;
  if (excludeUid && snap.docs.length === 1 && snap.docs[0].data().uid === excludeUid) return true;
  return false;
};

export const getUserByHandle = async (handle: string): Promise<UserProfile | null> => {
  const q = query(collection(db, "profiles"), where("handle", "==", handle.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};

export const uploadBlob = async (blob: Blob, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};
