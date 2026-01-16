
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';

interface NotesAreaProps {
  userId: string;
}

const NotesArea: React.FC<NotesAreaProps> = ({ userId }) => {
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isFirstRun = useRef(true);

  // Initial Load
  useEffect(() => {
    const loadNotes = async () => {
      const savedNotes = await storageService.getNotes(userId);
      setNotes(savedNotes);
      isFirstRun.current = true; // Reset for the specific user session
    };
    loadNotes();
  }, [userId]);

  // Auto-save logic
  useEffect(() => {
    // Skip the first run to avoid overwriting state with initial empty value
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await storageService.saveNotes(userId, notes);
      } catch (e) {
        console.error("Auto-save failed", e);
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [notes, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleCopy = () => {
    if (!notes.trim()) return;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = async () => {
    // Direct clear to avoid blocked popups/confirm dialogs
    setNotes('');
    setIsSaving(true);
    try {
      await storageService.saveNotes(userId, '');
    } catch (e) {
      console.error("Manual clear failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white sat-border rounded-lg p-6 sat-shadow animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold serif text-black">Academic Scratchpad</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] mt-1">
            SECURE CLOUD-SYNCED DRAFTING AREA
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            disabled={!notes.trim()}
            className={`
              flex items-center space-x-2 px-4 py-1.5 rounded border font-bold uppercase tracking-[0.1em] text-[10px] transition-all duration-300 shadow-none
              ${copied 
                ? 'bg-blue-50 text-blue-600 border-blue-300' 
                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100 hover:text-black hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed'}
            `}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>COPIED</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>COPY TEXT</span>
              </>
            )}
          </button>
          <button
            onClick={handleClear}
            disabled={!notes}
            className="p-1.5 text-red-400 border border-gray-300 bg-gray-50 rounded hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-none"
            title="Clear Scratchpad"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="relative">
        <textarea
          value={notes}
          onChange={handleChange}
          className="w-full min-h-[180px] p-6 bg-[#fafafa] border border-gray-100 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-gray-300 outline-none serif text-lg leading-relaxed text-gray-800 placeholder:text-gray-300 resize-y transition-all"
          placeholder="Jot down new words, phonetic notes, or context clues here..."
        />
        <div className="absolute bottom-4 right-4 text-[9px] font-mono text-gray-400 uppercase select-none flex items-center space-x-2 bg-white/80 px-2 py-1 rounded-sm backdrop-blur-sm">
          {isSaving ? (
            <>
              <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
              <span>SYNCING...</span>
            </>
          ) : (
            <span>ALL CHANGES SAVED</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesArea;
