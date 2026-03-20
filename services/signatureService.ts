import { ZineMetadata, AestheticSignature } from "../types";
import { withResilience, generateTagsFromMedia } from "./geminiService";

export const generateSignature = async (zines: ZineMetadata[]): Promise<AestheticSignature> => {
  const zineSummaries = await Promise.all(zines.map(async z => {
    let tags = z.tags;
    if (!tags || tags.length === 0) {
      tags = await generateTagsFromMedia(z.content.vocal_summary_blurb || z.content.poetic_provocation || "", []);
    }
    return {
      title: z.title,
      tone: z.tone,
      content: z.content.vocal_summary_blurb || z.content.poetic_provocation || "",
      tags: tags || []
    };
  })).then(summaries => summaries.slice(0, 10));

  const prompt = `You are Mimi, an aesthetic editor.
Analyze the user's recent zines to generate their "Aesthetic Signature":
${JSON.stringify(zineSummaries)}

Return a JSON object with:
- primaryAxis (string)
- secondaryAxis (string)
- motifs (array of 4 strings)
- moodCluster (string)
- influenceLineage (array of objects: {artist: string, movement: string, connectionStrength: number})
- creativeCycles (array of objects: {period: string, mood: string, motifSpikes: string[], outputCount: number})
- motifEvolution (array of objects: {motif: string, frequency: number, date: number})

Ensure the output is strictly JSON.`;

  try {
    return await withResilience(async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      if (response.text) {
        const signature = JSON.parse(response.text);
        return { ...signature, generatedAt: Date.now() };
      }
      throw new Error("Empty response");
    });
  } catch (e) {
    console.error("MIMI // Signature Generation Error:", e);
  }

  return {
    primaryAxis: "Unknown",
    secondaryAxis: "Unknown",
    motifs: [],
    moodCluster: "Unknown",
    influenceLineage: [],
    creativeCycles: [],
    motifEvolution: [],
    generatedAt: Date.now()
  };
};
