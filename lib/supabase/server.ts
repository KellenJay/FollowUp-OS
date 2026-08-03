import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Server-only client using the service-role key, which bypasses Row Level
// Security. Never import this from a "use client" component — it must only
// run in API routes, server components, and cron handlers.
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function supabaseServer() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  cached = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}
