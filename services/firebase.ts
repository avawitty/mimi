
import { setPersistence, browserLocalPersistence, onAuthStateChanged, User } from "firebase/auth";
import { auth, db, storage } from "./firebaseInit";

export { auth, db, storage };

// INITIALIZE PERSISTENCE ONCE
let persistenceInitialized = false;

export const initializeAuthPersistence = async (): Promise<void> => {
  if (persistenceInitialized) return;
  
  try {
    await setPersistence(auth, browserLocalPersistence);
    persistenceInitialized = true;
    console.info("MIMI // Persistence Locked: browserLocal");
  } catch (err: any) {
    console.error("MIMI // Persistence Calibration Failed:", err.code, err.message);
    persistenceInitialized = true;
  }
};

/**
 * BOOTSTRAP AUTH
 * Extended timeout (2.5s) to allow for fresh project cold-starts.
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
      }, 2500); // Increased to 2.5s for reliability

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

// Export all utilities to prevent missing export errors
export * from './firebaseUtils';
