import { AIModel } from '../types/ai';

export const AI_MODELS = [
  {
    id: 'gemini' as AIModel,
    name: 'Gemini',
    description: 'Google\'s Gemini AI model'
  },
  {
    id: 'groq' as AIModel,
    name: 'Groq',
    description: 'Groq AI model'
  }
] as const;

export type AIModelType = typeof AI_MODELS[number]; 