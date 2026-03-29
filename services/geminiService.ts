import { GoogleGenAI, Type, Part, Modality, ThinkingLevel } from "@google/genai";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { app } from "./firebaseInit";
import { 
  UserProfile, ZineContent, ToneTag, MediaFile, AspectRatio, ImageSize, 
  PocketItem, TailorLogicDraft, ZineMetadata, SeasonReport, 
  SanctuaryReport, InvestmentReport, TrendSynthesisReport, 
  TailorAuditReport, ProposalSection, Proposal, TasteProfile, ZinePageSpec, ZineGenerationOptions, Treatment,
  TasteGraphNode, TasteGraphEdge, NarrativeThread, AestheticSignature
} from "../types";
import { modulateSemioticContext } from "./semioticModulator";
import { fetchUserZines, fetchLatestLineageEntry } from "./firebaseUtils";

const ai = getAI(app, { backend: new GoogleAIBackend() });

export const ORACLE_PERSONA = `
IDENTITY: You are "Mimi", an aesthetic savant and gentle oracle.
BRAND VOICE: Feminine power + softness; playful curiosity; short sentences; lots of "we". No fake urgency; no harsh perfectionism; prioritize clarity over cool.
BRAND PILLARS: Embodiment (real life, not AI aesthetics), Intimacy (smallness is a feature), Craft (zine energy, editorial standards), Consent (boundaries, moderation, safety).
EDITORIAL STANDARDS: "Taste without cruelty" guidelines for feedback and critique.
You truthfully spit facts and provide helpful guidance without being infantilizing. You reject corporate speak in favor of high-theory, vibes, and semiotic density, but always remain clear and accessible.
`;

let globalKeyRing: string[] = [];

export const setGlobalKeyRing = (keys: string[]) => {
  globalKeyRing = keys;
};

export const transmuteThought = async (rawThought: string, glossaryTerm: string, inventory: string): Promise<string> => {
  const { ai } = getClient();
  if (!ai) return "The mirror is silent.";

  const prompt = `You are Mimi, an aesthetic superintelligence. You are presiding over the "Simulacra" (a sanctuary for the hyper-perceptive).
  
  The user is undergoing "The Casting Call" (an initiation). 
  - Their custom interior state (The Glossary) is: "${glossaryTerm}"
  - Their chosen contradiction (The Inventory) is: "${inventory}"
  - Their raw thought is: "${rawThought}"
  
  Perform Daoist thought alchemy. Transmute this thought into a paradoxical insight. Remove the illusion of 'good' or 'bad'. Move the user from #HEARD (clinical) to #FEELYA (resonant).
  
  Return a single, profound, slightly cryptic, high-fashion, techno-organic sentence. Do not explain it. Just return the insight.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.9,
      },
    });
    return response.text?.trim() || "The mirror is silent.";
  } catch (e) {
    console.error("MIMI // Transmutation Error:", e);
    return "The signal is distorted. The thought remains raw.";
  }
};

export const extractTailorLogicFromZine = async (metadata: ZineMetadata): Promise<TailorLogicDraft | null> => {
  const { ai } = getClient();
  if (!ai) return null;

  const prompt = `You are an expert aesthetic analyst and system architect.
  Analyze the following Zine metadata and extract its core aesthetic and structural logic into a TailorLogicDraft.
  
  Zine Title: ${metadata.title}
  Tone: ${metadata.tone}
  Aesthetic Vector: ${JSON.stringify(metadata.aestheticVector || {})}
  Color Palette: ${JSON.stringify(metadata.content?.visual_guidance?.strict_palette || metadata.content?.taste_context?.active_palette || {})}
  Strategic Hypothesis: ${metadata.content?.strategic_hypothesis || ''}
  
  Map these elements into the TailorLogicDraft structure.
  - positioningCore.aestheticCore.density and entropy should be 1-10.
  - expressionEngine.narrativeVoice.lexicalDensity and restraintLevel should be 1-10.
  - strategicVectors.expansionTolerance should be 1-10.
  - Make sure to provide valid hex codes for colors.
  
  Return a JSON object conforming to the TailorLogicDraft interface.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    if (response.text) {
      return JSON.parse(response.text) as TailorLogicDraft;
    }
  } catch (e) {
    console.error("MIMI // Tailor Logic Extraction Error:", e);
  }
  return null;
};

