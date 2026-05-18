import { useState, useEffect } from 'react'
import { supabase, type Post, type DailyMetric, type EngagementOrder } from '@/lib/supabase'
import { type DateRange, getDateRangeValue } from '@/components/DateRangePicker'

interface DashboardData {
  posts: Post[]
  dailyMetrics: DailyMetric[]
  engagementOrders: EngagementOrder[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDashboardData(clientId: string | null, dateRange: DateRange, activePlatforms?: string[]): DashboardData {
  const [posts, setPosts] = useState<Post[]>([])
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([])
  const [engagementOrders, setEngagementOrders] = useState<EngagementOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    if (!clientId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { start, end } = getDateRangeValue(dateRange)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const platformsFilter = activePlatforms?.length ? activePlatforms : ['twitter', 'instagram', 'telegram']

    Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('client_id', clientId)
        .in('platform', platformsFilter)
        .gte('post_date', startStr)
        .lte('post_date', endStr)
        .order('engagements', { ascending: false }),
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', clientId)
        .gte('metric_date', startStr)
        .lte('metric_date', endStr)
        .order('metric_date'),
      supabase
        .from('engagement_orders')
        .select('*')
        .eq('client_id', clientId)
        .order('order_date', { ascending: false }),
    ])
      .then(([postsRes, metricsRes, ordersRes]) => {
        if (postsRes.error) setError(postsRes.error.message)
        else setPosts((postsRes.data || []) as Post[])
        if (metricsRes.error && !error) setError(metricsRes.error.message)
        else setDailyMetrics((metricsRes.data || []) as DailyMetric[])
        if (ordersRes.error && !error) setError(ordersRes.error.message)
        else setEngagementOrders((ordersRes.data || []) as EngagementOrder[])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [clientId, dateRange, refreshKey])

  return { posts, dailyMetrics, engagementOrders, loading, error, refresh }
}
