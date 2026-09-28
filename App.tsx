import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useUser, useAuth, SignedIn, SignedOut, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { User, VocabTable, GameMode } from './types';
import { storageService, setAuthenticatedClient } from './services/storageService';
import { createClerkSupabaseClient, supabase } from './services/supabaseClient';
import { validSystemTableIds } from './services/systemArchiveData';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import LandingPage from './components/LandingPage';
import ThemeToggle, { Theme } from './components/ThemeToggle';
import { geminiService } from './services/geminiService';

// Heavy views are code-split so the initial bundle only contains the
// landing + home shell. Each lazy chunk loads on demand when navigated to.
// (ProfileView pulls in recharts; LexyAssistant via Layout pulls in
// react-markdown — both stay out of the first paint this way.)
const TableCreator = lazy(() => import('./components/TableCreator'));
const TableView = lazy(() => import('./components/TableView'));
const PublicView = lazy(() => import('./components/PublicView'));
const FlashcardView = lazy(() => import('./components/FlashcardView'));
const ContextLearningView = lazy(() => import('./components/ContextLearningView'));
const MatchingGameView = lazy(() => import('./components/MatchingGameView'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const CollectionsPage = lazy(() => import('./components/CollectionsPage'));
const ScratchpadPage = lazy(() => import('./components/ScratchpadPage'));
const DailyStreakPopup = lazy(() => import('./components/DailyStreakPopup'));
const SystemArchives = lazy(() => import('./components/SystemArchives'));
const JournalsPage = lazy(() => import('./components/JournalsPage'));
const CustomSignUp = lazy(() => import('./components/CustomSignUp'));
const CustomSignIn = lazy(() => import('./components/CustomSignIn'));
const CompleteUsername = lazy(() => import('./components/CompleteUsername'));

// Vercel telemetry is deferred until the browser is idle (well after LCP)
// so its scripts never compete with first paint or inflate TBT.
const Analytics = lazy(() =>
  import('@vercel/analytics/react').then(m => ({ default: m.Analytics }))
);
const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights }))
);

/** Mounts Vercel telemetry only once the page is idle. */
const DeferredTelemetry: React.FC = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idleId: number | undefined;
    let timer: number | undefined;
    const markReady = () => setReady(true);
    const schedule = () => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
      if (typeof ric === 'function') {
        idleId = ric.call(window, markReady, { timeout: 4000 });
      } else {
        timer = window.setTimeout(markReady, 3000);
      }
    };
    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
      // Fallback in case `load` already fired between check and listen.
      timer = window.setTimeout(markReady, 5000);
    }
    return () => {
      window.removeEventListener('load', schedule);
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Analytics />
      <SpeedInsights />
    </Suspense>
  );
};

/** Lightweight placeholder while a lazy view chunk loads. */
const ViewFallback: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center space-y-4 text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] text-muted font-medium tracking-[0.2em] uppercase">Loading</p>
    </div>
  </div>
);

type ViewState = 'home' | 'collections' | 'scratchpad' | 'create' | 'view' | 'public_shared' | 'study' | 'context-learning' | 'matching' | 'profile' | 'system-archives' | 'journals';

