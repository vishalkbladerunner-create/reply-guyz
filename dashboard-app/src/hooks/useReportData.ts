import { useState, useEffect, useMemo } from 'react'
import { supabase, type Post, type DailyMetric } from '@/lib/supabase'
import { type DateRange, getDateRangeValue } from '@/components/DateRangePicker'
import { subDays, differenceInDays } from 'date-fns'

interface ReportStats {
  totalPosts: number
  totalLikes: number
  totalReposts: number
  totalComments: number
  totalReactions: number
  totalEngagements: number
  totalImpressions: number
  avgEngagement: number
  bestPostScore: number
}

interface ReportData {
  posts: Post[]
  previousPosts: Post[]
  dailyMetrics: DailyMetric[]
  currentStats: ReportStats
  previousStats: ReportStats
  loading: boolean
  error: string | null
  refresh: () => void
}

function computeStats(posts: Post[], metrics: DailyMetric[]): ReportStats {
  const totalPosts = posts.length
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0)
  const totalReposts = posts.reduce((s, p) => s + (p.reposts || 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0)
  const totalReactions = posts.reduce((s, p) => s + (p.reactions || 0), 0)
  const totalEngagements = totalLikes + totalReposts + totalComments + totalReactions
  const totalImpressions = metrics.reduce((s, m) => s + (m.impressions || 0), 0)
  const avgEngagement = totalPosts > 0 ? totalEngagements / totalPosts : 0
  const bestPostScore = posts.length > 0 ? Math.max(...posts.map((p) => p.engagements || 0)) : 0

  return {
    totalPosts, totalLikes, totalReposts, totalComments, totalReactions,
    totalEngagements, totalImpressions, avgEngagement, bestPostScore,
  }
}

export function useReportData(clientId: string | null, dateRange: DateRange): ReportData {
  const [posts, setPosts] = useState<Post[]>([])
  const [previousPosts, setPreviousPosts] = useState<Post[]>([])
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

    const daysDiff = differenceInDays(end, start)
    const prevEnd = subDays(start, 1)
    const prevStart = subDays(prevEnd, daysDiff)
    const prevStartStr = prevStart.toISOString().split('T')[0]
    const prevEndStr = prevEnd.toISOString().split('T')[0]

    Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('client_id', clientId)
        .gte('post_date', startStr)
        .lte('post_date', endStr)
        .order('engagements', { ascending: false }),
      supabase
        .from('posts')
        .select('*')
        .eq('client_id', clientId)
        .gte('post_date', prevStartStr)
        .lte('post_date', prevEndStr)
        .order('engagements', { ascending: false }),
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', clientId)
        .gte('metric_date', startStr)
        .lte('metric_date', endStr)
        .order('metric_date'),
    ])
      .then(([curRes, prevRes, metricsRes]) => {
        if (curRes.error) setError(curRes.error.message)
        else setPosts((curRes.data || []) as Post[])
        if (prevRes.error && !error) setError(prevRes.error.message)
        else setPreviousPosts((prevRes.data || []) as Post[])
        if (metricsRes.error && !error) setError(metricsRes.error.message)
        else setDailyMetrics((metricsRes.data || []) as DailyMetric[])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [clientId, dateRange, refreshKey])

  const currentStats = useMemo(() => computeStats(posts, dailyMetrics), [posts, dailyMetrics])
  const previousStats = useMemo(() => computeStats(previousPosts, []), [previousPosts])

  return {
    posts, previousPosts, dailyMetrics,
    currentStats, previousStats,
    loading, error, refresh,
  }
}
