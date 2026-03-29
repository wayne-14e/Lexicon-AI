# Lexicon AI — Academic Vocabulary Journal

Lexicon AI is an intelligence-augmented repository designed for scholars, students, and lifelong learners. Built with a high-contrast, SAT-inspired aesthetic, it transforms the exhausting process of vocabulary acquisition into a structured, AI-powered workflow.

## 🏛️ The Genesis: A Personal Struggle
Lexicon AI was born from the frustrating reality of **SAT preparation**. 

Standard flashcards and static word lists often fail because they lack **situational context**. I found myself memorizing definitions for words like *recondite* or *garrulous*, only to forget them minutes later because I couldn't "see" them in a real sentence. This project is my solution: an automated system that doesn't just store words, but builds a living, semantic world around them.

---

## ✨ Core Features & Workflow

### 🖋️ 1. Academic Scratchpad (The Pre-Journal Phase)
The **Scratchpad** is your cognitive loading zone.
- **Auto-Syncing**: Every keystroke is saved to your local browser storage instantly.
- **Drafting Tool**: Use it to jot down words you encounter in readings or phonetic notes before they are "formalized" into a journal.

### 🤖 2. Intelligent AI Assembly
Stop manual data entry. Input a raw list of words (comma or line-separated), and the **Assembly Engine** (`gemini-3-flash-preview`) does the rest:
- **Simplified Definitions**: Definitions that explain the *concept*, not just the word.
- **Semantic Equivalents**: Grouping everyday synonyms for better recall.
- **Memorable Context**: Generates quirky, unique sentences designed to trigger "episodic memory."

### 📝 3. Linguistic Synthesis (Editing & Refilling)
Lexicon now supports high-fidelity word editing.
- **Single-Word Refactor**: Click the "Pen" icon on any lexeme to change the word.
- **AI-Powered Refill**: Once a word is edited, the AI automatically regenerates the Part of Speech, Definition, Synonyms, and Usage Sentence to match the new entry.

### 📈 4. Visual Mastery Architecture
Track your progress with academic precision.
- **Collection Progress**: Every journal card on the dashboard features a mastery bar showing the average knowledge level of the set.
- **Circular Mastery Indicators**: Inside each journal, a sophisticated circular progress indicator visualizes your current proficiency level (Introductory, Developing, or Proficient).

### 🔊 5. AI-Synthesized Pronunciation
Leveraging `gemini-2.5-flash-preview-tts`, the system provides high-fidelity audio for every word. 
- **Row-Level Playback**: Listen to pronunciations directly from your collection tables.
- **Phonetic Assessment**: Audio support integrated into Flashcard Mode to bridge the gap between reading and speaking.

### 🔍 6. Global Lexical Search
Never lose a word again. The **Unified Repository Search** indexes every word across every journal you have ever created.
- **Instant Lookup**: Start typing in the header to find a "lexeme" and see exactly which collection it belongs to.

### 📖 7. Situational Synthesis (Context Learning)
The crown jewel of the platform. Using **Gemini 3 Flash**, Lexicon AI can synthesize an entire collection into a single, coherent narrative.
- **Narrative Mastery**: It weaves all your vocabulary words into a story or scholarly article.
- **Visual Highlighting**: In "Context Mode," words are automatically highlighted with tooltips to see how lexemes interact.

---

## 🎉 Major Update 2.0: The Lexicon Evolution

### 🔄 Cross-Device Synchronization
- **Database Integration**: Your vocabulary journal now syncs seamlessly across all devices through a robust database backend.
- **Multi-Device Responsiveness**: Learn anywhere, on any device - desktop, tablet, or mobile with a fully responsive design.

### 🎨 New Design & Branding
- **Modern UI/UX**: Complete redesign with enhanced visual hierarchy and user experience.
- **New Logo**: Fresh branding that reflects the academic excellence and technological sophistication of Lexicon AI.

### 🎮 Matching Game
- **Synonym & Antonym Challenges**: Test your vocabulary knowledge with an engaging matching game.
- **Gamified Learning**: Make vocabulary acquisition fun and interactive through competitive gameplay.

### 🤖 Lexy - Your Erudite AI Assistant
- **Intelligent Guidance**: Meet Lexy, your personal AI tutor that provides contextual learning support.
- **Adaptive Learning**: Lexy adapts to your learning style and provides personalized recommendations.

### 🪙 Token System
- **Earn Through Learning**: Gain tokens by completing flashcard sessions and matching games.
- **Daily Streak Rewards**: Maintain your learning streak and earn +10 tokens daily as motivation.

### 🔥 Daily Streak System
- **Motivation Engine**: Keep users engaged with a streak counter that rewards consistent learning.
- **Visual Progress**: Track your consecutive learning days and build lasting habits.

### 📊 Enhanced Progress Tracking
- **Session Feedback**: Receive detailed feedback after each learning session.
- **Performance Analytics**: Comprehensive tracking of your vocabulary mastery and learning patterns.

### ✅ Improved Validation
- **Error Reduction**: Better input validation and error handling throughout the application.
- **Smoother Experience**: Fewer interruptions and more reliable performance.

### 📅 Daily Word Feature
- **Random Word Discovery**: Start your day with a new academic word on the home page.
- **Continuous Learning**: Expand your vocabulary organically with daily curated words.

### 🛠️ Enhanced AI Reliability
- **Model Rotation**: Intelligent model switching to avoid service interruptions.
- **Fallback Mechanisms**: Automatic failover to prevent 503 UNAVAILABLE and usage limit errors.
- **Same Powerful Models**: Still powered by Gemini 3 Flash and Gemini 2.6 Flash TTS, now more reliable than ever.

---

## 🏛️ Technology Stack
- **AI Models**: 
  - `gemini-3-flash-preview`: For rapid vocabulary assembly, linguistic synthesis, and complex narrative creation.
  - `gemini-2.5-flash-preview-tts`: For scholarly audio generation.
- **Backend**: Supabase for cross-device synchronization and data persistence.
- **Frontend**: React 19.
- **Styling**: Tailwind CSS with a custom "Academic Palette."

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