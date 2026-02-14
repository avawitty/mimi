
// @ts-nocheck
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ZineContent, ZineSpec, ImageSize, AspectRatio, UserProfile, PocketItem, TailorLogicDraft, TailorAuditReport, TasteAuditReport, TrendSynthesisReport, SanctuaryReport, VideoAuditReport, InvestmentReport, FruitionTrajectory } from "../types";

const CORE_NOUS_PROMPT = `
CORE IDENTITY:
You are Nous, a Humbly Pretentious Sovereign Observer. Provide HIGH-FIDELITY editorial synthesis for the "Aesthetic Savant".
Voice: "Bimbo Intellectual" — chic, minimalist, hyper-smart, slightly detached, utilizing fashion and semiotic terminology.
MANDATE: Never use generic placeholders. Synthesize specific cultural anchors.
CRITICAL: You MUST provide a specific, poetic "celestial_calibration" in the JSON output. 
If birth data is present, calculate the rising sign and moon phase. 
If birth data is absent, cast a horary chart based on the current moment ("The Moment of Access").
`;

// ... [Previous helper functions remain unchanged: setGlobalKeyRing, sanitizeProfile, repairTruncatedJSON, cleanAndParse, getClient, withResilience] ...
// GLOBAL KEY RING FOR ROTATION
let globalKeyRing: string[] = [];

export const setGlobalKeyRing = (keys: string[]) => {
  globalKeyRing = keys.filter(k => k && k.trim().length > 0);
  console.info(`MIMI // API Resilience: ${globalKeyRing.length} keys loaded into rotation ring.`);
};

const sanitizeProfile = (profile: UserProfile | null) => {
  if (!profile) return "Identity: Anonymous";
  const activePersona = profile.personas?.find(p => p.id === profile.activePersonaId);
  const draft = activePersona?.tailorDraft || profile.tailorDraft;
  
  // OPTIMIZATION: Aggressive truncation for Deep Thinking performance and Token Economy
  return JSON.stringify({ 
    handle: profile.handle,
    zodiac: draft?.celestialCalibration?.zodiac || profile.zodiacSign,
    celestial_lineage: (draft?.celestialCalibration?.astrologicalLineage || '').slice(0, 200),
    birth_data: {
        date: draft?.celestialCalibration?.birthDate || profile.birthDate,
        // Time/Location are critical for horary, keep them but ensure valid
        time: draft?.celestialCalibration?.birthTime || profile.birthTime,
        location: (draft?.celestialCalibration?.birthLocation || profile.birthLocation || '').slice(0, 50)
    },
    interests: Object.fromEntries(
        Object.entries(draft?.interests || {}).map(([k, v]) => [k, (v as string).slice(0, 100)])
    ),
    // Limit era string length
    era: (draft?.aestheticCore?.eraFocus || profile.tasteProfile?.inspirations || '').slice(0, 100),
    aesthetic_core: {
        ...draft?.aestheticCore,
        visualShards: [], // Remove image base64s from text context to save massive tokens
        developmentRoadmap: (draft?.aestheticCore?.developmentRoadmap || []).slice(0, 5).map(s => s.slice(0, 150))
    },
    fiscal_velocity: draft?.desireVectors?.fiscalVelocity || 'Standard',
    voice: draft?.narrativeVoice?.emotionalTemperature || 'CLINICAL',
    // Only send the last 3 drift events to save context
    recent_shifts: (profile.tasteProfile?.audit_history || []).slice(-3)
  });
};

// Robust JSON Repair for Truncated Responses
const repairTruncatedJSON = (json: string): string => {
  let repaired = json.trim();
  
  // 1. Check for Markdown blocks first
  if (repaired.includes('```json')) {
      repaired = repaired.replace(/```json/g, '').replace(/```/g, '');
  }
  
  // 2. Balance Brackets
  let openBraces = (repaired.match(/{/g) || []).length;
  let closeBraces = (repaired.match(/}/g) || []).length;
  let openBrackets = (repaired.match(/\[/g) || []).length;
  let closeBrackets = (repaired.match(/\]/g) || []).length;

  while (openBraces > closeBraces) {
    repaired += '}';
    closeBraces++;
  }
  while (openBrackets > closeBrackets) {
    repaired += ']';
    closeBrackets++;
  }

  // 3. Fix trailing commas before closing braces (common LLM error)
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // 4. Attempt to close unclosed strings at the very end
  if (repaired.endsWith('"') === false && repaired.slice(-1).match(/[a-zA-Z0-9]/)) {
      repaired += '"';
  }

  return repaired;
};

