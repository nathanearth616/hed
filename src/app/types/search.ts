export interface VerseReference {
  reference: string;
  summary: string;
  relevance: string;
}

export interface SearchResult {
  mainThemes: string[];
  verseReferences: VerseReference[];
  analysis: string;
}