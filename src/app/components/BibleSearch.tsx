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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    debouncedSearch(searchText);
  };

  const handleVerseSelect = (verse: BibleVerse) => {
    setSelectedVerse(verse);
  };

  return (
    <div className="space-y-12">
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter a topic or theme to explore..."
            className="flex-1 p-4 rounded-xl border bg-white dark:bg-black/30 shadow-sm focus:ring-2 focus:ring-foreground/20 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !searchText.trim()}
            className="px-8 py-4 bg-foreground text-background rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span>Searching</span>
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="max-w-3xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {isLoading && !error && (
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner />
            <p className="text-lg text-foreground/70">Searching the scriptures...</p>
          </div>
        </div>
      )}

      {searchResult && !isLoading && (
        <div className="space-y-12">
          <section className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6">Analysis</h2>
            <p className="text-lg leading-relaxed text-foreground/80">{searchResult.analysis}</p>
          </section>

          <section className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6">Main Themes</h2>
            <div className="flex flex-wrap gap-3">
              {searchResult.mainThemes.map((theme, i) => (
                <span key={i} className="px-4 py-2 bg-foreground/5 dark:bg-foreground/10 rounded-full text-foreground/80 hover:bg-foreground/10 dark:hover:bg-foreground/15 transition-colors">
                  {theme}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-semibold mb-6">Verse Relationships</h2>
            <div className="w-full h-[600px] border rounded-xl bg-white dark:bg-black/30 shadow-sm overflow-hidden">
              <VerseGraph 
                searchResult={searchResult} 
                onVerseSelect={handleVerseSelect}
              />
            </div>
            {selectedVerse && (
              <VerseDetails verse={selectedVerse} />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {searchResult.verseReferences.map((verse, i) => (
                <div key={i} className="p-6 border rounded-xl bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-3">{verse.reference}</h3>
                  <p className="mb-3 italic text-foreground/70">{verse.text}</p>
                  <p className="mb-3 text-foreground/80">{verse.summary}</p>
                  <p className="text-sm text-foreground/60 italic">Relevance: {verse.relevance}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}