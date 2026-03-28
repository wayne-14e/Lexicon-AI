import { createClient } from '@supabase/supabase-js';

// Use the Vite proxy in development to avoid iframe fetch interception issues
const supabaseUrl = window.location.origin + '/supabase';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aHdwbXhnd2pjc29lYWJ1Z2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTc4NzQsImV4cCI6MjA4NzkzMzg3NH0.ZgsBKqtcm8extReD8-sCEf2N08JofN27I7wHw01sMbs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
