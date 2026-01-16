
import React, { useState } from 'react';
import { VocabTable, User } from '../types';
import { geminiService } from '../services/geminiService';

interface TableCreatorProps {
  user: User;
  existingTable?: VocabTable;
  onSave: (table: VocabTable) => void;
  onCancel: () => void;
}

const TableCreator: React.FC<TableCreatorProps> = ({ user, existingTable, onSave, onCancel }) => {
  const [title, setTitle] = useState(existingTable?.title || '');
  const [description, setDescription] = useState(existingTable?.description || '');
  const [wordsInput, setWordsInput] = useState('');
  const [links, setLinks] = useState<string>(existingTable?.links.join('\n') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!wordsInput.trim()) {
      setStatus('Error: Please enter at least one word.');
      return;
    }

    setIsGenerating(true);
    setStatus('AI is analyzing linguistic roots and contexts...');

    const wordList = wordsInput.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
    
    try {
      const generatedEntries = await geminiService.generateVocabEntries(wordList);
      
      const table: VocabTable = {
        id: existingTable?.id || crypto.randomUUID(),
        userId: user.id,
        title: title || 'Untitled Vocabulary Collection',
        description,
        links: links.split('\n').filter(l => l.trim().length > 0),
        entries: generatedEntries.map((e) => ({
          id: crypto.randomUUID(),
          word: e.word || '',
          partOfSpeech: e.partOfSpeech || 'N/A',
          meaning: e.meaning || 'No definition found.',
          synonyms: e.synonyms || 'N/A',
          sentence: e.sentence || '',
          progress: 0
        })),
        createdAt: existingTable?.createdAt || Date.now()
      };

      onSave(table);
    } catch (error) {
      console.error(error);
      setStatus('System Error: Failed to connect to AI engine.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex items-center justify-between px-2 sm:px-0">
        <h2 className="text-3xl font-bold serif">{existingTable ? 'Edit Collection' : 'Compose New Journal'}</h2>
        <button onClick={onCancel} className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Cancel</button>
      </div>

      <div className="space-y-8 bg-white p-6 sm:p-10 sat-border rounded-lg sat-shadow w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          <div className="flex flex-col space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">SUBJECT / TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded focus:border-black focus:bg-white outline-none transition-all text-lg serif"
                placeholder="e.g., SAT Reading Unit 4"
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">ANNOTATION / DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full flex-1 p-4 bg-gray-50 border border-gray-200 rounded focus:border-black focus:bg-white outline-none transition-all resize-none italic leading-relaxed text-gray-700 min-h-[160px]"
                placeholder="Context or notes about this list..."
              />
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">LEXICAL INPUT (ONE PER LINE)</label>
              <textarea
                value={wordsInput}
                onChange={(e) => setWordsInput(e.target.value)}
                className="w-full flex-1 p-4 bg-gray-50 border border-gray-200 rounded min-h-[312px] focus:border-black focus:bg-white outline-none transition-all resize-none font-mono text-base leading-relaxed"
                placeholder="ubiquitous&#10;ephemeral&#10;sanguine"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">EXTERNAL REFERENCES (LINKS)</label>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded h-24 focus:border-black focus:bg-white outline-none transition-all resize-none text-sm text-blue-600 font-mono"
            placeholder="https://merriam-webster.com/..."
          />
        </div>

        <div className="pt-8 flex flex-col items-center space-y-4 border-t border-gray-50">
          {isGenerating ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium italic text-gray-500 animate-pulse">{status}</p>
            </div>
          ) : (
            <>
              <button
                onClick={handleGenerate}
                disabled={!wordsInput.trim()}
                className="w-full md:w-auto px-20 py-5 bg-black text-white font-bold rounded shadow-lg hover:bg-gray-800 transition-all disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-[11px]"
              >
                Assemble with Lexicon AI
              </button>
              {status && status.startsWith('Error') && (
                <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{status}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableCreator;
