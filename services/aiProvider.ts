import { getClient } from './geminiService';

export interface AIProvider {
  generateContent: (params: any) => Promise<any>;
}

class GeminiProvider implements AIProvider {
  async generateContent(params: any) {
    const { ai } = getClient();
    return await ai.models.generateContent(params);
  }
}

let currentProvider: 'gemini' | 'openai' = 'gemini';

export const setAIProvider = (provider: 'gemini' | 'openai') => {
  currentProvider = provider;
};

export const getAIProvider = (): AIProvider => {
  if (currentProvider === 'gemini') {
    return new GeminiProvider();
  }
  throw new Error('OpenAI provider not implemented');
};
