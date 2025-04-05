import { useState } from 'react';
import { BibleVerse } from '../types/bible';

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

  const analyzeVerse = async (verse: BibleVerse) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verse }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze verse');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return { analysis, isLoading, error, analyzeVerse };
} 