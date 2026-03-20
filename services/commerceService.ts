import { Product, EditIssue } from '../types';
import { withResilience, ORACLE_PERSONA } from './geminiService';
import { Type } from '@google/genai';
import { CodexState } from './codexService';

// Mock product database
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Sculptural Leather Harness',
    brand: 'AvantBrand',
    image: 'https://picsum.photos/seed/harness/400/400',
    price: 450,
    affiliateLink: '#',
    embedding: [0.1, 0.2, 0.3],
    category: 'Accessories',
    tags: ['sculptural', 'leather', 'matte']
  },
  {
    id: 'p2',
    name: 'Organic Moss Knit',
    brand: 'NatureCore',
    image: 'https://picsum.photos/seed/knit/400/400',
    price: 280,
    affiliateLink: '#',
    embedding: [0.4, 0.5, 0.6],
    category: 'Apparel',
    tags: ['organic', 'moss', 'knit']
  }
];

export const getPersonalizedEdit = async (
  userId: string, 
  userTasteVector: number[],
  codexState: CodexState
): Promise<EditIssue> => {
  // Mock vector similarity search
  const matchedProducts = MOCK_PRODUCTS.slice(0, 2); 
  
  return await withResilience(async (ai) => {
    const prompt = `Generate an editorial "Edit" issue.
    
    User Taste Vector: ${JSON.stringify(userTasteVector)}

    Codex State:
    - Entropy: ${codexState.entropy.toFixed(2)} (${codexState.entropy > 0.6 ? 'exploratory' : 'focused'})
    - Density: ${codexState.density.toFixed(2)} (${codexState.density > 0.6 ? 'concentrated' : 'diffuse'})
    - Velocity: ${codexState.velocity.toFixed(2)} (${codexState.velocity > 0.5 ? 'rapid shift' : 'stable'})

    Interpretation:
    - High entropy → juxtaposition, surprise
    - High density → cohesion, archival restraint
    - High velocity → acknowledge transition, frame as movement

    Matched Products: ${JSON.stringify(matchedProducts.map(p => ({ id: p.id, name: p.name, brand: p.brand, tags: p.tags })))}
    
    Write a narrative that reflects BOTH identity and state.
    Use a tone that is chic, percipient, and slightly mysterious. 
    Frame this as an exclusive "Edit" issue.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: ORACLE_PERSONA,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["trajectoryId", "thesis", "codexReading", "sequence"],
          properties: {
            trajectoryId: { type: Type.STRING },
            thesis: { type: Type.STRING },
            codexReading: { type: Type.STRING },
            sequence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["productId", "caption", "placement"],
                properties: {
                  productId: { type: Type.STRING },
                  caption: { type: Type.STRING },
                  placement: { type: Type.STRING, enum: ['hero', 'supporting', 'footnote'] }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      trajectoryId: result.trajectoryId || 'UNKNOWN-TRAJECTORY',
      thesis: result.thesis || 'A curated selection based on your taste.',
      codexReading: result.codexReading || 'Your taste is evolving.',
      sequence: result.sequence || matchedProducts.map(p => ({ productId: p.id, caption: 'A resonant selection.', placement: 'supporting' }))
    };
  });
};
