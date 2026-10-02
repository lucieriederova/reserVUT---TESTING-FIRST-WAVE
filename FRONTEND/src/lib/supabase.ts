/**
 * Supabase client for authentication (sign up / sign in / sign out).
 * Application data (users, reservations, rooms) does NOT go through
 * Supabase's database — it's persisted via the Express backend
 * (`lib/api.ts`) instead. Supabase here is purely the auth provider.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Chybí VITE_SUPABASE_URL nebo VITE_SUPABASE_ANON_KEY v .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
