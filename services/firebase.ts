
import { setPersistence, indexedDBLocalPersistence, onAuthStateChanged, User } from "firebase/auth";
import { auth, db, storage } from "./firebaseInit";
import { PocketItem, Stack } from "../types";

export { auth, db, storage };

// INITIALIZE PERSISTENCE ONCE
let persistenceInitialized = false;

export const initializeAuthPersistence = async (): Promise<void> => {
  if (persistenceInitialized) return;
  
  try {
    // indexedDB is more reliable in iframes than localStorage
    await setPersistence(auth, indexedDBLocalPersistence);
    persistenceInitialized = true;
    console.info("MIMI // Persistence Locked: indexedDB");
  } catch (err: any) {
    console.error("MIMI // Persistence Calibration Failed:", err.code, err.message);
    persistenceInitialized = true;
  }
};

/**
 * BOOTSTRAP AUTH
 * Extended timeout (5s) to allow for redirect recovery in iframes.
 */
export const bootstrapAuth = async (): Promise<User | null> => {
  try {
    await initializeAuthPersistence();
    
    if (auth.currentUser) {
      console.info("MIMI // Bootstrap: Identity detected in memory.");
      return auth.currentUser;
    }
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("MIMI // Bootstrap: Signal Weak, Proceeding as Guest.");
        resolve(null);
      }, 5000); // Increased to 5s for iframe reliability

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        unsubscribe();
        if (user) {
          console.info("MIMI // Bootstrap: Identity anchored.");
        }
        resolve(user);
      }, (error) => {
        console.error("MIMI // Bootstrap: Auth failure.", error);
        clearTimeout(timeout);
        resolve(null);
      });
    });
  } catch (error: any) {
    console.error("MIMI // Bootstrap: Fatal error.", error);
    return null;
  }
};

export const ensureAuth = async () => {
  await initializeAuthPersistence();
  return auth;
};

export const ensureDb = async () => db;
export const ensureStorage = async () => storage;

export const fetchFragmentsByStackId = async (stackId: string) => {
    try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, "pocket"), where("stackIds", "array-contains", stackId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as PocketItem);
    } catch (e: any) {
        console.warn("MIMI // Stack Fragments Fetch Error:", e.code);
        return [];
    }
};

export const fetchStackById = async (stackId: string) => {
    try {
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, "stacks", stackId));
        if (snap.exists()) return snap.data() as Stack;
        return null;
    } catch (e: any) {
        console.warn("MIMI // Stack Fetch Error:", e.code);
        return null;
    }
};

export const saveStack = async (stack: Stack) => {
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, "stacks", stack.id), stack);
    } catch (e: any) {
        console.warn("MIMI // Stack Save Error:", e.code);
    }
};

// Export all utilities to prevent missing export errors
export * from './firebaseUtils';
