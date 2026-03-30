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
