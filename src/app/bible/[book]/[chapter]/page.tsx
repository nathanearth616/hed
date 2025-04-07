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
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left Column - Bible Verses */}
        <div className="space-y-4 lg:space-y-6 h-[60vh] lg:max-h-[calc(100vh-2rem)] overflow-y-auto">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white sticky top-0 
            py-3 lg:py-4 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            {book} {chapter}
          </h1>
          <div className="space-y-3 lg:space-y-4">
            {verses.map((verse) => (
              <div
                key={verse.verse}
                id={`verse-${verse.verse}`}
                onClick={() => handleVerseClick(verse)}
                className={`p-3 lg:p-4 rounded-lg transition-colors duration-500 cursor-pointer text-sm lg:text-base
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
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4 lg:space-y-6 
          h-[calc(40vh-2rem)] lg:h-[calc(100vh-4rem)] overflow-y-auto">
          {selectedVerse && (
            <>
              <div className="sticky top-0 py-3 lg:py-4 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                    Verse Analysis
                  </h2>
                  <button
                    onClick={() => analyzeVerse(selectedVerse, selectedModel)}
                    className={`w-full sm:w-auto px-3 py-2 rounded-lg text-sm lg:text-base transition-colors duration-200 
                      flex items-center justify-center gap-2 ${
                      analysisLoading || error?.includes('Rate limit')
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    disabled={analysisLoading || error?.includes('Rate limit')}
                  >
                    {analysisLoading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span className="truncate">Analyzing...</span>
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
                  {/* Original Language Analysis */}
                  {analysis.originalLanguage && analysis.originalLanguage.length > 0 && (
                    <section className="bg-white/90 dark:bg-black/90 rounded-xl p-4">
                      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Original Language</h3>
                      <div className="space-y-3">
                        {analysis.originalLanguage.map((word, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                {word.text}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                ({word.transliteration})
                              </span>
                              {word.strongsNumber && (
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  Strong's: {word.strongsNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{word.definition}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Key Words Analysis */}
                  {analysis.keyWords && (
                    <section className="bg-white/90 dark:bg-black/90 rounded-xl p-4">
                      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Key Words</h3>
                      <div className="space-y-3">
                        {analysis.keyWords.map((word, i) => (
                          <div key={i} className="space-y-1">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">{word.word}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Meaning:</span> {word.meaning}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Significance:</span> {word.significance}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Key Themes */}
                  <section className="bg-white/90 dark:bg-black/90 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Key Themes</h3>
                    <ul className="space-y-2">
                      {analysis.themes.map((theme, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{theme}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* Related Verses with improved styling */}
                  <section className="bg-white/90 dark:bg-black/90 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Related Verses</h3>
                    <div className="space-y-2">
                      {analysis.relatedVerses.map((verse, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400 shrink-0">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{verse}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Interpretation */}
                  {analysis.interpretation && (
                    <section className="bg-white/90 dark:bg-black/90 rounded-xl p-4">
                      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Interpretation</h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">Literal Meaning</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.interpretation.literal}</p>
                        </div>
                        {analysis.interpretation.allegorical && (
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">Allegorical Meaning</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.interpretation.allegorical}</p>
                          </div>
                        )}
                        {analysis.interpretation.moral && (
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">Moral Application</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.interpretation.moral}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Theological Significance */}
                  <section className="bg-white/90 dark:bg-black/90 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Theological Significance</h3>
                    <p className="text-gray-700 dark:text-gray-300">{analysis.significance}</p>
                  </section>

                  {/* Historical and Cultural Context */}
                  <section className="bg-white/90 dark:bg-black/90 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Historical Context</h3>
                    <p className="text-gray-700 dark:text-gray-300">{analysis.context}</p>
                    {analysis.culturalContext && (
                      <>
                        <h3 className="font-semibold mb-3 mt-4 text-gray-900 dark:text-white">Cultural Context</h3>
                        <p className="text-gray-700 dark:text-gray-300">{analysis.culturalContext}</p>
                      </>
                    )}
                  </section>

                  {/* Application Points */}
                  {analysis.applicationPoints && (
                    <section className="bg-white/90 dark:bg-black/90 rounded-xl p-4">
                      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Application Points</h3>
                      <ul className="space-y-2">
                        {analysis.applicationPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400">•</span>
                            <span className="text-gray-700 dark:text-gray-300">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 