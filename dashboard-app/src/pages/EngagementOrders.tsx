import { useState } from 'react'
import { ExternalLink, CheckCircle, Clock, Filter } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface Order {
  id: number
  platform: string
  link: string
  postUrl: string
  date: string
  followers: number
  comments: number
  reposts: number
  likes: number
  views: number
  status: 'Done' | 'Pending' | 'In Progress'
}

const orders: Order[] = [
  { id: 1, platform: 'Twitter', link: 'https://x.com/sandmark_news/...', postUrl: 'https://x.com/sandmark_news/status/123', date: '2026-05-04', followers: 0, comments: 0, reposts: 0, likes: 0, views: 1000, status: 'Done' },
  { id: 2, platform: 'Twitter', link: 'https://x.com/sandmark_news/...', postUrl: 'https://x.com/sandmark_news/status/124', date: '2026-05-04', followers: 0, comments: 0, reposts: 0, likes: 0, views: 500, status: 'Done' },
  { id: 3, platform: 'Twitter', link: 'https://x.com/sandmark_news/...', postUrl: 'https://x.com/sandmark_news/status/125', date: '2026-05-05', followers: 0, comments: 0, reposts: 0, likes: 0, views: 1000, status: 'Done' },
  { id: 4, platform: 'Telegram', link: 'https://t.me/sandmark_news/...', postUrl: 'https://t.me/sandmark_news/100', date: '2026-05-05', followers: 0, comments: 0, reposts: 0, likes: 0, views: 200, status: 'Done' },
  { id: 5, platform: 'Telegram', link: 'https://t.me/sandmark_news/...', postUrl: 'https://t.me/sandmark_news/101', date: '2026-05-06', followers: 0, comments: 0, reposts: 0, likes: 0, views: 500, status: 'Done' },
  { id: 6, platform: 'Twitter', link: 'https://x.com/sandmark_news/...', postUrl: 'https://x.com/sandmark_news/status/126', date: '2026-05-06', followers: 0, comments: 0, reposts: 0, likes: 0, views: 1000, status: 'Done' },
  { id: 7, platform: 'Twitter', link: '@sandmark_news', postUrl: '', date: '2026-05-01', followers: 2000, comments: 0, reposts: 0, likes: 0, views: 0, status: 'Done' },
  { id: 8, platform: 'Telegram', link: 'https://t.me/sandmark_news/...', postUrl: 'https://t.me/sandmark_news/102', date: '2026-05-07', followers: 0, comments: 0, reposts: 0, likes: 0, views: 100, status: 'Done' },
]

const platformFilters = ['All', 'Twitter', 'Instagram', 'Telegram']
const statusFilters = ['All', 'Done', 'Pending', 'In Progress']

export default function EngagementOrders() {
  const [platformFilter, setPlatformFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = orders.filter((o) => {
    const matchPlatform = platformFilter === 'All' || o.platform === platformFilter
    const matchStatus = statusFilter === 'All' || o.status === statusFilter
    return matchPlatform && matchStatus
  })

  const totalViews = filtered.reduce((sum, o) => sum + o.views, 0)
  const totalFollowers = filtered.reduce((sum, o) => sum + o.followers, 0)

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

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy/5">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">#</th>
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
                  <td className="py-3 text-sm text-text-muted">{order.id}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.platform === 'Twitter' ? 'bg-blue-50 text-blue-700' :
                      order.platform === 'Instagram' ? 'bg-pink-50 text-pink-700' :
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
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(order.views)}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(order.followers)}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(order.likes)}</td>
                  <td className="py-3 text-sm text-text-primary text-right">{formatNumber(order.reposts)}</td>
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
                  <td className="py-3 text-sm text-text-muted whitespace-nowrap">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
