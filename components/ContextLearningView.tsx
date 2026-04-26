
import React from 'react';
import { VocabTable } from '../types';

interface ContextLearningViewProps {
  table: VocabTable;
  onBack: () => void;
}

const ContextLearningView: React.FC<ContextLearningViewProps> = ({ table, onBack }) => {
  const { contextPassage, entries } = table;

  if (!contextPassage) return null;

  // Function to highlight vocabulary words in the text.
  // Works entirely with React nodes so regexes never operate on already-generated
  // HTML strings – this prevents the tag-corruption bug where a word like "Word"
  // would match inside a previously-injected title="Vocabulary Word" attribute.
  const highlightWords = (text: string): React.ReactNode => {
    // Sort words by length descending to avoid partial-match issues (e.g. 'cat' vs 'caterpillar')
    const sortedWords = [...entries]
      .map(e => e.word)
      .filter(w => w && w.trim().length > 0)
      .sort((a, b) => b.length - a.length);

    if (sortedWords.length === 0) return <div>{text}</div>;

    // Escape special regex chars in each word before building the pattern
    const escapedWords = sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const combinedRegex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');

    // Split the plain text into alternating [plain, match, plain, match, …] segments
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let matchResult: RegExpExecArray | null;

    while ((matchResult = combinedRegex.exec(text)) !== null) {
      const [match] = matchResult;
      const start = matchResult.index;

      if (start > lastIndex) {
        parts.push(text.slice(lastIndex, start));
      }

      parts.push(
        <span
          key={start}
          className="bg-primary/20 text-primary font-bold border-b-2 border-primary/40 px-0.5 rounded-t-sm transition-all hover:bg-primary/30 cursor-help"
          title="Vocabulary Word"
        >
          {match}
        </span>
      );

      lastIndex = start + match.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    // Convert \n in plain text segments into <br/> elements
    const withBreaks: React.ReactNode[] = [];
    parts.forEach((part, i) => {
      if (typeof part === 'string') {
        const lines = part.split('\n');
        lines.forEach((line, j) => {
          if (j > 0) withBreaks.push(<div key={`br-${i}-${j}`} className="h-6" />);
          if (line) withBreaks.push(line);
        });
      } else {
        withBreaks.push(part);
      }
    });

    return <div>{withBreaks}</div>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <button 
          onClick={onBack}
          className="group flex items-center space-x-3 text-muted hover:text-text transition-colors"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest">Return to Collection</span>
        </button>
        <div className="text-right">
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-muted block mb-1">Context Learning Mode</span>
          <span className="text-[10px] sm:text-xs font-mono text-primary font-bold">{entries.length} Terms Incorporated</span>
        </div>
      </div>

      <div className="bg-surface border border-white/5 rounded-xl p-8 md:p-16 shadow-lg shadow-black/20 space-y-12">
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-1 bg-primary mx-auto rounded-full mb-8"></div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-text leading-tight italic">
            {contextPassage.title}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">Lexical Narrative Synthesis</p>
        </header>

        <article className="prose prose-invert prose-lg max-w-none">
          <div className="text-xl md:text-2xl font-sans leading-[1.8] text-text/90 space-y-8 first-letter:text-6xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:font-display">
             {highlightWords(contextPassage.text)}
          </div>
        </article>

        <footer className="pt-12 border-t border-white/5 mt-20">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Academic Review</div>
            <p className="text-sm italic text-muted max-w-md">
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
