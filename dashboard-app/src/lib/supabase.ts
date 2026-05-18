import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
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
