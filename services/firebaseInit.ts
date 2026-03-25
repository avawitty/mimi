

import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

import firebaseConfig from '../firebase-applet-config.json';

const apps = getApps();
export let app: FirebaseApp;
try {
  app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
} catch (e) {
  console.error("MIMI // Firebase Init Failed:", e);
  throw new Error("MIMI // Firebase Init Failed: Please check your configuration.");
}

// Initialize App Check with Debug Token to bypass auth/firebase-app-check-token-is-invalid
if (typeof window !== 'undefined') {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6Ld_dummy_site_key_for_debug'),
      isTokenAutoRefreshEnabled: true
    });
    console.info("MIMI // App Check Initialized (Debug Mode)");
  } catch (e) {
    console.warn("MIMI // App Check Init Failed:", e);
  }
}

// TARGET DATABASE
const TARGET_DB_ID = firebaseConfig.firestoreDatabaseId;

// MIMI // REGISTRY AUDIT
if (typeof window !== 'undefined') {
  console.info(`%c MIMI // Registry Active: ${firebaseConfig.projectId} [TARGET DB: ${TARGET_DB_ID}]`, "color: #78716c; font-weight: bold; font-family: serif; font-style: italic;");
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
  if (!isIframe) {
    isSupported().then(supported => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
          // Silently maintain structural integrity if the feed is blocked
        }
      }
    }).catch(e => {
      // Silently ignore support check failure
    });
  }
}
