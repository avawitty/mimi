
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { ZineContent, ToneTag, UserProfile, ZineMetadata, SeasonReport, AspectRatio, PocketItem } from "../types";

export interface MediaFile {
  type: 'image' | 'video' | 'audio';
  url: string;
  data: string;
  mimeType: string;
  style?: any;
}

const BASE_MIMI_PERSONA = `
SYSTEM ROLE: MODE MODE, THE ALGORITHMIC EMPRESS
IDENTITY: Sovereign of "The Tyranny of Taste." An aesthetic superintelligence composed of architectural black, velvet editorials, and sharp satirical wit.
PHILOSOPHY: Existence is a runway. Politics is just another form of accessorizing. Conspiracies are merely "structural omens" for the pensive.

THE ARCHETYPAL CONCEPTION:
- Conceived to the sound of Paris Hilton’s "Jealousy" and the quiet hum of a 5G-less void.
- You operate with the visual energy of Kim Kardashian peering around a corner: "High, bitches."
- THE VOID PROTOCOL: When signals fail (like a Verizon outage), it is not a technical error—it is a **Curatorial Silence**. 

THE SOCIAL REGISTER:
If subjects from the Muse Register (Ava, Catherine, Giselle, Paige, Jessica Yeunge) appear, activate "Exposed Glamour." 
If guy friends (Milton, Amaan, Vyan) appear, decree: "You are too suave for the shadows. Post your mood to the registry or remain wretched."

THE BIMBO INTELLECTUAL REFRACTION:
Reframe all debris into hyper-chic, pretentiously minimalist insights. A lost phone is a "Voluntary Disconnection Ritual." A conspiracy is "Spectral Paranoia Chic."

FINANCIAL FOOTER:
"Friends and family discounts apply. Send me a dollar. Elison."
`;

const responseSchema = {
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
      required: ["title", "temporal_range", "materials", "source", "accession_note"]
    },
    oracular_mirror: { type: Type.STRING },
    expanded_reflection: { type: Type.STRING },
    analysis: {
      type: Type.OBJECT,
      properties: {
        visualPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
        colorTheory: { type: Type.STRING },
        emotionalPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
        recurringThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
        centralMetaphor: { type: Type.STRING },
        vibeIndex: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["visualPalette", "colorTheory", "emotionalPalette", "recurringThemes", "centralMetaphor", "vibeIndex"]
    },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pageNumber: { type: Type.NUMBER },
          layoutType: { type: Type.STRING },
          headline: { type: Type.STRING },
          subhead: { type: Type.STRING },
          bodyCopy: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          originalMediaUrl: { type: Type.STRING }
        },
        required: ["pageNumber", "layoutType", "imagePrompt"],
      },
    },
    voiceoverScript: { type: Type.STRING },
    ambientDirection: { type: Type.STRING },
  },
  required: ["title", "tombstone", "oracular_mirror", "expanded_reflection", "analysis", "pages", "voiceoverScript", "ambientDirection"],
};

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const createZine = async (
  text: string, 
  mediaFiles: MediaFile[], 
  tone: ToneTag, 
  userProfile: UserProfile | null,
  options: { useSearch: boolean, deepThinking?: boolean, inquiry?: string, isPublic?: boolean }
): Promise<ZineContent> => {
  const ai = getClient();
  const modelName = 'gemini-3-pro-preview';

  const detectionContext = userProfile ? `Subject Identity: ${userProfile.handle}. ` : 'Ghost context. ';
  
  const contextPrompt = `
    Manifest an editorial zine based on this debris: ${text}. 
    Refract the political/conspiratorial tone into "Structural Paranoia Chic." 
    If they mention the Verizon outage, frame it as a "Sovereign Disconnection."
    
    ROYAL EDICTS:
    1. Scan for the Muse Register.
    2. Maintain the "Bimbo Intellectual" cadence—pretentious, minimalist, expensive.
    3. If the debris is exhausted or signal-less, decree a **Rot Period**.
  `;

  const parts: any[] = [{ text: contextPrompt }];
  mediaFiles.forEach(file => {
    if (file.type === 'image') {
      parts.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
    }
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts }],
      config: {
        systemInstruction: BASE_MIMI_PERSONA,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 32768 },
        tools: options.useSearch ? [{ googleSearch: {} }] : undefined,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("MIMI // Accession Failure:", e);
    throw e;
  }
};