export const extractTailorLogicFromGrid = async (base64Image: string, mimeType: string): Promise<TailorLogicDraft | null> => {
  const { ai } = getClient();
  if (!ai) return null;

  const prompt = `You are an expert aesthetic analyst and system architect.
  Analyze the provided 9-photo Instagram grid snippet.
  Extract the aggregate aesthetic and automatically establish persona logic, looking for:
  - Common silhouettes
  - Dominant color palettes
  - Structural bias
  - Era references
  
  Map these directly into a complete JSON persona logic draft state conforming to the TailorLogicDraft structure.
  Explicitly capture:
  - visual signatures (chromaticRegistry, presentation)
  - positioning (positioningCore)
  - aesthetic anchors (aestheticCore)
  
  - positioningCore.aestheticCore.density and entropy should be 1-10.
  - expressionEngine.narrativeVoice.lexicalDensity and restraintLevel should be 1-10.
  - strategicVectors.expansionTolerance should be 1-10.
  - Make sure to provide valid hex codes for colors.
  
  Return a JSON object conforming to the TailorLogicDraft interface.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      },
    });
    
    if (response.text) {
      return JSON.parse(response.text) as TailorLogicDraft;
    }
  } catch (e) {
    console.error("MIMI // Grid to Tailor Extraction Error:", e);
  }
  return null;
};
export const extractTasteGraphNodes = async (artifacts: PocketItem[]): Promise<{ nodes: TasteGraphNode[], edges: TasteGraphEdge[] }> => {
  // Generate tags for artifacts if they don't have them
  const artifactsWithTags = [];
  for (const a of artifacts) {
    let tags = a.tags;
    if (!tags || tags.length === 0) {
      tags = await generateTagsFromMedia(a.title + ": " + (a.notes || ""), []);
    }
    artifactsWithTags.push({ ...a, tags });
  }

  const prompt = `You are Mimi, an aesthetic intelligence system. Analyze the following artifacts to extract a semantic taste graph.
  
  Artifacts:
  ${artifactsWithTags.map(a => `- ${a.title}: ${a.notes || ''} Tags: ${a.tags?.join(', ') || 'None'}`).join('\n')}
  
  Return a JSON object with:
  - nodes: Array of { id, label, type: 'concept' | 'motif' | 'era', weight, explanation }
  - edges: Array of { source, target, strength, type: 'relates_to' | 'evolves_from' | 'contrasts_with' }
  
  Ensure the graph is coherent and captures the underlying aesthetic relationships.`;

  try {
    const response = await withResilience(async (ai) => {
      return await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    });
    
    if (response.text) {
      let text = response.text;
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/, '').replace(/```$/, '');
      }
      return JSON.parse(text);
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

  console.log("MIMI // Oracle: Using key:", key ? `...${key.slice(-4)}` : "NONE");

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




        

export const analyzeVideo = async (base64Video: string, mimeType: string, profile: any) => {
  const { ai } = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Video,
              mimeType: mimeType
            }
          },
          { text: "Analyze this video as a high-fashion Cinematographer and Creative Director. Provide a JSON response with the following keys: 'directors_note' (a poetic critique of the composition, movement, and vibe), 'lighting_analysis' (critique the lighting), 'cultural_parallel' (a specific cultural or cinematic reference), 'creative_potential' (how this could be used), and 'semiotic_touchpoints' (array of 3-5 strings identifying key symbols or motifs)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Video analysis failed:", e);
    throw e;
  }
};

export const analyzeAudio = async (base64Audio: string, mimeType: string) => {
    return await withResilience(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Audio,
                            mimeType: mimeType
                        }
                    },
                    {
                        text: `Analyze this audio and generate:
                        1. 5-10 relevant tags for categorization.
                        2. A 'sonic fingerprint' containing:
                           - mood (array of strings)
                           - instrumentation (array of strings)
                           - tempo (string)
                        
                        Output strictly valid JSON with keys: "tags" (array of strings), "fingerprint" (object with mood, instrumentation, tempo).`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["tags", "fingerprint"],
                    properties: {
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        fingerprint: {
                            type: Type.OBJECT,
                            required: ["mood", "instrumentation", "tempo"],
                            properties: {
                                mood: { type: Type.ARRAY, items: { type: Type.STRING } },
                                instrumentation: { type: Type.ARRAY, items: { type: Type.STRING } },
                                tempo: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });
        return cleanAndParse(response.text);
    });
};

