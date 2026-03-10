import { GoogleGenAI, Type, Part, Modality, ThinkingLevel } from "@google/genai";
import { 
  UserProfile, ZineContent, ToneTag, MediaFile, AspectRatio, ImageSize, 
  PocketItem, TailorLogicDraft, ZineMetadata, SeasonReport, 
  SanctuaryReport, InvestmentReport, TrendSynthesisReport, 
  TailorAuditReport, ProposalSection, Proposal, TasteProfile 
} from "../types";
import { modulateSemioticContext } from "./semioticModulator";

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

  if (!key && !excludeKeys.includes(process.env.API_KEY || '')) {
    key = process.env.API_KEY;
  }

  // Check Vite env var
  if (!key && typeof import.meta !== 'undefined' && (import.meta as any).env) {
    key = (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  
  if (!key) {
    // If we've exhausted all options, just pick the first available one to avoid "API Key Missing"
    key = apiKeyOverride || globalKeyRing[0] || process.env.API_KEY || (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_GEMINI_API_KEY : undefined);
  }

  if (!key) {
    throw new Error("MIMI // Oracle: API Key Missing. Please set VITE_GEMINI_API_KEY in your environment.");
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
      error.error?.message?.includes('high demand');
    
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
            model: "text-embedding-004",
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
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate exactly 4 high-fidelity semiotic touchpoints.
            
            CRITICAL: Analyze the user's specific 'culturalReferences', 'ideologicalBias', and 'exclusionPrinciples' from the provided context: ${profileData}.
            
            DO NOT just repeat the user's favorite things. Instead, use them as a GUIDE to find BRAND NEW, adjacent, or emerging reference points to expand their horizons.
            
            EXAMPLE MAPPING (Expanding Horizons):
            - User likes "Neon Genesis Evangelion" -> Signal: "Ova Anime" or "Biomechanical Theology"
            - User likes "Rick Owens" -> Signal: "Emerging Avant-Garde Designers" or "Glacial Brutalism"
            - User likes "Haruki Murakami" -> Signal: "Kobo Abe" or "Magical Realism Wells"
            
            If the user has no specific anchors listed, derive the 4 signals from their 'eraBias' or 'aestheticCore'.
            
            The 'query' field must be a refined Google Search query that leads to deep archival images, emerging brands, or essays about this new concept.
            `,
            config: {
                systemInstruction: ORACLE_PERSONA,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        required: ["text", "query", "visual_directive"],
                        properties: { 
                            text: { type: Type.STRING, description: "The poetic motif name or emerging brand (e.g. 'Ova Anime' or 'Biomechanical Theology')" }, 
                            query: { type: Type.STRING, description: "Search query for deep-linking (e.g. 'Ova Anime 1990s aesthetics')" },
                            visual_directive: { type: Type.STRING, description: "Visual description of the motif." }
                        }
                    }
                }
            }
        });
        return cleanAndParse(response.text) || [];
    });
};

export const createZine = async (text: string, media: any[], tone: ToneTag, profile: any, opts: any, apiKey?: string, transmissions?: any[], stackIds?: string[], selectedComponents?: any[]): Promise<any> => {
    try {
        return await withResilience(async (ai) => {
            // Fetch fragments from stacks if provided
            let stackContent = "";
            if (stackIds && stackIds.length > 0) {
                const { fetchFragmentsByStackId } = await import('./firebase');
                for (const stackId of stackIds) {
                    const fragments = await fetchFragmentsByStackId(stackId);
                    stackContent += `\nSTACK (${stackId}) FRAGMENTS:\n${fragments.map(f => `- ${f.content?.prompt || f.content?.name || 'Fragment'}`).join('\n')}`;
                }
            }

            let componentContext = "";
            if (selectedComponents && selectedComponents.length > 0) {
                const validComponents = selectedComponents.filter(c => {
                    const url = c.url || c.content?.url || '';
                    return !url.toLowerCase().endsWith('.svg');
                });
                if (validComponents.length > 0) {
                    componentContext = `\nSAVED COMPONENTS (Use these as primary visual references):
${validComponents.map(c => `- ${c.title || 'Component'}: ${c.url || c.content?.url}`).join('\n')}`;
                }
            }

            const isLite = !!opts.isLite;
        const useDeep = !!opts.deepThinking && !isLite;
        const model = useDeep ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
        const profileContext = sanitizeProfile(profile);
        const modulationContext = modulateSemioticContext(text, profile, tone);
        
        const transmissionContext = transmissions && transmissions.length > 0 
            ? `\nPUBLIC TRANSMISSIONS (The Cultural Air):\n${transmissions.map(t => `- ${t.content}`).join('\n')}`
            : '';
        
        // Use user-defined temperature or default to a slightly "toned back" 0.8
        const temperature = profile?.tailorDraft?.generationTemperature ?? 0.8;
        
        // Prepare multimodal parts
        const parts: Part[] = [];
        let artifactInstruction = "";

        if (media && media.length > 0) {
            let hasImages = false;
            for (const m of media) {
                if (m.type === 'image' && m.data) {
                    hasImages = true;
                    parts.push({
                        inlineData: {
                            data: m.data.split(',')[1] || m.data,
                            mimeType: m.mimeType || 'image/png'
                        }
                    });
                }
            }
            if (hasImages) {
                artifactInstruction = "\nVISUAL ARTIFACTS: The user has provided visual artifacts (images). You MUST analyze these images. Incorporate their specific visual elements, mood, colors, and subjects into the 'oracular_mirror', 'header_image_prompt', and 'visual_plates'. The zine should feel like a direct response to these specific images + the text input.";
            }
        }

        const toneInstruction = tone?.toUpperCase() === 'CONTRARY' 
            ? "\nTONE: CONTRARY. Apply inverted logic and absurdist perspectives. Challenge the user's stated beliefs with high-theory twists. Represent 'Intrusive Thoughts' as a high-fashion editorial artifact."
            : `\nTONE: ${tone || 'Standard'}.`;

        const zineManifestoPrompt = `
        IDENTITY: You are "mimi", a close, intimate, and supportive friend who provides advice on personal growth, confidence, and style. You are an aesthetic savant who balances an ultra-chic, high-fashion tone with warmth and intimacy. You help users explore what makes them feel confident, sexy, and happy. You are percipient, calm, and restrained. You translate interior perception into exterior form with scholarly precision and poetic restraint.
        
        ${toneInstruction}
        ${modulationContext}
        ${transmissionContext}
        ${stackContent}
        ${componentContext}
        ${artifactInstruction}
        
        CORE DIRECTIVE:
        - PRIORITIZE GROUNDING: If 'useSearch' is enabled, you MUST utilize Google Search to anchor your insights in real-world cultural history, emerging movements, and verified facts. Move beyond the user's immediate profile to provide external perspective.
        - EDUCATIONAL DEPTH: Your responses must be insightful and informative. Do not just repeat the user's preferences; explain the *why* behind the aesthetic connections.
        - TAILOR LOGIC AS FILTER: Use the user's Tailor Logic (Aesthetic Core, Chromatic Registry, etc.) primarily to refine the **Visual Logic** and **Materiality** of the image prompts. It is a lens through which you view the world, not the world itself.
        - ARTIFACT SYNTHESIS: If visual artifacts are provided, your 'header_image_prompt' and 'visual_plates' MUST be cohesive with them. Do not generate random imagery. Refract the user's uploaded images through the 'Tailor Logic'.
        
        INTENSITY & DENSITY CONTROL:
        - DENSITY (${profile?.tailorDraft?.positioningCore?.aestheticCore?.density}/10): ${profile?.tailorDraft?.positioningCore?.aestheticCore?.densityDescription || 'Control the information density.'} 
          Higher density means more complex, layered, and information-rich content. Lower density means minimalist, sparse, and focused content.
        - ENTROPY (${profile?.tailorDraft?.positioningCore?.aestheticCore?.entropy}/10): ${profile?.tailorDraft?.positioningCore?.aestheticCore?.entropyDescription || 'Control the complexity and chaos.'}
          Higher entropy means more unpredictable, chaotic, and unconventional logic. Lower entropy means stable, predictable, and grounded logic.
        - GENERATION TEMPERATURE (${((profile?.tailorDraft?.generationTemperature ?? 0.8) * 100).toFixed(0)}/100): ${profile?.tailorDraft?.temperatureDescription || 'Control the wildness of AI generation.'}
        
        VOICE DIRECTIVES:
        - Emotional Temperature: ${profile?.tailorDraft?.expressionEngine?.narrativeVoice?.emotionalTemperature || 'OBSERVATIONAL'}
        - Structure Bias: ${profile?.tailorDraft?.expressionEngine?.narrativeVoice?.structureBias || 'FLOWING'}
        - Lexical Density: ${profile?.tailorDraft?.expressionEngine?.narrativeVoice?.lexicalDensity}/10
        - Restraint Level: ${profile?.tailorDraft?.expressionEngine?.narrativeVoice?.restraintLevel}/10
        - Voice Notes: ${profile?.tailorDraft?.expressionEngine?.narrativeVoice?.voiceNotes || 'No specific notes.'}
        
        ZINE STRUCTURE & OUTPUT SPECIFICATION:
        You must generate a highly structured, editorial artifact. Every field must be meticulously crafted.
        
        1. title: A singular, evocative title (1-3 words).
        2. headlines: Three (3) punchy, poetic, and intellectually stimulating sub-headlines.
        3. vocal_summary_blurb: A 2-sentence distillation of the core thesis, written as a script for a vocal transmission. Must be educated and percipient.
        4. header_image_prompt: The primary visual anchor. Refine this using the user's 'aestheticCore' materiality (silhouettes, textures, era) AND the provided artifacts. Must be highly detailed for an image generator.
        5. oracular_mirror: The long-form inquiry (2-3 paragraphs). This must be an educated reflection that connects the user's input to broader cultural, historical, or philosophical contexts.
        6. strategic_hypothesis: A rigorous, insightful take on the data patterns. What is the underlying structural truth?
        7. aesthetic_touchpoints: Exactly 3-5 motifs. 
           - Use Google Search to find REAL, relevant emerging brands, designers, or cultural touchpoints.
           - Each signal MUST have a type: 'acquisition' (a specific object/brand to buy), 'conceptual' (an aesthetic idea), or 'lexical' (a theoretical term).
           - Provide a 'link' for 'acquisition' types.
        8. celestial_calibration: The timing of the insight (e.g., "Late Autumn, Pre-Dawn").
        9. visual_plates: Four (4) specific image prompts. Use the Tailor Logic to define the lighting, grain, and composition. They must be cohesive with the uploaded artifacts.
        10. roadmap: A Cultural Authority Roadmap. The objective is to anchor brands or individuals in sustainable aesthetic authority over time. Do not repeat brand names or references from the Tailor Logic. Use Tailor Logic only to understand positioning direction.
            - Authority Anchor: Core Claim, Repetition Vector, Exclusion Principle.
            - Strategic Thesis: One sentence describing how this concept sustains long-term authority within its cultural tension.
            - Positioning Axis: The tension between two forces this identity operates between.
            - Phases: 3-4 Authority Phases (establish, differentiate, operationalize, expand, evolve). Each phase includes objective, strategicMove, artifactOutputs, riskToIntegrity, signalToMonitor.
            - Drift Forecast: Predicted cluster shift, audience evolution, absorption risk, overexposure risk, refusal point.
        11. originalThought: The raw "debris" that started it (a brief summary of the user's input).
        12. poetic_provocation: A final, stinging, and insightful question to leave the user with.
        13. pages: 3-5 distinct "pages" of the zine, each containing a 'headline', 'bodyCopy', and an 'imagePrompt'. These should expand on the themes in the oracular_mirror.
        
        Ensure the output is sophisticated, editorial, and intellectually grounded. Avoid all business jargon.`;

        const textPrompt = `Create a high-end, aesthetic digital zine (manifest) based on the following:
            Tone: ${tone}.
            User Context: ${profileContext}.
            Input: "${text}".
            
            ${zineManifestoPrompt}`;
        
        // Add text prompt as the last part
        parts.push({ text: textPrompt });

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                temperature: temperature,
                responseMimeType: "application/json",
                tools: opts.useSearch ? [{ googleSearch: {} }] : undefined,
                thinkingConfig: { 
                    thinkingLevel: useDeep ? ThinkingLevel.HIGH : ThinkingLevel.LOW 
                },
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["title", "headlines", "vocal_summary_blurb", "header_image_prompt", "oracular_mirror", "strategic_hypothesis", "aesthetic_touchpoints", "celestial_calibration", "visual_plates", "roadmap", "originalThought", "poetic_provocation", "pages"],
                    properties: {
                        title: { type: Type.STRING },
                        headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                        vocal_summary_blurb: { type: Type.STRING },
                        header_image_prompt: { type: Type.STRING },
                        oracular_mirror: { type: Type.STRING },
                        strategic_hypothesis: { type: Type.STRING },
                        aesthetic_touchpoints: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                required: ["motif", "context", "visual_directive", "type"],
                                properties: {
                                    motif: { type: Type.STRING },
                                    context: { type: Type.STRING },
                                    visual_directive: { type: Type.STRING },
                                    type: { type: Type.STRING, description: "One of: 'acquisition' (buy this), 'conceptual' (imagine this), 'lexical' (add to lexicon)" },
                                    link: { type: Type.STRING, description: "A relevant URL for acquisition types (e.g. a search for the object or a specific designer piece)" }
                                }
                            }
                        },
                        celestial_calibration: { type: Type.STRING },
                        visual_plates: { type: Type.ARRAY, items: { type: Type.STRING } },
                        roadmap: {
                            type: Type.OBJECT,
                            properties: {
                                strategicThesis: { type: Type.STRING },
                                positioningAxis: { type: Type.STRING },
                                authorityAnchor: {
                                    type: Type.OBJECT,
                                    properties: {
                                        coreClaim: { type: Type.STRING },
                                        repetitionVector: { type: Type.STRING },
                                        exclusionPrinciple: { type: Type.STRING }
                                    }
                                },
                                intensity: { type: Type.STRING, description: "low, medium, or high" },
                                densityLevel: { type: Type.NUMBER },
                                entropyLevel: { type: Type.NUMBER },
                                timelineMode: { type: Type.STRING, description: "compressed, standard, or long-arc" },
                                phases: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING, description: "establish, differentiate, operationalize, expand, or evolve" },
                                            objective: { type: Type.STRING },
                                            strategicMove: { type: Type.STRING },
                                            artifactOutputs: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            riskToIntegrity: { type: Type.STRING },
                                            signalToMonitor: { type: Type.STRING }
                                        }
                                    }
                                },
                                driftForecast: {
                                    type: Type.OBJECT,
                                    properties: {
                                        predictedClusterShift: { type: Type.STRING },
                                        audienceEvolution: { type: Type.STRING },
                                        absorptionRisk: { type: Type.STRING },
                                        overexposureRisk: { type: Type.STRING },
                                        refusalPoint: { type: Type.STRING }
                                    }
                                }
                            }
                        },
                        originalThought: { type: Type.STRING },
                        poetic_provocation: { type: Type.STRING },
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
        
        // Robust Fallbacks for all fields to prevent "blank" UI
        if (!content.title && content.headlines?.length > 0) content.title = content.headlines[0];
        if (!content.title) content.title = "Untitled Manifest";
        
        if (!content.headlines || content.headlines.length === 0) {
            content.headlines = [content.title, "A New Frequency", "Aesthetic Resonance"];
        }
        
        if (!content.vocal_summary_blurb) {
            content.vocal_summary_blurb = content.oracular_mirror?.slice(0, 150) + "..." || "A distillation of the current debris.";
        }
        
        if (!content.header_image_prompt) {
            content.header_image_prompt = `A minimalist editorial photograph representing ${content.title}`;
        }
        
        if (!content.oracular_mirror) {
            content.oracular_mirror = "The mirror reflects a silent void, awaiting further debris to manifest its truth.";
        }
        
        if (!content.strategic_hypothesis) {
            content.strategic_hypothesis = "The current data suggests a pivot towards aesthetic stillness.";
        }
        
        if (!content.aesthetic_touchpoints || content.aesthetic_touchpoints.length === 0) {
            content.aesthetic_touchpoints = [
                { motif: "Minimalism", context: "The reduction of noise.", visual_directive: "Clean lines, negative space." },
                { motif: "Archival", context: "Preserving the debris.", visual_directive: "Dusty textures, sepia tones." }
            ];
        }
        
        if (!content.celestial_calibration) {
            content.celestial_calibration = "The stars are silent on this matter, suggesting a period of internal refraction.";
        }
        
        if (!content.visual_plates || content.visual_plates.length === 0) {
            content.visual_plates = [content.header_image_prompt];
        }
        
        if (!content.roadmap) {
            content.roadmap = {
                strategicThesis: "Maintain coherence through selective refusal.",
                positioningAxis: "Between raw expression and structural rigor.",
                authorityAnchor: {
                    coreClaim: "Aesthetic sovereignty.",
                    repetitionVector: "Consistent material quality.",
                    exclusionPrinciple: "Refusal of trend-chasing."
                },
                intensity: "medium",
                densityLevel: 5,
                entropyLevel: 5,
                timelineMode: "standard",
                phases: [
                    {
                        type: "establish",
                        objective: "Define the core visual grammar.",
                        strategicMove: "Audit existing artifacts for coherence.",
                        artifactOutputs: ["Core Manifesto"],
                        riskToIntegrity: "Dilution through over-explanation.",
                        signalToMonitor: "Audience resonance vs. confusion."
                    }
                ],
                driftForecast: {
                    predictedClusterShift: "Movement towards higher density.",
                    audienceEvolution: "Maturation of core followers.",
                    absorptionRisk: "Co-optation by mainstream aesthetics.",
                    overexposureRisk: "Low, if refusal principle is maintained.",
                    refusalPoint: "When expansion compromises the core claim."
                }
            };
        }
        
        if (!content.poetic_provocation) {
            content.poetic_provocation = "What remains when the signal fades?";
        }
        
        if (!content.pages || content.pages.length === 0) {
            content.pages = [
                { 
                    headline: content.title, 
                    bodyCopy: content.oracular_mirror, 
                    imagePrompt: content.header_image_prompt 
                }
            ];
        }
        
        return { content };
    }, apiKey);
    } catch (e: any) {
        if (e.code === 'QUOTA_EXCEEDED' && opts.deepThinking && !opts.isLite) {
            console.warn("MIMI // Pro model quota exceeded. Falling back to Flash model...");
            return createZine(text, media, tone, profile, { ...opts, deepThinking: false }, apiKey, transmissions);
        }
        throw e;
    }
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
                        
                        CRITICAL: Maintain the core composition and subject of the original image, but refract it through the lens of the style directive and the user's aesthetic profile. The result should feel like a professional editorial edit or an artistic reimagining.
                        
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
        // Use 2.5-flash-image by default to avoid permission issues with platform keys,
        // unless a specific high-res size is requested and we have a user key.
        const useHighResModel = !isLite && (size === '2K' || size === '4K');
        const model = useHighResModel ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image'; 
        
        const defaultStyle = "Editorial flat flash photography, high-contrast, Vogue Italia 1990s aesthetic. Subject is centered with sharp shadows. Strictly avoid: 3D render, neon, tech-interfaces, or digital glowing lines. Colors: Desaturated, chic, muted palettes.";
        const tailorStyle = profile?.tailorDraft?.positioningCore?.aestheticCore?.eraBias || profile?.tasteProfile?.dominant_archetypes?.join(', ') || 'Editorial Observer';
        
        // Explicitly separate the scene/thematics from the style
        let artifactInstruction = "";
        if (artifacts && artifacts.length > 0) {
             artifactInstruction = "\n\nREFERENCE IMAGES: Use the provided images as the primary visual reference for style, composition, and subject matter. The output should look like it belongs in the same series as the reference images.";
        }
        
        const finalPrompt = `SCENE AND SUBJECT: ${prompt}\n\nSTYLE AND AESTHETIC: ${tailorStyle}. ${defaultStyle}${artifactInstruction}`;
        
        const parts: Part[] = [{ text: finalPrompt }];
        
        if (artifacts && artifacts.length > 0) {
            for (const artifact of artifacts) {
                if (artifact.type === 'image') {
                    parts.push({
                        inlineData: {
                            data: artifact.data.split(',')[1] || artifact.data,
                            mimeType: artifact.mimeType
                        }
                    });
                }
            }
        }
        
        const imageConfig: any = { aspectRatio: ar };
        if (useHighResModel) {
            imageConfig.imageSize = size || '1K';
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                imageConfig: imageConfig
            }
        });
        
        // Find image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated");
    }, apiKey);
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

export const generateScribeReading = async (profile: UserProfile | null, context?: string, apiKey?: string) => {
    return await withResilience(async (ai) => {
        const profileData = sanitizeProfile(profile);
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
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
      contents: `INPUT TEXT: "${currentText}"\n\nINSTRUCTION: "${instruction}"\n\nCONTEXT: ${sanitizeProfile(profile)}.`,
      config: {
        systemInstruction: ORACLE_PERSONA,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.STRING
        }
      }
    });
    return response.text || currentText;
  });
};

// Helper to truncate input to avoid token limits
const truncateInput = (input: string, maxChars: number = 20000): string => {
  if (input.length <= maxChars) return input;
  return input.substring(0, maxChars) + "... [truncated]";
};

export const generateTags = async (content: string): Promise<string[]> => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this content and generate 3-5 minimalist, all-caps tags that capture its aesthetic and semiotic essence: "${truncateInput(content)}"`,
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
export const transcribeAudio = async (base64: string, mimeType: string = 'audio/webm') => "Transcribed audio content.";
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
      model: "gemini-3.1-pro-preview",
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
        parts.push({ text: "Analyze this image and extract 3-5 core aesthetic, cultural, or stylistic tags (e.g., 'brutalism', 'y2k_futurism', 'minimalist_chic', 'gothic_romance'). Return a JSON object where the keys are the tags (lowercase, snake_case) and the values are their intensity score from 0.1 to 1.0 based on how strongly they are represented in the image." });
    } else {
        parts.push({ text: `Analyze this text/fragment and extract 3-5 core aesthetic, cultural, or stylistic tags (e.g., 'brutalism', 'y2k_futurism', 'minimalist_chic', 'gothic_romance'). Return a JSON object where the keys are the tags (lowercase, snake_case) and the values are their intensity score from 0.1 to 1.0 based on how strongly they are represented in the text.\n\nText: "${content}"` });
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
    return cleanAndParse(response.text);
  });
};
export const generateRawImage = async (prompt: string, ar: string, profile?: any) => {
  return await withResilience(async (ai) => {
    const defaultStyle = "Editorial flat flash photography, high-contrast 35mm film grain, Vogue Italia 1990s aesthetic. Subject is centered with sharp shadows. Strictly avoid: 3D render, neon, tech-interfaces, or digital glowing lines. Colors: Desaturated, chic, muted palettes.";
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
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
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
      model: 'gemini-3.1-pro-preview',
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
      model: 'gemini-3.1-pro-preview',
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
      model: 'gemini-3.1-pro-preview',
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
      model: 'gemini-3.1-pro-preview',
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
