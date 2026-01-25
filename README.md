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
The crown jewel of the platform. Using **Gemini 3 Pro**, Lexicon AI can synthesize an entire collection into a single, coherent narrative.
- **Narrative Mastery**: It weaves all your vocabulary words into a story or scholarly article.
- **Visual Highlighting**: In "Context Mode," words are automatically highlighted with tooltips to see how lexemes interact.

---

## 🛠️ Technology Stack
- **AI Models**: 
  - `gemini-3-flash-preview`: For rapid vocabulary assembly and complex narrative synthesis.
  - `gemini-2.5-flash-preview-tts`: For scholarly audio generation.
- **Frontend**: React 19.
- **Styling**: Tailwind CSS with a custom "Academic Palette."

## 🚀 Deployment & Environment
To deploy this project (e.g., to Vercel), ensure you set the `API_KEY` environment variable in your dashboard.

```bash
# Installation
npm install
npm run dev
```

---
*Built for the pursuit of linguistic excellence and the conquest of the SAT.*