const App: React.FC = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { isLoaded: isAuthLoaded, isSignedIn, signOut, getToken } = useAuth();
  
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [tables, setTables] = useState<VocabTable[]>([]);
  const [view, setView] = useState<ViewState>('home');
  const [activeTable, setActiveTable] = useState<VocabTable | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [studyExcludeMastered, setStudyExcludeMastered] = useState(false);
  const [matchingGameMode, setMatchingGameMode] = useState<GameMode>('synonyms');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [streakPopup, setStreakPopup] = useState<{ streak: number; tokens: number } | null>(null);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up' | null>(null);

  // Theme: dark by default (the app's original look), persisted across visits.
  // Applied to <html> so body + all token-driven UI follows, including the
  // landing page.
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('lexicon-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem('lexicon-theme', theme);
    } catch {
      // private-mode storage may throw — theme simply won't persist
    }
  }, [theme]);

  // Capture referral code from URL on initial mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        const sanitized = refCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        if (sanitized.length >= 4) {
          localStorage.setItem('lexicon_ref_code', sanitized);
          console.log('Captured referral code:', sanitized);
        }
        // Clean up the ?ref= query param so it doesn't clutter the address bar
        // or interfere with auth redirects (e.g., Clerk SSO callback).
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (err) {
      console.error('Failed to process referral query param:', err);
    }
  }, []);

  // Listen for a successfully applied referral bonus (dispatched by storageService)
  // and surface the welcome toast + refresh the user's token balance.
  useEffect(() => {
    const handleReferralApplied = async () => {
      if (dbUser?.id) {
        try {
          const latest = await storageService.getUserById(dbUser.id);
          if (latest) setDbUser(latest);
        } catch (err) {
          console.error('Failed to refresh user after referral bonus:', err);
        }
      }
      showToast('🎉 Welcome bonus! You received 700 Scholar Tokens for signing up via referral!', 'success');
    };
    window.addEventListener('lexicon:referral-applied', handleReferralApplied);
    return () => window.removeEventListener('lexicon:referral-applied', handleReferralApplied);
  }, [dbUser?.id]);

  // Sync Clerk user with Supabase profiles table.
  // NOTE: initApp() below already upserts the profile on sign-in, so the
  // separate useEnsureProfile hook was removed — it duplicated the same
  // SELECT+INSERT/UPDATE round trips on every load (~600ms wasted).

  useEffect(() => {
    if (isDbReady && clerkUser && isClerkLoaded) {
      initApp();
    } else if (isAuthLoaded && !isSignedIn) {
      setDbUser(null);
      setTables([]);
      setIsInitializing(false);
    }
  }, [isDbReady, clerkUser, isClerkLoaded, isAuthLoaded, isSignedIn]);

  useEffect(() => {
    if (isSignedIn && getToken) {
      const authClient = createClerkSupabaseClient(getToken);
      setAuthenticatedClient(authClient);
      setIsDbReady(true);
    } else if (!isSignedIn && isAuthLoaded) {
      setAuthenticatedClient(supabase);
      setIsDbReady(false);
    }
  }, [isSignedIn, getToken, isAuthLoaded]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const recordTokenChange = async (amount: number, reason: string, targetUserId?: string): Promise<number | null> => {
    const uid = targetUserId || dbUser?.id;
    if (!uid) return null;

    try {
      const newTokens = await storageService.adjustUserTokens(uid, amount, reason);
      if (newTokens === null) return null;

      setDbUser(prev => (prev ? { ...prev, tokens: newTokens } : prev));
      return newTokens;
    } catch (err) {
      console.error("CRITICAL: Failed to record token change:", err);
      showToast("Token transaction failed. Please check your connection.", "info");
      return null;
    }
  };

  const addTokens = async (amount: number, reason?: string) => {
    if (!dbUser) return;
    await recordTokenChange(amount, reason || 'Earned tokens');
    if (reason) showToast(`+${amount} Tokens: ${reason}`);
  };

  const spendTokens = async (amount: number, reason?: string): Promise<boolean> => {
    if (!dbUser) return false;

    const latestUser = await storageService.getUserById(dbUser.id);
    const availableTokens = latestUser?.tokens ?? dbUser.tokens ?? 0;
    setDbUser(prev => (prev ? { ...prev, tokens: availableTokens } : prev));

    if (availableTokens < amount) {
      showToast(`Not enough tokens! You need ${amount} tokens.`, 'info');
      return false;
    }

    const result = await recordTokenChange(-amount, reason || 'Spent tokens');
    if (result !== null && reason) {
      showToast(`-${amount} Tokens: ${reason}`, 'info');
    }
    return result !== null;
  };

  const mergeUser = (partial: Partial<User>) => {
    setDbUser(prev => (prev ? { ...prev, ...partial } : prev));
  };

  const checkDailyAward = async (currentUser: User, prefetched: User | null = null) => {
    // On the init path we already hold a freshly-upserted profile, so skip
    // the extra round trip. On the visibility-change path fall back to a fetch.
    const latestUser = prefetched ?? await storageService.getUserById(currentUser.id);
    const baseUser = latestUser || currentUser;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (baseUser.lastDailyAwardDate === todayStr) {
      if (latestUser) setDbUser(latestUser);
      return;
    }

    let newStreak: number;
    if (baseUser.lastDailyAwardDate) {
      const lastDate = new Date(baseUser.lastDailyAwardDate + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = (baseUser.streak || 1) + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      } else {
        return;
      }
    } else {
      newStreak = 1;
    }

    const tokensAwarded = 10;
    const awardFlagUser: User = {
      ...baseUser,
      lastDailyAwardDate: todayStr,
      streak: newStreak
    };
    
    await storageService.updateProfile(awardFlagUser);
    const syncedTokens = await recordTokenChange(tokensAwarded, 'Daily Scholar Award', awardFlagUser.id);
    
    const finalUser: User = {
      ...awardFlagUser,
      tokens: syncedTokens ?? (awardFlagUser.tokens || 0)
    };
    
    setDbUser(finalUser);
    setStreakPopup({ streak: newStreak, tokens: tokensAwarded });
  };

  const fetchUserTables = async (userId: string) => {
    setIsFetching(true);
    try {
      const data = await storageService.getTables(userId);
      // Filter out stale combined system tables that don't correspond to real individual sets
      const cleaned = data.filter(t => {
        if (t.id.startsWith('system-') && !validSystemTableIds.has(t.id)) {
          storageService.deleteTable(t.id);
          return false;
        }
        return true;
      });
      setTables(cleaned);
    } catch (err) {
      console.error("Error fetching tables:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const initApp = async () => {
    if (!clerkUser) return;
    try {
      // Upsert profile data from Clerk immediately on init if signed in
      const initialProfileData: User = {
        id: clerkUser.id,
        username: clerkUser.username || clerkUser.fullName || (clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0]) || `Scholar${Math.floor(100 + Math.random() * 900)}`,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        full_name: clerkUser.fullName || clerkUser.username || undefined,
        avatar_url: clerkUser.imageUrl,
      };

      // Profile upsert and table fetch are independent (both keyed by
      // clerkUser.id) — run them in parallel instead of serially.
      const [syncedUser, tablesData] = await Promise.all([
        storageService.upsertProfile(initialProfileData),
        storageService.getTables(clerkUser.id),
      ]);
      setDbUser(syncedUser);
      // Filter out stale combined system tables that don't correspond to real individual sets
      const cleaned = tablesData.filter(t => {
        if (t.id.startsWith('system-') && !validSystemTableIds.has(t.id)) {
          storageService.deleteTable(t.id);
          return false;
        }
        return true;
      });
      setTables(cleaned);
      // First paint is unblocked here — token balance + daily award resolve
      // in the background without holding up interactivity.
      setIsInitializing(false);

      try {
        const syncedTokens = await storageService.syncUserTokenBalanceFromTransactions(clerkUser.id);
        if (syncedTokens !== null) {
          setDbUser(prev => (prev ? { ...prev, tokens: syncedTokens } : prev));
        }

        await checkDailyAward(syncedUser, syncedUser);
      } catch (e) {
        console.error('Lexicon background sync failed:', e);
      }
    } catch (e) {
      console.error('Lexicon Initialization Failed:', e);
      setIsInitializing(false);
    }
  };

  // Restoration logic remains similar
  const restoreViewFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const tableIdParam = params.get('table');
    
    if (viewParam && ['home', 'collections', 'scratchpad', 'profile', 'system-archives', 'journals'].includes(viewParam)) {
      setView(viewParam as ViewState);
    }
    
    if (tableIdParam && tables.length > 0) {
      const table = tables.find(t => t.id === tableIdParam);
      if (table) {
        setActiveTable(table);
        if (viewParam === 'view' || viewParam === 'study' || viewParam === 'context-learning' || viewParam === 'matching') {
          setView(viewParam as ViewState);
        }
      }
    }
  };

  const updateURL = (newView: ViewState, table?: VocabTable | null) => {
    const url = new URL(window.location.href);
    if (newView === 'home') {
      url.searchParams.delete('view');
      url.searchParams.delete('table');
    } else {
      url.searchParams.set('view', newView);
      if (table && ['view', 'study', 'context-learning', 'matching'].includes(newView)) {
        url.searchParams.set('table', table.id);
      } else {
        url.searchParams.delete('table');
      }
    }
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    if (!isInitializing && (dbUser || tables.length > 0)) {
      restoreViewFromURL();
    }
  }, [isInitializing, dbUser?.id, tables.length]);

  useEffect(() => {
    if (!isInitializing && view !== 'public_shared') {
      updateURL(view, activeTable);
    }
  }, [view, activeTable, isInitializing]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && dbUser) {
        checkDailyAward(dbUser);
      }
    };
    const checkInterval = setInterval(() => {
      if (dbUser) checkDailyAward(dbUser);
    }, 1000 * 60 * 30);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [dbUser?.id]);

  const handleNavigateToTable = (table: VocabTable) => {
    if (table.id.startsWith('system-') && !validSystemTableIds.has(table.id)) {
      return;
    }
    if (table.id.startsWith('system-')) {
      const existing = tables.find(t => t.id === table.id);
      if (existing) {
        setActiveTable(existing);
      } else {
        setTables(prev => [...prev, table]);
        setActiveTable(table);
      }
    } else {
      setActiveTable(table);
    }
    setView('view');
  };

  const handleSaveTable = async (table: VocabTable) => {
    setIsFetching(true);
    try {
      await storageService.saveTable(table);
      await fetchUserTables(dbUser!.id);
      setActiveTable(table);
      setView('view');
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    setIsFetching(true);
    try {
      await storageService.deleteTable(id);
      await fetchUserTables(dbUser!.id);
      setActiveTable(null);
      setView('collections');
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleUpdateTable = async (updatedTable: VocabTable) => {
    setActiveTable(updatedTable);
    setTables(prev => {
      const exists = prev.some(t => t.id === updatedTable.id);
      if (exists) {
        return prev.map(t => t.id === updatedTable.id ? updatedTable : t);
      }
      return [...prev, updatedTable];
    });
    await storageService.saveTable(updatedTable);
  };

  const handleUpdateEntryProgress = async (entryId: string, delta: number) => {
    if (!activeTable) return;
    const updatedEntries = activeTable.entries.map(entry => {
      if (entry.id === entryId) {
        const currentProgress = entry.progress || 0;
        let newProgress = currentProgress + delta;
        newProgress = Math.max(0, Math.min(100, newProgress));
        // Record the first time a word crosses the 80% mastery threshold
        const masteredAt = currentProgress < 80 && newProgress >= 80
          ? Date.now()
          : entry.masteredAt;
        return { ...entry, progress: newProgress, masteredAt };
      }
      return entry;
    });

    const updatedTable = { ...activeTable, entries: updatedEntries };
    handleUpdateTable(updatedTable);
  };

  const handleEnterContextLearning = async () => {
    if (!activeTable) return;
    if (activeTable.contextPassage) {
      setView('context-learning');
      return;
    }
    if (dbUser) {
      const newUsage = await storageService.incrementLimitUsage(dbUser, 'narratives_used');
      if (newUsage === null) {
        showToast("Daily limit reached! You can only generate 2 narratives per day.", 'info');
        return;
      }
      setDbUser(prev => prev ? { ...prev, narratives_used: newUsage } : prev);
    }
    setIsFetching(true);
    try {
      const words = activeTable.entries.map(e => e.word);
      const passage = await geminiService.generateContextPassage(words, activeTable.title);
      const updatedTable = { ...activeTable, contextPassage: passage };
      await storageService.saveTable(updatedTable);
      setActiveTable(updatedTable);
      setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
      setView('context-learning');
    } catch (error) {
      console.error("Failed to generate context learning passage:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // Handle OAuth callback for social sign-in BEFORE any loading gate,
  // otherwise /sso-callback can hang on the spinner and Clerk times out.
  if (typeof window !== 'undefined' && window.location.pathname === '/sso-callback') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <AuthenticateWithRedirectCallback
          continueSignUpUrl="/complete-username"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        />
      </div>
    );
  }

  // Username completion for OAuth sign-ups with missing requirements
  // (e.g. username required on the Clerk instance but not supplied by Google).
  if (typeof window !== 'undefined' && window.location.pathname === '/complete-username') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="w-14 h-14 sm:w-14 sm:h-14 flex items-center justify-center mb-5 drop-shadow-[0_0_20px_rgba(66,154,218,0.4)]">
            <img src="/logo.svg" className="object-contain w-full h-full" alt="Logo" />
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text leading-none font-display">Lexicon</h1>
            <span className="text-muted font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.5em] mt-1 -mr-[0.5em]">AI Journal</span>
          </div>
        </div>

        <div className="w-full max-w-[400px] mx-auto animate-in fade-in zoom-in-95 duration-700 delay-300">
          <Suspense fallback={<ViewFallback />}>
            <CompleteUsername />
          </Suspense>
          <p className="text-center mt-3">
            <button onClick={() => { window.location.href = '/'; }} className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-text transition-colors">
              ← Back to Home
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (!isClerkLoaded || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] text-muted font-medium tracking-[0.2em] uppercase">Initializing System</p>
        </div>
      </div>
    );
  }

  // Handle Shared View for non-authenticated or authenticated
  if (view === 'public_shared' && activeTable) {
    const sharedTable = activeTable;
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto pt-6 px-6 flex justify-between items-center print:hidden">
            <button 
              onClick={() => window.location.href = window.location.origin}
              className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black"
            >
              &larr; Create My Own Journal
            </button>
        </div>
        <Suspense fallback={<ViewFallback />}>
          <PublicView table={sharedTable} />
        </Suspense>
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        {dbUser && (
          <Layout 
            user={dbUser} 
            tables={tables}
            currentView={view}
            onLogout={() => {
              signOut();
            }} 
            onNavigateToTable={handleNavigateToTable}
            onNavigateToProfile={() => setView('profile')}
            onNavigateToDashboard={() => setView('collections')}
            onNavigateToCreate={() => setView('scratchpad')}
            onNavigateToHome={() => setView('home')}
            onNavigateToArchives={() => setView('system-archives')}
            onNavigateToJournals={() => setView('journals')}
            onSpendTokens={spendTokens}
            onUserUpdate={mergeUser}
          >
            {view === 'home' && (
              <HomePage 
                user={dbUser}
                tables={tables}
                onNavigateToTable={handleNavigateToTable}
                onNavigateToCreate={() => setView('collections')}
                onNavigateToArchives={() => setView('system-archives')}
              />
            )}

            {view === 'journals' && (
              <Suspense fallback={<ViewFallback />}>
                <JournalsPage
                  onNavigateToCollections={() => setView('collections')}
                  onNavigateToArchives={() => setView('system-archives')}
                />
              </Suspense>
            )}

            {view === 'collections' && (
              <Suspense fallback={<ViewFallback />}>
                <CollectionsPage 
                  user={dbUser}
                  tables={tables} 
                  onSelectTable={handleNavigateToTable}
                  onCreateNew={() => setView('create')}
                  onBack={() => setView('journals')}
                />
              </Suspense>
            )}

            {view === 'profile' && (
              <Suspense fallback={<ViewFallback />}>
                <ProfileView 
                  user={dbUser}
                  tables={tables}
                  onBack={() => setView('home')}
                  onUserUpdate={mergeUser}
                />
              </Suspense>
            )}

            {view === 'scratchpad' && (
              <Suspense fallback={<ViewFallback />}>
                <ScratchpadPage user={dbUser} />
              </Suspense>
            )}

            {view === 'create' && (
              <Suspense fallback={<ViewFallback />}>
                <TableCreator 
                  user={dbUser} 
                  onSave={handleSaveTable}
                  onCancel={() => setView('collections')}
                  isSaving={isFetching}
                  onUserUpdate={mergeUser}
                />
              </Suspense>
            )}

            {view === 'view' && activeTable && (
              <Suspense fallback={<ViewFallback />}>
                <TableView 
                user={dbUser}
                table={activeTable}
                onBack={activeTable.userId === 'system' || activeTable.id.startsWith('system-') ? () => setView('system-archives') : () => setView('collections')}
                onDelete={handleDeleteTable}
                onStudy={(excludeMastered) => {
                  setStudyExcludeMastered(excludeMastered);
                  setView('study');
                }}
                onLearnContext={handleEnterContextLearning}
                onMatchingGame={(mode) => {
                  setMatchingGameMode(mode);
                  setView('matching');
                }}
                onUpdateTable={handleUpdateTable}
                onUserUpdate={mergeUser}
                isFetching={isFetching}
                />
              </Suspense>
            )}

            {view === 'study' && activeTable && (
              <Suspense fallback={<ViewFallback />}>
                <FlashcardView 
                user={dbUser}
                table={activeTable}
                excludeMastered={studyExcludeMastered}
                onBack={() => setView('view')}
                onUpdateProgress={(entryId, deltaOrIsKnown) => {
                  // Legacy support for boolean if needed, but we'll use delta now
                  const delta = typeof deltaOrIsKnown === 'boolean' 
                    ? (deltaOrIsKnown ? 20 : -35) 
                    : deltaOrIsKnown;
                  handleUpdateEntryProgress(entryId, delta);
                }}
                onAwardTokens={(amount, reason) => addTokens(amount, reason)}
                />
              </Suspense>
            )}

            {view === 'context-learning' && activeTable && activeTable.contextPassage && (
              <Suspense fallback={<ViewFallback />}>
                <ContextLearningView
                  table={activeTable}
                  onBack={() => setView('view')}
                />
              </Suspense>
            )}

            {view === 'matching' && activeTable && (
              <Suspense fallback={<ViewFallback />}>
                <MatchingGameView
                  table={activeTable}
                  initialMode={matchingGameMode}
                  onBack={() => setView('view')}
                  onUpdateTable={handleUpdateTable}
                  onUpdateProgress={handleUpdateEntryProgress}
                  onAwardTokens={(amount, reason) => addTokens(amount, reason)}
                />
              </Suspense>
            )}
            
            {view === 'system-archives' && (
              <Suspense fallback={<ViewFallback />}>
                <SystemArchives 
                user={dbUser} 
                tables={tables}
                onNavigateToSystemTable={handleNavigateToTable} 
                onSpendTokens={spendTokens}
                onUserUpdate={mergeUser}
                onBack={() => setView('journals')}
                />
              </Suspense>
            )}

            {streakPopup && (
              <Suspense fallback={null}>
                <DailyStreakPopup
                  streak={streakPopup.streak}
                  tokensAwarded={streakPopup.tokens}
                  onClose={() => setStreakPopup(null)}
                />
              </Suspense>
            )}

            {toast && (
              <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-300">
                <div className={`px-6 py-3 rounded-full shadow-2xl border flex items-center space-x-3 ${
                  toast.type === 'success' ? 'bg-purple-500 text-white border-purple-500/20' : 'bg-surfaceHighlight text-purple-500 border-purple-500/30'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-widest">{toast.message}</span>
                </div>
              </div>
            )}

            {isFetching && (
               <div className="fixed bottom-8 right-8 bg-black text-white px-4 py-2 rounded-full text-[10px] font-bold tracking-widest animate-pulse z-50 shadow-2xl">
                 SYNCING...
               </div>
            )}
            <Suspense fallback={null}>
              <DeferredTelemetry />
            </Suspense>
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
              position={view === 'study' ? 'bottom-right' : 'top-right'}
            />
          </Layout>
        )}
      </SignedIn>
      <SignedOut>
        {authMode === null ? (
          <LandingPage
            onSignIn={() => setAuthMode('sign-in')}
            onSignUp={() => setAuthMode('sign-up')}
          />
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
            <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="w-14 h-14 sm:w-14 sm:h-14 flex items-center justify-center mb-5 drop-shadow-[0_0_20px_rgba(66,154,218,0.4)]">
                <img src="/logo.svg" className="object-contain w-full h-full" alt="Logo" />
              </div>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text leading-none font-display">Lexicon</h1>
                <span className="text-muted font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.5em] mt-1 -mr-[0.5em]">AI Journal</span>
              </div>
            </div>

            <div className="w-full max-w-[400px] mx-auto animate-in fade-in zoom-in-95 duration-700 delay-300">
              <Suspense fallback={<ViewFallback />}>
                {authMode === 'sign-in' ? (
                  <CustomSignIn onSwitchToSignUp={() => setAuthMode('sign-up')} />
                ) : (
                  <CustomSignUp onSwitchToSignIn={() => setAuthMode('sign-in')} />
                )}
              </Suspense>
              <p className="text-center text-muted text-xs mt-4">
                {authMode === 'sign-in' ? (
                  <>Don't have an account?{' '}
                    <button onClick={() => setAuthMode('sign-up')} className="text-primary font-bold hover:underline">Sign up</button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => setAuthMode('sign-in')} className="text-primary font-bold hover:underline">Sign in</button>
                  </>
                )}
              </p>
              <p className="text-center mt-3">
                <button onClick={() => setAuthMode(null)} className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-text transition-colors">
                  ← Back to Home
                </button>
              </p>
            </div>
          </div>
        )}
        <ThemeToggle theme={theme} onToggle={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
      </SignedOut>
      <DeferredTelemetry />
    </>
  );
};

export default App;
