/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

async function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance
  
  if (process.env.NODE_ENV === 'development') {
    // Development: Use environment variables
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    
    if (typeof url !== 'string' || typeof key !== 'string') {
      throw new Error('Invalid Supabase credentials')
    }
    
    supabaseInstance = createClient(url, key)
  } else {
    // Production: Use PHP endpoint
    const response = await fetch('/api/get-config.php')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const config = await response.json()
    supabaseInstance = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  }
  
  return supabaseInstance
}

// Export a promise that resolves to the Supabase client
export const supabase = getSupabaseClient()
