'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getChapterVerses } from '@/app/lib/bible-api';
import { BibleVerse } from '@/app/types/bible';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useGeminiAnalysis } from '@/app/hooks/useGeminiAnalysis';
import { AIModel } from '@/app/types/ai';
import { AI_MODELS } from '@/app/constants/ai-models';

export default function BibleChapterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const { analysis, isLoading: analysisLoading, error: analysisError, analyzeVerse } = useGeminiAnalysis();

  const book = params.book as string;
  const chapter = parseInt(params.chapter as string);
  const highlightVerse = parseInt(searchParams.get('highlight') || '0');
  const selectedModel = (searchParams.get('model') || 'gemini') as AIModel;

  useEffect(() => {
    const loadVerses = async () => {
      try {
        setLoading(true);
        setError(null);
        const chapterVerses = await getChapterVerses(book, chapter);
        
        if (!chapterVerses || chapterVerses.length === 0) {
          throw new Error(`No verses found for ${book} chapter ${chapter}`);
        }
        
        setVerses(chapterVerses);
        
        if (highlightVerse) {
          const verse = chapterVerses.find(v => v.verse === highlightVerse);
          if (verse) {
            setSelectedVerse(verse);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load verses';
        setError(errorMessage);
        console.error('Error loading verses:', err);
      } finally {
        setLoading(false);
      }
    };

    if (book && chapter) {
      loadVerses();
    } else {
      setError('Invalid book or chapter');
    }
  }, [book, chapter, highlightVerse]);

  useEffect(() => {
    if (highlightVerse && !loading) {
      const verseElement = document.getElementById(`verse-${highlightVerse}`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightVerse, loading]);

  const handleVerseClick = (verse: BibleVerse) => {
    setSelectedVerse(verse);
    analyzeVerse(verse, selectedModel);
  };

  const getModelName = (modelId: AIModel) => {
    return AI_MODELS.find(m => m.id === modelId)?.name || 'AI';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 
          dark:border-red-500/20 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Error Loading Chapter
          </h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white 
              rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Bible Verses */}
        <div className="space-y-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white sticky top-0 
            py-4 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            {book} {chapter}
          </h1>
          <div className="space-y-4">
            {verses.map((verse) => (
              <div
                key={verse.verse}
                id={`verse-${verse.verse}`}
                onClick={() => handleVerseClick(verse)}
                className={`p-4 rounded-lg transition-colors duration-500 cursor-pointer
                  ${verse.verse === highlightVerse
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-white/95 dark:bg-black/70 hover:bg-white/98 dark:hover:bg-black/80'
                  }`}
              >
                <span className="font-medium text-green-600 dark:text-green-400 mr-2">
                  {verse.verse}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{verse.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Verse Analysis */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-6 
          max-h-[calc(100vh-4rem)] overflow-y-auto">
          {selectedVerse && (
            <>
              <div className="sticky top-0 py-4 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Verse Analysis
                  </h2>
                  <button
                    onClick={() => analyzeVerse(selectedVerse, selectedModel)}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 
                      flex items-center gap-2 ${
                      analysisLoading || error?.includes('Rate limit')
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    disabled={analysisLoading || error?.includes('Rate limit')}
                  >
                    {analysisLoading ? (
                      <>
                        <LoadingSpinner />
                        <span>Analyzing with {getModelName(selectedModel)}...</span>
                      </>
                    ) : error?.includes('Rate limit') ? (
                      'Please wait...'
                    ) : (
                      `Analyze with ${getModelName(selectedModel)}`
                    )}
                  </button>
                </div>
              </div>

              {analysisError && (
                <div className={`p-4 rounded-xl ${
                  error?.includes('Rate limit')
                    ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {analysisError}
                </div>
              )}

              {analysis && (
                <div className="space-y-6">
                  {/* Analysis sections */}
                  <section>
                    <h3 className="font-semibold mb-2">Key Themes</h3>
                    <ul className="list-disc list-inside">
                      {analysis.themes.map((theme, i) => (
                        <li key={i}>{theme}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold mb-2">Related Verses</h3>
                    <ul className="list-disc list-inside">
                      {analysis.relatedVerses.map((verse, i) => (
                        <li key={i}>{verse}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold mb-2">Theological Significance</h3>
                    <p>{analysis.significance}</p>
                  </section>

                  <section>
                    <h3 className="font-semibold mb-2">Historical Context</h3>
                    <p>{analysis.context}</p>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 