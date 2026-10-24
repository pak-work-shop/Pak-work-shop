import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { env } from './env';

// Create a single typed Supabase client using only the public URL and publishable key.
// When environment variables are missing, fallback placeholder values prevent createClient
// from throwing at module load time so the "Configuration required" screen can render cleanly.
const safeUrl = env.supabaseUrl || 'https://placeholder-unconfigured.supabase.co';
const safeKey = env.supabasePublishableKey || 'placeholder-publishable-key';

export const supabase: SupabaseClient<Database> = createClient<Database>(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
