import { createClient } from '@supabase/supabase-js/dist/module'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const supabase = Promise.resolve(supabaseClient)
