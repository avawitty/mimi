
import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// [MIMI SOVEREIGN CONFIGURATION]
// Connected to Project: mimi-zine-sovereign
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCr8uziqd8eg7QwrW0GK3utVoI4oUHMU0U",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "mimi-zine-sovereign.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "mimi-zine-sovereign",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "mimi-zine-sovereign.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "268506207063",
  appId: process.env.FIREBASE_APP_ID || "1:268506207063:web:0c1e3939b7990891e1a412",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-85K7M6QCSY"
};

const apps = getApps();
const app: FirebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

// MIMI // REGISTRY AUDIT: Initializing with Persistent Local Cache for resilience.
if (typeof window !== 'undefined') {
  console.info(`%c MIMI // Registry Active: ${firebaseConfig.projectId} [BUCKET: mimizinemongo]`, "color: #10B981; font-weight: bold; font-family: serif; font-style: italic;");
}

export const auth: Auth = getAuth(app);

// Modern Firestore Initialization
// TARGETING SPECIFIC BUCKET: mimizinemongo
let dbInstance: Firestore;

try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  }, "mimizinemongo"); // Explicitly passing databaseId
} catch (e: any) {
  if (e.code === 'failed-precondition') {
     // Already initialized, just get the instance associated with the app (might default if init failed)
     // Note: getFirestore(app) returns default. If named db failed, we might be in a weird state, 
     // but usually this catch is for "already initialized".
     try {
        dbInstance = getFirestore(app, "mimizinemongo");
     } catch (err) {
        dbInstance = getFirestore(app);
     }
  } else {
     dbInstance = getFirestore(app); 
  }
}

export const db = dbInstance;
export const storage: FirebaseStorage = getStorage(app);

// Sovereign Analytics Implementation
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        // Silently maintain structural integrity if the feed is blocked
      }
    }
  });
}
