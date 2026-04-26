
import { User, VocabTable, TokenTransaction, MasteryEvent } from '../types';
import { supabase } from './supabaseClient';

const KEYS = {
  USER: 'lexicon_user', // Current logged in session
};

export const storageService = {
  getUserById: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user by id:', error);
      return null;
    }

    return data || null;
  },

  getCurrentUser: async (): Promise<User | null> => {
    // Check Supabase Auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      // Sync local DB user
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (data) {
        const finalUser = { ...data, email: authUser.email };
        localStorage.setItem(KEYS.USER, JSON.stringify(finalUser));
        return finalUser;
      }
    }

    const userStr = localStorage.getItem(KEYS.USER);
    if (!userStr) return null;
    
    const localUser: User = JSON.parse(userStr);
    
    // Fetch latest user data from Supabase to ensure tokens and streak are synced
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', localUser.id)
      .single();
      
    if (!data) {
      // If user doesn't exist in Supabase, insert them
      const { error: insertError } = await supabase.from('users').insert([localUser]);
      if (insertError) {
        console.error('Error syncing user to Supabase:', insertError);
      }
      return localUser;
    }
    
    // Update local storage with latest data from Supabase
    const syncedUser = { ...localUser, ...data };
    localStorage.setItem(KEYS.USER, JSON.stringify(syncedUser));
    
    return syncedUser;
  },

  signInWithEmail: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  signUpWithEmail: async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password 
    });
    
    if (data.user && !error) {
      // Insert custom user record without plain text password
      const newUser: User = {
        id: data.user.id,
        username,
        email,
        streak: 1,
        tokens: 0,
      };
      await supabase.from('users').upsert([newUser]);
      localStorage.setItem(KEYS.USER, JSON.stringify(newUser));
    }
    return { data, error };
  },

  sendPasswordReset: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
  },

  onPasswordRecovery: (callback: () => void) => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        callback();
      }
    });
    return data.subscription.unsubscribe;
  },

  updateAuthPassword: async (password: string) => {
    return await supabase.auth.updateUser({ password });
  },

  setCurrentUser: async (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    
    // Also ensure they are in the registry
    const { error } = await supabase
      .from('users')
      .upsert([user]);

    if (error) {
      console.error('Error syncing user to Supabase:', error);
    }
  },

  updateUser: async (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    const { error } = await supabase
      .from('users')
      .upsert([user]);
    if (error) console.error('Error updating user:', error);
  },

  updateUserField: async (userId: string, field: keyof User, value: any) => {
    const { error } = await supabase
      .from('users')
      .update({ [field]: value })
      .eq('id', userId);
    if (error) console.error(`Error updating user field ${field}:`, error);
  },

  findUserByName: async (username: string): Promise<User | null> => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .single();
    
    return data || null;
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    return data || null;
  },

  getTables: async (userId: string): Promise<VocabTable[]> => {
    const { data, error } = await supabase
      .from('vocab_tables')
      .select('*')
      .eq('userId', userId);
      
    if (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
    return data || [];
  },

  saveTable: async (table: VocabTable) => {
    const { error } = await supabase
      .from('vocab_tables')
      .upsert([table]);
      
    if (error) console.error('Error saving table:', error);
  },

  deleteTable: async (id: string) => {
    const { error } = await supabase
      .from('vocab_tables')
      .delete()
      .eq('id', id);
      
    if (error) console.error('Error deleting table:', error);
  },

  getNotes: async (userId: string): Promise<string> => {
    const { data, error } = await supabase
      .from('notes')
      .select('content')
      .eq('userId', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
      console.error('Error fetching notes:', error);
    }
    return data?.content || '';
  },

  saveNotes: async (userId: string, notes: string) => {
    const { error } = await supabase
      .from('notes')
      .upsert([{ userId, content: notes }]);
      
    if (error) console.error('Error saving notes:', error);
  },

  addTokenTransaction: async (transaction: TokenTransaction) => {
    const { error } = await supabase
      .from('token_transactions')
      .insert([transaction]);
    if (error) {
      console.error('CRITICAL: Error saving token transaction:', error);
      // We'll throw so the caller knows it failed
      throw new Error(`Token Transaction Failed: ${error.message}`);
    }
  },

  updateUserTokens: async (userId: string, newTokens: number): Promise<boolean> => {
    console.log(`Directly updating tokens to ${newTokens} for user ${userId}`);
    const { error } = await supabase
      .from('users')
      .update({ tokens: newTokens })
      .eq('id', userId);
    
    if (error) {
      console.error('CRITICAL: Error updating tokens:', error);
      return false;
    }
    return true;
  },

  syncUserTokenBalanceFromTransactions: async (userId: string): Promise<number | null> => {
    // Keep this as a recovery utility, but don't rely on it for every transaction
    const { data, error } = await supabase
      .from('token_transactions')
      .select('amount')
      .eq('userId', userId);

    if (error) {
      console.error('CRITICAL: Error fetching transactions for token sync:', error);
      return null;
    }

    const totalTokens = (data || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const success = await storageService.updateUserTokens(userId, totalTokens);
    return success ? totalTokens : null;
  },

  getTokenTransactions: async (userId: string): Promise<TokenTransaction[]> => {
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: true });
    if (error) {
      console.error('Error fetching token transactions:', error);
      return [];
    }
    return data || [];
  },

  addMasteryEvent: async (event: MasteryEvent) => {
    const { error } = await supabase
      .from('mastery_events')
      .insert([event]);
    if (error) console.error('Error saving mastery event:', error);
  },

  getMasteryEvents: async (userId: string): Promise<MasteryEvent[]> => {
    const { data, error } = await supabase
      .from('mastery_events')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: true });
    if (error) {
      console.error('Error fetching mastery events:', error);
      return [];
    }
    return data || [];
  },

  checkAndResetDailyLimits: async (user: User): Promise<User> => {
    const today = new Date().toISOString().split('T')[0];
    
    if (user.limits_last_reset_date === today) {
      return user;
    }

    const resetLimits = {
      words_generated: 0,
      narratives_used: 0,
      document_uploads_used: 0,
      lexy_prompts_used: 0,
      ai_refills_used: 0,
      tts_used: 0,
      limits_last_reset_date: today
    };

    const updatedUser = { ...user, ...resetLimits };
    localStorage.setItem(KEYS.USER, JSON.stringify(updatedUser));
    
    const { error } = await supabase
      .from('users')
      .update(resetLimits)
      .eq('id', user.id);
      
    if (error) console.error('Error resetting daily limits:', error);
    
    return updatedUser;
  },

  getLimitStatus: async (
    user: User, 
    limitType: 'words_generated' | 'narratives_used' | 'document_uploads_used' | 'lexy_prompts_used' | 'ai_refills_used' | 'tts_used',
    amount: number = 1
  ): Promise<{ used: number, max: number, allowed: boolean }> => {
    const LIMITS = {
      words_generated: 40,
      narratives_used: 2,
      document_uploads_used: 3,
      lexy_prompts_used: 10,
      ai_refills_used: 4,
      tts_used: 30
    };
    
    const activeUser = await storageService.checkAndResetDailyLimits(user);
    const currentUsage = activeUser[limitType] || 0;
    
    return {
      used: currentUsage,
      max: LIMITS[limitType],
      allowed: (currentUsage + amount) <= LIMITS[limitType]
    };
  },

  incrementLimitUsage: async (
    user: User, 
    limitType: 'words_generated' | 'narratives_used' | 'document_uploads_used' | 'lexy_prompts_used' | 'ai_refills_used' | 'tts_used',
    amount: number = 1
  ): Promise<number | null> => {
    const status = await storageService.getLimitStatus(user, limitType, amount);

    if (!status.allowed) {
      return null; // Limit reached
    }

    const newUsage = status.used + amount;
    const { error } = await supabase
      .from('users')
      .update({ [limitType]: newUsage })
      .eq('id', user.id);
      
    if (error) {
      console.error(`Error incrementing limit ${limitType}:`, error);
      return null;
    }

    return newUsage;
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(KEYS.USER);
  }
};
