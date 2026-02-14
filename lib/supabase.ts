
import { createClient } from '@supabase/supabase-js';

// Access environment variables. Note: In some environments these might be on process.env 
// or injected via other means. 
const supabaseUrl = (process.env as any).SUPABASE_URL;
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY;

// Only initialize if we have the required credentials to prevent "supabaseUrl is required" crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY) are missing. Persistence is running in Local Storage mode only.");
}
