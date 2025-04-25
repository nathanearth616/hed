'use client';

import { useState, useEffect } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { useGeminiAnalysis } from '@/app/hooks/useGeminiAnalysis';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { BibleVerse } from '@/app/types/bible';
import { AIModel } from '@/app/types/ai';

async function getBibleChapter(book: string, chapter: string) {
  try {
    const decodedBook = decodeURIComponent(book);
    const chapterNum = parseInt(chapter);
    
    if (isNaN(chapterNum)) {
      throw new Error('Invalid chapter number');
    }

    const apiUrl = `https://bible-api.com/${decodedBook} ${chapterNum}`;
    const response = await fetch(apiUrl, { next: { revalidate: 3600 } });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Bible content');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export default function BibleChapterPage({
  params,
}: {
  params: { book: string; chapter: string };
}) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const searchParams = useSearchParams();
  const highlightVerse = parseInt(searchParams.get('verse') || '0');
  const selectedModel: AIModel = (searchParams.get('model') || 'gemini') as AIModel;
  const { analysis, isLoading: analysisLoading, error: analysisError, analyzeVerse } = useGeminiAnalysis();

  useEffect(() => {
    const loadChapter = async () => {
      try {
        const chapterData = await getBibleChapter(params.book, params.chapter);
        setData(chapterData);

        if (highlightVerse) {
          const verse = chapterData.verses.find((v: any) => v.verse === highlightVerse);
          if (verse) {
            setSelectedVerse({
              id: highlightVerse,
              book: params.book,
              chapter: parseInt(params.chapter),
              verse: verse.verse,
              text: verse.text,
              testament: params.book.toLowerCase().includes('genesis') ? 'old' : 'new'
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
      }
    };

    loadChapter();
  }, [params.book, params.chapter, highlightVerse]);

  useEffect(() => {
    if (selectedVerse) {
      const verseElement = document.getElementById(`verse-${selectedVerse.verse}`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      analyzeVerse(selectedVerse, selectedModel);
    }
  }, [selectedVerse, analyzeVerse, selectedModel]);

  if (error) return notFound();
  if (!data) return null;

  const handleVerseClick = (verse: any) => {
    setSelectedVerse({
      id: verse.verse,
      book: params.book,
      chapter: parseInt(params.chapter),
      verse: verse.verse,
      text: verse.text,
      testament: params.book.toLowerCase().includes('genesis') ? 'old' : 'new'
    });
  };

  return (
    <main className="min-h-screen relative">
      {/* Video Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ willChange: 'transform' }}
        >
          <source src="/rain1.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Bible Text */}
          <div className="flex-1">
            <div className="bg-white/95 dark:bg-black/70 rounded-2xl border border-white/20 backdrop-blur-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                {data.reference}
              </h1>
              <div className="space-y-4">
                {data.verses.map((verse: { verse: number; text: string }) => (
                  <div
                    key={verse.verse}
                    id={`verse-${verse.verse}`}
                    onClick={() => handleVerseClick(verse)}
                    className={`p-4 rounded-xl transition-all duration-200 cursor-pointer
                      ${verse.verse === selectedVerse?.verse
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'hover:bg-white/50 dark:hover:bg-white/5'
                      }`}
                  >
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      <sup className="text-sm font-semibold text-green-600 dark:text-green-400 mr-2">
                        {verse.verse}
                      </sup>
                      {verse.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verse Analysis */}
          {selectedVerse && (
            <div className="lg:w-[480px] lg:sticky lg:top-6 lg:self-start space-y-6">
              <div className="bg-white/95 dark:bg-black/70 rounded-2xl border border-white/20 backdrop-blur-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Verse Analysis
                  </h2>
                  <button
                    onClick={() => analyzeVerse(selectedVerse, selectedModel)}
                    disabled={analysisLoading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 
                      hover:from-green-600 hover:to-emerald-700 text-white font-medium 
                      disabled:opacity-50 transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    {analysisLoading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      'Analyze Verse'
                    )}
                  </button>
                </div>

                {analysisError && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 
                    text-red-600 dark:text-red-400 mb-4">
                    {analysisError}
                  </div>
                )}

                {analysis && (
                  <div className="space-y-6">
                    {/* Themes */}
                    <div>
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

                    {/* Theological Significance */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Theological Significance
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {analysis.significance}
                      </p>
                    </div>

                    {/* Historical Context */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Historical Context
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {analysis.context}
                      </p>
                    </div>

                    {/* Related Verses */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Related Verses
                      </h3>
                      <div className="space-y-2">
                        {analysis.relatedVerses.map((verse, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 
                              text-gray-700 dark:text-gray-300 text-sm"
                          >
                            {verse}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 