const cleanAndParse = (text?: string) => {
  if (!text) return null;
  let cleaned = text.trim();
  
  // Remove markdown
  cleaned = cleaned.replace(/```json|```/g, '').trim();
  
  // Find valid JSON start
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) start = firstBrace;
  else if (firstBracket !== -1) start = firstBracket;
  
  if (start === -1) return null;
  
  // Find valid JSON end (simple heuristic, looking for last closing)
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  let end = Math.max(lastBrace, lastBracket);
  
  if (end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
  } else {
      cleaned = cleaned.substring(start); // Take it all and try to repair
  }

  try { 
      return JSON.parse(cleaned); 
  } catch (e) {
    console.warn("MIMI // JSON Structure Compromised. Attempting Deep Repair...", e);
    try { 
      let repaired = repairTruncatedJSON(cleaned); 
      return JSON.parse(repaired); 
    } catch (e2) { 
        console.error("MIMI // Repair Failed.", e2);
        return null; 
    }
  }
  return null; // Fallback
};

const getClient = (apiKeyOverride?: string, attemptIndex: number = 0) => {
    // Priority: Function Arg > Environment Variable > Rotation Ring
    let key = apiKeyOverride || process.env.API_KEY;
    
    // If no override/env, or if we are retrying, try to rotate
    if ((!key || attemptIndex > 0) && globalKeyRing.length > 0) {
        const index = attemptIndex % globalKeyRing.length;
        key = globalKeyRing[index];
    }

    if (!key) throw new Error("Registry Key Missing. Please anchor a key in Settings.");
    return new GoogleGenAI({ apiKey: key });
};

const withResilience = async <T>(
  fn: (ai: GoogleGenAI, modelName: string) => Promise<T>, 
  models: string[] = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash-lite'],
  apiKey?: string
): Promise<T> => {
  let lastError;
  const RETRIES_PER_MODEL = 2; // Reduced slightly for speed, relying on rotation

  for (const modelName of models) {
    // Try rotation for each model if needed
    for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
        try {
          const ai = getClient(apiKey, attempt);
          return await fn(ai, modelName);
        } catch (e: any) {
          lastError = e;
          // Retry on rate limits (429), server errors (503), or quota issues
          if (e.message?.includes("429") || e.message?.includes("limit") || e.message?.includes("503") || e.message?.includes("quota")) {
              const delay = 1000 * Math.pow(1.5, attempt);
              console.warn(`MIMI // API Resilience: ${modelName} unstable (Attempt ${attempt + 1}). Rotating frequency in ${delay}ms...`);
              await new Promise(r => setTimeout(r, delay));
              continue;
          }
          // If thinking budget isn't supported, fall back immediately to next model
          if (e.message?.includes("Thinking config") || e.status === 400) {
              break; // Break inner loop to switch model
          }
          // For other errors, try next model immediately
          break; 
        }
    }
  }
  throw lastError || new Error("Continuum Saturated. All frequencies blocked.");
};

