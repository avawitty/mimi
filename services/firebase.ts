
import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { Auth, getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

console.log("%c MIMI // Engine: Structural Calibration initiated. ", "color: #A8A29E; font-weight: bold;");

/**
 * THE O2 ANCHOR: Project 0210674664
 * This is the definitive registry for the Mimi Zine Hivemind.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCQ1x1jKvezGsjRcsp8nCJF5rSlMYWwimY",
  authDomain: "gen-lang-client-0210674664.firebaseapp.com",
  projectId: "gen-lang-client-0210674664",
  storageBucket: "gen-lang-client-0210674664.firebasestorage.app",
  messagingSenderId: "867494793836",
  appId: "1:867494793836:web:3a8606e94c895b8b61be49"
};

let _app: FirebaseApp | undefined;
let _db: Firestore | undefined;
let _auth: Auth | undefined;
let _storage: FirebaseStorage | undefined;

const getOrInitializeApp = (): FirebaseApp => {
  if (!_app) {
    const existingApps = getApps();
    _app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
    console.log("%c MIMI // Engine: Manifested in Project O2 (021067). ", "color: #10B981; font-weight: bold;");
  }
  return _app;
};

export const ensureAuth = async (): Promise<Auth> => {
  if (!_auth) {
    const app = getOrInitializeApp();
    _auth = getAuth(app);
    // Force local persistence to prevent session decay on mobile
    await setPersistence(_auth, browserLocalPersistence);
  }
  return _auth;
};

export const ensureDb = async (): Promise<Firestore> => {
  if (!_db) {
    const app = getOrInitializeApp();
    
    // Hardened Offline Persistence for restricted mobile environments
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      }),
      experimentalAutoDetectLongPolling: true,
      experimentalForceLongPolling: true, 
    });
    
    console.log("%c MIMI // Engine: Cloud-Synchronized Archive calibrated. ", "color: #3B82F6; font-weight: bold;");
  }
  return _db;
};

export const ensureStorage = async (): Promise<FirebaseStorage> => {
  if (!_storage) {
    const app = getOrInitializeApp();
    _storage = getStorage(app);
  }
  return _storage;
};

export { 
  uploadBlob, saveZineToProfile, fetchUserZines, fetchCommunityZines, 
  addToPocket, fetchPocketItems, 
  deleteFromPocket, recordTasteEdit, getUserProfile, saveUserProfile,
  fetchZineById, linkGoogleAccount
} from './firebaseUtils';
