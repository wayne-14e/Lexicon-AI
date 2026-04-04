import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { VocabTable, VocabEntry, GameMode } from '../types';
import { geminiService } from '../services/geminiService';

interface TableViewProps {
  table: VocabTable;
  onBack: () => void;
  onDelete: (id: string) => void;
  onStudy: (excludeMastered: boolean) => void;
  onLearnContext: () => void;
  onMatchingGame: (mode: GameMode) => void;
  onUpdateTable: (updatedTable: VocabTable) => void;
  isFetching: boolean;
}

const MasteryCircle: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-white/5"
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
          className="text-primary transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-base sm:text-lg font-bold font-display text-text">{percentage}%</span>
      </div>
    </div>
  );
};

type SortKey = 'word' | 'progress' | 'partOfSpeech' | null;
type SortDirection = 'asc' | 'desc';

const TableView: React.FC<TableViewProps> = ({ table, onBack, onDelete, onStudy, onLearnContext, onMatchingGame, onUpdateTable, isFetching }) => {
  const [isDeletingTable, setIsDeletingTable] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metaTitle, setMetaTitle] = useState(table.title);
  const [metaDescription, setMetaDescription] = useState(table.description);
  const [metaLinks, setMetaLinks] = useState(table.links?.join('\n') || '');
  
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [excludeMastered, setExcludeMastered] = useState(false);
  const [matchingMode, setMatchingMode] = useState<GameMode>('synonyms');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCurating, setIsCurating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMetaTitle(table.title);
    setMetaDescription(table.description);
    setMetaLinks(table.links?.join('\n') || '');
  }, [table.title, table.description, table.links]);

  const handleSaveMetadata = () => {
    onUpdateTable({
      ...table,
      title: metaTitle.trim() || 'Untitled Collection',
      description: metaDescription,
      links: metaLinks.split('\n').filter(l => l.trim().length > 0)
    });
    setIsEditingMetadata(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedEntries = [...table.entries].sort((a, b) => {
    if (!sortKey) return 0;
    
    let aValue = a[sortKey];
    let bValue = b[sortKey];
    
    if (sortKey === 'progress') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    } else {
      aValue = (aValue || '').toString().toLowerCase();
      bValue = (bValue || '').toString().toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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

  const handleCopy = (id: string, word: string) => {
    navigator.clipboard.writeText(word);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const deleteSelected = () => {
    const updatedEntries = table.entries.filter(e => !selectedIds.has(e.id));
    onUpdateTable({ ...table, entries: updatedEntries });
    setSelectedIds(new Set());
    setIsCurating(false);
  };

  const handleExport = async () => {
    const reportDate = new Date().toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Logo SVG code - embedded directly to work in downloaded files
    const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
<rect x="0.25" y="0.25" width="31.5" height="31.5" rx="8" fill="#0C0E11" stroke="white" stroke-width="0.5" stroke-opacity="0.25"/>
<path d="M11.5272 23.5V9.5H15.4872V20.08H21.5872V23.5H11.5272Z" fill="white" stroke="white" stroke-width="0.2" stroke-opacity="0.5"/>
<path d="M22.1226 5.60418C22.502 4.91063 23.498 4.91064 23.8774 5.60418L24.6272 6.97526C24.719 7.14305 24.8569 7.28101 25.0247 7.37278L26.3958 8.12265C27.0894 8.50196 27.0894 9.49804 26.3958 9.87736L25.0247 10.6272C24.8569 10.719 24.719 10.8569 24.6272 11.0247L23.8774 12.3958C23.498 13.0894 22.502 13.0894 22.1226 12.3958L21.3728 11.0247C21.281 10.8569 21.1431 10.719 20.9753 10.6272L19.6042 9.87735C18.9106 9.49804 18.9106 8.50196 19.6042 8.12264L20.9753 7.37278C21.1431 7.28101 21.281 7.14305 21.3728 6.97526L22.1226 5.60418Z" fill="#429ADA"/>
</svg>`;

    const tableRows = table.entries.map((entry, index) => `
      <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <td class="px-4 py-4 text-sm text-gray-400 font-mono text-center">${index + 1}</td>
        <td class="px-4 py-4 text-lg font-bold font-display text-gray-900">${entry.word}</td>
        <td class="px-4 py-4 text-center">
          <span class="text-[10px] font-bold uppercase border border-gray-200 px-2 py-0.5 rounded text-gray-500 italic bg-gray-50">
            ${entry.partOfSpeech}
          </span>
        </td>
        <td class="px-4 py-4 text-sm leading-relaxed text-gray-700">${entry.meaning}</td>
        <td class="px-4 py-4 text-sm text-gray-500 italic">${entry.synonyms}</td>
        <td class="px-4 py-4 text-sm text-gray-600 italic font-display leading-relaxed">"${entry.sentence}"</td>
      </tr>
    `).join('');

    const tableDescription = table.description ? `<p class="text-lg italic font-display text-gray-600 mb-10 leading-relaxed max-w-4xl border-l-4 border-blue-100 pl-6">"${table.description}"</p>` : '';

    // Fetch the HTML template
    try {
      const response = await fetch('/templates/export-template.html');
      if (!response.ok) {
        throw new Error('Failed to fetch export template');
      }
      
      let htmlContent = await response.text();
      
      // Replace placeholders with actual content
      htmlContent = htmlContent
        .replace(/{{TABLE_TITLE}}/g, table.title)
        .replace(/{{REPORT_DATE}}/g, reportDate)
        .replace(/{{LOGO_SVG}}/g, logoSvg)
        .replace(/{{TABLE_DESCRIPTION}}/g, tableDescription)
        .replace(/{{TABLE_ROWS}}/g, tableRows);

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${table.title.replace(/\s+/g, '_')}_Linguistic_Record.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export using template, falling back to inline HTML:', error);
      
      // Fallback to the original inline HTML generation
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${table.title} - Lexicon AI Export</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                    display: ['Outfit', 'sans-serif'],
                  }
                }
              }
            }
          </script>
          <style>
            body { background-color: #f4f4f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .sat-shadow { box-shadow: 4px 4px 0px rgba(0,0,0,0.05); }
            .sat-border { border: 1px solid rgba(0,0,0,0.08); }
            @media print { 
              body { background-color: white; padding: 0; }
              .no-print { display: none; }
              .print-shadow-none { box-shadow: none !important; }
              .print-border-none { border: none !important; }
              .print-p-0 { padding: 0 !important; }
              .print-bg-white { background-color: white !important; }
            }
          </style>
        </head>
        <body class="font-sans text-gray-900 antialiased p-4 md:p-8">
          <div class="max-w-[95vw] mx-auto">
            
            <!-- Header / Logo -->
            <a href="#" class="flex flex-col items-center justify-center mb-12 text-center no-print group hover:opacity-80 transition-opacity">
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-14 h-14 flex items-center justify-center shrink-0 drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]">
                  ${logoSvg}
                </div>
                <div class="text-left">
                  <h1 class="text-2xl font-bold font-display tracking-tight leading-none text-gray-900">Lexicon</h1>
                  <p class="text-[11px] uppercase tracking-[0.2em] font-bold text-blue-600 mt-1">AI Journal</p>
                </div>
              </div>
            </a>

            <!-- Main Content Card -->
            <div class="bg-white p-6 md:p-10 border border-blue-100 rounded-xl shadow-xl shadow-blue-900/5 print:shadow-none print:border-none print:p-0 print:bg-white">
              
              <div class="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-8">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 mb-2 block">Academic Lexical Record</span>
                  <h1 class="text-4xl md:text-5xl font-bold font-display text-black tracking-tight">${table.title}</h1>
                </div>
                <div class="text-right">
                  <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date Generated</div>
                  <div class="font-display font-semibold text-lg text-gray-900">${reportDate}</div>
                </div>
              </div>

              ${tableDescription}

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-blue-50/50 border-y border-blue-100 print:bg-white">
                      <th class="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 text-center w-12">No.</th>
                      <th class="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 w-48">Lexeme</th>
                      <th class="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 text-center w-24">Class</th>
                      <th class="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-blue-600">Definition</th>
                      <th class="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 w-48">Equivalents</th>
                      <th class="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 w-64">Usage</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    ${tableRows}
                  </tbody>
                </table>
              </div>
            </div>
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
    }
  };

  const startEditing = (entry: VocabEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.word);
  };

  const saveEdit = async (id: string) => {
    const originalEntry = table.entries.find(e => e.id === id);
    const isLettersOnlyWord = (value: string) => /^[A-Za-z]+$/.test(value);

    const normalizedOriginalWord = originalEntry?.word.trim().toLowerCase() || '';
    const requestedWord = editValue.trim();
    const normalizedRequestedWord = requestedWord.toLowerCase();

    if (!originalEntry || !normalizedRequestedWord || normalizedRequestedWord === normalizedOriginalWord) {
      setEditingId(null);
      return;
    }

    // Accept only words made of A-Z letters. If the user types anything else,
    // do not refill / update the row.
    if (!isLettersOnlyWord(requestedWord)) {
      setEditingId(null);
      return;
    }

    setEditingId(null);
    const nextUpdating = new Set(updatingIds);
    nextUpdating.add(id);
    setUpdatingIds(nextUpdating);

    try {
      // Re-trigger AI for the new word to refill the whole row
      const results = await geminiService.generateVocabEntries([requestedWord]);
      if (results.length > 0) {
        const aiData = results[0];
        const candidateWord = (aiData.word || requestedWord).trim();
        const nextWord = isLettersOnlyWord(candidateWord) ? candidateWord : requestedWord;
        const shouldResetProgress = nextWord.toLowerCase() !== normalizedOriginalWord;
        const updatedEntries = table.entries.map(e => 
          e.id === id 
            ? { 
                ...e, 
                word: nextWord,
                partOfSpeech: aiData.partOfSpeech || 'N/A',
                meaning: aiData.meaning || 'N/A',
                synonyms: aiData.synonyms || 'N/A',
                antonyms: aiData.antonyms || 'N/A',
                sentence: aiData.sentence || '',
                progress: shouldResetProgress ? 0 : e.progress
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
    <div className="max-w-7xl mx-auto w-full pb-32">
      <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col gap-6 md:gap-8 pt-4 pb-2 md:pt-0 md:pb-0 print:hidden">
        <div className="space-y-6">
          <button 
            onClick={onBack}
            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-muted hover:text-text mb-1 flex items-center transition-colors group"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Return to Repository
          </button>
          
          <div className="space-y-8">
            {/* Row 1: Title Only */}
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-text leading-tight break-words">{table.title}</h2>

            {/* Row 2: Progress and Details */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-8 w-full overflow-hidden">
              <div className="flex items-start space-x-4 sm:space-x-8 min-w-0 w-full md:w-auto">
                {/* Block 1: Circular Progress */}
                <div className="shrink-0">
                  <MasteryCircle percentage={tableMastery} />
                </div>

                {/* Block 2: Description, Links, Mastery Level */}
                <div className="space-y-4 md:space-y-5 min-w-0 flex-1">
                  <p className="text-muted italic text-xs sm:text-base font-sans leading-relaxed max-w-2xl break-words line-clamp-2 sm:line-clamp-none">
                    {table.description || 'Academic vocabulary collection.'}
                  </p>
                  
                  {table.links && table.links.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {table.links.map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.startsWith('http') ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors bg-primary/5 px-3 py-1 rounded-full border border-primary/10"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Reference {table.links.length > 1 ? idx + 1 : ''}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="inline-block whitespace-nowrap text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-primary/20">
                      Mastery: {tableMastery >= 70 ? 'Proficient' : tableMastery >= 40 ? 'Developing' : 'Introductory'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Buttons Block - Opposite the description/details */}
              <div className="flex flex-wrap md:flex-col gap-2 self-start shrink-0">
                <button 
                  onClick={() => setIsEditingMetadata(true)}
                  className="px-4 py-2.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center border bg-surfaceHighlight text-muted border-white/10 hover:border-primary/50 hover:text-primary group/edit"
                >
                  <svg className="w-3 h-3 mr-2 group-hover/edit:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Collection
                </button>

                <button 
                  onClick={() => {
                    setIsCurating(!isCurating);
                    setSelectedIds(new Set());
                  }}
                  className={`px-4 py-2.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center border group/curate ${isCurating ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceHighlight text-muted border-white/10 hover:border-primary/50 hover:text-primary'}`}
                >
                  <svg className="w-3 h-3 mr-2 group-hover/curate:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isCurating ? 'Exit Curation' : 'Curate Entries'}
                </button>

                {isCurating && selectedIds.size > 0 && (
                  <div className="px-3 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-muted italic">
                    {selectedIds.size} items selected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          {/* Context Narrative Card */}
          <div 
            onClick={isFetching ? undefined : onLearnContext}
            className={`group bg-surface p-5 md:p-6 lg:p-8 rounded-2xl border border-white/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all flex flex-col items-start text-left relative overflow-hidden ${
              isFetching ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            {/* ... content ... */}
            <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 md:w-24 md:h-24 text-primary transform rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary transition-colors z-10">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            
            <h3 className="text-lg md:text-xl font-bold font-display text-text mb-1 md:mb-2 group-hover:text-primary transition-colors z-10">
              {isFetching ? 'Generating Narrative...' : 'Context Narrative'}
            </h3>
            <p className="text-muted text-xs md:text-sm leading-relaxed max-w-sm z-10">
              {isFetching ? 
                'Creating your personalized context passage. This may take a moment...' :
                'Immerse yourself in a generated story weaving your vocabulary into a cohesive narrative for deeper contextual retention.'
              }
            </p>
            
            <div className="mt-4 md:mt-6 flex items-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-primary z-10">
              {isFetching ? (
                <>
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Generating</span>
                </>
              ) : (
                <>
                  <span>Begin Reading</span>
                  <svg className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </div>
          </div>

          {/* Flashcard Assessment Card */}
          <div className="group bg-surface p-5 md:p-6 lg:p-8 rounded-2xl border border-white/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all flex flex-col items-start text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 md:w-24 md:h-24 text-primary transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            <div className="w-full flex justify-between items-start z-10 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              
              <label 
                className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none bg-surfaceHighlight px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={excludeMastered}
                    onChange={(e) => setExcludeMastered(e.target.checked)}
                  />
                  <div className="w-6 sm:w-7 h-3 sm:h-4 bg-white/10 rounded-full peer-checked:bg-primary transition-all"></div>
                  <div className="absolute left-0.5 sm:left-1 top-0.5 sm:top-1 w-2 h-2 bg-white rounded-full transition-all peer-checked:translate-x-3 shadow-sm"></div>
                </div>
                <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-muted group-hover:text-text transition-colors">Exclude Mastered</span>
              </label>
            </div>
            
            <h3 className="text-lg md:text-xl font-bold font-display text-text mb-1 md:mb-2 group-hover:text-primary transition-colors z-10">Flashcard Assessment</h3>
            <p className="text-muted text-xs md:text-sm leading-relaxed max-w-sm z-10 mb-4 md:mb-6">
              Test your active recall with spaced repetition cards. Track your progress and master each lexeme individually.
            </p>
            
            <button 
              onClick={() => onStudy(excludeMastered)}
              className="mt-auto w-full py-2.5 md:py-3 bg-primary text-white rounded-lg font-bold uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-secondary transition-colors shadow-lg shadow-primary/20 z-10 flex items-center justify-center"
            >
              <span>Start Session</span>
              <svg className="w-3 h-3 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Matching Game Card */}
          <div 
            onClick={() => onMatchingGame(matchingMode)}
            className="group bg-surface p-5 md:p-6 lg:p-8 rounded-2xl border border-white/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer flex flex-col items-start text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 md:w-24 md:h-24 text-primary transform -rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            
            <div className="w-full flex justify-between items-start z-10 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>

              <div 
                className="flex bg-surfaceHighlight p-1 rounded-full border border-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setMatchingMode('synonyms')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-widest transition-all ${matchingMode === 'synonyms' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'}`}
                >
                  Syn
                </button>
                <button
                  onClick={() => setMatchingMode('antonyms')}
                  className={`px-2 sm:px-3 py-1 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-widest transition-all ${matchingMode === 'antonyms' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'}`}
                >
                  Ant
                </button>
              </div>
            </div>
            
            <h3 className="text-lg md:text-xl font-bold font-display text-text mb-1 md:mb-2 group-hover:text-primary transition-colors z-10">Matching Game</h3>
            <p className="text-muted text-xs md:text-sm leading-relaxed max-w-sm z-10">
              Connect words with their synonyms or antonyms in this timed matching challenge. Test your semantic agility.
            </p>
            
            <div className="mt-4 md:mt-6 flex items-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-primary z-10">
              <span>Start Matching</span>
              <svg className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
      </div>

      {/* Responsive Table View */}
      <div className="block bg-surface rounded-2xl border border-white/5 shadow-lg shadow-black/20 overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px] md:min-w-[1100px]">
            <thead>
              <tr className="bg-surfaceHighlight/50 border-b border-white/5 print:bg-white print:border-black">
                <th className="px-2 sm:px-5 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest text-muted print:text-black w-8 sm:w-12 text-center">
                  {isCurating ? (
                    <div 
                      className={`w-3 h-3 sm:w-4 sm:h-4 mx-auto rounded border flex items-center justify-center cursor-pointer transition-colors ${selectedIds.size === sortedEntries.length ? 'bg-primary border-primary' : 'border-white/20 bg-white/5'}`}
                      onClick={() => {
                        if (selectedIds.size === sortedEntries.length) setSelectedIds(new Set());
                        else setSelectedIds(new Set(sortedEntries.map(e => e.id)));
                      }}
                    >
                      {selectedIds.size === sortedEntries.length && (
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ) : 'No.'}
                </th>
                <th 
                  className={`px-2 sm:px-5 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest w-16 sm:w-24 text-center cursor-pointer transition-all group select-none ${sortKey === 'progress' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-white/5 hover:text-text'}`}
                  onClick={() => handleSort('progress')}
                >
                  <div className="flex items-center justify-center space-x-1 sm:space-x-1.5">
                    <span>Mastery</span>
                    <span className={`text-[8px] sm:text-[10px] ${sortKey === 'progress' ? 'opacity-100' : 'opacity-20 group-hover:opacity-50'}`}>
                      {sortKey === 'progress' && sortDirection === 'desc' ? <ChevronDown className="w-2.5 h-2.5 sm:w-3 h-3" /> : <ChevronUp className="w-2.5 h-2.5 sm:w-3 h-3" />}
                    </span>
                  </div>
                </th>
                <th className="px-2 sm:px-5 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest text-muted print:text-black w-12 sm:w-24 text-center">Audio</th>
                <th 
                  className={`px-3 sm:px-6 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest w-24 sm:w-32 cursor-pointer transition-all group select-none ${sortKey === 'word' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-white/5 hover:text-text'}`}
                  onClick={() => handleSort('word')}
                >
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <span>Lexeme</span>
                    <span className={`text-[8px] sm:text-[10px] ${sortKey === 'word' ? 'opacity-100' : 'opacity-20 group-hover:opacity-50'}`}>
                      {sortKey === 'word' && sortDirection === 'desc' ? <ChevronDown className="w-2.5 h-2.5 sm:w-3 h-3" /> : <ChevronUp className="w-2.5 h-2.5 sm:w-3 h-3" />}
                    </span>
                  </div>
                </th>
                <th 
                  className={`px-2 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest w-14 sm:w-20 text-center cursor-pointer transition-all group select-none ${sortKey === 'partOfSpeech' ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-white/5 hover:text-text'}`}
                  onClick={() => handleSort('partOfSpeech')}
                >
                  <div className="flex items-center justify-center space-x-1 sm:space-x-1.5">
                    <span>Class</span>
                    <span className={`text-[8px] sm:text-[10px] ${sortKey === 'partOfSpeech' ? 'opacity-100' : 'opacity-20 group-hover:opacity-50'}`}>
                      {sortKey === 'partOfSpeech' && sortDirection === 'desc' ? <ChevronDown className="w-2.5 h-2.5 sm:w-3 h-3" /> : <ChevronUp className="w-2.5 h-2.5 sm:w-3 h-3" />}
                    </span>
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest text-muted print:text-black min-w-[150px] sm:min-w-[250px]">Definition</th>
                <th className="px-3 sm:px-6 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest text-muted print:text-black w-28 sm:w-40">Synonyms</th>
                <th className="px-3 sm:px-6 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest text-muted print:text-black w-28 sm:w-40">Antonyms</th>
                <th className="px-3 sm:px-6 py-3 sm:py-5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest text-muted print:text-black min-w-[180px] sm:min-w-[300px]">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-black">
              {sortedEntries.map((entry, index) => (
                <tr 
                  key={entry.id} 
                  className={`hover:bg-white/5 transition-all align-top group cursor-pointer ${isCurating && selectedIds.has(entry.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => isCurating && toggleSelection(entry.id)}
                >
                  <td className="px-2 sm:px-5 py-3 sm:py-6 text-[9px] sm:text-xs text-muted/30 font-mono print:text-black text-center">
                    {isCurating ? (
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 mx-auto rounded border flex items-center justify-center transition-colors ${selectedIds.has(entry.id) ? 'bg-primary border-primary' : 'border-white/20 bg-white/5'}`}>
                        {selectedIds.has(entry.id) && (
                          <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ) : index + 1}
                  </td>
                  <td className="px-2 sm:px-5 py-3 sm:py-6 text-center">
                    <div className={`text-[7px] sm:text-[10px] font-bold ${ (entry.progress || 0) >= 70 ? 'text-primary' : 'text-muted' }`}>
                      {entry.progress || 0}%
                    </div>
                  </td>
                  <td className="px-2 sm:px-5 py-3 sm:py-6 text-center print:hidden">
                    <button 
                      onClick={() => handleSpeak(entry.id, entry.word)}
                      className={`p-1 sm:p-2 rounded-full transition-all ${speakingId === entry.id ? 'bg-primary text-white animate-pulse' : 'text-muted hover:text-primary hover:bg-primary/10'}`}
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-6 min-w-[100px] sm:min-w-[180px]">
                    {updatingIds.has(entry.id) ? (
                      <div className="flex flex-col space-y-1 sm:space-y-2 py-1 sm:py-2 animate-pulse">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                           <div className="w-1 h-1 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                           <span className="text-[6px] sm:text-[9px] font-bold text-primary uppercase tracking-widest">Synthesis...</span>
                        </div>
                        <div className="h-2 sm:h-4 bg-white/5 rounded w-full"></div>
                      </div>
                    ) : editingId === entry.id ? (
                      <input 
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(entry.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(entry.id)}
                        className="w-full text-xs sm:text-xl font-bold font-display text-text border-b-2 border-primary outline-none bg-transparent py-0.5 sm:py-1"
                      />
                    ) : (
                      <div className="flex items-center group/lexeme-cell">
                        <div 
                          className="text-xs sm:text-xl font-bold font-display text-text leading-tight print:text-black flex items-center transition-colors cursor-pointer hover:text-primary relative"
                          onClick={() => handleCopy(entry.id, entry.word)}
                        >
                          {entry.word}
                          {copiedId === entry.id && (
                            <span className="absolute -top-3 sm:-top-4 left-0 text-[5px] sm:text-[8px] font-bold text-primary uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1">Copied!</span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); startEditing(entry); }}
                          className="ml-1.5 sm:ml-3 p-1 sm:p-1.5 text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 bg-surfaceHighlight rounded-full hover:bg-primary/10"
                          title="Edit Word & Refill AI Data"
                        >
                          <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-1.5 py-3 sm:py-6 text-center">
                    <span className="text-[6px] sm:text-[9px] font-bold uppercase border border-white/10 px-1 sm:px-2 py-0.5 rounded text-muted italic bg-surfaceHighlight print:bg-white print:border-black">
                      {entry.partOfSpeech}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-6 text-[9px] sm:text-sm leading-relaxed text-text/80 print:text-black font-medium">
                    {entry.meaning}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-6 text-[9px] sm:text-sm text-muted italic print:text-black">{entry.synonyms}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-6 text-[9px] sm:text-sm text-muted italic print:text-black">{entry.antonyms || 'N/A'}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-6 text-[9px] sm:text-sm text-muted italic font-sans print:text-black leading-relaxed">
                    "{entry.sentence}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      <div className="flex items-center justify-between gap-6 pt-8 pb-12 print:hidden">
        <button 
          onClick={handleExport}
          className="px-3 sm:px-4 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center border bg-surfaceHighlight text-muted border-white/10 hover:border-primary/50 hover:text-primary group/export"
        >
          <svg className="w-3 h-3 mr-2 group-hover/export:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Record
        </button>

        <div className="flex items-center gap-4">
          {isDeletingTable ? (
            <div className="flex items-center space-x-3 animate-in slide-in-from-right-4">
               <button 
                 onClick={() => onDelete(table.id)}
                 className="px-4 py-2 text-[8px] sm:text-[9px] font-bold bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all uppercase tracking-widest"
               >
                 Confirm Total Purge
               </button>
               <button 
                 onClick={() => setIsDeletingTable(false)}
                 className="px-4 py-2 text-[8px] sm:text-[9px] font-bold text-muted hover:text-text uppercase tracking-widest"
               >
                 Cancel
               </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsDeletingTable(true)}
              className="px-3 sm:px-4 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center border bg-surfaceHighlight text-muted border-white/10 hover:border-red-500/50 hover:text-red-400 group/archive"
            >
              <svg className="w-3 h-3 mr-2 group-hover/archive:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Archive Disposal
            </button>
          )}
        </div>
      </div>
      {isEditingMetadata && (
        <div className="fixed !top-0 !left-0 !w-full !h-full !mt-0 !pt-0 bg-[#0b0d11]/95 backdrop-blur-xl z-[10000] flex items-center justify-center overflow-y-auto">
          <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl space-y-6 md:space-y-8 animate-in zoom-in-95 duration-300 m-4 !mt-0">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Metadata Revision</span>
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold font-display text-text">Edit Collection</h3>
                <button 
                  onClick={() => setIsEditingMetadata(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted hover:text-text"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Collection Title</label>
                <input 
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full bg-surfaceHighlight border border-white/5 rounded-xl px-4 py-3 text-text focus:border-primary transition-all outline-none"
                  placeholder="e.g., Advanced Scholarly Lexicon"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Description</label>
                <textarea 
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full bg-surfaceHighlight border border-white/5 rounded-xl px-4 py-3 text-text focus:border-primary transition-all outline-none min-h-[100px] resize-none"
                  placeholder="Describe the context or purpose of this collection..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Reference Links (One per line)</label>
                <textarea 
                  value={metaLinks}
                  onChange={(e) => setMetaLinks(e.target.value)}
                  className="w-full bg-surfaceHighlight border border-white/5 rounded-xl px-4 py-3 text-text focus:border-primary transition-all outline-none min-h-[80px] resize-none font-mono text-xs"
                  placeholder="https://example.com/source-material"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:space-x-4 pt-4">
              <button 
                onClick={() => setIsEditingMetadata(false)}
                className="w-full sm:w-auto px-6 py-3 text-[10px] font-bold text-muted hover:text-text uppercase tracking-widest transition-colors order-2 sm:order-1"
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSaveMetadata}
                className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:bg-secondary transition-all order-1 sm:order-2"
              >
                Commit Revisions
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isCurating && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={deleteSelected}
            className="px-5 py-2.5 bg-red-500 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/30 hover:bg-red-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-red-400/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Selection ({selectedIds.size})
          </button>
        </div>
      )}
    </div>
  </div>
  );
};

export default TableView;