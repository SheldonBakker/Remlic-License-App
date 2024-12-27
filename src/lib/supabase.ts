import { createClient } from '@supabase/supabase-js/dist/module'
import type { SupabaseClient } from '@supabase/supabase-js/dist/module'

let supabaseInstance: SupabaseClient | null = null

async function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance
  
  let config
  
  if (import.meta.env.DEV) {
    config = {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
    }
  } else {
    // Fetch config from PHP endpoint in production
    const response = await fetch('/api/get-config.php') 
    config = await response.json()
  }
  
  supabaseInstance = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  return supabaseInstance
}

// Export a promise that resolves to the Supabase client
export const supabase = getSupabaseClient()
