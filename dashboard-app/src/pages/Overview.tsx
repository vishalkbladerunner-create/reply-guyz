import { useState, useEffect } from 'react'
import KpiCards from '@/components/KpiCards'
import LineChart from '@/components/Charts/LineChart'
import BarChart from '@/components/Charts/BarChart'
import PieChart from '@/components/Charts/PieChart'
import DateRangePicker, { type DateRange, getDateRangeValue } from '@/components/DateRangePicker'
import { formatNumber } from '@/lib/utils'

const dailyMetrics = [
  { date: '2026-05-04', impressions: 21646, engagements: 3288, likes: 520, reposts: 622, followers: 3661, posts: 34 },
  { date: '2026-05-05', impressions: 17711, engagements: 3895, likes: 610, reposts: 829, followers: 3664, posts: 42 },
  { date: '2026-05-06', impressions: 20063, engagements: 3421, likes: 580, reposts: 707, followers: 3668, posts: 43 },
  { date: '2026-05-07', impressions: 21274, engagements: 4212, likes: 720, reposts: 964, followers: 3672, posts: 48 },
  { date: '2026-05-08', impressions: 11599, engagements: 2992, likes: 410, reposts: 658, followers: 3669, posts: 41 },
  { date: '2026-05-09', impressions: 239, engagements: 122, likes: 18, reposts: 18, followers: 3662, posts: 1 },
  { date: '2026-05-10', impressions: 0, engagements: 0, likes: 0, reposts: 0, followers: 3662, posts: 0 },
]

const platformTotals = {
  twitter: { posts: 455, likes: 18591, reposts: 8724, comments: 1879, engagement: 29194 },
  instagram: { posts: 45, likes: 1813, reposts: 1420, comments: 238, engagement: 3471 },
  telegram: { posts: 171, likes: 0, reposts: 0, comments: 0, engagement: 4723, reactions: 4723 },
}

const topPosts = [
  { platform: 'Twitter', text: 'Catch up on the hottest crypto news over the weekend...', likes: 49, reposts: 24, engagement: 147, date: 'May 4' },
  { platform: 'Twitter', text: '$BTC MARKET STRUCTURE — Bitcoin has outperformed...', likes: 52, reposts: 27, engagement: 192, date: 'May 4' },
  { platform: 'Twitter', text: 'Bitwise Asset Management is making its first move into tokenized funds...', likes: 58, reposts: 31, engagement: 230, date: 'May 8' },
  { platform: 'Instagram', text: 'Market structure analysis — Weekly wrap', likes: 48, reposts: 32, engagement: 109, date: 'May 7' },
  { platform: 'Telegram', text: 'Daily crypto digest — May 15', likes: 0, reposts: 0, reactions: 36, engagement: 36, date: 'May 15' },
]

export default function Overview() {
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last7' })
  const [filteredMetrics, setFilteredMetrics] = useState(dailyMetrics)

  useEffect(() => {
    const { start, end } = getDateRangeValue(dateRange)
    const filtered = dailyMetrics.filter((m) => {
      const d = new Date(m.date)
      return d >= start && d <= end
    })
    setFilteredMetrics(filtered)
  }, [dateRange])

  const totalImpressions = filteredMetrics.reduce((sum, m) => sum + m.impressions, 0)
  const totalEngagements = filteredMetrics.reduce((sum, m) => sum + m.engagements, 0)
  const totalPosts = filteredMetrics.reduce((sum, m) => sum + m.posts, 0)
  const avgEngagementRate = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(1) : '0'

  const kpis = [
    { label: 'Total Impressions', value: totalImpressions, change: 12.5, prefix: '' },
    { label: 'Total Engagements', value: totalEngagements, change: 8.3, prefix: '' },
    { label: 'Engagement Rate', value: parseFloat(avgEngagementRate), change: 2.1, prefix: '', suffix: '%' },
    { label: 'Posts Published', value: totalPosts, change: -5.2, prefix: '' },
  ]

  const dates = filteredMetrics.map((m) => m.date)
  const impressionsData = filteredMetrics.map((m) => m.impressions)
  const engagementsData = filteredMetrics.map((m) => m.engagements)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">Overview</h1>
          <p className="text-text-secondary mt-1">Track your social media performance across all platforms</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Trend</h3>
          <LineChart
            labels={dates}
            datasets={[
              { label: 'Impressions', data: impressionsData, color: '#4479e1' },
              { label: 'Engagements', data: engagementsData, color: '#1a2332' },
            ]}
          />
        </div>
        <div className="card">
          <h3 className="font-display text-lg font-medium text-navy mb-4">Platform Breakdown</h3>
          <PieChart
            labels={['Twitter', 'Instagram', 'Telegram']}
            data={[platformTotals.twitter.engagement, platformTotals.instagram.engagement, platformTotals.telegram.engagement]}
            colors={['#1a2332', '#4479e1', '#6b8cae']}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display text-lg font-medium text-navy mb-4">Platform Comparison</h3>
          <BarChart
            labels={['Twitter', 'Instagram', 'Telegram']}
            datasets={[
              { label: 'Posts', data: [platformTotals.twitter.posts, platformTotals.instagram.posts, platformTotals.telegram.posts], color: '#1a2332' },
              { label: 'Likes/Reactions', data: [platformTotals.twitter.likes, platformTotals.instagram.likes, platformTotals.telegram.reactions], color: '#4479e1' },
            ]}
          />
        </div>
        <div className="card">
          <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Types</h3>
          <BarChart
            labels={['Twitter', 'Instagram', 'Telegram']}
            datasets={[
              { label: 'Likes', data: [platformTotals.twitter.likes, platformTotals.instagram.likes, 0], color: '#4479e1' },
              { label: 'Reposts', data: [platformTotals.twitter.reposts, platformTotals.instagram.reposts, 0], color: '#6b8cae' },
              { label: 'Comments', data: [platformTotals.twitter.comments, platformTotals.instagram.comments, 0], color: '#1a2332' },
            ]}
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
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Reposts</th>
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Engagement</th>
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {topPosts.map((post, i) => (
                <tr key={i} className="hover:bg-cream/50 transition-colors">
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      post.platform === 'Twitter' ? 'bg-blue-50 text-blue-700' :
                      post.platform === 'Instagram' ? 'bg-pink-50 text-pink-700' :
                      'bg-sky-50 text-sky-700'
                    }`}>
                      {post.platform}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-text-primary max-w-xs truncate">{post.text}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.likes)}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(post.reposts)}</td>
                  <td className="py-3 text-sm font-medium text-navy text-right">{formatNumber(post.engagement)}</td>
                  <td className="py-3 text-sm text-text-muted text-right">{post.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
