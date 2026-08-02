import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let clerkSupabaseClient: SupabaseClient | null = null;
let lastGetToken: ((options?: { template?: string }) => Promise<string | null>) | null = null;

// Dynamic Clerk-authenticated client factory
export const createClerkSupabaseClient = (
  getToken: (options?: { template?: string }) => Promise<string | null>
) => {
  lastGetToken = getToken;
  
  if (!clerkSupabaseClient) {
    clerkSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = lastGetToken ? await lastGetToken({ template: 'supabase' }) : null;
          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
          return fetch(url, { ...options, headers });
        },
      },
    });
  }
  
  return clerkSupabaseClient;
};
