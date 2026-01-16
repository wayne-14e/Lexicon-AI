
import React, { useState, useRef, useEffect } from 'react';
import { User, VocabTable } from '../types';

interface LayoutProps {
  user: User | null;
  tables: VocabTable[];
  onLogout: () => void;
  onNavigateToTable: (table: VocabTable) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, tables, onLogout, onNavigateToTable, children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = searchQuery.trim().length > 1 
    ? tables.flatMap(table => 
        table.entries
          .filter(entry => entry.word.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(entry => ({ table, entry }))
      ).slice(0, 5)
    : [];

  const handleSelectResult = (table: VocabTable) => {
    onNavigateToTable(table);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 print:hidden transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo Left */}
          <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black flex items-center justify-center text-white text-xl sm:text-2xl font-bold rounded shrink-0 shadow-sm select-none cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => window.location.reload()}>
              L
            </div>
            <div className="flex flex-col justify-center hidden sm:flex">
              <h1 className="text-xl font-bold tracking-tight text-black leading-none serif">Lexicon</h1>
              <span className="text-gray-400 font-bold italic text-[11px] uppercase tracking-[0.2em] mt-1.5 leading-none">AI JOURNAL</span>
            </div>
          </div>

          {/* Global Search Middle */}
          {user && (
            <div className="flex-1 max-w-[120px] sm:max-w-xs md:max-w-sm px-2 relative" ref={searchRef}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Find lexeme..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-base bg-gray-50/50 focus:bg-white focus:outline-none focus:border-blue-600 transition-all font-medium serif"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                />
              </div>

              {showResults && searchQuery.trim().length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-lg sat-shadow-lg z-50 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {results.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Lexical Matches</div>
                      {results.map((res, i) => (
                        <button
                          key={`${res.table.id}-${res.entry.id}`}
                          onClick={() => handleSelectResult(res.table)}
                          className="w-full text-left px-5 py-3 hover:bg-blue-50/30 flex flex-col transition-colors group"
                        >
                          <span className="text-base font-bold serif text-black group-hover:text-blue-700">{res.entry.word}</span>
                          <span className="text-xs text-gray-400 italic">In collection: {res.table.title}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-base text-gray-400 italic serif">No matches found in your repository.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* User Right */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 min-w-0 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <div className="text-lg text-black leading-none serif italic font-medium">
                    <span className="text-gray-400 font-normal">Hello, </span>
                    <span className="font-bold">{user.username}</span>
                  </div>
                </div>
                <div className="relative group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-base sm:text-lg font-bold border-2 border-blue-600 shadow-sm group-hover:shadow transition-all">
                    {user.username.charAt(0)}
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                title="Sign Out"
                className="w-8 h-8 sm:w-9 sm:h-9 text-gray-300 flex items-center justify-center rounded transition-all hover:bg-red-50 hover:text-red-500 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-50 py-8 print:hidden">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="text-sm text-gray-400 serif italic tracking-wide">
            &copy; {new Date().getFullYear()} Lexicon AI Journal &bull; Built for linguistic excellence
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
