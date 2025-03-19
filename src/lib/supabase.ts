import { createClient } from '@supabase/supabase-js/dist/module'
import type { SupabaseClient } from '@supabase/supabase-js/dist/module'

let supabaseInstance: SupabaseClient | null = null

async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance
  
  let supabaseUrl: string
  let supabaseAnonKey: string
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // In development mode, use environment variables directly
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Missing Supabase environment variables')
    }
  } else {
    // In production mode, fetch config from PHP endpoint
    try {
      const response = await fetch('/api/get-config.php', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        referrerPolicy: 'strict-origin-when-cross-origin',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch config')
      const config = await response.json()
      if (config.error) throw new Error(config.error)
      
      supabaseUrl = config.SUPABASE_URL
      supabaseAnonKey = config.SUPABASE_ANON_KEY
    } catch (error) {
      console.error('Configuration error:', error)
      throw error
    }
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Export a promise that resolves to the Supabase client
export const supabase = getSupabaseClient()
