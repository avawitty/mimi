// @ts-nocheck
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc, addDoc, updateDoc, arrayUnion, increment, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, linkWithPopup, linkWithRedirect, signInAnonymously, ActionCodeSettings, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth, db, storage, isFullyAuthenticated } from "./firebase";
import { ZineContent, ZineMetadata, ToneTag, PocketItem, UserProfile, DossierFolder, DossierArtifact, Treatment, UserPreferences, MediaFile, Proposal, ContextEntry, LineageEntry } from "../types";
import { saveZineLocally, savePocketItemLocally, getLocalProfile, getLocalPocket, getLocalZines, deleteLocalPocketItem, saveFolderLocally, getLocalFolders, saveArtifactLocally, getLocalArtifacts } from "./localArchive";
import { syncToShadowMemory, deleteFromShadowMemory } from "./vectorSearch";
import { StrategyAudit, Task } from "../types";

export const saveStrategyAudit = async (userId: string, audit: StrategyAudit): Promise<void> => {
  if (!isFullyAuthenticated()) {
    console.warn("MIMI // Cannot save strategy audit: User not fully authenticated. Saving to local storage only.");
    const localAudits = JSON.parse(localStorage.getItem(`mimi_audits_${userId}`) || '[]');
    localAudits.push(audit);
    localStorage.setItem(`mimi_audits_${userId}`, JSON.stringify(localAudits));
    return;
  }
  try {
    const auditRef = doc(db, `users/${userId}/reads`, audit.id);
    await setDoc(auditRef, audit);
    console.log("MIMI // Strategy audit saved to Firebase.");
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/reads/${audit.id}`);
  }
};

export const fetchStrategyAudits = async (userId: string): Promise<StrategyAudit[]> => {
  if (!isFullyAuthenticated()) {
    return JSON.parse(localStorage.getItem(`mimi_audits_${userId}`) || '[]');
  }
  try {
    const q = query(collection(db, `users/${userId}/reads`), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StrategyAudit);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/reads`);
    return [];
  }
};

export const saveTask = async (userId: string, task: Task): Promise<void> => {
  if (!isFullyAuthenticated()) {
    console.warn("MIMI // Cannot save task: User not fully authenticated. Saving to local storage only.");
    const localTasks = JSON.parse(localStorage.getItem(`mimi_tasks_${userId}`) || '[]');
    localTasks.push(task);
    localStorage.setItem(`mimi_tasks_${userId}`, JSON.stringify(localTasks));
    return;
  }
  try {
    const taskRef = doc(db, `users/${userId}/tasks`, task.id);
    await setDoc(taskRef, task);
    console.log("MIMI // Task saved to Firebase.");
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/tasks/${task.id}`);
  }
};

export const fetchTasks = async (userId: string): Promise<Task[]> => {
  if (!isFullyAuthenticated()) {
    return JSON.parse(localStorage.getItem(`mimi_tasks_${userId}`) || '[]');
  }
  try {
    const q = query(collection(db, `users/${userId}/tasks`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Task);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/tasks`);
    return [];
  }
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>): Promise<void> => {
  if (!isFullyAuthenticated()) {
    const localTasks = JSON.parse(localStorage.getItem(`mimi_tasks_${userId}`) || '[]');
    const updatedTasks = localTasks.map((t: Task) => t.id === taskId ? { ...t, ...updates } : t);
    localStorage.setItem(`mimi_tasks_${userId}`, JSON.stringify(updatedTasks));
    return;
  }
  try {
    const taskRef = doc(db, `users/${userId}/tasks`, taskId);
    await updateDoc(taskRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/tasks/${taskId}`);
  }
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  if (!isFullyAuthenticated()) {
    const localTasks = JSON.parse(localStorage.getItem(`mimi_tasks_${userId}`) || '[]');
    const updatedTasks = localTasks.filter((t: Task) => t.id !== taskId);
    localStorage.setItem(`mimi_tasks_${userId}`, JSON.stringify(updatedTasks));
    return;
  }
  try {
    const taskRef = doc(db, `users/${userId}/tasks`, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/tasks/${taskId}`);
  }
};

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
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for database not found or offline errors
  if (errorMessage.includes('not-found') && errorMessage.includes('Database') || errorMessage.includes('does not exist in project')) {
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', {
      detail: {
        type: 'error',
        message: 'Database connection failed. Please check your Firebase configuration or project ID. Falling back to local cache where possible.'
      }
    }));
  } else if (errorMessage.includes('offline') || errorMessage.includes('Failed to get document because the client is offline')) {
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', {
      detail: {
        type: 'error',
        message: 'Network disconnected. Operating in offline mode.'
      }
    }));
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
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

