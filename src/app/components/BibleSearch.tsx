'use client';

import { useState, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
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
    }, 1000),
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
    <div className="space-y-6">
      {/* Search Input */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter a biblical topic, theme, or verse..."
            className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-[#1a1a1a] 
              border border-gray-200 dark:border-gray-800
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
              placeholder:text-gray-400 dark:placeholder:text-gray-600
              text-lg shadow-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !searchText.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl
              bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
              disabled:opacity-50 disabled:hover:from-indigo-500 disabled:hover:to-purple-600
              text-white font-medium transition-all duration-200 shadow-sm"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner />
                <span>Searching</span>
              </div>
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto p-4 bg-red-50 dark:bg-red-500/10 
          border border-red-100 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Search Results and Analysis */}
      {searchResult && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Search Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-gray-900 dark:text-gray-100">Search Results</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {searchResult.verseReferences.length} verses found
                </span>
              </div>
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-4 hide-scrollbar">
                {searchResult.verseReferences.map((verse, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      const verseObj = {
                        id: 0,
                        book: verse.reference.split(' ')[0],
                        chapter: parseInt(verse.reference.split(' ')[1].split(':')[0]),
                        verse: parseInt(verse.reference.split(':')[1]),
                        text: verse.text,
                        testament: verse.reference.split(' ')[0].includes('Genesis') ? 'old' : 'new'
                      };
                      handleVerseSelect(verseObj);
                    }}
                    className="p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 
                      hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all duration-200
                      group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500">
                        {verse.reference}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 
                        text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                        Relevance: {verse.relevance}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 italic">{verse.text}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{verse.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Analysis */}
            <div className="space-y-6">
              <div className="sticky top-6">
                {selectedVerse ? (
                  <VerseDetails verse={selectedVerse} />
                ) : (
                  <div className="p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Select a verse from the results to view analysis
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}