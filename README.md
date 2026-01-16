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
- **One-Tap Export**: Clean your notes or copy the entire draft to your clipboard with a single click.

### 🤖 2. Intelligent AI Assembly
Stop manual data entry. Input a raw list of words (comma or line-separated), and the **Assembly Engine** (`gemini-3-flash-preview`) does the rest:
- **Simplified Definitions**: Definitions that explain the *concept*, not just the word.
- **Semantic Equivalents**: Grouping everyday synonyms for better recall.
- **Memorable Context**: Generates quirky, unique sentences designed to trigger "episodic memory."

### 🔍 3. Global Lexical Search
Never lose a word again. The **Unified Repository Search** indexes every word across every journal you have ever created.
- **Instant Lookup**: Start typing in the header to find a "lexeme" and see exactly which collection it belongs to.
- **Cross-Collection Navigation**: Jump directly from a search result to the corresponding journal entry.

### 📖 4. Situational Synthesis (Context Learning)
The crown jewel of the platform. Using **Gemini 3 Pro**, Lexicon AI can synthesize an entire collection into a single, coherent narrative.
- **Narrative Mastery**: It weaves all your vocabulary words into a story or scholarly article.
- **Visual Highlighting**: In "Context Mode," words are automatically highlighted with tooltips, allowing you to see how different lexemes interact in a professional writing style.

### 📈 5. Mastery & Progress Tracking
Every entry is more than a row; it's a data point.
- **Dynamic Progress**: Your mastery (0% to 100%) is tracked for every single word.
- **Smart Assessment**: Using the **Flashcard Mode**, correct answers boost mastery, while incorrect ones decrease it, helping you identify which words need more attention.

### 📄 6. Authenticated Export & Sharing
- **Offline Portability**: Export any collection as a standalone, beautifully styled HTML file. These files include a return link to the live platform.
- **Zero-Backend Sharing**: Share your entire journal via "Share Links" that encode your data directly into the URL (Base64). No database required.

---

## 🛠️ Technology Stack
- **AI Models**: 
  - `gemini-3-flash-preview`: For rapid vocabulary assembly and data generation.
  - `gemini-3-pro-preview`: For complex narrative synthesis and context learning.
- **Frontend**: React 19 (Modern ES6 Module architecture).
- **Styling**: Tailwind CSS with a custom "Academic Palette."
- **Typography**: 
  - *Crimson Pro*: For the scholarly, authoritative feel of a physical journal.
  - *Inter*: For crisp, functional UI elements.

## 🚀 Deployment & Environment
To deploy this project (e.g., to Vercel), ensure you set the `API_KEY` environment variable in your dashboard.

```bash
# Installation
npm install
npm run dev
```

---
*Built for the pursuit of linguistic excellence and the conquest of the SAT.*