export function logFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`MIMI // Firestore Error: [${operationType}] at ${path}:`, errorMessage);

  // Check for database not found or offline errors
  if (errorMessage.includes('not-found') && errorMessage.includes('Database') || errorMessage.includes('does not exist in project')) {
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', {
      detail: {
        type: 'error',
        message: 'Database connection failed. Please check your Firebase configuration or project ID. Falling back to local cache where possible.'
      }
    }));
  } else if (errorMessage.includes('offline') || errorMessage.includes('Failed to get document because the client is offline')) {
    window.dispatchEvent(new CustomEvent('mimi:registry_alert', {
      detail: {
        type: 'error',
        message: 'Network disconnected. Operating in offline mode.'
      }
    }));
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
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
}

export const sanitizeFirestoreData = (data: any): any => {
  if (data === undefined) return null;
  if (data === null) return null;
  if (data instanceof Date) return data;
  if (typeof data === 'function') return null; // Strip functions
  if (Array.isArray(data)) return data.map(sanitizeFirestoreData);
  if (typeof data === 'object') {
    // Check if it's a plain object or a custom class instance
    if (Object.getPrototypeOf(data) !== Object.prototype && Object.getPrototypeOf(data) !== null) {
        // If it's a custom class, try to convert it to a plain object or stringify it
        try {
            return JSON.parse(JSON.stringify(data));
        } catch (e) {
            return null; // Fallback if it can't be stringified
        }
    }

    const sanitized: any = {};
    for (const key in data) {
      if (data[key] !== undefined && typeof data[key] !== 'function') {
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

export const fetchAllPublicProfiles = async (): Promise<UserProfile[]> => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    const q = query(collection(db, "profiles_public"), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, "profiles_public");
    return [];
  }
};

export const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
  if (!searchTerm || searchTerm.length < 2) return [];
  const q = query(
    collection(db, "profiles_public"),
    where("handle", ">=", searchTerm.toLowerCase()),
    where("handle", "<=", searchTerm.toLowerCase() + "\uf8ff"),
    limit(10)
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, "profiles");
    return [];
  }
};

export const createStack = async (uid: string, title: string, description: string) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return '';
  const id = `stack_${Date.now()}`;
  const stack: Stack = { id, userId: uid, title, description, fragmentIds: [], createdAt: Date.now() };
  await setDoc(doc(db, "stacks", id), sanitizeFirestoreData(stack));
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
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return [];
  const q = query(collection(db, "stacks"), where("userId", "==", uid));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Stack);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, "stacks");
    return [];
  }
};


import { createUserWithEmailAndPassword } from "firebase/auth";
import { writeBatch, doc } from "firebase/firestore";

export const sendEmailLink = async (email: string, actionCodeSettings: ActionCodeSettings) => {
  return await sendSignInLinkToEmail(auth, email, actionCodeSettings);
};

export const checkAndSignInWithEmailLink = async (email: string, url: string) => {
  if (isSignInWithEmailLink(auth, url)) {
    return await signInWithEmailLink(auth, email, url);
  }
  return null;
};

export const signUpWithEmail = async (email: string, password: string, handle: string) => {
  try {
    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. Prepare the batch to create both profile documents
    const batch = writeBatch(db);

    const publicProfileRef = doc(db, "profiles_public", uid);
    const privateProfileRef = doc(db, "profiles_private", uid);

    batch.set(publicProfileRef, {
      handle: handle,
      bio: "",
      photoURL: "",
      createdAt: Date.now()
    });

    batch.set(privateProfileRef, {
      email: email,
      createdAt: Date.now()
    });

    // 3. Commit the batch
    await batch.commit();
    
    return uid;
  } catch (error) {
    console.error("MIMI // Sign Up Failed:", error);
    throw error;
  }
};

export const anchorIdentity = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  try {
    await signInWithPopup(auth, provider);
  } catch (e: any) {
    if (
      e.code === 'auth/popup-blocked' ||
      e.code === 'auth/cancelled-popup-request' ||
      e.code === 'auth/popup-closed-by-user' ||
      e.code === 'auth/internal-error'
    ) {
      alert("Popup blocked. Please allow popups for this site to sign in.");
    } else {
      console.error("MIMI // Popup anchor failed:", e);
      throw e;
    }
  }
};

export const linkIdentity = async (): Promise<void> => {
  if (!auth.currentUser) throw new Error("No active session to link.");
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  try {
    await linkWithPopup(auth.currentUser, provider);
  } catch (e: any) {
    if (e.code === 'auth/credential-already-in-use') {
       throw new Error("This Google frequency is already occupied by another registry.");
    }
    if (
      e.code === 'auth/popup-blocked' ||
      e.code === 'auth/cancelled-popup-request' ||
      e.code === 'auth/popup-closed-by-user' ||
      e.code === 'auth/internal-error'
    ) {
      alert("Popup blocked. Please allow popups for this site to link your account.");
    } else {
      console.error("Link popup failed:", e);
      throw e;
    }
  }
};

import { generateAndStoreZineEmbedding } from "./zineEmbeddingService";

