// Service-role client. NEVER import this into client components or expose the key to the browser.
// Only for trusted server-side jobs that must bypass RLS (e.g. granting achievements, cron aggregation).
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set - refusing to create admin client.');
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
