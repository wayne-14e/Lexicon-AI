/* 
MIGRATION:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
*/

import { User, VocabTable, TokenTransaction, MasteryEvent } from '../types';
import { supabase } from './supabaseClient';

export const storageService = {
  getUserById: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile by id:', error);
      return null;
    }

    return data || null;
  },


  upsertProfile: async (user: User) => {
    console.log('storageService.upsertProfile: Starting for', user.id);
    
    // Option A: Select first to check if profile exists
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.warn('storageService.upsertProfile: Fetch error:', fetchError);
    }

    let profileToSave;
    if (!existing) {
      // First time creation: use the determined username
      profileToSave = {
        ...user,
        tokens: 0,
        streak: 1,
        // username is already in user object from initApp/useEnsureProfile
      };
      console.log('storageService.upsertProfile: Creating new profile:', profileToSave);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileToSave])
        .select()
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          console.log('storageService.upsertProfile: Race condition detected (409), falling back to update');
          // Fetch existing again to be safe
          const { data: latestExisting } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (latestExisting) {
            return await storageService.updateExistingProfile(latestExisting, user);
          }
        }
        console.error('storageService.upsertProfile: INSERT ERROR:', error);
        throw error;
      }
      return data;
    } else {
      return await storageService.updateExistingProfile(existing, user);
    }
  },

  updateExistingProfile: async (existing: User, newUser: User) => {
    // Update existing profile: do NOT overwrite username if it already exists
    const updateData: Partial<User> = {
      email: newUser.email,
      full_name: newUser.full_name,
      avatar_url: newUser.avatar_url,
    };

    // Only set username if it's currently null/empty in DB
    if (!existing.username) {
      updateData.username = newUser.username;
    }

    console.log('storageService.upsertProfile: Updating existing profile:', updateData);

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('storageService.upsertProfile: UPDATE ERROR:', error);
      throw error;
    }
    return data;
  },

  updateProfile: async (user: User) => {
    const { error } = await supabase
      .from('profiles')
      .upsert([user]);
    if (error) console.error('Error updating profile:', error);
  },

  updateProfileField: async (userId: string, field: keyof User, value: any) => {
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId);
    if (error) console.error(`Error updating profile field ${field}:`, error);
  },

  findProfileByName: async (username: string): Promise<User | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .single();
    
    return data || null;
  },

  findProfileByEmail: async (email: string): Promise<User | null> => {
    const { data } = await supabase
      .from('profiles')
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
      throw new Error(`Token Transaction Failed: ${error.message}`);
    }
  },

  updateUserTokens: async (userId: string, newTokens: number): Promise<boolean> => {
    const { error } = await supabase
      .from('profiles')
      .update({ tokens: newTokens })
      .eq('id', userId);
    
    if (error) {
      console.error('CRITICAL: Error updating tokens:', error);
      return false;
    }
    return true;
  },

  syncUserTokenBalanceFromTransactions: async (userId: string): Promise<number | null> => {
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
    
    const { error } = await supabase
      .from('profiles')
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
    
    // Fetch latest user data to ensure we have current usage counts
    const { data: latestUser, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !latestUser) {
       console.error("Error fetching latest profile for limit status:", error);
       return { used: 0, max: LIMITS[limitType], allowed: false };
    }

    const activeUser = await storageService.checkAndResetDailyLimits(latestUser);
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
      .from('profiles')
      .update({ [limitType]: newUsage })
      .eq('id', user.id);
      
    if (error) {
      console.error(`Error incrementing limit ${limitType}:`, error);
      return null;
    }

    return newUsage;
  },

};
