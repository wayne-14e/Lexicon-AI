
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

  findUserByName: async (username: string): Promise<User | null> => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
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
    if (error) console.error('Error saving token transaction:', error);
  },

  syncUserTokenBalanceFromTransactions: async (userId: string): Promise<number | null> => {
    const { data, error } = await supabase
      .from('token_transactions')
      .select('amount')
      .eq('userId', userId);

    if (error) {
      console.error('Error fetching transactions for token sync:', error);
      return null;
    }

    const totalTokens = (data || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const { error: updateError } = await supabase
      .from('users')
      .update({ tokens: totalTokens })
      .eq('id', userId);

    if (updateError) {
      console.error('Error syncing tokens to users table:', updateError);
      return null;
    }

    return totalTokens;
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

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(KEYS.USER);
  }
};
