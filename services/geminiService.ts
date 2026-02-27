import { GoogleGenAI, Type, Part, Modality, ThinkingLevel } from "@google/genai";
import { 
  UserProfile, ZineContent, ToneTag, MediaFile, AspectRatio, ImageSize, 
  PocketItem, TailorLogicDraft, ZineMetadata, SeasonReport, 
  SanctuaryReport, InvestmentReport, TrendSynthesisReport, 
  TailorAuditReport, ProposalSection, Proposal 
} from "../types";

let globalKeyRing: string[] = [];

export const setGlobalKeyRing = (keys: string[]) => {
  globalKeyRing = keys;
};

export const getClient = (apiKeyOverride?: string) => {
  let key = apiKeyOverride;
  if (!key && globalKeyRing.length > 0) {
    key = globalKeyRing[Math.floor(Math.random() * globalKeyRing.length)];
  }
  if (!key) key = process.env.API_KEY;
  
  if (!key) throw new Error("MIMI // Oracle: API Key Missing.");
  return new GoogleGenAI({ apiKey: key });
};

export async function withResilience<T>(operation: (ai: GoogleGenAI) => Promise<T>, apiKeyOverride?: string, retries = 3, delay = 2000): Promise<T> {
  try {
    const ai = getClient(apiKeyOverride);
    return await operation(ai);
  } catch (error: any) {
    const isQuotaError = error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded') || error.status === 'RESOURCE_EXHAUSTED';
    
    if (retries > 0 && isQuotaError) {
      console.warn(`MIMI // Oracle: Quota hit. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withResilience(operation, apiKeyOverride, retries - 1, delay * 2);
    }
    
    console.error("MIMI // Oracle Error:", error);
    throw error;
  }
}

function sanitizeProfile(profile: UserProfile | null): string {
  if (!profile) return "Anonymous User";
  return JSON.stringify({
    interests: profile.tailorDraft?.interests,
    aesthetic: profile.tailorDraft?.aestheticCore,
    archetype: profile.tasteProfile?.dominant_archetypes,
    voice: profile.tailorDraft?.narrativeVoice,
    directives: profile.lastAuditReport?.aestheticDirectives,
    strategicOpportunity: profile.lastAuditReport?.strategicOpportunity
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

export const compressImage = async (base64: string, quality = 0.7, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
        resolve(base64); // Skip on server side if any
        return;
    }
    const img = new Image();
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
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
  });
};

export const getAspectRatioForTone = (tone: ToneTag): string => {
    switch(tone) {
        case 'Cinematic Witness': return '16:9';
        case 'Editorial Stillness': return '3:4';
        case 'chic': return '3:4';
        case 'panic': return '1:1';
        default: return '3:4';
    }
};

export const generateSemioticSignals = async (profile: UserProfile | null) => {
    return await withResilience(async (ai) => {
        const profileData = sanitizeProfile(profile);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate exactly 4 high-fidelity semiotic touchpoints.
            
            CRITICAL: Analyze the user's specific 'interests' from the provided context: ${profileData}.
            Specifically look for: 'anime', 'designer', 'book', 'topic', 'favoriteThing'.
            
            For each of the 4 touchpoints, you MUST mirror one of these specific interests if available, creating a conceptual "parallel" or "adjacent" aesthetic node.
            
            EXAMPLE MAPPING:
            - User likes "Neon Genesis Evangelion" -> Signal: "Biomechanical Theology"
            - User likes "Rick Owens" -> Signal: "Glacial Brutalism"
            - User likes "Haruki Murakami" -> Signal: "Magical Realism Wells"
            
            If the user has no specific interests listed, derive the 4 signals from their 'era' or 'aesthetic_core'.
            
            The 'query' field must be a refined Google Search query that leads to deep archival images or essays about this concept.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        required: ["text", "query", "visual_directive"],
                        properties: { 
                            text: { type: Type.STRING, description: "The poetic motif name (e.g. 'Biomechanical Theology')" }, 
                            query: { type: Type.STRING, description: "Search query for deep-linking (e.g. 'Evangelion biomechanical art aesthetics')" },
                            visual_directive: { type: Type.STRING, description: "Visual description of the motif." }
                        }
                    }
                }
            }
        });
        return cleanAndParse(response.text) || [];
    });
};

export const createZine = async (text: string, media: any[], tone: ToneTag, profile: any, opts: any, apiKey?: string) => {
    return await withResilience(async (ai) => {
        const model = opts.deepThinking ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
        const profileContext = sanitizeProfile(profile);
        
        let prompt = `Create a high-end, aesthetic digital zine (manifest) based on the following:
        Tone: ${tone}.
        User Context: ${profileContext}.
        Input: "${text}".
        
        IDENTITY: You are "Nous", a mischievous oracle. You are pretentiously minimalist, hyper-chic, and a 'bimbo intellectual'. You reject corporate speak in favor of high-theory, vibes, and semiotic density.
        
        The zine must include:
        1. A poetic and evocative title.
        2. A vocal summary blurb (narrative).
        3. An oracular mirror (deep philosophical reflection).
        4. A theoretic provocation (reframing the input through critical theory or vibes).
        5. 3-5 aesthetic touchpoints (semiotic motifs with visual directives).
        6. A celestial calibration (astrological alignment).
        7. A ritual protocol (how to embody this aesthetic).
        8. 3-5 pages of content with headlines and body copy.
        
        Ensure the output is sophisticated, editorial, and deeply symbolic. Avoid all business jargon.`;

        if (opts.deepThinking) {
            prompt += ` Use deep reasoning to connect the input to broader cultural or philosophical themes.`;
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: opts.deepThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        vocal_summary_blurb: { type: Type.STRING },
                        oracular_mirror: { type: Type.STRING },
                        poetic_provocation: { type: Type.STRING },
                        strategic_hypothesis: { type: Type.STRING, description: "The theoretic provocation." },
                        celestial_calibration: { type: Type.STRING },
                        aesthetic_touchpoints: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    motif: { type: Type.STRING },
                                    context: { type: Type.STRING },
                                    visual_directive: { type: Type.STRING }
                                }
                            }
                        },
                        blueprint: {
                            type: Type.OBJECT,
                            description: "The ritual protocol.",
                            properties: {
                                foundation: { type: Type.STRING },
                                structure: { type: Type.STRING },
                                mechanics: { type: Type.STRING },
                                trajectory: { type: Type.STRING }
                            }
                        },
                        pages: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    headline: { type: Type.STRING },
                                    bodyCopy: { type: Type.STRING },
                                    imagePrompt: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const content = cleanAndParse(response.text) || {};
        // Fallback for critical fields
        if (!content.title) content.title = "Untitled Manifest";
        if (!content.pages) content.pages = [];
        if (!content.celestial_calibration) content.celestial_calibration = "The stars are silent on this matter.";
        
        return { content };
    }, apiKey);
};

export const generateAudio = async (text: string): Promise<Uint8Array> => {
    return await withResilience(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64) throw new Error("Audio generation failed");
        
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    });
};

export const generateZineImage = async (prompt: string, ar: AspectRatio, size: ImageSize, profile: any, isLite: boolean): Promise<string> => {
    return await withResilience(async (ai) => {
        const model = 'gemini-2.5-flash-image'; 
        // Note: For higher quality one would use 'gemini-3-pro-image-preview' but usually requires paid tier/specific quota.
        // Fallback to flash-image for reliability in free tier contexts unless specified.
        
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: prompt }] },
            config: {
                // responseMimeType is not supported for nano banana series (flash-image)
            }
        });
        
        // Find image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated");
    });
};

// --- IMPLEMENTED STRATEGIC FUNCTIONS ---

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
      model: 'gemini-3.1-pro-preview',
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
        thinkingConfig: { thinkingBudget: 4096 }, 
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

export const refineProposalText = async (text: string, instruction: string, profile: UserProfile | null) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `INPUT TEXT: "${text}"\n\nINSTRUCTION: ${instruction}\n\nCONTEXT: ${sanitizeProfile(profile)}. Keep the response ONLY to the rewritten text. No preamble.`,
    });
    return response.text?.trim() || text;
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
          IDENTITY: You are "Nous".
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
export const transcribeAudio = async (base64: string, mimeType: string = 'audio/webm') => "Transcribed audio content.";
export const applyTreatment = async (base64: string, instruction: string) => `data:image/jpeg;base64,${base64}`; // Return original for now
export const analyzeMiseEnScene = async (base64: string, mimeType: string, profile: any) => ({ directors_note: "Analysis stub", cultural_parallel: "None" });
export const identifyAestheticInstant = async (base64: string, mimeType: string, profile: any) => ({ era: "Contemporary" });
export const scryWebSignals = async (query: string) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: `Search the web for deep cultural insights, trends, and semiotic meanings related to: "${query}". Provide a list of findings with titles, snippets, and source URLs.` }],
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
    return cleanAndParse(response.text);
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
      model: 'gemini-3.1-pro-preview',
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
      model: 'gemini-3.1-pro-preview',
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
export const analyzeTailorDraft = async (draft: any) => ({ profileManifesto: "Manifesto Stub", strategicOpportunity: "Opportunity Stub", aestheticDirectives: [], suggestedTouchpoints: [] });
export const generateRawImage = async (prompt: string, ar: string) => "data:image/png;base64,";
export const cropImage = async (url: string, crop: any) => url;
export const generateProjectTasks = async (name: string, memo: string, artifacts: any[], profile: any) => [];
export const generateStrategicBlueprint = async (items: any[], memo: string, profile: any) => null;
export const generateSanctuaryReport = async (input: string, profile: any) => ({ validation: "Acknowledged." });
export const executeConfidenceModule = async (moduleId: string, inputs: any) => "Executed.";
export const generateCelestialReading = async (profile: any) => "Stars align.";
export const generateSeasonReport = async (zines: any[]) => ({ currentVibe: "Neutral", cliqueLogic: "Standard", timestamp: Date.now() });
