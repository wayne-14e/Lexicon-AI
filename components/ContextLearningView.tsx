
import React from 'react';
import { VocabTable } from '../types';

interface ContextLearningViewProps {
  table: VocabTable;
  onBack: () => void;
}

const ContextLearningView: React.FC<ContextLearningViewProps> = ({ table, onBack }) => {
  const { contextPassage, entries } = table;

  if (!contextPassage) return null;

  // Function to highlight vocabulary words in the text
  const highlightWords = (text: string) => {
    let highlightedText = text;
    
    // Sort words by length descending to avoid partial matching issues (e.g., 'cat' vs 'caterpillar')
    const sortedWords = [...entries].map(e => e.word).sort((a, b) => b.length - a.length);

    sortedWords.forEach(word => {
      // Case-insensitive replacement with a span
      // Use boundary match to ensure we only highlight full words
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, (match) => {
        return `<span class="bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-200 px-0.5 rounded-t-sm transition-all hover:bg-blue-100 cursor-help" title="Vocabulary Word">${match}</span>`;
      });
    });

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <button 
          onClick={onBack}
          className="group flex items-center space-x-3 text-gray-400 hover:text-black transition-colors"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest">Return to Collection</span>
        </button>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 block mb-1">Context Learning Mode</span>
          <span className="text-xs font-mono text-blue-500 font-bold">{entries.length} Terms Incorporated</span>
        </div>
      </div>

      <div className="bg-white sat-border rounded-xl p-8 md:p-16 sat-shadow-lg space-y-12">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-1 bg-blue-600 mx-auto rounded-full mb-8"></div>
          <h1 className="text-4xl md:text-5xl font-bold serif text-black leading-tight italic">
            {contextPassage.title}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300">Lexical Narrative Synthesis</p>
        </header>

        <article className="prose prose-lg max-w-none">
          <div className="text-xl md:text-2xl serif leading-[1.8] text-gray-800 space-y-8 first-letter:text-6xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:serif">
             {highlightWords(contextPassage.text)}
          </div>
        </article>

        <footer className="pt-12 border-t border-gray-50 mt-20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Academic Review</div>
            <p className="text-sm italic text-gray-400 max-w-md">
              The words highlighted above have been synthesized into this unique context by Lexicon AI to facilitate situational memory retention.
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        .sat-shadow-lg {
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
};

export default ContextLearningView;
