import { useState } from 'react';
import { BibleVerse } from '../types/bible';
import { AIModel } from '../types/ai';
import { GeminiAnalysis } from '../types/analysis';

export function useGeminiAnalysis() {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const RATE_LIMIT_INTERVAL = 60000; // 1 minute in milliseconds

  const analyzeVerse = async (verse: BibleVerse, model: AIModel) => {
    // Check if enough time has passed since the last request
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_INTERVAL) {
      const waitTime = Math.ceil((RATE_LIMIT_INTERVAL - timeSinceLastRequest) / 1000);
      setError(`Rate limit reached. Please wait ${waitTime} seconds before trying again.`);
      return;
    }

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
        if (response.status === 429) {
          throw new Error('Rate limit reached. Please try again in a minute.');
        }
        throw new Error(errorData.error || 'Failed to analyze verse');
      }
      
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        setAnalysis(data);
        setLastRequestTime(now);
      } catch (parseError) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const cleanedJson = jsonMatch[0]
            .replace(/^[^{]*/, '')
            .replace(/[^}]*$/, '');
          
          const data = JSON.parse(cleanedJson);
          setAnalysis(data);
          setLastRequestTime(now);
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