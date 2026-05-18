import { useState, useEffect } from 'react'
import { useClient } from '@/hooks/useClient'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import KpiCards from '@/components/KpiCards'
import LineChart from '@/components/Charts/LineChart'
import PieChart from '@/components/Charts/PieChart'
import DateRangePicker, { type DateRange, getDateRangeValue } from '@/components/DateRangePicker'
import { formatNumber } from '@/lib/utils'
import { Building2, Loader2 } from 'lucide-react'

export default function Overview() {
  const { selectedClientId, clients } = useClient()
  const { isAdmin } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last7' })
  const [metrics, setMetrics] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const activePlatforms = selectedClient?.active_platforms || ['twitter']

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }
    fetchData()
  }, [selectedClientId, dateRange])

  const fetchData = async () => {
    setLoading(true)
    const { start, end } = getDateRangeValue(dateRange)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const [{ data: metricsData }, { data: postsData }] = await Promise.all([
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', selectedClientId!)
        .gte('metric_date', startStr)
        .lte('metric_date', endStr)
        .order('metric_date'),
      supabase
        .from('posts')
        .select('*')
        .eq('client_id', selectedClientId!)
        .in('platform', activePlatforms)
        .gte('post_date', startStr)
        .lte('post_date', endStr)
        .order('engagements', { ascending: false })
        .limit(5),
    ])

    setMetrics(metricsData || [])
    setPosts(postsData || [])
    setLoading(false)
  }

  // Aggregate metrics by date for charts
  const dailyMap = new Map<string, any>()
  metrics.forEach((m) => {
    const existing = dailyMap.get(m.metric_date) || { impressions: 0, engagements: 0, posts: 0 }
    dailyMap.set(m.metric_date, {
      impressions: existing.impressions + (m.impressions || 0),
      engagements: existing.engagements + (m.engagements || 0),
      posts: existing.posts + (m.posts_created || 0),
    })
  })
  const sortedDates = Array.from(dailyMap.keys()).sort()
  const chartData = sortedDates.map((d) => ({ date: d, ...dailyMap.get(d) }))

  const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0)
  const totalEngagements = metrics.reduce((sum, m) => sum + (m.engagements || 0), 0)
  const totalPosts = metrics.reduce((sum, m) => sum + (m.posts_created || 0), 0)
  const avgEngagementRate = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(1) : '0'

  const kpis = [
    { label: 'Total Impressions', value: totalImpressions, change: 0, prefix: '' },
    { label: 'Total Engagements', value: totalEngagements, change: 0, prefix: '' },
    { label: 'Engagement Rate', value: parseFloat(avgEngagementRate), change: 0, prefix: '', suffix: '%' },
    { label: 'Posts Published', value: totalPosts, change: 0, prefix: '' },
  ]

  // Platform breakdown
  const platformStats: Record<string, number> = {}
  activePlatforms.forEach((p) => (platformStats[p] = 0))
  metrics.forEach((m) => {
    if (platformStats[m.platform] !== undefined) {
      platformStats[m.platform] += m.engagements || 0
    }
  })

  // No client selected (admin only)
  if (!selectedClientId && isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="font-display text-xl font-medium text-navy mb-2">Select a Client</h2>
          <p className="text-text-secondary">Choose a company from the sidebar dropdown to view their analytics.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">
            {selectedClient ? `${selectedClient.name} Overview` : 'Overview'}
          </h1>
          <p className="text-text-secondary mt-1">Track social media performance across all platforms</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <KpiCards kpis={kpis} />

      {metrics.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No data yet for this client.</p>
          <p className="text-text-muted text-sm mt-1">Upload data via Data Entry → Import JSON or Upload CSV.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Trend</h3>
              <LineChart
                labels={chartData.map((d) => d.date)}
                datasets={[
                  { label: 'Impressions', data: chartData.map((d) => d.impressions), color: '#4479e1' },
                  { label: 'Engagements', data: chartData.map((d) => d.engagements), color: '#1a2332' },
                ]}
              />
            </div>
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Platform Breakdown</h3>
              <PieChart
                labels={activePlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1))}
                data={activePlatforms.map((p) => platformStats[p] || 0)}
                colors={['#1a2332', '#4479e1', '#6b8cae']}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-medium text-navy mb-4">Top Performing Posts</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy/5">
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Platform</th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Post</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Likes</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Engagement</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {posts.map((post: any, i: number) => (
                    <tr key={i} className="hover:bg-cream/50 transition-colors">
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          post.platform === 'twitter' ? 'bg-blue-50 text-blue-700' :
                          post.platform === 'instagram' ? 'bg-pink-50 text-pink-700' :
                          'bg-sky-50 text-sky-700'
                        }`}>
                          {post.platform}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-text-primary max-w-xs truncate">{post.post_text || post.post_url || '—'}</td>
                      <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.likes || post.reactions || 0)}</td>
                      <td className="py-3 text-sm font-medium text-navy text-right">{formatNumber(post.engagements || 0)}</td>
                      <td className="py-3 text-sm text-text-muted text-right">{post.post_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
