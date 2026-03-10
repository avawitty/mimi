

import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, initializeFirestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// [MIMI SOVEREIGN CONFIGURATION]
// Connected to Project: mimi-zine-sovereign
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyCr8uziqd8eg7QwrW0GK3utVoI4oUHMU0U",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "mimi-zine-sovereign.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "mimi-zine-sovereign",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "mimi-zine-sovereign.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "268506207063",
  appId: env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "1:268506207063:web:0c1e3939b7990891e1a412",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || "G-85K7M6QCSY"
};

const apps = getApps();
const app: FirebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

// TARGET DATABASE: mimizinemongo
const TARGET_DB_ID = "mimizinemongo";

// MIMI // REGISTRY AUDIT
if (typeof window !== 'undefined') {
  const isDefaultProject = firebaseConfig.projectId === "mimi-zine-sovereign";
  console.info(`%c MIMI // Registry Active: ${firebaseConfig.projectId} [TARGET DB: ${TARGET_DB_ID}]`, "color: #10B981; font-weight: bold; font-family: serif; font-style: italic;");
  
  if (isDefaultProject) {
    const requiredVars = [
      'FIREBASE_API_KEY', 
      'FIREBASE_AUTH_DOMAIN', 
      'FIREBASE_PROJECT_ID', 
      'FIREBASE_STORAGE_BUCKET', 
      'FIREBASE_MESSAGING_SENDER_ID', 
      'FIREBASE_APP_ID'
    ];
    // Check if the environment variable is actually set (not undefined or empty string)
    const missingVars = requiredVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      console.warn(`%c MIMI // WARNING: Partial Sovereign Registry. Missing: ${missingVars.join(', ')}. Your custom project will not function correctly until ALL variables are set in AI Studio.`, "color: #F59E0B; font-weight: bold;");
    } else {
      console.info("%c MIMI // Registry: Using default Sovereign Project. To use your own, set the Environment Variables in AI Studio.", "color: #6B7280; font-style: italic;");
    }
  }
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
