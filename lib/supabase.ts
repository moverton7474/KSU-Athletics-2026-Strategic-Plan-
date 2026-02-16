
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://pygjtypiblbkuvhltigv.supabase.co';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Z2p0eXBpYmxia3V2aGx0aWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDA5NTgsImV4cCI6MjA4NjYxNjk1OH0.0E9hPJsjeZ0zgLoLwOvfoZcQEkySVzyY_T77WKACauo';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * 🚀 STRATEGIC OPERATOR DATABASE MIGRATION (V2)
 * Copy and paste this into your Supabase SQL Editor:
 * 
 * -- Create Strategic Plan Table (Tactical/Tasks)
 * CREATE TABLE IF NOT EXISTS public.strategic_plan (
 *     plan_key TEXT PRIMARY KEY,
 *     data JSONB NOT NULL DEFAULT '[]',
 *     updated_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- Create Strategic Knowledge Table (Second Brain/Intelligence)
 * CREATE TABLE IF NOT EXISTS public.strategic_knowledge (
 *     kb_key TEXT PRIMARY KEY,
 *     content JSONB NOT NULL DEFAULT '{}',
 *     updated_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- NEW: Create Collaborators Table (RBAC Sync)
 * CREATE TABLE IF NOT EXISTS public.strategic_collaborators (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     name TEXT NOT NULL,
 *     email TEXT UNIQUE NOT NULL,
 *     role TEXT NOT NULL DEFAULT 'Contributor',
 *     last_active TEXT,
 *     created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- Enable Security
 * ALTER TABLE public.strategic_plan ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.strategic_knowledge ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.strategic_collaborators ENABLE ROW LEVEL SECURITY;
 * 
 * -- Public Access Policies (Development Mode)
 * CREATE POLICY "Public Access Plan" ON public.strategic_plan FOR ALL USING (true) WITH CHECK (true);
 * CREATE POLICY "Public Access Knowledge" ON public.strategic_knowledge FOR ALL USING (true) WITH CHECK (true);
 * CREATE POLICY "Public Access Collaborators" ON public.strategic_collaborators FOR ALL USING (true) WITH CHECK (true);
 */
