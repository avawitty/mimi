import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { extractTasteVector } from "./geminiService";
import { UserProfile } from "../types";

export const updateTasteGraph = async (uid: string, type: 'text' | 'image' | 'link', content: any) => {
  try {
    let textToAnalyze = '';
    let isImage = false;
    let mimeType = 'image/jpeg';

    if (type === 'image' && content.imageUrl) {
      textToAnalyze = content.imageUrl;
      isImage = true;
      // Basic validation for base64
      if (content.imageUrl.startsWith('data:')) {
         const match = content.imageUrl.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
         if (match) {
            mimeType = match[1];
            textToAnalyze = match[2];
         } else {
            return;
         }
      } else {
         return;
      }
    } else if (type === 'text' && content.content) {
      textToAnalyze = content.content;
    } else if (type === 'link' && content.url) {
      textToAnalyze = content.url + (content.title ? ` - ${content.title}` : '');
    } else {
      return;
    }

    const newVector = await extractTasteVector(textToAnalyze, isImage, mimeType);
    if (!newVector || Object.keys(newVector).length === 0) return;

    const userRef = doc(db, "profiles", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const profile = userSnap.data() as UserProfile;
    const currentVector = profile.tasteVector || {};
    const updatedVector = { ...currentVector };

    const learningRate = 0.2;
    const decayRate = 0.95;

    for (const tag of Object.keys(updatedVector)) {
      updatedVector[tag] *= decayRate;
    }

    for (const [tag, intensity] of Object.entries(newVector)) {
       const currentVal = updatedVector[tag] || 0;
       updatedVector[tag] = (currentVal * (1 - learningRate)) + (intensity * learningRate);
    }

    const sum = Object.values(updatedVector).reduce((a, b) => a + b, 0);
    if (sum > 0) {
       for (const tag of Object.keys(updatedVector)) {
          updatedVector[tag] = updatedVector[tag] / sum;
       }
    }

    await updateDoc(userRef, { tasteVector: updatedVector });
    console.info("MIMI // Taste Graph Updated");
  } catch (e) {
    console.warn("MIMI // Taste Graph Update Failed:", e);
  }
};
