
import React, { useState } from 'react';
import { VocabTable, User } from '../types';
import { geminiService } from '../services/geminiService';

interface TableCreatorProps {
  user: User;
  existingTable?: VocabTable;
  onSave: (table: VocabTable) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const TableCreator: React.FC<TableCreatorProps> = ({ user, existingTable, onSave, onCancel, isSaving = false }) => {
  const [title, setTitle] = useState(existingTable?.title || '');
  const [description, setDescription] = useState(existingTable?.description || '');
  const [wordsInput, setWordsInput] = useState('');
  const [links, setLinks] = useState<string>(existingTable?.links.join('\n') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');

  const validateEnglishWords = (words: string[]): boolean => {
    const englishWordRegex = /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/;
    return words.every(word => englishWordRegex.test(word));
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      setStatus('Error: Collection title is required.');
      return;
    }
    
    if (!wordsInput.trim()) {
      setStatus('Error: Please enter at least one word.');
      return;
    }

    const wordList = wordsInput.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
    
    if (!validateEnglishWords(wordList)) {
      setStatus('Error: All words must be in English. Please remove non-English characters.');
      return;
    }

    setIsGenerating(true);
    setStatus('AI is analyzing linguistic roots and contexts...');
    
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
          antonyms: e.antonyms || 'N/A',
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
        <h2 className="text-3xl md:text-[42px] lg:text-5xl font-bold font-display text-text">{existingTable ? 'Edit Collection' : 'Compose New Journal'}</h2>
        <button onClick={onCancel} className="text-sm font-bold uppercase tracking-widest text-muted hover:text-text transition-colors">Cancel</button>
      </div>

      <div className="space-y-8 bg-surface p-4 sm:p-8 border border-white/5 rounded-2xl shadow-lg shadow-black/20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          <div className="flex flex-col space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2">SUBJECT / TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 bg-surfaceHighlight border border-white/10 rounded-xl focus:border-primary focus:bg-surfaceHighlight outline-none transition-all text-base font-display text-text placeholder-muted/50"
                placeholder="e.g., SAT Reading Unit 4"
                required
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2">ANNOTATION / DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full flex-1 p-4 bg-surfaceHighlight border border-white/10 rounded-xl focus:border-primary focus:bg-surfaceHighlight outline-none transition-all resize-none italic leading-relaxed text-sm text-text/80 min-h-[160px] placeholder-muted/50"
                placeholder="Context or notes about this list..."
              />
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">LEXICAL INPUT (ONE PER LINE)</label>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {wordsInput.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0).length} Words
                </span>
              </div>
              <textarea
                value={wordsInput}
                onChange={(e) => setWordsInput(e.target.value)}
                className="w-full flex-1 p-4 bg-surfaceHighlight border border-white/10 rounded-xl min-h-[312px] focus:border-primary focus:bg-surfaceHighlight outline-none transition-all resize-none font-mono text-sm leading-relaxed text-text placeholder-muted/50"
                placeholder="ubiquitous&#10;ephemeral&#10;sanguine"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2">EXTERNAL REFERENCES (LINKS)</label>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            className="w-full p-4 bg-surfaceHighlight border border-white/10 rounded-xl h-24 focus:border-primary focus:bg-surfaceHighlight outline-none transition-all resize-none text-sm text-primary font-mono placeholder-muted/50"
            placeholder="https://merriam-webster.com/..."
          />
        </div>

        <div className="pt-8 flex flex-col items-center space-y-4 border-t border-white/5">
          {isGenerating || isSaving ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium italic text-muted animate-pulse">
                {isGenerating ? status : 'Saving collection...'}
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={handleGenerate}
                disabled={!title.trim() || !wordsInput.trim() || isGenerating || isSaving}
                className="w-full md:w-auto px-20 py-5 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/20 hover:bg-secondary transition-all disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-[11px] hover:-translate-y-0.5"
              >
                Assemble with Lexicon AI
              </button>
              {status && status.startsWith('Error') && (
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{status}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableCreator;
