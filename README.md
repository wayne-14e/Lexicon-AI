# Lexicon AI — Academic Vocabulary Journal

Lexicon AI is an intelligence-augmented repository designed for scholars, students, and lifelong learners. Built with a high-contrast, SAT-inspired aesthetic, it transforms the exhausting process of vocabulary acquisition into a structured, AI-powered workflow.

## 🏛️ The Genesis: A Personal Struggle
Lexicon AI was born from the frustrating reality of **SAT preparation**. 

Standard flashcards and static word lists often fail because they lack **situational context**. I found myself memorizing definitions for words like *recondite* or *garrulous*, only to forget them minutes later because I couldn't "see" them in a real sentence. This project is my solution: an automated system that doesn't just store words, but builds a living, semantic world around them.

---

## ✨ Core Features & Evolution 2.0

### 🏛️ 1. Scholarly Archives (Pre-built Collections)
Access curated, high-stakes vocabulary sets designed for immediate mastery.
- **IELTS Levels**: Progressive collections from A1 to C2.
- **SAT Mastery**: Targeted datasets like the College Panda 400 and Erica Vocabulary lists.
- **Token-Based Unlocking**: Spend your hard-earned tokens to permanently unlock advanced academic archives.

### 📄 2. AI Document Extractor (Harvesting Engine)
Transform your reading materials into structured journals instantly.
- **Multi-Format Support**: Upload PDF, DocX, or TXT files.
- **Gemini-Powered Extraction**: Lexicon uses Gemini Pro to harvest the most academically significant words from your documents.
- **Seamless Integration**: Review and edit harvested words before they are formalized into your permanent repository.

### 🤖 3. Intelligent AI Assembly
Input a raw list of words, and the **Assembly Engine** (`gemini-3-flash`) handles the rest:
- **Simplified Definitions**: Explaining the *concept*, not just the word.
- **Semantic Equivalents**: Grouping synonyms for better recall.
- **Memorable Context**: Generates unique, episodic memory triggers.

### 📖 4. Situational Synthesis (Context Learning)
Using AI, Lexicon can synthesize an entire collection into a single, coherent narrative.
- **Narrative Mastery**: Weaves your vocabulary into a story or scholarly article.
- **Visual Highlighting**: In "Context Mode," words feature tooltips showing how lexemes interact.

### 🔊 5. AI-Synthesized Pronunciation
Leveraging high-fidelity TTS, the system provides audio for every word to bridge the gap between reading and speaking.

### 🔍 6. Global Lexical Search
The **Unified Repository Search** indexes every word across every journal you have ever created.

---

## 🛠️ System Reliability & UX Refinements

### 🪙 Robust Token Ecosystem
- **Atomic Persistence**: Tokens are managed via atomic database transactions, ensuring your balance is never lost or overwritten.
- **Earn Through Learning**: Gain tokens through games, streaks, and sessions.
- **Motivating Streaks**: Earn +10 tokens daily for consistent learning.

### 🔐 Refined Authentication
- **Identity Integrity**: Pre-flight checks prevent duplicate usernames and provide immediate feedback for existing email accounts.
- **Silent Failure Prevention**: Enhanced UI feedback ensures you never wait for a confirmation email that wasn't sent.

### 📈 Mastery Architecture
- **Persistent Progress**: Progress is saved even for system collections, allowing you to track your mastery across the entire academic archive.
- **Visual Indicators**: Sophisticated progress bars and circular mastery charts visualize your proficiency.

---

## 🏛️ Technology Stack
- **AI Models**: 
  - `gemini-3-flash`: For assembly, extraction, and narrative creation.
  - `gemini-3-flash-tts`: For scholarly audio generation.
- **Backend**: Supabase (PostgreSQL) for cross-device synchronization.
- **Frontend**: React 19 + Vite.
- **Styling**: Vanilla CSS for a premium, custom academic feel.

## 🚀 Deployment & Environment
To deploy this project (e.g., to Vercel), ensure you set the following environment variables in your dashboard:
- `GEMINI_API_KEY`: Your Google Gemini API key for AI functionality
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Local testing
1. Copy `.env.example` to `.env.local` in the project root.
2. Set the following variables in `.env.local`:
   - `GEMINI_API_KEY=...`
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
3. Start the dev server with `npm run dev`.

Note: Supabase is configured via the Vite `/supabase` proxy (see `vite.config.ts`). If your Supabase tables/policies are not ready, create them using `supabase_schema.sql`.

```bash
# Installation
npm install
npm run dev
```

---
*Built for the pursuit of linguistic excellence and the conquest of the SAT.*