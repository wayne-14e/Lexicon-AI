
import React, { useState, useEffect } from 'react';
import { User, VocabTable } from './types';
import { storageService } from './services/storageService';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TableCreator from './components/TableCreator';
import TableView from './components/TableView';
import PublicView from './components/PublicView';
import FlashcardView from './components/FlashcardView';
import ContextLearningView from './components/ContextLearningView';
import { geminiService } from './services/geminiService';

type ViewState = 'dashboard' | 'create' | 'view' | 'public_shared' | 'study' | 'context-learning';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tables, setTables] = useState<VocabTable[]>([]);
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeTable, setActiveTable] = useState<VocabTable | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

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

  useEffect(() => {
    const initApp = async () => {
      try {
        const currentUser = await storageService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await fetchUserTables(currentUser.id);
        }
      } catch (e) {
        console.error('Lexicon Initialization Failed:', e);
      } finally {
        setIsInitializing(false);
      }
    };

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
  }, []);

  const handleLogin = async (newUser: User) => {
    setUser(newUser);
    await fetchUserTables(newUser.id);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setTables([]);
    setView('dashboard');
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
      setView('dashboard');
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleUpdateEntryProgress = async (entryId: string, isKnown: boolean) => {
    if (!activeTable) return;

    const updatedEntries = activeTable.entries.map(entry => {
      if (entry.id === entryId) {
        const currentProgress = entry.progress || 0;
        let newProgress = isKnown ? currentProgress + 20 : currentProgress - 35;
        newProgress = Math.max(0, Math.min(100, newProgress));
        return { ...entry, progress: newProgress };
      }
      return entry;
    });

    const updatedTable = { ...activeTable, entries: updatedEntries };
    setActiveTable(updatedTable);
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
    await storageService.saveTable(updatedTable);
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
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <div className="text-sm serif font-bold tracking-widest uppercase">Lexicon Local Link...</div>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Initializing local linguistic repository</p>
          </div>
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
    >
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <>
          {view === 'dashboard' && (
            <Dashboard 
              user={user}
              tables={tables} 
              onSelectTable={handleNavigateToTable}
              onCreateNew={() => setView('create')}
            />
          )}

          {view === 'create' && (
            <TableCreator 
              user={user} 
              onSave={handleSaveTable}
              onCancel={() => setView('dashboard')}
            />
          )}

          {view === 'view' && activeTable && (
            <TableView 
              table={activeTable}
              onBack={() => setView('dashboard')}
              onDelete={handleDeleteTable}
              onStudy={() => setView('study')}
              onLearnContext={handleEnterContextLearning}
            />
          )}

          {view === 'study' && activeTable && (
            <FlashcardView 
              table={activeTable}
              onBack={() => setView('view')}
              onUpdateProgress={handleUpdateEntryProgress}
            />
          )}

          {view === 'context-learning' && activeTable && activeTable.contextPassage && (
            <ContextLearningView
              table={activeTable}
              onBack={() => setView('view')}
            />
          )}
          
          {isFetching && (
             <div className="fixed bottom-8 right-8 bg-black text-white px-4 py-2 rounded-full text-[10px] font-bold tracking-widest animate-pulse z-50 shadow-2xl">
               AI GENERATING...
             </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default App;
