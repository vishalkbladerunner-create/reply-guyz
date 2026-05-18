import { useState, useMemo } from 'react'
import { useClient } from '@/hooks/useClient'
import { useEngagementOrders } from '@/hooks/useEngagementOrders'
import StatCard from '@/components/StatCard'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import PlatformBadge from '@/components/PlatformBadge'
import RichDataTable from '@/components/RichDataTable'
import PieChart from '@/components/Charts/PieChart'
import { formatNumber, formatDateShort } from '@/lib/utils'
import { CheckCircle, Clock, ExternalLink, Filter, ShoppingCart, Eye, Users } from 'lucide-react'

const platformFilters = ['All', 'Twitter', 'Instagram', 'Telegram']
const statusFilters = ['All', 'Done', 'In Progress', 'Pending']

export default function EngagementOrders() {
  const { selectedClientId } = useClient()
  const [platformFilter, setPlatformFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const { orders, loading, error, refresh } = useEngagementOrders(selectedClientId, {
    platform: platformFilter,
    status: statusFilter,
  })

  const filtered = orders

  const totalViews = filtered.reduce((sum, o) => sum + (o.views_ordered || 0), 0)
  const totalFollowers = filtered.reduce((sum, o) => sum + (o.followers_ordered || 0), 0)

  const statusCounts = useMemo(() => {
    const done = orders.filter((o) => o.status === 'Done').length
    const inProgress = orders.filter((o) => o.status === 'In Progress').length
    const pending = orders.filter((o) => o.status === 'Pending').length
    const completed = orders.length > 0 ? Math.round((done / orders.length) * 100) : 0
    return { done, inProgress, pending, completed }
  }, [orders])

  const tableColumns = useMemo(() => [
    { key: 'id_prefix', label: 'ID', align: 'left' as const, render: (_: any, r: any) => <span className="text-xs text-text-muted font-mono">{r.id?.slice(0, 8) || '—'}</span> },
    { key: 'platform', label: 'Platform', sortable: true, align: 'left' as const, render: (v: string) => <PlatformBadge platform={v} /> },
    { key: 'link', label: 'Link', align: 'left' as const,
      render: (v: any, r: any) => (
        <a href={v || r.post_url || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-accent hover:underline max-w-[180px] truncate">
          <span className="truncate">{v || r.post_url || '—'}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ),
    },
    { key: 'views_ordered', label: 'Views', sortable: true, align: 'right' as const, render: (v: number) => <span className="text-sm">{formatNumber(v || 0)}</span> },
    { key: 'followers_ordered', label: 'Followers', sortable: true, align: 'right' as const, render: (v: number) => <span className="text-sm">{formatNumber(v || 0)}</span> },
    { key: 'likes_ordered', label: 'Likes', sortable: true, align: 'right' as const, render: (v: number) => <span className="text-sm">{formatNumber(v || 0)}</span> },
    { key: 'reposts_ordered', label: 'Reposts', sortable: true, align: 'right' as const, render: (v: number) => <span className="text-sm">{formatNumber(v || 0)}</span> },
    { key: 'status', label: 'Status', sortable: true, align: 'center' as const,
      render: (v: string) => {
        const statusStyles: Record<string, string> = {
          Done: 'bg-green-50 text-green-700',
          'In Progress': 'bg-blue-50 text-blue-700',
          Pending: 'bg-yellow-50 text-yellow-700',
        }
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[v] || 'bg-gray-100 text-gray-700'}`}>
            {v === 'Done' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {v || 'Done'}
          </span>
        )
      },
    },
    { key: 'order_date', label: 'Order Date', sortable: true, align: 'left' as const, render: (v: string) => v ? <span className="text-xs whitespace-nowrap">{formatDateShort(v)}</span> : <span className="text-text-muted">—</span> },
    { key: 'actions', label: 'Actions', align: 'center' as const,
      render: (_: any, r: any) => (
        <a href={r.link || r.post_url || '#'} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-blue-accent transition-colors">
          <ExternalLink className="w-4 h-4" />
        </a>
      )
    },
  ], [])

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium text-navy">🛒 Engagement Orders</h1>
        <p className="text-text-secondary mt-1">Track paid engagement and boost campaigns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={filtered.length} icon={ShoppingCart} />
        <StatCard label="Views Ordered" value={totalViews} icon={Eye} />
        <StatCard label="Followers Boosted" value={totalFollowers} icon={Users} />
        <StatCard label="Completion Rate" value={statusCounts.completed + '%'} icon={CheckCircle} />
      </div>

      {/* Status Breakdown + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {orders.length > 0 && (
          <div className="card">
            <h3 className="font-display text-md font-medium text-navy mb-3">Status Breakdown</h3>
            <PieChart
              labels={['Done', 'In Progress', 'Pending']}
              data={[statusCounts.done, statusCounts.inProgress, statusCounts.pending]}
              colors={['#22c55e', '#4479e1', '#eab308']}
            />
          </div>
        )}
        <div className={`space-y-4 ${orders.length > 0 ? 'lg:col-span-2' : ''}`}>
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium text-navy">Filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-text-muted mr-1 flex items-center">Platform:</span>
              {platformFilters.map((f) => (
                <button
                  key={`p-${f}`}
                  onClick={() => setPlatformFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    platformFilter === f ? 'bg-navy text-white' : 'bg-white text-text-secondary hover:bg-cream border border-navy/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-text-muted mr-1 flex items-center">Status:</span>
              {statusFilters.map((f) => (
                <button
                  key={`s-${f}`}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === f ? 'bg-blue-accent text-white' : 'bg-white text-text-secondary hover:bg-cream border border-navy/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="No engagement orders yet for this client, or none match your filters."
          />
        ) : (
          <RichDataTable
            columns={tableColumns}
            rows={filtered}
            searchable
            searchKey="link"
            pageSize={25}
            emptyMessage="No orders match your filters"
          />
        )}
      </div>
    </div>
  )
}
