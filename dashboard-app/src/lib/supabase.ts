import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

declare global {
  interface Window {
    ENV?: {
      VITE_SUPABASE_URL?: string
      VITE_SUPABASE_ANON_KEY?: string
    }
  }
}

// Support runtime env vars via window.ENV (for static deployments)
// Falls back to Vite build-time env vars, then placeholders
const supabaseUrl = window.ENV?.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || ''
const supabaseAnonKey = window.ENV?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''

const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey && supabaseAnonKey !== 'placeholder-key'

if (!isConfigured) {
  console.warn('Supabase environment variables not set. Dashboard will show mock data only.')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type DailyMetric = Database['public']['Tables']['daily_metrics']['Row']
export type EngagementOrder = Database['public']['Tables']['engagement_orders']['Row']
