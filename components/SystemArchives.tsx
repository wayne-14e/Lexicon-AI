import React, { useState, useEffect } from 'react';
import { User, VocabTable } from '../types';
import { ChevronLeft, Lock } from 'lucide-react';
import { storageService } from '../services/storageService';

let savedActiveTab: 'IELTS' | 'SAT' = 'IELTS';
let savedSatCategory: string | null = null;

interface SystemArchivesProps {
  user: User;
  tables: VocabTable[];
  onNavigateToSystemTable: (table: VocabTable) => void;
  onSpendTokens?: (amount: number, reason: string) => Promise<boolean>;
  onUserUpdate?: (partial: Partial<User>) => void;
  onBack?: () => void;
}

const SystemArchives: React.FC<SystemArchivesProps> = ({ user, tables, onNavigateToSystemTable, onSpendTokens, onUserUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'IELTS' | 'SAT'>(savedActiveTab);
  const [selectedSatCategory, setSelectedSatCategory] = useState<string | null>(savedSatCategory);

  useEffect(() => {
    savedActiveTab = activeTab;
  }, [activeTab]);

  useEffect(() => {
    savedSatCategory = selectedSatCategory;
  }, [selectedSatCategory]);

  const ieltsCategories = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const satCategories = [
    'College Panda 400', 
    'Erica Vocabulary'
  ];

  const ITEM_COSTS: Record<string, number> = {
    'A1': 10,
    'A2': 20,
    'B1': 50,
    'B2': 80,
    'C1': 150,
    'C2': 200,
    'College Panda 400': 400,
    'Erica Vocabulary': 300
  };

  const isUnlocked = (collectionId: string) => {
    return user.unlocked_system_collections?.includes(collectionId) || false;
  };

  const calculateMastery = (table: VocabTable) => {
    if (!table || !table.entries || table.entries.length === 0) return 0;
    const total = table.entries.reduce((acc, e) => acc + (e.progress || 0), 0);
    return Math.round(total / table.entries.length);
  };

  const handleUnlockCollection = async (e: React.MouseEvent, category: string, id: string) => {
    e.stopPropagation();
    if (!onSpendTokens || !onUserUpdate) return;
    
    const cost = ITEM_COSTS[category];
    const success = await onSpendTokens(cost, `Unlocked ${category} Collection`);
    
    if (success) {
      const newUnlocked = [...(user.unlocked_system_collections || []), id];
      await storageService.updateProfileField(user.id, 'unlocked_system_collections', newUnlocked);
      
      // Only pass the changed field so mergeUser in App.tsx preserves the token balance
      onUserUpdate({ unlocked_system_collections: newUnlocked });
    }
  };

  const handleIeltsClick = async (category: string) => {
    let entries: VocabTable['entries'] = [];
    let contextPassage = undefined;

    if (category === 'A1') {
      try {
        const a1Data = await import('../src/data/ielts_a1.json');
        const data = a1Data.default || a1Data;
        entries = data.entries || [];
        contextPassage = data.contextPassage;
      } catch (e) {
        console.error("Failed to load A1 data", e);
      }
    } else if (category === 'A2') {
      try {
        const a2Data = await import('../src/data/ielts_a2.json');
        const data = a2Data.default || a2Data;
        entries = data.entries || [];
        contextPassage = data.contextPassage;
      } catch (e) {
        console.error("Failed to load A2 data", e);
      }
    } else if (category === 'B1') {
      try {
        const b1Data = await import('../src/data/ielts_b1.json');
        const data = b1Data.default || b1Data;
        entries = data.entries || [];
        contextPassage = data.contextPassage;
      } catch (e) {
        console.error("Failed to load B1 data", e);
      }
    } else if (category === 'B2') {
      try {
        const b2Data = await import('../src/data/ielts_b2.json');
        const data = b2Data.default || b2Data;
        entries = data.entries || [];
        contextPassage = data.contextPassage;
      } catch (e) {
        console.error("Failed to load B2 data", e);
      }
    } else if (category === 'C1') {
      try {
        const c1Data = await import('../src/data/ielts_c1.json');
        const data = c1Data.default || c1Data;
        entries = data.entries || [];
        contextPassage = data.contextPassage;
      } catch (e) {
        console.error("Failed to load C1 data", e);
      }
    } else if (category === 'C2') {
      try {
        const c2Data = await import('../src/data/ielts_c2.json');
        const data = c2Data.default || c2Data;
        entries = data.entries || [];
        contextPassage = data.contextPassage;
      } catch (e) {
        console.error("Failed to load C2 data", e);
      }
    }

    const tableId = `system-ielts-${category.toLowerCase()}`;
    const existingTable = tables.find(t => t.id === tableId);
    
    // If it exists in user's saved tables, use that to preserve progress
    if (existingTable) {
      onNavigateToSystemTable(existingTable);
      return;
    }

    const table: VocabTable = {
      id: tableId,
      title: `IELTS ${category} Vocabulary`,
      description: `Official IELTS ${category} essential word list.`,
      userId: user.id,
      createdAt: Date.now(),
      entries: entries,
      links: [],
      contextPassage: contextPassage
    };
    onNavigateToSystemTable(table);
  };

  const handleSatSetClick = async (category: string, setId: string, displayTitle: string) => {
    let entries: VocabTable['entries'] = [];
    let contextPassage = undefined;

    if (category === 'College Panda 400') {
      if (setId === 'set-1') {
        try {
          const dataModule = await import('../src/data/sat_college_panda1.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT College Panda Set 1 data", e);
        }
      } else if (setId === 'set-2') {
        try {
          const dataModule = await import('../src/data/sat_college_panda2.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT College Panda Set 2 data", e);
        }
      } else if (setId === 'set-3') {
        try {
          const dataModule = await import('../src/data/sat_college_panda3.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT College Panda Set 3 data", e);
        }
      } else if (setId === 'set-4') {
        try {
          const dataModule = await import('../src/data/sat_college_panda4.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT College Panda Set 4 data", e);
        }
      }
    } else if (category === 'Erica Vocabulary') {
      if (setId === 'academic-vocabulary') {
        try {
          const dataModule = await import('../src/data/sat_erica1.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT Erica Set 1 data", e);
        }
      } else if (setId === 'additional-general') {
        try {
          const dataModule = await import('../src/data/sat_erica2.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT Erica Set 2 data", e);
        }
      } else if (setId === 'common-second-meanings') {
        try {
          const dataModule = await import('../src/data/sat_erica3.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT Erica Set 3 data", e);
        }
      } else if (setId === 'look-negative-but-arent') {
        try {
          const dataModule = await import('../src/data/sat_erica4.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT Erica Set 4 data", e);
        }
      } else if (setId === 'set-5') {
        try {
          const dataModule = await import('../src/data/sat_erica5.json');
          const data = dataModule.default || dataModule;
          entries = data.entries || [];
          contextPassage = data.contextPassage;
        } catch (e) {
          console.error("Failed to load SAT Erica Set 5 data", e);
        }
      }
    }

    let customDescription = `SAT vocabulary set from ${category}.`;
    if (category === 'Erica Vocabulary') {
      if (setId === 'academic-vocabulary') customDescription = 'Academic Vocabulary to Know';
      else if (setId === 'additional-general') customDescription = 'Make a Claim / Support / Question / Think About / etc.';
      else if (setId === 'common-second-meanings') customDescription = 'Additional General Vocabulary';
      else if (setId === 'look-negative-but-arent') customDescription = 'Common Second Meanings';
      else if (setId === 'set-5') customDescription = 'Words that Look Negative But Aren\'t';
    }

    const tableId = `system-sat-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${setId}`;
    const existingTable = tables.find(t => t.id === tableId);

    if (existingTable) {
      onNavigateToSystemTable(existingTable);
      return;
    }

    const table: VocabTable = {
      id: tableId,
      title: `${category} - ${displayTitle}`,
      description: customDescription,
      userId: user.id,
      createdAt: Date.now(),
      entries: entries,
      links: [],
      contextPassage: contextPassage
    };
    onNavigateToSystemTable(table);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full animate-in fade-in duration-300">
      {onBack && (
        <button
          onClick={onBack}
          className="group flex items-center space-x-2 text-muted hover:text-text transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Back to Journals</span>
        </button>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 text-center md:text-left mb-12">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <span className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.4em] text-primary mb-2 md:mb-3 block">Standardized Archives</span>
          <h2 className="text-3xl md:text-[42px] lg:text-5xl font-bold font-display text-text leading-tight">System Archives</h2>
          <p className="text-muted mt-2 md:mt-3 max-w-lg leading-relaxed font-sans italic text-xs sm:text-sm">
            Access curated vocabulary banks for standardized tests.
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex p-1 bg-surfaceHighlight rounded-2xl mb-8 w-fit border border-white/5 mx-auto md:mx-0">
        <button
          onClick={() => { setActiveTab('IELTS'); setSelectedSatCategory(null); }}
          className={`px-8 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all ${
            activeTab === 'IELTS'
              ? 'bg-primary text-white shadow-lg'
              : 'text-muted hover:text-text hover:bg-white/5'
          }`}
        >
          IELTS
        </button>
        <button
          onClick={() => setActiveTab('SAT')}
          className={`px-8 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all ${
            activeTab === 'SAT'
              ? 'bg-primary text-white shadow-lg'
              : 'text-muted hover:text-text hover:bg-white/5'
          }`}
        >
          SAT
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'IELTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {ieltsCategories.map((category) => {
              const collectionId = `ielts-${category.toLowerCase()}`;
              const unlocked = isUnlocked(collectionId);
              const cost = ITEM_COSTS[category];

              return (
                <div 
                  key={category} 
                  onClick={unlocked ? () => handleIeltsClick(category) : undefined}
                  className={`group flex flex-col p-6 rounded-3xl bg-surfaceHighlight border border-white/5 transition-all relative overflow-hidden ${unlocked ? 'hover:border-primary/50 cursor-pointer' : 'opacity-70 hover:opacity-100'}`}
                >
                  {unlocked && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                  <h3 className={`text-xl font-bold font-display transition-colors relative z-10 mb-2 ${unlocked ? 'text-text group-hover:text-primary' : 'text-text'}`}>{category}</h3>
                  <p className="text-sm text-muted relative z-10">{category === 'A1' ? '250' : category === 'A2' ? '250' : category === 'B1' ? '300' : category === 'B2' ? '300' : category === 'C1' ? '200' : category === 'C2' ? '200' : '0'} words available</p>
                  
                  {unlocked && (
                    <div className="mt-4 mb-2 space-y-1 relative z-10">
                      {(() => {
                        const mastery = calculateMastery(tables.find(t => t.id === `system-${collectionId}`) as any);
                        return (
                          <>
                            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest text-primary">
                              <span>Mastery</span>
                              <span>{mastery}%</span>
                            </div>
                            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-1000" 
                                style={{ width: `${mastery}%` }}
                              ></div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  
                  {unlocked ? (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                      <span className="text-[10px] uppercase tracking-widest text-muted font-bold">Open Collection</span>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between relative z-10 gap-2">
                       <div className="flex items-center text-purple-500 font-bold text-lg">
                         <Lock className="w-4 h-4 mr-2" />
                         {cost} <span className="text-[10px] uppercase tracking-widest ml-1 text-purple-500/70">Tokens</span>
                       </div>
                       <button 
                         onClick={(e) => handleUnlockCollection(e, category, collectionId)}
                         className="px-6 bg-purple-500/20 hover:bg-purple-500/40 text-purple-500 text-[10px] uppercase tracking-widest font-bold py-2 rounded-full transition-colors whitespace-nowrap"
                       >
                         Unlock
                       </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'SAT' && !selectedSatCategory && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-300">
            {satCategories.map((category) => {
              const collectionId = `sat-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
              const unlocked = isUnlocked(collectionId);
              const cost = ITEM_COSTS[category];

              return (
                <div 
                  key={category} 
                  onClick={unlocked ? () => setSelectedSatCategory(category) : undefined}
                  className={`group flex flex-col p-6 rounded-3xl bg-surfaceHighlight border border-white/5 transition-all relative overflow-hidden ${unlocked ? 'hover:border-primary/50 cursor-pointer' : 'opacity-70 hover:opacity-100'}`}
                >
                  {unlocked && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                  <h3 className={`text-xl font-bold font-display transition-colors relative z-10 mb-2 ${unlocked ? 'text-text group-hover:text-primary' : 'text-text'}`}>{category}</h3>
                  <p className="text-sm text-muted relative z-10">
                    {category === 'College Panda 400' ? '4' : '5'} Sets available
                  </p>
                  
                  {unlocked && (
                    <div className="mt-4 mb-2 space-y-1 relative z-10">
                      {(() => {
                        const categoryTables = tables.filter(t => t.id.startsWith(`system-sat-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`));
                        const totalMastery = categoryTables.reduce((acc, t) => acc + calculateMastery(t), 0);
                        const avgMastery = Math.round(totalMastery / (category === 'College Panda 400' ? 4 : 5));
                        
                        return (
                          <>
                            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest text-primary">
                              <span>Total Mastery</span>
                              <span>{avgMastery}%</span>
                            </div>
                            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-1000" 
                                style={{ width: `${avgMastery}%` }}
                              ></div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  
                  {unlocked ? (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                      <span className="text-[10px] uppercase tracking-widest text-muted font-bold">View Sets</span>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between relative z-10 gap-2">
                       <div className="flex items-center text-purple-500 font-bold text-lg">
                         <Lock className="w-4 h-4 mr-2" />
                         {cost} <span className="text-[10px] uppercase tracking-widest ml-1 text-purple-500/70">Tokens</span>
                       </div>
                       <button 
                         onClick={(e) => handleUnlockCollection(e, category, collectionId)}
                         className="px-6 bg-purple-500/20 hover:bg-purple-500/40 text-purple-500 text-[10px] uppercase tracking-widest font-bold py-2 rounded-full transition-colors whitespace-nowrap"
                       >
                         Unlock
                       </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Nested SAT Sets View */}
        {activeTab === 'SAT' && selectedSatCategory && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setSelectedSatCategory(null)}
              className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-muted hover:text-text mb-6 flex items-center transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to SAT Categories
            </button>
            <h3 className="text-2xl font-bold font-display text-text mb-6">{selectedSatCategory} Sets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(selectedSatCategory === 'College Panda 400' 
                ? [
                    { id: 'set-1', title: 'Set 1', words: 100 },
                    { id: 'set-2', title: 'Set 2', words: 100 },
                    { id: 'set-3', title: 'Set 3', words: 100 },
                    { id: 'set-4', title: 'Set 4', words: 100 }
                  ]
                : [
                    { id: 'academic-vocabulary', title: 'Set 1', words: 40 },
                    { id: 'additional-general', title: 'Set 2', words: 39 },
                    { id: 'common-second-meanings', title: 'Set 3', words: 31 },
                    { id: 'look-negative-but-arent', title: 'Set 4', words: 50 },
                    { id: 'set-5', title: 'Set 5', words: 15 }
                  ]
              ).map((set) => (
                <div 
                  key={set.id} 
                  onClick={() => handleSatSetClick(selectedSatCategory, set.id, set.title)}
                  className="group flex flex-col justify-center items-start p-5 rounded-2xl bg-surfaceHighlight border border-white/5 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h4 className="text-lg font-bold font-display text-text group-hover:text-primary transition-colors z-10">{set.title}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-2 z-10">{set.words} words available</p>
                  
                  {(() => {
                    const tableId = `system-sat-${selectedSatCategory.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${set.id}`;
                    const mastery = calculateMastery(tables.find(t => t.id === tableId) as any);
                    return (
                      <div className="mt-3 w-full space-y-1 relative z-10">
                        <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest text-primary">
                          <span>Result</span>
                          <span>{mastery}%</span>
                        </div>
                        <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all" 
                            style={{ width: `${mastery}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemArchives;
