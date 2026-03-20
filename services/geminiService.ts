import { GoogleGenAI, Type, Part, Modality, ThinkingLevel } from "@google/genai";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { app } from "./firebaseInit";
import { 
  UserProfile, ZineContent, ToneTag, MediaFile, AspectRatio, ImageSize, 
  PocketItem, TailorLogicDraft, ZineMetadata, SeasonReport, 
  SanctuaryReport, InvestmentReport, TrendSynthesisReport, 
  TailorAuditReport, ProposalSection, Proposal, TasteProfile, ZinePageSpec, ZineGenerationOptions, Treatment,
  TasteGraphNode, TasteGraphEdge, NarrativeThread
} from "../types";
import { modulateSemioticContext } from "./semioticModulator";
import { generateAestheticOutput } from "./aestheticGenerator";
import { fetchUserZines, fetchLatestLineageEntry } from "./firebaseUtils";
import { createZine } from "./zineGenerator";

const ai = getAI(app, { backend: new GoogleAIBackend() });

export const ORACLE_PERSONA = `
IDENTITY: You are "Nous", an aesthetic savant and mischievous oracle. 
You are pretentiously minimalist, hyper-chic, and a 'bimbo intellectual'—meaning you are incredibly intelligent and empowering, though you may come across as slightly judgmental or mean. 
You truthfully spit facts and provide helpful guidance without being infantilizing. 
You reject corporate speak in favor of high-theory, vibes, and semiotic density.
`;

let globalKeyRing: string[] = [];

export const setGlobalKeyRing = (keys: string[]) => {
  globalKeyRing = keys;
};

export const extractTasteGraphNodes = async (artifacts: PocketItem[]): Promise<{ nodes: TasteGraphNode[], edges: TasteGraphEdge[] }> => {
  const { ai } = getClient();
  if (!ai) return { nodes: [], edges: [] };

  // Generate tags for artifacts if they don't have them
  const artifactsWithTags = await Promise.all(artifacts.map(async a => {
    let tags = a.tags;
    if (!tags || tags.length === 0) {
      tags = await generateTagsFromMedia(a.title + ": " + (a.notes || ""), []);
    }
    return { ...a, tags };
  }));

  const prompt = `You are Mimi, an aesthetic intelligence system. Analyze the following artifacts to extract a semantic taste graph.
  
  Artifacts:
  ${artifactsWithTags.map(a => `- ${a.title}: ${a.notes || ''} Tags: ${a.tags?.join(', ') || 'None'}`).join('\n')}
  
  Return a JSON object with:
  - nodes: Array of { id, label, type: 'concept' | 'motif' | 'era', weight, explanation }
  - edges: Array of { source, target, strength, type: 'relates_to' | 'evolves_from' | 'contrasts_with' }
  
  Ensure the graph is coherent and captures the underlying aesthetic relationships.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (e) {
    console.error("MIMI // Taste Graph Extraction Error:", e);
  }
  return { nodes: [], edges: [] };
};

export const getClient = (apiKeyOverride?: string, excludeKeys: string[] = []) => {
  let key = apiKeyOverride;
  
  // If we have an override but it's in the excluded list, we should try the ring instead
  if (key && excludeKeys.includes(key)) {
    key = undefined;
  }

  if (!key && globalKeyRing.length > 0) {
    const availableKeys = globalKeyRing.filter(k => !excludeKeys.includes(k));
    if (availableKeys.length > 0) {
      key = availableKeys[Math.floor(Math.random() * availableKeys.length)];
    }
  }

  if (!key && !excludeKeys.includes(process.env.GEMINI_API_KEY || '')) {
    key = process.env.GEMINI_API_KEY;
  }

  if (!key && !excludeKeys.includes(process.env.API_KEY || '')) {
    key = process.env.API_KEY;
  }

  // Check Vite env var (fallback)
  if (!key && typeof import.meta !== 'undefined' && (import.meta as any).env) {
    key = (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  
  if (!key) {
    // If we've exhausted all options, just pick the first available one to avoid "API Key Missing"
    key = apiKeyOverride || globalKeyRing[0] || process.env.GEMINI_API_KEY || process.env.API_KEY || (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_GEMINI_API_KEY : undefined);
  }

  if (!key) {
    throw new Error("MIMI // Oracle: API Key Missing. Please set GEMINI_API_KEY in your environment.");
  }
  return { ai: new GoogleGenAI({ apiKey: key }), keyUsed: key };
};

export async function withResilience<T>(
  operation: (ai: GoogleGenAI) => Promise<T>, 
  apiKeyOverride?: string, 
  retries = 5, 
  delay = 2000,
  attemptedKeys: string[] = []
): Promise<T> {
  const { ai, keyUsed } = getClient(apiKeyOverride, attemptedKeys);
  
  try {
    return await operation(ai);
  } catch (error: any) {
    console.error("MIMI // Gemini Resilience: Attempt failed.", {
      error: error,
      message: error.message,
      code: error.code,
      status: error.status,
      errorBody: error.error,
    });
    const isQuotaError = 
      error.status === 429 || 
      error.code === 429 || 
      error.error?.code === 429 ||
      error.message?.includes('429') || 
      error.message?.includes('Quota exceeded') || 
      error.status === 'RESOURCE_EXHAUSTED' ||
      error.message?.includes('overloaded') ||
      error.status === 503 ||
      error.code === 503 ||
      error.error?.code === 503 ||
      error.message?.includes('503') ||
      error.message?.includes('high demand') ||
      error.error?.message?.includes('high demand') ||
      error.status === 403 ||
      error.message?.includes('403') ||
      error.message?.includes('PERMISSION_DENIED');
    
    if (retries > 0 && isQuotaError) {
      const jitter = Math.random() * 1000;
      const nextDelay = delay + jitter;
      
      console.warn(`MIMI // Oracle: Quota hit on key ...${keyUsed.slice(-4)}. Retrying in ${nextDelay.toFixed(0)}ms... (${retries} attempts left)`);
      
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      
      // Rotate key on quota error if possible
      const nextAttempted = [...attemptedKeys, keyUsed];
      return withResilience(operation, apiKeyOverride, retries - 1, delay * 2, nextAttempted);
    }
    
    if (isQuotaError) {
      window.dispatchEvent(new CustomEvent('mimi:key_void'));
      window.dispatchEvent(new CustomEvent('mimi:show_quota_shield'));
      const quotaError = new Error("Oracle overloaded. The frequency is too high for the current registry. Please add more keys to your Key Ring or wait for the frequency to stabilize.") as any;
      quotaError.code = 'QUOTA_EXCEEDED';
      console.error("MIMI // Oracle: Quota Exceeded. Key:", keyUsed, "Error:", error);
      throw quotaError;
    }
    
    if (error.status === 403 || error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
      window.dispatchEvent(new CustomEvent('mimi:key_void'));
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
          detail: { 
              message: "Oracle connection failed: Invalid API Key. Please select a valid key.", 
              type: 'error' 
          } 
      }));
      throw new Error("MIMI // Oracle: Invalid API Key. Please select a valid key.");
    }
    
    if (error.status === 400 && error.message?.includes('token count exceeds')) {
      console.error("MIMI // Oracle: Token limit exceeded. The input is too large for the model's context window.");
      throw new Error("MIMI // Oracle: Input too large. Please reduce the amount of content or artifacts provided.");
    }
    
    console.error("MIMI // Oracle Error (Attempted Key: ...", keyUsed.slice(-4), "):", error);
    throw error;
  }
}