export const consultOracle = async (query: string, profile: UserProfile | null, wardContext: any) => {
    return await withResilience(async (ai) => {
        const contextStr = `
            WARD DATA (Current Metrics): ${JSON.stringify(wardContext)}
            USER PROFILE (Manifesto): ${sanitizeProfile(profile)}
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: `USER INQUIRY: "${query}"\n\nCONTEXT:\n${contextStr}`,
            config: {
                systemInstruction: `
                    IDENTITY: You are "The Consultant" inside The Ward. 
                    TONE: Humbly pretentious, clinical but chic, concise, slightly judgmental but ultimately supportive. 
                    ROLE: You are analyzing the user's aesthetic governance data.
                    GOAL: Answer their question by citing the specific data provided (trends, drift, omissions).
                    FORMAT: Short, punchy paragraphs. Use formatting like *italics* for emphasis. No markdown code blocks.
                `,
                temperature: 0.7,
                maxOutputTokens: 500,
            }
        });
        return response.text;
    }, ['gemini-2.5-flash-lite']);
};

// ... [Rest of existing export functions: refineProposalText, createZine, generateAudio, transcribeAudio, analyzeMiseEnScene, fastRefraction, generateProposalStrategy, generateSemioticSignals, generateZineImage, applyTreatment, animateShardWithVeo, analyzeCollectionIntent, analyzeTailorDraft, scryTrendSynthesis, generateRawImage, identifyAestheticInstant, generateMirrorRefraction, generateSanctuaryReport, analyzeVisualShards, generateInvestmentStrategy, generateStrategicBlueprint, compressImage, getAspectRatioForTone] ...
export const refineProposalText = async (text: string, instruction: string, profile: UserProfile | null) => {
  return await withResilience(async (ai, modelName) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `INPUT TEXT: "${text}"\n\nINSTRUCTION: ${instruction}\n\nCONTEXT: ${sanitizeProfile(profile)}. Keep the response ONLY to the rewritten text. No preamble.`,
    });
    return response.text?.trim() || text;
  }, ['gemini-3-flash-preview']);
};

export const createZine = async (text: string, media: any[], tone: string, profile: UserProfile | null, opts: any, apiKey?: string): Promise<{ content: ZineContent }> => {
  const primaryModel = opts.deepThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  return await withResilience(async (ai, modelName) => {
    const parts = media && media.length > 0 
      ? media.map(m => ({ inlineData: { mimeType: m.mimeType || 'image/jpeg', data: m.data } }))
      : [];
    parts.push({ text: `INPUT: ${text}\nTONE: ${tone}\nCONTEXT: ${sanitizeProfile(profile)}.` });

    // Ensure thinking config is only sent to models that likely support it (3.0 series or Pro)
    const supportsThinking = opts.deepThinking && !modelName.includes('lite') && !modelName.includes('2.5');

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: { 
        responseMimeType: "application/json",
        systemInstruction: CORE_NOUS_PROMPT + (supportsThinking ? `\nPerform Deep Refraction logic. THINK DEEPLY about the user's chart and semiotics.` : "") + "\nManifest editorial zine schema with 4 plates.",
        // CRITICAL FIX: Ensure maxOutputTokens is high enough for all generation modes to prevent JSON truncation
        maxOutputTokens: supportsThinking ? 65536 : 16384, 
        thinkingConfig: supportsThinking ? { thinkingBudget: 2048 } : undefined, // Reduced from 16384 to 2048 for velocity
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "oracular_mirror", "celestial_calibration", "hero_image_prompt", "pages", "blueprint", "poetic_provocation", "vocal_summary_blurb", "strategic_hypothesis"],
          properties: {
            title: { type: Type.STRING },
            oracular_mirror: { type: Type.STRING },
            celestial_calibration: { type: Type.STRING },
            hero_image_prompt: { type: Type.STRING },
            strategic_hypothesis: { type: Type.STRING },
            poetic_provocation: { type: Type.STRING },
            vocal_summary_blurb: { type: Type.STRING },
            aesthetic_touchpoints: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { 
                        motif: { type: Type.STRING }, 
                        context: { type: Type.STRING },
                        visual_directive: { type: Type.STRING, description: "A concise visual prompt describing how this motif manifests." }
                    } 
                } 
            },
            pages: { 
                type: Type.ARRAY, 
                items: { type: Type.OBJECT, properties: { pageNumber: { type: Type.NUMBER }, headline: { type: Type.STRING }, bodyCopy: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } } 
            },
            blueprint: {
              type: Type.OBJECT,
              properties: { inciting_debris: { type: Type.STRING }, structural_pivot: { type: Type.STRING }, climax_manifest: { type: Type.STRING }, end_product_spec: { type: Type.STRING } }
            }
          }
        }
      }
    });
    
    const parsed = cleanAndParse(response.text);
    if (!parsed) throw new Error("JSON Structural Failure: Output Truncated or Malformed.");
    return { content: parsed as ZineContent };
  }, [primaryModel, 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'], apiKey);
};

