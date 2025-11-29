import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// NOTE: This uses the same public anon key as the web frontend.
// In a real production app you would usually keep this in env vars.
const SUPABASE_URL = 'https://skarfonlmsifljkcbphg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYXJmb25sbXNpZmxqa2NicGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTk3ODgsImV4cCI6MjA3Njg5NTc4OH0.QPh991Bqg7Gd68td91FKHpXZ4lyTxAEvDbXC1n0utEQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: undefined,
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
