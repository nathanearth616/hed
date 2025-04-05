'use client';

import { useState, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import VerseGraph from './VerseGraph';
import VerseDetails from './VerseDetails';
import { BibleVerse } from '../types/bible';
import debounce from 'lodash/debounce';

interface SearchResult {
  mainThemes: string[];
  verseReferences: {
    reference: string;
    text: string;
    summary: string;
    relevance: string;
  }[];
  analysis: string;
}

export default function BibleSearch() {
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useCallback(
    debounce(async (searchText: string) => {
      setIsLoading(true);
      setError(null);
      setSearchResult(null);
      setSelectedVerse(null);

      try {
        const response = await fetch('/api/verses/topic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: searchText }),
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setSearchResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }, 1000), // Wait 1 second between searches
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    debouncedSearch(searchText);
  };

  const handleVerseSelect = (verse: any) => {
    setSelectedVerse({
      ...verse,
      testament: verse.book && (
        ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'].includes(verse.book) 
        ? 'Old' 
        : 'New'
      )
    });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="flex gap-4 p-2 bg-white/30 dark:bg-black/20 rounded-2xl shadow-sm backdrop-blur-sm">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search for biblical topics or themes..."
            className="flex-1 px-6 py-4 rounded-xl border-0 bg-transparent focus:ring-2 focus:ring-blue-500 text-lg placeholder:text-foreground/50"
          />
          <button
            type="submit"
            disabled={isLoading || !searchText.trim()}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all flex items-center gap-3 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-5 h-5" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="max-w-3xl mx-auto p-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-4">
          <svg className="w-6 h-6 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold mb-1">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {searchResult && (
        <div className="mt-16">
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
              <h2 className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                Verse Relationships
              </h2>
              <span className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-sm font-medium">
                Found {searchResult.verseReferences.length} verses
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-8">
              <div className="h-[600px] border rounded-2xl bg-white/50 dark:bg-black/20 shadow-sm overflow-hidden backdrop-blur-sm">
                <VerseGraph 
                  searchResult={searchResult} 
                  onVerseSelect={handleVerseSelect}
                />
              </div>

              <div className="space-y-4 overflow-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                {searchResult.verseReferences.map((verse, i) => (
                  <div 
                    key={i} 
                    className="p-6 border rounded-xl bg-white/50 dark:bg-black/20 shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-white/70 dark:hover:bg-black/30 backdrop-blur-sm"
                    onClick={() => handleVerseSelect({
                      id: 0,
                      book: verse.reference.split(' ')[0],
                      chapter: parseInt(verse.reference.split(' ')[1].split(':')[0]),
                      verse: parseInt(verse.reference.split(':')[1]),
                      text: verse.text,
                      testament: verse.reference.split(' ')[0].includes('Genesis') ? 'Old' : 'New'
                    })}
                  >
                    <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
                      {verse.reference}
                    </h3>
                    <p className="mb-3 italic text-foreground/70">{verse.text}</p>
                    <p className="mb-3 text-foreground/80 text-sm">{verse.summary}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        Relevance: {verse.relevance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedVerse && (
              <div className="mt-12">
                <VerseDetails verse={selectedVerse} />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}