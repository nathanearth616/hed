'use client';

import { useEffect, useState } from 'react';
import { BibleVerse, RelatedVerse } from '../types/bible';
import { getRelatedVerses } from '../lib/bible-api';
import LoadingSpinner from './LoadingSpinner';

export default function RelatedVerses({ verse }: { verse: BibleVerse | null }) {
  const [relatedVerses, setRelatedVerses] = useState<RelatedVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!verse) {
      setRelatedVerses([]);
      return;
    }
    
    const fetchRelatedVerses = async () => {
      setIsLoading(true);
      try {
        const verses = await getRelatedVerses(verse.id);
        setRelatedVerses(verses);
      } catch (error) {
        console.error('Error fetching related verses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRelatedVerses();
  }, [verse]);
  
  if (!verse) {
    return null;
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">Selected Verse</h2>
      <div className="p-4 border rounded mb-6 bg-black/[.03] dark:bg-white/[.03]">
        <p className="font-semibold">{verse.book} {verse.chapter}:{verse.verse}</p>
        <p className="text-lg">{verse.text}</p>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Related Verses</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : relatedVerses.length === 0 ? (
        <p>No related verses found.</p>
      ) : (
        <div className="space-y-4">
          {relatedVerses.map((relVerse) => (
            <div 
              key={`${relVerse.book}-${relVerse.chapter}-${relVerse.verse}`}
              className="p-4 border rounded"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold">{relVerse.book} {relVerse.chapter}:{relVerse.verse}</p>
                <div className="flex items-center">
                  <span className="text-sm px-2 py-1 rounded bg-black/[.05] dark:bg-white/[.06] mr-2">
                    {relVerse.relationship_type.replace('_', ' ')}
                  </span>
                  <span className="text-sm px-2 py-1 rounded bg-black/[.05] dark:bg-white/[.06]">
                    Strength: {relVerse.strength}/10
                  </span>
                </div>
              </div>
              <p>{relVerse.text}</p>
              {relVerse.description && (
                <p className="mt-2 text-sm italic">{relVerse.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 