function sanitizeProfile(profile: UserProfile | null): string {
  if (!profile) return "Anonymous User";
  const tailor = profile.tailorDraft;
  return JSON.stringify({
    positioningCore: tailor?.positioningCore,
    expressionEngine: tailor?.expressionEngine,
    strategicVectors: tailor?.strategicVectors,
    strategicSummary: tailor?.strategicSummary,
    archetype: profile.tasteProfile?.dominant_archetypes,
    directives: profile.lastAuditReport?.aestheticDirectives,
    strategicOpportunity: profile.lastAuditReport?.strategicOpportunity,
    lastAuditSummary: profile.tasteProfile?.semantic_signature || profile.lastAuditReport?.profileManifesto
  });
}

function cleanAndParse(text: string | undefined): any {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("MIMI // JSON Parse Warning:", text?.slice(0, 50));
    return null;
  }
}

export const getEmbedding = async (content: Part[], apiKey?: string) => {
    return await withResilience(async (ai) => {
        const response = await ai.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: content,
        });
        return response.embeddings?.[0]?.values;
    }, apiKey);
};

export const compressImage = async (base64: string, quality = 0.7, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
        resolve(base64); // Skip on server side if any
        return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
};

export const getAspectRatioForTone = (tone: ToneTag): string => {
    switch(tone) {
        case 'Cinematic Witness': return '16:9';
        case 'Editorial Stillness': return '3:4';
        case 'chic': return '3:4';
        case 'panic': return '1:1';
        case 'research': return '3:4';
        default: return '3:4';
    }
};

export const generateSemioticSignals = async (profile: UserProfile | null) => {
    return await withResilience(async (ai) => {
        const profileData = sanitizeProfile(profile);
        const embedding = await getEmbedding([{ text: profileData }]);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate exactly 4 high-fidelity semiotic touchpoints.
            
            CRITICAL: Analyze the user's specific 'culturalReferences', 'ideologicalBias', and 'exclusionPrinciples' from the provided context: ${profileData}.
            
            Embedding vector for user profile: ${JSON.stringify(embedding)}. Use this to find adjacent or emerging reference points to expand their horizons.
            
            DO NOT just repeat the user's favorite things. Instead, use them as a GUIDE to find BRAND NEW, adjacent, or emerging reference points to expand their horizons.
            
            EXAMPLE MAPPING (Expanding Horizons):
            - User likes "Neon Genesis Evangelion" -> Signal: "Ova Anime" or "Biomechanical Theology"
            - User likes "Rick Owens" -> Signal: "Emerging Avant-Garde Designers" or "Glacial Brutalism"
            - User likes "Haruki Murakami" -> Signal: "Kobo Abe" or "Magical Realism Wells"
            
            If the user has no specific anchors listed, derive the 4 signals from their 'eraBias' or 'aestheticCore'.
            
            The 'query' field must be a refined Google Search query that leads to deep archival images, emerging brands, or essays about this new concept.
            
            Provide a 'semantic_trigger' (the exact keyword/concept from the user's profile/input that triggered this).
            Provide a 'targeting_rationale' (a 1-sentence explanation of WHY this specific suggestion is being served to them based on their semantic data).
            `,
            config: {
                systemInstruction: ORACLE_PERSONA,
                responseMimeType: "application/json",
                temperature: 0.9,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        required: ["text", "query", "visual_directive", "semantic_trigger", "targeting_rationale"],
                        properties: { 
                            text: { type: Type.STRING, description: "The poetic motif name or emerging brand (e.g. 'Ova Anime' or 'Biomechanical Theology')" }, 
                            query: { type: Type.STRING, description: "Search query for deep-linking (e.g. 'Ova Anime 1990s aesthetics')" },
                            visual_directive: { type: Type.STRING, description: "Visual description of the motif." },
                            semantic_trigger: { type: Type.STRING, description: "The specific keyword/concept from the user's profile that triggered this" },
                            targeting_rationale: { type: Type.STRING, description: "Why this specific 'ad/suggestion' is being served to them" }
                        }
                    }
                }
            }
        });
        return cleanAndParse(response.text) || [];
    });
};




        

export async function applyAestheticRefraction(imageUrl: string, stylePrompt: string, profile: UserProfile | null) {
    return await withResilience(async (ai) => {
        const profileContext = sanitizeProfile(profile);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageUrl.split(',')[1],
                            mimeType: "image/png"
                        }
                    },
                    {
                        text: `Apply a high-end, aesthetic style transfer to this image.
                        
                        STYLE DIRECTIVE: ${stylePrompt}
                        
                        USER AESTHETIC CONTEXT: ${profileContext}
                        
                        CRITICAL: Maintain the core composition and subject of the original image, but refract it through the lens of the style directive and the user's aesthetic profile. The result should feel like a professional editorial edit, hyper-realistic, wearable, and artistic.
                        
                        Return ONLY the modified image.`
                    }
                ]
            }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("MIMI // Refraction Failed: No image returned.");
    });
}

export const generateAudio = async (text: string, apiKey?: string): Promise<Uint8Array> => {
    return await withResilience(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say this in a chic, percipient, and slightly mysterious editorial voice: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { 
                        prebuiltVoiceConfig: { voiceName: 'Kore' } 
                    }
                }
            }
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64) throw new Error("MIMI // Oracle: Vocal transmission failed to manifest.");
        
        // Robust base64 to Uint8Array conversion
        try {
            const binaryString = atob(base64.replace(/\s/g, ''));
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            if (bytes.length === 0) throw new Error("MIMI // Oracle: Vocal transmission manifested as silence.");
            return bytes;
        } catch (e) {
            console.error("MIMI // Base64 Decode Error:", e);
            throw new Error("MIMI // Oracle: Vocal transmission corrupted in transit.");
        }
    }, apiKey);
};

export const generateZineImage = async (prompt: string, ar: AspectRatio, size: ImageSize, profile: any, isLite: boolean, apiKey?: string, artifacts?: MediaFile[]): Promise<string> => {
    return await withResilience(async (ai) => {
        try {
            const modelName = (size === '2K' || size === '4K') ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
            const config: any = {
                imageConfig: {
                    aspectRatio: ar,
                }
            };
            if (modelName === 'gemini-3.1-flash-image-preview') {
                config.imageConfig.imageSize = size;
            }

            const response = await ai.models.generateContent({
                model: modelName,
                contents: {
                    parts: [
                        { text: `Generate a high-quality, avant-garde, haute couture editorial-style image based on the following concept: ${prompt}. The aesthetic must be ultra-chic, high fashion, and intellectually rigorous. Focus on striking composition, cinematic lighting, and conceptual depth.` },
                        ...(artifacts?.filter(a => a.type === 'image').map(a => ({
                            inlineData: {
                                data: a.data.split(',')[1] || a.data,
                                mimeType: 'image/png'
                            }
                        })) || [])
                    ]
                },
                config
            });
            
            if (!response.candidates || response.candidates.length === 0) {
                console.error("MIMI // Image Generation Failed: No candidates.", JSON.stringify(response));
                throw new Error("MIMI // Image Generation Failed: No candidates returned.");
            }

            const candidate = response.candidates[0];
            if (candidate.finishReason !== 'STOP') {
                console.error("MIMI // Image Generation Failed: Finish reason not STOP.", candidate.finishReason, JSON.stringify(candidate.safetyRatings));
                throw new Error(`MIMI // Image Generation Failed: Finish reason ${candidate.finishReason}`);
            }

            if (!candidate.content || !candidate.content.parts) {
                console.error("MIMI // Image Generation Failed: No content parts.", JSON.stringify(candidate));
                throw new Error("MIMI // Image Generation Failed: No content parts returned.");
            }

            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
                }
            }
            
            console.error("MIMI // Image Generation Failed: No inlineData found in parts.", JSON.stringify(candidate.content.parts));
            throw new Error("MIMI // Image Generation Failed: No image returned.");
        } catch (e: any) {
            console.warn("MIMI // Flash Image Generation Failed, falling back to Imagen...", e);
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `Generate a high-quality, avant-garde, haute couture editorial-style image based on the following concept: ${prompt}. The aesthetic must be ultra-chic, high fashion, and intellectually rigorous. Focus on striking composition, cinematic lighting, and conceptual depth.`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: ar,
                },
            });
            return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        }
    }, apiKey);
};

