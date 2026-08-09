import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, VocabTable, VocabEntry } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  User as UserIcon,
  LogOut,
  Home,
  PenTool,
  Library,
  MessageSquare,
  X,
  EllipsisVertical,
  Menu,
  Share2,
  Gift,
  Copy,
  Check
} from 'lucide-react';
import LexyAssistant from './LexyAssistant';
import { loadUnlockedArchiveEntries } from '../services/systemArchiveData';

interface LayoutProps {
  user: User | null;
  tables: VocabTable[];
  currentView: string;
  onLogout: () => void;
  onNavigateToTable: (table: VocabTable) => void;
  onNavigateToProfile: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToCreate: () => void;
  onNavigateToHome: () => void;
  onNavigateToArchives: () => void;
  onNavigateToJournals: () => void;
  onSpendTokens: (amount: number, reason?: string) => Promise<boolean>;
  onUserUpdate: (partial: Partial<User>) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  user,
  tables,
  currentView,
  onLogout,
  onNavigateToTable,
  onNavigateToProfile,
  onNavigateToDashboard,
  onNavigateToCreate,
  onNavigateToHome,
  onNavigateToArchives,
  onNavigateToJournals,
  onSpendTokens,
  onUserUpdate,
  children
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [archiveEntries, setArchiveEntries] = useState<{ tableId: string; title: string; entries: VocabEntry[] }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  const referralLink = user?.referral_code 
    ? `${window.location.origin}/?ref=${user.referral_code}`
    : '';

