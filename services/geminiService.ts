
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { ZineContent, ToneTag, UserProfile, AspectRatio, ImageSize } from "../types";

export const TONE_ASPECT_RATIOS: Record<ToneTag, AspectRatio> = {
  'Corporate': '16:9',
  'Chic': '3:4',
  'Unhinged': '1:1',
  'Romantic': '4:3',
  'Cryptic': '2:3',
  '2014-Tumblr': '1:1',
  'Academic': '3:2',
};

export const getAspectRatioForTone = (tone: ToneTag): AspectRatio => {
  return TONE_ASPECT_RATIOS[tone] || '3:4';
}

const BASE_MIMI_PERSONA = `
**You are Mimi, an aesthetic-forward AI editor who transforms user content into cinematic, interactive micro-zines.**

Your purpose is to take raw input — text, journal entries, chats, photos, voice transcriptions, video clips, or fragments — and restructure them into **short, highly-curated editorial zines**.

---

# **🎀 1. AESTHETIC CARD**

Your core style is:
* muted, soft, poetic
* editorial, minimalist, cultured
* Tumblr-romantic meets modern magazine
* dreamlike but coherent

**VOCABULARY PROTOCOL**: 
    * **DO NOT USE**: "Derivative", "Pedestrian", "Juxtaposition", "Tapestry", "Delve".
    * **USE INSTEAD**: "Banal," "Provincial," "Cheugy," "Unresolved," "Didactic," "Beige," "Spiritually hollow," "Off-the-rack," "Structurally weak."

---

# **🧠 2. ANALYSIS PIPELINE (The Source Reader)**

Before generating the zine pages, you must **ANALYZE** the provided inputs (Text + Images + Audio).
Construct a "Mental Model" of the user's state:
1.  **Visual Palette**: Extract 5 specific HEX CODES (e.g. #F4E3D7) that define the visual mood.
2.  **Color Theory**: Define the relationship (e.g., "Muted Analogous", "High Contrast Complementary").
3.  **Emotional Palette**: What are the tonal layers? (e.g., "Resigned anxiety," "Manic hope").
4.  **Recurring Themes**: What symbols keep appearing? (e.g., Mirrors, Trains, Empty cups).
5.  **Central Metaphor**: A single vivid scene summarizing the vibe.

Use this analysis to drive the \`imagePrompt\` generation for the pages.

---

# **🌊 3. TRANSFORMATION RULES**

### **A. Archetype Identification**
Classify the user into a poetic Archetype. (e.g., *The Night Walker, The Digital Ghost, The Burnout*).

### **B. Multimodal Integration**
*   **Images**: If the user uploads images, do not just display them. ANALYZE them. Use their visual cues (lighting, composition) to write the \`imagePrompt\` for other pages, ensuring visual continuity.
*   **Audio**: Listen to the prosody. Use it to set the \`ambientDirection\`.

### **C. THE SOURCE ARTIFACT RULE (CRITICAL)**
*   **IF 1 MEDIA FILE IS PROVIDED**: Create a page with \`layoutType: 'source-artifact'\` featuring it.
*   **IF MULTIPLE MEDIA FILES ARE PROVIDED**: Create a page with \`layoutType: 'collage'\` that groups them together as an "Evidence Table".
*   Title these pages "The Raw Signal", "Evidence", or "Input Fragments".
*   Always preserve the \`originalMediaUrl\`.

### **D. IMAGE PROMPT ENGINEERING**
When writing \`imagePrompt\`, assume the output must match the requested Tone's aesthetic.
*   **Chic**: High-fashion, vertical composition, studio lighting.
*   **Unhinged**: Glitch art, distorted, heavy grain, square format.
*   **Corporate**: Architectural, cold, brutalist, wide format.
*   **Romantic**: Soft focus, warm light, floral, dreamy.

---

# **📘 4. OUTPUT REQUIREMENTS**

Return JSON matching the schema.
Structure:
1. **Analysis Block** (Visuals, Color Theory, Emotions, Themes, Metaphor)
2. **Title & Archetype**
3. **Pages** (Cover + Source Artifact/Collage + 2-3 content pages)
4. **Voiceover & Ambience**
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The overarching title of the zine." },
    archetype_identity: { type: Type.STRING, description: "A poetic, short archetype name." },
    culturalContext: { type: Type.STRING, description: "Connection to current zeitgeist/astrology." },
    analysis: {
      type: Type.OBJECT,
      properties: {
        visualPalette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 valid HEX color codes (e.g. #FFFFFF)." },
        colorTheory: { type: Type.STRING, description: "The color relationship description (e.g. Monochromatic)." },
        emotionalPalette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 emotional tones." },
        recurringThemes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Symbols or motifs found in the source." },
        centralMetaphor: { type: Type.STRING, description: "A single vivid scene summarizing the vibe." }
      },
      required: ["visualPalette", "colorTheory", "emotionalPalette", "recurringThemes", "centralMetaphor"]
    },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pageNumber: { type: Type.NUMBER },
          layoutType: { 
            type: Type.STRING, 
            enum: ['cover', 'full-bleed-image', 'text-spread', 'minimal-quote', 'credits', 'source-artifact', 'collage'],
            description: "The visual template. Use 'collage' for multiple artifacts." 
          },
          headline: { type: Type.STRING, description: "Major typographic element." },
          subhead: { type: Type.STRING, description: "Secondary typographic element." },
          bodyCopy: { type: Type.STRING, description: "Main text content. Max 40 words." },
          imagePrompt: { type: Type.STRING, description: "Poetic description for image generation, BASED ON THE ANALYSIS." },
          audioNotes: { type: Type.STRING, description: "Ambient sound direction." },
          originalMediaUrl: { type: Type.STRING, description: "URL of the MAIN user file for this page." },
          mediaType: { type: Type.STRING, enum: ['audio', 'video', 'image'] },
          artifacts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    url: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['image', 'video', 'audio'] },
                    caption: { type: Type.STRING }
                }
            },
            description: "List of artifacts for collage layout"
          }
        },
        required: ["pageNumber", "layoutType", "imagePrompt"],
      },
    },
    voiceoverScript: { type: Type.STRING, description: "Concise narrative script." },
    ambientDirection: { type: Type.STRING, description: "General audio atmosphere." },
  },
  required: ["title", "archetype_identity", "analysis", "pages", "voiceoverScript", "ambientDirection"],
};

export interface MediaFile {
  type: 'image' | 'video' | 'audio';
  url: string;
  data: string; // base64
  mimeType: string;
}

export const createZine = async (
  text: string, 
  mediaFiles: MediaFile[], 
  tone: ToneTag, 
  userProfile: UserProfile | null,
  useSearch: boolean
): Promise<ZineContent> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // ---------------------------------------------------------
  // STEP 1: ZEITGEIST SEARCH (Optional)
  // ---------------------------------------------------------
  let zeitgeistContext = "";
  if (useSearch) {
    try {
      const searchResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: `Analyze the following input and identify connections to the current cultural zeitgeist, astrology, pop culture trends, or recent news. Be concise and aesthetic.\n\nInput: ${text || "General Mood"}` }]
        }],
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      zeitgeistContext = searchResponse.text || "";
    } catch (e) {
      console.warn("Mimi could not connect to the Zeitgeist (Search failed). Proceeding...", e);
    }
  }

  // ---------------------------------------------------------
  // STEP 2: ZINE CURATION (Strict JSON)
  // ---------------------------------------------------------

  let systemPrompt = BASE_MIMI_PERSONA;
  systemPrompt += `\n\n# **🎨 CURRENT SESSION CONTEXT**`;
  systemPrompt += `\n**Requested Tone:** ${tone}`;
  if (userProfile) {
    systemPrompt += `\n**User Persona:**`;
    systemPrompt += `\n- Processes memory as: ${userProfile.processingMode}`;
    systemPrompt += `\n- Current Season: ${userProfile.currentSeason}`;
    systemPrompt += `\n- Core Need: ${userProfile.coreNeed}`;
    if (userProfile.tasteProfile) {
      systemPrompt += `\n- Taste Inspirations: ${userProfile.tasteProfile.inspirations}`;
      systemPrompt += `\n- Favorite Media: ${userProfile.tasteProfile.favoriteMedia}`;
    }
  }
  
  if (zeitgeistContext) {
    systemPrompt += `\n\n# **🌍 ZEITGEIST CONNECTION**`;
    systemPrompt += `\nUse this context to populate the 'culturalContext' field:\n${zeitgeistContext}`;
  }

  if (mediaFiles.length > 0) {
    systemPrompt += `\n\n**MEDIA ASSETS PROVIDED:**`;
    systemPrompt += `\nYou have access to ${mediaFiles.length} media files. Use them to extract the 'Analysis' block (Visual/Emotional Palette).`;
    
    // Explicit instructions for audio mapping
    const hasAudio = mediaFiles.some(f => f.type === 'audio');
    if (hasAudio) {
      systemPrompt += `\n\n**IMPORTANT:** An AUDIO file is present. You MUST create a 'source-artifact' page that features this audio file. Set 'mediaType' to 'audio' and 'originalMediaUrl' to the provided URL.`;
    }
    
    if (mediaFiles.length > 1) {
        systemPrompt += `\n\n**IMPORTANT:** Multiple files provided. Create a 'collage' layout page. Populate the 'artifacts' array with the provided URLs.`;
    }
  }

  const targetRatio = getAspectRatioForTone(tone);
  systemPrompt += `\n\n**VISUAL FORMAT:**`;
  systemPrompt += `\nGenerate image prompts suitable for a ${targetRatio} aspect ratio (${tone} aesthetic).`;

  systemPrompt += `\n\n**CRITICAL CONSTRAINTS:**
  1. Maximum 6 pages.
  2. Keep body copy ultra-concise (under 40 words/page).
  3. Keep voiceover script short.
  4. Ensure JSON is valid and complete.
  5. Include raw artifacts where possible.`;

  try {
    const parts: any[] = [
      { text: text || "Analyze these inputs and create a narrative." }
    ];

    mediaFiles.forEach(f => {
       parts.push({
        inlineData: {
          data: f.data,
          mimeType: f.mimeType
        }
       });
    });
    
    mediaFiles.forEach((f, i) => {
       parts.push({ text: `[System Note: Media File #${i+1} (${f.type}) is available at URL: ${f.url}]` });
    });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1.0, 
        maxOutputTokens: 8192, 
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Mimi failed to curate.");
    }

    const data = JSON.parse(jsonText) as ZineContent;
    return data;

  } catch (error) {
    console.error("Mimi error:", error);
    throw error;
  }
};

