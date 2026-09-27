import React from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'dark' | 'light';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  position?: 'top-right' | 'bottom-right';
}

/** Floating theme switch. Top-right by default; docks bottom-right
    (e.g. during flashcard sessions) when asked. */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, position = 'top-right' }) => {
  const toLight = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      aria-label={toLight ? 'Switch to light theme' : 'Switch to dark theme'}
      title={toLight ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`fixed z-[400] w-10 h-10 rounded-full bg-surface/80 backdrop-blur-md border border-white/10 text-muted hover:text-text hover:border-primary/40 flex items-center justify-center shadow-lg shadow-black/10 transition-all print:hidden ${
        position === 'bottom-right' ? 'bottom-4 right-4' : 'top-4 right-4'
      }`}
    >
      {toLight ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