  const copyReferralLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(referralLink);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !mobilePanelRef.current?.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadArchives = async () => {
      if (user?.unlocked_system_collections && user.unlocked_system_collections.length > 0) {
        const entries = await loadUnlockedArchiveEntries(user.unlocked_system_collections);
        setArchiveEntries(entries);
      } else {
        setArchiveEntries([]);
      }
    };
    loadArchives();
  }, [user?.unlocked_system_collections]);

  const results = useMemo(() => {
    if (searchQuery.trim().length <= 1) return [];

    const query = searchQuery.toLowerCase();
    const userResults = tables.flatMap(table =>
      table.entries
        .filter(entry => entry.word.toLowerCase().includes(query))
        .map(entry => ({ table, entry }))
    );

    const existingTableIds = new Set(tables.map(t => t.id));
    const archiveResults = archiveEntries
      .filter(archive => !existingTableIds.has(archive.tableId))
      .flatMap(archive =>
        archive.entries
          .filter(entry => entry.word.toLowerCase().includes(query))
          .map(entry => ({
            table: { id: archive.tableId, title: archive.title, description: '', userId: 'system', entries: archive.entries, createdAt: 0, links: [] } as VocabTable,
            entry
          }))
      );

    return [...userResults, ...archiveResults].slice(0, 5);
  }, [searchQuery, tables, archiveEntries]);

  const handleSelectResult = (table: VocabTable) => {
    onNavigateToTable(table);
    setSearchQuery('');
    setShowResults(false);
  };

  const currentPath = currentView;

  return (
    <div className="h-screen flex bg-background text-text selection:bg-primary selection:text-white overflow-hidden">
      {/* Sidebar - Desktop */}
      {user && (
        <aside
          className={`h-full glass-panel z-40 transition-all duration-300 hidden md:flex flex-col border-r border-white/5 shrink-0 ${isSidebarExpanded ? 'w-56' : 'w-16'}`}
        >
          {/* Top: Logo */}
          <div className={`p-4 flex items-center ${isSidebarExpanded ? 'justify-start' : 'justify-center'}`}>
            <div
              className="flex items-center cursor-pointer group"
              onClick={() => onNavigateToHome()}
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                <img src="/logo.svg" className="object-contain w-full h-full" alt="Logo" />
              </div>
              <div className={`flex flex-col justify-center ml-3 transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden ml-0'}`}>
                <h1 className="text-lg font-bold tracking-tight text-text leading-none font-display">Lexicon</h1>
                <span className="text-muted font-medium text-[8px] uppercase tracking-[0.2em] mt-1 leading-none">AI Journal</span>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Referral Button */}
          <div className="px-2 mb-1">
            <button
              onClick={() => setShowReferralModal(true)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300 ${!isSidebarExpanded && 'justify-center px-0'}`}
              title={!isSidebarExpanded ? "Invite & Earn" : ""}
            >
              <div className="shrink-0"><Gift className="w-5 h-5" /></div>
              <span className={`text-sm font-medium transition-all ${!isSidebarExpanded ? 'hidden w-0 opacity-0' : 'opacity-100'}`}>
                Bonus
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full ${!isSidebarExpanded ? 'hidden' : ''}`}>
                +500 Tokens
              </span>
            </button>
          </div>

          {/* Feedback Button */}
          <div className="px-2 mb-1">
            <a
              href="https://airtable.com/appeRliTRVwrZCBtz/pagkCEum9R8RCY3ey/form"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300 ${!isSidebarExpanded && 'justify-center px-0'}`}
              title={!isSidebarExpanded ? "Provide Feedback" : ""}
            >
              <div className="shrink-0"><MessageSquare className="w-5 h-5" /></div>
              <span className={`text-sm font-medium transition-all ${!isSidebarExpanded ? 'hidden w-0 opacity-0' : 'opacity-100'}`}>
                Feedback
              </span>
            </a>
          </div>

          {/* Bottom: Profile & Toggle */}
          <div className={`p-3 border-t border-white/5 relative flex ${isSidebarExpanded ? 'flex-row items-center' : 'flex-col items-center gap-2'}`} ref={profileMenuRef}>
            <button
              id="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center p-2 rounded-xl hover:bg-white/5 transition-all group ${isSidebarExpanded ? 'flex-1 min-w-0 space-x-3 mr-2' : 'justify-center w-full'}`}
            >
              <div className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center text-primary text-lg font-bold border border-white/10 group-hover:border-primary/50 shrink-0 overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className={`flex flex-col text-left transition-all duration-300 ${!isSidebarExpanded ? 'hidden w-0 opacity-0' : 'opacity-100'}`}>
                <span className="text-sm font-bold text-text truncate max-w-[100px]">{user.username}</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{user.streak || 1}d</span>
                  <span className="text-[10px] text-purple-500 font-bold">• {user.tokens || 0} T</span>
                </div>
              </div>
            </button>

            <button
              id="sidebar-toggle"
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-text transition-all shrink-0"
              title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            {showProfileMenu && (
              <div className={`absolute bottom-full left-4 mb-2 w-56 bg-surfaceHighlight rounded-xl shadow-2xl shadow-black/50 border border-white/10 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 ${!isSidebarExpanded && 'left-16'}`}>
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <p className="text-sm font-bold text-text">{user.username}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{user.streak || 1} Day Streak</span>
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{user.words_generated || 0}/40 Words</span>
                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">{user.tokens || 0} Tokens</span>
                  </div>
                </div>
                <button
                  id="profile-link"
                  className="w-full text-left px-4 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-text transition-colors font-medium flex items-center gap-2"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigateToProfile();
                  }}
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </button>
                <div className="h-px bg-white/5 my-1"></div>
                <button
                  id="signout-link"
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium flex items-center gap-2"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Version */}
          <div className="px-3 py-3 border-t border-white/5">
            <div className={`text-[8px] text-muted/50 font-bold uppercase tracking-widest text-center transition-all ${!isSidebarExpanded ? 'opacity-0' : 'opacity-100'}`}>
              Lexicon AI v4.0
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div id="main-scroll-container" className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto no-scrollbar">
        {/* Top Search Bar */}
        {user && (
          <header className="h-auto py-4 md:py-4 flex items-center px-3 sm:px-6 sticky top-0 z-30 print:hidden bg-background/80 backdrop-blur-md border-b border-white/5 w-full transition-all duration-300">
            <div className="flex items-center justify-center w-full relative gap-3">
              <div className="w-full max-w-md relative flex items-center" ref={searchRef}>
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="global-search"
                    type="text"
                    placeholder="Search knowledge..."
                    className="block w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-surfaceHighlight border border-white/5 text-text placeholder-muted focus:bg-surfaceHighlight focus:border-primary/50 focus:ring-0 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                  />
                </div>

                {showResults && searchQuery.trim().length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surfaceHighlight border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest border-b border-white/5 mb-1">Matches</div>
                        {results.map((res, i) => (
                          <button
                            key={`${res.table.id}-${res.entry.id}`}
                            onClick={() => handleSelectResult(res.table)}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 flex flex-col transition-colors group border-l-2 border-transparent hover:border-primary"
                          >
                            <span className="text-sm font-bold text-text group-hover:text-primary transition-colors">{res.entry.word}</span>
                            <span className="text-[10px] text-muted italic">
                              {res.table.userId === 'system' ? `In: ${res.table.title} (Archive)` : `In: ${res.table.title}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-xs text-muted italic">No matches found.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="relative md:hidden" ref={mobileMenuRef}>
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="p-2 rounded-xl bg-surfaceHighlight border border-white/5 text-muted hover:text-text hover:bg-white/5 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

            </div>
          </header>
        )}

      {/* Mobile side menu overlay */}
      {user && showMobileMenu && (
        <div ref={mobilePanelRef} className="fixed top-0 right-0 z-[70] h-screen w-64 bg-background/90 backdrop-blur-3xl border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl shadow-black/50">
            {/* Cross icon at top right */}
            <div className="flex justify-end p-3">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg bg-surfaceHighlight border border-white/5 text-muted hover:text-text hover:bg-white/5 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Logo - left aligned, slightly bigger */}
            <div className="px-4 pb-4 flex items-center justify-start">
              <div className="flex items-center cursor-pointer group" onClick={() => { setShowMobileMenu(false); onNavigateToHome(); }}>
                <div className="w-11 h-11 flex items-center justify-center shrink-0 drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
                  <img src="/logo.svg" className="object-contain w-full h-full" alt="Logo" />
                </div>
                <div className="flex flex-col justify-center ml-3">
                  <h1 className="text-2xl font-bold tracking-tight text-text leading-none font-display">Lexicon</h1>
                  <span className="text-muted font-medium text-xs uppercase tracking-[0.2em] leading-none">AI Journal</span>
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom: Profile stats, Feedback, Version */}
            <div className="p-4 border-t border-white/5 space-y-3">
              {/* Profile stats panel - navigates to profile */}
              <button
                onClick={() => { setShowMobileMenu(false); onNavigateToProfile(); }}
                className="w-full flex items-center p-2 rounded-xl bg-surfaceHighlight/50 border border-white/5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center text-primary text-lg font-bold border border-white/10 shrink-0 overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user?.username} className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col text-left ml-3">
                  <span className="text-sm font-bold text-text truncate max-w-[120px]">{user?.username}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">{user?.streak || 1}d</span>
                    <span className="text-[10px] text-blue-500 font-bold">{user?.words_generated || 0}/40 W</span>
                    <span className="text-[10px] text-purple-500 font-bold">{user?.tokens || 0} T</span>
                  </div>
                </div>
              </button>

              {/* Referral Button - Mobile */}
              <button
                onClick={() => { setShowMobileMenu(false); setShowReferralModal(true); }}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300"
              >
                <div className="shrink-0"><Gift className="w-5 h-5" /></div>
                <span className="text-sm font-medium">Bonus</span>
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">+500 Tokens</span>
              </button>

              <a
                href="https://airtable.com/appeRliTRVwrZCBtz/pagkCEum9R8RCY3ey/form"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 hover:text-orange-300"
              >
                <div className="shrink-0"><MessageSquare className="w-5 h-5" /></div>
                <span className="text-sm font-medium">Feedback</span>
              </a>

              <button
                onClick={() => { setShowMobileMenu(false); onLogout(); }}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>

              <div className="pt-5 text-center">
                <span className="text-[8px] text-muted/50 font-bold uppercase tracking-widest">Lexicon AI v4.0</span>
              </div>
            </div>
          </div>
      )}

        <main className={`flex-1 w-full px-2 sm:px-4 py-8 sm:py-12 flex flex-col pb-24 md:pb-12`}>
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Segmented Control Style */}
      {user && !['study', 'context-learning', 'matching'].includes(currentPath || '') && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:bg-transparent md:border-t-0 md:backdrop-blur-none bg-surface/90 backdrop-blur-xl border-t border-white/5 md:pl-16 md:pointer-events-none">
          <div className="flex items-center justify-center max-w-xs mx-auto h-16 px-2 md:pointer-events-auto">
            <div className="flex p-1 bg-surfaceHighlight rounded-2xl border border-white/5 w-full md:shadow-lg md:shadow-black/30">
              <button
                onClick={onNavigateToHome}
                className={`flex items-center justify-center flex-1 py-2.5 rounded-xl transition-all ${
                  currentPath === null || currentPath === 'home'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={onNavigateToCreate}
                className={`flex items-center justify-center flex-1 py-2.5 rounded-xl transition-all ${
                  currentPath === 'scratchpad'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                <PenTool className="w-5 h-5" />
              </button>
              <button
                onClick={onNavigateToJournals}
                className={`flex items-center justify-center flex-1 py-2.5 rounded-xl transition-all ${
                  currentPath === 'journals' || currentPath === 'collections' || currentPath === 'system-archives' || currentPath === 'view'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                <Library className="w-5 h-5" />
              </button>
              <button
                onClick={onNavigateToProfile}
                className={`flex items-center justify-center flex-1 py-2.5 rounded-xl transition-all ${
                  currentPath === 'profile'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                <UserIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Lexy Assistant Panel */}
      {user && !['study', 'context-learning', 'matching'].includes(currentPath || '') && (
        <LexyAssistant user={user} onSpendTokens={onSpendTokens} onUserUpdate={onUserUpdate} />
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl border border-white/10 shadow-2xl shadow-black/50 w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold font-display text-text">Invite Friends & Earn Tokens</h2>
                  <p className="text-sm text-muted mt-1">Give 700 Scholar Tokens to your friend, get 500 Scholar Tokens when they join!</p>
                </div>
                <button
                  onClick={() => setShowReferralModal(false)}
                  className="p-1 rounded-lg text-muted hover:text-text hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-surfaceHighlight/50 border border-white/5 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Your Referral Link</span>
                  <button
                    onClick={copyReferralLink}
                    disabled={copiedLink === referralLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      copiedLink === referralLink 
                        ? 'bg-primary/20 text-primary cursor-default' 
                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                    }`}>
                    {copiedLink === referralLink ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralLink || 'Generating...'}
                    className="flex-1 bg-background border border-white/5 rounded-lg px-3 py-2 text-sm text-text font-mono text-[11px] focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-display text-primary">+700</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary">For Your Friend</div>
                  <div className="text-xs text-muted mt-1">Scholar Tokens on join</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-display text-purple-400">+500</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">For You</div>
                  <div className="text-xs text-muted mt-1">Scholar Tokens when they join</div>
                </div>
              </div>

              <p className="text-center text-xs text-muted">
                Share your link via any app. Rewards are granted automatically when your friend creates an account.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