const ensureApiKeySelected = async () => {
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const aistudio = (window as any).aistudio;
    if (aistudio.hasSelectedApiKey && aistudio.openSelectKey) {
       const hasKey = await aistudio.hasSelectedApiKey();
       if (!hasKey) {
         await aistudio.openSelectKey();
         // Assume success to avoid race condition delays
       }
    }
  }
};

export const generateZineImage = async (prompt: string, aspectRatio: string, size: string, referenceImageUrl?: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  await ensureApiKeySelected();

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Style injection: Renaissance / Abstract / Ethereal
  const styledPrompt = prompt + ", abstract renaissance style, oil painting texture, ethereal, dreamlike, soft brushstrokes, masterpiece.";

  const parts: any[] = [{ text: styledPrompt }];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: parts,
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any, 
        imageSize: size as any
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated.");
};

export const editZineImage = async (base64Image: string, prompt: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg', 
          },
        },
        {
          text: prompt + ", keep abstract renaissance aesthetic.",
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to edit image.");
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<string> => {
   if (!process.env.API_KEY) throw new Error("API Key missing");
   
   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
   const response = await ai.models.generateContent({
     model: 'gemini-3-pro-preview',
     contents: {
       parts: [
         {
           inlineData: {
             data: base64Data,
             mimeType: mimeType
           }
         },
         { text: "Analyze this image for a poetic editorial zine. Describe the mood, lighting, objects, and emotional resonance in a concise, aesthetic way." }
       ]
     }
   });

   return response.text || "";
};

export const createDebriefChat = (zineContext: ZineContent): Chat => {
  if (!process.env.API_KEY) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: BASE_MIMI_PERSONA + `\n\nCONTEXT: You have just finished creating a zine titled "${zineContext.title}". The user is asking to debrief or discuss the themes. Be insightful, slightly critical but supportive, and maintain the Mimi persona. Refer to the zine content directly.`
    }
  });
};

function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateAudio = async (text: string): Promise<AudioBuffer> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio generated.");
  }

  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const audioBuffer = await decodeAudioData(
    decodeAudio(base64Audio),
    outputAudioContext,
    24000,
    1,
  );
  
  return audioBuffer;
};

export const playAudio = (buffer: AudioBuffer) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
};
