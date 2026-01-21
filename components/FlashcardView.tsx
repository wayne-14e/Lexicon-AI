import React, { useState, useEffect } from 'react';
import { VocabTable, VocabEntry } from '../types';
import { geminiService } from '../services/geminiService';

interface FlashcardViewProps {
  table: VocabTable;
  onBack: () => void;
  onUpdateProgress: (entryId: string, isKnown: boolean) => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ table, onBack, onUpdateProgress }) => {
  const shuffle = (array: VocabEntry[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const [shuffledEntries, setShuffledEntries] = useState<VocabEntry[]>(() => shuffle(table.entries));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [learningCount, setLearningCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentEntry = shuffledEntries[currentIndex];

  const handleAssessment = (known: boolean) => {
    onUpdateProgress(currentEntry.id, known);
    if (known) setKnownCount(prev => prev + 1);
    else setLearningCount(prev => prev + 1);

    if (currentIndex < shuffledEntries.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
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
      <div className="fixed inset-0 bg-[#fafafa] z-50 flex items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden">
        <div className="max-w-md w-full text-center space-y-10 py-12">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-blue-600 mb-4 block">Scholarly Assessment</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-black serif">Session Complete</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-4xl font-bold text-black serif mb-2">{knownCount}</div>
              <div className="text-[8px] uppercase tracking-[0.2em] text-blue-600 font-bold">Mastered</div>
            </div>
            <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-4xl font-bold text-black serif mb-2">{learningCount}</div>
              <div className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold">In Progress</div>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <button 
              onClick={() => { setShuffledEntries(shuffle(table.entries)); setCurrentIndex(0); setIsFlipped(false); setKnownCount(0); setLearningCount(0); setIsFinished(false); }}
              className="w-full bg-black text-white py-4 rounded-full font-bold uppercase tracking-[0.2em] text-sm hover:bg-blue-600 transition-all shadow-xl"
            >
              Restart Session
            </button>
            <button 
              onClick={onBack}
              className="w-full text-gray-400 py-4 font-bold uppercase tracking-[0.2em] text-[11px] hover:text-black transition-all"
            >
              Exit to Journal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEntry) return null;

  return (
    <div className="fixed inset-0 bg-[#fafafa] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-10 py-3 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center space-x-6 sm:space-x-10">
          <button onClick={onBack} className="group flex items-center space-x-3 text-gray-400 hover:text-black transition-colors">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Exit</span>
          </button>
          <div className="hidden sm:block">
            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.5em] block mb-0.5">Set Archive</span>
            <span className="text-lg font-bold serif text-black truncate max-w-[250px] block leading-none">{table.title}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2"></div>
            <span className="text-xs font-bold font-mono text-blue-700">{knownCount}</span>
          </div>
          <div className="flex items-center bg-gray-50/50 px-3 py-1 rounded-full border border-gray-100">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></div>
            <span className="text-xs font-bold font-mono text-gray-400">{learningCount}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-16 p-4 lg:p-6 overflow-hidden">
        <div className="w-full max-w-xl relative perspective mb-6 lg:mb-10">
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full h-[320px] lg:h-[360px] cursor-pointer transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-white rounded-2xl border border-gray-100 shadow-lg flex flex-col items-center justify-center p-8 text-center group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-50"></div>
              <span className="text-[8px] font-bold uppercase tracking-[0.8em] text-gray-300 mb-6">Lexeme Artifact</span>
              <h3 className="text-5xl lg:text-7xl font-bold serif text-black leading-tight mb-4">
                {currentEntry.word}
              </h3>
              
              {/* Pronunciation Button on Front (Icon Only) */}
              <button 
                onClick={handleSpeak}
                className={`p-3 rounded-full border transition-all ${isSpeaking ? 'bg-blue-600 text-white border-blue-600 animate-pulse' : 'bg-gray-50 text-gray-300 border-gray-100 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100'}`}
                title="Play Pronunciation"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>

              <div className="mt-8 flex flex-col items-center space-y-2 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Click to reveal</span>
                <div className="w-3 h-0.5 bg-blue-600 animate-pulse"></div>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-2xl border border-gray-100 shadow-lg flex flex-col px-8 pb-8 pt-6 group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
              <div className="flex justify-between items-center mb-5">
                <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-blue-600">Semantic Record</span>
                
                {/* Part of Speech on Back */}
                <div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full">
                  <span className="text-[10px] font-bold italic text-gray-400 uppercase tracking-widest">{currentEntry.partOfSpeech}</span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-start space-y-2 overflow-y-auto no-scrollbar">
                <div>
                  <h4 className="text-[7px] font-bold uppercase tracking-[0.6em] text-gray-300 mb-0.5">Primary Definition</h4>
                  <p className="text-2xl lg:text-3xl font-bold serif leading-[1.1] text-black italic">
                    {currentEntry.meaning}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-50">
                  {currentEntry.synonyms && (
                    <div>
                      <h4 className="text-[7px] font-bold uppercase tracking-[0.6em] text-gray-300 mb-0.5">Equivalents</h4>
                      <p className="text-xl lg:text-2xl serif text-gray-600 italic leading-snug">{currentEntry.synonyms}</p>
                    </div>
                  )}

                  {currentEntry.sentence && (
                    <div className="bg-gray-50/40 p-4 rounded-xl border border-gray-50/60">
                      <h4 className="text-[7px] font-bold uppercase tracking-[0.6em] text-gray-300 mb-1">Contextual usage</h4>
                      <p className="text-[18px] lg:text-[21px] text-gray-600 leading-[1.25] serif italic">
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
          <div className="flex items-center justify-center space-x-12 lg:space-x-16">
            <button 
              onClick={() => handleAssessment(false)}
              className="group flex flex-col items-center space-y-2"
            >
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full border border-gray-100 bg-white flex items-center justify-center text-gray-300 group-hover:bg-red-50 group-hover:text-red-500 group-hover:border-red-100 transition-all shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-gray-300 group-hover:text-red-500 transition-colors">Learning</span>
            </button>

            <button 
              onClick={() => handleAssessment(true)}
              className="group flex flex-col items-center space-y-2"
            >
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full border border-gray-100 bg-white flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-gray-300 group-hover:text-blue-600 transition-colors">Mastered</span>
            </button>
          </div>

          <div className="w-full flex flex-col items-center">
             <div className="w-full max-w-[240px] h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-600 transition-all duration-700 ease-in-out" style={{ width: `${((currentIndex + 1) / shuffledEntries.length) * 100}%` }}></div>
             </div>
             <div className="flex items-center space-x-2">
               <span className="text-[10px] font-bold font-mono text-gray-300 uppercase tracking-[0.3em]">
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
