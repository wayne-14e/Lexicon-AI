import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
// In development, we can use the Vite proxy to avoid CORS issues
// In production, use the actual Supabase URL
const isDevelopment = import.meta.env.DEV;

const supabaseUrl = isDevelopment 
  ? window.location.origin + '/supabase'
  : import.meta.env.VITE_SUPABASE_URL || 'https://uthwpmxgwjcsoeabugbi.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aHdwbXhnd2pjc29lYWJ1Z2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTc4NzQsImV4cCI6MjA4NzkzMzg3NH0.ZgsBKqtcm8extReD8-sCEf2N08JofN27I7wHw01sMbs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
