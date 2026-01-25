import React, { useState } from 'react';
import { VocabTable, VocabEntry } from '../types';
import { geminiService } from '../services/geminiService';

interface TableViewProps {
  table: VocabTable;
  onBack: () => void;
  onDelete: (id: string) => void;
  onStudy: () => void;
  onLearnContext: () => void;
  onUpdateTable: (updatedTable: VocabTable) => void;
}

const MasteryCircle: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-gray-100"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="text-blue-600 transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-lg font-bold serif text-black">{percentage}%</span>
      </div>
    </div>
  );
};

const TableView: React.FC<TableViewProps> = ({ table, onBack, onDelete, onStudy, onLearnContext, onUpdateTable }) => {
  const [isDeletingTable, setIsDeletingTable] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [isCurateMode, setIsCurateMode] = useState(false);

  const calculateMastery = () => {
    if (table.entries.length === 0) return 0;
    const total = table.entries.reduce((acc, e) => acc + (e.progress || 0), 0);
    return Math.round(total / table.entries.length);
  };

  const handleSpeak = async (id: string, word: string) => {
    if (speakingId) return;
    setSpeakingId(id);
    await geminiService.textToSpeech(word);
    setSpeakingId(null);
  };

  const handleExport = () => {
    const reportDate = new Date().toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const tableRows = table.entries.map((entry, index) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee; font-family: monospace; color: #999; text-align: center;">${index + 1}</td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; font-family: 'Crimson Pro', serif; font-weight: bold; font-size: 1.2rem;">${entry.word}</td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center;"><span style="font-size: 0.7rem; font-weight: bold; text-transform: uppercase; border: 1px solid #eee; padding: 2px 6px; border-radius: 3px; color: #888; font-style: italic;">${entry.partOfSpeech}</span></td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; font-family: 'Inter', sans-serif; font-size: 0.95rem; line-height: 1.6; color: #333;">${entry.meaning}</td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; font-style: italic; color: #666; font-size: 0.9rem;">${entry.synonyms}</td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; font-family: 'Crimson Pro', serif; font-style: italic; color: #777; font-size: 1rem; line-height: 1.5;">"${entry.sentence}"</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${table.title} - Lexicon AI Export</title>
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; background: #fff; color: #1a1a1a; }
          .header { border-bottom: 2px solid #000; padding-bottom: 30px; margin-bottom: 40px; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
          .label { font-size: 0.6rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3em; color: #999; margin-bottom: 8px; display: block; }
          h1 { font-family: 'Crimson Pro', serif; font-size: 3rem; margin: 0; font-weight: 700; line-height: 1.1; }
          .report-date-container { text-align: right; }
          .report-date { font-family: 'Crimson Pro', serif; font-size: 1.1rem; font-weight: 600; color: #1a1a1a; }
          .description { font-family: 'Crimson Pro', serif; font-style: italic; font-size: 1.2rem; color: #555; margin-top: 20px; max-width: 800px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 12px 15px; border-bottom: 2px solid #eee; font-size: 0.65rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; color: #aaa; }
          .footer { margin-top: 60px; padding-top: 30px; border-top: 1px solid #eee; text-align: center; }
          .app-link { color: #2563eb; text-decoration: none; font-weight: bold; font-size: 0.75rem; letter-spacing: 0.05em; }
          @media print { body { padding: 0; } .footer { position: fixed; bottom: 0; width: 100%; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-top">
            <div>
              <span class="label">Academic Lexical Record</span>
              <h1>${table.title}</h1>
            </div>
            <div class="report-date-container">
              <span class="label">Report Generation Date</span>
              <div class="report-date">${reportDate}</div>
            </div>
          </div>
          <div class="description">${table.description || 'Collection of scholarly vocabulary.'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No.</th>
              <th style="width: 150px;">Lexeme</th>
              <th style="width: 80px; text-align: center;">Class</th>
              <th>Definition</th>
              <th style="width: 150px;">Equivalents</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <span class="label">Generated via</span>
          <a href="https://lexicon-ai-beta.vercel.app/" class="app-link">LEXICON AI JOURNAL — https://lexicon-ai-beta.vercel.app/</a>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.title.replace(/\s+/g, '_')}_Linguistic_Record.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === table.entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(table.entries.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    const updatedEntries = table.entries.filter(e => !selectedIds.has(e.id));
    onUpdateTable({ ...table, entries: updatedEntries });
    setSelectedIds(new Set());
    setIsCurateMode(false);
  };

  const startEditing = (entry: VocabEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.word);
  };

  const saveEdit = async (id: string) => {
    const originalEntry = table.entries.find(e => e.id === id);
    if (!originalEntry || editValue.trim() === originalEntry.word || !editValue.trim()) {
      setEditingId(null);
      return;
    }

    setEditingId(null);
    const nextUpdating = new Set(updatingIds);
    nextUpdating.add(id);
    setUpdatingIds(nextUpdating);

    try {
      // Re-trigger AI for the new word to refill the whole row
      const results = await geminiService.generateVocabEntries([editValue.trim()]);
      if (results.length > 0) {
        const aiData = results[0];
        const updatedEntries = table.entries.map(e => 
          e.id === id 
            ? { 
                ...e, 
                word: aiData.word || editValue.trim(),
                partOfSpeech: aiData.partOfSpeech || 'N/A',
                meaning: aiData.meaning || 'N/A',
                synonyms: aiData.synonyms || 'N/A',
                sentence: aiData.sentence || ''
              } 
            : e
        );
        onUpdateTable({ ...table, entries: updatedEntries });
      }
    } catch (err) {
      console.error("Linguistic synthesis failed:", err);
    } finally {
      const finalUpdating = new Set(updatingIds);
      finalUpdating.delete(id);
      setUpdatingIds(finalUpdating);
    }
  };

  const tableMastery = calculateMastery();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      <div className="flex flex-col gap-8 print:hidden">
        <div className="space-y-3">
          <button 
            onClick={onBack}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black mb-2 flex items-center transition-colors group"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Return to Repository
          </button>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start space-x-6">
              <MasteryCircle percentage={tableMastery} />
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-bold serif text-black leading-tight">{table.title}</h2>
                <p className="text-gray-500 italic text-lg serif leading-relaxed max-w-xl">{table.description || 'Academic vocabulary collection.'}</p>
                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    Mastery Level: {tableMastery >= 70 ? 'Proficient' : tableMastery >= 40 ? 'Developing' : 'Introductory'}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setIsCurateMode(!isCurateMode);
                if (isCurateMode) setSelectedIds(new Set());
              }}
              className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center border self-end md:self-start ${isCurateMode ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
            >
              {isCurateMode ? (
                <>
                  <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Finish Curating
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Curate Entries
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex flex-row flex-wrap items-center justify-start gap-4">
          <button 
            onClick={onLearnContext}
            className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-blue-600 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Context Narrative
          </button>
          <button 
            onClick={onStudy}
            className="px-8 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg hover:-translate-y-0.5 group"
          >
            <svg className="w-4 h-4 mr-2.5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Flashcard Assessment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 sat-shadow-lg overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 print:bg-white print:border-black">
                {isCurateMode && (
                  <th className="px-5 py-5 w-16 text-center animate-in slide-in-from-left-4 duration-500">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === table.entries.length && table.entries.length > 0} 
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-700 accent-blue-700 focus:ring-blue-700 cursor-pointer"
                    />
                  </th>
                )}
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
                <tr 
                  key={entry.id} 
                  className={`${selectedIds.has(entry.id) ? 'bg-blue-50/70' : 'hover:bg-blue-50/20'} transition-all align-top group`}
                >
                  {isCurateMode && (
                    <td className="px-5 py-6 text-center animate-in slide-in-from-left-4 duration-500">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(entry.id)} 
                        onChange={() => toggleSelect(entry.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-700 accent-blue-700 focus:ring-blue-700 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-5 py-6 text-xs text-gray-300 font-mono print:text-black text-center">{index + 1}</td>
                  <td className="px-5 py-6 text-center">
                    <div className={`text-[10px] font-bold ${ (entry.progress || 0) >= 70 ? 'text-blue-700' : 'text-gray-400' }`}>
                      {entry.progress || 0}%
                    </div>
                  </td>
                  <td className="px-5 py-6 text-center print:hidden">
                    <button 
                      onClick={() => handleSpeak(entry.id, entry.word)}
                      className={`p-2 rounded-full transition-all ${speakingId === entry.id ? 'bg-blue-700 text-white animate-pulse' : 'text-gray-300 hover:text-blue-700 hover:bg-blue-50'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-6 py-6 min-w-[180px]">
                    {updatingIds.has(entry.id) ? (
                      <div className="flex flex-col space-y-2 py-2 animate-pulse">
                        <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                           <span className="text-[9px] font-bold text-blue-700 uppercase tracking-widest">Synthesis...</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                      </div>
                    ) : editingId === entry.id ? (
                      <input 
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(entry.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(entry.id)}
                        className="w-full text-2xl font-bold serif text-black border-b-2 border-blue-700 outline-none bg-transparent py-1"
                      />
                    ) : (
                      <div className="flex items-center group/lexeme-cell">
                        <div 
                          className={`text-2xl font-bold serif text-black leading-tight print:text-black flex items-center transition-colors ${isCurateMode ? 'cursor-default' : 'cursor-pointer hover:text-blue-700'}`}
                          onClick={() => !isCurateMode && startEditing(entry)}
                        >
                          {entry.word}
                        </div>
                        {!isCurateMode && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEditing(entry); }}
                            className="ml-3 p-1.5 text-gray-300 hover:text-blue-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 bg-gray-50 rounded-full hover:bg-blue-50"
                            title="Edit Word & Refill AI Data"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-6 text-center">
                    <span className="text-[9px] font-bold uppercase border border-gray-100 px-2 py-0.5 rounded text-gray-400 italic bg-white print:bg-white print:border-black">
                      {entry.partOfSpeech}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm leading-relaxed text-gray-700 print:text-black font-medium">
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

      {/* Optimized Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-full shadow-2xl z-50 flex items-center space-x-8 animate-in slide-in-from-bottom-8 duration-500 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center">
            <span className="text-xl font-bold serif italic tracking-wide">
              {selectedIds.size} Lexeme{selectedIds.size !== 1 ? 's' : ''} Selected
            </span>
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <button 
            onClick={handleDeleteSelected}
            className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center group/purge"
          >
            <svg className="w-4 h-4 mr-2 group-hover/purge:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Purge Selection
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-6 pt-6 print:hidden">
        <button 
          onClick={handleExport}
          className="px-10 py-4 bg-black text-white font-bold rounded hover:bg-blue-700 transition-all flex items-center shadow-lg uppercase tracking-widest text-[10px] hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Academic Record
        </button>

        <div className="flex items-center gap-4">
          {isDeletingTable ? (
            <div className="flex items-center space-x-4 animate-in slide-in-from-right-4">
               <button 
                 onClick={() => onDelete(table.id)}
                 className="px-6 py-3 text-[10px] font-bold bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all uppercase tracking-widest"
               >
                 Confirm Total Purge
               </button>
               <button 
                 onClick={() => setIsDeletingTable(false)}
                 className="px-6 py-3 text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
               >
                 Cancel
               </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsDeletingTable(true)}
              className="px-5 py-3 text-[10px] font-bold text-gray-300 hover:text-red-500 transition-all uppercase tracking-widest flex items-center group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Archive Disposal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableView;