export const saveZineToProfile = async (uid: string, handle: string, avatar: string | undefined, zine: ZineContent, tone: ToneTag, coverUrl?: string, deep?: boolean, isPublic?: boolean, isLite?: boolean, artifacts?: MediaFile[], originalInput?: string, transmissionsUsed?: any[], isHighFidelity?: boolean, tags?: string[], treatmentId?: string): Promise<string> => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return '';
  const targetId = `zine_${uid}_${Date.now()}`;
  
  // Ensure we capture the original thought properly, falling back to metadata if arg is missing
  const rawInput = originalInput || zine.meta?.intent || "";

  // 1. Separate threadData
  const pagesWithoutThreadData = (zine.pages || []).map(page => ({ ...page, threadData: undefined }));
  const threadDataMap = new Map<number, any>();
  (zine.pages || []).forEach(page => {
    if (page.threadData) {
      threadDataMap.set(page.pageNumber, page.threadData);
    }
  });

  const zineWithoutThreadData: ZineContent = { ...zine, pages: [], pagesJson: JSON.stringify(pagesWithoutThreadData) };

  const meta: ZineMetadata = {
    id: targetId, userId: uid, userHandle: handle, userAvatar: avatar || null,
    title: zine.title, tone, coverImageUrl: coverUrl || null, timestamp: Date.now(), likes: 0,
    content: zineWithoutThreadData, isDeepThinking: !!deep, isPublic: !!isPublic, isLite: !!isLite, isHighFidelity: !!isHighFidelity,
    artifacts: [],
    fragmentsUsed: [],
    originalInput: rawInput,
    transmissionsUsed: (transmissionsUsed || []).map(t => ({ 
      id: t.id || '', 
      type: t.type || '', 
      content: typeof t.content === 'string' ? t.content.substring(0, 100) : '', 
      userId: t.userId || '' 
    })),
    treatmentId,
    tags: tags && tags.length > 0 ? tags : await generateTagsFromMedia(JSON.stringify(zine), artifacts || [])
  };
  
  console.info("MIMI // saveZineToProfile: Starting zine save for:", uid);
  await saveZineLocally(meta);
  if (uid && auth.currentUser && navigator.onLine) {
    try {
      console.info("MIMI // saveZineToProfile: Saving zine to Firestore...");
      
      // 2. Save Zine without threadData and artifacts
      await setDoc(doc(db, "zines", targetId), sanitizeFirestoreData(meta));
      
      // 3. Save threadData in subcollection
      for (const [pageNumber, threadData] of threadDataMap) {
        await setDoc(doc(db, "zines", targetId, "pages", pageNumber.toString()), { threadData: sanitizeFirestoreData(threadData) });
      }

      // 4. Save artifacts in subcollection
      if (artifacts && artifacts.length > 0) {
        const { uploadBase64Image } = await import('./firebaseUtils');
        for (const artifact of artifacts) {
          let artifactToSave = { ...artifact };
          if (artifactToSave.data && artifactToSave.data.length > 100000) { // If base64 is large
              try {
                  const path = `zine_artifacts/${targetId}_${artifact.id || Date.now()}.jpg`;
                  const url = await uploadBase64Image(artifactToSave.data, path);
                  artifactToSave.url = url;
                  artifactToSave.data = ''; // Clear base64 to save space
              } catch (e) {
                  console.warn("Failed to upload artifact to storage", e);
              }
          }
          // Remove File object before saving
          if (artifactToSave.file) {
              delete artifactToSave.file;
          }
          await setDoc(doc(db, "zines", targetId, "artifacts", artifact.id || Date.now().toString()), sanitizeFirestoreData(artifactToSave));
        }
      }
      
      syncToShadowMemory(meta);
      invalidateZineCache();
      
      // Generate and store embedding
      generateAndStoreZineEmbedding(meta);
      
      // Save Lineage Entry
      await saveLineageEntry({
        artifact_id: targetId,
        userId: uid,
        thought_signature: await generateProfoundSignature(rawInput),
        fragment_ids: artifacts?.map(a => a.id) || [],
        archetype_weights: zine.archetype_weights || { Architect: 0.25, Dreamer: 0.25, Archivist: 0.25, Catalyst: 0.25 },
        synthesis_notes: zine.meta?.intent || 'Zine created.',
        timestamp: Date.now()
      });
      
      // Update taste graph with the generated zine content
      console.info("MIMI // saveZineToProfile: Calling updateTasteGraph...");
      updateTasteGraph(uid, 'text', { content: `${zine.title} - ${zine.meta?.intent || ''} - ${zine.pages?.map(p => p.bodyCopy).join(' ')}` });

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
    } catch (e: any) { 
      handleFirestoreError(e, OperationType.WRITE, "zines");
    }
  }
  return targetId;
};

