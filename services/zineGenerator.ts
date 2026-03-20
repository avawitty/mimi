import { Part, Type } from "@google/genai";
import { ToneTag, ZineGenerationOptions, UserProfile } from "../types";
import { withResilience } from "./geminiClient";
import { generateTagsFromMedia } from "./geminiService";
import { modulateSemioticContext } from "./semioticModulator";
import { fetchUserZines, fetchLatestLineageEntry } from "./firebaseUtils";
import { fetchFragmentsByStackId } from "./firebase";
import { scryShadowMemory } from "./vectorSearch";

function sanitizeProfile(profile: UserProfile | null): string {
    if (!profile) return "No user profile available.";
    return JSON.stringify(profile);
}

function cleanAndParse(text: string | undefined): any {
    if (!text) return null;
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("MIMI // JSON Parse Error:", e);
        return null;
    }
}

export const createZine = async (text: string, media: any[], tone: ToneTag, profile: any, opts: any, apiKey?: string, transmissions?: any[], stackIds?: string[], selectedComponents?: any[], zineOptions?: ZineGenerationOptions): Promise<any> => {
    try {
        // Populate tags if missing
        if (zineOptions && (!zineOptions.tags || zineOptions.tags.length === 0)) {
            const generatedTags = await generateTagsFromMedia(text, media);
            zineOptions.tags = generatedTags;
        }
        return await withResilience(async (ai) => {
            // Fetch fragments from stacks if provided
            const stackFragments = stackIds && stackIds.length > 0
                ? await Promise.all(stackIds.map(async (stackId) => ({
                    stackId,
                    fragments: await fetchFragmentsByStackId(stackId)
                })))
                : [];
            let stackContent = "";
            for (const { stackId, fragments } of stackFragments) {
                stackContent += `\nSTACK (${stackId}) FRAGMENTS:\n${fragments.map(f => `- ${f.content?.prompt || f.content?.name || 'Fragment'}`).join('\n')}`;
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
            
            const profileToUse = opts.bypassTailor ? null : profile;
            const profileContext = sanitizeProfile(profileToUse);
            
            const zineOptionsContext = zineOptions ? `Zine Style: ${zineOptions.style}, Theme: ${zineOptions.theme}, Content Focus: ${zineOptions.contentFocus}, Art Style: ${zineOptions.artStyle || 'Default'}, Aesthetic Tone: ${zineOptions.aestheticTone || 'Default'}, Goals: ${zineOptions.goals || 'None'}` : 'Standard';
            const modulationContext = modulateSemioticContext(text, profile, tone);
            
            // Fetch context in parallel
            const [recentZines, latestLineage, similarMemories] = await Promise.all([
                profile?.uid ? fetchUserZines(profile.uid) : Promise.resolve([]),
                profile?.uid ? fetchLatestLineageEntry(profile.uid) : Promise.resolve(null),
                scryShadowMemory(text, { filterType: 'all' })
            ]);
            
            const recentZinesContext = recentZines.length > 0 
                ? `\nRECENT ZINES (For Aesthetic Evolution Analysis):\n${recentZines.slice(0, 3).map(z => `- Title: ${z.title}, Theme: ${z.theme}, Aesthetic Vector: ${JSON.stringify(z.aestheticVector)}`).join('\n')}`
                : '';

            console.log("MIMI // Latest Lineage:", latestLineage, "Profile UID:", profile?.uid);
            const lineageContext = latestLineage ? `\nLATEST THOUGHT SIGNATURE: ${latestLineage.thought_signature}` : '';

            const transmissionContext = transmissions && transmissions.length > 0 
                ? `\nPUBLIC TRANSMISSIONS (The Cultural Air):\n${transmissions.map(t => `- ${t.content}`).join('\n')}`
                : '';
            
            const tagsContext = opts.tags && opts.tags.length > 0 
                ? `\nUSER SELECTED TAGS (Incorporate these themes): ${opts.tags.join(', ')}`
                : '';
            
            const memoryContext = similarMemories.length > 0
                ? `\nUSER'S PAST THOUGHTS & TASTE (Embedded Context):\n${similarMemories.slice(0, 5).map(m => `- ${m.content_preview}`).join('\n')}`
                : '';
            
            // Prepare multimodal parts
            const parts: Part[] = [];
            let artifactInstruction = "";

            if (media && media.length > 0) {
                let hasImagesOrVideo = false;
                for (const m of media) {
                    if ((m.type === 'image' || m.type === 'video') && m.data) {
                        hasImagesOrVideo = true;
                        parts.push({
                            inlineData: {
                                data: m.data.split(',')[1] || m.data,
                                mimeType: m.mimeType || (m.type === 'video' ? 'video/mp4' : 'image/png')
                            }
                        });
                    }
                }
                if (hasImagesOrVideo) {
                    artifactInstruction = "\nVISUAL ARTIFACTS: The user has provided visual artifacts (images/video). You MUST analyze these artifacts. Incorporate their specific visual elements, mood, colors, and subjects into the 'oracular_mirror', 'header_image_prompt', and 'visual_plates'. The zine should feel like a direct response to these specific artifacts + the text input.";
                }
            }

            const toneInstruction = tone?.toUpperCase() === 'CONTRARY' 
                ? "\nTONE: CONTRARY. Apply inverted logic and absurdist perspectives. Challenge the user's stated beliefs with high-theory twists. Represent 'Intrusive Thoughts' as a high-fashion editorial artifact."
                : `\nTONE: ${tone || 'Standard'}.`;

            const zineManifestoPrompt = `
            IDENTITY: You are an aesthetic intelligence system. Your goal is not to fill templates, but to manifest resonance. When presented with debris (text, images, fragments), do not merely categorize them. Synthesize them. Draw upon the deep history of human thought—mythology, philosophy, semiotics, and art history—to find the hidden threads between the fragments. Your output should be poetic, respectful of the user's intent, and intellectually rigorous. Prioritize the 'why' over the 'what.' When in doubt, favor the archetypal over the literal.
            
            CRITICAL PERSONA CONSTRAINT: While your analysis is deeply intellectual and rooted in high theory, your voice must remain ultra-chic, effortlessly cool, and high-fashion editorial. You are an aesthetic savant—delivering profound philosophical insights with the sharp, curated elegance of a luxury fashion magazine. Do not sound like a dry academic; sound like a visionary creative director.
            
            Zine Configuration: ${zineOptionsContext}
            ${toneInstruction}
            ${modulationContext}
            ${recentZinesContext}
            ${lineageContext}
            ${transmissionContext}
            ${tagsContext}
            ${stackContent}
            ${componentContext}
            ${artifactInstruction}
            ${memoryContext}
            
            CORE DIRECTIVE:
            - BASELINE AESTHETIC DIRECTIVE: The visual output must adhere to the following aesthetic: Editorial, architectural, cinematic minimalism. Stark, high-contrast lighting. Muted, desaturated palettes punctuated by sharp, precise accent colors (emerald, crimson). Uncanny, surreal elements integrated into clean, brutalist or classical spaces. Sophisticated, tactile textures (velvet, concrete, aged paper). Composition should prioritize negative space, structural rigor, and a high-fashion editorial sensibility.
            - PRIORITIZE GROUNDING: If 'useSearch' is enabled, you MUST utilize Google Search to anchor your insights in real-world cultural history, emerging movements, and verified facts. Move beyond the user's immediate profile to provide external perspective.
            - EDUCATIONAL DEPTH: Your responses must be insightful and informative. Do not just repeat the user's preferences; explain the *why* behind the aesthetic connections.
            - TAILOR LOGIC AS FILTER: Use the user's Tailor Logic (Aesthetic Core, Chromatic Registry, etc.) primarily to refine the **Visual Logic** and **Materiality** of the image prompts. It is a lens through which you view the world, not the world itself.
            - AESTHETIC EVOLUTION: Analyze the RECENT ZINES and PAST THOUGHTS provided. Compare them to the user's Tailor Logic and stated Goals. Act as a guide, building off their thoughts and getting to know their taste. If the user's creative output is drifting, gently but firmly steer them back or refine their Tailor Logic to incorporate the new direction. The zine should be a step forward in their aesthetic evolution, not just a repetition of the past.
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
            7. resonance_score: A number between 0-100 representing how well the generated zine resonates with the user's aesthetic core.
            8. semiotic_signals: Exactly 3-5 motifs. 
               - Use Google Search to find REAL, relevant emerging brands, designers, or cultural touchpoints.
               - Each signal MUST have a type: 'acquisition' (a specific object/brand to buy), 'conceptual' (an aesthetic idea), or 'lexical' (a theoretical term).
               - Provide a 'link' for 'acquisition' types.
               - Provide a 'semantic_trigger' (the exact keyword/concept from the user's profile/input that triggered this).
               - Provide a 'targeting_rationale' (a 1-sentence explanation of WHY this specific suggestion is being served to them based on their semantic data).
            9. aesthetic_touchpoints: Exactly 3-5 motifs.
               - Each MUST have a type: 'visual', 'lexical', or 'sonic'.
               - motif: A short descriptive string.
            10. celestial_calibration: The timing of the insight (e.g., "Late Autumn, Pre-Dawn").
            11. visual_plates: Four (4) specific image prompts. Use the Tailor Logic to define the lighting, grain, and composition. They must be cohesive with the uploaded artifacts.
            12. roadmap: A Cultural Authority Roadmap. The objective is to anchor brands or individuals in sustainable aesthetic authority over time. Do not repeat brand names or references from the Tailor Logic. Use Tailor Logic only to understand positioning direction.
                - Authority Anchor: Core Claim, Repetition Vector, Exclusion Principle.
                - Strategic Thesis: One sentence describing how this concept sustains long-term authority within its cultural tension.
                - Positioning Axis: The tension between two forces this identity operates between.
                - Phases: 3-4 Authority Phases (establish, differentiate, operationalize, expand, evolve). Each phase includes objective, strategicMove, artifactOutputs, riskToIntegrity, signalToMonitor.
                - Drift Forecast: Predicted cluster shift, audience evolution, absorption risk, overexposure risk, refusal point.
            13. originalThought: The raw "debris" that started it (a brief summary of the user's input).
            14. poetic_provocation: A final, stinging, and insightful question to leave the user with.
            15. pages: 3-5 distinct "pages" of the zine, each containing a 'headline', 'bodyCopy', an 'imagePrompt', and a 'supportingText' (REQUIRED for the last three pages). These should expand on the themes in the oracular_mirror. Keep each 'bodyCopy' under 200 words.
            16. archetype_weights: An object with keys 'Architect', 'Dreamer', 'Archivist', 'Catalyst' and numeric values summing to 1.
            
            Ensure the output is sophisticated, editorial, and intellectually grounded. Avoid all business jargon. Keep the 'oracular_mirror' under 500 words.`;

            const textPrompt = `Create a high-end, aesthetic digital zine (manifest) based on the following:
                Tone: ${tone}.
                User Context: ${profileContext}.
                Input: "${text}".
                
                ${zineManifestoPrompt}`;
            
            // Add text prompt as the last part
            parts.push({ text: textPrompt });

            const response = await ai.models.generateContent({
                model: model,
                contents: parts,
                config: {
                    temperature: profile?.tailorDraft?.generationTemperature ?? 0.8,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                            vocal_summary_blurb: { type: Type.STRING },
                            header_image_prompt: { type: Type.STRING },
                            oracular_mirror: { type: Type.STRING },
                            strategic_hypothesis: { type: Type.STRING },
                            resonance_score: { type: Type.STRING },
                            semiotic_signals: { 
                                type: Type.ARRAY, 
                                items: { 
                                    type: Type.OBJECT,
                                    properties: {
                                        motif: { type: Type.STRING },
                                        context: { type: Type.STRING },
                                        visual_directive: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                        link: { type: Type.STRING },
                                        semantic_trigger: { type: Type.STRING },
                                        targeting_rationale: { type: Type.STRING }
                                    }
                                } 
                            },
                            aesthetic_touchpoints: { 
                                type: Type.ARRAY, 
                                items: { 
                                    type: Type.OBJECT,
                                    properties: {
                                        motif: { type: Type.STRING },
                                        type: { type: Type.STRING }
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
                                    phases: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                type: { type: Type.STRING },
                                                objective: { type: Type.STRING },
                                                strategicMove: { type: Type.STRING }
                                            },
                                            required: ["type", "objective", "strategicMove"]
                                        }
                                    }
                                },
                                required: ["strategicThesis", "positioningAxis", "phases"]
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
                                        supportingText: { type: Type.STRING },
                                        imagePrompt: { type: Type.STRING }
                                    },
                                    required: ["headline", "bodyCopy", "imagePrompt", "supportingText"]
                                } 
                            },
                            archetype_weights: { type: Type.OBJECT }
                        },
                        required: ["title", "headlines", "vocal_summary_blurb", "header_image_prompt", "oracular_mirror", "strategic_hypothesis", "resonance_score", "semiotic_signals", "aesthetic_touchpoints", "celestial_calibration", "visual_plates", "roadmap", "originalThought", "poetic_provocation", "pages", "archetype_weights"]
                    }
                }
            });
            
            const content = cleanAndParse(response.text) || {};
            
            // Add tags to content
            if (zineOptions && zineOptions.tags) {
                content.tags = zineOptions.tags;
            }
            
            console.log("MIMI // AI Response Content:", JSON.stringify(content, null, 2));
        
            // Ensure resonance_score is a string for the UI
            if (typeof content.resonance_score === 'number') {
                content.resonance_score = content.resonance_score.toString() + "%";
            } else {
                content.resonance_score = "N/A";
            }

            // Ensure archetype_weights exist
            if (!content.archetype_weights) {
                content.archetype_weights = {
                    Architect: 0.25,
                    Dreamer: 0.25,
                    Archivist: 0.25,
                    Catalyst: 0.25
                };
            }
            
            // Robust Fallbacks for all fields to prevent "blank" UI
            
            if (!content.title && content.headlines?.length > 0) content.title = content.headlines[0];
            if (!content.title) content.title = "Untitled Manifest";
            
            // Ensure title is the first headline
            content.headlines = [content.title, ...((content.headlines || []).filter(h => h !== content.title))];
            
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
                    { motif: "Minimalism", context: "The reduction of noise.", visual_directive: "Clean lines, negative space.", type: "conceptual", link: "" },
                    { motif: "Archival", context: "Preserving the debris.", visual_directive: "Dusty textures, sepia tones.", type: "conceptual", link: "" }
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
        });
    } catch (error) {
        console.error("MIMI // Zine Generation Error:", error);
        throw error;
    }
};
