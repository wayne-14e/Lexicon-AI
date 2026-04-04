import React from 'react';
import { User } from '../types';
import NotesArea from './NotesArea';

interface ScratchpadPageProps {
  user: User;
}

const ScratchpadPage: React.FC<ScratchpadPageProps> = ({ user }) => {
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <span className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.4em] text-primary mb-3 block">Academic Workspace</span>
        <h2 className="text-3xl md:text-[42px] lg:text-5xl font-bold font-display text-text leading-tight">Scratchpad</h2>
        <p className="text-muted mt-3 max-w-lg leading-relaxed font-sans italic text-sm">
          "The first draft of anything is shit." — Ernest Hemingway. Start here.
        </p>
      </div>

      <div className="w-full">
        <NotesArea userId={user.id} />
      </div>
    </div>
  );
};

export default ScratchpadPage;
