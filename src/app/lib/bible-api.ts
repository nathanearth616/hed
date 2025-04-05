import { supabase } from './supabase';
import { BibleVerse, VerseReference, RelatedVerse } from '../types/bible';

export async function getVerseByReference(reference: VerseReference): Promise<BibleVerse | null> {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*')
    .eq('book', reference.book)
    .eq('chapter', reference.chapter)
    .eq('verse', reference.verse)
    .single();
  
  if (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
  
  return data;
}

export async function searchVersesByText(searchText: string): Promise<BibleVerse[]> {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*')
    .textSearch('text', searchText, {
      config: 'english'
    })
    .limit(20);
  
  if (error) {
    console.error('Error searching verses:', error);
    return [];
  }
  
  return data || [];
}

export async function getRelatedVerses(verseId: number): Promise<RelatedVerse[]> {
  // First get relationships
  const { data: relationships, error: relError } = await supabase
    .from('verse_relationships')
    .select('*')
    .eq('source_verse_id', verseId);
  
  if (relError || !relationships) {
    console.error('Error fetching relationships:', relError);
    return [];
  }
  
  // Then get the actual verses
  const relatedVerseIds = relationships.map(rel => rel.target_verse_id);
  
  if (relatedVerseIds.length === 0) {
    return [];
  }
  
  const { data: verses, error: versesError } = await supabase
    .from('bible_verses')
    .select('*')
    .in('id', relatedVerseIds);
  
  if (versesError || !verses) {
    console.error('Error fetching related verses:', versesError);
    return [];
  }
  
  // Combine verse data with relationship data
  return verses.map(verse => {
    const relationship = relationships.find(rel => rel.target_verse_id === verse.id);
    return {
      ...verse,
      relationship_type: relationship?.relationship_type,
      strength: relationship?.strength,
      description: relationship?.description
    };
  });
}

export function parseVerseReference(referenceString: string): VerseReference | null {
  // Handle formats like "John 3:16" or "Genesis 1:1-3"
  const regex = /^(\d*\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-\d+)?$/;
  const match = referenceString.match(regex);
  
  if (!match) return null;
  
  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verse: parseInt(match[3], 10)
  };
}

export async function getChapterVerses(book: string, chapter: number): Promise<BibleVerse[]> {
  try {
    const response = await fetch(`/api/verses/${encodeURIComponent(book)}/${chapter}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch verses');
    }

    if (!data.verses || !Array.isArray(data.verses)) {
      throw new Error('Invalid response format: expected an array of verses');
    }

    return data.verses.map((verse: any) => ({
      id: verse.id || 0,
      book,
      chapter,
      verse: verse.verse,
      text: verse.text,
      testament: verse.testament || determineTestament(book)
    }));
  } catch (error) {
    console.error('Error fetching chapter verses:', error);
    throw error;
  }
}

function determineTestament(book: string): 'old' | 'new' {
  const oldTestamentBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings',
    '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
    'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes',
    'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
    'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
    'Zechariah', 'Malachi'
  ];

  return oldTestamentBooks.includes(book) ? 'old' : 'new';
} 