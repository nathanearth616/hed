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
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const now = Date.now();
    if (lastRequestTime && now - lastRequestTime < 60000) {
      setError('Rate limit reached. Please try again in a minute.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/verses/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verse, model }),
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit reached. Please try again in a minute.');
        }
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to analyze verse');
        } catch {
          throw new Error(`Failed to analyze verse: ${response.statusText}`);
        }
      }
      
      // First try to get the response as text
      const text = await response.text();
      
      // If the text is empty, throw an error
      if (!text.trim()) {
        throw new Error('Empty response from server');
      }

      try {
        // Try to parse the entire response as JSON first
        const data = JSON.parse(text);
        setAnalysis(data);
        setLastRequestTime(now);
      } catch (parseError) {
        // If that fails, try to find a JSON object in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const cleanedJson = jsonMatch[0]
              .replace(/^[^{]*/, '')  // Remove anything before the first {
              .replace(/[^}]*$/, ''); // Remove anything after the last }
            
            const data = JSON.parse(cleanedJson);
            setAnalysis(data);
            setLastRequestTime(now);
          } catch (secondaryParseError) {
            console.error('Failed to parse cleaned JSON:', secondaryParseError);
            throw new Error('Failed to parse analysis response');
          }
        } else {
          console.error('No valid JSON found in response:', text);
          throw new Error('Invalid response format from server');
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