export const updateTasteGraph = async (uid: string, type: PocketItem['type'], content: any) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return;
  try {
    console.info("MIMI // Taste Graph Update Started for:", uid, "Type:", type);
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
            console.warn("MIMI // Taste Graph: Invalid base64 image");
            return; // Not a valid base64 image
         }
      } else {
         console.warn("MIMI // Taste Graph: External URL not supported");
         return; // Can't easily analyze external URLs without downloading
      }
    } else if (type === 'text' && content.content) {
      textToAnalyze = content.content;
    } else if (type === 'link' && content.url) {
      textToAnalyze = content.url + (content.title ? ` - ${content.title}` : '');
    } else {
      console.warn("MIMI // Taste Graph: Unsupported type", type);
      return; // Unsupported type for taste extraction
    }

    console.info("MIMI // Taste Graph: Analyzing content:", textToAnalyze.substring(0, 50));
    const newVector = await extractTasteVector(textToAnalyze, isImage, mimeType);
    console.info("MIMI // Taste Graph: New Vector Extracted:", newVector);
    if (!newVector || Object.keys(newVector).length === 0) {
        console.warn("MIMI // Taste Graph: No tags extracted");
        return;
    }

    // Fetch current profile
    const userRef = doc(db, "profiles_public", uid);
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

    console.info("MIMI // Taste Graph: Updating Firestore with:", updatedVector);
    await setDoc(userRef, { tasteVector: updatedVector }, { merge: true });
    console.info("MIMI // Taste Graph Updated");
  } catch (e) {
    console.warn("MIMI // Taste Graph Update Failed:", e);
  }
};


export const addToPocket = async (uid: string, type: PocketItem['type'], content: any, embedding?: number[], deltaVerdict?: any): Promise<string | undefined> => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return;
  const itemId = `item_${Date.now()}`;
  
  // Generate tags automatically
  const tags = await generateTagsFromMedia(JSON.stringify(content), content.media || []);
  
  const item: PocketItem = { id: itemId, userId: uid, type, savedAt: Date.now(), content, notes: content.notes || "", tags, embedding, deltaVerdict };
  await savePocketItemLocally(item);
  if (uid && auth.currentUser && navigator.onLine) {
    try {
      await setDoc(doc(db, "pocket", itemId), sanitizeFirestoreData(item));
      syncToShadowMemory(item);
      // Asynchronously update the taste graph
      updateTasteGraph(uid, type, content);
      invalidatePocketCache();
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
      invalidatePocketCache();
    } catch (e) { console.warn("MIMI // Pocket Del Skipped:", e.code); }
  }
};

export const createMoodboard = async (uid: string, name: string, itemIds: string[]): Promise<string> => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return '';
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
      await setDoc(doc(db, "pocket", boardId), sanitizeFirestoreData(item));
      syncToShadowMemory(item);
      invalidatePocketCache();
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
  if (isFullyAuthenticated() && navigator.onLine) {
    try {
      await updateDoc(doc(db, "pocket", itemId), patch);
      invalidatePocketCache();
    } catch (e) { console.warn("MIMI // Pocket Update Skipped:", e.code); }
  }
};

let pocketCache: { [uid: string]: { data: PocketItem[], timestamp: number } } = {};
let zineCache: { [uid: string]: { data: ZineMetadata[], timestamp: number } } = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const invalidatePocketCache = () => { pocketCache = {}; };
export const invalidateZineCache = () => { zineCache = {}; };

export const fetchPocketItems = async (uid: string, forceRefresh = false) => {
    if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return [];
    
    if (!forceRefresh && pocketCache[uid] && (Date.now() - pocketCache[uid].timestamp < CACHE_TTL)) {
        return pocketCache[uid].data;
    }

    try {
      const q = query(collection(db, "pocket"), where("userId", "==", uid));
      const docs = (await getDocs(q)).docs.map(d => d.data() as PocketItem);
      const sorted = docs.sort((a, b) => b.savedAt - a.savedAt);
      pocketCache[uid] = { data: sorted, timestamp: Date.now() };
      return sorted;
    } catch (e: any) { 
      console.warn("MIMI // Pocket Fetch Error:", e);
      return []; 
    }
};

export const subscribeToPocketItems = (uid: string, callback: (data: PocketItem[]) => void) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "pocket"), where("userId", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => d.data() as PocketItem);
    const sorted = docs.sort((a, b) => b.savedAt - a.savedAt);
    pocketCache[uid] = { data: sorted, timestamp: Date.now() }; // Update cache on snapshot
    callback(sorted);
  }, (e) => logFirestoreError(e, OperationType.LIST, "pocket"));
};

