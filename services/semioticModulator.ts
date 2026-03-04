
import { UserProfile } from "../types";

/**
 * Semiotic Modulation Algorithm
 * 
 * This algorithm modulates user inputs and profile data into a set of 
 * "Semiotic Touchpoints" and "Visual Reads" that are conceptually adjacent 
 * rather than literally mapped.
 */

export interface SemioticModulation {
    vibeRead: string;
    touchpoints: {
        motif: string;
        resonance: number; // 0-1
        culturalNode: string;
        visualDirective: string;
    }[];
    chromaticModulation: string[];
}

export const modulateSemioticContext = (
    input: string, 
    profile: UserProfile | null
): string => {
    if (!profile) return "Neutral Modulation";

    const archetypes = profile.tasteProfile?.dominant_archetypes || [];
    const interests = profile.tailorDraft?.positioningCore?.anchors?.culturalReferences || [];
    const scryDirectives = profile.lastAuditReport?.aestheticDirectives || [];
    const desireVectors = profile.tailorDraft?.strategicVectors?.desireVectors;
    
    // We create a "Modulation Matrix" instruction for the AI
    return `
    SEMIOTIC MODULATION MATRIX:
    - Primary Archetypes: ${archetypes.join(', ')}
    - Interest Nodes: ${interests.join(', ')}
    - Scry Directives (Aesthetic Rules): ${scryDirectives.join('; ')}
    - Desire Vectors: Deepen ${desireVectors?.deepen?.join(', ') || 'N/A'}, Reduce ${desireVectors?.reduce?.join(', ') || 'N/A'}
    - Input Frequency: "${input.slice(0, 100)}..."
    
    ALGORITHM DIRECTIVES (REFERENTIAL LOGIC):
    1. EXTRACT THE VIBE: Analyze the "Scry Directives" and "Desire Vectors" to extract the underlying aesthetic "vibe" and "philosophical anchor".
    2. MISCELLANEOUS USAGE: Do not map every input directly. Use the profile data as a background "vibe" or "referential anchor" to suggest NEW, adjacent concepts. If a user likes a specific brand, don't just talk about that brand; talk about the *materiality* or *cultural movement* it represents.
    3. ANALOGY MODULATION: Do not seek 1:1 mappings. If the user mentions "nature", do not just return "trees". Return "Glacial Brutalism" or "Photosynthetic Architecture".
    4. SEMIOTIC TOUCHPOINTS: Populate touchpoints that act as "accurate semiotic touch points" for the vibe, not just the subject.
    5. VISUAL READ: Generate a "vibe read" that informs image prompts with specific textures, lighting (e.g., "flat flash", "35mm grain"), and desaturated palettes.
    6. NON-LINEAR CONNECTIVITY: Touchpoints should form a constellation of meaning, not a single line.
    `;
};