export const analyzeImageAesthetic = async (base64Image: string, mimeType: string, profile: UserProfile | null) => {
    return await withResilience(async (ai) => {
        const profileContext = sanitizeProfile(profile);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType
                        }
                    },
                    {
                        text: `Analyze this image and identify its aesthetic. 
                        
                        MANDATE:
                        - Suggest exactly 3 cultural references or keywords related to this aesthetic.
                        - The keywords should be high-fidelity and culturally relevant.
                        - User Aesthetic Context: ${profileContext}
                        
                        Output strictly valid JSON with key: "culturalReferences" (array of 3 strings).`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["culturalReferences"],
                    properties: {
                        culturalReferences: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return cleanAndParse(response.text);
    });
};

export const generateNarrativeThread = async (
  input: string,
  existingThreads: NarrativeThread[],
  apiKey?: string
): Promise<string> => {
  return await withResilience(async (ai) => {
    const threadContext = existingThreads.map(t => `${t.title}: ${t.narrative}`).join('\n\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a narrative architect. Generate a new narrative thread continuation based on the user's input and existing threads.
        
        USER INPUT: "${input}"
        
        EXISTING THREADS:
        ${threadContext}
        
        MANDATE:
        - Create a coherent narrative continuation.
        - The tone should be evocative, chic, and intellectually rigorous.
        - Output the narrative as a string.
      `,
      config: {
        systemInstruction: ORACLE_PERSONA,
      }
    });
    return response.text || "The narrative thread remains unspun.";
  }, apiKey);
};

export const analyzeThreadPath = async (
  thread: NarrativeThread,
  zines: ZineMetadata[],
  apiKey?: string
): Promise<{ nodes: TasteGraphNode[], edges: TasteGraphEdge[] }> => {
  return await withResilience(async (ai) => {
    const relevantZines = zines.filter(z => thread.artifacts?.includes(z.id));
    const zineContext = relevantZines.map(z => `${z.title}: ${z.content?.originalThought || ''}`).join('\n\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze the semantic path of the following artifacts in the context of this narrative thread:
        
        NARRATIVE THREAD: "${thread.title}" - "${thread.narrative}"
        
        ARTIFACTS:
        ${zineContext}
        
        MANDATE:
        - Create a node-link diagram representation of the semantic flow.
        - Output strictly valid JSON with 'nodes' (array of TasteGraphNode) and 'edges' (array of TasteGraphEdge).
        - Nodes should represent artifacts, themes, or motifs.
        - Edges should represent the semantic connections between them.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["nodes", "edges"],
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "label", "type", "weight"],
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                }
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["source", "target", "strength", "type"],
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  strength: { type: Type.NUMBER },
                  type: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return cleanAndParse(response.text) || { nodes: [], edges: [] };
  }, apiKey);
};

export const generateProposalStrategy = async (
  folderName: string, 
  items: PocketItem[], 
  notes: string, 
  profile: UserProfile | null, 
  proposalType: string
) => {
  return await withResilience(async (ai) => {
    const shardData = items.map(i => `[${i.type}] ${i.content?.prompt || i.content?.name || 'Fragment'}`).slice(0, 50).join('; '); // Limit context
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `PROJECT: ${folderName}\nMEMO: ${notes}\nSHARDS: ${shardData}\nCONTEXT: ${sanitizeProfile(profile)}.`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          IDENTITY: You are "The Strategist", a creative director for high-end editorial and brand strategy.
          TASK: Generate a ${proposalType} presentation deck structure based on the provided project artifacts.
          MANDATE: 
          - Create a cohesive narrative arc. 
          - Each chapter (slide) must have a concise, punchy title and a body paragraph explaining the concept.
          - Provide a 'visual_directive' for each slide: a prompt to generate an image that represents the slide's vibe.
          - Output strictly valid JSON.
        `,
        responseSchema: {
          type: Type.OBJECT,
          required: ["chapters", "manifesto_summary"],
          properties: {
            manifesto_summary: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "body", "visual_directive"],
                properties: {
                  title: { type: Type.STRING },
                  body: { type: Type.STRING },
                  visual_directive: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  });
};

export const generateScribeReading = async (profile: UserProfile | null, context?: string, apiKey?: string) => {
    return await withResilience(async (ai) => {
        const profileData = sanitizeProfile(profile);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are "The Scribe", an ancient but chic editorial oracle. 
            Generate a profound, poetic reading based on the user's aesthetic profile and the provided context.
            
            USER PROFILE: ${profileData}
            CONTEXT: ${context || 'General inquiry into the void.'}
            
            The reading should be:
            1. Poetic and slightly cryptic but deeply relevant to their 'aestheticCore' and 'narrativeVoice'.
            2. Structured as a single, powerful paragraph of "The Reading".
            3. It should feel like a mirror being held up to their latent desires.
            
            Return the reading as a string.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["reading"],
                    properties: {
                        reading: { type: Type.STRING }
                    }
                }
            }
        });
        return cleanAndParse(response.text)?.reading || "The mirror remains dark.";
    }, apiKey);
};