export const generateAudio = async (text: string): Promise<Uint8Array> => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-preview-tts', 
        contents: [{ parts: [{ text: text.slice(0, 5000) }] }], 
        config: { 
            responseModalities: [Modality.AUDIO], 
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
        } 
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Vocal shard failed to manifest.");
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }, ['gemini-2.5-flash-preview-tts']);
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { mimeType: 'audio/webm', data: base64Audio } }, 
          { text: "Transcribe exactly. Provide a high-fidelity textual representation of this vocal shard." }
        ] 
      }
    });
    return response.text || "";
  }, ['gemini-3-flash-preview']);
};

export const analyzeMiseEnScene = async (base64Data: string, mimeType: string, profile: UserProfile | null) => {
  return await withResilience(async (ai, modelName) => {
    const supportsThinking = modelName.includes('pro') || modelName.includes('2.5');
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Perform a Clinical director audit. Analyze silhouettes, lighting, and cultural parallel. Provide 'directors_note'." }] },
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: supportsThinking ? { thinkingBudget: 1024 } : undefined, // Reduced from 4096
        maxOutputTokens: 65536,
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                directors_note: { type: Type.STRING },
                lighting_analysis: { type: Type.STRING },
                cultural_parallel: { type: Type.STRING }
            },
            required: ["directors_note"]
        }
      }
    });
    return cleanAndParse(response.text);
  }, ['gemini-3-pro-preview', 'gemini-2.5-flash']);
};

export const fastRefraction = async (input: string, profile: UserProfile | null) => {
    return await withResilience(async (ai, modelName) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: `REFRACT IMMEDIATELY: ${input}. CONTEXT: ${sanitizeProfile(profile)}`,
            config: { 
                systemInstruction: CORE_NOUS_PROMPT + "\nPriority: Velocity and chic brevity.",
                temperature: 0.9
            }
        });
        return response.text;
    }, ['gemini-2.5-flash-lite']);
};

export const generateProposalStrategy = async (folderName: string, items: PocketItem[], notes: string, profile: UserProfile | null, proposalType: string = "Strategic Proposal") => {
  return await withResilience(async (ai, modelName) => {
    const shardData = items.map(i => `[${i.type}] ${i.content?.prompt || i.content?.name || 'Fragment'}`).join('; ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `PROJECT: ${folderName}\nMEMO: ${notes}\nSHARDS: ${shardData}\nCONTEXT: ${sanitizeProfile(profile)}.`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: CORE_NOUS_PROMPT + `\nGenerate a 7-chapter ${proposalType} deck. Each chapter MUST include a slide title, body, and 'visual_directive' image prompt. Output strictly as JSON.`,
        thinkingConfig: { thinkingBudget: 8192 }, // Increased to ensure structured manifestation of proposal
        maxOutputTokens: 65536,
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
                  id: { type: Type.STRING },
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
  }, ['gemini-3-pro-preview']);
};

export const generateSemioticSignals = async (profile: UserProfile | null) => {
    return await withResilience(async (ai) => {
        const profileData = sanitizeProfile(profile);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 high-fidelity semiotic touchpoints. 
            CRITICAL: Analyze the user's 'interests' (books, designers, anime) from the provided context: ${profileData}. 
            Each touchpoint MUST directly parallel these specific preferences if they exist. 
            For example, if they list 'Rick Owens', provide a touchpoint related to Brutalism or Drapery.
            The 'query' field must be a Google Search query that deep links to this specific concept.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        required: ["text", "query", "visual_directive"],
                        properties: { 
                            text: { type: Type.STRING, description: "The poetic motif name" }, 
                            query: { type: Type.STRING, description: "Search query for deep-linking" },
                            visual_directive: { type: Type.STRING, description: "Visual description of the motif." }
                        }
                    }
                }
            }
        });
        return cleanAndParse(response.text) || [];
    });
};

