import React from 'react';
import { VocabTable, User } from '../types';
import NotesArea from './NotesArea';

interface DashboardProps {
  user: User;
  tables: VocabTable[];
  onSelectTable: (table: VocabTable) => void;
  onCreateNew: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, tables, onSelectTable, onCreateNew }) => {
  const calculateMastery = (table: VocabTable) => {
    if (table.entries.length === 0) return 0;
    const total = table.entries.reduce((acc, e) => acc + (e.progress || 0), 0);
    return Math.round(total / table.entries.length);
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-sm font-bold uppercase tracking-[0.4em] text-primary mb-3 block">Scholar Repository</span>
          <h2 className="text-3xl md:text-[42px] lg:text-5xl font-bold font-display text-text leading-tight">Your Collections</h2>
          <p className="text-muted mt-3 max-w-lg leading-relaxed font-sans italic text-sm">"Words are the maps of the mind." — Organise your academic semantic records.</p>
        </div>
        <div className="flex justify-center md:justify-end">
          <button
            onClick={onCreateNew}
            className="bg-surfaceHighlight text-text border border-white/10 px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center space-x-3 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-lg shadow-black/20 hover:-translate-y-1"
          >
            <span>+ NEW JOURNAL ENTRY</span>
          </button>
        </div>
      </div>

      <NotesArea userId={user.id} />

      <div className="pt-8">
        <div className="flex items-center space-x-4 mb-10">
           <div className="h-px bg-white/5 flex-1"></div>
           <span className="text-sm font-bold uppercase tracking-[0.4em] text-muted whitespace-nowrap">Archives</span>
           <div className="h-px bg-white/5 flex-1"></div>
        </div>

        {tables.length === 0 ? (
          <div className="text-center py-24 bg-surface border border-white/5 rounded-2xl shadow-lg shadow-black/20">
            <div className="w-20 h-20 bg-surfaceHighlight border border-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold font-display text-text">Your Archive Awaits</h3>
            <p className="text-muted max-w-sm mx-auto mt-4 text-base leading-relaxed italic">Begin your journey of linguistic mastery by assembling your first collection.</p>
            <button 
              onClick={onCreateNew} 
              className="mt-10 px-8 py-3 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest rounded-full hover:bg-primary hover:text-white transition-all inline-block border border-primary/20 hover:border-primary"
            >
              Start First Entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {tables.sort((a,b) => b.createdAt - a.createdAt).map(table => {
              const mastery = calculateMastery(table);
              return (
                <div
                  key={table.id}
                  onClick={() => onSelectTable(table)}
                  className="group bg-surface p-5 md:p-6 border border-white/5 rounded-2xl hover:border-primary/50 transition-all cursor-pointer shadow-lg shadow-black/20 hover:shadow-primary/10 flex flex-col h-full transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[12px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">Vol. {table.entries.length}</span>
                    <span className="text-xs text-muted font-mono">{new Date(table.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-display text-text group-hover:text-primary leading-tight transition-colors">{table.title}</h3>
                  <p className="text-muted text-sm line-clamp-2 mb-6 italic font-sans leading-relaxed">
                    {table.description || 'Formal documentation for this lexical set.'}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mb-8 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                      <span>Lexical Mastery</span>
                      <span className={mastery >= 70 ? 'text-primary' : 'text-muted'}>{mastery}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surfaceHighlight rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out" 
                        style={{ width: `${mastery}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 mt-auto flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">Authored Entry</span>
                    <span className="text-sm text-text font-bold uppercase tracking-widest group-hover:text-primary transition-colors flex items-center">
                      Review <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;