import React, { useState, useEffect } from 'react';
import { Flame, X, Zap } from 'lucide-react';

interface DailyStreakPopupProps {
  streak: number;
  tokensAwarded: number;
  onClose: () => void;
}

const DailyStreakPopup: React.FC<DailyStreakPopupProps> = ({ streak, tokensAwarded, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
      setTimeout(() => setShowContent(true), 200);
    });
  }, []);

  const handleClose = () => {
    setShowContent(false);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* Popup Card */}
      <div
        className={`relative w-[340px] max-w-[90vw] transition-all duration-500 ease-out ${
          showContent ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-8 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect behind card */}
        <div className="absolute -inset-4 bg-amber-500/20 rounded-[2rem] blur-2xl animate-pulse" />

        <div className="relative bg-surface rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Top decorative gradient */}
          <div className="h-1.5 bg-amber-500" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-text transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="px-8 pt-8 pb-6 flex flex-col items-center text-center">
            {/* Flame icon with ring animation */}
            <div className="relative mb-5">
              <div className="absolute inset-0 scale-[2] bg-amber-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 scale-150 bg-amber-500/5 rounded-full" />
              <div className="relative w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Flame className="w-10 h-10 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
              </div>
            </div>

            {/* Streak count */}
            <div className="mb-1">
              <span className="text-6xl font-black font-display text-amber-500 leading-none">
                {streak}
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-500/80 mb-5">
              {streak === 1 ? 'Day Streak Started' : 'Day Streak'}
            </p>

            {/* Motivational message */}
            <p className="text-sm text-muted mb-5 leading-relaxed max-w-[260px]">
              {streak === 1
                ? "Welcome back! Your learning journey continues."
                : streak < 5
                ? "Great consistency! Keep showing up every day."
                : streak < 15
                ? "You're on fire! Your dedication is paying off."
                : "Legendary streak! You're an unstoppable learner."}
            </p>

            {/* Token reward badge */}
            <div className="flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-5 py-2.5 mb-6">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                +{tokensAwarded} Scholar Tokens
              </span>
            </div>

            {/* Continue button */}
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-amber-500 text-amber-950 text-xs font-bold uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98]"
            >
              Continue Learning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyStreakPopup;