export const fetchUserZines = async (uid: string, forceRefresh = false) => {
    if (!uid) return [];
    
    if (uid === 'ghost' || !isFullyAuthenticated()) {
        return getLocalZines();
    }
    
    if (!forceRefresh && zineCache[uid] && (Date.now() - zineCache[uid].timestamp < CACHE_TTL)) {
        return zineCache[uid].data;
    }

    try {
      let q;
      console.info("MIMI // fetchUserZines: uid:", uid, "auth.currentUser.uid:", auth.currentUser?.uid);
      if (auth.currentUser && uid === auth.currentUser.uid) {
        q = query(collection(db, "zines"), where("userId", "==", uid));
      } else {
        q = query(collection(db, "zines"), where("userId", "==", uid), where("isPublic", "==", true));
      }
      console.info("MIMI // fetchUserZines: Querying zines for:", uid);
      const querySnapshot = await getDocs(q);
      console.info("MIMI // fetchUserZines: Found zines count:", querySnapshot.size);
      const docs = querySnapshot.docs.map(d => d.data() as ZineMetadata);
      const sorted = docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      zineCache[uid] = { data: sorted, timestamp: Date.now() };
      return sorted;
    } catch (e: any) { 
      console.error("MIMI // Zine Fetch Error:", e);
      return []; 
    }
};

export const subscribeToUserZines = (uid: string, callback: (data: ZineMetadata[]) => void) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) {
    callback([]);
    return () => {};
  }
  let q;
  if (uid === auth.currentUser.uid) {
    q = query(collection(db, "zines"), where("userId", "==", uid));
  } else {
    q = query(collection(db, "zines"), where("userId", "==", uid), where("isPublic", "==", true));
  }
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => d.data() as ZineMetadata);
    const sorted = docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    zineCache[uid] = { data: sorted, timestamp: Date.now() }; // Update cache on snapshot
    callback(sorted);
  }, (e) => logFirestoreError(e, OperationType.LIST, "zines"));
};

export const fetchCommunityZines = async (count: number) => {
    if (!auth.currentUser) return [];
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
  if (!auth.currentUser) return () => {};
  const q = query(collection(db, "zines"), where("isPublic", "==", true));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => d.data() as ZineMetadata);
    callback(docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 30));
  }, (e) => logFirestoreError(e, OperationType.LIST, "zines"));
};

export const updateZineMetadata = async (metadata: ZineMetadata): Promise<void> => {
  if (!auth.currentUser) {
    console.error("MIMI // updateZineMetadata: No current user");
    return;
  }
  if (!metadata.userId) {
    console.error("MIMI // updateZineMetadata: metadata.userId is missing");
    throw new Error("MIMI // updateZineMetadata: metadata.userId is missing");
  }
  try {
    console.info("MIMI // updateZineMetadata: Attempting update for zine:", metadata.id, "User:", auth.currentUser.uid, "ZineOwner:", metadata.userId);
    const { setDoc, doc } = await import('firebase/firestore');
    
    // 1. Separate threadData and artifacts
    const threadDataMap = new Map<number, any>();
    const pagesWithoutThreadData = (metadata.content.pages || []).map(page => {
        const pageCopy = { ...page };
        if (pageCopy.threadData) {
            threadDataMap.set(pageCopy.pageNumber, pageCopy.threadData);
            pageCopy.threadData = undefined; // Remove from main doc
        }
        return pageCopy;
    });
    
    const artifacts = metadata.artifacts;
    
    // Create a sanitized copy of metadata for Firestore
    const firestoreMetadata: ZineMetadata = {
        ...metadata,
        artifacts: [], // Remove from main doc
        transmissionsUsed: (metadata.transmissionsUsed || []).map(t => ({ 
            id: t.id || '', 
            type: t.type || '', 
            content: typeof t.content === 'string' ? t.content.substring(0, 100) : '', 
            userId: t.userId || '' 
        })),
        content: {
            ...metadata.content,
            pages: [],
            pagesJson: JSON.stringify(pagesWithoutThreadData)
        }
    };

    // 2. Save Zine without threadData and artifacts
    console.info("MIMI // updateZineMetadata: Calling setDoc for:", metadata.id);
    await setDoc(doc(db, "zines", metadata.id), sanitizeFirestoreData(firestoreMetadata));
    console.info("MIMI // updateZineMetadata: setDoc successful");
    
    // 3. Save threadData in subcollection
    for (const [pageNumber, threadData] of threadDataMap) {
        await setDoc(doc(db, "zines", metadata.id, "pages", pageNumber.toString()), { threadData: sanitizeFirestoreData(threadData) });
    }

    // 4. Save artifacts in subcollection
    if (artifacts && artifacts.length > 0) {
        for (const artifact of artifacts) {
            await setDoc(doc(db, "zines", metadata.id, "artifacts", artifact.id), sanitizeFirestoreData(artifact));
        }
    }

    await saveZineLocally(metadata);
    syncToShadowMemory(metadata);
    invalidateZineCache();
    console.info("MIMI // updateZineMetadata: Update complete");
  } catch (e) {
    console.error("MIMI // updateZineMetadata: Failed to update zine metadata", e);
    throw e; // Rethrow to be caught by caller if needed
  }
};

