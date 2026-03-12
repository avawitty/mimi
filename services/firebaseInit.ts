

import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, initializeFirestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import firebaseConfig from "../firebase-applet-config.json";

const apps = getApps();
let app: FirebaseApp;
try {
  app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
} catch (e) {
  console.error("MIMI // Firebase Init Failed:", e);
  // Fallback to a dummy app or handle the error gracefully
  throw new Error("MIMI // Firebase Init Failed: Please check your configuration.");
}

// TARGET DATABASE
// Check for override in environment variables
const TARGET_DB_ID = import.meta.env.VITE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || "(default)";

// MIMI // REGISTRY AUDIT
if (typeof window !== 'undefined') {
  console.info(`%c MIMI // Registry Active: ${firebaseConfig.projectId} [TARGET DB: ${TARGET_DB_ID}]`, "color: #10B981; font-weight: bold; font-family: serif; font-style: italic;");
}

export const auth: Auth = getAuth(app);

// Modern Firestore Initialization
const isIframe = typeof window !== 'undefined' && window.self !== window.top;

let dbInstance: Firestore;
try {
  dbInstance = getFirestore(app, TARGET_DB_ID);
} catch (e) {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false,
    ignoreUndefinedProperties: true,
  }, TARGET_DB_ID);
}

export const db = dbInstance;

export const storage: FirebaseStorage = getStorage(app);

// Sovereign Analytics Implementation
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  const isIframe = window.self !== window.top;
  if (!isIframe) {
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
}
