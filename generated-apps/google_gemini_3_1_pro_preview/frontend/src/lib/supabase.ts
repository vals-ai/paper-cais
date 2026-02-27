import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_PROJECT_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase variables are missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