export const fetchZineById = async (id: string) => {
    try {
      const zineDoc = await getDoc(doc(db, "zines", id));
      if (!zineDoc.exists()) return null;
      
      const zine = zineDoc.data() as ZineMetadata;
      
      // Reconstruct pages from pagesJson
      if (zine.content.pagesJson) {
        zine.content.pages = JSON.parse(zine.content.pagesJson);
      }
      
      // Fetch threadData from pages subcollection
      const pagesSnap = await getDocs(collection(db, "zines", id, "pages"));
      
      pagesSnap.forEach((pageDoc) => {
        const pageNumber = parseInt(pageDoc.id);
        const threadData = pageDoc.data().threadData;
        
        if (zine.content.pages) {
            const page = zine.content.pages.find(p => p.pageNumber === pageNumber);
            if (page) {
                page.threadData = threadData;
            }
        }
      });

      // Fetch artifacts from artifacts subcollection
      const artifactsSnap = await getDocs(collection(db, "zines", id, "artifacts"));
      zine.artifacts = artifactsSnap.docs.map(doc => doc.data() as MediaFile);
      
      return zine;
    } catch (e) { return null; }
};

export const createDossierFolder = async (uid: string, name: string): Promise<string> => {
  const id = `folder_${Date.now()}`;
  const folder: DossierFolder = { id, userId: uid, name, createdAt: Date.now(), collaborators: [] };
  
  // Always save locally
  await saveFolderLocally(folder);
  
  if (uid && uid !== 'ghost' && isFullyAuthenticated() && navigator.onLine) {
    try { await setDoc(doc(db, "dossier_folders", id), sanitizeFirestoreData(folder)); } catch (e) {}
  }
  return id;
};

export const saveNarrativeThread = async (thread: NarrativeThread): Promise<void> => {
  if (!thread.userId || thread.userId === 'ghost' || !auth.currentUser) return;
  await setDoc(doc(db, "narrative_threads", thread.id), sanitizeFirestoreData(thread));
};

export const fetchNarrativeThreads = async (userId: string): Promise<NarrativeThread[]> => {
  if (!userId || userId === 'ghost' || !auth.currentUser) return [];
  const q = query(collection(db, "narrative_threads"), where("userId", "==", userId), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as NarrativeThread);
};

export const absorbTransmission = async (uid: string, zineData: ZineMetadata): Promise<string> => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated() || !navigator.onLine) return '';
  
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
    await setDoc(doc(db, "dossier_folders", folderId), sanitizeFirestoreData(folder));

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
        await setDoc(doc(db, "dossier_artifacts", textArtifactId), sanitizeFirestoreData(textArtifact));
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
            await setDoc(doc(db, "dossier_artifacts", mediaArtifactId), sanitizeFirestoreData(mediaArtifact));
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
    await setDoc(doc(db, "dossier_artifacts", contentArtifactId), sanitizeFirestoreData(contentArtifact));

    return folderId;
  } catch (e) {
    console.error("Failed to absorb transmission:", e);
    return '';
  }
};

export const updateDossierFolder = async (folderId: string, patch: Partial<DossierFolder>) => {
  if (isFullyAuthenticated() && navigator.onLine) {
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
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return '';
  const id = `artifact_${Date.now()}`;
  
  // Generate tags automatically
  const tags = await generateTagsFromMedia(`Image artifact: ${title}`);
  
  const artifact: DossierArtifact = {
    id, userId: uid, folderId, type: 'moodboard', title, createdAt: Date.now(),
    elements: [{ id: 'el_0', type: 'image', content: imageUrl }],
    tags, // Add tags
    status: 'active'
  };
  
  await saveArtifactLocally(artifact);
  
  if (uid && auth.currentUser && navigator.onLine) {
    try { 
      await setDoc(doc(db, "dossier_artifacts", id), sanitizeFirestoreData(artifact)); 
      updateTasteGraph(uid, 'image', { imageUrl });
    } catch (e) {}
  }
  return id;
};

export const createDossierArtifactFromStrategy = async (uid: string, folderId: string, audit: StrategyAudit) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return '';
  const id = `artifact_${Date.now()}`;
  
  const title = `${audit.platform} Strategy Audit`;
  const content = JSON.stringify(audit.read, null, 2);
  
  const artifact: DossierArtifact = {
    id, userId: uid, folderId, type: 'strategy', title, createdAt: Date.now(),
    elements: [{ id: 'el_0', type: 'text', content }],
    tags: [audit.platform.toLowerCase(), 'strategy', 'audit'],
    status: 'active'
  };
  
  await saveArtifactLocally(artifact);
  
  if (uid && auth.currentUser && navigator.onLine) {
    try { 
      await setDoc(doc(db, "dossier_artifacts", id), sanitizeFirestoreData(artifact)); 
    } catch (e) {}
  }
  return id;
};

