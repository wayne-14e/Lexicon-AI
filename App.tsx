import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useUser, useAuth, SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { User, VocabTable, GameMode } from './types';
import { storageService } from './services/storageService';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TableCreator from './components/TableCreator';
import TableView from './components/TableView';
import PublicView from './components/PublicView';
import FlashcardView from './components/FlashcardView';
import ContextLearningView from './components/ContextLearningView';
import MatchingGameView from './components/MatchingGameView';
import ProfileView from './components/ProfileView';
import HomePage from './components/HomePage';
import CollectionsPage from './components/CollectionsPage';
import ScratchpadPage from './components/ScratchpadPage';
import DailyStreakPopup from './components/DailyStreakPopup';
import SystemArchives from './components/SystemArchives';
import { geminiService } from './services/geminiService';
import { Analytics } from '@vercel/analytics/react';
import { useEnsureProfile } from './hooks/useEnsureProfile';

type ViewState = 'home' | 'collections' | 'scratchpad' | 'create' | 'view' | 'public_shared' | 'study' | 'context-learning' | 'matching' | 'profile' | 'system-archives';

const App: React.FC = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { isLoaded: isAuthLoaded, isSignedIn, signOut } = useAuth();
  
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [tables, setTables] = useState<VocabTable[]>([]);
  const [view, setView] = useState<ViewState>('home');
  const [activeTable, setActiveTable] = useState<VocabTable | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [studyExcludeMastered, setStudyExcludeMastered] = useState(false);
  const [matchingGameMode, setMatchingGameMode] = useState<GameMode>('synonyms');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [streakPopup, setStreakPopup] = useState<{ streak: number; tokens: number } | null>(null);

  // Sync Clerk user with Supabase profiles table
  useEnsureProfile();

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      initApp();
    } else if (isAuthLoaded && !isSignedIn) {
      setDbUser(null);
      setTables([]);
      setIsInitializing(false);
    }
  }, [isSignedIn, clerkUser, isAuthLoaded]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const recordTokenChange = async (amount: number, reason: string, targetUserId?: string): Promise<number | null> => {
    const uid = targetUserId || dbUser?.id;
    if (!uid) return null;

    try {
      const latestUser = await storageService.getUserById(uid);
      const currentTokens = latestUser?.tokens ?? 0;
      const newTokens = currentTokens + amount;
      
      await storageService.addTokenTransaction({
        id: crypto.randomUUID(),
        userId: uid,
        amount,
        reason,
        createdAt: Date.now()
      });

      const success = await storageService.updateUserTokens(uid, newTokens);
      if (!success) return null;

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

  const checkDailyAward = async (currentUser: User) => {
    const latestUser = await storageService.getUserById(currentUser.id);
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
      setTables(data);
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
        username: clerkUser.fullName || 'Scholar',
        email: clerkUser.primaryEmailAddress?.emailAddress,
        full_name: clerkUser.fullName || undefined,
        avatar_url: clerkUser.imageUrl,
      };
      
      const syncedUser = await storageService.upsertProfile(initialProfileData);
      setDbUser(syncedUser);
      await fetchUserTables(clerkUser.id);
      
      const syncedTokens = await storageService.syncUserTokenBalanceFromTransactions(clerkUser.id);
      if (syncedTokens !== null) {
        setDbUser(prev => (prev ? { ...prev, tokens: syncedTokens } : prev));
      }

      await checkDailyAward(syncedUser);
    } catch (e) {
      console.error('Lexicon Initialization Failed:', e);
    } finally {
      setIsInitializing(false);
    }
  };

  // Restoration logic remains similar
  const restoreViewFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const tableIdParam = params.get('table');
    
    if (viewParam && ['home', 'collections', 'scratchpad', 'profile', 'system-archives'].includes(viewParam)) {
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
    setActiveTable(table);
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

  const handleUpdateEntryProgress = async (entryId: string, isKnown: boolean) => {
    if (!activeTable) return;
    let masteredWord: string | null = null;
    const updatedEntries = activeTable.entries.map(entry => {
      if (entry.id === entryId) {
        const currentProgress = entry.progress || 0;
        let newProgress = isKnown ? currentProgress + 20 : currentProgress - 35;
        newProgress = Math.max(0, Math.min(100, newProgress));
        if (currentProgress < 80 && newProgress >= 80) masteredWord = entry.word;
        return { ...entry, progress: newProgress };
      }
      return entry;
    });

    if (masteredWord && dbUser) {
      await storageService.addMasteryEvent({
        id: crypto.randomUUID(),
        userId: dbUser.id,
        word: masteredWord,
        createdAt: Date.now()
      });
    }

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
        <PublicView table={activeTable} />
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
            onLogout={() => {
              signOut();
            }} 
            onNavigateToTable={handleNavigateToTable}
            onNavigateToProfile={() => setView('profile')}
            onNavigateToDashboard={() => setView('collections')}
            onNavigateToCreate={() => setView('scratchpad')}
            onNavigateToHome={() => setView('home')}
            onNavigateToArchives={() => setView('system-archives')}
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

            {view === 'collections' && (
              <CollectionsPage 
                user={dbUser}
                tables={tables} 
                onSelectTable={handleNavigateToTable}
                onCreateNew={() => setView('create')}
              />
            )}

            {view === 'profile' && (
              <ProfileView 
                user={dbUser}
                tables={tables}
                onBack={() => setView('home')}
                onUserUpdate={mergeUser}
              />
            )}

            {view === 'scratchpad' && <ScratchpadPage user={dbUser} />}

            {view === 'create' && (
              <TableCreator 
                user={dbUser} 
                onSave={handleSaveTable}
                onCancel={() => setView('collections')}
                isSaving={isFetching}
              />
            )}

            {view === 'view' && activeTable && (
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
            )}

            {view === 'study' && activeTable && (
              <FlashcardView 
                user={dbUser}
                table={activeTable}
                excludeMastered={studyExcludeMastered}
                onBack={() => setView('view')}
                onUpdateProgress={handleUpdateEntryProgress}
                onAwardTokens={(amount, reason) => addTokens(amount, reason)}
              />
            )}

            {view === 'context-learning' && activeTable && activeTable.contextPassage && (
              <ContextLearningView
                table={activeTable}
                onBack={() => setView('view')}
              />
            )}

            {view === 'matching' && activeTable && (
              <MatchingGameView
                table={activeTable}
                initialMode={matchingGameMode}
                onBack={() => setView('view')}
                onUpdateTable={handleUpdateTable}
                onAwardTokens={(amount, reason) => addTokens(amount, reason)}
              />
            )}
            
            {view === 'system-archives' && (
              <SystemArchives 
                user={dbUser} 
                tables={tables}
                onNavigateToSystemTable={handleNavigateToTable} 
                onSpendTokens={spendTokens}
                onUserUpdate={mergeUser}
              />
            )}

            {streakPopup && (
              <DailyStreakPopup
                streak={streakPopup.streak}
                tokensAwarded={streakPopup.tokens}
                onClose={() => setStreakPopup(null)}
              />
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
            <Analytics />
          </Layout>
        )}
      </SignedIn>
      <SignedOut>
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
            <SignIn 
              routing="hash" 
              appearance={{
                elements: {
                  rootBox: 'mx-auto w-full flex justify-center',
                  card: 'bg-surface border border-white/5 shadow-2xl rounded-3xl overflow-hidden mx-auto w-full',
                  formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-primary/20',
                  headerTitle: 'font-display text-text text-2xl font-bold text-center w-full',
                  headerSubtitle: 'text-muted text-sm text-center w-full',
                  socialButtonsBlockButton: 'bg-surfaceHighlight border border-white/5 text-text hover:bg-white/5 transition-all rounded-xl',
                  socialButtonsBlockButtonText: 'text-text font-medium',
                  formFieldLabel: 'text-muted text-[10px] uppercase tracking-widest font-bold mb-2',
                  formFieldInput: 'bg-surfaceHighlight border border-white/5 text-text rounded-xl p-3 focus:border-primary/50 transition-all',
                  footerActionLink: 'text-primary hover:text-primary/80 font-bold',
                  identityPreviewText: 'text-text',
                  identityPreviewEditButtonIcon: 'text-primary'
                },
                variables: {
                  colorPrimary: '#429ada',
                  colorBackground: '#13161c',
                  colorText: '#e3e3e3',
                  colorTextSecondary: '#9ca3af',
                  colorInputBackground: '#1e232b',
                  colorInputText: '#e3e3e3',
                }
              }}
            />
          </div>
        </div>
      </SignedOut>
    </>
  );
};

export default App;