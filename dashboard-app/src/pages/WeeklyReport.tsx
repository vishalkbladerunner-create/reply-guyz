import { useState, useMemo, useEffect } from 'react'
import { useClient } from '@/hooks/useClient'
import { useDashboardData } from '@/hooks/useDashboardData'
import StatCard from '@/components/StatCard'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import PlatformBadge from '@/components/PlatformBadge'
import BarChart from '@/components/Charts/BarChart'
import { formatNumber, formatDateShort } from '@/lib/utils'
import { getWeek, getYear, startOfWeek, endOfWeek, format, addWeeks, min, max } from 'date-fns'
import { Download, ExternalLink, FileText } from 'lucide-react'
import type { Post, EngagementOrder } from '@/lib/supabase'

interface WeekBucket {
  label: string
  weekNum: number
  start: Date
  end: Date
  posts: Post[]
  orders: EngagementOrder[]
}

export default function WeeklyReport() {
  const { selectedClientId, clients } = useClient()
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const { posts, engagementOrders, loading, error, refresh } = useDashboardData(
    selectedClientId,
    { preset: 'last30' },
    selectedClient?.active_platforms || undefined
  )

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const [recommendations, setRecommendations] = useState('')
  const [recommendationsSaved, setRecommendationsSaved] = useState(false)

  const weeks = useMemo(() => {
    if (posts.length === 0) return [] as WeekBucket[]
    const allDates = posts.map((p) => new Date(p.post_date + 'T00:00:00'))
    const minDate = min(allDates)
    const maxDate = max(allDates)

    const weekMap = new Map<string, WeekBucket>()
    let current = startOfWeek(minDate, { weekStartsOn: 1 })
    let weekNum = 1

    while (current <= maxDate) {
      const weekEnd = endOfWeek(current, { weekStartsOn: 1 })
      const key = `${getYear(current)}-W${getWeek(current, { weekStartsOn: 1 })}`
      weekMap.set(key, {
        label: `Week ${weekNum} (${format(current, 'MMM d')} – ${format(weekEnd < maxDate ? weekEnd : maxDate, 'MMM d')})`,
        weekNum,
        start: current,
        end: weekEnd < maxDate ? weekEnd : maxDate,
        posts: [],
        orders: [],
      })
      current = addWeeks(current, 1)
      weekNum++
    }

    posts.forEach((p) => {
      const d = new Date(p.post_date + 'T00:00:00')
      const key = `${getYear(d)}-W${getWeek(d, { weekStartsOn: 1 })}`
      if (weekMap.has(key)) weekMap.get(key)!.posts.push(p)
    })

    engagementOrders.forEach((o) => {
      if (!o.order_date) return
      const d = new Date(o.order_date + 'T00:00:00')
      const key = `${getYear(d)}-W${getWeek(d, { weekStartsOn: 1 })}`
      if (weekMap.has(key)) weekMap.get(key)!.orders.push(o)
    })

    return Array.from(weekMap.values())
  }, [posts, engagementOrders])

  const week = weeks[selectedWeekIndex]
  const prevWeek = weeks[selectedWeekIndex - 1]

  useEffect(() => {
    if (week) {
      const saved = localStorage.getItem(`recommendations-${week.label}`)
      setRecommendations(saved || 'What to repeat, what to change, what to test next week…')
      setRecommendationsSaved(false)
    }
  }, [selectedWeekIndex, week?.label])

  const weekStats = useMemo(() => {
    if (!week) return null
    const p = week.posts
    const totalLikes = p.reduce((s, x) => s + (x.likes || 0), 0)
    const totalReposts = p.reduce((s, x) => s + (x.reposts || 0), 0)
    const totalComments = p.reduce((s, x) => s + (x.comments || 0), 0)
    const totalReactions = p.reduce((s, x) => s + (x.reactions || 0), 0)
    const totalEngagement = totalLikes + totalReposts + totalComments + totalReactions
    const totalImpressions = p.reduce((s, x) => s + (x.impressions || 0), 0)
    const totalViewsOrdered = week.orders.reduce((s, o) => s + (o.views_ordered || 0), 0)
    const bestScore = p.length > 0 ? Math.max(...p.map((x) => x.engagements || 0)) : 0
    const avgEng = p.length > 0 ? totalEngagement / p.length : 0
    const boosted = week.orders.length
    const organic = p.length - boosted

    return { totalPosts: p.length, totalLikes, totalReposts, totalComments, totalReactions,
      totalEngagement, totalImpressions, totalViewsOrdered, bestScore, avgEng, boosted, organic }
  }, [week])

  const prevWeekStats = useMemo(() => {
    if (!prevWeek) return null
    const p = prevWeek.posts
    const totalLikes = p.reduce((s, x) => s + (x.likes || 0), 0)
    const totalReposts = p.reduce((s, x) => s + (x.reposts || 0), 0)
    const totalComments = p.reduce((s, x) => s + (x.comments || 0), 0)
    const totalReactions = p.reduce((s, x) => s + (x.reactions || 0), 0)
    const totalEngagement = totalLikes + totalReposts + totalComments + totalReactions
    const totalImpressions = p.reduce((s, x) => s + (x.impressions || 0), 0)
    return { totalPosts: p.length, totalEngagement, totalImpressions, avgEng: p.length > 0 ? totalEngagement / p.length : 0 }
  }, [prevWeek])

  const wowData = useMemo(() => {
    if (!weekStats || !prevWeekStats) return null
    const pctChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : 'N/A'
    return {
      posts: pctChange(weekStats.totalPosts, prevWeekStats.totalPosts),
      engagement: pctChange(weekStats.totalEngagement, prevWeekStats.totalEngagement),
      avg: pctChange(weekStats.avgEng, prevWeekStats.avgEng),
    }
  }, [weekStats, prevWeekStats])

  const aboveAvgPosts = useMemo(() => {
    if (!week) return []
    const avg = weekStats?.avgEng || 0
    return week.posts.filter((p) => (p.engagements || 0) > avg).sort((a, b) => (b.engagements || 0) - (a.engagements || 0))
  }, [week, weekStats])

  const belowAvgPosts = useMemo(() => {
    if (!week) return []
    const avg = weekStats?.avgEng || 0
    return week.posts.filter((p) => (p.engagements || 0) < avg).sort((a, b) => (a.engagements || 0) - (b.engagements || 0)).slice(0, 8)
  }, [week, weekStats])

  const boostedPosts = useMemo(() => {
    if (!week) return []
    const orderLinks = new Set(week.orders.filter((o) => o.views_ordered > 0).map((o) => o.link))
    return week.posts.filter((p) => p.post_url && orderLinks.has(p.post_url))
  }, [week])

  const organicPosts = useMemo(() => {
    if (!week) return []
    const orderLinks = new Set(week.orders.map((o) => o.link))
    return week.posts.filter((p) => !orderLinks.has(p.post_url || ''))
  }, [week])

  const boostedStats = useMemo(() => {
    const totalEng = boostedPosts.reduce((s, p) => s + (p.engagements || 0), 0)
    const avgEng = boostedPosts.length > 0 ? totalEng / boostedPosts.length : 0
    const avgImpr = boostedPosts.length > 0 ? boostedPosts.reduce((s, p) => s + (p.impressions || 0), 0) / boostedPosts.length : 0
    return { count: boostedPosts.length, totalEng, avgEng, avgImpr }
  }, [boostedPosts])

  const organicStats = useMemo(() => {
    const totalEng = organicPosts.reduce((s, p) => s + (p.engagements || 0), 0)
    const avgEng = organicPosts.length > 0 ? totalEng / organicPosts.length : 0
    return { count: organicPosts.length, totalEng, avgEng }
  }, [organicPosts])

  const topOrganic = useMemo(() => {
    return [...organicPosts].sort((a, b) => (b.engagements || 0) - (a.engagements || 0)).slice(0, 6)
  }, [organicPosts])

  const saveRecommendations = () => {
    if (week) {
      localStorage.setItem(`recommendations-${week.label}`, recommendations)
      setRecommendationsSaved(true)
      setTimeout(() => setRecommendationsSaved(false), 2000)
    }
  }

  const generateCSV = () => {
    if (!week) return
    const header = 'Date,Platform,Likes,Reposts,Comments,Reactions,Engagements,Impressions,Post URL'
    const rows = week.posts.map((p) =>
      [p.post_date, p.platform, p.likes, p.reposts, p.comments, p.reactions, p.engagements, p.impressions, p.post_url || ''].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weekly-report-${week.label.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <div className="space-y-8 printable">
      <div className="print-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">📝 Weekly Performance Report</h1>
          <p className="text-text-secondary mt-1">{(selectedClient?.name || 'Sandmark').toUpperCase()} · WEEKLY PERFORMANCE REPORT</p>
          {weeks.length > 0 && (
            <p className="text-xs text-text-muted mt-2">
              Report generated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 no-print">
          <select
            value={selectedWeekIndex}
            onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
            className="input-field py-2 w-64"
          >
            {weeks.map((w, i) => (
              <option key={i} value={i}>{w.label}</option>
            ))}
          </select>
          <button onClick={generateCSV} className="btn-secondary text-sm py-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => window.print()} className="btn-primary text-sm py-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {weeks.length === 0 ? (
        <EmptyState icon={FileText} title="No weekly data" description="No post data available to generate weekly reports." />
      ) : week && weekStats ? (
        <>
          <div>
            <h2 className="font-display text-xl font-medium text-navy mb-4">{week.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Posts Published" value={weekStats.totalPosts} />
              <StatCard label="Total Impressions" value={weekStats.totalImpressions} />
              <StatCard label="Total Engagements" value={weekStats.totalEngagement} />
              <StatCard label="Avg Engagement/Post" value={weekStats.avgEng.toFixed(1)} />
              <StatCard label="Best Post Score" value={weekStats.bestScore} />
              <StatCard label="Boosted Posts" value={weekStats.boosted} />
              <StatCard label="Organic Posts" value={weekStats.organic} />
              <StatCard label="Total Views Bought" value={weekStats.totalViewsOrdered} />
            </div>
          </div>

          {wowData && (
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Week-over-Week Comparison</h3>
              <BarChart
                labels={['Posts', 'Engagement', 'Avg/Post']}
                datasets={[
                  { label: 'Current Week', data: [
                    weekStats.totalPosts, weekStats.totalEngagement, parseFloat(weekStats.avgEng.toFixed(1))
                  ], color: '#1a2332' },
                  prevWeekStats ? { label: 'Previous Week', data: [
                    prevWeekStats.totalPosts, prevWeekStats.totalEngagement, parseFloat(prevWeekStats.avgEng.toFixed(1))
                  ], color: '#6b8cae' } : { label: 'Previous Week', data: [0, 0, 0], color: '#6b8cae' },
                ]}
              />
            </div>
          )}

          <div className="card overflow-x-auto">
            <h3 className="font-display text-lg font-medium text-navy mb-4">Weekly Summary</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/5">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Week</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Date Range</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Posts</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Bst</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Org</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Engagement</th>
                  <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Avg/Post</th>
                  <th className="text-center text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Top Post</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {weeks.map((w, i) => {
                  const p = w.posts
                  const eng = p.reduce((s, x) => s + (x.likes || 0) + (x.reposts || 0) + (x.comments || 0) + (x.reactions || 0), 0)
                  const avgEng = p.length > 0 ? eng / p.length : 0
                  const best = p.length > 0 ? Math.max(...p.map((x) => x.engagements || 0)) : 0
                  const topPost = p.find((x) => (x.engagements || 0) === best)
                  const boosted = w.orders.length
                  const organic = Math.max(0, p.length - boosted)
                  const isCurrent = i === selectedWeekIndex
                  return (
                    <tr key={i} className={`hover:bg-cream/50 transition-colors ${isCurrent ? 'bg-blue-accent/5' : ''}`}>
                      <td className="py-3 text-xs font-medium text-navy">Wk {w.weekNum}</td>
                      <td className="py-3 text-xs text-text-muted">{format(w.start, 'MMM d')} – {format(w.end, 'MMM d')}</td>
                      <td className="py-3 text-xs text-right">{p.length}</td>
                      <td className="py-3 text-xs text-right">{boosted}</td>
                      <td className="py-3 text-xs text-right">{organic}</td>
                      <td className="py-3 text-xs text-right font-medium">{formatNumber(eng)}</td>
                      <td className="py-3 text-xs text-right">{avgEng.toFixed(1)}</td>
                      <td className="py-3 text-xs text-center">
                        {topPost?.post_url ? (
                          <a href={topPost.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex text-text-muted hover:text-blue-accent">
                            <ExternalLink className="w-3.5 h-3.5" /> <span className="ml-1">{best}</span>
                          </a>
                        ) : best > 0 ? best : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {aboveAvgPosts.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-medium text-navy mb-1">What Worked This Week</h3>
              <p className="text-sm text-text-muted mb-4">Posts that performed above average</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aboveAvgPosts.slice(0, 6).map((p) => {
                  const diff = weekStats ? ((p.engagements || 0) - weekStats.avgEng) / weekStats.avgEng * 100 : 0
                  return (
                    <div key={p.id} className="card p-4 border-l-4 border-green-500">
                      <p className="text-sm text-text-primary line-clamp-2 mb-2">{p.post_text || 'No text'}</p>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <PlatformBadge platform={p.platform} />
                        <span className="text-xs text-text-muted">{formatDateShort(p.post_date)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted mb-2">
                        <span>Likes: {formatNumber(p.likes || 0)}</span>
                        <span>Reposts: {formatNumber(p.reposts || 0)}</span>
                        <span>Comments: {formatNumber(p.comments || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xl font-medium text-navy">{formatNumber(p.engagements || 0)}</span>
                        <span className="text-xs text-green-600">+{diff.toFixed(0)}% above avg</span>
                      </div>
                      {p.post_url && (
                        <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-accent hover:underline mt-2">
                          <ExternalLink className="w-3 h-3" /> View Post
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {belowAvgPosts.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-medium text-navy mb-1">What Didn't Work</h3>
              <p className="text-sm text-text-muted mb-4">Posts that underperformed</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {belowAvgPosts.map((p) => {
                  const diff = weekStats ? ((weekStats.avgEng - (p.engagements || 0)) / weekStats.avgEng * 100) : 0
                  return (
                    <div key={p.id} className="card p-4 border-l-4 border-red-400">
                      <p className="text-sm text-text-primary line-clamp-2 mb-2">{p.post_text || 'No text'}</p>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <PlatformBadge platform={p.platform} />
                        <span className="text-xs text-text-muted">{formatDateShort(p.post_date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xl font-medium text-navy">{formatNumber(p.engagements || 0)}</span>
                        <span className="text-xs text-red-500">-{diff.toFixed(0)}% below avg</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-display text-md font-medium text-navy mb-3">Boosted Posts ({boostedStats.count})</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-text-muted">Avg Engagement</span><span className="text-sm font-medium text-navy">{boostedStats.avgEng.toFixed(1)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-text-muted">Total Engagement</span><span className="text-sm font-medium text-navy">{formatNumber(boostedStats.totalEng)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-text-muted">Avg Impressions</span><span className="text-sm font-medium text-navy">{formatNumber(boostedStats.avgImpr)}</span></div>
              </div>
            </div>
            <div className="card">
              <h3 className="font-display text-md font-medium text-navy mb-3">Organic Posts ({organicStats.count})</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-text-muted">Avg Engagement</span><span className="text-sm font-medium text-navy">{organicStats.avgEng.toFixed(1)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-text-muted">Total Engagement</span><span className="text-sm font-medium text-navy">{formatNumber(organicStats.totalEng)}</span></div>
              </div>
            </div>
          </div>
          {boostedPosts.length > 0 && organicPosts.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">Boosted Avg: <strong>{boostedStats.avgEng.toFixed(1)} eng/post</strong></span>
                <span className="text-sm text-text-muted">vs</span>
                <span className="text-sm text-text-muted">Organic Avg: <strong>{organicStats.avgEng.toFixed(1)} eng/post</strong></span>
                <span className={`text-xs font-medium ml-2 px-2 py-0.5 rounded ${organicStats.avgEng > boostedStats.avgEng ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                  {organicStats.avgEng > boostedStats.avgEng ? 'Organic wins' : 'Boost helps'}
                </span>
              </div>
            </div>
          )}

          {topOrganic.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-medium text-navy mb-1">Organic Wins</h3>
              <p className="text-sm text-text-muted mb-4">Posts that performed well without any boost</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topOrganic.map((p) => (
                  <div key={p.id} className="card p-4 border-l-4 border-blue-accent">
                    <p className="text-sm text-text-primary line-clamp-2 mb-2">{p.post_text || 'No text'}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformBadge platform={p.platform} />
                      <span className="text-xs text-text-muted">{formatDateShort(p.post_date)}</span>
                    </div>
                    <span className="font-display text-xl font-medium text-navy">{formatNumber(p.engagements || 0)}</span>
                    {p.post_url && (
                      <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-accent hover:underline mt-2 block">
                        <ExternalLink className="w-3 h-3" /> View Post
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card no-print">
            <h3 className="font-display text-lg font-medium text-navy mb-3">Recommendations</h3>
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={4}
              className="input-field"
              placeholder="What to repeat, what to change, what to test next week…"
            />
            <button onClick={saveRecommendations} className="btn-primary mt-3 text-sm">
              {recommendationsSaved ? 'Saved!' : 'Save Recommendations'}
            </button>
          </div>

          <div className="flex justify-center gap-3 no-print">
            <button onClick={generateCSV} className="btn-secondary text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => window.print()} className="btn-primary text-sm">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </>
      ) : (
        <EmptyState icon={FileText} title="No data" description="No post data available for the selected week." />
      )}
    </div>
  )
}
