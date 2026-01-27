
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
 * Extended timeout for network latency and cold starts.
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
        console.warn("MIMI // Bootstrap: Timeout reached, proceeding as Guest.");
        resolve(null);
      }, 3500); // Resilient 3.5s timeout

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        unsubscribe();
        if (user) {
          console.info("MIMI // Bootstrap: Identity anchored via state change.");
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

export { 
  uploadBlob, saveZineToProfile, fetchUserZines, fetchCommunityZines, 
  addToPocket, fetchPocketItems, 
  // removed recordTasteEdit as it is not exported from firebaseUtils
  deleteFromPocket, getUserProfile, saveUserProfile,
  fetchZineById, isHandleAvailable,
  // removed migrateGhostToCloud as it is not exported from firebaseUtils
  isCaptiveInWebview, handleAuthRedirect,
  initiatePasswordReset, anchorIdentity, startGhostSession,
  updateZineVisibility
} from './firebaseUtils';