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

const supabaseUrl = window.ENV?.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || ''
const supabaseAnonKey = window.ENV?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''

const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey && supabaseAnonKey !== 'placeholder-key'

if (!isConfigured) {
  console.warn('Supabase environment variables not set. Dashboard will show mock data only.')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      storageKey: 'replyguyz-auth-token',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { 'x-application-name': 'replyguyz-dashboard' },
    },
    realtime: {
      timeout: 15000,
    },
  }
)

// Refresh session every 10 minutes to keep token alive
let refreshTimer: ReturnType<typeof setInterval> | null = null

export function startSessionRefresh() {
  if (refreshTimer) return
  refreshTimer = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.auth.refreshSession(session)
        if (!data.session) {
          console.warn('Session refresh failed, user may need to re-login')
        }
      }
    } catch {
      // silent fail — let autoRefreshToken handle it
    }
  }, 10 * 60 * 1000) // every 10 minutes
}

export function stopSessionRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type DailyMetric = Database['public']['Tables']['daily_metrics']['Row']
export type EngagementOrder = Database['public']['Tables']['engagement_orders']['Row']
