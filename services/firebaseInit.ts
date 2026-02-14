
import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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
  console.info(`%c MIMI // Registry Active: ${firebaseConfig.projectId}`, "color: #10B981; font-weight: bold; font-family: serif; font-style: italic;");
}

export const auth: Auth = getAuth(app);

// Modern Firestore Initialization with Multi-Tab Persistence
// TARGETING NAMED DATABASE: 'mimizine' (Based on project configuration)
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  databaseId: "mimizine" 
});

export const storage: FirebaseStorage = getStorage(app);

// Sovereign Analytics Implementation
// We utilize isSupported() to prevent pedestrian noise in restricted environments.
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
