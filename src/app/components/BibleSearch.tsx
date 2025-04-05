'use client';

import { useState, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import VerseDetails from './VerseDetails';
import { BibleVerse } from '../types/bible';
import debounce from 'lodash/debounce';
import { AIModel, AI_MODELS } from '../types/ai';
import { useGeminiAnalysis } from '../hooks/useGeminiAnalysis';

interface SearchResult {
  mainThemes: string[];
  verseReferences: {
    reference: string;
    text: string;
    summary: string;
    relevance: string;
  }[];
  analysis: string;
  theologicalFramework?: {
    oldTestament: string;
    newTestament: string;
    development: string;
  };
  contemporaryApplication?: {
    personal: string;
    community: string;
    society: string;
  };
  commonMisconceptions?: {
    misconception: string;
    correction: string;
  }[];
  furtherStudy?: {
    keyPassages: string[];
    suggestedTopics: string[];
  };
}

export default function BibleSearch({ selectedModel }: { selectedModel: AIModel }) {
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { analysis, isLoading: analysisLoading, error: analysisError, analyzeVerse } = useGeminiAnalysis();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
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
          body: JSON.stringify({ 
            topic: searchText,
            model: selectedModel
          }),
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
    [selectedModel]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    debouncedSearch(searchText);
  };

  const handleVerseSelect = (verse: BibleVerse) => {
    // Include the selected model in the URL
    window.open(`/bible/${verse.book}/${verse.chapter}?highlight=${verse.verse}&model=${selectedModel}`, '_blank');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Search Form - Made smaller and removed dropdown */}
      <div className="space-y-4 max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter a biblical topic, theme, or verse..."
            className="w-full px-4 py-3 rounded-xl bg-white/95 dark:bg-black/70 
              border border-white/20 backdrop-blur-md
              focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500
              placeholder:text-gray-500 dark:placeholder:text-gray-400
              text-base shadow-sm"
          />
          <button 
            type="submit"
            disabled={isLoading || !searchText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg
              bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
              disabled:opacity-50 disabled:hover:from-green-500 disabled:hover:to-emerald-600
              text-white font-medium transition-all duration-200 shadow-sm text-sm"
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

      {/* Search Results - Modified to use full width */}
      {searchResult && (
        <div className="max-w-7xl mx-auto">
          <div className="h-[calc(100vh-12rem)]">
            {/* Search Results */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between text-white mb-4">
                <h2 className="font-medium">Search Results</h2>
                <span className="text-sm text-white/70">
                  {searchResult.verseReferences.length} verses found
                </span>
              </div>
              <div className="overflow-y-auto pr-4 hide-scrollbar space-y-4 flex-1">
                {searchResult.verseReferences.map((verse, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      const verseObj: BibleVerse = {
                        id: 0,
                        book: verse.reference.split(' ')[0],
                        chapter: parseInt(verse.reference.split(' ')[1].split(':')[0]),
                        verse: parseInt(verse.reference.split(':')[1]),
                        text: verse.text,
                        testament: verse.reference.split(' ')[0].toLowerCase().includes('genesis') ? 'old' : 'new' as const
                      };
                      handleVerseSelect(verseObj);
                    }}
                    className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                      border border-white/20 backdrop-blur-md
                      hover:bg-white/98 dark:hover:bg-black/80 cursor-pointer 
                      transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-green-600 dark:text-green-400 group-hover:text-green-500">
                        {verse.reference}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 
                        text-green-600 dark:text-green-400 text-xs font-medium">
                        Relevance: {verse.relevance}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 italic">{verse.text}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{verse.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}