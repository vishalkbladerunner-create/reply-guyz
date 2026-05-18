import { useState, useMemo } from 'react'
import { useClient } from '@/hooks/useClient'
import { useDashboardData } from '@/hooks/useDashboardData'
import StatCard, { PLATFORM_COLORS, PLATFORM_ICONS } from '@/components/StatCard'
import DateRangePicker, { type DateRange } from '@/components/DateRangePicker'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import PostHighlights from '@/components/PostHighlights'
import PlatformBadge from '@/components/PlatformBadge'
import SectionHeader from '@/components/SectionHeader'
import PieChart from '@/components/Charts/PieChart'
import BarChart from '@/components/Charts/BarChart'
import { formatNumber, formatDateShort } from '@/lib/utils'
import { FileText, Heart, Repeat, TrendingUp, Building2 } from 'lucide-react'
import type { Post } from '@/lib/supabase'

export default function Overview() {
  const { selectedClientId, clients } = useClient()
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last30' })

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const activePlatforms = selectedClient?.active_platforms || ['twitter']

  const { posts, loading, error, refresh } = useDashboardData(selectedClientId, dateRange, activePlatforms)

  const postDates = useMemo(() => {
    if (posts.length === 0) return { min: '', max: '' }
    const dates = posts.map((p) => p.post_date).sort()
    return { min: dates[0], max: dates[dates.length - 1] }
  }, [posts])

  const platformPosts = useMemo(() => {
    const map: Record<string, Post[]> = {}
    activePlatforms.forEach((p) => { map[p] = [] })
    posts.forEach((p) => {
      if (map[p.platform]) map[p.platform].push(p)
    })
    return map
  }, [posts, activePlatforms])

  const platformTotals = useMemo(() => {
    const totals: Record<string, { likes: number; reposts: number; comments: number; reactions: number; posts: number; engagement: number }> = {}
    activePlatforms.forEach((p) => {
      const pp = platformPosts[p] || []
      totals[p] = {
        likes: pp.reduce((s, x) => s + (x.likes || 0), 0),
        reposts: pp.reduce((s, x) => s + (x.reposts || 0), 0),
        comments: pp.reduce((s, x) => s + (x.comments || 0), 0),
        reactions: pp.reduce((s, x) => s + (x.reactions || 0), 0),
        posts: pp.length,
        engagement: pp.reduce((s, x) => s + (x.engagements || 0), 0),
      }
    })
    return totals
  }, [platformPosts, activePlatforms])

  const grandTotal = useMemo(() => {
    let likes = 0, reposts = 0, comments = 0, reactions = 0, engagement = 0
    activePlatforms.forEach((p) => {
      likes += platformTotals[p]?.likes || 0
      reposts += platformTotals[p]?.reposts || 0
      comments += platformTotals[p]?.comments || 0
      reactions += platformTotals[p]?.reactions || 0
      engagement += platformTotals[p]?.engagement || 0
    })
    return { likes, reposts, comments, reactions, engagement }
  }, [platformTotals, activePlatforms])

  const platformShareLabels = activePlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
  const platformShareData = activePlatforms.map((p) => platformTotals[p]?.engagement || 0)
  const platformShareColors = activePlatforms.map((p) =>
    p === 'twitter' ? '#1a2332' : p === 'instagram' ? '#4479e1' : '#6b8cae'
  )

  const tierPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => (b.engagements || 0) - (a.engagements || 0))
    const n = sorted.length
    if (n === 0) return { high: [], medium: [], low: [] }
    const highCut = Math.max(1, Math.floor(n * 0.25))
    const lowCut = Math.max(highCut, Math.floor(n * 0.75))
    return {
      high: sorted.slice(0, highCut),
      medium: sorted.slice(highCut, lowCut),
      low: sorted.slice(lowCut),
    }
  }, [posts])

  const tierEngagementData = activePlatforms.length > 0 ? [
    tierPosts.high.reduce((s, p) => s + (p.engagements || 0), 0),
    tierPosts.medium.reduce((s, p) => s + (p.engagements || 0), 0),
    tierPosts.low.reduce((s, p) => s + (p.engagements || 0), 0),
  ] : [0, 0, 0]

  if (!selectedClientId) {
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

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <div className="space-y-8">
      {/* SECTION A — Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">📊 Performance Overview</h1>
          {postDates.min && (
            <p className="text-text-secondary mt-1">Coverage: {formatDateShort(postDates.min)} – {formatDateShort(postDates.max)}</p>
          )}
          {selectedClient && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-navy">{selectedClient.name}</span>
              {activePlatforms.map((p) => (
                <PlatformBadge key={p} platform={p} />
              ))}
            </div>
          )}
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No data yet"
          description="No posts found for the selected date range. Try adjusting the date filter or uploading data."
        />
      ) : (
        <>
          {/* SECTION B — Cross-Platform KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Posts"
              value={posts.length}
              icon={FileText}
              subtitle={activePlatforms.map((p) => `${PLATFORM_ICONS[p]} ${platformTotals[p]?.posts || 0}`).join(' · ')}
            />
            <StatCard
              label="Total Likes"
              value={grandTotal.likes}
              icon={Heart}
              subtitle={activePlatforms.map((p) => `${PLATFORM_ICONS[p]} ${formatNumber(platformTotals[p]?.likes || 0)}`).join(' · ')}
            />
            <StatCard
              label="Total Reposts"
              value={grandTotal.reposts}
              icon={Repeat}
              subtitle={activePlatforms.map((p) => `${PLATFORM_ICONS[p]} ${formatNumber(platformTotals[p]?.reposts || 0)}`).join(' · ')}
            />
            <StatCard
              label="Grand Total Interactions"
              value={grandTotal.engagement}
              icon={TrendingUp}
              subtitle={activePlatforms.map((p) => `${PLATFORM_ICONS[p]} ${formatNumber(platformTotals[p]?.engagement || 0)}`).join(' · ')}
            />
          </div>

          {/* SECTION C — Per-Platform Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activePlatforms.map((platform) => {
              const stats = platformTotals[platform]
              if (!stats) return null
              const isTG = platform === 'telegram'
              return (
                <div key={platform} className="card" style={{ borderLeft: `4px solid ${PLATFORM_COLORS[platform]}` }}>
                  <h3 className="font-display text-lg font-medium text-navy mb-4">
                    {PLATFORM_ICONS[platform]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </h3>
                  <div className="space-y-2">
                    {isTG ? (
                      <>
                        <MetricRow label="Total Reactions" value={formatNumber(stats.reactions)} />
                        <MetricRow label="Posts Tracked" value={stats.posts.toString()} />
                        <MetricRow label="Avg Reactions/Post" value={(stats.posts > 0 ? (stats.reactions / stats.posts).toFixed(1) : '0')} />
                        <MetricRow label="Best Post (Reactions)" value={platformPosts[platform].length > 0 ? Math.max(...platformPosts[platform].map((p) => p.reactions || 0)).toString() : '0'} badge />
                      </>
                    ) : (
                      <>
                        <MetricRow label="Total Likes" value={formatNumber(stats.likes)} />
                        <MetricRow label="Total Reposts" value={formatNumber(stats.reposts)} />
                        <MetricRow label="Total Comments" value={formatNumber(stats.comments)} />
                        <MetricRow label="Best Post Score" value={platformPosts[platform].length > 0 ? Math.max(...platformPosts[platform].map((p) => p.engagements || 0)).toString() : '0'} badge />
                        <MetricRow
                          label="Likes Share"
                          value={grandTotal.engagement > 0 ? ((stats.engagement / grandTotal.engagement) * 100).toFixed(1) + '%' : '0%'}
                        />
                        <MetricRow label="Avg Engagement/Post" value={(stats.posts > 0 ? (stats.engagement / stats.posts).toFixed(1) : '0')} />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* SECTION D — Live Highlights */}
          <div>
            <SectionHeader title="Live Highlights" />
            <div className="mt-4">
              <PostHighlights posts={posts} />
            </div>
          </div>

          {/* SECTION E + F — Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Platform Share of Total Engagement</h3>
              <PieChart
                labels={platformShareLabels}
                data={platformShareData}
                colors={platformShareColors}
              />
              <p className="text-center text-sm text-text-muted mt-3">
                Total: {formatNumber(grandTotal.engagement)} engagements
              </p>
            </div>
            {activePlatforms.length > 0 && (
              <>
                <div className="card">
                  <h3 className="font-display text-lg font-medium text-navy mb-4">Posts & Engagement by Platform</h3>
                  <BarChart
                    labels={activePlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1))}
                    datasets={[
                      { label: 'Posts', data: activePlatforms.map((p) => platformTotals[p]?.posts || 0), color: '#1a2332' },
                      { label: 'Likes/Reactions', data: activePlatforms.map((p) => platformTotals[p]?.likes + platformTotals[p]?.reactions || 0), color: '#4479e1' },
                    ]}
                  />
                </div>
              </>
            )}
          </div>

          {/* SECTION G — All Metrics Overview Table */}
          <div className="card">
            <h3 className="font-display text-lg font-medium text-navy mb-4">All Metrics Overview</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy/5">
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Metric</th>
                    {activePlatforms.map((p) => (
                      <th key={p} className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">
                        {PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {['likes', 'reposts', 'comments', 'reactions', 'posts'].map((metric) => {
                    const values = activePlatforms.map((p) => {
                      const s = platformTotals[p]
                      if (metric === 'reactions' && p === 'twitter') return null
                      if (metric === 'comments' && p === 'telegram') return null
                      if (metric === 'likes' && p === 'telegram') return null
                      if (metric === 'reposts' && p === 'telegram') return null
                      if (metric === 'posts') return s?.posts || 0
                      return (s as any)?.[metric] || 0
                    })
                    const maxVal = Math.max(...values.filter((v) => v !== null) as number[], 1)
                    return (
                      <tr key={metric}>
                        <td className="py-3 text-sm font-medium text-text-secondary capitalize">{metric}</td>
                        {values.map((val, i) => (
                          <td key={i} className="py-3 text-sm text-navy text-right">
                            <div className="flex items-center justify-end gap-2">
                              {val !== null ? (
                                <>
                                  <div
                                    className="h-2 rounded-full"
                                    style={{
                                      width: `${Math.max(8, (val as number / maxVal) * 80)}px`,
                                      backgroundColor: platformShareColors[i] + '40',
                                    }}
                                  />
                                  <span>{formatNumber(val as number)}</span>
                                </>
                              ) : (
                                <span className="text-text-muted">—</span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION H — Engagement Tier Distribution */}
          {posts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Tier Distribution</h3>
                <PieChart
                  labels={['High (Top 25%)', 'Medium (Mid 50%)', 'Low (Bottom 25%)']}
                  data={tierEngagementData}
                  colors={['#1a2332', '#4479e1', '#6b8cae']}
                />
              </div>
              <div className="space-y-4">
                {[
                  { label: 'High Engagement', posts: tierPosts.high, color: '#1a2332' },
                  { label: 'Medium Engagement', posts: tierPosts.medium, color: '#4479e1' },
                  { label: 'Low Engagement', posts: tierPosts.low, color: '#6b8cae' },
                ].map((tier) => (
                  <div key={tier.label} className="card p-4" style={{ borderLeft: `4px solid ${tier.color}` }}>
                    <p className="text-sm font-medium text-navy">{tier.label}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {tier.posts.length} posts · Avg {tier.posts.length > 0
                        ? (tier.posts.reduce((s, p) => s + (p.engagements || 0), 0) / tier.posts.length).toFixed(1)
                        : '0'} engagement/post
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MetricRow({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-text-muted">{label}</span>
      <span className={`text-sm font-medium ${badge ? 'bg-cream px-2 py-0.5 rounded-lg' : 'text-navy'}`}>
        {value}
      </span>
    </div>
  )
}
