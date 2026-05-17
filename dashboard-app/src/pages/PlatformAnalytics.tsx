import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Heart, Repeat, MessageCircle, Eye } from 'lucide-react'
import KpiCards from '@/components/KpiCards'
import LineChart from '@/components/Charts/LineChart'
import BarChart from '@/components/Charts/BarChart'
import DateRangePicker, { type DateRange, getDateRangeValue } from '@/components/DateRangePicker'
import { formatNumber } from '@/lib/utils'

const platformData: Record<string, {
  posts: Array<{
    date: string
    text: string
    likes: number
    reposts: number
    comments: number
    impressions: number
    engagement: number
    engagementRate: number
    url?: string
  }>
  daily: Array<{
    date: string
    posts: number
    impressions: number
    engagements: number
    likes: number
    reposts: number
  }>
}> = {
  twitter: {
    posts: [
      { date: '2026-05-04', text: 'Catch up on the hottest crypto news over the weekend...', likes: 49, reposts: 24, comments: 8, impressions: 1047, engagement: 147, engagementRate: 14.04 },
      { date: '2026-05-04', text: '$BTC MARKET STRUCTURE — Bitcoin has outperformed...', likes: 52, reposts: 27, comments: 8, impressions: 1988, engagement: 192, engagementRate: 9.66 },
      { date: '2026-05-04', text: 'COST BASIS RESISTANCE — Three key price bands...', likes: 37, reposts: 21, comments: 1, impressions: 243, engagement: 69, engagementRate: 28.40 },
      { date: '2026-05-07', text: 'From Crash Insurance to Upside Positioning — The options market...', likes: 61, reposts: 35, comments: 12, impressions: 892, engagement: 507, engagementRate: 56.77 },
      { date: '2026-05-07', text: 'The Institutional Book Behind the Book — Institutional positioning...', likes: 58, reposts: 32, comments: 10, impressions: 905, engagement: 496, engagementRate: 55.32 },
      { date: '2026-05-08', text: 'Bitwise Asset Management is making its first move into tokenized funds...', likes: 58, reposts: 31, comments: 11, impressions: 784, engagement: 515, engagementRate: 65.71 },
    ],
    daily: [
      { date: '2026-05-04', posts: 34, impressions: 21646, engagements: 3288, likes: 520, reposts: 622 },
      { date: '2026-05-05', posts: 42, impressions: 17711, engagements: 3895, likes: 610, reposts: 829 },
      { date: '2026-05-06', posts: 43, impressions: 20063, engagements: 3421, likes: 580, reposts: 707 },
      { date: '2026-05-07', posts: 48, impressions: 21274, engagements: 4212, likes: 720, reposts: 964 },
      { date: '2026-05-08', posts: 41, impressions: 11599, engagements: 2992, likes: 410, reposts: 658 },
    ],
  },
  instagram: {
    posts: [
      { date: '2026-05-07', text: 'Market structure analysis — Weekly wrap', likes: 48, reposts: 32, comments: 8, impressions: 520, engagement: 109, engagementRate: 20.96 },
      { date: '2026-05-10', text: 'Crypto fundamentals explained in 60 seconds', likes: 45, reposts: 28, comments: 6, impressions: 480, engagement: 96, engagementRate: 20.00 },
      { date: '2026-05-12', text: 'Behind the scenes: How we analyze market data', likes: 42, reposts: 25, comments: 5, impressions: 410, engagement: 87, engagementRate: 21.22 },
    ],
    daily: [
      { date: '2026-05-07', posts: 5, impressions: 3200, engagements: 480, likes: 180, reposts: 120 },
      { date: '2026-05-10', posts: 8, impressions: 4100, engagements: 620, likes: 240, reposts: 160 },
      { date: '2026-05-12', posts: 6, impressions: 2800, engagements: 390, likes: 150, reposts: 95 },
    ],
  },
  telegram: {
    posts: [
      { date: '2026-05-15', text: 'Daily crypto digest — May 15', likes: 0, reposts: 0, comments: 0, impressions: 0, engagement: 36, engagementRate: 0 },
      { date: '2026-05-14', text: 'Bitcoin Technical Analysis — Support levels', likes: 0, reposts: 0, comments: 0, impressions: 0, engagement: 32, engagementRate: 0 },
      { date: '2026-05-13', text: 'Altcoin Watchlist — Top movers', likes: 0, reposts: 0, comments: 0, impressions: 0, engagement: 29, engagementRate: 0 },
    ],
    daily: [
      { date: '2026-05-13', posts: 28, impressions: 0, engagements: 784, likes: 0, reposts: 0 },
      { date: '2026-05-14', posts: 30, impressions: 0, engagements: 840, likes: 0, reposts: 0 },
      { date: '2026-05-15', posts: 32, impressions: 0, engagements: 912, likes: 0, reposts: 0 },
    ],
  },
}

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
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last30' })
  const [filteredPosts, setFilteredPosts] = useState(platformData[platform]?.posts || [])
  const [filteredDaily, setFilteredDaily] = useState(platformData[platform]?.daily || [])

  const data = platformData[platform]

  useEffect(() => {
    if (!data) return
    const { start, end } = getDateRangeValue(dateRange)
    setFilteredPosts(data.posts.filter((p) => new Date(p.date) >= start && new Date(p.date) <= end))
    setFilteredDaily(data.daily.filter((d) => new Date(d.date) >= start && new Date(d.date) <= end))
  }, [platform, dateRange, data])

  if (!data) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-2xl text-navy">Platform not found</h2>
        <p className="text-text-secondary mt-2">Please select a valid platform</p>
      </div>
    )
  }

  const totalPosts = filteredPosts.length
  const totalLikes = filteredPosts.reduce((sum, p) => sum + p.likes, 0)
  const totalReposts = filteredPosts.reduce((sum, p) => sum + p.reposts, 0)
  const totalImpressions = filteredPosts.reduce((sum, p) => sum + p.impressions, 0)
  const avgEngagementRate = totalImpressions > 0 ? ((filteredPosts.reduce((sum, p) => sum + p.engagement, 0) / totalImpressions) * 100).toFixed(1) : '0'

  const kpis = [
    { label: 'Total Posts', value: totalPosts, prefix: '' },
    { label: 'Total Likes', value: totalLikes, prefix: '' },
    { label: 'Total Reposts', value: totalReposts, prefix: '' },
    { label: 'Avg Engagement Rate', value: parseFloat(avgEngagementRate), suffix: '%' },
  ]

  const dates = filteredDaily.map((d) => d.date)
  const impressionsData = filteredDaily.map((d) => d.impressions)
  const engagementsData = filteredDaily.map((d) => d.engagements)
  const likesData = filteredDaily.map((d) => d.likes)
  const repostsData = filteredDaily.map((d) => d.reposts)

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
              {filteredPosts.map((post, i) => (
                <tr key={i} className="hover:bg-cream/50 transition-colors">
                  <td className="py-3 text-sm text-text-muted whitespace-nowrap">{post.date}</td>
                  <td className="py-3 text-sm text-text-primary max-w-sm truncate">{post.text}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.likes)}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.reposts)}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.comments)}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.impressions)}</td>
                  <td className="py-3 text-sm font-medium text-navy text-right">{post.engagementRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
