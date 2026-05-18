import { useParams } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useClient } from '@/hooks/useClient'
import { usePlatformPosts } from '@/hooks/usePlatformPosts'
import StatCard, { PLATFORM_COLORS } from '@/components/StatCard'
import DateRangePicker, { type DateRange } from '@/components/DateRangePicker'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import PostHighlights from '@/components/PostHighlights'
import PlatformBadge from '@/components/PlatformBadge'
import SectionHeader from '@/components/SectionHeader'
import RichDataTable from '@/components/RichDataTable'
import EngagementCompositionChart from '@/components/EngagementCompositionChart'
import LineChart from '@/components/Charts/LineChart'
import BarChart from '@/components/Charts/BarChart'
import { formatNumber, formatDateShort } from '@/lib/utils'
import { FileText, Heart, Repeat, MessageCircle, Eye, ExternalLink } from 'lucide-react'

const PLATFORM_NAMES: Record<string, string> = {
  twitter: 'X/Twitter',
  instagram: 'Instagram',
  telegram: 'Telegram',
}

export default function PlatformAnalytics() {
  const { platform = 'twitter' } = useParams<{ platform: string }>()
  const { selectedClientId, clients } = useClient()
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last30' })
  const [showAllPosts, setShowAllPosts] = useState(false)

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const { posts, dailyMetrics, loading, error, refresh } = usePlatformPosts(selectedClientId, platform, dateRange)

  const isTelegram = platform === 'telegram'

  const totalPosts = posts.length
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0)
  const totalReposts = posts.reduce((s, p) => s + (p.reposts || 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0)
  const totalReactions = posts.reduce((s, p) => s + (p.reactions || 0), 0)
  const totalEngagement = totalPosts > 0 ? posts.reduce((s, p) => s + (p.engagements || 0), 0) : 0
  const avgEngagement = totalPosts > 0 ? (totalEngagement / totalPosts).toFixed(1) : '0'

  const bestScore = posts.length > 0 ? Math.max(...posts.map((p) => p.engagements || 0)) : 0
  const bestReactions = posts.length > 0 ? Math.max(...posts.map((p) => p.reactions || 0)) : 0

  const top10 = useMemo(() => posts.slice(0, 10), [posts])

  const top10TableColumns = useMemo(() => {
    const cols = [
      {
        key: 'rank', label: '#', align: 'left' as const,
        render: (_v: any, _r: any, i?: number) => <span className="font-medium text-text-muted">{(i || 0) + 1}</span>,
      },
      { key: 'post_date', label: 'Date & Time', sortable: true, align: 'left' as const,
        render: (v: any, r: any) => <span className="whitespace-nowrap text-text-secondary text-xs">{formatDateShort(v)}{r.post_time ? ` ${String(r.post_time).slice(0, 5)}` : ''}</span>
      },
      { key: 'post_text', label: 'Post Text', align: 'left' as const,
        render: (v: any) => {
          const text = String(v || '')
          return v ? (
            <span className="block max-w-xs truncate" title={text}>{text.length > 80 ? text.slice(0, 80) + '\u2026' : text}</span>
          ) : <span className="text-text-muted">—</span>
        },
      },
    ] as any[]

    if (!isTelegram) {
      cols.push(
        { key: 'likes', label: 'Likes', sortable: true, align: 'right' as const, render: (v: any) => <span className="text-sm">{formatNumber(v || 0)}</span> },
        { key: 'reposts', label: 'Reposts', sortable: true, align: 'right' as const, render: (v: any) => <span className="text-sm">{formatNumber(v || 0)}</span> },
        { key: 'comments', label: 'Comments', sortable: true, align: 'right' as const, render: (v: any) => <span className="text-sm">{formatNumber(v || 0)}</span> },
      )
    } else {
      cols.push(
        { key: 'reactions', label: 'Reactions', sortable: true, align: 'right' as const, render: (v: any) => <span className="text-sm">{formatNumber(v || 0)}</span> },
      )
    }

    cols.push(
      { key: 'engagements', label: 'Total Eng', sortable: true, align: 'right' as const, render: (v: any) => <span className="text-sm font-medium text-navy">{formatNumber(v || 0)}</span> },
      { key: 'engagement_rate', label: 'Eng Share%', sortable: true, align: 'center' as const,
        render: (_v: any, r: any) => {
          const pct = totalEngagement > 0 ? ((r.engagements || 0) / totalEngagement * 100) : 0
          const color = pct > 5 ? 'text-green-600' : pct > 2 ? 'text-yellow-600' : 'text-text-muted'
          return <span className={`text-xs font-medium ${color}`}>{pct.toFixed(1)}%</span>
        },
      },
      { key: 'post_url', label: 'Link', align: 'center' as const,
        render: (v: any) => v ? (
          <a href={v} target="_blank" rel="noopener noreferrer" className="inline-flex text-text-muted hover:text-blue-accent transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : <span className="text-text-muted">—</span>,
      },
    )

    return cols
  }, [totalEngagement, isTelegram])

  const engagementBrackets = useMemo(() => {
    const brackets = [0, 26, 51, 76, 101]
    const counts = brackets.map((min, i) => {
      const max = brackets[i + 1] || Infinity
      return posts.filter((p) => (p.engagements || 0) >= min && (p.engagements || 0) < max).length
    })
    return { counts, labels: ['0-25', '26-50', '51-75', '76-100', '100+'] }
  }, [posts])

  const dayOfWeekCounts = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const counts = new Array(7).fill(0)
    posts.forEach((p) => {
      const d = new Date(p.post_date + 'T00:00:00')
      counts[d.getDay()]++
    })
    return { labels: days, data: counts }
  }, [posts])

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <div className="space-y-8">
      {/* SECTION A — Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">
            <PlatformBadge platform={platform} /> {selectedClient?.name || ''} on {PLATFORM_NAMES[platform] || platform}
          </h1>
          {dailyMetrics.length > 0 && (
            <p className="text-text-secondary mt-1">
              {formatDateShort(dailyMetrics[0].metric_date)} – {formatDateShort(dailyMetrics[dailyMetrics.length - 1].metric_date)}
            </p>
          )}
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {posts.length === 0 ? (
        <EmptyState icon={FileText} title="No data yet" description={`No ${PLATFORM_NAMES[platform]} posts found for the selected range.`} />
      ) : (
        <>
          {/* SECTION B — Summary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Posts" value={totalPosts} icon={FileText} platform={platform} />
            <StatCard label="Total Engagement" value={totalEngagement} icon={Eye} platform={platform} />
            <StatCard label="Avg / Post" value={avgEngagement} platform={platform} suffix={isTelegram ? ' reactions' : ''} />
            <StatCard
              label={isTelegram ? 'Reactions/Post' : 'Likes Share %'}
              value={isTelegram ? (totalPosts > 0 ? (totalReactions / totalPosts).toFixed(1) : '0') : (totalEngagement > 0 ? ((totalLikes / totalEngagement) * 100).toFixed(1) + '%' : '0%')}
              platform={platform}
            />
          </div>

          {/* SECTION C — Detail KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isTelegram ? (
              <>
                <StatCard label="Total Reactions" value={totalReactions} platform={platform} />
                <StatCard label="Posts Tracked" value={totalPosts} platform={platform} />
                <StatCard label="Avg Reactions/Post" value={(totalPosts > 0 ? (totalReactions / totalPosts).toFixed(1) : '0')} platform={platform} />
                <StatCard label="Best Post Reactions" value={bestReactions} platform={platform} />
              </>
            ) : (
              <>
                <StatCard label="Total Likes" value={totalLikes} icon={Heart} platform={platform} />
                <StatCard label="Total Reposts" value={totalReposts} icon={Repeat} platform={platform} />
                <StatCard label="Total Comments" value={totalComments} icon={MessageCircle} platform={platform} />
                <StatCard label="Best Post Score" value={bestScore} platform={platform} />
              </>
            )}
          </div>

          {/* SECTION D — Live Highlights */}
          <div>
            <SectionHeader title="Live Highlights" />
            <div className="mt-4">
              <PostHighlights posts={posts} />
            </div>
          </div>

          {/* SECTION E — Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Daily Engagement Trend</h3>
              <LineChart
                labels={dailyMetrics.map((m) => m.metric_date)}
                datasets={[
                  { label: 'Impressions', data: dailyMetrics.map((m) => m.impressions || 0), color: '#4479e1' },
                  { label: 'Engagements', data: dailyMetrics.map((m) => m.engagements || 0), color: '#1a2332' },
                ]}
              />
            </div>
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Composition</h3>
              <EngagementCompositionChart posts={posts.slice(0, 30).reverse()} platform={platform} />
            </div>
          </div>

          {/* SECTION F — Top 10 Posts */}
          <div className="card">
            <h3 className="font-display text-lg font-medium text-navy mb-4">Top {Math.min(10, posts.length)} of {posts.length} Posts</h3>
            <RichDataTable
              columns={top10TableColumns}
              rows={top10}
              topN={Math.min(10, top10.length)}
              pageSize={10}
            />
          </div>

          {/* SECTION G — Full Post Data */}
          <div className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-navy">All Posts</h3>
              <button
                onClick={() => setShowAllPosts(!showAllPosts)}
                className="btn-secondary text-sm py-1.5 px-4"
              >
                {showAllPosts ? 'Hide All Posts' : `View All Posts (${posts.length})`}
              </button>
            </div>
            {showAllPosts && (
              <div className="mt-4">
                <RichDataTable
                  columns={top10TableColumns}
                  rows={posts}
                  searchable
                  searchKey="post_text"
                  pageSize={25}
                />
              </div>
            )}
          </div>

          {/* SECTION H — Additional Charts */}
          {posts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Distribution</h3>
                <BarChart
                  labels={engagementBrackets.labels}
                  datasets={[{ label: 'Posts', data: engagementBrackets.counts, color: PLATFORM_COLORS[platform] || '#1a2332' }]}
                />
              </div>
              <div className="card">
                <h3 className="font-display text-lg font-medium text-navy mb-4">Post Frequency by Day</h3>
                <BarChart
                  labels={dayOfWeekCounts.labels}
                  datasets={[{ label: 'Posts', data: dayOfWeekCounts.data, color: '#4479e1' }]}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
