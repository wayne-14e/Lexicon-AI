import React, { useState, useEffect } from 'react';
import { VocabTable, VocabEntry, GameMode } from '../types';
import { geminiService } from '../services/geminiService';
import { MOTIVATIONAL_QUOTES } from '../constants';

interface MatchingGameViewProps {
  table: VocabTable;
  initialMode?: GameMode;
  onBack: () => void;
  onUpdateTable: (updatedTable: VocabTable) => void;
  onAwardTokens: (amount: number, reason?: string) => void;
}

interface GamePair {
  id: string;
  word: string;
  match: string;
}

const MatchingGameView: React.FC<MatchingGameViewProps> = ({ table, initialMode = 'synonyms', onBack, onUpdateTable, onAwardTokens }) => {
  const [gameMode, setGameMode] = useState<GameMode>(initialMode);
  const [pairs, setPairs] = useState<GamePair[]>([]);
  const [leftColumn, setLeftColumn] = useState<GamePair[]>([]);
  const [rightColumn, setRightColumn] = useState<GamePair[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{left: string, right: string} | null>(null);
  const [sessionTokens, setSessionTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);

  // Session stats
  const [mistakes, setMistakes] = useState(0);
  const [motivationalQuote, setMotivationalQuote] = useState<string>("");

  const shuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startNewGame = async () => {
    setIsLoading(true);
    setIsGameFinished(false);
    setMatchedIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongPair(null);
    setMistakes(0);
    setSessionTokens(0);
    setMotivationalQuote("");

    // Select 5 random words
    const availableEntries = table.entries.filter(e => e.word && e.word.trim().length > 0);
    if (availableEntries.length < 5) {
      // Handle small tables gracefully
    }
    
    const shuffledEntries = shuffle(availableEntries).slice(0, 5);
    
    // Prepare data based on mode
    let gamePairs: GamePair[] = [];
    
    if (gameMode === 'synonyms') {
      gamePairs = shuffledEntries.map(entry => ({
        id: entry.id,
        word: entry.word,
        match: entry.synonyms.split(',')[0].trim() || '???'
      })).filter(p => p.match !== '???');
    } else {
      // Check if we need to fetch antonyms
      const missingAntonyms = shuffledEntries.filter(e => !e.antonyms);
      
      if (missingAntonyms.length > 0) {
        const wordsToFetch = missingAntonyms.map(e => e.word);
        const antonymsMap = await geminiService.generateAntonyms(wordsToFetch);
        
        // Update table with new antonyms
        const updatedEntries = table.entries.map(e => {
          if (antonymsMap[e.word]) {
            return { ...e, antonyms: antonymsMap[e.word] };
          }
          return e;
        });
        
        onUpdateTable({ ...table, entries: updatedEntries });
        
        // Use the updated entries for the game
        gamePairs = shuffledEntries.map(entry => {
          // Try exact match first, then case-insensitive
          let antonym = antonymsMap[entry.word];
          if (!antonym) {
            const lowerKey = Object.keys(antonymsMap).find(k => k.toLowerCase() === entry.word.toLowerCase());
            if (lowerKey) antonym = antonymsMap[lowerKey];
          }
          
          // Fallback to existing antonyms or ???
          const matchValue = antonym || entry.antonyms || '???';
          
          return {
            id: entry.id,
            word: entry.word,
            match: matchValue.split(',')[0].trim()
          };
        }).filter(p => p.match !== '???');
      } else {
        gamePairs = shuffledEntries.map(entry => ({
          id: entry.id,
          word: entry.word,
          match: (entry.antonyms || '').split(',')[0].trim() || '???'
        })).filter(p => p.match !== '???');
      }
    }

    if (gamePairs.length < 2) {
      // If we don't have enough pairs, show a message
      setIsLoading(false);
      setPairs([]);
      return;
    }

    setPairs(gamePairs);
    setLeftColumn(shuffle(gamePairs));
    setRightColumn(shuffle(gamePairs));
    setIsLoading(false);
  };

  useEffect(() => {
    startNewGame();
  }, [gameMode]);

  const handleLeftClick = (id: string) => {
    if (matchedIds.has(id)) return;
    setSelectedLeft(id);
    setWrongPair(null);
    
    if (selectedRight) {
      checkMatch(id, selectedRight);
    }
  };

  const handleRightClick = (id: string) => {
    if (matchedIds.has(id)) return;
    setSelectedRight(id);
    setWrongPair(null);
    
    if (selectedLeft) {
      checkMatch(selectedLeft, id);
    }
  };

  const checkMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      // Match!
      const newMatched = new Set(matchedIds);
      newMatched.add(leftId);
      setMatchedIds(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);
      
      // Award tokens for correct match
      setSessionTokens(prev => prev + 2);
      onAwardTokens(2);
      
      if (newMatched.size === pairs.length) {
        setTimeout(() => {
          // Select random quote
          const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
          setMotivationalQuote(randomQuote);
          setIsGameFinished(true);
        }, 500);
      }
    } else {
      // Wrong!
      setMistakes(prev => prev + 1);
      setWrongPair({ left: leftId, right: rightId });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 1000);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-background z-50 flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Header ... */}
      <div className="bg-surface/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm z-10">
        <button 
          onClick={onBack}
          className="text-muted hover:text-text transition-colors"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-surfaceHighlight p-1 rounded-full border border-white/5">
            <button
              onClick={() => setGameMode('synonyms')}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest transition-all ${gameMode === 'synonyms' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
            >
              Synonyms
            </button>
            <button
              onClick={() => setGameMode('antonyms')}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest transition-all ${gameMode === 'antonyms' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
            >
              Antonyms
            </button>
          </div>
        </div>
        
        <div className="w-5 sm:w-6"></div> {/* Spacer */}
      </div>

      {/* Game Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Preparing Game...</p>
          </div>
        ) : isGameFinished ? (
          // ... (Success state)
          <div className="max-w-2xl w-full text-center animate-in zoom-in duration-500 py-12">
            <div className="w-20 h-20 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400 border border-green-400/20">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold font-display text-text mb-2">Perfect Match!</h2>
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="bg-surface px-6 py-3 rounded-xl border border-white/5 shadow-sm">
                <div className="text-2xl font-bold text-text font-display">{mistakes}</div>
                <div className="text-[8px] uppercase tracking-widest text-muted font-bold">Mistakes</div>
              </div>
              <div className="bg-surface px-6 py-3 rounded-xl border border-purple-500/20 shadow-sm">
                <div className="text-2xl font-bold text-purple-500 font-display">{sessionTokens}</div>
                <div className="text-[8px] uppercase tracking-widest text-purple-500 font-bold">Tokens Earned</div>
              </div>
            </div>
            
            {/* Motivation Section */}
            <div className="bg-surface p-8 rounded-2xl border border-white/5 shadow-lg shadow-black/20 relative overflow-hidden text-left mb-8">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-text">Well Done</h3>
                </div>
                
                <div>
                  <p className="text-lg sm:text-xl font-sans text-text/90 leading-relaxed italic text-center px-4">
                    "{motivationalQuote}"
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={startNewGame}
              className="px-8 py-3 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-secondary transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
            >
              Play Again
            </button>
          </div>
        ) : pairs.length === 0 ? (
           <div className="text-center max-w-md mx-auto p-8 bg-surface rounded-2xl border border-white/5 shadow-lg shadow-black/20">
             <div className="w-16 h-16 bg-surfaceHighlight rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <h3 className="text-xl font-bold font-display text-text mb-2">No Matches Found</h3>
             <p className="text-muted mb-6 text-sm">
               {gameMode === 'antonyms' 
                 ? "We couldn't find clear antonyms for these words. Try adding more words to your collection or switch to Synonyms mode." 
                 : "We couldn't find synonyms for these words. Try adding more words to your collection."}
             </p>
             <button 
               onClick={startNewGame}
               className="px-6 py-2 bg-surfaceHighlight text-text rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all border border-white/5"
             >
               Retry
             </button>
           </div>
        ) : (
          <div className="w-full max-w-4xl grid grid-cols-2 gap-3 sm:gap-8 md:gap-16">
            {/* ... (Game columns) ... */}
            {/* Left Column (Words) */}
            <div className="space-y-3 sm:space-y-4">
              {leftColumn.map(pair => {
                const isSelected = selectedLeft === pair.id;
                const isMatched = matchedIds.has(pair.id);
                const isWrong = wrongPair?.left === pair.id;
                
                return (
                  <button
                    key={pair.id}
                    onClick={() => handleLeftClick(pair.id)}
                    disabled={isMatched}
                    className={`w-full p-4 sm:p-6 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group
                      ${isMatched 
                        ? 'border-transparent bg-green-400/10 text-green-400 opacity-50 cursor-default' 
                        : isWrong
                          ? 'border-red-500 bg-red-500/10 text-red-400 shake'
                          : isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-md scale-[1.02]'
                            : 'border-white/5 bg-surface hover:border-primary/30 hover:shadow-sm'
                      }
                    `}
                  >
                    <span className={`text-sm sm:text-lg font-bold font-display ${isMatched ? 'line-through' : ''}`}>{pair.word}</span>
                    {isMatched && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Column (Matches) */}
            <div className="space-y-3 sm:space-y-4">
              {rightColumn.map(pair => {
                const isSelected = selectedRight === pair.id;
                const isMatched = matchedIds.has(pair.id);
                const isWrong = wrongPair?.right === pair.id;
                
                return (
                  <button
                    key={pair.id}
                    onClick={() => handleRightClick(pair.id)}
                    disabled={isMatched}
                    className={`w-full p-4 sm:p-6 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group
                      ${isMatched 
                        ? 'border-transparent bg-green-400/10 text-green-400 opacity-50 cursor-default' 
                        : isWrong
                          ? 'border-red-500 bg-red-500/10 text-red-400 shake'
                          : isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-md scale-[1.02]'
                            : 'border-white/5 bg-surface hover:border-primary/30 hover:shadow-sm'
                      }
                    `}
                  >
                    <span className={`text-sm sm:text-lg italic font-sans text-text/70 ${isMatched ? 'line-through' : ''}`}>{pair.match}</span>
                    {isMatched && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default MatchingGameView;