export const createDossierArtifactFromText = async (uid: string, folderId: string, title: string, text: string) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return '';
  const id = `artifact_${Date.now()}`;
  
  // Generate tags automatically
  const tags = await generateTagsFromMedia(`Text artifact: ${title} - ${text}`);
  
  const artifact: DossierArtifact = {
    id, userId: uid, folderId, type: 'brief', title, createdAt: Date.now(),
    elements: [{ id: 'el_0', type: 'text', content: text }],
    tags, // Add tags
    status: 'active'
  };
  
  await saveArtifactLocally(artifact);
  
  if (uid && auth.currentUser && navigator.onLine) {
    try { 
      await setDoc(doc(db, "dossier_artifacts", id), sanitizeFirestoreData(artifact)); 
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
    const q = query(collection(db, "dossier_artifacts"), where("folderId", "==", folderId), where("userId", "==", auth.currentUser.uid));
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

export const fetchLineageEntry = async (artifactId: string): Promise<LineageEntry | null> => {
  if (!auth.currentUser || !navigator.onLine) return null;
  try {
    const q = query(collection(db, "lineage_entries"), where("artifact_id", "==", artifactId), where("userId", "==", auth.currentUser.uid));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as LineageEntry;
  } catch (e) {
    console.error("MIMI // Lineage Fetch Error:", e);
    return null;
  }
};

export const fetchAllLineageEntries = async (uid: string): Promise<LineageEntry[]> => {
  if (!uid || uid === 'ghost' || !auth.currentUser || !navigator.onLine) return [];
  try {
    const q = query(collection(db, "lineage_entries"), where("userId", "==", uid));
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => d.data() as LineageEntry);
    return docs.sort((a, b) => a.timestamp - b.timestamp);
  } catch (e) {
    console.error("MIMI // Lineage Fetch Error:", e);
    return [];
  }
};

// -- PROPOSAL SYSTEM CRUD -- //

export const saveProposal = async (proposal: Proposal): Promise<void> => {
  if (auth.currentUser && navigator.onLine) {
    try { await setDoc(doc(db, "proposals", proposal.id), sanitizeFirestoreData(proposal)); } catch (e) {}
  }
};

export const fetchUserProposals = async (uid: string) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return [];
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
    try { await setDoc(doc(db, "context", id), sanitizeFirestoreData(entry)); } catch (e) {}
  }
  return id;
};

export const fetchContextEntries = async (limitCount: number = 50) => {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, "context"), 
      where("userId", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => d.data() as ContextEntry);
    return docs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limitCount);
  } catch (e) { return []; }
};

export const deleteContextEntry = async (id: string) => {
  if (auth.currentUser && navigator.onLine) {
    try { await deleteDoc(doc(db, "context", id)); } catch (e) {}
  }
};

// -- REAL-TIME LISTENERS & PROFILES --

const getCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch (e) {
    return null;
  }
};

const setCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {}
};

// Updated: 'profiles' collection for Identity
export const getUserProfile = async (uid: string) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return null;
  
  const cacheKey = `profile_${uid}`;
  const cached = getCache<UserProfile>(cacheKey);
  if (cached) return cached;

  try {
    const d = await getDoc(doc(db, "profiles_public", uid));
    if (d.exists()) {
      const data = d.data() as UserProfile;
      setCache(cacheKey, data);
      return data;
    }
    return null;
  } catch (e: any) {
    console.warn("MIMI // Profile Read Blocked:", e.code);
    return null;
  }
};

export const saveUserProfile = async (p: UserProfile) => {
  if (!p.uid || p.uid === 'ghost' || !auth.currentUser) return;
  try {
    await setDoc(doc(db, "profiles_public", p.uid), sanitizeFirestoreData(p), { merge: true });
    setCache(`profile_${p.uid}`, p);
  } catch (e: any) {
    console.warn("MIMI // Profile Write Blocked:", e.code);
  }
};

// Updated: 'userPreferences' collection for private data (drafts, personas, etc)
export const getUserPreferences = async (uid: string) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return null;
  
  const cacheKey = `prefs_${uid}`;
  const cached = getCache<UserPreferences>(cacheKey);
  if (cached) return cached;

  try {
    const d = await getDoc(doc(db, "userPreferences", uid));
    if (d.exists()) {
      const data = d.data() as UserPreferences;
      setCache(cacheKey, data);
      return data;
    }
    return null;
  } catch (e: any) {
    console.warn("MIMI // Prefs Read Blocked:", e.code);
    return null;
  }
};

export const saveUserPreferences = async (uid: string, p: UserPreferences) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) return;
  try {
    await setDoc(doc(db, "userPreferences", uid), sanitizeFirestoreData(p), { merge: true });
    setCache(`prefs_${uid}`, p);
  } catch (e: any) {
    console.warn("MIMI // Prefs Write Blocked:", e.code);
  }
};

export const saveLineageEntry = async (entry: LineageEntry): Promise<string> => {
  if (!entry.userId || entry.userId === 'ghost' || !auth.currentUser || !navigator.onLine) return '';
  const id = `lineage_${Date.now()}`;
  const entryWithId = { ...entry, id };
  try {
    await setDoc(doc(db, "lineage_entries", id), sanitizeFirestoreData(entryWithId));
    return id;
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, "lineage_entries");
    return '';
  }
};

