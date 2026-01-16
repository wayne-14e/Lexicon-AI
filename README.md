# Lexicon AI — Academic Vocabulary Journal

Lexicon AI is a minimalist, intelligence-augmented repository designed for serious learners and students. It combines a high-contrast, SAT-inspired aesthetic with the power of the Gemini 3 API to automate the creation of scholarly journals, study aids, and portable academic reports.

## 🏛️ Project Philosophy
Unlike traditional flashcard apps, Lexicon AI treats vocabulary as a formal record. Every word entry is treated like an academic artifact, complete with parts of speech, simplified definitions, and "quirky but memorable" context sentences generated via AI to ensure long-term retention.

## ✨ Key Features

### 🤖 AI-Augmented Assembly
Input a raw list of words, and the system uses `gemini-3-flash-preview` to automatically populate:
- **Simplified Definitions**: Clear, jargon-free meanings.
- **Common Synonyms**: Everyday equivalents for practical usage.
- **Memorable Sentences**: Unique, slightly quirky context clues that stick in the mind.

### 🃏 Intellectual Assessment (Flashcards)
A built-in study mode with a "Perspective 3D" interface allows students to test their knowledge. The system tracks "Known" vs "Learning" states within a session to provide a summary of lexical progress.

### 📝 Academic Scratchpad
A live-saving notes area for capturing raw terms, phonetic notes, or drafts before they are formalized into a journal. Features a one-tap "Copy to Clipboard" function for quick migration of text.

### 📄 Portable Academic Reports
- **PDF-Ready Export**: Generate a beautifully formatted, print-optimized HTML report of any collection.
- **Public Sharing**: Share collections via encrypted URL parameters. The entire dataset is serialized into a Base64 string, allowing others to view your journal without a centralized database.

### 🔒 Privacy & Persistence
- **Zero Backend**: All journals and notes are stored locally in the browser via `LocalStorage`.
- **User Segregation**: Supports multiple student profiles on the same device.

## 🛠️ Technology Stack
- **Framework**: React 19 (ES6 Modules)
- **Styling**: Tailwind CSS (Monochrome/Academic Palette)
- **AI Engine**: Google GenAI (@google/genai)
- **Model**: `gemini-3-flash-preview`
- **Typography**: Crimson Pro (Serif) & Inter (Sans)
- **Bundler**: Vite + TypeScript

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file or set your environment variable:
   ```bash
   process.env.API_KEY = "YOUR_GEMINI_API_KEY"
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure
- `components/`: Modular UI units (Flashcards, Dashboard, Notes, etc.)
- `services/`: Core logic for Gemini API integration and LocalStorage management.
- `types.ts`: Strictly typed interfaces for Journals, Entries, and Users.
- `index.html`: Entry point featuring the "Lexicon" typography and SAT-inspired global styles.

## 📜 License
This project is designed for academic and personal use. Feel free to fork and adapt for your own lexical studies.

---
*Built for the pursuit of linguistic excellence.*