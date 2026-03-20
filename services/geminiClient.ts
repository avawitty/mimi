import { GoogleGenAI } from "@google/genai";

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

  if (!key && typeof import.meta !== 'undefined' && (import.meta as any).env) {
    key = (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  
  if (!key) {
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
      error.status === 500 ||
      error.code === 500;

    if (isQuotaError && retries > 0) {
      console.warn(`MIMI // Gemini Resilience: Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withResilience(operation, apiKeyOverride, retries - 1, delay * 2, [...attemptedKeys, keyUsed]);
    }
    throw error;
  }
}
