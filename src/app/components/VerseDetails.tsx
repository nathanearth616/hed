import { BibleVerse } from '../types/bible';
import { useGeminiAnalysis } from '../hooks/useGeminiAnalysis';
import LoadingSpinner from './LoadingSpinner';
import { useState, useEffect } from 'react';

export default function VerseDetails({ verse }: { verse: BibleVerse | null }) {
  const { analysis, isLoading, error, analyzeVerse } = useGeminiAnalysis();
  const [retryTimer, setRetryTimer] = useState<number | null>(null);

  useEffect(() => {
    if (retryTimer !== null) {
      const timer = setTimeout(() => setRetryTimer(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryTimer]);

  const handleAnalyze = async () => {
    if (retryTimer !== null) return;
    try {
      await analyzeVerse(verse);
    } catch (err) {
      if (err instanceof Error && err.message.includes('429')) {
        setRetryTimer(60);
      }
    }
  };

  if (!verse) return null;

  return (
    <div className="space-y-6">
      {/* Verse Card */}
      <div className="p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-indigo-600 dark:text-indigo-400">
              {verse.book} {verse.chapter}:{verse.verse}
            </h2>
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 
              text-gray-600 dark:text-gray-400 text-xs font-medium">
              {verse.testament} Testament
            </span>
          </div>
          <p className="text-gray-900 dark:text-gray-100 text-lg">{verse.text}</p>
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 
              rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
              {retryTimer && (
                <div className="mt-2 text-sm">
                  Please wait {retryTimer} seconds before trying again
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleAnalyze}
            disabled={isLoading || retryTimer !== null}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 
              hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 
              text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span>Analyzing...</span>
              </>
            ) : retryTimer ? (
              `Retry in ${retryTimer}s`
            ) : (
              'Analyze with AI'
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Themes */}
          <div className="p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Key Themes</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.themes.map((theme, i) => (
                <span 
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 
                    text-indigo-600 dark:text-indigo-400 text-sm font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Related Verses */}
          <div className="p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Related Verses</h3>
            <div className="space-y-2">
              {analysis.relatedVerses.map((verse, i) => (
                <div 
                  key={i}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 
                    text-gray-600 dark:text-gray-300 text-sm"
                >
                  {verse}
                </div>
              ))}
            </div>
          </div>

          {/* Significance & Context */}
          <div className="p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Theological Significance</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {analysis.significance}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Historical Context</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {analysis.context}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 