import { useState } from 'react';
import { BibleVerse } from '../types/bible';
import { AIModel } from '../types/ai';
import { GeminiAnalysis } from '../types/analysis';

export function useGeminiAnalysis() {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeVerse = async (verse: BibleVerse, model: AIModel) => {
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
      
      const text = await response.text(); // First get the raw text
      
      try {
        // Try to parse the JSON response
        const data = JSON.parse(text);
        setAnalysis(data);
      } catch (parseError) {
        // If JSON parsing fails, try to extract the JSON portion
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const cleanedJson = jsonMatch[0]
            .replace(/^[^{]*/, '') // Remove anything before the first {
            .replace(/[^}]*$/, ''); // Remove anything after the last }
          
          const data = JSON.parse(cleanedJson);
          setAnalysis(data);
        } else {
          throw new Error('Failed to parse analysis response');
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze verse');
    } finally {
      setIsLoading(false);
    }
  };

  return { analysis, isLoading, error, analyzeVerse };
} 