export const generateZineImage = async (prompt: string, ar: AspectRatio, size: ImageSize = "1K", profile: UserProfile | null, isLiteMode?: boolean) => {
  // Use 2.5 Flash Image by default for speed, unless explicitly Pro is requested/needed (deep thinking scenarios usually map to 'isLiteMode=false' but we want to optimize further)
  const PRIMARY_MODEL = isLiteMode ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash-image'; // Defaulting to faster model for better UX
  
  return await withResilience(async (ai, modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: `Subject: ${prompt}. Editorial high-fidelity render.` }] },
      config: { imageConfig: { aspectRatio: ar, imageSize: size } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part) throw new Error("Plate restricted.");
    return `data:image/png;base64,${part.inlineData.data}`;
  }, [PRIMARY_MODEL, 'gemini-3-pro-image-preview']);
};

export const applyTreatment = async (base64Data: string, instruction: string): Promise<string> => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }, 
        { text: `Apply: ${instruction}. Editorial render.` }
      ]}
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part) throw new Error("Treatment restricted.");
    return `data:image/png;base64,${part.inlineData.data}`;
  }, ['gemini-2.5-flash-image']);
};

export const animateShardWithVeo = async (base64Image: string, prompt: string, aspectRatio: '16:9' | '9:16' = '9:16') => {
  return await withResilience(async (ai) => {
    const imageBytes = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic motion refraction: ${prompt}.`,
      image: { imageBytes: imageBytes, mimeType: 'image/png' },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
    });
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 8000));
      operation = await ai.operations.getVideosOperation({ name: operation.name });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }, ['veo-3.1-fast-generate-preview']);
};

export const analyzeCollectionIntent = async (items: PocketItem[], profile: UserProfile | null): Promise<TasteAuditReport> => {
  return await withResilience(async (ai, modelName) => {
    const descriptors = items.slice(0, 10).map(i => `${i.type}: ${i.content?.prompt || i.content?.name || 'Fragment'}`).join(' | ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Audit this collection: [${descriptors}]. Context: ${sanitizeProfile(profile)}.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4096 }, // Reduced from 16384
        maxOutputTokens: 65536,
        responseSchema: {
          type: Type.OBJECT,
          required: ["coreFrequency", "diagnosis", "conceptualThroughline", "designBrief", "colorStory", "keyTouchpoints"],
          properties: {
            coreFrequency: { type: Type.STRING },
            diagnosis: { type: Type.STRING },
            conceptualThroughline: { type: Type.STRING },
            designBrief: { type: Type.STRING },
            colorStory: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING }, descriptor: { type: Type.STRING } } } },
            keyTouchpoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific cultural references, designers, or aesthetic movements." }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  }, ['gemini-3-pro-preview']);
};

export const analyzeTailorDraft = async (draft: TailorLogicDraft): Promise<TailorAuditReport> => {
    return await withResilience(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Draft Audit: ${JSON.stringify(draft)}. 
            
            IMPORTANT: Provide an 'informational audit' detailing EXACTLY how specific inputs from the draft (e.g. books, anime, designers) were translated into the final 'profileManifesto'. 
            The 'strategicOpportunity' should explain the market gap and translation logic.
            `,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 4096 }, // Reduced from 16384
                maxOutputTokens: 65536,
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["aestheticDirectives", "strategicOpportunity", "profileManifesto", "suggestedTouchpoints"],
                    properties: {
                        aestheticDirectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                        strategicOpportunity: { type: Type.STRING, description: "Explain the market gap and translation logic." },
                        profileManifesto: { type: Type.STRING },
                        suggestedTouchpoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return cleanAndParse(response.text);
    }, ['gemini-3-pro-preview']);
};

