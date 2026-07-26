import React from 'react';
import { Library, GraduationCap } from 'lucide-react';

interface JournalsPageProps {
  onNavigateToCollections: () => void;
  onNavigateToArchives: () => void;
}

const JournalsPage: React.FC<JournalsPageProps> = ({ onNavigateToCollections, onNavigateToArchives }) => {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10 md:space-y-14 pb-10 md:pb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col items-center text-center">
        <span className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.4em] text-primary mb-2 md:mb-3 block">Knowledge Archive</span>
        <h2 className="text-3xl md:text-[42px] lg:text-5xl font-bold font-display text-text leading-tight">Your Journals</h2>
        <p className="text-muted mt-2 md:mt-3 max-w-lg leading-relaxed font-sans italic text-xs sm:text-sm">"A writer is a world trapped in a person." — Explore your collections and curated archives.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-2xl mx-auto w-full">
        <button
          onClick={onNavigateToCollections}
          className="group relative bg-surface border border-white/5 rounded-2xl p-8 sm:p-10 text-center hover:border-primary/30 hover:bg-surfaceHighlight/50 transition-all shadow-lg shadow-black/20 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/50 group-hover:bg-primary transition-colors" />
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all">
            <Library className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-display text-text mb-2">My Collections</h3>
          <p className="text-sm text-muted font-sans leading-relaxed">
            Your personal vocabulary collections built from scratch or AI-generated.
          </p>
        </button>

        <button
          onClick={onNavigateToArchives}
          className="group relative bg-surface border border-white/5 rounded-2xl p-8 sm:p-10 text-center hover:border-purple-500/30 hover:bg-surfaceHighlight/50 transition-all shadow-lg shadow-black/20 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500/50 group-hover:bg-purple-500 transition-colors" />
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-display text-text mb-2">System Archives</h3>
          <p className="text-sm text-muted font-sans leading-relaxed">
            Curated standardized test banks — IELTS, SAT, and more.
          </p>
        </button>
      </div>
    </div>
  );
};

export default JournalsPage;
