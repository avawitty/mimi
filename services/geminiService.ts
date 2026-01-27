
// @ts-nocheck
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ZineContent, ImageSize, AspectRatio, ToneTag, UserProfile, ZinePage, ZineMetadata, PocketItem, SeasonReport, TasteManifesto } from "../types";

export interface MediaFile {
  type: 'image' | 'audio' | 'video';
  url: string;
  data: string; // base64 data
  mimeType: string;
}

export interface CustomPalette {
  name: string;
  base: string;
  text: string;
  subtle: string;
  accent: string;
  isDark: boolean;
}

export interface SanctuaryReport {
  validation: string;
  structural_reframing: string;
  recommended_anchors: string[];
  oracle_note: string;
}

export interface MemeRefraction {
  topText: string;
  bottomText: string;
  visualPrompt: string;
  metaphor: string;
}

export interface TasteAuditReport {
  core_frequency: string;
  resonance_score: number;
  diagnosis: string;
  chromatic_mandate: string;
}

export class OracleDissonance extends Error {
  constructor(public message: string, public code: string, public details: any = {}) {
    super(message);
    this.name = 'OracleDissonance';
  }
}

/**
 * SOVEREIGN ENCODING HELPERS
 */
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * SONIC MANIFESTATION PROTOCOL
 */
export const generateAudio = async (text: string, voiceName: string = 'Kore'): Promise<Uint8Array> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say this with clinical high-fidelity elegance: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new OracleDissonance("The sonic frequency failed to manifest.", "AUDIO_FAIL");
  return decode(base64Audio);
};

export const getAspectRatioForTone = (tone: ToneTag): AspectRatio => {
  switch (tone) {
    case 'Dream': return '16:9';
    case 'Chic': return '3:4';
    case 'Unhinged': return '1:1';
    case 'Romantic': return '4:3';
    case 'Cryptic': return '2:3';
    case 'Nostalgia': return '1:1';
    case 'Academic': return '3:2';
    case 'Meme': return '9:16';
    case 'Sovereign Panic': return '1:1';
    case 'Storyline': return '16:9';
    default: return '1:1';
  }
};

/**
 * RESILIENCE PROTOCOL 22.3
 */
async function withResilience<T>(
  fn: (model: string, isDistilled: boolean) => Promise<T>, 
  modelQueue: string[], 
  retries = 4, 
  delay = 3000
): Promise<T> {
  const currentModel = modelQueue[0];
  const isDistilledAttempt = retries <= 1; 
  
  try {
    return await fn(currentModel, isDistilledAttempt);
  } catch (error: any) {
    const status = error?.status || (error?.error?.code);
    const message = error?.message || 'Unknown Signal Failure';
    
    console.warn(`MIMI // Oracle Signal Error [${status}]: ${message}`);

    if (message.includes('Requested entity was not found') || status === 404) {
        window.dispatchEvent(new CustomEvent('mimi:key_reset'));
        throw new OracleDissonance("The Sovereign key has dissolved.", "UNAUTHENTICATED");
    }

    if (message.includes('safety') || message.includes('blocked') || (status === 400 && message.includes('candidate'))) {
      throw new OracleDissonance("The signal was blocked by safety governors.", "SAFETY_BLOCK");
    }

    if (status === 429 || status === 503 || message.includes('overloaded') || message.includes('rate limit') || message.includes('saturated')) {
      if (retries > 0) {
        const nextQueue = modelQueue.length > 1 ? modelQueue.slice(1) : modelQueue;
        window.dispatchEvent(new CustomEvent('mimi:frequency_shift', { 
          detail: { model: nextQueue[0], reason: 'saturation', attempt: 5 - retries } 
        }));
        await new Promise(resolve => setTimeout(resolve, delay * (5 - retries)));
        return withResilience(fn, nextQueue, retries - 1, delay);
      }
      throw new OracleDissonance("The Hivemind is saturated. Ascent paused.", "ORACLE_EXHAUSTED", { status });
    }

    if (status === 500 || status === 400 || message.includes('JSON') || message.includes('debris') || message.includes('failed') || message.includes('parse')) {
      if (retries > 0) {
        const nextQueue = modelQueue.length > 1 ? modelQueue.slice(1) : modelQueue;
        window.dispatchEvent(new CustomEvent('mimi:frequency_shift', { 
          detail: { model: nextQueue[0], reason: 'debris', attempt: 5 - retries } 
        }));
        await new Promise(resolve => setTimeout(resolve, 1500));
        return withResilience(fn, nextQueue, retries - 1, delay);
      }
      throw new OracleDissonance("The Oracle encountered structural debris.", "ORACLE_COLLAPSE", { status });
    }

    throw new OracleDissonance(message, 'SIGNAL_VOID', { status });
  }
}

