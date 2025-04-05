'use client';

import { useState, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import VerseDetails from './VerseDetails';
import { BibleVerse } from '../types/bible';
import debounce from 'lodash/debounce';
import { AIModel, AI_MODELS } from '../types/ai';

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

export default function BibleSearch() {
  const [searchText, setSearchText] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
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
    setSelectedVerse(verse);
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter a biblical topic, theme, or verse..."
            className="w-full px-6 py-4 rounded-2xl bg-white/95 dark:bg-black/70 
              border border-white/20 backdrop-blur-md
              focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500
              placeholder:text-gray-500 dark:placeholder:text-gray-400
              text-lg shadow-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !searchText.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl
              bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
              disabled:opacity-50 disabled:hover:from-green-500 disabled:hover:to-emerald-600
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

        {/* AI Model Selector */}
        <div className="p-4 bg-white/95 dark:bg-black/70 rounded-2xl 
          border border-white/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
              Select AI Model
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Choose an AI model for analysis
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  flex flex-col items-center gap-3
                  ${selectedModel === model.id 
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10' 
                    : 'border-gray-200 dark:border-gray-800 hover:border-green-500/50'
                  }
                `}
              >
                {selectedModel === model.id && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <span className="text-4xl">{model.icon}</span>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {model.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {model.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
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
              <div className="flex items-center justify-between text-white">
                <h2 className="font-medium">Search Results</h2>
                <span className="text-sm text-white/70">
                  {searchResult.verseReferences.length} verses found
                </span>
              </div>
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-4 hide-scrollbar">
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

            {/* Right Column - Analysis */}
            <div className="space-y-6">
              <div className="sticky top-6">
                {selectedVerse ? (
                  <VerseDetails 
                    verse={selectedVerse} 
                    selectedModel={selectedModel}
                  />
                ) : (
                  <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                    border border-white/20 backdrop-blur-md">
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

              {/* Topic Analysis */}
              <div className="space-y-6">
                {/* Main Themes */}
                <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                  border border-white/20 backdrop-blur-md">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Key Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {searchResult.mainThemes.map((theme, i) => (
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

                {/* Comprehensive Analysis */}
                <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                  border border-white/20 backdrop-blur-md">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Comprehensive Analysis</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {searchResult.analysis}
                  </p>
                </div>

                {/* Theological Framework */}
                {searchResult.theologicalFramework && (
                  <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                    border border-white/20 backdrop-blur-md">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Theological Framework</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Old Testament</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {searchResult.theologicalFramework.oldTestament}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Testament</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {searchResult.theologicalFramework.newTestament}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Development</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {searchResult.theologicalFramework.development}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contemporary Application */}
                {searchResult.contemporaryApplication && (
                  <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                    border border-white/20 backdrop-blur-md">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Contemporary Application</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Personal</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {searchResult.contemporaryApplication.personal}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Community</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {searchResult.contemporaryApplication.community}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Society</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {searchResult.contemporaryApplication.society}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Misconceptions */}
                {searchResult.commonMisconceptions && searchResult.commonMisconceptions.length > 0 && (
                  <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                    border border-white/20 backdrop-blur-md">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Common Misconceptions</h3>
                    <div className="space-y-4">
                      {searchResult.commonMisconceptions.map((item, i) => (
                        <div key={i} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className="font-medium text-red-600 dark:text-red-400 mb-1">
                            Misconception: {item.misconception}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            <span className="font-medium">Correction: </span>
                            {item.correction}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Further Study */}
                {searchResult.furtherStudy && (
                  <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                    border border-white/20 backdrop-blur-md">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Further Study</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Passages</h4>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm space-y-1">
                          {searchResult.furtherStudy.keyPassages.map((passage, i) => (
                            <li key={i}>{passage}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggested Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {searchResult.furtherStudy.suggestedTopics.map((topic, i) => (
                            <span 
                              key={i}
                              className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 
                                text-blue-600 dark:text-blue-400 text-sm font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
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