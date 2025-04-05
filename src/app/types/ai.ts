export type AIModel = 'gemini' | 'groq';

export interface AIModelConfig {
  id: AIModel;
  name: string;
  description: string;
  icon: string;
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'s latest AI model',
    icon: '🤖'
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference',
    icon: '⚡'
  }
]; 