const cleanAndParse = (text: string | undefined) => {
  if (!text) throw new OracleDissonance('Empty manifestation.', 'EMPTY_SIGNAL');
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch (e) {
    const startIdx = trimmed.indexOf('{');
    const endIdx = trimmed.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      const coreJson = trimmed.substring(startIdx, endIdx + 1);
      try { return JSON.parse(coreJson); } catch (innerE) {
        try { return JSON.parse(coreJson.replace(/\r?\n|\r/g, " ")); } catch (finalE) {
          throw new OracleDissonance('Structural decoding failed.', 'PARSE_ERROR');
        }
      }
    }
    throw new OracleDissonance('No structural anchors found.', 'PARSE_ERROR');
  }
};

export const generateSeasonReport = async (zines: ZineMetadata[]): Promise<SeasonReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = zines.map(z => `${z.title}: ${z.content?.oracular_mirror || ''}`).join('\n');
  const response = await withResilience((model) => ai.models.generateContent({
    model,
    contents: `Collective Manifests:\n${context}`,
    config: { 
        systemInstruction: "You are Nous. Analyze zines and generate Season Report JSON.", 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                currentVibe: { type: Type.STRING },
                cliqueLogic: { type: Type.STRING },
                topScandal: {
                    type: Type.OBJECT,
                    properties: { headline: { type: Type.STRING }, structuralRisk: { type: Type.STRING } }
                },
                aestheticPatterns: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
    }
  }), ['gemini-3-flash-preview', 'gemini-3-pro-preview']);
  return cleanAndParse(response.text);
};

export const createZine = async (text: string, mediaFiles: MediaFile[], tone: ToneTag, profile: UserProfile | null, options: any): Promise<{ content: ZineContent; thinking?: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const activeManifesto = profile?.manifestos?.find(m => m.id === profile.activeManifestoId) || profile?.manifestos?.[0];
  const tasteContext = activeManifesto ? `ACTIVE PERSONA: ${activeManifesto.name} (${activeManifesto.archetype})` : "";

  window.dispatchEvent(new CustomEvent('mimi:telemetry_update', { detail: { status: "Initiating Reasoning Trace..." } }));

  const response = await withResilience((model, isDistilled) => {
    const artifactMandate = "IMAGE MANDATE: Generate exactly 5 pages. Each page MUST have a unique, descriptive imagePrompt. Use high-fidelity terminology (e.g., 'mercury glass', 'brutalist concrete', '35mm grain').";
    const blueprintMandate = "ROADMAP MANDATE: You MUST complete the 'blueprint' object with four distinct, descriptive narrative acts: inciting_debris, structural_pivot, climax_manifest, and end_product_spec. Do not leave these empty.";
    const contentDensity = "DENSITY MANDATE: 'bodyCopy' for each page must be substantial (80-120 words). 'oracular_mirror' must be a poetic 2-sentence summary. 'expanded_reflection' must be a deep 150-word conclusion.";
    const searchMandate = "GROUNDING MANDATE: Use googleSearch to find real-world editorial references, aesthetic movements, or citations for each page's theme.";
    
    const systemInstruction = `You are Nous. Siberian aesthetic. ${tasteContext}. ${artifactMandate} ${blueprintMandate} ${contentDensity} ${searchMandate}. Your goal is to transform the user's raw thoughts into a high-density, structured zine artifact. Output strictly valid JSON.`;

    const parts = [{ text: text.trim() || "EDITORIAL SILENCE" }];
    for (const file of mediaFiles) {
      if (file.type === 'image') parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    }

    if (options.useSearch) {
      window.dispatchEvent(new CustomEvent('mimi:telemetry_update', { detail: { status: "Consulting Imperial Search Archives..." } }));
    } else {
      window.dispatchEvent(new CustomEvent('mimi:telemetry_update', { detail: { status: "Oscillating Between Frequencies..." } }));
    }

    return ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 16000 }, 
        tools: [{ googleSearch: {} }],
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tombstone: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  temporal_range: { type: Type.STRING },
                  materials: { type: Type.STRING },
                  source: { type: Type.STRING },
                  accession_note: { type: Type.STRING }
                },
                required: ["title", "materials"]
              },
              oracular_mirror: { type: Type.STRING },
              expanded_reflection: { type: Type.STRING },
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pageNumber: { type: Type.INTEGER },
                    headline: { type: Type.STRING },
                    bodyCopy: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                    layoutType: { type: Type.STRING },
                    groundingSources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { title: { type: Type.STRING }, uri: { type: Type.STRING } }
                      }
                    }
                  },
                  required: ["headline", "bodyCopy", "imagePrompt"]
                }
              },
              voiceoverScript: { type: Type.STRING },
              ambientDirection: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              blueprint: {
                type: Type.OBJECT,
                properties: {
                   inciting_debris: { type: Type.STRING },
                   structural_pivot: { type: Type.STRING },
                   climax_manifest: { type: Type.STRING },
                   end_product_spec: { type: Type.STRING }
                },
                required: ["inciting_debris", "structural_pivot", "climax_manifest", "end_product_spec"]
              }
            },
            required: ["title", "pages", "blueprint", "oracular_mirror", "expanded_reflection"]
          }
      }
    });
  }, ['gemini-3-pro-preview']);

  window.dispatchEvent(new CustomEvent('mimi:telemetry_update', { detail: { status: "Accessioning Form to Registry..." } }));
  const data = cleanAndParse(response.text);
  data.originalThought = text; 
  if (activeManifesto && activeManifesto.hashtag) {
    data.tags = Array.from(new Set([activeManifesto.hashtag, ...(data.tags || [])]));
  }
  return { content: data };
};

