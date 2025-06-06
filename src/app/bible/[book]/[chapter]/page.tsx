'use client';

import { useState, useEffect, useRef } from 'react';
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
  params
}: {
  params: { book: string; chapter: string };
}) {
  const { book, chapter } = params;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [initialScrollComplete, setInitialScrollComplete] = useState(false);
  const searchParams = useSearchParams();
  const highlightVerse = parseInt(searchParams.get('verse') || '0');
  const selectedModel: AIModel = (searchParams.get('model') || 'gemini') as AIModel;
  const { analysis, isLoading: analysisLoading, error: analysisError, analyzeVerse } = useGeminiAnalysis();
  const contentRef = useRef<HTMLDivElement>(null);

  // Load chapter data and set initial verse
  useEffect(() => {
    const loadChapter = async () => {
      try {
        const chapterData = await getBibleChapter(params.book, params.chapter);
        setData(chapterData);

        // If there's a verse to highlight, set it as selected
        if (highlightVerse) {
          const verse = chapterData.verses.find((v: any) => v.verse === highlightVerse);
          if (verse) {
            const verseObj = {
              id: highlightVerse,
              book,
              chapter: parseInt(chapter),
              verse: verse.verse,
              text: verse.text,
              testament: book.toLowerCase().includes('genesis') ? 'old' as const : 'new' as const
            };
            setSelectedVerse(verseObj);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
      }
    };

    loadChapter();
  }, [book, chapter, highlightVerse]);

  // Force scrolling to happen multiple times to ensure it works
  useEffect(() => {
    if (!data || !highlightVerse) return;
    
    // Try scrolling immediately
    const tryScroll = () => {
      const verseElement = document.getElementById(`verse-${highlightVerse}`);
      if (verseElement && contentRef.current) {
        // Direct scroll approach
        contentRef.current.scrollTop = verseElement.offsetTop - 150;
        console.log("Scrolled to verse", highlightVerse);
      }
    };
    
    // Try multiple times at different intervals
    tryScroll(); // Immediate try
    
    const timer1 = setTimeout(tryScroll, 100);  // Short delay
    const timer2 = setTimeout(tryScroll, 500);  // Medium delay
    const timer3 = setTimeout(tryScroll, 1000); // Longer delay
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [data, highlightVerse]);

  // Analyze verse when selected
  useEffect(() => {
    if (selectedVerse) {
      analyzeVerse(selectedVerse, selectedModel).catch(err => {
        console.error('Analysis failed:', err);
      });
    }
  }, [selectedVerse, analyzeVerse, selectedModel]);

  const getErrorMessage = (error: string) => {
    if (error.includes('rate limit') || error.includes('too many requests') || error.includes('exceeded')) {
      return 'API rate limit exceeded. Please try again in a few minutes.';
    } else if (error.includes('Connection error') || error.includes('fetch failed') || error.includes('network')) {
      return 'Unable to connect to AI service. Please check your internet connection and try again.';
    } else {
      return error;
    }
  };

  if (error) return notFound();
  if (!data) return null;

  const handleVerseClick = (verse: any) => {
    const verseObj = {
      id: verse.verse,
      book,
      chapter: parseInt(chapter),
      verse: verse.verse,
      text: verse.text,
      testament: book.toLowerCase().includes('genesis') ? 'old' as const : 'new' as const
    };
    setSelectedVerse(verseObj);
    
    const verseElement = document.getElementById(`verse-${verse.verse}`);
    if (verseElement && contentRef.current) {
      const containerHeight = contentRef.current.clientHeight;
      const verseTop = verseElement.offsetTop;
      const verseHeight = verseElement.clientHeight;
      const scrollTop = verseTop - (containerHeight / 2) + (verseHeight / 2);
      
      contentRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
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
            <div 
              ref={contentRef}
              className="bg-white/95 dark:bg-black/70 rounded-2xl border border-white/20 backdrop-blur-md p-6 overflow-y-auto max-h-[calc(100vh-8rem)]"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center sticky top-0 bg-white/95 dark:bg-black/70 py-4 backdrop-blur-md">
                {data.reference}
          </h1>
              <div className="space-y-4">
                {data.verses.map((verse: { verse: number; text: string }) => (
              <div
                key={verse.verse}
                id={`verse-${verse.verse}`}
                onClick={() => handleVerseClick(verse)}
                    className={`p-4 rounded-xl transition-all duration-200 cursor-pointer
                      ${verse.verse === selectedVerse?.verse || verse.verse === highlightVerse
                        ? 'bg-green-100 dark:bg-green-900/20 ring-2 ring-green-500/50'
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
            <div className="lg:w-[480px] lg:sticky lg:top-6 lg:self-start">
              <div className="bg-white/95 dark:bg-black/70 rounded-2xl border border-white/20 backdrop-blur-md p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/95 dark:bg-black/70 py-4 backdrop-blur-md">
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
                    {getErrorMessage(analysisError)}
                  </div>
                )}

                {!analysis && !analysisError && !analysisLoading && (
                  <div className="flex flex-col items-center justify-center py-10">
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                      Click the "Analyze Verse" button to generate insights about this verse.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      <span>Note: AI services may have rate limits</span>
                    </div>
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