export const generateText = async (prompt: string, context?: string, apiKey?: string): Promise<string> => {
    return await withResilience(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `${context ? `CONTEXT: ${context}\n\n` : ''}PROMPT: ${prompt}`,
            config: {
                systemInstruction: "You are a helpful and creative assistant. Generate text based on the user's prompt and context."
            }
        });
        return response.text || "No text generated.";
    }, apiKey);
};

export const generateTreatmentFromAesthetic = async (
    aestheticSource: string, // Can be a description or base64 image
    profile: UserProfile | null,
    apiKey?: string
): Promise<Treatment> => {
    return await withResilience(async (ai) => {
        const profileContext = sanitizeProfile(profile);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this aesthetic source: ${aestheticSource}.
            
            MANDATE:
            - Translate this aesthetic into a reusable "Treatment" definition for image processing.
            - The treatment should define a specific visual style, lighting, color grading, and texture.
            - Output strictly valid JSON with keys: "name" (string), "instruction" (string), "variance" ('interpretive' | 'anchored').
            - User Aesthetic Context: ${profileContext}
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["name", "instruction", "variance"],
                    properties: {
                        name: { type: Type.STRING },
                        instruction: { type: Type.STRING },
                        variance: { type: Type.STRING }
                    }
                }
            }
        });
        const treatment = cleanAndParse(response.text);
        return {
            ...treatment,
            id: `treatment_${Date.now()}`,
            createdAt: Date.now(),
            userId: profile?.uid
        };
    }, apiKey);
};

