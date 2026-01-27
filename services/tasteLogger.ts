
import { ensureDb } from "./firebase";
import { collection, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { TasteEvent } from "../types";
import { logEvent } from "firebase/analytics";
import { analytics } from "./firebaseInit";

const COLLECTION_NAME = "taste_events";
const USER_COLLECTION = "users";

/**
 * Logs a single aesthetic interaction to the database.
 * Also mirrors high-level events to Google Analytics for headcounts.
 */
export const logTasteEvent = async (event: TasteEvent): Promise<void> => {
  try {
    const db = await ensureDb();
    const payload = {
      ...event,
      timestamp: Date.now(),
      sessionId: event.sessionId || (typeof window !== 'undefined' ? (window as any).sessionStorage?.getItem('mimi_session_id') : 'unknown')
    };

    // 1. Log to Google Analytics
    if (analytics) {
      logEvent(analytics, 'witness_artifact', {
        type: event.event_type,
        zineId: event.output_context?.zineId,
        uid: event.userId
      });
    }

    // 2. Log to Firestore Registry
    await addDoc(collection(db, COLLECTION_NAME), payload);

    // 3. Aggregate User Profile for high-signal events
    if (event.event_type === 'save' && event.userId) {
       await aggregateUserProfile(event);
    }

  } catch (error) {
    console.warn("Taste Engine Log Failed:", error);
  }
};

const aggregateUserProfile = async (event: TasteEvent) => {
    try {
        const db = await ensureDb();
        const userRef = doc(db, USER_COLLECTION, event.userId);
        
        const updates: any = {};

        if (event.output_context.colors && event.output_context.colors.length > 0) {
            updates['tasteProfile.primary_palette'] = arrayUnion(...event.output_context.colors.slice(0, 5));
        }

        if (event.input_context.selected_archetype) {
            updates['tasteProfile.dominant_archetypes'] = arrayUnion(event.input_context.selected_archetype);
        }
        
        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
        }

    } catch (e) {
        console.warn("Profile Aggregation Failed:", e);
    }
};

// Initialize Session
if (typeof window !== 'undefined' && window.sessionStorage) {
    if (!window.sessionStorage.getItem('mimi_session_id')) {
        window.sessionStorage.setItem('mimi_session_id', crypto.randomUUID());
    }
}