// REAL-TIME SUBSCRIPTIONS
export const subscribeToUserProfile = (uid: string, callback: (p: UserProfile | null) => void) => {
  console.info("MIMI // subscribeToUserProfile called for:", uid);
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) {
    console.warn("MIMI // subscribeToUserProfile: Access denied or invalid UID:", uid);
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, "profiles_public", uid), 
    (doc) => callback(doc.exists() ? doc.data() as UserProfile : null),
    (error) => {
        console.error("MIMI // subscribeToUserProfile Error:", error);
        logFirestoreError(error, OperationType.GET, `profiles_public/${uid}`);
    }
  );
};

export const subscribeToUserPreferences = (uid: string, callback: (p: UserPreferences | null) => void) => {
  if (!uid || uid === 'ghost' || !isFullyAuthenticated()) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, "userPreferences", uid), 
    (doc) => callback(doc.exists() ? doc.data() as UserPreferences : null),
    (error) => logFirestoreError(error, OperationType.GET, `userPreferences/${uid}`)
  );
};

// MIGRATION LOGIC REMOVED

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
  const q = query(collection(db, "profiles_public"), where("handle", "==", handle.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return true;
  if (excludeUid && snap.docs.length === 1 && snap.docs[0].data().uid === excludeUid) return true;
  return false;
};

export const getUserByHandle = async (handle: string): Promise<UserProfile | null> => {
  const q = query(collection(db, "profiles_public"), where("handle", "==", handle.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};

export const uploadBlob = async (blob: Blob, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const uploadBase64Image = async (base64String: string, path: string): Promise<string> => {
  const { uploadString } = await import("firebase/storage");
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64String, 'data_url');
  return getDownloadURL(storageRef);
};

export const fetchLatestLineageEntry = async (uid: string): Promise<LineageEntry | null> => {
    try {
        console.log("MIMI // Fetching lineage for UID:", uid);
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, "lineage_entries"), where("userId", "==", uid));
        const snap = await getDocs(q);
        console.log("MIMI // Lineage fetch successful, count:", snap.size);
        if (!snap.empty) {
            const sorted = snap.docs.map(d => d.data() as LineageEntry).sort((a, b) => b.timestamp - a.timestamp);
            return sorted[0];
        }
        return null;
    } catch (e: any) {
        console.error("MIMI // Latest Lineage Fetch Error:", e);
        return null;
    }
};

export const createNotification = async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    try {
        const notificationRef = collection(db, 'notifications');
        await addDoc(notificationRef, {
            userId,
            title,
            message,
            type,
            read: false,
            timestamp: Date.now()
        });
    } catch (e: any) {
        console.error("MIMI // Notification Creation Error:", e);
    }
};

// --- Zine Folder Management ---
export const createZineFolder = async (userId: string, name: string): Promise<string | null> => {
  if (!isFullyAuthenticated()) return null;
  try {
    const folderRef = doc(collection(db, "zine_folders"));
    const folder = {
      id: folderRef.id,
      userId,
      name,
      createdAt: Date.now()
    };
    await setDoc(folderRef, folder);
    return folder.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, "zine_folders");
    return null;
  }
};

export const fetchZineFolders = async (userId: string): Promise<any[]> => {
  if (!isFullyAuthenticated()) return [];
  try {
    const q = query(collection(db, "zine_folders"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (e) {
    logFirestoreError(e, OperationType.LIST, "zine_folders");
    return [];
  }
};

export const updateZineFolder = async (folderId: string, name: string): Promise<boolean> => {
  if (!isFullyAuthenticated()) return false;
  try {
    const folderRef = doc(db, "zine_folders", folderId);
    await updateDoc(folderRef, { name });
    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `zine_folders/${folderId}`);
    return false;
  }
};

export const deleteZineFolder = async (folderId: string): Promise<boolean> => {
  if (!isFullyAuthenticated()) return false;
  try {
    const folderRef = doc(db, "zine_folders", folderId);
    await deleteDoc(folderRef);
    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `zine_folders/${folderId}`);
    return false;
  }
};

export const moveZineToFolder = async (zineId: string, folderId: string | null): Promise<boolean> => {
  try {
    // Update locally first
    const localZines = await getLocalZines() || [];
    const zineIndex = localZines.findIndex(z => z.id === zineId);
    if (zineIndex !== -1) {
      localZines[zineIndex].folderId = folderId || undefined;
      await saveZineLocally(localZines[zineIndex]);
    }

    if (!isFullyAuthenticated()) return true; // If not authenticated, local update is enough

    const zineRef = doc(db, "zines", zineId);
    await updateDoc(zineRef, { folderId: folderId || null });
    return true;
  } catch (e) {
    console.error("MIMI // Error moving zine to folder:", e);
    return false;
  }
};

