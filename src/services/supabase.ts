import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log environment variable status (only in development)
if (import.meta.env.DEV) {
  
  // Log the actual values in development (but mask the key)
  if (supabaseUrl) {
  }
  if (supabaseAnonKey) {
  }
}

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY')
}

if (!supabaseUrl.includes('.supabase.co')) {
  throw new Error('Invalid Supabase URL: must contain .supabase.co')
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid Supabase URL: must use HTTPS protocol')
}

const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'quick-capture'
    }
  }
})

export const supabase = supabaseClient

export function clearSession() {
  supabaseClient.auth.signOut()
} 