/**
 * Supabase client — anon/publishable key only.
 * Per AGENT_RULES.md: Only the Supabase anon key may appear in frontend code.
 * The secret/service role key MUST NEVER be used here.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

if (import.meta.env.DEV) {
  const supabaseUrlRegex = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;
  if (!supabaseUrlRegex.test(supabaseUrl.trim())) {
    console.warn(
      `[Supabase Client Warning] VITE_SUPABASE_URL ("${supabaseUrl}") does not match the standard pattern https://<id>.supabase.co.`
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type SupabaseClient = typeof supabase;
