import { useState, useEffect } from 'react'
import { supabase, type Post, type DailyMetric } from '@/lib/supabase'
import { type DateRange, getDateRangeValue } from '@/components/DateRangePicker'

interface PlatformData {
  posts: Post[]
  dailyMetrics: DailyMetric[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function usePlatformPosts(clientId: string | null, platform: string, dateRange: DateRange): PlatformData {
  const [posts, setPosts] = useState<Post[]>([])
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([])
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

    Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('client_id', clientId)
        .eq('platform', platform)
        .gte('post_date', startStr)
        .lte('post_date', endStr)
        .order('engagements', { ascending: false }),
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', clientId)
        .eq('platform', platform)
        .gte('metric_date', startStr)
        .lte('metric_date', endStr)
        .order('metric_date'),
    ])
      .then(([postsRes, metricsRes]) => {
        if (postsRes.error) setError(postsRes.error.message)
        else setPosts((postsRes.data || []) as Post[])
        if (metricsRes.error && !error) setError(metricsRes.error.message)
        else setDailyMetrics((metricsRes.data || []) as DailyMetric[])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [clientId, platform, dateRange, refreshKey])

  return { posts, dailyMetrics, loading, error, refresh }
}
