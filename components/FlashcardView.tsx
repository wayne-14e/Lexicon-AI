import React, { useState } from 'react';
import { VocabTable, VocabEntry } from '../types';
import { geminiService } from '../services/geminiService';
import { MOTIVATIONAL_QUOTES } from '../constants';

interface FlashcardViewProps {
  table: VocabTable;
  excludeMastered: boolean;
  onBack: () => void;
  onUpdateProgress: (entryId: string, isKnown: boolean) => void;
  onAwardTokens: (amount: number, reason?: string) => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ table, excludeMastered, onBack, onUpdateProgress, onAwardTokens }) => {
  const shuffle = (array: VocabEntry[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const [shuffledEntries, setShuffledEntries] = useState<VocabEntry[]>(() => {
    let entries = table.entries;
    if (excludeMastered) {
      entries = entries.filter(e => (e.progress || 0) < 80);
    }
    return shuffle(entries);
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [learningCount, setLearningCount] = useState(0);
  const [sessionTokens, setSessionTokens] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Session stats
  const [improvement, setImprovement] = useState<number>(0);
  const [motivationalQuote, setMotivationalQuote] = useState<string>("");
  
  const [initialAvgProgress] = useState<number>(() => {
    if (shuffledEntries.length === 0) return 0;
    const sum = shuffledEntries.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    return sum / shuffledEntries.length;
  });

  const currentEntry = shuffledEntries[currentIndex];

  const handleAssessment = async (known: boolean) => {
    onUpdateProgress(currentEntry.id, known);
    
    if (known) {
      setKnownCount(prev => prev + 1);
      setSessionTokens(prev => prev + 5);
      onAwardTokens(5);
    } else {
      setLearningCount(prev => prev + 1);
    }

    if (currentIndex < shuffledEntries.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      // Calculate improvement
      const currentEntries = table.entries.filter(e => shuffledEntries.some(se => se.id === e.id));
      const newAvgProgress = currentEntries.length > 0 
        ? currentEntries.reduce((acc, curr) => acc + (curr.progress || 0), 0) / currentEntries.length 
        : 0;
      const improvementVal = Math.round(newAvgProgress - initialAvgProgress);
      setImprovement(improvementVal);
      
      // Select random quote
      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      setMotivationalQuote(randomQuote);
      
      setIsFinished(true);
    }
  };

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) return;
    setIsSpeaking(true);
    await geminiService.textToSpeech(currentEntry.word);
    setIsSpeaking(false);
  };

  if (isFinished) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-background z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
          <div className="max-w-2xl w-full space-y-6 sm:space-y-8 py-8">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary mb-3 sm:mb-4 block">Scholarly Assessment</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text font-display">Session Complete</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-white/5 shadow-lg shadow-black/20 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-text font-display mb-2">{knownCount}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] text-primary font-bold">Mastered</div>
              </div>
              <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-white/5 shadow-lg shadow-black/20 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-text font-display mb-2">{learningCount}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] text-muted font-bold">In Progress</div>
              </div>
              <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-purple-500/10 shadow-lg shadow-purple-500/5 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-500 font-display mb-2">{sessionTokens}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] text-purple-500 font-bold">Tokens</div>
              </div>
            </div>

            {/* Progress & Motivation Section */}
            <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-white/5 shadow-lg shadow-black/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-text">Progress</h3>
                  <div className="flex items-center space-x-4">
                    {improvement > 0 ? (
                      <div className="flex items-center space-x-1 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="text-sm font-bold">+{improvement}% Improvement</span>
                      </div>
                    ) : improvement < 0 ? (
                      <div className="flex items-center space-x-1 text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span className="text-sm font-bold">{improvement}% Change</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-muted bg-white/5 px-3 py-1.5 rounded-full">
                        <span className="text-sm font-bold">No Change</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-lg sm:text-xl font-sans text-text/90 leading-relaxed italic text-center px-4">
                    "{motivationalQuote}"
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4 max-w-md mx-auto">
              <button 
                onClick={() => { 
                  setShuffledEntries(shuffle(table.entries)); 
                  setCurrentIndex(0); 
                  setIsFlipped(false); 
                  setKnownCount(0); 
                  setLearningCount(0); 
                  setSessionTokens(0);
                  setImprovement(0);
                  setMotivationalQuote("");
                  setIsFinished(false); 
                }}
                className="w-full bg-primary text-white py-3 sm:py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs sm:text-sm hover:bg-secondary transition-all shadow-xl shadow-primary/20"
              >
                Restart Session
              </button>
              <button 
                onClick={onBack}
                className="w-full text-muted py-3 sm:py-4 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:text-text transition-all"
              >
                Exit to Journal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEntry) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-background z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-surfaceHighlight rounded-full flex items-center justify-center mb-6 text-muted">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold font-display text-text mb-4">No Cards Available</h2>
        <p className="text-muted mb-8 max-w-md text-lg font-sans italic leading-relaxed">
          {excludeMastered 
            ? "You have mastered all words in this collection! Return to the collection to review all words." 
            : "This collection is empty. Add some words to start learning."}
        </p>
        
        <div className="flex flex-col space-y-4 w-full max-w-xs">
          <button 
            onClick={onBack}
            className="w-full bg-surface border border-white/10 text-muted py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:text-text hover:border-white/20 transition-all"
          >
            Return to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between bg-surface/80 backdrop-blur-md border-b border-white/5 shadow-sm">
        <div className="flex items-center space-x-6 sm:space-x-10">
          <button onClick={onBack} className="group flex items-center space-x-3 text-muted hover:text-text transition-colors">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Exit</span>
          </button>
          <div className="hidden sm:block">
            <span className="text-[8px] font-bold text-muted uppercase tracking-[0.5em] block mb-0.5">Set Archive</span>
            <span className="text-lg font-bold font-display text-text truncate max-w-[250px] block leading-none">{table.title}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
            <span className="text-xs font-bold font-mono text-primary">{knownCount}</span>
          </div>
          <div className="flex items-center bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-muted mr-2"></div>
            <span className="text-xs font-bold font-mono text-muted">{learningCount}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-8 sm:pt-16 p-2 sm:p-4 lg:p-6 overflow-hidden">
        <div className="w-full max-w-xl relative perspective mb-6 lg:mb-10">
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full h-[340px] sm:h-[380px] lg:h-[400px] cursor-pointer transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-surface rounded-2xl border border-white/5 shadow-lg shadow-black/20 flex flex-col items-center justify-center p-6 sm:p-8 text-center group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/5"></div>
              <span className="text-[8px] font-bold uppercase tracking-[0.8em] text-muted mb-4 sm:mb-6">Lexeme Artifact</span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-text leading-tight mb-4">
                {currentEntry.word}
              </h3>
              
              {/* Pronunciation Button on Front (Icon Only) */}
              <button 
                onClick={handleSpeak}
                className={`p-2.5 sm:p-3 rounded-full border transition-all ${isSpeaking ? 'bg-primary text-white border-primary animate-pulse' : 'bg-surfaceHighlight text-muted border-white/10 hover:text-primary hover:bg-primary/10 hover:border-primary/20'}`}
                title="Play Pronunciation"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>

              <div className="mt-6 sm:mt-8 flex flex-col items-center space-y-2 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-muted">Click to reveal</span>
                <div className="w-3 h-0.5 bg-primary animate-pulse"></div>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-surface rounded-2xl border border-white/5 shadow-lg shadow-black/20 flex flex-col px-6 sm:px-8 pb-6 sm:pb-8 pt-5 sm:pt-6 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
              <div className="flex justify-between items-center mb-4 sm:mb-5">
                <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-primary">Semantic Record</span>
                
                {/* Part of Speech on Back */}
                <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-surfaceHighlight border border-white/10 rounded-full">
                  <span className="text-[9px] sm:text-[10px] font-bold italic text-muted uppercase tracking-widest">{currentEntry.partOfSpeech}</span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-start space-y-2 overflow-y-auto no-scrollbar">
                <div>
                  <h4 className="text-[7px] font-bold uppercase tracking-[0.6em] text-muted mb-0.5">Primary Definition</h4>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold font-sans leading-[1.1] text-text italic">
                    {currentEntry.meaning}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  {currentEntry.synonyms && (
                    <div>
                      <h4 className="text-[7px] font-bold uppercase tracking-[0.6em] text-muted mb-0.5">Equivalents</h4>
                      <p className="text-base sm:text-lg lg:text-xl font-sans text-text/70 italic leading-snug">{currentEntry.synonyms}</p>
                    </div>
                  )}

                  {currentEntry.sentence && (
                    <div className="bg-surfaceHighlight p-3 sm:p-4 rounded-xl border border-white/5">
                      <h4 className="text-[7px] font-bold uppercase tracking-[0.6em] text-muted mb-1">Contextual usage</h4>
                      <p className="text-sm sm:text-base lg:text-lg text-text/70 leading-[1.25] font-sans italic">
                        "{currentEntry.sentence}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Buttons and Progress */}
        <div className="w-full max-w-lg flex flex-col items-center space-y-6 lg:space-y-8">
          <div className="flex items-center justify-center space-x-10 sm:space-x-12 lg:space-x-16">
            <button 
              onClick={() => handleAssessment(false)}
              className="group flex flex-col items-center space-y-2"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border border-white/10 bg-surface flex items-center justify-center text-muted group-hover:bg-red-500/10 group-hover:text-red-400 group-hover:border-red-400/30 transition-all shadow-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-muted group-hover:text-red-400 transition-colors">Learning</span>
            </button>

            <button 
              onClick={() => handleAssessment(true)}
              className="group flex flex-col items-center space-y-2"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border border-white/10 bg-surface flex items-center justify-center text-muted group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/30 transition-all shadow-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-muted group-hover:text-primary transition-colors">Mastered</span>
            </button>
          </div>

          <div className="w-full flex flex-col items-center">
             <div className="w-full max-w-[240px] h-1 bg-white/5 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-primary transition-all duration-700 ease-in-out" style={{ width: `${((currentIndex + 1) / shuffledEntries.length) * 100}%` }}></div>
             </div>
             <div className="flex items-center space-x-2">
               <span className="text-[10px] font-bold font-mono text-muted uppercase tracking-[0.3em]">
                 Artifact {currentIndex + 1} of {shuffledEntries.length}
               </span>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective { perspective: 2500px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default FlashcardView;