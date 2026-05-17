import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type DailyMetric = Database['public']['Tables']['daily_metrics']['Row']
export type EngagementOrder = Database['public']['Tables']['engagement_orders']['Row']
