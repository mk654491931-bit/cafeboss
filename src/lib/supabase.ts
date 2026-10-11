import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readEnv(...keys: string[]): string {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  for (const key of keys) {
    const value = env[key];
    if (value) return value;
  }
  return "";
}

const supabaseUrl = readEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const configHint =
  "Supabase yapılandırması eksik. SUPABASE_URL ve SUPABASE_ANON_KEY anahtarlarını tanımlayın.";

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
