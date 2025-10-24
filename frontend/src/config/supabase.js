import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://skarfonlmsifljkcbphg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYXJmb25sbXNpZmxqa2NicGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTk3ODgsImV4cCI6MjA3Njg5NTc4OH0.QPh991Bqg7Gd68td91FKHpXZ4lyTxAEvDbXC1n0utEQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
