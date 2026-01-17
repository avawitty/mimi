import { ensureDb } from "./firebase";
import { collection, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { TasteEvent } from "../types";

const COLLECTION_NAME = "taste_events";
const USER_COLLECTION = "users";

/**
 * Logs a single aesthetic interaction to the database.
 * Designed to fail silently to not interrupt the user experience.
 */
export const logTasteEvent = async (event: TasteEvent): Promise<void> => {
  try {
    // Fixed: Use ensureDb instead of non-existent getDbInstance
    const db = await ensureDb();
    const payload = {
      ...event,
      timestamp: Date.now(),
      // Ensure we have a session ID even if not passed
      sessionId: event.sessionId || typeof window !== 'undefined' ? (window as any).sessionStorage?.getItem('mimi_session_id') : 'unknown'
    };

    // 1. Log the immutable event
    await addDoc(collection(db, COLLECTION_NAME), payload);

    // 2. If it's a high-signal event (SAVE), update the user's aggregate profile
    if (event.event_type === 'save' && event.userId) {
       await aggregateUserProfile(event);
    }

  } catch (error) {
    // Silent fail - analytics should never crash the app
    console.warn("Taste Engine Log Failed:", error);
  }
};

/**
 * Lightweight aggregation to update the user's "Taste Profile" 
 * with new data points (colors, archetypes)
 */
const aggregateUserProfile = async (event: TasteEvent) => {
    try {
        // Fixed: Use ensureDb instead of non-existent getDbInstance
        const db = await ensureDb();
        const userRef = doc(db, USER_COLLECTION, event.userId);
        
        const updates: any = {};

        // Aggregate Colors
        if (event.output_context.colors && event.output_context.colors.length > 0) {
            // In a real app, we'd do server-side counting. 
            // Here we just union the latest favorites into a set.
            updates['tasteProfile.primary_palette'] = arrayUnion(...event.output_context.colors.slice(0, 5));
        }

        // Aggregate Archetypes
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