export interface VerseReference {
  reference: string;
  text: string;
  summary: string;
  relevance: string;
}

export interface SearchResult {
  mainThemes: string[];
  verseReferences: VerseReference[];
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