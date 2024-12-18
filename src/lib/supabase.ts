import { createClient } from '@supabase/supabase-js/dist/module'
import type { SupabaseClient } from '@supabase/supabase-js/dist/module'

let supabaseInstance: SupabaseClient | null = null

async function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance
  
  let supabaseUrl: string
  let supabaseKey: string

  if (import.meta.env.PROD) {
    // Fetch credentials from PHP config in production
    const response = await fetch('/api/get-config.php')
    const config = await response.json()
    supabaseUrl = config.SUPABASE_URL
    supabaseKey = config.SUPABASE_ANON_KEY
  } else {
    // Use environment variables in development
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseKey)
  return supabaseInstance
}

// Export a promise that resolves to the Supabase client
export const supabase = getSupabaseClient()
