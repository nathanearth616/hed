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

  // Automatically analyze the verse when it's selected
  useEffect(() => {
    if (verse && !analysis && !isLoading && !error && !retryTimer) {
      handleAnalyze(selectedModel);
    }
  }, [verse, selectedModel]);

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
            <h2 className="font-medium text-green-600 dark:text-green-400">
              {verse.book} {verse.chapter}:{verse.verse}
            </h2>
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 
              text-gray-600 dark:text-gray-400 text-xs font-medium">
              {verse.testament} Testament
            </span>
          </div>

          {/* Verse Text */}
          <p className="text-gray-900 dark:text-gray-100 text-lg">{verse.text}</p>
          
          {/* AI Model Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                Using AI Model
              </h3>
            </div>
            <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-500/10
              flex flex-col items-center gap-3">
              <span className="text-4xl">{AI_MODELS.find(m => m.id === selectedModel)?.icon}</span>
              <div className="text-center">
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {AI_MODELS.find(m => m.id === selectedModel)?.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {AI_MODELS.find(m => m.id === selectedModel)?.description}
                </div>
              </div>
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
            className="w-full mt-6 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 
              hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 
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
                  className="px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 
                    text-green-600 dark:text-green-400 text-sm font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Word Study */}
          {analysis.wordStudy && analysis.wordStudy.keyWords.length > 0 && (
            <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
              border border-white/20 backdrop-blur-md">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Word Study</h3>
              <div className="space-y-4">
                {analysis.wordStudy.keyWords.map((word: { word: string; translation: string; meaning: string }, i: number) => (
                  <div key={i} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 
                        text-green-800 dark:text-green-300 text-sm font-medium">
                        {word.word}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 
                        text-blue-800 dark:text-blue-300 text-sm font-medium">
                        {word.translation}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {word.meaning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Literary Devices */}
          {analysis.literaryDevices && analysis.literaryDevices.length > 0 && (
            <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
              border border-white/20 backdrop-blur-md">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Literary Devices</h3>
              <div className="space-y-3">
                {analysis.literaryDevices.map((device: { device: string; explanation: string }, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                      {device.device}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {device.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross References */}
          {analysis.crossReferences && analysis.crossReferences.length > 0 && (
            <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
              border border-white/20 backdrop-blur-md">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Cross References</h3>
              <div className="space-y-3">
                {analysis.crossReferences.map((ref, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="font-medium text-green-600 dark:text-green-400 mb-1">
                      {ref.reference}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {ref.connection}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Verses */}
          <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
            border border-white/20 backdrop-blur-md">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Related Verses</h3>
            <ul className="space-y-3">
              {analysis.relatedVerses.map((verse, i) => (
                <li 
                  key={i}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 
                    text-gray-700 dark:text-gray-300"
                >
                  {verse}
                </li>
              ))}
            </ul>
          </div>

          {/* Application */}
          {analysis.application && (
            <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
              border border-white/20 backdrop-blur-md">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Application</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Personal</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {analysis.application.personal}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Community</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {analysis.application.community}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Society</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {analysis.application.society}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Theological Significance */}
          <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
            border border-white/20 backdrop-blur-md">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Theological Significance</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {analysis.significance}
            </p>
          </div>

          {/* Historical Context */}
          <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
            border border-white/20 backdrop-blur-md">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Historical Context</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {analysis.context}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 