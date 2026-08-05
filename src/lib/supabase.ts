import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment variables are not configured. ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'zaphonx_auth',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-name': 'zaphonx-terminal',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
