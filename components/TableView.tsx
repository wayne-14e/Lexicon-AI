import React, { useState } from 'react';
import { VocabTable } from '../types';
import { geminiService } from '../services/geminiService';

interface TableViewProps {
  table: VocabTable;
  onBack: () => void;
  onDelete: (id: string) => void;
  onStudy: () => void;
  onLearnContext: () => void;
}

const TableView: React.FC<TableViewProps> = ({ table, onBack, onDelete, onStudy, onLearnContext }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleSpeak = async (id: string, word: string) => {
    if (speakingId) return;
    setSpeakingId(id);
    await geminiService.textToSpeech(word);
    setSpeakingId(null);
  };

  const handleDownloadPortableHtml = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${table.title} - Academic Journal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; padding: 40px; }
    .serif { font-family: 'Crimson Pro', serif; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="max-w-6xl mx-auto">
    <div class="no-print mb-12 flex justify-between items-center border-b pb-6">
      <a href="${window.location.origin}" class="flex items-center space-x-3 group decoration-none no-underline">
        <div class="w-8 h-8 bg-black flex items-center justify-center text-white text-lg font-bold rounded">L</div>
        <div class="flex flex-col">
          <span class="text-sm font-bold text-black serif leading-none">Lexicon AI</span>
          <span class="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Visit Platform</span>
        </div>
      </a>
      <button onclick="window.print()" class="bg-black text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-lg hover:bg-blue-600 transition-colors">Export to PDF</button>
    </div>
    
    <div class="border-b-4 border-black pb-8 mb-12 flex justify-between items-end">
      <div>
        <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Academic Journal Portfolio</div>
        <h1 class="text-5xl font-bold serif">${table.title}</h1>
      </div>
      <div class="text-right text-sm">
        <div class="text-gray-400 uppercase text-[10px] font-bold tracking-widest mb-1">Authenticated Date</div>
        <div class="serif text-xl">${new Date(table.createdAt).toLocaleDateString()}</div>
      </div>
    </div>

    ${table.description ? `<p class="text-2xl italic serif text-gray-700 mb-12 leading-relaxed border-l-2 border-gray-100 pl-8">"${table.description}"</p>` : ''}

    <table class="w-full text-left border-collapse border-t-2 border-black">
      <thead>
        <tr class="bg-gray-50 border-b border-gray-200">
          <th class="px-3 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 w-12">No.</th>
          <th class="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 w-32">Lexeme</th>
          <th class="px-2 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 w-20 text-center">Class</th>
          <th class="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 min-w-[300px]">Semantic Definition</th>
          <th class="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 w-40">Equivalents</th>
          <th class="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 min-w-[300px]">Contextual Usage</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        ${table.entries.map((e, i) => `
          <tr class="align-top">
            <td class="px-3 py-6 text-xs text-gray-300 font-mono">${i + 1}</td>
            <td class="px-4 py-6 text-2xl font-bold serif text-black leading-tight">${e.word}</td>
            <td class="px-2 py-6 text-center"><span class="text-[9px] border px-2 py-0.5 rounded italic text-gray-500 uppercase font-bold">${e.partOfSpeech}</span></td>
            <td class="px-4 py-6 text-base text-gray-700 leading-relaxed">${e.meaning}</td>
            <td class="px-4 py-6 text-sm italic text-gray-500">${e.synonyms}</td>
            <td class="px-4 py-6 text-sm italic text-gray-400 serif leading-relaxed">"${e.sentence}"</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center">
      <div class="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300">
        Lexicon AI Scholarly System &bull; End of Document
      </div>
      <div class="flex items-center space-x-2 grayscale opacity-40">
        <div class="w-6 h-6 bg-black flex items-center justify-center text-white text-[10px] font-bold rounded">L</div>
        <span class="text-[10px] font-bold tracking-tighter">LEXICON</span>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.title.replace(/\s+/g, '_')}_Journal.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-16">
      <div className="flex flex-col gap-8 print:hidden">
        <div className="space-y-3">
          <button 
            onClick={onBack}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black mb-2 flex items-center transition-colors group"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Return to Repository
          </button>
          <h2 className="text-3xl sm:text-4xl font-bold serif text-black leading-tight">{table.title}</h2>
          <p className="text-gray-500 italic text-lg serif leading-relaxed max-w-3xl">{table.description || 'Academic vocabulary collection.'}</p>
        </div>
        
        <div className="flex flex-row flex-wrap items-center justify-start gap-5">
          <button 
            onClick={onLearnContext}
            className="px-6 py-3 text-xs font-bold uppercase tracking-widest border border-blue-600 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Context Narrative
          </button>
          <button 
            onClick={onStudy}
            className="px-8 py-3 text-xs font-bold uppercase tracking-widest bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Flashcard Assessment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 sat-shadow-lg overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 print:bg-white print:border-black">
                <th className="px-5 py-5 text-[9px] font-bold uppercase tracking-widest text-gray-400 print:text-black w-12 text-center">No.</th>
                <th className="px-5 py-5 text-[9px] font-bold uppercase tracking-widest text-gray-400 print:text-black w-24 text-center">Mastery</th>
                <th className="px-5 py-5 text-[9px] font-bold uppercase tracking-widest text-gray-400 print:text-black w-24 text-center">Audio</th>
                <th className="px-6 py-5 text-[9px] font-bold uppercase tracking-widest text-gray-400 print:text-black w-32">Lexeme</th>
                <th className="px-2 py-5 text-[9px] font-bold uppercase tracking-widest text-gray-400 print:text-black w-20 text-center">Class</th>
                <th className="px-6 py-5 text-[9px] font-bold uppercase tracking-widest text-gray-400 print:text-black min-w-[250px]">Definition</th>
                <th className="px-6 py-5 text-[9px] font-bold uppercase tracking-widest text-gray-400 print:text-black w-40">Equivalents</th>
                <th className="px-6 py-5 text-[9px] font-bold uppercase tracking-widest text-gray-400 print:text-black min-w-[300px]">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 print:divide-black">
              {table.entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-blue-50/20 transition-colors align-top">
                  <td className="px-5 py-6 text-xs text-gray-300 font-mono print:text-black text-center">{index + 1}</td>
                  <td className="px-5 py-6 text-center">
                    <div className={`text-[10px] font-bold ${ (entry.progress || 0) >= 70 ? 'text-blue-600' : 'text-gray-400' }`}>
                      {entry.progress || 0}%
                    </div>
                  </td>
                  <td className="px-5 py-6 text-center print:hidden">
                    <button 
                      onClick={() => handleSpeak(entry.id, entry.word)}
                      className={`p-2 rounded-full transition-all ${speakingId === entry.id ? 'bg-blue-600 text-white animate-pulse' : 'text-gray-300 hover:text-blue-600 hover:bg-blue-50'}`}
                      title="Play Pronunciation"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-6 py-6 text-2xl font-bold serif text-black leading-tight print:text-black">{entry.word}</td>
                  <td className="px-2 py-6 text-center">
                    <span className="text-[9px] font-bold uppercase border border-gray-100 px-2 py-0.5 rounded text-gray-400 italic bg-white print:bg-white print:border-black">
                      {entry.partOfSpeech}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm leading-relaxed text-gray-700 print:text-black">
                    {entry.meaning}
                  </td>
                  <td className="px-6 py-6 text-sm text-gray-500 italic print:text-black">{entry.synonyms}</td>
                  <td className="px-6 py-6 text-sm text-gray-400 italic serif print:text-black leading-relaxed">
                    "{entry.sentence}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 pt-6 print:hidden">
        <button 
          onClick={handleDownloadPortableHtml}
          className="px-10 py-4 bg-black text-white font-bold rounded hover:bg-blue-600 transition-all flex items-center shadow-lg uppercase tracking-widest text-[10px] hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Authenticated Academic Export
        </button>

        <div className="flex items-center gap-4">
          {isDeleting ? (
            <div className="flex items-center space-x-3 animate-in slide-in-from-right-2">
               <button 
                 onClick={() => onDelete(table.id)}
                 className="px-6 py-3 text-[10px] font-bold bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all uppercase tracking-widest"
               >
                 Confirm Purge
               </button>
               <button 
                 onClick={() => setIsDeleting(false)}
                 className="px-6 py-3 text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
               >
                 Cancel
               </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsDeleting(true)}
              className="px-5 py-3 text-[10px] font-bold text-gray-300 hover:text-red-500 transition-all uppercase tracking-widest flex items-center group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Purge Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableView;
