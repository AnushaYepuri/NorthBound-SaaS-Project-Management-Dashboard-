import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  // ...options here, or nothing at all
})