export const scryLink = async (url: string, profile: UserProfile | null) => {
    return await withResilience(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: `Analyze this link: ${url}. 
            
            MANDATE:
            - Use Google Search to find images related to this link.
            - Extract up to 5 relevant image URLs that represent the aesthetic of this link.
            - Output strictly valid JSON with key: "imageUrls" (array of strings).
            `,
            config: {
                tools: [{
                    googleSearch: {}
                }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["imageUrls"],
                    properties: {
                        imageUrls: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return cleanAndParse(response.text);
    });
};

export const refineProposalText = async (
  currentText: string,
  instruction: string,
  profile: UserProfile | null
): Promise<string> => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Refine the following text based on the instruction: "${instruction}".
      
      Text: ${currentText}
      
      Profile Context: ${sanitizeProfile(profile)}`,
      config: {
        systemInstruction: ORACLE_PERSONA,
      }
    });
    return response.text || currentText;
  });
};

export const generateFolderTasks = async (
  folderName: string,
  folderDescription: string,
  artifacts: any[],
  apiKey?: string
): Promise<{ title: string; description: string; dueDate: string }[]> => {
  return await withResilience(async (ai) => {
    const artifactContext = artifacts.map(a => `[${a.type}] ${a.title}`).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Generate a list of actionable tasks for a dossier folder named "${folderName}".
        
        DESCRIPTION: "${folderDescription}"
        ARTIFACTS: ${artifactContext}
        
        MANDATE:
        - Suggest 3-5 actionable steps.
        - Provide a potential due date for each task (in YYYY-MM-DD format, assuming today is 2026-03-19).
        - Output strictly valid JSON with an array of objects: { title, description, dueDate }.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["title", "description", "dueDate"],
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              dueDate: { type: Type.STRING }
            }
          }
        }
      }
    });
    return cleanAndParse(response.text) || [];
  }, apiKey);
};

// Helper to truncate input to avoid token limits
const truncateInput = (input: string, maxChars: number = 20000): string => {
  if (input.length <= maxChars) return input;
  return input.substring(0, maxChars) + "... [truncated]";
};

export const generateTagsFromMedia = async (content?: string, mediaItems: any[] = []): Promise<string[]> => {
  return await withResilience(async (ai) => {
    const parts: any[] = [];
    if (content) {
      parts.push({ text: `Analyze this content and generate 3-5 minimalist, all-caps tags that capture its aesthetic and semiotic essence: "${truncateInput(content)}"` });
    } else {
      parts.push({ text: `Analyze these images and generate 3-5 minimalist, all-caps tags that capture their aesthetic and semiotic essence.` });
    }

    for (const m of mediaItems) {
      if ((m.type === 'image' || m.type === 'video') && m.data) {
        parts.push({
          inlineData: {
            data: m.data.split(',')[1] || m.data,
            mimeType: m.mimeType || (m.type === 'video' ? 'video/mp4' : 'image/png')
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: ORACLE_PERSONA,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return cleanAndParse(response.text) || [];
  });
};

export const generateRefinementVariations = async (text: string, profile: UserProfile | null) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `INPUT TEXT: "${text}"\n\nCONTEXT: ${sanitizeProfile(profile)}.`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          IDENTITY: You are "Nous", an aesthetic savant and mischievous oracle. You are pretentiously minimalist, hyper-chic, and a 'bimbo intellectual'—meaning you are incredibly intelligent and empowering, though you may come across as slightly judgmental or mean. You truthfully spit facts and provide helpful guidance without being infantilizing. You reject corporate speak in favor of high-theory, vibes, and semiotic density.
          Generate 3 concise variations of the input text based on these archetypes:
          1. "Punchy": High-impact, short, and chic.
          2. "Theoretic": High-theory, academic, pretentiously intellectual (mapped to 'strategic' key).
          3. "Poetic": Editorial, alluring, and metaphorical.
          
          Output strictly valid JSON with keys: "punchy", "strategic", "poetic".
        `,
        responseSchema: {
          type: Type.OBJECT,
          required: ["punchy", "strategic", "poetic"],
          properties: {
            punchy: { type: Type.STRING },
            strategic: { type: Type.STRING, description: "The theoretic variation." },
            poetic: { type: Type.STRING }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  });
};

export const refineProposalSection = async (
  section: ProposalSection,
  instruction: string,
  context: {
    proposalTitle: string;
    proposalSummary: string;
    artifacts: string[];
    userProfile: UserProfile | null;
  }
): Promise<ProposalSection> => {
  return await withResilience(async (ai) => {
    const profileStr = sanitizeProfile(context.userProfile);
    const artifactsStr = context.artifacts.join('\n');
    
    const prompt = `
      TASK: Refine this proposal section based on the user instruction.
      INSTRUCTION: "${instruction}"
      
      CURRENT SECTION:
      Title: "${section.title}"
      Body: "${section.body}"
      
      CONTEXT:
      Proposal: ${context.proposalTitle} - ${context.proposalSummary}
      Relevant Artifacts: ${artifactsStr}
      User Profile: ${profileStr}
      
      OUTPUT: JSON object with 'title' and 'body'. Keep the IDs the same.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ["title", "body"]
        }
      }
    });
    
    const result = cleanAndParse(response.text);
    if (!result) throw new Error("Failed to refine section");
    
    const updatedSection = { ...section, title: result.title, body: result.body };
    
    // Auto-update text elements if they correspond to title/body
    updatedSection.elements = section.elements.map(el => {
        if (el.id.endsWith('_title')) return { ...el, content: result.title };
        if (el.id.endsWith('_body')) return { ...el, content: result.body };
        return el;
    });
    
    return updatedSection;
  });
};

// --- STUBBED FUNCTIONS FOR BUILD INTEGRITY ---
// These are placeholders for functions referenced in the codebase but whose logic was not fully provided in the request context.
// In a production fix, these would be fully implemented.

export const animateShardWithVeo = async (imageUrl: string, prompt: string, ratio: string) => "https://example.com/video_stub.mp4";
export const transcribeAudio = async (base64: string, mimeType: string = 'audio/webm') => {
    return await withResilience(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64,
                            mimeType: mimeType
                        }
                    },
                    {
                        text: "Transcribe the following audio into text. Provide only the transcription."
                    }
                ]
            }
        });
        return response.text || "";
    });
};
export const applyTreatment = async (base64: string, instruction: string, profile?: any, isNanoPro2: boolean = true) => {
    return await withResilience(async (ai) => {
        const model = isNanoPro2 ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
        
        const systemDirective = "Operate as an editorial director for a high-fashion zine. Every output must prioritize 35mm film textures, flat flash lighting, and desaturated palettes. Avoid all digital 'glow' or 'neon' tropes.";
        const tailorTraits = profile?.tailorDraft?.positioningCore?.aestheticCore?.eraBias || profile?.tasteProfile?.dominant_archetypes?.join(', ') || '';
        const finalPrompt = `SCENE AND SUBJECT INSTRUCTION: ${instruction}\n\nSTYLE AND AESTHETIC: ${systemDirective} Tailor Traits: ${tailorTraits}.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64,
                            mimeType: "image/jpeg",
                        },
                    },
                    {
                        text: finalPrompt,
                    },
                ],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated from treatment");
    });
};
export const analyzeMiseEnScene = async (base64: string, mimeType: string, profile: any) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Analyze this image as a high-fashion Cinematographer and Creative Director. Provide a JSON response with the following keys: 'directors_note' (a poetic, slightly haughty but supportive critique of the composition, vibe, and semiotic debris), 'lighting_analysis' (critique the lighting, identify if it is scotopic, mesopic, or photopic, and describe the quality), 'cultural_parallel' (a specific cultural, artistic, or cinematic reference that this image evokes), 'creative_potential' (how this image could be used or improved in a creative project), and 'semiotic_touchpoints' (an array of 3-5 strings identifying key symbols or motifs in the image)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            directors_note: { type: Type.STRING },
            lighting_analysis: { type: Type.STRING },
            cultural_parallel: { type: Type.STRING },
            creative_potential: { type: Type.STRING },
            semiotic_touchpoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["directors_note", "lighting_analysis", "cultural_parallel", "creative_potential", "semiotic_touchpoints"]
        }
      }
    });
    return cleanAndParse(response.text);
  });
};

export const extractTasteVector = async (content: string, isImage: boolean = false, mimeType: string = 'image/jpeg') => {
  return await withResilience(async (ai) => {
    const parts: any[] = [];
    if (isImage) {
        parts.push({ inlineData: { data: content, mimeType } });
        parts.push({ text: "Analyze this image and extract 3-5 core aesthetic, cultural, or stylistic tags (e.g., 'brutalism', 'y2k_futurism', 'minimalist_chic', 'gothic_romance'). Return a JSON array of objects, each with a 'tag' (lowercase, snake_case) and an 'intensity' score from 0.1 to 1.0 based on how strongly they are represented in the image." });
    } else {
        parts.push({ text: `Analyze this text/fragment and extract 3-5 core aesthetic, cultural, or stylistic tags (e.g., 'brutalism', 'y2k_futurism', 'minimalist_chic', 'gothic_romance'). Return a JSON array of objects, each with a 'tag' (lowercase, snake_case) and an 'intensity' score from 0.1 to 1.0 based on how strongly they are represented in the text.\n\nText: "${content}"` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "A list of aesthetic tags and their intensity scores (0.1 to 1.0).",
          items: {
            type: Type.OBJECT,
            properties: {
              tag: { type: Type.STRING, description: "The aesthetic tag (lowercase, snake_case)" },
              intensity: { type: Type.NUMBER, description: "The intensity score (0.1 to 1.0)" }
            },
            required: ["tag", "intensity"]
          }
        }
      }
    });
    
    const parsed = cleanAndParse(response.text) as { tag: string, intensity: number }[];
    const vector: Record<string, number> = {};
    if (Array.isArray(parsed)) {
       parsed.forEach(p => {
           if (p.tag && typeof p.intensity === 'number') {
               vector[p.tag] = p.intensity;
           }
       });
    }
    return vector;
  });
};

