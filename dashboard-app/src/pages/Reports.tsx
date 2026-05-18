import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClient } from '@/hooks/useClient'
import { useReportData } from '@/hooks/useReportData'
import StatCard from '@/components/StatCard'
import DateRangePicker, { type DateRange } from '@/components/DateRangePicker'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import LineChart from '@/components/Charts/LineChart'
import BarChart from '@/components/Charts/BarChart'
import PieChart from '@/components/Charts/PieChart'
import RichDataTable from '@/components/RichDataTable'
import { formatNumber, formatDateShort } from '@/lib/utils'
import { FileText, Calendar, Download, ExternalLink, ChevronRight } from 'lucide-react'

export default function Reports() {
  const navigate = useNavigate()
  const { selectedClientId, clients } = useClient()
  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const [selectedType, setSelectedType] = useState('custom')
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last7' })

  const activePlatforms = selectedClient?.active_platforms || ['twitter']

  const { posts, currentStats, previousStats, dailyMetrics, loading, error, refresh } = useReportData(selectedClientId, dateRange)

  const periodLabel = useMemo(() => {
    if (posts.length === 0) return ''
    const dates = posts.map((p) => p.post_date).sort()
    return `${formatDateShort(dates[0])} – ${formatDateShort(dates[dates.length - 1])}`
  }, [posts])

  const platformPosts = useMemo(() => {
    const map: Record<string, typeof posts> = {}
    activePlatforms.forEach((p) => { map[p] = [] })
    posts.forEach((p) => {
      if (map[p.platform]) map[p.platform].push(p)
    })
    return map
  }, [posts, activePlatforms])

  const tierPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => (b.engagements || 0) - (a.engagements || 0))
    const n = sorted.length
    if (n === 0) return { high: [], medium: [], low: [] }
    const highCut = Math.max(1, Math.floor(n * 0.25))
    const lowCut = Math.max(highCut, Math.floor(n * 0.75))
    return { high: sorted.slice(0, highCut), medium: sorted.slice(highCut, lowCut), low: sorted.slice(lowCut) }
  }, [posts])

  const tierData = useMemo(() => [
    tierPosts.high.reduce((s, p) => s + (p.engagements || 0), 0),
    tierPosts.medium.reduce((s, p) => s + (p.engagements || 0), 0),
    tierPosts.low.reduce((s, p) => s + (p.engagements || 0), 0),
  ], [tierPosts])

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return { value: 0, positive: true }
    const val = ((curr - prev) / prev) * 100
    return { value: Math.abs(parseFloat(val.toFixed(1))), positive: val >= 0 }
  }

  const bestDay = useMemo(() => {
    const dayMap = new Map<string, number>()
    posts.forEach((p) => {
      dayMap.set(p.post_date, (dayMap.get(p.post_date) || 0) + (p.engagements || 0))
    })
    let best = ''
    let bestVal = 0
    dayMap.forEach((v, k) => { if (v > bestVal) { bestVal = v; best = k } })
    return { date: best, value: bestVal }
  }, [posts])

  const generateCSV = () => {
    const header = 'Date,Platform,Likes,Reposts,Comments,Reactions,Engagements,Impressions,Post URL'
    const rows = posts.map((p) =>
      [p.post_date, p.platform, p.likes, p.reposts, p.comments, p.reactions, p.engagements, p.impressions, p.post_url || ''].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-custom-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">📄 Reports</h1>
          <p className="text-text-secondary mt-1">Generate and export performance reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateCSV} className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => window.print()} className="btn-primary text-sm">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* SECTION A — Report Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/weekly-report')}
          className="card text-left transition-all card-hover"
        >
          <div className="flex items-start justify-between">
            <FileText className="w-5 h-5 text-text-muted" />
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </div>
          <h3 className="font-display text-lg font-medium text-navy mt-3">Weekly Report</h3>
          <p className="text-sm text-text-muted mt-1">Auto-generated weekly performance report</p>
        </button>
        <button
          onClick={() => {
            setSelectedType('monthly')
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            setDateRange({ preset: 'custom', start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] })
          }}
          className={`card text-left transition-all ${selectedType === 'monthly' ? 'ring-2 ring-blue-accent' : 'card-hover'}`}
        >
          <FileText className={`w-5 h-5 ${selectedType === 'monthly' ? 'text-blue-accent' : 'text-text-muted'}`} />
          <h3 className="font-display text-lg font-medium text-navy mt-3">Monthly Report</h3>
          <p className="text-sm text-text-muted mt-1">This month's data snapshot</p>
        </button>
        <button
          onClick={() => setSelectedType('custom')}
          className={`card text-left transition-all ${selectedType === 'custom' ? 'ring-2 ring-blue-accent' : 'card-hover'}`}
        >
          <Calendar className={`w-5 h-5 ${selectedType === 'custom' ? 'text-blue-accent' : 'text-text-muted'}`} />
          <h3 className="font-display text-lg font-medium text-navy mt-3">Custom Date Range</h3>
          <p className="text-sm text-text-muted mt-1">Pick any date range to analyze</p>
        </button>
      </div>

      {/* SECTION B — Date Range */}
      {selectedType === 'custom' && (
        <div className="card flex items-center gap-4">
          <Calendar className="w-5 h-5 text-text-muted flex-shrink-0" />
          <div>
            <p className="text-sm text-text-muted">Select Date Range</p>
            <div className="mt-2">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
          {periodLabel && (
            <div className="ml-auto text-sm text-navy font-medium">{periodLabel}</div>
          )}
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState icon={FileText} title="No data yet" description="No posts found for the selected date range." />
      ) : (
        <>
          {/* SECTION C — Period KPI Cards with Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Posts"
              value={currentStats.totalPosts}
              change={pctChange(currentStats.totalPosts, previousStats.totalPosts)}
              icon={FileText}
            />
            <StatCard
              label="Total Engagement"
              value={currentStats.totalEngagements}
              change={pctChange(currentStats.totalEngagements, previousStats.totalEngagements)}
            />
            <StatCard
              label="Engagement Rate"
              value={currentStats.totalImpressions > 0 ? ((currentStats.totalEngagements / currentStats.totalImpressions) * 100).toFixed(1) : '0'}
              suffix="%"
              change={pctChange(
                currentStats.totalImpressions > 0 ? currentStats.totalEngagements / currentStats.totalImpressions : 0,
                previousStats.totalImpressions > 0 ? previousStats.totalEngagements / previousStats.totalImpressions : 0
              )}
            />
            <StatCard
              label="Best Day"
              value={bestDay.date ? formatDateShort(bestDay.date) : '—'}
              subtitle={bestDay.value > 0 ? `${formatNumber(bestDay.value)} engagements` : ''}
            />
          </div>

          {/* SECTION D — Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Impressions & Engagement Trend</h3>
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
              <BarChart
                labels={['Likes', 'Reposts', 'Comments', 'Reactions']}
                datasets={[
                  {
                    label: 'Current Period',
                    data: [currentStats.totalLikes, currentStats.totalReposts, currentStats.totalComments, currentStats.totalReactions],
                    color: '#4479e1',
                  },
                  {
                    label: 'Previous Period',
                    data: [previousStats.totalLikes, previousStats.totalReposts, previousStats.totalComments, previousStats.totalReactions],
                    color: '#6b8cae',
                  },
                ]}
                title="Engagement by Type"
              />
            </div>
          </div>

          {activePlatforms.length > 1 && (
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Platform Comparison</h3>
              <BarChart
                labels={activePlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1))}
                datasets={[
                  { label: 'Posts', data: activePlatforms.map((p) => platformPosts[p]?.length || 0), color: '#1a2332' },
                  { label: 'Engagement', data: activePlatforms.map((p) => platformPosts[p]?.reduce((s, x) => s + (x.engagements || 0), 0) || 0), color: '#4479e1' },
                ]}
                title="Posts & Engagement by Platform"
              />
            </div>
          )}

          {/* SECTION E — Top Posts */}
          <div className="card">
            <h3 className="font-display text-lg font-medium text-navy mb-4">Top Posts</h3>
            <RichDataTable
              columns={[
                { key: 'post_date', label: 'Date', sortable: true, align: 'left' as const, render: (v: any) => <span className="text-xs">{formatDateShort(v)}</span> },
                { key: 'platform', label: 'Platform', sortable: true, align: 'left' as const, render: (v: any) => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v === 'twitter' ? 'bg-blue-50 text-blue-700' : v === 'instagram' ? 'bg-pink-50 text-pink-700' : 'bg-sky-50 text-sky-700'}`}>{v}</span> },
                { key: 'post_text', label: 'Post', align: 'left' as const, render: (v: any) => v ? <span className="block max-w-xs truncate" title={v}>{v.slice(0, 60)}{v.length > 60 ? '…' : ''}</span> : <span className="text-text-muted">—</span> },
                { key: 'likes', label: 'Likes', sortable: true, align: 'right' as const, render: (v: any) => <span className="text-sm">{formatNumber(v || 0)}</span> },
                { key: 'reposts', label: 'Reposts', sortable: true, align: 'right' as const, render: (v: any) => <span className="text-sm">{formatNumber(v || 0)}</span> },
                { key: 'engagements', label: 'Engagement', sortable: true, align: 'right' as const, render: (v: any) => <span className="text-sm font-medium text-navy">{formatNumber(v || 0)}</span> },
                { key: 'post_url', label: 'Link', align: 'center' as const, render: (v: any) => v ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-blue-accent"><ExternalLink className="w-4 h-4" /></a> : '—' },
              ]}
              rows={posts.slice(0, 25)}
              topN={25}
              pageSize={25}
              searchable
              searchKey="post_text"
            />
          </div>

          {/* SECTION F — Engagement Tier Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Tier Distribution</h3>
              <PieChart
                labels={['High (Top 25%)', 'Medium (Mid 50%)', 'Low (Bottom 25%)']}
                data={tierData}
                colors={['#1a2332', '#4479e1', '#6b8cae']}
              />
            </div>
            <div className="space-y-4">
              {[
                { label: 'High Engagement (Top 25%)', posts: tierPosts.high, color: '#1a2332' },
                { label: 'Medium Engagement (Mid 50%)', posts: tierPosts.medium, color: '#4479e1' },
                { label: 'Low Engagement (Bottom 25%)', posts: tierPosts.low, color: '#6b8cae' },
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

          {/* SECTION G — Export (bottom) */}
          <div className="flex justify-center gap-3">
            <button onClick={generateCSV} className="btn-secondary">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => window.print()} className="btn-primary">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
