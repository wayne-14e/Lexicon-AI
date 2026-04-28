import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
import SystemArchives from './components/SystemArchives';
import { geminiService } from './services/geminiService';
import { Analytics } from '@vercel/analytics/react';
type ViewState = 'home' | 'collections' | 'scratchpad' | 'create' | 'view' | 'public_shared' | 'study' | 'context-learning' | 'matching' | 'profile' | 'system-archives';

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
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = storageService.onPasswordRecovery(() => {
      setShowPasswordUpdate(true);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 4) {
       showToast("Password must be at least 4 characters.", 'info');
       return;
    }
    setIsUpdatingPassword(true);
    const { error } = await storageService.updateAuthPassword(newPassword);
    setIsUpdatingPassword(false);
    
    if (error) {
       showToast("Failed to update password: " + error.message, 'info');
    } else {
       showToast("Password set successfully!");
       setShowPasswordUpdate(false);
       setNewPassword('');
    }
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const recordTokenChange = async (amount: number, reason: string, targetUserId?: string): Promise<number | null> => {
    const uid = targetUserId || user?.id;
    if (!uid) return null;

    try {
      // 1. Get latest snapshot to ensure we don't use stale tokens
      const latestUser = await storageService.getUserById(uid);
      const currentTokens = latestUser?.tokens ?? 0;
      const newTokens = currentTokens + amount;
      
      console.log(`Recording token change: ${amount} for ${uid}. Previous: ${currentTokens}, New: ${newTokens}. Reason: ${reason}`);

      // 2. Add the transaction log (audit trail)
      await storageService.addTokenTransaction({
        id: crypto.randomUUID(),
        userId: uid,
        amount,
        reason,
        createdAt: Date.now()
      });

      // 3. Update the users table DIRECTLY with the new absolute value
      const success = await storageService.updateUserTokens(uid, newTokens);
      if (!success) {
        console.error("Failed to update tokens in users table.");
        return null;
      }

      console.log(`Token update successful in Supabase. New balance: ${newTokens}`);
      setUser(prev => (prev ? { ...prev, tokens: newTokens } : prev));
      return newTokens;
    } catch (err) {
      console.error("CRITICAL: Failed to record token change:", err);
      showToast("Token transaction failed. Please check your connection.", "info");
      return null;
    }
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

    // We still fetch latest user here to be sure the check is accurate
    const latestUser = await storageService.getUserById(user.id);
    const availableTokens = latestUser?.tokens ?? user.tokens ?? 0;
    setUser(prev => (prev ? { ...prev, tokens: availableTokens } : prev));

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

  /**
   * Safely merges a partial user update into the current state using a functional
   * update, so it NEVER overwrites fields (like `tokens`) that may have been
   * updated by concurrent async operations.
   */
  const mergeUser = (partial: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...partial } : prev));
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
        
        // Sync tokens on init to ensure consistency from previous sessions/tabs
        console.log("Syncing tokens on initialization...");
        const syncedTokens = await storageService.syncUserTokenBalanceFromTransactions(currentUser.id);
        if (syncedTokens !== null) {
          setUser(prev => (prev ? { ...prev, tokens: syncedTokens } : prev));
        }

        // Check for daily award/streak immediately after loading user
        await checkDailyAward(currentUser);
      }
    } catch (e) {
      console.error('Lexicon Initialization Failed:', e);
    } finally {
      setIsInitializing(false);
    }
  };

  // Restore view from URL parameters on app load
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

  // Update URL when view changes
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
    initApp();
  }, []);

  // Separate effect to handle URL restoration after user and tables are loaded
  useEffect(() => {
    if (!isInitializing && (user || tables.length > 0)) {
      restoreViewFromURL();
    }
  }, [isInitializing, user?.id, tables.length]);

  // Handle shared collections separately
  useEffect(() => {
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
  }, []);

  // Update URL when view changes
  useEffect(() => {
    if (!isInitializing && view !== 'public_shared') {
      updateURL(view, activeTable);
    }
  }, [view, activeTable, isInitializing]);

  // Listen for visibility changes to check for daily awards (e.g., coming back the next day)
  useEffect(() => {
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
    // Don't reset to home, let the URL restoration handle it
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (!viewParam) {
      setView('home');
    }
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
      handleNavigateToDashboard();
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

    if (user) {
      const newUsage = await storageService.incrementLimitUsage(user, 'narratives_used');
      if (newUsage === null) {
        showToast("Daily limit reached! You can only generate 2 narratives per day.", 'info');
        return;
      }
      
      // Update state selectively using a functional update to avoid overwriting tokens
      setUser(prev => prev ? { ...prev, narratives_used: newUsage } : prev);
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

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setTables([]);
    setView('home');
    // Clear URL parameters on logout
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleNavigateToTable = (table: VocabTable) => {
    setActiveTable(table);
    setView('view');
  };

  const handleNavigateToProfile = () => {
    setView('profile');
  };

  const handleNavigateToDashboard = () => {
    setView('collections');
  };

  const handleNavigateToCreate = () => {
    setView('scratchpad');
  };

  const handleNavigateToHome = () => {
    setView('home');
  };

  const handleNavigateToArchives = () => {
    setView('system-archives');
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
      onNavigateToProfile={handleNavigateToProfile}
      onNavigateToDashboard={handleNavigateToDashboard}
      onNavigateToCreate={handleNavigateToCreate}
      onNavigateToHome={handleNavigateToHome}
      onNavigateToArchives={handleNavigateToArchives}
      onSpendTokens={spendTokens}
      onUserUpdate={mergeUser}
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
              onNavigateToCreate={handleNavigateToDashboard}
              onNavigateToArchives={handleNavigateToArchives}
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
              onBack={handleNavigateToHome}
              onUserUpdate={mergeUser}
            />
          )}

          {view === 'scratchpad' && (
            <ScratchpadPage user={user} />
          )}

          {view === 'create' && (
            <TableCreator 
              user={user} 
              onSave={handleSaveTable}
              onCancel={handleNavigateToDashboard}
              isSaving={isFetching}
            />
          )}

          {view === 'view' && activeTable && (
            <TableView 
              user={user}
              table={activeTable}
              onBack={activeTable.userId === 'system' || activeTable.id.startsWith('system-') ? handleNavigateToArchives : handleNavigateToDashboard}
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
              user={user}
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
              user={user} 
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

          {showPasswordUpdate && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-surface border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative text-center">
                <h3 className="text-2xl font-bold text-text font-display mb-2">New Access Code</h3>
                <p className="text-xs text-muted mb-6">Please enter your new secure password below to finalize the recovery process.</p>
                
                <div className="relative mb-6">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Access Code"
                    className="w-full p-4 bg-surfaceHighlight border border-white/5 rounded-xl focus:bg-surfaceHighlight focus:border-primary text-text placeholder-muted transition-all text-base font-sans pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-2"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword || newPassword.length < 4}
                  className="w-full bg-primary text-white py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:bg-secondary transition-all disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    <Analytics />
    </Layout>
  );
};

export default App;