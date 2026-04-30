import React, { useMemo } from 'react';
import { VocabTable, User } from '../types';

interface HomePageProps {
  user: User;
  tables: VocabTable[];
  onNavigateToTable: (table: VocabTable) => void;
  onNavigateToCreate: () => void;
  onNavigateToArchives: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  user, 
  tables, 
  onNavigateToTable, 
  onNavigateToCreate,
  onNavigateToArchives 
}) => {
  const wordOfTheDay = useMemo(() => {
    const personalTables = tables.filter(t => !t.id.startsWith('system-'));
    const allEntries = personalTables.flatMap(t => t.entries.map(e => ({ ...e, tableId: t.id, tableName: t.title })));
    if (allEntries.length === 0) return null;
    // Simple random selection for now. In a real app, could be seeded by date.
    const randomIndex = Math.floor(Math.random() * allEntries.length);
    return allEntries[randomIndex];
  }, [tables]);

  const handleGoToCollection = () => {
    if (wordOfTheDay) {
      const table = tables.find(t => t.id === wordOfTheDay.tableId);
      if (table) {
        onNavigateToTable(table);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 sm:space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="text-center space-y-3 sm:space-y-4">
        <h1 className="text-2xl sm:text-5xl font-bold font-display text-text leading-tight">Hello, {user.username}!</h1>
        <p className="text-muted max-w-2xl mx-auto leading-relaxed font-sans text-base sm:text-lg">
          {tables.filter(t => !t.id.startsWith('system-')).length > 0 
            ? "Your daily dose of linguistic enrichment." 
            : "Welcome to your academic lexicon. Let's begin your journey."}
        </p>
      </div>

      {wordOfTheDay ? (
        <div className="mx-auto w-full max-w-3xl bg-surface p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl shadow-black/20 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          
          <div className="mb-4 sm:mb-6">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              Word of the Day
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold font-display text-text mb-2 sm:mb-4 tracking-tight">
            {wordOfTheDay.word}
          </h2>
          
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
            <span className="text-xs sm:text-sm font-sans font-bold italic text-muted">{wordOfTheDay.partOfSpeech}</span>
            <span className="w-1 h-1 bg-muted rounded-full"></span>
            <span className="text-[10px] sm:text-sm text-muted uppercase tracking-widest font-bold opacity-60">{wordOfTheDay.tableName}</span>
          </div>

          <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
            <p className="text-lg sm:text-xl text-text/90 leading-relaxed font-sans font-medium">
              {wordOfTheDay.meaning}
            </p>
            
            {wordOfTheDay.sentence && (
              <div className="bg-surfaceHighlight p-4 sm:p-6 rounded-xl border border-white/5 relative mt-6 sm:mt-8">
                <span className="absolute top-2 sm:top-4 left-2 sm:left-4 text-2xl sm:text-4xl text-primary/20 font-sans font-bold leading-none">"</span>
                <p className="text-sm sm:text-muted italic relative z-10 px-2 sm:px-4">
                  {wordOfTheDay.sentence}
                </p>
                <span className="absolute bottom-1 sm:bottom-2 right-2 sm:right-4 text-2xl sm:text-4xl text-primary/20 font-sans font-bold leading-none rotate-180">"</span>
              </div>
            )}
          </div>

          <button 
            onClick={handleGoToCollection}
            className="mt-8 sm:mt-10 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors flex items-center justify-center mx-auto group-hover:translate-y-1 duration-300"
          >
            View in Collection <span className="ml-2">→</span>
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto text-center p-6 sm:p-12 bg-surface rounded-3xl border border-white/5 border-dashed space-y-6">
          <div className="space-y-4">
            <p className="text-muted italic text-lg">
              Your archives are currently empty.
            </p>
            <p className="text-text/70 max-w-md mx-auto leading-relaxed">
              Start your first journal to begin tracking your vocabulary, or explore our pre-installed academic collections.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button 
              onClick={onNavigateToCreate}
              className="p-4 sm:p-6 bg-surfaceHighlight border border-white/5 rounded-2xl hover:border-primary/50 transition-all text-left group"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">Academic Path</span>
              <h3 className="font-bold text-text mb-1">Start First Journal</h3>
              <p className="text-xs text-muted">Begin your personal vocabulary record.</p>
            </button>
            <button 
              onClick={onNavigateToArchives}
              className="p-4 sm:p-6 bg-surfaceHighlight border border-white/5 rounded-2xl hover:border-secondary/50 transition-all text-left group"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">System Archives</span>
              <h3 className="font-bold text-text mb-1">IELTS & SAT Vocab</h3>
              <p className="text-xs text-muted">Master essential academic terminology.</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
