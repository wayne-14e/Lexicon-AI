
export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  picture?: string;
  tokens?: number;
  lastDailyAwardDate?: string; // ISO string (YYYY-MM-DD)
  streak?: number;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: number;
}

export interface MasteryEvent {
  id: string;
  userId: string;
  word: string;
  createdAt: number;
}

export type GameMode = 'synonyms' | 'antonyms';

export interface VocabEntry {
  id: string;
  word: string;
  partOfSpeech: string;
  meaning: string;
  synonyms: string;
  antonyms?: string;
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

export type AuthMode = 'login' | 'register' | 'reset';
