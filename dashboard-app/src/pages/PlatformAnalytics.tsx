import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useClient } from '@/hooks/useClient'
import { supabase } from '@/lib/supabase'
import { Heart, Repeat, MessageCircle, Eye, Loader2 } from 'lucide-react'
import KpiCards from '@/components/KpiCards'
import LineChart from '@/components/Charts/LineChart'
import BarChart from '@/components/Charts/BarChart'
import DateRangePicker, { type DateRange, getDateRangeValue } from '@/components/DateRangePicker'
import { formatNumber } from '@/lib/utils'

const platformNames: Record<string, string> = {
  twitter: 'Twitter / X',
  instagram: 'Instagram',
  telegram: 'Telegram',
}

const platformColors: Record<string, string> = {
  twitter: '#1a2332',
  instagram: '#4479e1',
  telegram: '#6b8cae',
}

export default function PlatformAnalytics() {
  const { platform = 'twitter' } = useParams<{ platform: string }>()
  const { selectedClientId } = useClient()
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last30' })
  const [posts, setPosts] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }
    fetchData()
  }, [platform, selectedClientId, dateRange])

  const fetchData = async () => {
    setLoading(true)
    const { start, end } = getDateRangeValue(dateRange)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const [{ data: postsData }, { data: metricsData }] = await Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('client_id', selectedClientId!)
        .eq('platform', platform)
        .gte('post_date', startStr)
        .lte('post_date', endStr)
        .order('post_date', { ascending: false }),
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', selectedClientId!)
        .eq('platform', platform)
        .gte('metric_date', startStr)
        .lte('metric_date', endStr)
        .order('metric_date'),
    ])

    setPosts(postsData || [])
    setMetrics(metricsData || [])
    setLoading(false)
  }

  if (!selectedClientId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-medium text-navy mb-2">Select a Client</h2>
          <p className="text-text-secondary">Choose a company from the sidebar to view platform analytics.</p>
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

  const totalPosts = posts.length
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0)
  const totalReposts = posts.reduce((sum, p) => sum + (p.reposts || 0), 0)
  const totalImpressions = posts.reduce((sum, p) => sum + (p.impressions || 0), 0)
  const totalEngagements = posts.reduce((sum, p) => sum + (p.engagements || 0), 0)
  const avgEngagementRate = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(1) : '0'

  const kpis = [
    { label: 'Total Posts', value: totalPosts, prefix: '' },
    { label: 'Total Likes', value: totalLikes, prefix: '' },
    { label: 'Total Reposts', value: totalReposts, prefix: '' },
    { label: 'Avg Engagement Rate', value: parseFloat(avgEngagementRate), suffix: '%' },
  ]

  const dates = metrics.map((d) => d.metric_date)
  const impressionsData = metrics.map((d) => d.impressions || 0)
  const engagementsData = metrics.map((d) => d.engagements || 0)
  const likesData = metrics.map((d) => d.likes || 0)
  const repostsData = metrics.map((d) => d.reposts || 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">{platformNames[platform]}</h1>
          <p className="text-text-secondary mt-1">Detailed analytics for {platformNames[platform]}</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <KpiCards kpis={kpis} />

      {posts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No {platformNames[platform]} data yet for this client.</p>
          <p className="text-text-muted text-sm mt-1">Upload data via Data Entry → Import JSON.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Daily Performance</h3>
              <LineChart
                labels={dates}
                datasets={[
                  { label: 'Impressions', data: impressionsData, color: platformColors[platform] },
                  { label: 'Engagements', data: engagementsData, color: '#4479e1' },
                ]}
              />
            </div>
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Breakdown</h3>
              <BarChart
                labels={dates}
                datasets={[
                  { label: 'Likes', data: likesData, color: '#4479e1' },
                  { label: 'Reposts', data: repostsData, color: platformColors[platform] },
                ]}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-medium text-navy mb-4">Post Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy/5">
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Date</th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Post</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">
                      <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> Likes</span>
                    </th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">
                      <span className="inline-flex items-center gap-1"><Repeat className="w-3 h-3" /> Reposts</span>
                    </th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">
                      <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Comments</span>
                    </th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">
                      <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Impressions</span>
                    </th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Eng. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {posts.map((post, i) => {
                    const er = post.impressions > 0 ? ((post.engagements / post.impressions) * 100).toFixed(1) : '0'
                    return (
                      <tr key={i} className="hover:bg-cream/50 transition-colors">
                        <td className="py-3 text-sm text-text-muted whitespace-nowrap">{post.post_date}</td>
                        <td className="py-3 text-sm text-text-primary max-w-sm truncate">{post.post_text || post.post_url || '—'}</td>
                        <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.likes || post.reactions || 0)}</td>
                        <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.reposts || 0)}</td>
                        <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.comments || 0)}</td>
                        <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.impressions || 0)}</td>
                        <td className="py-3 text-sm font-medium text-navy text-right">{er}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
