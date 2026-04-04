
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';

interface NotesAreaProps {
  userId: string;
}

const NotesArea: React.FC<NotesAreaProps> = ({ userId }) => {
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const skipAutoSaveRef = useRef(false);
  const latestNotesRef = useRef(notes);
  const hydratedRef = useRef(false);

  // Initial Load
  useEffect(() => {
    const loadNotes = async () => {
      const savedNotes = await storageService.getNotes(userId);
      setNotes(savedNotes);
      setHydrated(true);
    };
    loadNotes();
  }, [userId]);

  useEffect(() => {
    latestNotesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  // Final safety save on unmount (covers quick navigation before debounce fires)
  useEffect(() => {
    return () => {
      if (!hydratedRef.current) return;
      if (skipAutoSaveRef.current) return;
      storageService
        .saveNotes(userId, latestNotesRef.current)
        .catch((e) => console.error('Final auto-save failed', e));
    };
  }, [userId]);

  // Auto-save logic
  useEffect(() => {
    if (!hydrated) return;
    if (skipAutoSaveRef.current) return;

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
  }, [notes, userId, hydrated]);

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
    skipAutoSaveRef.current = true;
    setNotes('');
    setIsSaving(true);
    try {
      await storageService.saveNotes(userId, '');
    } catch (e) {
      console.error("Manual clear failed", e);
    } finally {
      setIsSaving(false);
      skipAutoSaveRef.current = false;
    }
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold font-display text-text">Academic Scratchpad</h3>
          <p className="text-[10px] text-muted font-bold uppercase tracking-[0.25em] mt-1">
            SECURE CLOUD-SYNCED DRAFTING AREA
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            disabled={!notes.trim()}
            className={`
              flex items-center space-x-2 px-4 py-1.5 rounded-lg border font-bold uppercase tracking-[0.1em] text-[10px] transition-all duration-300 shadow-none
              ${copied 
                ? 'bg-primary/10 text-primary border-primary/30' 
                : 'bg-surfaceHighlight text-muted border-white/10 hover:bg-white/5 hover:text-text hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed'}
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
            className="p-1.5 text-red-400 border border-white/10 bg-surfaceHighlight rounded-lg hover:bg-red-500/10 hover:text-red-300 hover:border-red-400/50 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-none"
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
          className="w-full min-h-[300px] lg:min-h-[600px] p-6 bg-surfaceHighlight border border-white/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none font-sans text-lg leading-relaxed text-text placeholder:text-muted/50 resize-y transition-all"
          placeholder="Jot down new words, phonetic notes, or context clues here..."
        />
        <div className="absolute bottom-4 right-4 text-[9px] font-mono text-muted uppercase select-none flex items-center space-x-2 bg-surface/80 px-2 py-1 rounded-sm backdrop-blur-sm border border-white/5">
          {isSaving ? (
            <>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
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
