
import { setPersistence, browserLocalPersistence, onAuthStateChanged, User } from "firebase/auth";
import { auth, db, storage } from "./firebaseInit";
import { PocketItem, Stack, UserProfile } from "../types";
import { logFirestoreError, handleFirestoreError, OperationType } from "./firebaseUtils";

export { auth, db, storage };

// Test connection on boot to catch "Database not found" early
const testConnection = async () => {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'system', 'connection_test'));
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // We only care about connection/existence errors here, ignore permission denied
    if (errorMessage.includes('not-found') || errorMessage.includes('offline') || errorMessage.includes('does not exist')) {
      logFirestoreError(error, OperationType.GET, 'system/connection_test');
    }
  }
};
testConnection();

// INITIALIZE PERSISTENCE ONCE
let persistenceInitialized = false;

export const initializeAuthPersistence = async (): Promise<void> => {
  if (persistenceInitialized) return;
  
  try {
    // browserLocalPersistence persists across tab closes
    await setPersistence(auth, browserLocalPersistence);
    persistenceInitialized = true;
    console.info("MIMI // Persistence Locked: browserLocalPersistence");
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
        handleFirestoreError(e, OperationType.LIST, "pocket");
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
        handleFirestoreError(e, OperationType.GET, `stacks/${stackId}`);
        return null;
    }
};

export const fetchStacksByUserId = async (userId: string) => {
    try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, "stacks"), where("userId", "==", userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Stack);
    } catch (e: any) {
        handleFirestoreError(e, OperationType.LIST, "stacks");
        return [];
    }
};

export const saveStack = async (stack: Stack) => {
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, "stacks", stack.id), stack);
    } catch (e: any) {
        handleFirestoreError(e, OperationType.WRITE, `stacks/${stack.id}`);
    }
};

export const fetchProfileByHandle = async (handle: string): Promise<UserProfile | null> => {
    try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, "users"), where("handle", "==", handle));
        const snap = await getDocs(q);
        if (!snap.empty) {
            return snap.docs[0].data() as UserProfile;
        }
        return null;
    } catch (e: any) {
        handleFirestoreError(e, OperationType.GET, "users");
        return null;
    }
};

// Export all utilities to prevent missing export errors
export * from './firebaseUtils';
