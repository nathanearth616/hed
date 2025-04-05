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
    setSelectedVerse(verse);
    analyzeVerse(verse, selectedModel);
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

      {/* Search Results and Analysis */}
      {searchResult && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
            {/* Left Column - Search Results */}
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

            {/* Right Column - Analysis */}
            <div className="flex flex-col min-h-0">
              <div className="overflow-y-auto pr-4 hide-scrollbar flex-1">
                <div className="space-y-6">
                  {analysisLoading ? (
                    <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                      border border-white/20 backdrop-blur-md">
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner />
                        <span className="text-gray-500 dark:text-gray-400">Analyzing verse...</span>
                      </div>
                    </div>
                  ) : analysis && selectedVerse ? (
                    <div className="space-y-6">
                      {/* Key Themes */}
                      <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                        border border-white/20 backdrop-blur-md shadow-sm">
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

                      {/* Related Verses */}
                      <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                        border border-white/20 backdrop-blur-md shadow-sm">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Related Verses</h3>
                        <div className="space-y-2">
                          {analysis.relatedVerses.map((verse, i) => (
                            <div key={i} className="text-gray-700 dark:text-gray-300">
                              {verse}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Theological Significance */}
                      <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                        border border-white/20 backdrop-blur-md shadow-sm">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Theological Significance</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {analysis.significance}
                        </p>
                      </div>

                      {/* Historical Context */}
                      <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                        border border-white/20 backdrop-blur-md shadow-sm">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Historical Context</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {analysis.context}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Topic Analysis */}
                  <div className="space-y-6">
                    {/* Main Themes */}
                    <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                      border border-white/20 backdrop-blur-md shadow-sm">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Key Themes
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {searchResult.mainThemes.map((theme, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 
                              text-green-600 dark:text-green-400 text-sm font-medium
                              border border-green-100 dark:border-green-500/20"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Comprehensive Analysis */}
                    <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                      border border-white/20 backdrop-blur-md shadow-sm">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Comprehensive Analysis
                      </h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {searchResult.analysis}
                        </p>
                      </div>
                    </div>

                    {/* Theological Framework */}
                    {searchResult.theologicalFramework && (
                      <div className="p-6 bg-white/95 dark:bg-black/70 rounded-2xl 
                        border border-white/20 backdrop-blur-md shadow-sm">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Theological Framework
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
                            <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Old Testament</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {searchResult.theologicalFramework.oldTestament}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
                            <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">New Testament</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {searchResult.theologicalFramework.newTestament}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
                            <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Development</h4>
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
                        border border-white/20 backdrop-blur-md shadow-sm">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Contemporary Application
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Personal</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {searchResult.contemporaryApplication.personal}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Community</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {searchResult.contemporaryApplication.community}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Society</h4>
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
                        border border-white/20 backdrop-blur-md shadow-sm">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Common Misconceptions
                        </h3>
                        <div className="space-y-4">
                          {searchResult.commonMisconceptions.map((item, i) => (
                            <div key={i} className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
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
                        border border-white/20 backdrop-blur-md shadow-sm">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Further Study
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Key Passages</h4>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm space-y-1">
                              {searchResult.furtherStudy.keyPassages.map((passage, i) => (
                                <li key={i} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                                  {passage}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Suggested Topics</h4>
                            <div className="flex flex-wrap gap-2">
                              {searchResult.furtherStudy.suggestedTopics.map((topic, i) => (
                                <span 
                                  key={i}
                                  className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 
                                    text-blue-600 dark:text-blue-400 text-sm font-medium
                                    border border-blue-100 dark:border-blue-500/20
                                    hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  );
}