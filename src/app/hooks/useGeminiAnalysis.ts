import { useState } from 'react';
import { BibleVerse } from '../types/bible';
import { AIModel } from '../types/ai';

interface GeminiAnalysis {
  themes: string[];
  relatedVerses: string[];
  significance: string;
  context: string;
}

export function useGeminiAnalysis() {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeVerse = async (verse: BibleVerse, model: AIModel = 'gemini') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verses/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verse, model }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze verse');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze verse');
    } finally {
      setIsLoading(false);
    }
  };

  return { analysis, isLoading, error, analyzeVerse };
} 