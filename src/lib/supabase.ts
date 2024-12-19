import { createClient } from '@supabase/supabase-js/dist/module'
import type { SupabaseClient } from '@supabase/supabase-js/dist/module'

let supabaseInstance: SupabaseClient | null = null

async function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance
  
  // Use environment variables for both production and development
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  supabaseInstance = createClient(supabaseUrl, supabaseKey)
  return supabaseInstance
}

// Export a promise that resolves to the Supabase client
export const supabase = getSupabaseClient()
