import React from 'react';

export type Theme = 'dark' | 'light';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  position?: 'top-right' | 'bottom-right';
}

// Inline Sun/Moon SVGs (lucide paths) instead of importing lucide-react:
// ThemeToggle rides in the entry chunk, so any lucide import would drag the
// whole vendor-icons chunk back into the critical request chain for LCP.
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  position?: 'top-right' | 'bottom-right';
}

/** Floating theme switch. Top-right on desktop by default; docks
    bottom-right (e.g. during flashcard sessions) when asked. On mobile it
    sits bottom-left above the nav, opposite the Lexy button
    (bottom-20 right-4). */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, position = 'top-right' }) => {
  const toLight = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      aria-label={toLight ? 'Switch to light theme' : 'Switch to dark theme'}
      title={toLight ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`fixed z-[400] w-10 h-10 rounded-full bg-surface/80 backdrop-blur-md border border-white/10 text-muted hover:text-text hover:border-primary/40 flex items-center justify-center shadow-lg shadow-black/10 transition-all print:hidden ${
        position === 'bottom-right'
          ? 'bottom-20 left-4 md:bottom-4 md:left-auto md:right-4'
          : 'bottom-20 left-4 md:bottom-auto md:top-4 md:left-auto md:right-4'
      }`}
    >
      {toLight ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
