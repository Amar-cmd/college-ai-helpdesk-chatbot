import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "./env";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseBrowserEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}