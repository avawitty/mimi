

import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, initializeFirestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA5ugvWqsO63IKlXDDeADLBr_aNRDMG5O8",
  authDomain: "gen-lang-client-02106746-1e8ee.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0210674664-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0210674664",
  storageBucket: "gen-lang-client-0210674664.firebasestorage.app",
  messagingSenderId: "98167672430",
  appId: "1:98167672430:web:2ab61bd54e3bbc298fe07f"
};

const apps = getApps();
export let app: FirebaseApp;
try {
  app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
} catch (e) {
  console.error("MIMI // Firebase Init Failed:", e);
  // Fallback to a dummy app or handle the error gracefully
  throw new Error("MIMI // Firebase Init Failed: Please check your configuration.");
}

// TARGET DATABASE
const TARGET_DB_ID = "ai-studio-6d7c4a54-8086-473c-9ba1-b64d035b37c5";

// MIMI // REGISTRY AUDIT
if (typeof window !== 'undefined') {
  console.info(`%c MIMI // Registry Active: ${firebaseConfig.projectId} [TARGET DB: ${TARGET_DB_ID}]`, "color: #10B981; font-weight: bold; font-family: serif; font-style: italic;");
  console.info("MIMI // Database ID:", TARGET_DB_ID);
}

export const auth: Auth = getAuth(app);

// Modern Firestore Initialization
const isIframe = typeof window !== 'undefined' && window.self !== window.top;

let dbInstance: Firestore;
dbInstance = getFirestore(app, TARGET_DB_ID);

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