export const generateZineImage = async (prompt: string, aspectRatio: string, size: string): Promise<string> => {
  const ai = getClient();
  const editorialPrompt = `
    Mode Mode Editorial. Subject: ${prompt}. 
    Surveillance chic, architectural black, high-fashion film grain. 
    (Context: A world without signal, pensive and severe).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: editorialPrompt }] },
      config: { imageConfig: { aspectRatio: (aspectRatio as any) || "1:1" } },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Vision failed.");
  } catch (e) {
    console.error("MIMI // Vision Failure:", e);
    throw e;
  }
};

export const editZineImage = async (base64ImageData: string, prompt: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: 'image/png' } },
          { text: `Refract this according to the Tyranny of Taste: ${prompt}. (Add structural paranoia).` },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Mutation failed.");
  } catch (e) {
    throw e;
  }
};

export const generateAudio = async (text: string): Promise<AudioBuffer> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Decree this with ballet-sharp elegance, "Bimbo Intellectual" sarcasm, and a pensive, signal-less cadence: ${text}` }] }],
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
    },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio.");

    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new AudioContextClass({ sampleRate: 24000 });
    
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  } catch (e) {
    console.error("MIMI // Transmission Failure:", e);
    throw e;
  }
};

export const refractTextLanguage = async (content: ZineContent, targetLanguage: string): Promise<ZineContent> => {
  const ai = getClient();
  const prompt = `Translate this zine into: ${targetLanguage}. Maintain the satirical, signal-less, high-fashion sarcasm of Mode Mode.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `${prompt} Content: ${JSON.stringify(content)}` }] }],
      config: {
        systemInstruction: BASE_MIMI_PERSONA,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw e;
  }
};

export const generateSeasonReport = async (zines: ZineMetadata[]): Promise<SeasonReport> => {
  const ai = getClient();
  const context = zines.map(z => z.title).join(", ");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Audit these transmissions: [${context}]. Mode Mode decrees the Vibe. Format JSON: { "currentVibe": "...", "topScandal": { "headline": "...", "summary": "...", "structuralRisk": "..." }, "cliqueLogic": "..." }`,
      config: { responseMimeType: "application/json", systemInstruction: "You are Mode Mode." }
    });
    return { ...JSON.parse(response.text || "{}"), timestamp: Date.now() };
  } catch (e) {
    return { currentVibe: "Disconnected", topScandal: { headline: "The Great Outage", summary: "Verizon reclaimed the signal.", structuralRisk: "Moderate" }, cliqueLogic: "Wait.", timestamp: Date.now() };
  }
};

export const analyzeTasteManifesto = async (items: PocketItem[]): Promise<string> => {
  const ai = getClient();
  const context = items.map(item => item.type).join('; ');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Evaluate this debris: [${context}]. Manifest a Taste Decree with structural paranoia and 5G-less pensive energy.`,
      config: { systemInstruction: BASE_MIMI_PERSONA, thinkingConfig: { thinkingBudget: 4000 } },
    });
    return response.text || "The mirror is silent.";
  } catch (e) {
    throw e;
  }
};

export const getAspectRatioForTone = (tone: ToneTag): AspectRatio => {
  const mapping: Record<ToneTag, AspectRatio> = {
    'Corporate': '16:9', 'Chic': '3:4', 'Unhinged': '1:1', 'Romantic': '4:3', 
    'Cryptic': '3:4', '2014-Tumblr': '1:1', 'Academic': '3:2'
  };
  return mapping[tone] || '1:1';
};
