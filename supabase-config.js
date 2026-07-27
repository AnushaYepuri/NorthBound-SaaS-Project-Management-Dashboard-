// ============================================
// Supabase project configuration
// ============================================
// 1. Go to https://supabase.com → sign in → New project (free, no card required)
// 2. Once created: Project Settings (gear icon) → API
// 3. Copy the "Project URL" and the "anon public" key below.
//
// The anon key is safe to expose in frontend code — it's designed for
// this. Real security comes from Row Level Security (RLS) policies set
// on your tables (see supabase-setup.sql), not from hiding this file.

export const supabaseConfig = {
  url: "https://ptaatcyxoczfykkxmoyk.supabase.co",   // e.g. https://abcdefgh.supabase.co
  anonKey: "sb_publishable_vZmcEZe2MGf3-c4tkd96Vw_9mwpmfzv"
};
