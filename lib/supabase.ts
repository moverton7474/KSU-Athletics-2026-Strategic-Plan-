
import { createClient } from '@supabase/supabase-js';

// Access environment variables if available, otherwise fallback to the provided credentials
const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://pygjtypiblbkuvhltigv.supabase.co';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Z2p0eXBpYmxia3V2aGx0aWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDA5NTgsImV4cCI6MjA4NjYxNjk1OH0.0E9hPJsjeZ0zgLoLwOvfoZcQEkySVzyY_T77WKACauo';

// Only initialize if we have the required credentials to prevent "supabaseUrl is required" crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("Supabase credentials missing. Persistence is running in Local Storage mode only.");
} else {
  console.log("Supabase initialized with project ID: pygjtypiblbkuvhltigv");
}
