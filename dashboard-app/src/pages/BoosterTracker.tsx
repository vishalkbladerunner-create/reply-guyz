import { useState, useMemo } from 'react'
import { useClient } from '@/hooks/useClient'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useEngagementOrders } from '@/hooks/useEngagementOrders'
import StatCard from '@/components/StatCard'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import PlatformBadge from '@/components/PlatformBadge'
import RichDataTable from '@/components/RichDataTable'
import BarChart from '@/components/Charts/BarChart'
import { formatNumber, formatDateShort } from '@/lib/utils'
import { getWeek, getYear, startOfWeek, endOfWeek, min, max, addWeeks } from 'date-fns'
import { ExternalLink, Eye, TrendingUp, Zap } from 'lucide-react'
import type { EngagementOrder } from '@/lib/supabase'

export default function BoosterTracker() {
  const { selectedClientId, clients } = useClient()
  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const [platformFilter, setPlatformFilter] = useState('All')
  const [weekFilter, setWeekFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [estimatedSpend, setEstimatedSpend] = useState<number>(() => {
    const saved = localStorage.getItem('booster-estimated-spend')
    return saved ? Number(saved) : 0
  })

  const { orders, loading, error, refresh } = useEngagementOrders(selectedClientId, {
    platform: platformFilter,
    status: statusFilter,
  })
  const { posts } = useDashboardData(
    selectedClientId,
    { preset: 'last30' },
    selectedClient?.active_platforms || undefined
  )

  const weeks = useMemo(() => {
    if (orders.length === 0) return []
    const allDates = orders
      .filter((o) => o.order_date)
      .map((o) => new Date(o.order_date! + 'T00:00:00'))
    if (allDates.length === 0) return []

    const minDate = min(allDates)
    const maxDate = max(allDates)

    const weekMap = new Map<string, { label: string; orders: EngagementOrder[]; start: Date; end: Date }>()
    let current = startOfWeek(minDate, { weekStartsOn: 1 })
    let weekNum = 1

    while (current <= maxDate) {
      const weekEnd = endOfWeek(current, { weekStartsOn: 1 })
      const key = `${getYear(current)}-W${getWeek(current, { weekStartsOn: 1 })}`
      weekMap.set(key, {
        label: `Week ${weekNum}`,
        orders: [],
        start: current,
        end: weekEnd < maxDate ? weekEnd : maxDate,
      })
      current = addWeeks(current, 1)
      weekNum++
    }

    orders.forEach((o) => {
      if (!o.order_date) return
      const d = new Date(o.order_date + 'T00:00:00')
      const key = `${getYear(d)}-W${getWeek(d, { weekStartsOn: 1 })}`
      if (weekMap.has(key)) weekMap.get(key)!.orders.push(o)
    })

    return Array.from(weekMap.values())
  }, [orders])

  const filteredOrders = useMemo(() => {
    let result = orders
    if (weekFilter !== 'All') {
      const w = weeks.find((w) => w.label === weekFilter)
      if (w) result = w.orders
    }
    return result
  }, [orders, weekFilter, weeks])

  const totalViews = filteredOrders.reduce((s, o) => s + (o.views_ordered || 0), 0)
  const totalBoosted = filteredOrders.length
  const avgViews = totalBoosted > 0 ? totalViews / totalBoosted : 0

  const orderTableColumns = useMemo(() => [
    { key: 'index', label: '#', align: 'left' as const, render: (_v: any, _r: any, i?: number) => <span className="text-xs text-text-muted">{(i || 0) + 1}</span> },
    { key: 'link', label: 'Link', align: 'left' as const,
      render: (v: any, r: any) => (
        <a href={v} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-accent hover:underline max-w-[200px] truncate">
          <span className="truncate">{v || r.post_url || '—'}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ),
    },
    { key: 'platform', label: 'Platform', sortable: true, align: 'left' as const, render: (v: string) => <PlatformBadge platform={v} /> },
    { key: 'order_date', label: 'Date Boosted', sortable: true, align: 'left' as const, render: (v: string) => v ? <span className="text-xs">{formatDateShort(v)}</span> : <span className="text-text-muted">—</span> },
    { key: 'views_ordered', label: 'Views Bought', sortable: true, align: 'right' as const, render: (v: number) => <span className="text-sm font-medium">{formatNumber(v || 0)}</span> },
    { key: 'status', label: 'Status', sortable: true, align: 'center' as const,
      render: (v: string) => {
        const colors: Record<string, string> = {
          Done: 'bg-green-50 text-green-700',
          'In Progress': 'bg-blue-50 text-blue-700',
          Pending: 'bg-yellow-50 text-yellow-700',
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[v] || 'bg-gray-100 text-gray-700'}`}>
            {v || 'Done'}
          </span>
        )
      },
    },
    { key: 'actions', label: 'Actions', align: 'center' as const,
      render: (_v: any, r: any) => (
        <a href={r.link || r.post_url || '#'} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-blue-accent transition-colors">
          <ExternalLink className="w-4 h-4" />
        </a>
      )
    },
  ], [])

  const weekChartData = useMemo(() => {
    if (weeks.length === 0) return { labels: [], views: [], counts: [] }
    return {
      labels: weeks.map((w) => w.label),
      views: weeks.map((w) => w.orders.reduce((s, o) => s + (o.views_ordered || 0), 0)),
      counts: weeks.map((w) => w.orders.length),
    }
  }, [weeks])

  const saveEstimatedSpend = () => {
    localStorage.setItem('booster-estimated-spend', String(estimatedSpend))
  }

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">🚀 Boosted Posts Tracker</h1>
          <p className="text-text-secondary mt-1">
            Total Views Purchased: <strong>{formatNumber(totalViews)}</strong> · Boosted Posts: <strong>{totalBoosted}</strong>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Platform:</span>
        {['All', 'Twitter', 'Instagram', 'Telegram'].map((f) => (
          <button
            key={f}
            onClick={() => setPlatformFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              platformFilter === f ? 'bg-navy text-white' : 'bg-white text-text-secondary hover:bg-cream border border-navy/10'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold ml-4">Week:</span>
        <select value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)} className="input-field py-1.5 w-36 text-sm">
          <option value="All">All Weeks</option>
          {weeks.map((w) => (
            <option key={w.label} value={w.label}>{w.label}</option>
          ))}
        </select>
        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold ml-4">Status:</span>
        {['All', 'Done', 'In Progress', 'Pending'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f ? 'bg-blue-accent text-white' : 'bg-white text-text-secondary hover:bg-cream border border-navy/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Views Purchased" value={totalViews} icon={Eye} />
        <StatCard label="Total Boosted Posts" value={totalBoosted} icon={Zap} />
        <StatCard label="Avg Views per Boost" value={avgViews.toFixed(0)} icon={TrendingUp} />
        <div className="card card-hover">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Spent (Estimated)</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-text-muted">$</span>
            <input
              type="number"
              value={estimatedSpend || ''}
              onChange={(e) => setEstimatedSpend(Number(e.target.value))}
              onBlur={saveEstimatedSpend}
              className="w-24 px-2 py-1 border border-navy/10 rounded-lg text-2xl font-display font-medium text-navy"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {weekChartData.labels.length > 0 && (
        <div className="card">
          <h3 className="font-display text-lg font-medium text-navy mb-4">Weekly Booster Breakdown</h3>
          <BarChart
            labels={weekChartData.labels}
            datasets={[
              { label: 'Views Bought', data: weekChartData.views, color: '#1a2332' },
              { label: 'Boosted Posts', data: weekChartData.counts, color: '#4479e1' },
            ]}
          />
        </div>
      )}

      <div className="card">
        <h3 className="font-display text-lg font-medium text-navy mb-4">All Boosted Posts</h3>
        {filteredOrders.length === 0 ? (
          <EmptyState icon={Zap} title="No boosted posts" description="No engagement orders found for the selected filters." />
        ) : (
          <RichDataTable
            columns={orderTableColumns}
            rows={filteredOrders}
            searchable
            searchKey="link"
            pageSize={25}
            emptyMessage="No orders match your filters"
          />
        )}
      </div>

      {totalBoosted > 0 && totalViews > 0 && (
        <div className="card">
          <h3 className="font-display text-lg font-medium text-navy mb-3">ROI Estimation</h3>
          <p className="text-sm text-text-muted">
            For <strong>{formatNumber(totalViews)}</strong> views purchased across <strong>{totalBoosted}</strong> posts,
            averaging <strong>{formatNumber(avgViews)}</strong> views per boost.
          </p>
          {posts.length > 0 && (
            <p className="text-sm text-text-muted mt-2">
              Across all tracked posts, average impressions received: <strong>{formatNumber(posts.reduce((s, p) => s + (p.impressions || 0), 0) / posts.length)}</strong> per post.
            </p>
          )}
        </div>
      )}

      {weeks.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-medium text-navy mb-4">Weekly Boost Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeks.map((w, i) => {
              const views = w.orders.reduce((s, o) => s + (o.views_ordered || 0), 0)
              const cnt = w.orders.length
              const avg = cnt > 0 ? views / cnt : 0
              return (
                <div key={i} className="card p-4">
                  <p className="text-sm font-medium text-navy">{w.label}</p>
                  <div className="space-y-1 mt-2">
                    <p className="text-xs text-text-muted">{cnt} boosts</p>
                    <p className="text-xs text-text-muted">{formatNumber(views)} views</p>
                    <p className="text-xs text-text-muted">avg {formatNumber(avg)} views/boost</p>
                  </div>
                  {i > 0 && (
                    <div className={`text-xs mt-2 font-medium ${cnt > weeks[i - 1].orders.length ? 'text-green-600' : 'text-text-muted'}`}>
                      {cnt > weeks[i - 1].orders.length ? '↑' : '↓'} vs prev week
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
