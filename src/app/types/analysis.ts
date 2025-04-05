export interface GeminiAnalysis {
  themes: string[];
  relatedVerses: string[];
  significance: string;
  context: string;
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