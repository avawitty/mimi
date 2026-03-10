import { collection, doc, setDoc } from "firebase/firestore";
import { db, auth } from "./firebaseInit";
import { getClient } from "./geminiService";
import { ThemeNode } from "./clusteringService";
import { handleFirestoreError, OperationType } from "./firebaseUtils";

export interface ThreadNode {
  type: 'artifact' | 'theme';
  id: string;
}

export interface Thread {
  id: string;
  startArtifactId: string;
  path: ThreadNode[];
  artifacts: any[];
  themes: ThemeNode[];
  narrative: string;
  created_at: number;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  magA = Math.sqrt(magA); magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export const findThread = async (
  startArtifactId: string,
  memories: any[],
  themes: ThemeNode[],
  maxSteps = 6
): Promise<Thread | null> => {
  const startArtifact = memories.find(m => m.id === startArtifactId);
  if (!startArtifact) return null;

  const visited = new Set<string>();
  const path: ThreadNode[] = [];
  const threadArtifacts: any[] = [];
  const threadThemes: ThemeNode[] = [];

  let currentArt = startArtifact;
  path.push({ type: 'artifact', id: currentArt.id });
  threadArtifacts.push(currentArt);
  visited.add(currentArt.id);

  const weekMs = 7 * 24 * 60 * 60 * 1000;

  for (let step = 0; step < maxSteps / 2; step++) {
    // 1. Find closest theme
    let bestTheme: ThemeNode | null = null;
    let bestThemeScore = -Infinity;

    for (const t of themes) {
      if (visited.has(t.id)) continue;
      const sim = cosineSimilarity(currentArt.embedding_field, t.centroid_vector);
      if (sim > bestThemeScore) {
        bestThemeScore = sim;
        bestTheme = t;
      }
    }

    if (!bestTheme || bestThemeScore < 0.3) break;

    path.push({ type: 'theme', id: bestTheme.id });
    threadThemes.push(bestTheme);
    visited.add(bestTheme.id);

    // 2. Find next artifact
    let bestArt: any = null;
    let bestArtScore = -Infinity;

    for (const m of memories) {
      if (visited.has(m.id)) continue;
      
      const sim = cosineSimilarity(bestTheme.centroid_vector, m.embedding_field);
      const timeDiff = Math.abs((currentArt.synced_at || 0) - (m.synced_at || 0));
      const timeScore = Math.exp(-timeDiff / weekMs);
      const themeMembership = bestTheme.artifact_ids.includes(m.id) ? 1 : 0;

      const score = (sim * 0.7) + (timeScore * 0.2) + (themeMembership * 0.1);

      if (score > bestArtScore) {
        bestArtScore = score;
        bestArt = m;
      }
    }

    if (!bestArt || bestArtScore < 0.3) break;

    path.push({ type: 'artifact', id: bestArt.id });
    threadArtifacts.push(bestArt);
    visited.add(bestArt.id);
    currentArt = bestArt;
  }

  if (path.length < 3) {
    return null; // Thread too short to be meaningful
  }

  const { ai } = getClient();
  let narrative = "A thread connecting your thoughts.";
  
  if (ai) {
    const artSummaries = threadArtifacts.map(a => a.content_preview).join('\n- ');
    const themeLabels = threadThemes.map(t => t.label).join('\n- ');

    const prompt = `You are Mimi, an aesthetic editor.
The user's artifacts form this thread:

Artifact summaries:
- ${artSummaries}

Theme labels:
- ${themeLabels}

Explain the emotional or aesthetic thread connecting them.
Use 2-4 sentences.
Tone: reflective, observant, poetic.
Do not use quotes or introductory phrases. Speak directly to the user.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      if (response.text) {
        narrative = response.text.trim();
      }
    } catch (e) {
      console.error("MIMI // Thread Narrative Error:", e);
    }
  }

  const threadId = `thread_${Date.now()}`;
  const thread: Thread = {
    id: threadId,
    startArtifactId,
    path,
    artifacts: threadArtifacts,
    themes: threadThemes,
    narrative,
    created_at: Date.now()
  };

  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await setDoc(doc(db, `users/${uid}/threads`, threadId), {
        ...thread,
        artifacts: threadArtifacts.map(a => a.id),
        themes: threadThemes.map(t => t.id)
      });
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser?.uid}/threads`);
  }

  return thread;
};
