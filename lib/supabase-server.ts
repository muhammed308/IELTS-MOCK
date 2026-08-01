import { createClient } from '@supabase/supabase-js';

// This client uses the service role key and must ONLY be imported
// in server-side code: API routes, server components, server actions.
// Never import this in a 'use client' file — the key would leak to
// the browser and let anyone bypass Row Level Security.
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}