import { ensureDb } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { TasteProfile, TasteEvent } from "../types";

export interface CodexState {
  entropy: number;   // exploration / chaos (0–1)
  density: number;   // focus / cohesion (0–1)
  velocity: number;  // drift speed (0–1)
  timestamp: number;
}

/**
 * derive entropy + density from interaction patterns
 */
export const deriveCodexState = (profile: TasteProfile, recentEvents: TasteEvent[]): CodexState => {
  // ENTROPY: diversity of archetypes touched recently
  const recentArchetypes = new Set(
    recentEvents
      .slice(-20)
      .map(e => e.output_context.generated_archetype)
      .filter(Boolean)
  );
  const totalArchetypes = Object.keys(profile.archetype_weights).length || 1;
  const entropy = Math.min(1, recentArchetypes.size / totalArchetypes);

  // DENSITY: concentration of interaction on dominant archetype
  const weights = Object.values(profile.archetype_weights);
  const maxWeight = Math.max(...weights, 0.01);
  const meanWeight = weights.reduce((a, b) => a + b, 0) / (weights.length || 1);
  const density = Math.min(1, maxWeight / (meanWeight + 0.01));

  // VELOCITY: how fast the taste is shifting
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentDrifts = (profile.audit_history || [])
    .filter(d => d.timestamp > oneWeekAgo);
  const velocity = Math.min(1, recentDrifts.length / 5);

  return {
    entropy,
    density,
    velocity,
    timestamp: Date.now()
  };
};

export const saveCodexState = async (userId: string, codex: CodexState): Promise<void> => {
  try {
    const db = await ensureDb();
    await setDoc(doc(db, "users", userId, "codex", "current"), codex);
  } catch (error) {
    console.warn("MIMI // Codex Save Failed:", error);
  }
};
