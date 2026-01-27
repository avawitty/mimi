import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA5ugvWqsO63IKlXDDeADLBr_aNRDMG5O8",
  authDomain: "gen-lang-client-0210674664.firebaseapp.com",
  projectId: "gen-lang-client-0210674664",
  storageBucket: "gen-lang-client-0210674664.firebasestorage.app",
  messagingSenderId: "98167672430",
  appId: "1:98167672430:web:aaa1d1c48f9ed88d8fe07f",
  measurementId: "G-00DMNMKHX4"
};

const apps = getApps();
const app: FirebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

// MIMI // REGISTRY AUDIT: Initializing with Persistent Local Cache for resilience.
if (typeof window !== 'undefined') {
  console.info(`%c MIMI // Registry Active: ${firebaseConfig.projectId}`, "color: #10B981; font-weight: bold; font-family: serif; font-style: italic;");
}

export const auth: Auth = getAuth(app);

// Modern Firestore Initialization with Multi-Tab Persistence
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const storage: FirebaseStorage = getStorage(app);

// Sovereign Analytics Implementation
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}