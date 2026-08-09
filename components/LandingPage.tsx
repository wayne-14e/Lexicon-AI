import React, { useState, useEffect } from 'react';
import {
  Sparkles, FileText, Archive, GraduationCap, Bot,
  ChevronRight, Star, Zap, Trophy, Users, ArrowRight, CheckCircle,
  Volume2, Brain, Target, Flame, Gift, Menu, X
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

/* ─── Animated mock UI inside the hero ──────────────────────────────────────── */
const HeroMockUI: React.FC = () => {
  const words = [
    { word: 'Ephemeral', pos: 'adj', progress: 85, color: 'text-primary' },
    { word: 'Perspicacious', pos: 'adj', progress: 60, color: 'text-muted' },
    { word: 'Sycophant', pos: 'noun', progress: 100, color: 'text-primary' },
    { word: 'Mellifluous', pos: 'adj', progress: 40, color: 'text-muted' },
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#191d24]">
      {/* Fake topbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#13161c] border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
        </div>
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Lexicon AI — Vocabulary Journal</span>
        <div className="w-12"></div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-4 px-4 py-2 bg-white/[0.02] border-b border-white/5">
        {['Mastery', 'Lexeme', 'Class', 'Definition'].map(h => (
          <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted">{h}</span>
        ))}
      </div>

      {/* Rows */}
      {words.map((w, i) => (
        <div
          key={w.word}
          className="grid grid-cols-4 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <div className="flex items-center">
            <span className={`text-sm font-bold ${w.color}`}>{w.progress}%</span>
          </div>
          <div>
            <span className="text-sm font-bold font-display text-white">{w.word}</span>
          </div>
          <div>
            <span className="text-[9px] border border-white/10 px-1.5 py-0.5 rounded text-muted italic uppercase tracking-wider">
              {w.pos}
            </span>
          </div>
          <div>
            <div className="w-full bg-white/5 rounded-full h-1 mt-2">
              <div
                className="h-1 rounded-full bg-primary transition-all duration-1000"
                style={{ width: `${w.progress}%` }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Gemini badge */}
      <div className="px-4 py-3 flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 bg-violet-400/10 border border-violet-400/20 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Gemini AI enriched</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          <Volume2 className="w-3 h-3 text-muted" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Native audio</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Inline icons identical to the study view cards ────────────────────────── */
const ContextNarrativeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const GamifiedStudyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

/* ─── Feature card data ─────────────────────────────────────────────────────── */
const features = [
  {
    icon: Sparkles,
    title: 'AI Metadata Generation',
    desc: 'Gemini AI auto-generates definitions, parts of speech, synonyms, antonyms, and memorable example sentences for every word.',
    accent: 'from-blue-500/20 to-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: FileText,
    title: 'Document Word Extractor',
    desc: 'Upload any PDF, TXT, or Word document and let Gemini extract the vocabulary words worth studying — instantly.',
    accent: 'from-violet-500/20 to-violet-400/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: ContextNarrativeIcon,
    title: 'Context Reading Passages',
    desc: 'Generate an AI-crafted story or article that weaves all your vocabulary words into a cohesive, immersive narrative.',
    accent: 'from-amber-400/20 to-amber-400/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: GraduationCap,
    title: 'Standardised Test Archives',
    desc: 'Unlock curated IELTS A1–C2 and SAT (College Panda & Erica Meltzer) vocabulary banks with Scholar Tokens.',
    accent: 'from-blue-500/20 to-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: GamifiedStudyIcon,
    title: 'Gamified Flashcards & Games',
    desc: 'Study with spaced-repetition flashcards, track mastery per word, and challenge yourself with timed synonym/antonym matching games.',
    accent: 'from-amber-400/20 to-amber-400/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: Bot,
    title: 'Lexy AI Assistant',
    desc: 'Your floating vocabulary consultant — ask Lexy for etymology, usage tips, or word relationships at any time.',
    accent: 'from-violet-500/20 to-violet-400/10',
    iconColor: 'text-violet-400',
  },
];

/* ─── Stats row data ────────────────────────────────────────────────────────── */
const stats = [
  { value: '4k+', label: 'Words Mastered' },
  { value: 'IELTS A1–C2', label: '& SAT Archives' },
  { value: '3', label: 'Study Modes' },
  { value: '100%', label: 'Free' },
];

/* ─── Steps data ────────────────────────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    icon: Target,
    title: 'Collect & Extract',
    desc: 'Add words manually, paste a list, or upload a document — Gemini extracts the vocabulary automatically.',
  },
  {
    num: '02',
    icon: Brain,
    title: 'Enrich with Gemini AI',
    desc: 'Each word is instantly enriched with a definition, synonyms, antonyms, and a quirky example sentence.',
  },
  {
    num: '03',
    icon: Trophy,
    title: 'Practice & Master',
    desc: 'Study with flashcards, ace the matching game, read your AI context passage, and track mastery per word.',
  },
];

/* ─── Main component ────────────────────────────────────────────────────────── */
const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignUp }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#13161c] text-white font-sans overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#13161c]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/30' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.svg" alt="Lexicon AI" className="w-full h-full object-contain" />
              </div>
              <div className="leading-none">
                <span className="text-xl font-bold font-display tracking-tight text-white">Lexicon</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.35em] text-primary mt-0.5">AI Journal</span>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-8">
              {[
                { label: 'Features', id: 'features' },
                { label: 'Archives', id: 'archives' },
                { label: 'How It Works', id: 'how-it-works' },
                { label: 'Scholar Tokens', id: 'scholar-tokens' },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-[11px] font-bold uppercase tracking-widest text-muted hover:text-white transition-colors"
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Desktop CTA buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={onSignIn}
                className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest border border-white/20 rounded-full text-muted hover:text-white hover:border-white/40 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={onSignUp}
                className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest bg-primary rounded-full text-white hover:bg-[#5aaee8] transition-all shadow-lg shadow-primary/30"
              >
                Get Started Free
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-muted hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#191d24] border-t border-white/5 px-4 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {[
              { label: 'Features', id: 'features' },
              { label: 'Archives', id: 'archives' },
              { label: 'How It Works', id: 'how-it-works' },
              { label: 'Scholar Tokens', id: 'scholar-tokens' },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left text-sm font-bold uppercase tracking-widest text-muted hover:text-white py-2 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="pt-2 flex flex-col space-y-2 border-t border-white/5">
              <button
                onClick={onSignIn}
                className="w-full py-3 text-[11px] font-bold uppercase tracking-widest border border-white/20 rounded-full text-muted hover:text-white transition-all"
              >
                Sign In
              </button>
              <button
                onClick={onSignUp}
                className="w-full py-3 text-[11px] font-bold uppercase tracking-widest bg-primary rounded-full text-white hover:bg-[#5aaee8] transition-all"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 md:pt-40 pb-20 md:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: copy */}
            <div className="text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left-6 duration-700">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Powered by Google Gemini AI</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.08] tracking-tight">
                  Master Vocabulary
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#5aaee8] to-violet-400">
                    Effortlessly
                  </span>
                  <br />
                  with AI
                </h1>
                <p className="text-base sm:text-lg text-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Build custom word lists, auto-generate rich definitions via Gemini AI, extract vocabulary from PDFs, and study with spaced-repetition flashcards — all in one beautiful journal.
                </p>
              </div>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={onSignUp}
                  className="group w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-4 bg-primary rounded-full text-white font-bold text-sm uppercase tracking-widest hover:bg-[#5aaee8] transition-all shadow-xl shadow-primary/30"
                >
                  <Gift className="w-4 h-4" />
                  <span>Get Started Free</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollTo('archives')}
                  className="w-full sm:w-auto px-7 py-4 border border-white/15 rounded-full text-muted font-bold text-sm uppercase tracking-widest hover:text-white hover:border-white/30 transition-all"
                >
                  Explore Archives
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center lg:justify-start space-x-4 pt-2">
                <div className="flex -space-x-2">
                  {['bg-primary', 'bg-violet-500', 'bg-amber-500'].map((c, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#13161c] flex items-center justify-center`}>
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted font-medium">Join scholars mastering <span className="text-white font-bold">4,000+</span> words</span>
              </div>
            </div>

            {/* Right: mock UI */}
            <div className="animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
              <HeroMockUI />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-white/5 bg-[#191d24]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-bold font-display text-white">{value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">What You Get</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white">
              Everything you need to
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">own any vocabulary list</span>
            </h2>
            <p className="text-muted max-w-xl mx-auto text-base leading-relaxed">
              From raw word to mastered lexeme — Lexicon AI handles every step of the vocabulary learning journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map(({ icon: Icon, title, desc, accent, iconColor }) => (
              <div
                key={title}
                className={`group relative p-6 md:p-8 rounded-2xl bg-gradient-to-br ${accent} border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-lg hover:shadow-black/30 overflow-hidden`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/[0.015]" />
                <div className={`w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-display">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEST ARCHIVES ─────────────────────────────────────────────────────── */}
      <section id="archives" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-[#191d24]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-amber-400">System Archives</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-white leading-tight">
                IELTS & SAT prep,
                <br />built right in.
              </h2>
              <p className="text-muted text-base leading-relaxed">
                Unlock professionally curated vocabulary banks matched to real standardised test objectives — from IELTS A1 beginner to C2 proficiency, and the full SAT College Panda & Erica Meltzer lists.
              </p>
              <ul className="space-y-3">
                {[
                  'IELTS A1 through C2 — 6 proficiency tiers',
                  'SAT College Panda 400 & Erica Vocab',
                  'Full definition & example sentences for every entry',
                  'Unlock with Scholar Tokens — earned free daily',
                ].map(item => (
                  <li key={item} className="flex items-start space-x-3 text-sm text-muted">
                    <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onSignUp}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 font-bold text-sm uppercase tracking-widest hover:bg-amber-500/20 transition-all"
              >
                <Archive className="w-4 h-4" />
                <span>Start Unlocking Archives</span>
              </button>
            </div>

            {/* Archive tier visual */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { tier: 'IELTS A1', label: 'Beginner', cost: '10 tokens', color: 'bg-primary/10 border-primary/30', text_color: "text-primary" },
                { tier: 'IELTS B1', label: 'Intermediate', cost: '50 tokens', color: 'border-amber-500/30 bg-amber-500/5', text_color: "text-amber-400" },
                { tier: 'IELTS C1', label: 'Advanced', cost: '150 tokens', color: 'border-violet-500/30 bg-violet-500/5', text_color: "text-violet-400" },
                { tier: 'SAT Panda', label: '400 Words', cost: '400 tokens', color: 'bg-primary/10 border-primary/30', text_color: "text-primary" },
                { tier: 'IELTS C2', label: 'superior', cost: '300 tokens', color: 'border-amber-500/30 bg-amber-500/5', text_color: "text-amber-400" },
                { tier: 'SAT Erica', label: 'Advanced', cost: '300 tokens', color: 'border-violet-500/30 bg-violet-500/5', text_color: "text-violet-400" },
              ].map(({ tier, label, cost, color, text_color }) => (
                <div key={tier} className={`p-4 rounded-xl border ${color} flex flex-col space-y-1`}>
                  <span className="text-sm font-bold text-white font-display">{tier}</span>
                  <span className="text-[10px] text-muted uppercase tracking-wider">{label}</span>
                  <span className={`text-[10px] font-bold ${text_color} mt-1`}>{cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">Simple workflow</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              From list to mastery
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">in 3 steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />

            {steps.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="relative flex flex-col items-center text-center space-y-5 group">
                <div className="relative z-10 w-20 h-20 rounded-full bg-[#191d24] border-2 border-primary/30 flex items-center justify-center shadow-xl shadow-primary/10 group-hover:border-primary/70 group-hover:shadow-primary/25 transition-all duration-300">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-widest">{num}</div>
                  <h3 className="text-lg font-bold font-display text-white">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCHOLAR ECONOMY ──────────────────────────────────────────────────── */}
      <section id="scholar-tokens" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-[#191d24]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Token cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Flame, label: 'Daily Login Streak', value: '+10 tokens / day', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
                { icon: Trophy, label: 'Flash Card Mastery', value: '+5 per word', color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20' },
                { icon: Gift, label: 'Referral Bonus', value: '+500 tokens', color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20' },
                { icon: Zap, label: 'Spend on Archives', value: 'Unlock test banks', color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className={`p-5 rounded-2xl border ${bg} flex flex-col space-y-3`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                  <div>
                    <div className={`text-sm font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-violet-400">Scholar Token Economy</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-white leading-tight">
                Learning pays.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-primary">Literally.</span>
              </h2>
              <p className="text-muted text-base leading-relaxed">
                Earn Scholar Tokens every day just by logging in. Rack up bonus tokens through daily streaks, flashcard sessions, and referral bonuses — then spend them to unlock premium test preparation archives.
              </p>
              <div className="flex items-start space-x-3 bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                <Gift className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-violet-400">Sign up via referral link</div>
                  <div className="text-xs text-muted mt-0.5">You receive 500 bonus Scholar Tokens, while your friend receives 700 — enough to unlock two major test archives immediately.</div>
                </div>
              </div>
              <button
                onClick={onSignUp}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-400 font-bold text-sm uppercase tracking-widest hover:bg-violet-500/20 transition-all"
              >
                <Users className="w-4 h-4" />
                <span>Start Earning Free Tokens</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────────── */}
      <section className="py-8 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-[#191d24] to-violet-500/10 p-5 md:p-16 text-center shadow-2xl shadow-primary/10">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary mb-4 block">Ready to begin?</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-4 leading-tight">
              Your vocabulary
              <br />
              journal awaits.
            </h2>
            <p className="text-muted text-base leading-relaxed mb-10 max-w-lg mx-auto">
              Free forever. No credit card required. Start building your first collection in under 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onSignUp}
                className="group w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-primary rounded-full text-white font-bold text-sm uppercase tracking-widest hover:bg-[#5aaee8] transition-all shadow-xl shadow-primary/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onSignIn}
                className="w-full sm:w-auto px-8 py-4 border border-white/15 rounded-full text-muted font-bold text-sm uppercase tracking-widest hover:text-white hover:border-white/30 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="Lexicon AI" className="w-9 h-9 object-contain" />
              <div className="leading-none">
                <span className="text-base font-bold font-display text-white">Lexicon</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.3em] text-primary mt-0.5">AI Journal</span>
              </div>
            </div>

            {/* Quick links */}
            <nav className="flex items-center space-x-6">
              {[
                { label: 'Features', id: 'features' },
                { label: 'Archives', id: 'archives' },
                { label: 'How It Works', id: 'how-it-works' },
                { label: 'Scholar Tokens', id: 'scholar-tokens' },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-white transition-colors"
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Copyright */}
            <span className="text-[10px] text-muted font-medium">
              © {new Date().getFullYear()} Lexicon AI. Built for scholars.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
