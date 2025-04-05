import { useState } from 'react';
import { BibleVerse, GeminiAnalysis } from '../types/bible';

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze verse');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the verse');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { analysis, isLoading, error, analyzeVerse };
} 