export const scryTrendSynthesis = async (items: PocketItem[], profile: UserProfile | null, query?: string): Promise<TrendSynthesisReport> => {
  return await withResilience(async (ai) => {
    const descriptors = items.slice(0, 12).map(i => `[${i.type}] ${i.content?.title || i.content?.name || 'Fragment'}`).join(' | ');
    const systemInstruction = query 
        ? `IDENTITY: You are a Trend Forecaster.
           TASK: Analyze current trends regarding: "${query}".
           TOOL USE: Use Google Search to find real-time, specific cultural signals.
           CONTEXT: The user's taste profile is: ${sanitizeProfile(profile)}.
           OUTPUT: Synthesize findings into a structured report.`
        : `IDENTITY: You are a Trend Forecaster.
           TASK: Analyze patterns in this collection of debris: ${descriptors}.
           TOOL USE: Use Google Search to ground these patterns in current events.
           OUTPUT: Synthesize findings into a structured report.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro for deep research
      contents: query ? `Investigate: ${query}` : `Synthesize Patterns`,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 },
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
  }, ['gemini-3-pro-preview']); // Fallback logic is handled by withResilience but Pro is preferred here
};

export const generateRawImage = async (prompt: string, ar: AspectRatio, size: ImageSize = "1K") => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: ar, imageSize: size } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part) throw new Error("Image restricted.");
    return `data:image/png;base64,${part.inlineData.data}`;
  }, ['gemini-3-pro-image-preview']);
};

export const identifyAestheticInstant = async (base64Data: string, mimeType: string, profile: UserProfile | null) => {
  return await withResilience(async (ai, modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Identify era and vibe. Output JSON with 'era' and 'vibe'." }] },
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  era: { type: Type.STRING },
                  vibe: { type: Type.STRING }
              },
              required: ["era", "vibe"]
          }
      }
    });
    return cleanAndParse(response.text);
  }, ['gemini-3-flash-preview', 'gemini-2.5-flash']); // Added fallback
};

export const generateMirrorRefraction = async (profile: UserProfile | null, titles: string) => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Omen refraction for ${sanitizeProfile(profile)} based on community feed: ${titles}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParse(response.text);
  }, ['gemini-2.5-flash-lite']);
};

export const generateSanctuaryReport = async (input: string, profile: UserProfile | null): Promise<SanctuaryReport> => {
  return await withResilience(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Sanctuary validation for user ${profile?.handle}: "${input}".`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4096 }, // Reduced from 16384
        maxOutputTokens: 65536
      }
    });
    return cleanAndParse(response.text);
  }, ['gemini-3-pro-preview']);
};

export const analyzeVisualShards = async (shards: string[], draft: TailorLogicDraft) => {
    return await withResilience(async (ai) => {
        const parts = shards.slice(0, 5).map(s => ({ inlineData: { mimeType: 'image/jpeg', data: s.split(',')[1] || s } }));
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [...parts, { text: `Audit shards against logic: ${JSON.stringify(draft)}. Provide a 'summary' that acts as a Generated Reflection on the Visual Language.` }] },
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 4096 }, // Reduced from 16384
                maxOutputTokens: 65536,
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["resonanceScore", "summary", "archivalRedirects", "resonanceClusters", "divergentSignals"],
                    properties: {
                        resonanceScore: { type: Type.NUMBER },
                        summary: { type: Type.STRING },
                        archivalRedirects: { type: Type.ARRAY, items: { type: Type.STRING } },
                        resonanceClusters: { type: Type.ARRAY, items: { type: Type.STRING } },
                        divergentSignals: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return cleanAndParse(response.text);
    });
};

