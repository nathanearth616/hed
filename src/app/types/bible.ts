export type BibleVerse = {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  testament: 'old' | 'new';
};

export type VerseReference = {
  book: string;
  chapter: number;
  verse: number;
};

export type RelationshipType = 
  | 'thematic' 
  | 'direct_reference' 
  | 'linguistic' 
  | 'chronological' 
  | 'theological';

export type VerseRelationship = {
  id: number;
  source_verse_id: number;
  target_verse_id: number;
  relationship_type: RelationshipType;
  strength: number; // 1-10 scale
  description?: string;
};

export type RelatedVerse = BibleVerse & {
  relationship_type: RelationshipType;
  strength: number;
  description?: string;
};

export interface GeminiAnalysis {
  themes: string[];
  relatedVerses: string[];
  significance: string;
  context: string;
} 