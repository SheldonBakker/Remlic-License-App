import { createClient } from '@supabase/supabase-js/dist/module'
import type { SupabaseClient } from '@supabase/supabase-js/dist/module'

let supabaseInstance: SupabaseClient | null = null

async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance
  
  let config
  
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
    config = await response.json()
    if (config.error) throw new Error(config.error)
  } catch (error) {
    console.error('Configuration error:', error)
    throw error
  }
  
  supabaseInstance = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  return supabaseInstance
}

// Export a promise that resolves to the Supabase client
export const supabase = getSupabaseClient()