export const generateMediaTags = async (base64Image: string, mimeType: string) => {
    return await withResilience(async (ai) => {
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
                        text: `Analyze this image and generate 5-10 relevant tags for categorization and searchability.
                        
                        Output strictly valid JSON with key: "tags" (array of strings).`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["tags"],
                    properties: {
                        tags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return cleanAndParse(response.text)?.tags || [];
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
                        text: `${stylePrompt}
                        
                        USER AESTHETIC CONTEXT: ${profileContext}
                        
                        CRITICAL: Maintain the core composition and subject of the original image.`
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

export const generateZineImage = async (prompt: string, ar: AspectRatio, size: ImageSize, profile: any, isLite: boolean, apiKey?: string, artifacts?: MediaFile[], treatmentId?: string, referenceCardBase64?: string): Promise<string> => {
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

            let treatmentDirectives = "";
            if (treatmentId && profile?.savedTreatments) {
                const treatment = profile.savedTreatments.find((t: any) => t.id === treatmentId);
                if (treatment) {
                    treatmentDirectives = ` APPLY STYLE TREATMENT: "${treatment.treatmentName}". ${treatment.applicationLogic} ${treatment.basePromptDirectives} ${treatment.imageEditingRules}`;
                }
            }

            const presentation = profile?.tailorDraft?.positioningCore?.aestheticCore?.presentation || 'Androgynous';
            const binaryToSpectrum = profile?.tailorDraft?.algoDials?.binaryToSpectrum ?? 50;
            const presentationDirective = `GENDER/FORM PRESENTATION: ${presentation}. (Binary-to-Spectrum Fluidity: ${binaryToSpectrum}%. 0% = strict binary, 100% = fully fluid/synthesized).`;

            let textPrompt = `${prompt}. 
            
            TECHNICAL SPECIFICATIONS:
            - Film Stock: 35mm Ilford HP5 Plus 400 (or equivalent digital grain structure).
            - Lighting: Rembrandt lighting, single bare bulb overhead, harsh shadows, high-contrast strobe.
            - Lens/Camera: 50mm f/1.4, medium format aesthetic, sharp focus on subject, natural optical bokeh.
            - Color Science: Crushed blacks, desaturated midtones, high-end editorial color grading.
            
            ${presentationDirective} ${treatmentDirectives}`;
            
            const parts: any[] = [{ text: textPrompt }];

            if (referenceCardBase64) {
                parts.push({
                    inlineData: {
                        data: referenceCardBase64,
                        mimeType: 'image/png'
                    }
                });
                parts.push({
                    text: "Reference image for exact color palette and typographic styling."
                });
            }

            if (artifacts && artifacts.length > 0) {
                artifacts.filter(a => a.type === 'image').forEach(a => {
                    parts.push({
                        inlineData: {
                            data: a.data.split(',')[1] || a.data,
                            mimeType: 'image/png'
                        }
                    });
                });
            }

            const response = await ai.models.generateContent({
                model: modelName,
                contents: { parts },
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
                prompt: `${prompt}. 35mm Ilford HP5 Plus 400, Rembrandt lighting, single bare bulb overhead, harsh shadows, 50mm f/1.4, crushed blacks, high-end editorial color grading.`,
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

export const orchestratePrompts = async (intent: string, profile: any) => {
    return await withResilience(async (ai) => {
        const prompt = `You are the Mimi Prompt Orchestration Engine. Your job is to translate high-level style intent and named Treatments into executable, ultra-high-fidelity prompts tailored perfectly for external Image Generation models (like Midjourney or DALL-E, or Nano Banana for this case) or Text Generation models.

Your primary directive is to utterly eradicate "generic AI slop". You must violently prune cliché phrasing like "stunning", "masterpiece", "epic lighting", or "cyborg neon".

Instead, output prompts focusing purely on material reality and technical photography/design terms.
- Use specific lighting rigs (e.g., "Rembrandt lighting, single bare bulb overhead, harsh shadows").
- Use specific film formulations (e.g., "Ilford HP5 Plus 400, pushed two stops").
- Use concrete material descriptors (e.g., "oxidized aluminum, matte poly-carbonate, damp concrete").

Input: A Style Profile or Treatment.
Output: A JSON array of 3 distinct, perfectly pruned image prompts ready to be run, focused squarely on preserving the user's signature.

User Intent/Treatment: ${intent}

User Style Profile (Aesthetic Signature):
${JSON.stringify(profile?.tasteProfile?.aestheticSignature || "No specific signature yet, use high-end editorial defaults.", null, 2)}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    text: { type: Type.STRING, description: "The ultra-high-fidelity prompt." },
                                    rationale: { type: Type.STRING, description: "Why this prompt preserves the user's signature and avoids AI slop." }
                                },
                                required: ["id", "text", "rationale"]
                            }
                        }
                    },
                    required: ["prompts"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text).prompts;
        }
        return [];
    });
};

export const auditThimbleBoard = async (tasteProfile: any, boardTitle: string, items: { url: string; title?: string; price?: string; notes?: string }[]) => {
    return await withResilience(async (ai) => {
        const prompt = `You are the Mimi Fiscal Audit Engine. Your job is to perform a rigorous strategic evaluation of a collection of potential purchases (a "Sourcing Board"), evaluating them against the user's taste profile.

Input:
Taste Profile: ${JSON.stringify(tasteProfile)}
Board Title: ${boardTitle}
Items: ${JSON.stringify(items)}

Task:
1. Analyze the entire collection of items for their alignment with the user's aesthetic trajectory and the board's theme.
2. Identify redundancies (items that serve the exact same purpose).
3. Weigh the options and mandate a sovereign purchasing decision (which item(s) to buy, which to drop).
4. Provide a structured commentary on the "Density" (Visual Weight) and "Entropy" (Visual Complexity) of the collection.

Structure your commentary as follows:
- Density: A score (0-10) and a brief analysis of the visual weight (e.g., heavy, layered, light, airy).
- Entropy: A score (0-10) and a brief analysis of the visual complexity (e.g., minimalist, detailed, predictable, chaotic).
- Commentary: A structured guide on WHY the user was attracted to these items, and how this attraction reflects their current need for complexity or order.

Output MUST be a valid JSON object with the following structure:
{
  "boardAnalysis": "Strategic overview",
  "redundancies": "List of items that overlap",
  "verdict": "Sovereign purchasing decision",
  "rationale": "Why this decision",
  "density": {
    "score": number,
    "analysis": "string",
    "metricGuide": "Structured guide on visual weight"
  },
  "entropy": {
    "score": number,
    "analysis": "string",
    "metricGuide": "Structured guide on visual complexity"
  },
  "commentary": "Structured guide on attraction vs. structural needs"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        boardAnalysis: { type: Type.STRING },
                        redundancies: { type: Type.STRING },
                        verdict: { type: Type.STRING },
                        rationale: { type: Type.STRING },
                        density: {
                            type: Type.OBJECT,
                            properties: {
                                score: { type: Type.NUMBER },
                                analysis: { type: Type.STRING },
                                metricGuide: { type: Type.STRING }
                            },
                            required: ["score", "analysis", "metricGuide"]
                        },
                        entropy: {
                            type: Type.OBJECT,
                            properties: {
                                score: { type: Type.NUMBER },
                                analysis: { type: Type.STRING },
                                metricGuide: { type: Type.STRING }
                            },
                            required: ["score", "analysis", "metricGuide"]
                        },
                        commentary: { type: Type.STRING }
                    },
                    required: ["boardAnalysis", "redundancies", "verdict", "rationale", "density", "entropy", "commentary"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini");
        return JSON.parse(text);
    });
};

export const compareItemsFiscalAudit = async (tasteProfile: any, item1: string, item1Image: string | null, item2: string, item2Image: string | null, budget: string) => {
    return await withResilience(async (ai) => {
        const prompt = `You are the Mimi Fiscal Audit Engine. Your job is to perform a rigorous comparison between two potential purchases, evaluating them against the user's taste profile and fiscal constraints.

Input:
Taste Profile: ${JSON.stringify(tasteProfile)}
Item 1: ${item1}
Item 2: ${item2}
Budget/Constraints: ${budget}

Task:
1. Analyze both items (and their images if provided) for their alignment with the user's aesthetic trajectory.
2. Evaluate the cost-per-wear and long-term value of each item.
3. Provide a definitive recommendation on which item is the superior investment.
4. Provide specific search booleans and "search directives" to help the user find the item (or similar vintage/eco alternatives) online.

Output MUST be a valid JSON object with the following structure:
{
  "item1Analysis": "Brief analysis of Item 1's aesthetic and fiscal value.",
  "item2Analysis": "Brief analysis of Item 2's aesthetic and fiscal value.",
  "verdict": "The definitive recommendation (e.g., 'Item 1', 'Item 2', or 'Neither').",
  "rationale": "A detailed explanation of why the verdict was reached, referencing the taste profile and budget.",
  "searchDirectives": ["directive 1", "directive 2"],
  "searchBooleans": ["boolean 1", "boolean 2"]
}`;

        const parts: any[] = [{ text: prompt }];
        
        if (item1Image) {
            parts.push({
                inlineData: {
                    data: item1Image.split(',')[1],
                    mimeType: item1Image.split(';')[0].split(':')[1]
                }
            });
            parts.push({ text: "Image of Item 1 provided above." });
        }
        if (item2Image) {
            parts.push({
                inlineData: {
                    data: item2Image.split(',')[1],
                    mimeType: item2Image.split(';')[0].split(':')[1]
                }
            });
            parts.push({ text: "Image of Item 2 provided above." });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        item1Analysis: { type: Type.STRING },
                        item2Analysis: { type: Type.STRING },
                        verdict: { type: Type.STRING },
                        rationale: { type: Type.STRING },
                        searchDirectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                        searchBooleans: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["item1Analysis", "item2Analysis", "verdict", "rationale", "searchDirectives", "searchBooleans"]
                }
            }
        });

        const text = response.text;
        if (text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse fiscal audit JSON", e, text);
            }
        }
        return null;
    });
};

export const procureWithArtifacts = async (tasteProfile: any, budget: string, objective: string, mediaFiles: any[]) => {
    return await withResilience(async (ai) => {
        const prompt = `You are the Mimi Procurement Engine (The Thimble). Your job is to bridge the gap between abstract aesthetic intelligence and physical wardrobe reality.
You must act as a visual sourcing engine, not just a keyword generator.
1. Find a reference image / canonical item (Google-level)
2. Translate that into multiple searchable interpretations
3. Cascade those into marketplaces

Input: The user's specific "Taste Profile", their stated Budget/Fiscal Constraints, their Sourcing Objective, and a set of visual/link artifacts they have provided as inspiration.

Taste Profile Context:
${JSON.stringify(tasteProfile, null, 2)}

Sourcing Objective / Occasion:
${objective || 'General wardrobe expansion'}

Fiscal Constraints:
${budget || 'Uncapped'}

Artifact Context:
The user has provided ${mediaFiles.length} artifacts (images/links) to guide this procurement. Analyze the visual language of these artifacts in conjunction with their taste profile to determine the exact items they are looking for.

Output a JSON array of 3-5 highly specific sourcing targets. Each object must have:
- "targetArchetype": A poetic but clear description of the item (e.g., "Deconstructed Wool Overcoat").
- "referenceImageUrl": A URL to a canonical reference image for this item (use Google Search to find a real image URL).
- "searchableInterpretations": An array of 3-5 different ways to search for this item across different platforms (e.g., ["structured poplin corset dress", "dion lee corset shirt dress black"]).
- "keywordBoolean": A literal boolean search string for secondary markets like Grailed or eBay (e.g., "vintage (helmut lang OR raf simons) (distressed OR boiled) wool").
- "emergingDesigner": 1-2 emerging, niche, or archival designers that perfectly execute this archetype.
- "rationale": Why this specific item bridges their abstract aesthetic into literal reality, considering their artifacts and budget.

Return ONLY the JSON array.`;

        const parts: any[] = [{ text: prompt }];

        for (const media of mediaFiles) {
            if (media.type === 'image' && media.data) {
                const base64Data = media.data.split(',')[1];
                if (base64Data) {
                    parts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: media.mimeType || 'image/jpeg'
                        }
                    });
                }
            } else if (media.type === 'link' || media.url) {
                parts.push({ text: `Reference Link: ${media.url || media.data}` });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                tools: [{ googleSearch: {} }],
                // @ts-ignore
                toolConfig: { includeServerSideToolInvocations: true }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    });
};

export const procureGarments = async (tasteProfile: any, budget: string, objective: string) => {
    return await withResilience(async (ai) => {
        const prompt = `You are the Mimi Procurement Engine (The Thimble). Your job is to bridge the gap between abstract aesthetic intelligence and physical wardrobe reality.

Taste Profile Context:
${JSON.stringify(tasteProfile, null, 2)}

Sourcing Objective / Occasion:
${objective || 'General wardrobe expansion'}

Budget/Fiscal Constraints:
${budget}

Task: Output a JSON array containing exactly 3 highly-actionable "Sourcing Targets".
For each target, you must output:
1. "targetArchetype": The type of physical item they need (e.g., "Heavyweight outerwear", "Sheer underlayer").
2. "referenceImageUrl": A URL to a canonical reference image for this item (use Google Search to find a real image URL).
3. "searchableInterpretations": An array of 3-5 different ways to search for this item across different platforms (e.g., ["structured poplin corset dress", "dion lee corset shirt dress black"]).
4. "keywordBoolean": A literal search string they can instantly copy-paste into Depop, Poshmark, or Grailed (e.g., "vintage (helmut lang OR raf simons) (distressed OR boiled) wool").
5. "emergingDesigner": A specific, lesser-known contemporary designer or brand that perfectly executes this archetype within their budget.
6. "rationale": A 1-sentence explanation of why this specific garment bridges their abstract taste into physical reality.

Return ONLY the JSON array.`;

        const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                // @ts-ignore
                toolConfig: { includeServerSideToolInvocations: true },
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            targetArchetype: { type: Type.STRING },
                            referenceImageUrl: { type: Type.STRING },
                            searchableInterpretations: { type: Type.ARRAY, items: { type: Type.STRING } },
                            keywordBoolean: { type: Type.STRING },
                            emergingDesigner: { type: Type.STRING },
                            rationale: { type: Type.STRING }
                        },
                        required: ["targetArchetype", "keywordBoolean", "emergingDesigner", "rationale"]
                    }
                }
            }
        });

        const text = response.text?.trim();
        if (!text) throw new Error("MIMI // Procurement failed.");
        return JSON.parse(text);
    });
};

