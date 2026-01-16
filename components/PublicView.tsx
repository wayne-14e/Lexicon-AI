
import React from 'react';
import { VocabTable } from '../types';

interface PublicViewProps {
  table: VocabTable;
}

const PublicView: React.FC<PublicViewProps> = ({ table }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-6 bg-white min-h-screen print:py-0">
      <div className="flex justify-end mb-8 print:hidden">
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-black text-white font-bold rounded flex items-center shadow-lg hover:bg-gray-800 transition-all active:scale-95"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Export as Official PDF
        </button>
      </div>

      <div className="border-b-2 border-black pb-8 mb-10">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 block print:text-black">Lexicon AI Academic Record</span>
            <h1 className="text-5xl font-bold serif text-black leading-tight">{table.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 print:text-black">Document Date</div>
            <div className="serif text-lg">{new Date(table.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        
        {table.description && (
          <p className="mt-6 text-gray-600 italic serif text-xl leading-relaxed max-w-3xl print:text-black">
            "{table.description}"
          </p>
        )}
      </div>

      <div className="sat-border rounded-lg overflow-hidden shadow-sm mb-12 print:border-black print:shadow-none overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200 print:bg-white print:border-black">
              <th className="px-3 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 w-10 print:text-black">No.</th>
              <th className="px-3 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 w-16 text-center print:text-black">Progress</th>
              <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 print:text-black w-32">Lexeme</th>
              <th className="px-2 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 print:text-black w-16 text-center">P.O.S.</th>
              <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 print:text-black">Definition</th>
              <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 print:text-black w-40">Synonyms</th>
              <th className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 print:text-black">Sentence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 print:divide-black">
            {table.entries.map((entry, index) => (
              <tr key={entry.id} className="align-top">
                <td className="px-3 py-6 text-sm text-gray-400 font-mono print:text-black">{index + 1}</td>
                <td className="px-3 py-6 text-center">
                  <span className={`text-[10px] font-bold ${(entry.progress || 0) >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                    {entry.progress || 0}%
                  </span>
                </td>
                <td className="px-4 py-6">
                  <div className="text-xl font-bold serif text-black">{entry.word}</div>
                </td>
                <td className="px-2 py-6 text-center">
                  <span className="text-[9px] font-bold uppercase border border-gray-200 px-1.5 py-0.5 rounded text-gray-400 italic bg-gray-50 print:bg-white print:border-black print:text-black">
                    {entry.partOfSpeech}
                  </span>
                </td>
                <td className="px-4 py-6 text-base leading-relaxed text-gray-800 max-w-sm print:text-black">
                  {entry.meaning}
                </td>
                <td className="px-4 py-6 text-sm text-gray-500 italic print:text-black">
                  {entry.synonyms}
                </td>
                <td className="px-4 py-6 text-sm text-gray-400 italic serif print:text-black leading-relaxed">
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
