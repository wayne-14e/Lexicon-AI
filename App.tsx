import React, { useState, useEffect } from 'react';
import { User, VocabTable, GameMode } from './types';
import { storageService } from './services/storageService';
import Layout from './components/Layout';
import Auth from './components/Auth';
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
import { geminiService } from './services/geminiService';

type ViewState = 'home' | 'collections' | 'scratchpad' | 'create' | 'view' | 'public_shared' | 'study' | 'context-learning' | 'matching' | 'profile';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tables, setTables] = useState<VocabTable[]>([]);
  const [view, setView] = useState<ViewState>('home');
  const [activeTable, setActiveTable] = useState<VocabTable | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [studyExcludeMastered, setStudyExcludeMastered] = useState(false);
  const [matchingGameMode, setMatchingGameMode] = useState<GameMode>('synonyms');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [streakPopup, setStreakPopup] = useState<{ streak: number; tokens: number } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const recordTokenChange = async (amount: number, reason: string, targetUserId?: string): Promise<number | null> => {
    const uid = targetUserId || user?.id;
    if (!uid) return null;

    await storageService.addTokenTransaction({
      id: crypto.randomUUID(),
      userId: uid,
      amount,
      reason,
      createdAt: Date.now()
    });

    const syncedTokens = await storageService.syncUserTokenBalanceFromTransactions(uid);
    if (syncedTokens === null) return null;

    setUser(prev => (prev ? { ...prev, tokens: syncedTokens } : prev));
    return syncedTokens;
  };

  const addTokens = async (amount: number, reason?: string) => {
    if (!user) return;
    await recordTokenChange(amount, reason || 'Earned tokens');

    if (reason) {
      showToast(`+${amount} Tokens: ${reason}`);
    }
  };

  const spendTokens = async (amount: number, reason?: string): Promise<boolean> => {
    if (!user) return false;

    const latestUser = await storageService.getUserById(user.id);
    const availableTokens = latestUser?.tokens ?? user.tokens ?? 0;
    setUser(prev => (prev ? { ...prev, tokens: availableTokens } : prev));

    if (availableTokens < amount) {
      showToast(`Not enough tokens! You need ${amount} tokens.`, 'info');
      return false;
    }

    await recordTokenChange(-amount, reason || 'Spent tokens');

    if (reason) {
      showToast(`-${amount} Tokens: ${reason}`, 'info');
    }
    return true;
  };

  const checkDailyAward = async (currentUser: User) => {
    // Always use the latest user snapshot from Supabase for cross-device/tab consistency.
    const latestUser = await storageService.getUserById(currentUser.id);
    const baseUser = latestUser || currentUser;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Already awarded today — do nothing
    if (baseUser.lastDailyAwardDate === todayStr) {
      if (latestUser) setUser(latestUser);
      return;
    }

    // Prepare update data first to prevent race conditions from other tabs
    // We'll update the lastDailyAwardDate immediately in Supabase before awarding tokens
    // if we want to be truly atomic, but for this app, we'll just be more careful
    // with the order and state.

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
        // diffDays <= 0 means already awarded or some clock issue
        return;
      }
    } else {
      newStreak = 1;
    }

    const tokensAwarded = 10;
    
    // 1. Update the user record with the new date and streak FIRST
    // This marks them as "awarded for today" in the DB.
    const awardFlagUser: User = {
      ...baseUser,
      lastDailyAwardDate: todayStr,
      streak: newStreak
    };
    
    // We use a temporary state update to show progress if needed, 
    // but the DB is the source of truth.
    await storageService.updateUser(awardFlagUser);

    // 2. NOW record the token transaction
    const syncedTokens = await recordTokenChange(tokensAwarded, 'Daily Scholar Award', awardFlagUser.id);
    
    const finalUser: User = {
      ...awardFlagUser,
      tokens: syncedTokens ?? (awardFlagUser.tokens || 0)
    };
    
    setUser(finalUser);
    
    // Show the streak popup
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
    try {
      const currentUser = await storageService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await fetchUserTables(currentUser.id);
        // Check for daily award/streak immediately after loading user
        await checkDailyAward(currentUser);
      }
    } catch (e) {
      console.error('Lexicon Initialization Failed:', e);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initApp();

    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    if (sharedData) {
      try {
        const decodedStr = decodeURIComponent(atob(sharedData).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const raw = JSON.parse(decodedStr);
        const table: VocabTable = {
          id: 'shared-' + Date.now(),
          userId: 'public',
          title: raw.t || 'Shared Collection',
          description: raw.d || '',
          links: raw.l || [],
          createdAt: raw.c || Date.now(),
          entries: (raw.e || []).map((e: any) => ({
            id: crypto.randomUUID(),
            word: e.w,
            partOfSpeech: e.p,
            meaning: e.m,
            synonyms: e.s,
            sentence: e.sen || e.ex || '',
            progress: e.pr || 0
          }))
        };
        setActiveTable(table);
        setView('public_shared');
      } catch (e) {
        console.error('Failed to decode shared collection:', e);
      }
    }

    // Listen for visibility changes to check for daily awards (e.g., coming back the next day)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        checkDailyAward(user);
      }
    };

    // Periodic check every 30 minutes in case the tab is left open
    const checkInterval = setInterval(() => {
      if (user) checkDailyAward(user);
    }, 1000 * 60 * 30);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [user?.id]);

  const handleLogin = async (newUser: User) => {
    setUser(newUser);
    await fetchUserTables(newUser.id);
    await checkDailyAward(newUser);
    setView('home');
  };

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setTables([]);
    setView('home');
  };

  const handleSaveTable = async (table: VocabTable) => {
    setIsFetching(true);
    try {
      await storageService.saveTable(table);
      await fetchUserTables(user!.id);
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
      await fetchUserTables(user!.id);
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
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
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
        
        // Check if just mastered
        if (currentProgress < 80 && newProgress >= 80) {
          masteredWord = entry.word;
        }
        
        return { ...entry, progress: newProgress };
      }
      return entry;
    });

    if (masteredWord && user) {
      await storageService.addMasteryEvent({
        id: crypto.randomUUID(),
        userId: user.id,
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

  const handleNavigateToTable = (table: VocabTable) => {
    setActiveTable(table);
    setView('view');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] text-muted font-medium tracking-[0.2em] uppercase">Initializing System</p>
        </div>
      </div>
    );
  }

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
    <Layout 
      user={user} 
      tables={tables}
      onLogout={handleLogout} 
      onNavigateToTable={handleNavigateToTable}
      onNavigateToProfile={() => setView('profile')}
      onNavigateToDashboard={() => setView('collections')}
      onNavigateToCreate={() => setView('scratchpad')}
      onNavigateToHome={() => setView('home')}
      onSpendTokens={spendTokens}
    >
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <>
          {view === 'home' && (
            <HomePage 
              user={user}
              tables={tables}
              onNavigateToTable={handleNavigateToTable}
              onNavigateToCreate={() => setView('collections')}
            />
          )}

          {view === 'collections' && (
            <CollectionsPage 
              user={user}
              tables={tables} 
              onSelectTable={handleNavigateToTable}
              onCreateNew={() => setView('create')}
            />
          )}

          {view === 'profile' && (
            <ProfileView 
              user={user}
              tables={tables}
              onBack={() => setView('home')}
            />
          )}

          {view === 'scratchpad' && (
            <ScratchpadPage user={user} />
          )}

          {view === 'create' && (
            <TableCreator 
              user={user} 
              onSave={handleSaveTable}
              onCancel={() => setView('collections')}
            />
          )}

          {view === 'view' && activeTable && (
            <TableView 
              table={activeTable}
              onBack={() => setView('collections')}
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
            />
          )}

          {view === 'study' && activeTable && (
            <FlashcardView 
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
        </>
      )}
    </Layout>
  );
};

export default App;