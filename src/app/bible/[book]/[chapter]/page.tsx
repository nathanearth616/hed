'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getChapterVerses } from '@/app/lib/bible-api';
import { BibleVerse } from '@/app/types/bible';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function BibleChapterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const book = params.book as string;
  const chapter = parseInt(params.chapter as string);
  const highlightVerse = parseInt(searchParams.get('highlight') || '0');

  useEffect(() => {
    const loadVerses = async () => {
      try {
        const chapterVerses = await getChapterVerses(book, chapter);
        setVerses(chapterVerses);
      } catch (err) {
        setError('Failed to load verses');
      } finally {
        setLoading(false);
      }
    };

    loadVerses();
  }, [book, chapter]);

  useEffect(() => {
    if (highlightVerse && !loading) {
      const verseElement = document.getElementById(`verse-${highlightVerse}`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightVerse, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8 bg-red-50 dark:bg-red-500/10 
        border border-red-100 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {book} {chapter}
      </h1>
      <div className="space-y-4">
        {verses.map((verse) => (
          <div
            key={verse.verse}
            id={`verse-${verse.verse}`}
            className={`p-4 rounded-lg transition-colors duration-500 ${
              verse.verse === highlightVerse
                ? 'bg-green-100 dark:bg-green-900/20'
                : 'bg-white/95 dark:bg-black/70'
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
  );
} 