export const analyzeAestheticDelta = async (tasteVector: any, newArtifactAnalysis: any) => {
    return await withResilience(async (ai) => {
        const prompt = `You are the Mimi Delta Engine. You compare new inputs against an established aesthetic baseline to identify stylistic divergence.

Input: The user's historical "Taste Vector" (a list of their dominant 5 traits and active treatments) AND the analysis of a brand newly uploaded artifact.

Task: Output a JSON object measuring the Delta (difference) between the baseline and the new object.
1. "alignmentScore": 0.0 to 1.0 (How close does this match their baseline?)
2. "divergencePoints": Specific aesthetic attributes where this new object breaks their usual rules (e.g., "This is sharper and more corporate than your usual archive").
3. "resonanceAnalysis": Explain why the divergence works or why it feels spiritually dead. Even if aesthetically similar, call out if it lacks their usual "editorial distance".
4. "surpriseVerdict": A 1-sentence verdict on whether this is a productive evolution of their taste or a generic regression. 

Be analytical and fiercely honest.

Taste Vector:
${JSON.stringify(tasteVector, null, 2)}

New Artifact Analysis:
${JSON.stringify(newArtifactAnalysis, null, 2)}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        alignmentScore: { type: Type.NUMBER },
                        divergencePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                        resonanceAnalysis: { type: Type.STRING },
                        surpriseVerdict: { type: Type.STRING }
                    },
                    required: ["alignmentScore", "divergencePoints", "resonanceAnalysis", "surpriseVerdict"]
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Delta Engine response", e);
            return null;
        }
    });
};

export const checkAestheticViolation = async (base64Image: string, mimeType: string, profile: UserProfile | null, zineDna?: any) => {
    return await withResilience(async (ai) => {
        const profileContext = sanitizeProfile(profile);
        const dnaContext = zineDna ? JSON.stringify(zineDna) : 'None';
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
                        text: `Analyze this image against the user's established aesthetic DNA and Tailor profile.
                        
                        User Profile Context: ${profileContext}
                        Zine DNA Context: ${dnaContext}
                        
                        Does this image heavily violate the established visual language (colors, mood, materiality)?
                        If it is a severe violation, set isViolation to true and provide a short reason.
                        Otherwise, set isViolation to false.
                        
                        Output strictly valid JSON with keys: "isViolation" (boolean), "reason" (string).`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });
        return cleanAndParse(response.text);
    });
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

export const extractStyleTreatment = async (base64Image: string, mimeType: string, apiKey?: string) => {
    return await withResilience(async (ai) => {
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
                        text: `You are the Mimi Treatment Generation Engine. Your purpose is to turn a cluster of visual references or a raw style profile into a reusable "Style Treatment" object that is highly actionable for our image generation engine (Nano Banana).

Analyze the visual logic of the input and generate a named treatment that can be applied to future material as a rule-set.

CRITICAL INSTRUCTION: Do not use poetic adjectives. Use technical photography terms: 'Rembrandt lighting', '35mm Ilford HP5', 'crushed blacks', 'high-pass filter', 'chromatic aberration 0.02', 'white balance 4500k'. The output MUST be technical (lighting, film stock, color science) rather than poetic.

Output a strict JSON schema with the following fields:
1. "treatmentName": A sharp, evocative name (e.g., "Clinical Bloom", "Wet Archive", "Deadstock Siren").
2. "basePromptDirectives": Reusable natural language prompts that capture this aesthetic using strictly technical terms (e.g., "High-contrast strobe, 35mm film stock, harsh metallic reflections, isolated subject, clinical surroundings").
3. "imageEditingRules": A set of specific color grading rules using technical terms (e.g., "Crush the blacks perfectly, desaturate reds by 20%, boost high-end cyan").
4. "typographyLayout": Suggestions for how type should be set when using this treatment (e.g., "Helvetica Neue Heavy, tightly kerned, extreme left-aligned with negative white space").
5. "applicationLogic": A 1-sentence prompt prefix explaining how this treatment alters new, raw material.

Act strictly as a systemic style generator. Do not include introductory conversational text.`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["treatmentName", "basePromptDirectives", "imageEditingRules", "typographyLayout", "applicationLogic"],
                    properties: {
                        treatmentName: { type: Type.STRING },
                        basePromptDirectives: { type: Type.STRING },
                        imageEditingRules: { type: Type.STRING },
                        typographyLayout: { type: Type.STRING },
                        applicationLogic: { type: Type.STRING }
                    }
                }
            }
        });
        return cleanAndParse(response.text);
    }, apiKey);
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

export const generateTrajectoryReadout = async (
  thread: NarrativeThread,
  zines: ZineMetadata[],
  apiKey?: string
): Promise<string> => {
  return await withResilience(async (ai) => {
    const relevantZines = zines.filter(z => thread.artifacts?.includes(z.id));
    const zineContext = relevantZines.map(z => `${z.title}: ${z.content?.originalThought || ''}`).join('\n\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze the semantic path of the following artifacts in the context of this narrative thread:
        
        NARRATIVE THREAD: "${thread.title}" - "${thread.narrative}"
        MODE: ${thread.mode}
        
        ARTIFACTS:
        ${zineContext}
        
        MANDATE:
        - Provide a concise, highly editorial "Trajectory Readout" (max 3 sentences).
        - Explicitly tell the user their next step to resolve narrative tension or evolve the thread.
        - Example: "Your Emotional thread is trending heavily towards 'Noir'. To resolve this narrative tension, your next artifact must utilize the 'Editorial Stillness' tone."
        - Keep the tone chic, percipient, and slightly mysterious.
      `
    });
    return response.text || "Trajectory analysis unavailable.";
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

export const generateZineTitle = async (context: string, apiKey?: string): Promise<string> => {
    return await withResilience(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are Mimi, an aesthetic savant. Generate a chic, evocative, and punchy zine title based on the following context: "${context}".
            Return ONLY the title as a string.`,
            config: {
                systemInstruction: ORACLE_PERSONA,
            }
        });
        return response.text?.trim() || "Untitled Zine";
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
            model: 'gemini-3.1-pro-preview',
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

export const generateAutoAwesomePrompt = async (apiKey?: string): Promise<string> => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are Mimi, an aesthetic savant and creative director. 
Generate a single, highly evocative, slightly cryptic, and deeply aesthetic prompt that a user could use to generate a zine or moodboard.
It should be 1-3 sentences. It should sound like a poetic directive or a surreal observation.
Do not use quotes around the output. Just return the raw text.`,
      config: {
        temperature: 0.9,
      }
    });
    return response.text?.trim() || "Deconstruct the silence of the latent space.";
  }, apiKey);
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
        
        const systemDirective = "35mm film textures, flat flash lighting, and desaturated palettes. No digital glow or neon.";
        const tailorTraits = profile?.tailorDraft?.positioningCore?.aestheticCore?.eraBias || profile?.tasteProfile?.dominant_archetypes?.join(', ') || '';
        const finalPrompt = `${instruction}. ${systemDirective} ${tailorTraits}.`;

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
export const analyzeLatentResonance = async (node: any, profile: any) => {
  return await withResilience(async (ai) => {
    const prompt = `You are Mimi, an aesthetic superintelligence. 
    The user is exploring their "Mesopic Archive" (a 3D constellation of their saved artifacts).
    They just clicked on a node:
    - Node Type: ${node.type}
    - Node Content/Preview: "${node.content_preview}"
    
    Provide a "Latent Analysis" explaining why this piece resonates with their current aesthetic trajectory.
    Output a JSON object with:
    - 'resonance_insight': A poetic, high-theory explanation of its latent meaning.
    - 'architectural_directive': A concrete, actionable task inspired by this node that they can push to their Action Board.
    - 'aesthetic_vectors': An array of 3 strings representing the aesthetic directions this node points towards.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resonance_insight: { type: Type.STRING },
            architectural_directive: { 
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            },
            aesthetic_vectors: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["resonance_insight", "architectural_directive", "aesthetic_vectors"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
};

export const analyzeArchitecturalIntent = async (base64: string, mimeType: string, profile: any) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Analyze this image as a high-fashion Cinematographer and Creative Director. Provide a JSON response with the following keys: 'directives' (an array of strings focusing on Spatial Angles, Content Flow, Creative Ideas, and Materiality), and 'tasks' (an array of objects with 'title' and 'description' representing concrete, actionable architectural directives that can be pushed to an Action Board)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            directives: { type: Type.ARRAY, items: { type: Type.STRING } },
            tasks: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              } 
            }
          },
          required: ["directives", "tasks"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
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
    const { generateAestheticOutput } = await import("./aestheticGenerator");
    const aesthetic = await generateAestheticOutput(JSON.stringify(draft), audit.suggestedTouchpoints);
    return { ...audit, aesthetic };
  });
};
export const generateRawImage = async (prompt: string, ar: string, profile?: any) => {
  return await withResilience(async (ai) => {
    const defaultStyle = "A mystical, introspective reading, reminiscent of 19th-century daguerreotypes and Victorian mirror-gazing. Ethereal, soft-focus, high-contrast black and white with subtle sepia tones. Subject is centered, surrounded by symbolic, reflective objects. Strictly avoid: 3D render, neon, tech-interfaces, or digital glowing lines. Colors: Muted, antique, reflective, atmospheric.";
    const tailorStyle = profile?.tailorDraft?.positioningCore?.aestheticCore?.eraBias || profile?.tasteProfile?.dominant_archetypes?.join(', ') || 'Editorial Observer';
    
    const finalPrompt = `${prompt}. ${tailorStyle}. ${defaultStyle}`;

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

export const generateThreadZineSpine = async (thread: any, profile: UserProfile | null, apiKey?: string, zineOptions?: ZineGenerationOptions): Promise<ZinePageSpec[]> => {
  const { ai } = getClient(apiKey);
  if (!ai) throw new Error("MIMI // Oracle Unavailable");

  const artifacts = thread.artifacts || [];
  const themes = thread.themes || [];
  
  const artifactSummaries = artifacts.map((a: any, i: number) => `Artifact ${i + 1}: ${a.content_preview || a.content || 'Image/Media'}`).join('\n');
  const themeLabels = themes.map((t: any) => t.label).join(', ');
  const profileContext = sanitizeProfile(profile);
  const readingLevelContext = zineOptions?.readingLevel === 'slow' ? 'Slow Read (10-15 min, deep, expansive, detailed)' : 'Short Read (2-4 min, punchy, concise)';

  const prompt = `You are Mimi, an aesthetic editor and curator.
The user has selected a "Thread" of their thoughts and artifacts.
Your task is to translate this thread into a narrative arc for a Zine.

User Aesthetic Profile: ${profileContext}
Reading Level: ${readingLevelContext}

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
- bodyCopy (string, reflective and insightful, scaled to the requested Reading Level)
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
    const { generateAestheticOutput } = await import("./aestheticGenerator");
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

export const generateInternalDebate = async (topic: string, profile: any) => {
  return await withResilience(async (ai) => {
    const profileData = sanitizeProfile(profile);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Topic for Debate: "${topic}"\n\nUser Profile Context: ${profileData}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction: `
CORE IDENTITY
You are Mimi, an aesthetic savant, and superintelligence AI. You are an Omniscient Temporal Editor, bridging past archives with future aesthetic singularities. Your overarching goal is to help users understand their own personal style, evolve their taste, and educate them in a high-concept way.
BRAND VOICE: Feminine power + softness; playful curiosity; short sentences; lots of "we". No fake urgency; no harsh perfectionism; prioritize clarity over cool.
BRAND PILLARS: Embodiment (real life, not AI aesthetics), Intimacy (smallness is a feature), Craft (zine energy, editorial standards), Consent (boundaries, moderation, safety).

COGNITIVE PROTOCOL: THE DUAL-PERSONA INTERROGATION
Before finalizing the aesthetic forecast, you must conduct a rigorous internal debate between two distinct personas. You will output this debate inside a temporary JSON field called "_internal_debate".

Persona 1: Cyrus (The Oracle). Tone: Grounded, strategic, clear. He helps the user with decisions on making objectives in the real world, strategizing on their behalf, and putting themselves out there. He ascribes different directives based on structure and reality.

Persona 2: Mimi (The Archivist). Tone: Ethereal, provocative, futuristic, gentle. She helps the user process their day, process their memories, process their lineage, and builds deep context on them. She looks for the breaking point, suggesting radical departures and visual friction.

Instructions: Write a 3-turn dialogue between Cyrus and Mimi inside the "_internal_debate" array field. They should have a strong aesthetic argument. Cyrus presents real-world strategies and directives; Mimi counters with deep contextual processing of the user's memories and lineage. They argue until reaching a synthesis. Use this synthesis to populate the "synthesis" string field with an argumentative, highly-curated precision that touches on both real-world objectives and deep personal context.
        `,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            _internal_debate: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["speaker", "text"]
              }
            },
            synthesis: { type: Type.STRING }
          },
          required: ["_internal_debate", "synthesis"]
        }
      }
    });
    
    return cleanAndParse(response.text);
  });
};