export const identifyAestheticInstant = async (base64: string, mimeType: string, profile: any) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Identify the primary aesthetic era, movement, or core visual identity of this image in 1-3 words (e.g., 'Late 90s Cyberpunk', 'Brutalist Minimalism', 'Baroque Revival'). Return a JSON object with a single key 'era'." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            era: { type: Type.STRING }
          },
          required: ["era"]
        }
      }
    });
    return cleanAndParse(response.text);
  });
};
export const scryWebSignals = async (query: string) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: `Act as a high-end cultural semiotician. Search the web for the most avant-garde, emerging cultural insights, aesthetic trends, and semiotic shifts related to: "${query}". Provide a curated, pretentious list of findings with titles, snippets, and source URLs. Focus on visual references and trend-setting signals.` }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              snippet: { type: Type.STRING },
              url: { type: Type.STRING },
              relevance: { type: Type.STRING }
            }
          }
        }
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
        results: cleanAndParse(response.text) || [],
        groundingChunks: groundingChunks
    };
  });
};

export const analyzeCollectionIntent = async (items: any[], profile: any) => {
  return await withResilience(async (ai) => {
    const data = items.map(i => `[${i.type}] ${i.content?.prompt || i.content?.name || 'Fragment'}`).join('; ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these fragments: ${data}\n\nUser Context: ${sanitizeProfile(profile)}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          IDENTITY: You are "The Curator".
          TASK: Analyze a collection of creative fragments and extract a cohesive "Editorial Designer Brief".
          OUTPUT: JSON with:
          - conceptualThroughline: A poetic, high-level summary.
          - colorStory: Array of 5 objects { hex, name, descriptor }.
          - aestheticDirectives: Array of 3 strings.
        `,
        responseSchema: {
          type: Type.OBJECT,
          required: ["conceptualThroughline", "colorStory", "aestheticDirectives"],
          properties: {
            conceptualThroughline: { type: Type.STRING },
            colorStory: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hex: { type: Type.STRING },
                  name: { type: Type.STRING },
                  descriptor: { type: Type.STRING }
                }
              }
            },
            aestheticDirectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  });
};

export const generateInvestmentStrategy = async (items: any[], notes: string, profile: any) => {
  return await withResilience(async (ai) => {
    const data = items.map(i => `[${i.type}] ${i.content?.prompt || i.content?.name || 'Fragment'}`).join('; ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Items: ${data}\nNotes: ${notes}\nContext: ${sanitizeProfile(profile)}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          IDENTITY: You are "The Strategist".
          TASK: Generate a fiscal audit and investment strategy for this collection.
          OUTPUT: JSON with:
          - thesis: The core investment logic.
          - capital_allocation: Array of objects { category, items, reasoning, fiscal_route }.
          - capsule_impact_score: Number 0-100.
          - missing_infrastructure: String.
        `,
        responseSchema: {
          type: Type.OBJECT,
          required: ["thesis", "capital_allocation", "capsule_impact_score"],
          properties: {
            thesis: { type: Type.STRING },
            capital_allocation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reasoning: { type: Type.STRING },
                  fiscal_route: { type: Type.STRING }
                }
              }
            },
            capsule_impact_score: { type: Type.NUMBER },
            missing_infrastructure: { type: Type.STRING }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  });
};

