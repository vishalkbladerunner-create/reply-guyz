import { useState, useEffect } from 'react'
import { useClient } from '@/hooks/useClient'
import { supabase } from '@/lib/supabase'
import { ExternalLink, CheckCircle, Clock, Filter, Loader2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

const platformFilters = ['All', 'Twitter', 'Instagram', 'Telegram']
const statusFilters = ['All', 'Done', 'Pending', 'In Progress']

export default function EngagementOrders() {
  const { selectedClientId } = useClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }
    fetchOrders()
  }, [selectedClientId])

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('engagement_orders')
      .select('*')
      .eq('client_id', selectedClientId!)
      .order('order_date', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const filtered = orders.filter((o) => {
    const matchPlatform = platformFilter === 'All' || o.platform?.toLowerCase() === platformFilter.toLowerCase()
    const matchStatus = statusFilter === 'All' || o.status === statusFilter
    return matchPlatform && matchStatus
  })

  const totalViews = filtered.reduce((sum, o) => sum + (o.views_ordered || 0), 0)
  const totalFollowers = filtered.reduce((sum, o) => sum + (o.followers_ordered || 0), 0)

  if (!selectedClientId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-medium text-navy mb-2">Select a Client</h2>
          <p className="text-text-secondary">Choose a company from the sidebar to view engagement orders.</p>
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
      <div>
        <h1 className="font-display text-3xl font-medium text-navy">Engagement Orders</h1>
        <p className="text-text-secondary mt-1">Track paid engagement and boost campaigns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-text-muted">Total Orders</p>
          <p className="text-2xl font-display font-medium text-navy mt-1">{filtered.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-muted">Total Views Ordered</p>
          <p className="text-2xl font-display font-medium text-navy mt-1">{formatNumber(totalViews)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-muted">Followers Boosted</p>
          <p className="text-2xl font-display font-medium text-navy mt-1">{formatNumber(totalFollowers)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Filter:</span>
        </div>
        <div className="flex gap-2">
          {platformFilters.map((f) => (
            <button
              key={f}
              onClick={() => setPlatformFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                platformFilter === f
                  ? 'bg-navy text-white'
                  : 'bg-white text-text-secondary hover:bg-cream border border-navy/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-blue-accent text-white'
                  : 'bg-white text-text-secondary hover:bg-cream border border-navy/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No engagement orders yet for this client.</p>
          <p className="text-text-muted text-sm mt-1">Add orders via Data Entry → Engagement Order.</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy/5">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Platform</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Link</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Views</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Followers</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Likes</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Reposts</th>
                  <th className="text-center text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Status</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/50 transition-colors">
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.platform === 'twitter' ? 'bg-blue-50 text-blue-700' :
                        order.platform === 'instagram' ? 'bg-pink-50 text-pink-700' :
                        'bg-sky-50 text-sky-700'
                      }`}>
                        {order.platform}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-text-primary max-w-xs truncate">
                      <a href={order.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-accent transition-colors">
                        {order.link}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 text-sm text-text-primary text-right">{formatNumber(order.views_ordered || 0)}</td>
                    <td className="py-3 text-sm text-text-primary text-right">{formatNumber(order.followers_ordered || 0)}</td>
                    <td className="py-3 text-sm text-text-primary text-right">{formatNumber(order.likes_ordered || 0)}</td>
                    <td className="py-3 text-sm text-text-primary text-right">{formatNumber(order.reposts_ordered || 0)}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Done' ? 'bg-green-50 text-green-700' :
                        order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {order.status === 'Done' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-text-muted whitespace-nowrap">{order.order_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