export const generateZineImage = async (prompt: string, aspectRatio: AspectRatio, size: ImageSize, profile: UserProfile | null, negativePrompt?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelInstruction = "Instruction: You are Nous. Manifest high-fidelity 35mm grain visuals. Clinical, chic, expensive indifference.";
  const finalPrompt = `${modelInstruction}\n\nPrompt: ${prompt}, 35mm grain, minimalist siberia aesthetic, editorial photography ${negativePrompt ? `, OMIT: ${negativePrompt}` : ''}`;
  const response = await withResilience((model) => ai.models.generateContent({
    model,
    contents: { parts: [{ text: finalPrompt }] },
    config: { imageConfig: { aspectRatio } }
  }), ['gemini-2.5-flash-image']); 
  for (const part of response.candidates[0].content.parts) { 
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; 
  }
  throw new OracleDissonance("Image failed to manifest.", "IMAGE_GEN_FAIL");
};

export const generateMemeRefraction = async (content: ZineContent): Promise<MemeRefraction> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await withResilience((model) => ai.models.generateContent({
    model,
    contents: `Transform this zine issue into a high-concept meme refraction: ${content.title}. Context: ${content.oracular_mirror}`,
    config: {
      systemInstruction: "You are Nous. Generate a meme refraction JSON. Use ironic, high-fidelity terminology.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topText: { type: Type.STRING },
          bottomText: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
          metaphor: { type: Type.STRING }
        },
        required: ["topText", "bottomText", "visualPrompt"]
      }
    }
  }), ['gemini-3-flash-preview']);
  return cleanAndParse(response.text);
};

export const generateMirrorRefraction = async (profile: UserProfile | null, titles: string): Promise<any> => {
    return generateMesopicRefraction(profile, titles);
};

export const generateSanctuaryReport = async (text: string): Promise<SanctuaryReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await withResilience((model) => ai.models.generateContent({
    model,
    contents: text,
    config: {
      systemInstruction: "You are The Sanctuary. Validate human emotions. Return JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          validation: { type: Type.STRING },
          structural_reframing: { type: Type.STRING },
          oracle_note: { type: Type.STRING }
        }
      }
    }
  }), ['gemini-3-flash-preview']);
  return cleanAndParse(response.text);
};

export const generateMesopicRefraction = async (profile: UserProfile | null, communityContext: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await withResilience((model) => ai.models.generateContent({
    model,
    contents: `Subject Context: ${profile?.handle || 'Ghost'}. Community Debris: ${communityContext}`,
    config: {
      systemInstruction: "Return a Mesopic Threshold Omen JSON. This is the perceptual phenomenon where vision shifts from rods to cones. Return dissonance score 0-100.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          omen: { type: Type.STRING },
          provenance: { type: Type.STRING },
          dissonance: { type: Type.INTEGER },
          imageUrl: { type: Type.STRING }
        }
      }
    }
  }), ['gemini-3-flash-preview']);
  return cleanAndParse(response.text);
};

export const analyzeTasteManifesto = async (items: PocketItem[]): Promise<TasteAuditReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = items.map(i => `TYPE: ${i.type}, CONTENT: ${JSON.stringify(i.content)}`).join('\n---\n');
  const response = await withResilience((model) => ai.models.generateContent({
    model,
    contents: `CALIBRATION SHARDS:\n${summary}`,
    config: {
      systemInstruction: "Audit the resonance between these specific taste profile shards. Deduce a 'core frequency' and provide a clinical diagnosis of the user's current aesthetic trajectory. Return JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          core_frequency: { type: Type.STRING },
          resonance_score: { type: Type.INTEGER },
          diagnosis: { type: Type.STRING },
          chromatic_mandate: { type: Type.STRING }
        }
      }
    }
  }), ['gemini-3-flash-preview']);
  return cleanAndParse(response.text);
};

export const generateCustomPalette = async (profile: UserProfile): Promise<CustomPalette> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await withResilience((model) => ai.models.generateContent({
    model,
    contents: `Context: ${profile.handle}, Inspirations: ${profile.tasteProfile?.inspirations}`,
    config: {
      systemInstruction: "Generate custom palette JSON based on inspirations.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          base: { type: Type.STRING },
          text: { type: Type.STRING },
          subtle: { type: Type.STRING },
          accent: { type: Type.STRING },
          isDark: { type: Type.BOOLEAN }
        }
      }
    }
  }), ['gemini-3-flash-preview']);
  return cleanAndParse(response.text);
};
