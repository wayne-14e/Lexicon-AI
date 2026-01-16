
export interface User {
  id: string;
  username: string;
  email: string;
  picture?: string;
}

export interface VocabEntry {
  id: string;
  word: string;
  partOfSpeech: string;
  meaning: string;
  synonyms: string;
  sentence: string;
  progress?: number; // 0 to 100
}

export interface VocabTable {
  id: string;
  userId: string;
  title: string;
  description: string;
  links: string[];
  entries: VocabEntry[];
  createdAt: number;
  contextPassage?: {
    title: string;
    text: string;
  };
}

export type AuthMode = 'login' | 'register';