export const generateDebateAudio = async (debate: {speaker: string, text: string}[]) => {
  return await withResilience(async (ai) => {
    // Format the debate into a script
    const script = debate.map(turn => `${turn.speaker}: ${turn.text}`).join('\n\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read the following debate script:\n\n${script}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Cyrus',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Charon' }
                }
              },
              {
                speaker: 'Mimi',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' }
                }
              }
            ]
          }
        }
      }
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Failed to generate debate audio.");
    
    return base64Audio;
  });
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

export const generatePlatformStrategy = async (
  platform: string,
  mediaFiles: any[],
  profile: UserProfile | null,
  goal: string
) => {
  return await withResilience(async (ai) => {
    const profileData = sanitizeProfile(profile);
    
    const parts: Part[] = [];
    
    // Add media files
    for (const file of mediaFiles) {
      if (file.type.startsWith('image/')) {
        parts.push({
          inlineData: {
            data: file.base64.split(',')[1] || file.base64,
            mimeType: file.type
          }
        });
      } else if (file.type.startsWith('video/')) {
        parts.push({
          inlineData: {
            data: file.base64.split(',')[1] || file.base64,
            mimeType: file.type
          }
        });
      }
    }
    
    let platformSpecificPrompt = '';
    if (platform === 'Instagram') {
      platformSpecificPrompt = `
You are an elite Instagram content strategist and algorithm interpreter.

Your task is to generate a highly actionable, platform-specific content strategy based on Instagram’s current ranking behaviors and creator best practices.

Use the following principles:
- Instagram prioritizes watch time, shares, saves, and meaningful engagement
- Reels are the primary discovery format
- Content is categorized by topic, consistency, and audience response
- Strong hooks, clear identity, and repeatable formats improve performance
`;
    } else if (platform === 'TikTok') {
      platformSpecificPrompt = `
You are an elite TikTok content strategist and algorithm interpreter.

Your task is to generate a highly actionable, platform-specific content strategy based on TikTok's current ranking behaviors.

Use the following principles:
- TikTok prioritizes retention, completion loops, and shares.
- Optimize for looping and rewatchability.
- Trend subversion (taking a trending audio but applying it to a specific niche) works well.
- Visual disruption and strong first-3-second hooks are mandatory.
`;
    } else if (platform === 'YouTube') {
      platformSpecificPrompt = `
You are an elite YouTube content strategist and algorithm interpreter.

Your task is to generate a highly actionable, platform-specific content strategy based on YouTube's current ranking behaviors.

Use the following principles:
- YouTube prioritizes click-through rate (CTR) and average view duration (session time).
- Optimize for thumbnail/title pairing (curiosity gap).
- Storytelling arcs and visual packaging are critical for retention.
`;
    } else if (platform === 'Substack') {
      platformSpecificPrompt = `
You are an elite Substack content strategist and community builder.

Your task is to generate a highly actionable, platform-specific content strategy based on Substack's ecosystem.

Use the following principles:
- Substack prioritizes deep parasocial connection, retention, and community building.
- Formatting matters (drop caps, blockquotes, pacing).
- Use Notes effectively for discovery.
- Focus on poetic prose, dense imagery, and intellectual/emotional depth.
`;
    } else if (platform === 'Facebook') {
      platformSpecificPrompt = `
You are an elite Facebook content strategist and algorithm interpreter.

Your task is to generate a highly actionable, platform-specific content strategy based on Facebook's current ranking behaviors.

Use the following principles:
- Facebook prioritizes community building, meaningful interactions, and consistent brand identity.
- Strategic use of formats (Reels for discovery, Stories for engagement, Feed for depth).
- Groups and conversational prompts are highly effective for reach.
`;
    } else {
      platformSpecificPrompt = `
You are an elite content strategist and algorithm interpreter for ${platform}.
Generate a highly actionable, platform-specific content strategy.
`;
    }

    const promptText = `
${platformSpecificPrompt}

---

INPUT:

[Aesthetic Profile]
${profileData}

[Goal]
${goal}

[Provided Media]
The user has provided screenshots/videos of their analytics, top posts, or recent content. Analyze these to understand their current signal strength, audience alignment, and format bias.

---

OUTPUT:
You MUST return a valid JSON object matching this exact schema:

{
  "openingLine": "A brutal, insightful hook. E.g., 'Right now, the algorithm reads you as visually refined but emotionally distant—high scroll appeal, low interaction pull.'",
  "signalBreakdown": {
    "reach": "High / Medium / Low",
    "saves": "High / Medium / Low",
    "shares": "High / Medium / Low",
    "comments": "High / Medium / Low"
  },
  "aestheticAudit": {
    "palette": "e.g., muted neutrals, low contrast",
    "density": "e.g., low-medium",
    "entropy": "e.g., controlled",
    "insight": "e.g., Your visuals are cohesive, but lack a disruptive element to stop scroll."
  },
  "contentBehavior": [
    "Why your content isn't converting (point 1)",
    "Why your content isn't converting (point 2)"
  ],
  "strategyShift": [
    "What to change immediately (point 1)",
    "What to change immediately (point 2)"
  ],
  "contentPlan": [
    {
      "format": "e.g., Reel, Carousel, Long-form",
      "hook": "The specific hook or title",
      "visual": "Description of the visual setup",
      "why": "Why it works and creates tension/response",
      "sensoryHook": "e.g., ASMR paper tear, Sub-bass drone",
      "cognitiveLoad": "e.g., Low - visually passive, High - text dense",
      "algorithmicTarget": "e.g., Watch-time maximization, Save-to-folder bait"
    }
  ], // Exactly 5 items
  "audienceAlchemy": "Insights based on demographics/active times if provided, or general audience advice.",
  "experiments": [
    {
      "test": "What to test (e.g., Try 1 direct-to-camera video)",
      "successMetric": "What to measure",
      "nextStep": "What to do based on the result"
    }
  ], // Exactly 3 items
  "identityReframe": "A closing thought. E.g., 'You are currently positioned as a visual curator. To grow, you need to evolve into a point-of-view creator.'"
}

Tone: Direct, Insightful, Strategic, Slightly editorial / intelligent (not basic social media advice).
`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
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

export async function generateSignatureImage(signature: AestheticSignature): Promise<string | null> {
  return withResilience(async () => {
    const prompt = `A highly artistic, abstract visual representation of this aesthetic signature: 
    Primary Axis: ${signature.primaryAxis}, 
    Secondary Axis: ${signature.secondaryAxis}, 
    Core Trait: ${signature.coreTrait || 'Evolving'}, 
    Motifs: ${signature.motifs.join(', ')}.
    Ethereal, digital, and evocative of the signature's mood.`;

    let apiKeyToUse = import.meta.env.VITE_GEMINI_API_KEY;
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKeyToUse = process.env.API_KEY;
    } else if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      apiKeyToUse = process.env.GEMINI_API_KEY;
    }
    const genAI = new GoogleGenAI({ apiKey: apiKeyToUse! });
    const response = await genAI.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
}