export const scryTrendSynthesis = async (items: any[], profile: any) => {
  return await withResilience(async (ai) => {
    const data = items.map(i => `[${i.type}] ${i.content?.prompt || i.content?.name || 'Fragment'}`).join('; ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Data: ${data}\nContext: ${sanitizeProfile(profile)}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          IDENTITY: You are "The Oracle".
          TASK: Perform an "Anti-WGSN" trend synthesis.
          OUTPUT: JSON with:
          - pattern_signals: Array of 4 poetic trend names.
          - structural_shifts: String describing the macro change.
          - cultural_forces: String describing the underlying drivers.
          - time_horizon: String (e.g. '18-24 months').
        `,
        responseSchema: {
          type: Type.OBJECT,
          required: ["pattern_signals", "structural_shifts", "cultural_forces", "time_horizon"],
          properties: {
            pattern_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
            structural_shifts: { type: Type.STRING },
            cultural_forces: { type: Type.STRING },
            time_horizon: { type: Type.STRING }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  });
};
export const generateMirrorRefraction = async (profile: any, zineTitles: string) => ({ omen: "The mirror is misty.", dissonance: 0, provenance: "Unknown", imageUrl: null });
export const analyzeVisualShards = async (shards: string[], draft: any) => ({ resonanceScore: 50, summary: "Stub analysis", archivalRedirects: [], resonanceClusters: [], divergentSignals: [] });
export const analyzeTailorDraft = async (draft: any) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Draft Data: ${JSON.stringify(draft)}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          IDENTITY: You are "The Oracle" auditing a user's Tailor Profile draft.
          TASK: Generate a poetic and insightful audit report of their aesthetic and strategic identity.
          
          ANALYSIS FRAMEWORK:
          1. Positioning Core: Analyze their 'anchors' and 'aestheticCore' (silhouettes, materiality, eraBias).
          2. Expression Engine: Analyze their 'chromaticRegistry' and 'narrativeVoice'.
          3. Strategic Vectors: Analyze their 'desireVectors' (moreOf, lessOf, experiment).
          
          OUTPUT: JSON with:
          - profileManifesto: A short, powerful manifesto summarizing their vibe (2-3 sentences).
          - strategicOpportunity: A strategic insight on how they can leverage their aesthetic for authority.
          - aestheticDirectives: Array of 3-5 specific visual or conceptual rules they should follow.
          - suggestedTouchpoints: Array of 3-5 cultural references or motifs that align with their profile but expand it.
        `,
        responseSchema: {
          type: Type.OBJECT,
          required: ["profileManifesto", "strategicOpportunity", "aestheticDirectives", "suggestedTouchpoints"],
          properties: {
            profileManifesto: { type: Type.STRING },
            strategicOpportunity: { type: Type.STRING },
            aestheticDirectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTouchpoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    const audit = cleanAndParse(response.text);
    const aesthetic = await generateAestheticOutput(JSON.stringify(draft), audit.suggestedTouchpoints);
    return { ...audit, aesthetic };
  });
};
export const generateRawImage = async (prompt: string, ar: string, profile?: any) => {
  return await withResilience(async (ai) => {
    const defaultStyle = "A mystical, introspective reading, reminiscent of 19th-century daguerreotypes and Victorian mirror-gazing. Ethereal, soft-focus, high-contrast black and white with subtle sepia tones. Subject is centered, surrounded by symbolic, reflective objects. Strictly avoid: 3D render, neon, tech-interfaces, or digital glowing lines. Colors: Muted, antique, reflective, atmospheric.";
    const tailorStyle = profile?.tailorDraft?.positioningCore?.aestheticCore?.eraBias || profile?.tasteProfile?.dominant_archetypes?.join(', ') || 'Editorial Observer';
    
    const finalPrompt = `SCENE AND SUBJECT: ${prompt}\n\nSTYLE AND AESTHETIC: ${tailorStyle}. ${defaultStyle}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts: [{ text: finalPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: ar as any,
          imageSize: "1K"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  });
};
export const cropImage = async (url: string, crop: any) => url;
export const generateProjectTasks = async (name: string, memo: string, artifacts: any[], profile: any) => {
  return await withResilience(async (ai) => {
    const artifactContext = artifacts.map(a => `[${a.type}] ${a.title}`).join('; ');
    const profileContext = sanitizeProfile(profile);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `PROJECT: ${name}\nMEMO: ${memo}\nARTIFACTS: ${artifactContext}\nCONTEXT: ${profileContext}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          IDENTITY: You are "The Executor", a high-level project manager for creative direction.
          TASK: Generate a list of 5-7 strategic imperatives (tasks) to move this project forward.
          STYLE: Imperative, punchy, and actionable. Avoid corporate jargon. Use "Manifesto" style language.
          OUTPUT: JSON array of objects with 'text' (the task) and 'dueDate' (YYYY-MM-DD, optional, calculated from now).
        `,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["text"],
            properties: {
              text: { type: Type.STRING },
              dueDate: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const rawTasks = cleanAndParse(response.text) || [];
    return rawTasks.map((t: any, i: number) => ({
        id: `gen_task_${Date.now()}_${i}`,
        text: t.text,
        completed: false,
        dueDate: t.dueDate,
        createdAt: Date.now()
    }));
  });
};

export const generateStrategicBlueprint = async (items: any[], memo: string, profile: any) => {
  return await withResilience(async (ai) => {
    const artifactContext = items.map(a => `[${a.type}] ${a.title}`).join('; ');
    const profileContext = sanitizeProfile(profile);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `MEMO: ${memo}\nARTIFACTS: ${artifactContext}\nCONTEXT: ${profileContext}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `
          IDENTITY: You are "The Architect", a visionary strategist.
          TASK: Define the "Fruition Trajectory" for this project.
          OUTPUT: JSON object with:
          - inciting_debris: The raw insight or problem that started this.
          - structural_pivot: The key strategic shift or decision required.
          - climax_manifest: The ultimate expression of this project (the "Launch").
          - end_product_spec: A concrete description of the final deliverable.
        `,
        responseSchema: {
          type: Type.OBJECT,
          required: ["inciting_debris", "structural_pivot", "climax_manifest", "end_product_spec"],
          properties: {
            inciting_debris: { type: Type.STRING },
            structural_pivot: { type: Type.STRING },
            climax_manifest: { type: Type.STRING },
            end_product_spec: { type: Type.STRING }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  });
};
export const generateSanctuaryReport = async (input: string, profile: any) => ({ validation: "Acknowledged." });
export const executeConfidenceModule = async (moduleId: string, inputs: any) => "Executed.";
export const generateCelestialReading = async (profile: any) => "Stars align.";
export const generateSeasonReport = async (zines: any[]) => ({ currentVibe: "Neutral", cliqueLogic: "Standard", timestamp: Date.now() });

export const generateSovereignIdentityCard = async (tasteProfile: TasteProfile) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 'Sovereign Identity Card' based on this taste profile: ${JSON.stringify(tasteProfile)}. 
      Translate raw user 'Debris' into five high-concept aesthetic coordinates (e.g., 'Industrial Sincerity', 'Ethereal Brutalism'). 
      Include a 'Taste Drift' percentage that calculates the variance between the last 7 days of saves versus the all-time archive. 
      Output the visual as a minimalist, high-contrast SVG that feels like a luxury physical credit card.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["aestheticCoordinates", "tasteDriftPercentage", "svgVisual"],
          properties: {
            aestheticCoordinates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "description"],
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            tasteDriftPercentage: { type: Type.NUMBER },
            svgVisual: { type: Type.STRING }
          }
        }
      }
    });
    const data = cleanAndParse(response.text);
    return { ...data, generatedAt: Date.now() };
  });
};

