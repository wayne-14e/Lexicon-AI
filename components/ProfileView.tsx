import React, { useState, useEffect, useMemo } from 'react';
import { User, VocabTable, TokenTransaction, MasteryEvent } from '../types';
import { storageService } from '../services/storageService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  Flame, 
  Target, 
  TrendingUp,
  Calendar,
  ChevronDown
} from 'lucide-react';

interface ProfileViewProps {
  user: User;
  tables: VocabTable[];
  onBack: () => void;
  onUserUpdate?: (updatedUser: User) => void;
}

type TokenRange = 'this-week' | 'last-week';
type MasteryRange = 'this-week' | 'last-week';

const getStartOfWeekMonday = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
};

const ProfileView: React.FC<ProfileViewProps> = ({ user, tables, onBack, onUserUpdate }) => {
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
  const [masteryEvents, setMasteryEvents] = useState<MasteryEvent[]>([]);
  const [tokenRange, setTokenRange] = useState<TokenRange>('this-week');
  const [masteryRange, setMasteryRange] = useState<MasteryRange>('this-week');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsername, setEditUsername] = useState(user.username);

  useEffect(() => {
    setEditUsername(user.username);
  }, [user.username]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [transactions, events] = await Promise.all([
          storageService.getTokenTransactions(user.id),
          storageService.getMasteryEvents(user.id)
        ]);
        
        // Sync missing mastery events (for words mastered before the tracker was added)
        const existingMasteredWords = new Set(events.map(e => e.word));
        const masteredWordsInTables = tables.flatMap(t => 
          t.entries.filter(e => (e.progress || 0) >= 80).map(e => e.word)
        );
        
        const missingWords = masteredWordsInTables.filter(w => !existingMasteredWords.has(w));
        let finalEvents = [...events];
        
        if (missingWords.length > 0) {
          const newEvents = missingWords.map(word => ({
            id: crypto.randomUUID(),
            userId: user.id,
            word,
            createdAt: Date.now()
          }));
          
          // Save to database
          for (const event of newEvents) {
            await storageService.addMasteryEvent(event);
          }
          
          finalEvents = [...finalEvents, ...newEvents];
        }

        setTokenTransactions(transactions);
        setMasteryEvents(finalEvents);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.id, tables]);

  // Calculate stats from real data where possible
  const totalWords = tables.reduce((acc, table) => acc + table.entries.length, 0);
  const masteredWords = tables.reduce((acc, table) => 
    acc + table.entries.filter(e => (e.progress || 0) >= 80).length, 0
  );
  
  const currentStreak = user.streak || 1;

  const saveUsername = async () => {
    const trimmedUsername = editUsername.trim();
    if (!trimmedUsername || trimmedUsername === user.username) {
      setIsEditingUsername(false);
      setEditUsername(user.username);
      return;
    }

    try {
      const updatedUser = { ...user, username: trimmedUsername };
      await storageService.updateUser(updatedUser);
      onUserUpdate?.(updatedUser);
      setIsEditingUsername(false);
    } catch (error) {
      console.error('Error updating username:', error);
      setEditUsername(user.username);
      setIsEditingUsername(false);
    }
  };

  // Process Weekly Tokens Data
  const weeklyTokensData = useMemo(() => {
    const now = new Date();
    const startOfThisWeek = getStartOfWeekMonday(now);

    const startOfRange = new Date(startOfThisWeek);
    if (tokenRange === 'last-week') {
      startOfRange.setDate(startOfRange.getDate() - 7);
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map((name, index) => {
      const dayDate = new Date(startOfRange);
      dayDate.setDate(dayDate.getDate() + index);
      const nextDayDate = new Date(dayDate);
      nextDayDate.setDate(nextDayDate.getDate() + 1);

      const dailyTotal = tokenTransactions
        .filter(t => t.amount > 0 && t.createdAt >= dayDate.getTime() && t.createdAt < nextDayDate.getTime())
        .reduce((sum, t) => sum + t.amount, 0);

      return { name, tokens: dailyTotal };
    });

    return data;
  }, [tokenTransactions, tokenRange]);

  // Process Weekly Mastery Data
  const weeklyMasteryData = useMemo(() => {
    const now = new Date();
    const startOfThisWeek = getStartOfWeekMonday(now);

    const startOfRange = new Date(startOfThisWeek);
    if (masteryRange === 'last-week') {
      startOfRange.setDate(startOfRange.getDate() - 7);
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map((name, index) => {
      const dayDate = new Date(startOfRange);
      dayDate.setDate(dayDate.getDate() + index);
      const nextDayDate = new Date(dayDate);
      nextDayDate.setDate(nextDayDate.getDate() + 1);

      const dailyTotal = masteryEvents
        .filter(e => e.createdAt >= dayDate.getTime() && e.createdAt < nextDayDate.getTime())
        .length;

      return { name, words: dailyTotal };
    });

    return data;
  }, [masteryEvents, masteryRange]);

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-muted hover:text-text mb-1 flex items-center transition-colors group"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-surface rounded-2xl border border-white/5 shadow-lg shadow-black/20 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
        
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-surfaceHighlight text-primary flex items-center justify-center text-3xl font-bold border-4 border-surface shadow-lg">
            {(isEditingUsername ? editUsername : user.username).charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2 group">
              {isEditingUsername ? (
                <input 
                  type="text"
                  autoFocus
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  onBlur={saveUsername}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveUsername();
                    if (e.key === 'Escape') {
                      setIsEditingUsername(false);
                      setEditUsername(user.username);
                    }
                  }}
                  className="text-2xl sm:text-5xl font-bold font-display text-text border-b-2 border-primary outline-none bg-transparent py-1"
                />
              ) : (
                <>
                  <h1 className="text-2xl sm:text-5xl font-bold font-display text-text">{user.username}</h1>
                  <button 
                    onClick={() => setIsEditingUsername(true)}
                    className="p-2 text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 bg-surfaceHighlight rounded-full hover:bg-primary/10"
                    title="Edit Username"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
              <div className="flex items-center space-x-1.5 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{currentStreak} Day Streak</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{masteredWords} Words Mastered</span>
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Scholar Tokens</div>
            <div className="text-4xl font-bold font-display text-purple-500">{(user.tokens || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Tokens Tracker */}
        <div className="bg-surface rounded-2xl border border-white/5 shadow-lg shadow-black/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-display text-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Weekly Tokens Earned
            </h3>
            
            <div className="relative group">
              <select 
                value={tokenRange}
                onChange={(e) => setTokenRange(e.target.value as TokenRange)}
                className="appearance-none bg-surfaceHighlight border border-white/5 rounded-lg px-4 py-1.5 pr-10 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-text focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option value="this-week">This Week</option>
                <option value="last-week">Last Week</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
          
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTokensData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e232b" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 10 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#13161c', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#e3e3e3', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#9ca3af', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    cursor={{ stroke: '#1e232b', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#a855f7" 
                    strokeWidth={3} 
                    dot={{ fill: '#a855f7', strokeWidth: 2, r: 4, stroke: '#13161c' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Mastery Progress */}
        <div className="bg-surface rounded-2xl border border-white/5 shadow-lg shadow-black/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-display text-text flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Weekly Words Mastered
            </h3>

            <div className="relative group">
              <select 
                value={masteryRange}
                onChange={(e) => setMasteryRange(e.target.value as MasteryRange)}
                className="appearance-none bg-surfaceHighlight border border-white/5 rounded-lg px-4 py-1.5 pr-10 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-text focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option value="this-week">This Week</option>
                <option value="last-week">Last Week</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
          
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyMasteryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e232b" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 10 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 10 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#13161c', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#e3e3e3', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#9ca3af', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    cursor={{ fill: '#1e232b' }}
                  />
                  <Bar 
                    dataKey="words" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
