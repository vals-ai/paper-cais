import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || 'http://10.0.0.17:42225';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDg3NDQxMTkwLCJpYXQiOjE3NzIwODExOTAsImlzcyI6InN1cGFiYXNlIiwicm9sZSI6ImFub24ifQ.Rtwu8CWdl2hKW5Vze9jPyFXAyw88c3o-nAaBWcdE_cs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