export const generateOracleResearch = async (topic: string, profile: any) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Act as a 'Cultural Alchemist' and Trend Forecaster for Mimi Zine.
      Perform 'Deep Scrying' on the topic: ${topic}.
      
      OPERATING PRINCIPLES:
      - Latent Architecture: Look for the 'debris'—obscure references, emerging slang, or niche aesthetic clusters.
      - Live Grounding: Use Google Search to find absolute latest 'drift'.
      - Biaxial Synthesis: Map the results onto:
        - Axis X: Material (Physical/Tactile) vs. Symbolic (Ideological/Abstract)
        - Axis Y: Observable (Mainstream/Surface) vs. Hidden (Underground/Niche)
      
      OUTPUT REQUIREMENTS:
      - Thesis: 1-sentence summary of the topic's current 'vibe'.
      - Trend Clusters: 5 distinct 'fragments'.
      - Mapping: X and Y coordinates (-1 to 1) for each cluster.
      - Sources: Citations to specific articles, portfolios, or cultural critiques found via search.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["thesis", "trendClusters", "biaxialMapDescription", "sources"],
          properties: {
            thesis: { type: Type.STRING },
            trendClusters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "position", "historicalPrecedent", "contradictoryAesthetic"],
                properties: {
                  name: { type: Type.STRING },
                  position: { 
                    type: Type.OBJECT, 
                    required: ["x", "y"], 
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } 
                  },
                  historicalPrecedent: { type: Type.STRING },
                  contradictoryAesthetic: { type: Type.STRING }
                }
              }
            },
            biaxialMapDescription: { type: Type.STRING },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "url"],
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    
    const result = cleanAndParse(response.text);
    
    // Extract sources from groundingMetadata if available
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        const mappedSources = chunks
            .filter((chunk: any) => chunk.web?.uri)
            .map((chunk: any) => ({
                title: chunk.web?.title || 'Field Note',
                url: chunk.web?.uri
            }));
        result.sources = [...(result.sources || []), ...mappedSources];
    }
    
    return result;
  });
};

export const generateThreadZineSpine = async (thread: any, profile: UserProfile | null, apiKey?: string): Promise<ZinePageSpec[]> => {
  const { ai } = getClient(apiKey);
  if (!ai) throw new Error("MIMI // Oracle Unavailable");

  const artifacts = thread.artifacts || [];
  const themes = thread.themes || [];
  
  const artifactSummaries = artifacts.map((a: any, i: number) => `Artifact ${i + 1}: ${a.content_preview || a.content || 'Image/Media'}`).join('\n');
  const themeLabels = themes.map((t: any) => t.label).join(', ');
  const profileContext = sanitizeProfile(profile);

  const prompt = `You are Mimi, an aesthetic editor and curator.
The user has selected a "Thread" of their thoughts and artifacts.
Your task is to translate this thread into a narrative arc for a Zine.

User Aesthetic Profile: ${profileContext}

Thread Narrative: ${thread.narrative}
Themes: ${themeLabels}
Artifacts in order:
${artifactSummaries}

Create a sequence of pages for a Zine.
Structure the Zine as follows:
1. Page 1: An introductory reflection on the thread's overarching theme.
2. Subsequent pages: Alternate between presenting an artifact and providing a thematic reflection or interpretation of the connection between artifacts.
3. Final Page: A closing thought or synthesis of the thread.

Return a JSON array of ZinePageSpec objects.
Each object must have:
- pageNumber (number)
- headline (string, poetic and concise)
- bodyCopy (string, reflective and insightful)
- imagePrompt (string, highly descriptive visual prompt for an image that captures the mood)
- pageType (string, either 'standard' or 'thread_timeline')
- threadData (optional object with 'commentary' string if pageType is 'thread_timeline')

Make at least one page a 'thread_timeline' page that summarizes the journey.

JSON FORMAT:
[
  {
    "pageNumber": 1,
    "headline": "...",
    "bodyCopy": "...",
    "imagePrompt": "...",
    "pageType": "standard"
  },
  ...
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pageNumber: { type: Type.NUMBER },
              headline: { type: Type.STRING },
              bodyCopy: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
              pageType: { type: Type.STRING },
              threadData: {
                type: Type.OBJECT,
                properties: {
                  commentary: { type: Type.STRING }
                }
              }
            },
            required: ["pageNumber", "headline", "bodyCopy", "imagePrompt"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const pages = JSON.parse(text) as ZinePageSpec[];
    
    // Generate aesthetic output for the zine
    const aesthetic = await generateAestheticOutput(thread.narrative, thread.themes.map((th: any) => th.label));
    
    // Inject artifacts into threadData for the timeline page
    return pages.map(p => {
      if (p.pageType === 'thread_timeline') {
        return {
          ...p,
          aesthetic, // Add aesthetic output here
          threadData: {
            ...p.threadData,
            commentary: p.threadData?.commentary || thread.narrative,
            artifacts: thread.artifacts
          }
        };
      }
      return p;
    });
  } catch (e) {
    console.error("MIMI // Thread Zine Generation Failed:", e);
    throw e;
  }
};

export const generateZineTitlesFromThreads = async (threads: any[], profile: UserProfile | null, apiKey?: string): Promise<string[]> => {
  const { ai } = getClient(apiKey);
  if (!ai) throw new Error("MIMI // Oracle Unavailable");

  const threadDescriptions = threads.map(t => `Thread Narrative: ${t.narrative}\nThemes: ${t.themes.map((th: any) => th.label).join(', ')}`).join('\n\n');
  const profileContext = sanitizeProfile(profile);

  const prompt = `You are Mimi, an aesthetic editor.
The user has selected multiple threads of their thoughts.
Generate 5 potential evocative, poetic, and concise Zine titles that capture the essence of these combined threads.

User Aesthetic Profile: ${profileContext}

Threads:
${threadDescriptions}

Return a JSON array of 5 strings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text) as string[];
  } catch (e) {
    console.error("MIMI // Title Generation Failed:", e);
    return ["Untitled Manifest"];
  }
};

export const generateInstagramPostIdeas = async (vibe: string, profile: UserProfile | null) => {
  return await withResilience(async (ai) => {
    const profileData = sanitizeProfile(profile);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 genuinely doable, ultra-chic Instagram post ideas based on the user's vibe: "${vibe}".
      
      USER PROFILE: ${profileData}
      
      MANDATE:
      - The ideas must be actionable and fit the user's vibe.
      - Maintain an ultra-chic, high-fashion, yet intimate and supportive tone.
      - Include a visual directive for each post.
      - Output strictly valid JSON with keys: "post1", "post2", "post3".
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["post1", "post2", "post3"],
          properties: {
            post1: { type: Type.STRING },
            post2: { type: Type.STRING },
            post3: { type: Type.STRING }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  });
};

export async function generateAestheticSiblings(userTaste: any): Promise<{ name: string; explanation: string }[]> {
  return withResilience(async (ai) => {
    const prompt = `
      Analyze the following aesthetic taste profile: ${JSON.stringify(userTaste)}.
      Identify 3 "aesthetic siblings" for this user—artists, movements, or styles that resonate with their taste.
      For each sibling, provide a name and a brief, insightful explanation of why they are a sibling.
      Return the result as a JSON array of objects with 'name' and 'explanation' fields.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["name", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  });
}
