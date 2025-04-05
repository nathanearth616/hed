import { BibleVerse } from '../types/bible';
import { useGeminiAnalysis } from '../hooks/useGeminiAnalysis';
import { AIModel, AI_MODELS } from '../types/ai';
import LoadingSpinner from './LoadingSpinner';
import { useState, useEffect } from 'react';

export default function VerseDetails({ 
  verse, 
  selectedModel 
}: { 
  verse: BibleVerse | null;
  selectedModel: AIModel;
}) {
  const { analysis, isLoading, error, analyzeVerse } = useGeminiAnalysis();
  const [retryTimer, setRetryTimer] = useState<number | null>(null);

  useEffect(() => {
    if (retryTimer !== null) {
      const timer = setTimeout(() => setRetryTimer(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryTimer]);

  const handleAnalyze = async (model: AIModel) => {
    if (retryTimer !== null || !verse) return;
    try {
      await analyzeVerse(verse, model);
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
      <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
        border border-white/20 backdrop-blur-md">
        <div className="space-y-4">
          {/* Verse Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-indigo-600 dark:text-indigo-400">
              {verse.book} {verse.chapter}:{verse.verse}
            </h2>
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 
              text-gray-600 dark:text-gray-400 text-xs font-medium">
              {verse.testament} Testament
            </span>
          </div>

          {/* Verse Text */}
          <p className="text-gray-900 dark:text-gray-100 text-lg">{verse.text}</p>
          
          {/* AI Model Selector */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                Select AI Model
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Choose an AI model for analysis
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleAnalyze(model.id)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-3
                    ${selectedModel === model.id 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-indigo-500/50'
                    }
                  `}
                >
                  {selectedModel === model.id && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <span className="text-4xl">{model.icon}</span>
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {model.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {model.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 
              rounded-xl text-red-600 dark:text-red-400 text-sm mt-4">
              {error}
              {retryTimer && (
                <div className="mt-2 text-sm">
                  Please wait {retryTimer} seconds before trying again
                </div>
              )}
            </div>
          )}
          
          {/* Analyze Button */}
          <button
            onClick={() => handleAnalyze(selectedModel)}
            disabled={isLoading || retryTimer !== null}
            className="w-full mt-6 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 
              hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 
              text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span>Analyzing with {AI_MODELS.find(m => m.id === selectedModel)?.name}...</span>
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
          <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
            border border-white/20 backdrop-blur-md">
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
          <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
            border border-white/20 backdrop-blur-md">
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
          <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
            border border-white/20 backdrop-blur-md space-y-6">
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