
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
  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-sm font-bold uppercase tracking-[0.4em] text-blue-600 mb-3 block">Scholar Repository</span>
          <h2 className="text-4xl sm:text-5xl font-bold serif text-black leading-tight">Your Collections</h2>
          <p className="text-gray-500 mt-3 max-w-lg leading-relaxed serif italic text-base">"Words are the maps of the mind." — Organise your academic semantic records.</p>
        </div>
        <div className="flex justify-center md:justify-end">
          <button
            onClick={onCreateNew}
            className="bg-black text-white px-10 py-4 rounded font-bold uppercase tracking-widest text-sm flex items-center justify-center space-x-3 hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1"
          >
            <span>+ NEW JOURNAL ENTRY</span>
          </button>
        </div>
      </div>

      <NotesArea userId={user.id} />

      <div className="pt-8">
        <div className="flex items-center space-x-4 mb-10">
           <div className="h-px bg-gray-100 flex-1"></div>
           <span className="text-sm font-bold uppercase tracking-[0.4em] text-gray-300 whitespace-nowrap">Archives</span>
           <div className="h-px bg-gray-100 flex-1"></div>
        </div>

        {tables.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-100 rounded-2xl sat-shadow">
            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold serif text-black">Your Archive Awaits</h3>
            <p className="text-gray-400 max-w-sm mx-auto mt-4 text-base leading-relaxed italic">Begin your journey of linguistic mastery by assembling your first collection.</p>
            <button 
              onClick={onCreateNew} 
              className="mt-10 px-8 py-3 bg-blue-50 text-blue-600 text-sm font-bold uppercase tracking-widest rounded-full hover:bg-blue-600 hover:text-white transition-all inline-block"
            >
              Start First Entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tables.sort((a,b) => b.createdAt - a.createdAt).map(table => (
              <div
                key={table.id}
                onClick={() => onSelectTable(table)}
                className="group bg-white p-8 border border-gray-100 rounded-xl hover:border-blue-600 transition-all cursor-pointer sat-shadow hover:sat-shadow-lg flex flex-col h-full transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[12px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50/50 px-2 py-1 rounded">Vol. {table.entries.length}</span>
                  <span className="text-xs text-gray-300 font-mono">{new Date(table.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 serif group-hover:text-blue-700 leading-tight transition-colors">{table.title}</h3>
                <p className="text-gray-500 text-base line-clamp-3 mb-8 italic flex-grow serif leading-relaxed">
                  {table.description || 'Formal documentation for this lexical set.'}
                </p>
                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Authored Entry</span>
                  <span className="text-sm text-black font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors flex items-center">
                    Review <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
