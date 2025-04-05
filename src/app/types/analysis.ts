export interface GeminiAnalysis {
  themes: string[];
  relatedVerses: string[];
  significance: string;
  context: string;
  originalLanguage?: {
    text: string;
    transliteration: string;
    definition: string;
    strongsNumber?: string;
  }[];
  culturalContext: string;
  applicationPoints: string[];
  keyWords: {
    word: string;
    meaning: string;
    significance: string;
  }[];
  interpretation: {
    literal: string;
    allegorical?: string;
    moral?: string;
  };
  wordStudy?: {
    keyWords: {
      word: string;
      translation: string;
      meaning: string;
    }[];
  };
  crossReferences?: {
    reference: string;
    connection: string;
  }[];
  application?: {
    personal: string;
    community: string;
    society: string;
  };
  literaryDevices?: {
    device: string;
    explanation: string;
  }[];
} 