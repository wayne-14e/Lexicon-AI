
export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  tokens?: number;
  lastDailyAwardDate?: string; // ISO string (YYYY-MM-DD)
  streak?: number;
  words_generated?: number;
  narratives_used?: number;
  document_uploads_used?: number;
  lexy_prompts_used?: number;
  ai_refills_used?: number;
  tts_used?: number;
  limits_last_reset_date?: string; // ISO string (YYYY-MM-DD)
  unlocked_system_collections?: string[];
  referral_code?: string;
  referred_by?: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
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
  masteredAt?: number; // Unix epoch timestamp (ms) when progress first crossed >= 80
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

