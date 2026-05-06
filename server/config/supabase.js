import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnjxubndcqkyiekewbln.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanh1Ym5kY3FreWlla2V3YmxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAxOTU2MywiZXhwIjoyMDkzNTk1NTYzfQ.veVkcEP7ufKeM-fa0uDM-Jy7Ie0SA4owl3HIZCh0DC8';

// Service role key bypasses RLS — safe for server-side use only
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

export default supabase;
