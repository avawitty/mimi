

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

// TARGET DATABASE: mimizinemongo
const TARGET_DB_ID = "mimizinemongo";

// MIMI // REGISTRY AUDIT
if (typeof window !== 'undefined') {
  console.info(`%c MIMI // Registry Active: ${firebaseConfig.projectId} [TARGET DB: ${TARGET_DB_ID}]`, "color: #10B981; font-weight: bold; font-family: serif; font-style: italic;");
}

export const auth: Auth = getAuth(app);

// Modern Firestore Initialization
let dbInstance: Firestore;

try {
  // Attempt to initialize with specific settings and specific Database ID
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  }, TARGET_DB_ID);
  
} catch (e: any) {
  // If we get "failed-precondition", it means Firestore was already initialized.
  // We must retrieve the existing instance specifically for our named DB.
  if (e.code === 'failed-precondition') {
     console.warn(`MIMI // Firestore pre-initialized. Attaching to '${TARGET_DB_ID}'...`);
     // CRITICAL: Must pass TARGET_DB_ID here too, or it defaults to '(default)'
     try {
        dbInstance = getFirestore(app, TARGET_DB_ID);
     } catch (innerE) {
        console.error("MIMI // Critical Registry Failure (Recovery):", innerE);
        // Fallback to default DB if named DB fails completely, to prevent crash
        dbInstance = getFirestore(app);
     }
  } else {
     // If it fails for another reason, log it but DO NOT fallback to default (it doesn't exist)
     console.error("MIMI // Critical Registry Failure:", e);
     // Fallback to default to prevent app crash, even if data is missing
     try {
        dbInstance = getFirestore(app);
     } catch (finalE) {
        console.error("MIMI // Fatal DB Error:", finalE);
        // Mock DB to prevent crash? No, Firestore object is needed.
        // We let it throw if even default fails, but usually default works.
        throw e;
     }
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
