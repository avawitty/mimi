import { getEmbedding } from "./geminiService";
import { ZineMetadata } from "../types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseInit";

export const generateAndStoreZineEmbedding = async (zine: ZineMetadata) => {
    try {
        const textToEmbed = `${zine.title} ${zine.content?.vocal_summary_blurb || ""} ${zine.content?.oracular_mirror || ""} ${zine.tone || ""}`;
        if (!textToEmbed.trim()) return;

        const embedding = await getEmbedding([{ text: textToEmbed.slice(0, 2000) }]);
        if (embedding) {
            await updateDoc(doc(db, "zines", zine.id), {
                embedding: embedding
            });
        }
    } catch (e) {
        console.warn("MIMI // Zine Embedding Generation Failed:", e);
    }
};