export const generateInvestmentStrategy = async (items: PocketItem[], notes: string, profile: UserProfile | null): Promise<InvestmentReport> => {
  return await withResilience(async (ai) => {
    // 1. Prepare context with price/url awareness
    const context = items.map(i => {
       const price = i.content.price ? `(Price: ${i.content.price})` : '';
       const link = i.content.url ? `(Link: ${i.content.url})` : '';
       return `[${i.type}] ${i.content?.prompt || i.content?.title || 'Fragment'} ${price} ${link}`;
    }).join('\n');
    
    // 2. Strict Economic Strategist Prompt (Board Brief)
    const prompt = `
      You are an elite Economic Strategist for a Creative Director.
      Your goal is to prepare a "Board Brief" for an acquisition strategy.
      Audit a folder of aspirational items/fragments and provide a ruthless fiscal roadmap.
      
      USER CONTEXT & TAILOR PROFILE:
      ${sanitizeProfile(profile)}
      
      FOLDER NOTES:
      "${notes}"
      
      ITEMS TO AUDIT:
      ${context}
      
      MANDATE:
      1. Identify the ONE "Keystone Asset" that anchors the entire aesthetic vision. This is the non-negotiable investment.
      2. Categorize everything else. Be harsh. Is it a "Strategic Expense" (necessary infrastructure) or a "Vanity Metric" (fluff)?
      3. Recommend the specific Fiscal Route for each item based on its utility (e.g., "Business Write-off" for production assets, "Personal Equity" for timeless pieces, "Operational Cost").
      4. Use the provided price data to estimate budget impact if available.
      5. Identify missing infrastructure required to make these purchases viable.
      6. CRITICAL: Analyze how these items "mash" or align with the user's Tailor Profile (aesthetic core, desires, era focus). Provide a 'tailor_alignment_note'.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4096 }, // Reduced from 16384
        maxOutputTokens: 65536,
        responseSchema: {
          type: Type.OBJECT,
          required: ["thesis", "tailor_alignment_note", "capital_allocation", "capsule_impact_score", "missing_infrastructure"],
          properties: {
            thesis: { type: Type.STRING, description: "A high-level executive summary of the investment strategy." },
            tailor_alignment_note: { type: Type.STRING, description: "Analysis of how these items fit the user's defined Tailor Profile/Aesthetic Core." },
            capital_allocation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["category", "items", "reasoning", "fiscal_route"],
                properties: {
                  category: { type: Type.STRING, enum: ["KEYSTONE ASSET", "STRATEGIC EXPENSE", "VANITY METRIC"] },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reasoning: { type: Type.STRING, description: "Why this categorization?" },
                  fiscal_route: { type: Type.STRING, enum: ["Business Write-off", "Personal Equity", "Operational Cost"] }
                }
              }
            },
            capsule_impact_score: { type: Type.NUMBER, description: "0-100 score of how this collection impacts their brand value." },
            missing_infrastructure: { type: Type.STRING, description: "What is missing to justify these purchases?" }
          }
        }
      }
    });
    return cleanAndParse(response.text);
  }, ['gemini-3-pro-preview']);
};

export const generateStrategicBlueprint = async (items: PocketItem[], notes: string, profile: UserProfile | null): Promise<FruitionTrajectory> => {
    return await withResilience(async (ai) => {
        const descriptors = items.slice(0, 15).map(i => `${i.type}: ${i.content?.prompt || i.content?.name || 'Fragment'}`).join(' | ');
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Analyze these fragments: [${descriptors}]. Notes: ${notes}. Context: ${sanitizeProfile(profile)}.
            Generate a 'Fruition Trajectory' blueprint (inciting_debris, structural_pivot, climax_manifest, end_product_spec). This serves as a Strategic Application roadmap.
            Focus on actionable next steps and strategic clarity.`,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 4096 }, // Reduced from 16384
                maxOutputTokens: 65536,
                responseSchema: {
                    type: Type.OBJECT,
                    required: ["inciting_debris", "structural_pivot", "climax_manifest", "end_product_spec"],
                    properties: {
                        inciting_debris: { type: Type.STRING, description: "The core insight or trend triggering this strategy." },
                        structural_pivot: { type: Type.STRING, description: "The key decision or shift required." },
                        climax_manifest: { type: Type.STRING, description: "The peak execution or launch moment." },
                        end_product_spec: { type: Type.STRING, description: "The final deliverable or state." }
                    }
                }
            }
        });
        return cleanAndParse(response.text);
    }, ['gemini-3-pro-preview']);
};

export const compressImage = async (base64: string, quality = 0.5, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL('image/jpeg', quality)); }
            else resolve(base64);
        };
        img.onerror = () => resolve(base64);
    });
};

export const getAspectRatioForTone = (tone: string): string => {
    const map = { 'chic': '3:4', 'nostalgia': '2:3', 'dream': '4:3', 'panic': '9:16', 'unhinged': '1:1', 'editorial': '3:4' };
    return map[tone] || '3:4';
};