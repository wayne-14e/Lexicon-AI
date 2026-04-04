import React, { useState } from 'react';
import { VocabTable } from '../types';
import { geminiService } from '../services/geminiService';

interface PublicViewProps {
  table: VocabTable;
}

const PublicView: React.FC<PublicViewProps> = ({ table }) => {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleSpeak = async (id: string, word: string) => {
    if (speakingId) return;
    setSpeakingId(id);
    await geminiService.textToSpeech(word);
    setSpeakingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 bg-background min-h-screen print:py-0 print:bg-white">
      <div className="flex justify-end mb-8 print:hidden">
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-primary text-white font-bold rounded-full flex items-center shadow-lg shadow-primary/20 hover:bg-secondary transition-all active:scale-95 uppercase tracking-widest text-[10px]"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Export as Official PDF
        </button>
      </div>

      <div className="border-b-2 border-text pb-8 mb-10 print:border-black">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2 block print:text-black">Lexicon AI Academic Record</span>
            <h1 className="text-5xl font-bold font-display text-text leading-tight print:text-black">{table.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted print:text-black">Document Date</div>
            <div className="font-display text-lg text-text print:text-black">{new Date(table.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        
        {table.description && (
          <p className="mt-6 text-muted italic font-sans text-xl leading-relaxed max-w-3xl print:text-black">
            "{table.description}"
          </p>
        )}

        {table.links && table.links.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-8 print:hidden">
            {table.links.map((link, idx) => (
              <a 
                key={idx}
                href={link.startsWith('http') ? link : `https://${link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors bg-primary/5 px-4 py-2 rounded-full border border-primary/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Reference {table.links.length > 1 ? idx + 1 : ''}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface border border-white/5 rounded-lg overflow-hidden shadow-sm mb-12 print:border-black print:shadow-none overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-surfaceHighlight border-b-2 border-white/5 print:bg-white print:border-black">
              <th className="px-3 py-4 text-[9px] font-bold uppercase tracking-widest text-muted w-10 print:text-black">No.</th>
              <th className="px-3 py-4 text-[9px] font-bold uppercase tracking-widest text-muted w-16 text-center print:text-black">Audio</th>
              <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-muted print:text-black w-32">Lexeme</th>
              <th className="px-2 py-4 text-[9px] font-bold uppercase tracking-widest text-muted print:text-black w-16 text-center">P.O.S.</th>
              <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-muted print:text-black">Definition</th>
              <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-muted print:text-black w-40">Synonyms</th>
              <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-muted print:text-black">Sentence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 print:divide-black">
            {table.entries.map((entry, index) => (
              <tr key={entry.id} className="align-top">
                <td className="px-3 py-6 text-sm text-muted font-mono print:text-black">{index + 1}</td>
                <td className="px-3 py-6 text-center print:hidden">
                   <button 
                      onClick={() => handleSpeak(entry.id, entry.word)}
                      className={`p-1.5 rounded-full transition-all ${speakingId === entry.id ? 'bg-primary text-white animate-pulse' : 'text-muted hover:text-text hover:bg-white/5'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                </td>
                <td className="px-4 py-6">
                  <div className="text-xl font-bold font-display text-text print:text-black">{entry.word}</div>
                </td>
                <td className="px-2 py-6 text-center">
                  <span className="text-[9px] font-bold uppercase border border-white/10 px-1.5 py-0.5 rounded text-muted italic bg-surfaceHighlight print:bg-white print:border-black print:text-black">
                    {entry.partOfSpeech}
                  </span>
                </td>
                <td className="px-4 py-6 text-base leading-relaxed text-text/80 max-w-sm print:text-black">
                  {entry.meaning}
                </td>
                <td className="px-4 py-6 text-sm text-muted italic print:text-black">
                  {entry.synonyms}
                </td>
                <td className="px-4 py-6 text-sm text-muted italic font-sans print:text-black leading-relaxed">
                  "{entry.sentence}"
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-20 pt-10 border-t border-gray-100 hidden print:block">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Student Signature</div>
            <div className="border-b border-black w-64 h-8"></div>
          </div>
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Instructor Review</div>
            <div className="border-b border-black w-64 h-8"></div>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center text-[10px] font-bold uppercase tracking-widest text-gray-300 print:hidden">
        End of Document &bull; Lexicon AI System
      </div>
    </div>
  );
};

export default PublicView;