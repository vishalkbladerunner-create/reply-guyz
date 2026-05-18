import { useState, useEffect } from 'react'
import { useClient } from '@/hooks/useClient'
import { supabase } from '@/lib/supabase'
import { Download, FileText, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import KpiCards from '@/components/KpiCards'
import LineChart from '@/components/Charts/LineChart'
import BarChart from '@/components/Charts/BarChart'
import DateRangePicker, { type DateRange, getDateRangeValue } from '@/components/DateRangePicker'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, subMonths } from 'date-fns'

const reportTypes = [
  { key: 'weekly', label: 'Weekly Report', description: 'Automatically generated every Monday' },
  { key: 'monthly', label: 'Monthly Report', description: 'Automatically generated on the 1st of each month' },
  { key: 'custom', label: 'Custom Date Range', description: 'Pick any date range to analyze' },
]

export default function Reports() {
  const { selectedClientId } = useClient()
  const [selectedType, setSelectedType] = useState('custom')
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last7' })
  const [metrics, setMetrics] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { start, end } = getDateRangeValue(dateRange)
  const isWeekly = selectedType === 'weekly'
  const isMonthly = selectedType === 'monthly'

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }
    fetchData()
  }, [selectedClientId, dateRange, selectedType])

  const fetchData = async () => {
    setLoading(true)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const [{ data: metricsData }, { data: postsData }] = await Promise.all([
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', selectedClientId!)
        .gte('metric_date', startStr)
        .lte('metric_date', endStr)
        .order('metric_date'),
      supabase
        .from('posts')
        .select('*')
        .eq('client_id', selectedClientId!)
        .gte('post_date', startStr)
        .lte('post_date', endStr),
    ])

    setMetrics(metricsData || [])
    setPosts(postsData || [])
    setLoading(false)
  }

  // Aggregate by date for charts
  const dailyMap = new Map<string, any>()
  metrics.forEach((m) => {
    const existing = dailyMap.get(m.metric_date) || { impressions: 0, engagements: 0, likes: 0, reposts: 0, followers: 0, posts: 0 }
    dailyMap.set(m.metric_date, {
      impressions: existing.impressions + (m.impressions || 0),
      engagements: existing.engagements + (m.engagements || 0),
      likes: existing.likes + (m.likes || 0),
      reposts: existing.reposts + (m.reposts || 0),
      followers: m.net_followers || existing.followers,
      posts: existing.posts + (m.posts_created || 0),
    })
  })
  const sortedDates = Array.from(dailyMap.keys()).sort()
  const reportData = sortedDates.map((d) => ({ date: d, ...dailyMap.get(d) }))

  const totalImpressions = metrics.reduce((sum, d) => sum + (d.impressions || 0), 0)
  const totalEngagements = metrics.reduce((sum, d) => sum + (d.engagements || 0), 0)
  const totalPosts = posts.length
  const avgEngagementRate = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(1) : '0'

  const kpis = [
    { label: 'Total Impressions', value: totalImpressions, prefix: '' },
    { label: 'Total Engagements', value: totalEngagements, prefix: '' },
    { label: 'Engagement Rate', value: parseFloat(avgEngagementRate), suffix: '%' },
    { label: 'Posts Published', value: totalPosts, prefix: '' },
  ]

  const dates = reportData.map((d) => d.date)
  const impressionsData = reportData.map((d) => d.impressions)
  const engagementsData = reportData.map((d) => d.engagements)

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Impressions', 'Engagements', 'Likes', 'Reposts', 'Posts'].join(','),
      ...reportData.map((d) => [d.date, d.impressions, d.engagements, d.likes, d.reposts, d.posts].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${selectedType}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!selectedClientId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-medium text-navy mb-2">Select a Client</h2>
          <p className="text-text-secondary">Choose a company from the sidebar to generate reports.</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">Reports</h1>
          <p className="text-text-secondary mt-1">Generate and export performance reports</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reportTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => setSelectedType(type.key)}
            className={`card text-left transition-all ${
              selectedType === type.key ? 'ring-2 ring-blue-accent bg-blue-accent/5' : 'card-hover'
            }`}
          >
            <div className="flex items-start justify-between">
              <FileText className={`w-5 h-5 ${selectedType === type.key ? 'text-blue-accent' : 'text-text-muted'}`} />
              {selectedType === type.key && <ChevronRight className="w-4 h-4 text-blue-accent" />}
            </div>
            <h3 className="font-display text-lg font-medium text-navy mt-3">{type.label}</h3>
            <p className="text-sm text-text-secondary mt-1">{type.description}</p>
          </button>
        ))}
      </div>

      {selectedType === 'custom' && (
        <div className="card flex items-center gap-4">
          <Calendar className="w-5 h-5 text-text-muted" />
          <div>
            <p className="text-sm text-text-muted">Select Date Range</p>
            <div className="mt-2">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
          <div className="ml-auto text-sm text-text-secondary">
            {format(start, 'MMM d, yyyy')} — {format(end, 'MMM d, yyyy')}
          </div>
        </div>
      )}

      {selectedType !== 'custom' && (
        <div className="card">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-text-muted" />
            <div>
              <p className="text-sm text-text-muted">Report Period</p>
              <p className="text-navy font-medium">
                {isWeekly && `Week of ${format(startOfWeek(subDays(new Date(), 7)), 'MMM d')} — ${format(endOfWeek(subDays(new Date(), 7)), 'MMM d, yyyy')}`}
                {isMonthly && `${format(startOfMonth(subMonths(new Date(), 1)), 'MMMM yyyy')}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <KpiCards kpis={kpis} />

      {metrics.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No data yet for this period.</p>
          <p className="text-text-muted text-sm mt-1">Upload data via Data Entry to generate reports.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Impressions & Engagements</h3>
              <LineChart
                labels={dates}
                datasets={[
                  { label: 'Impressions', data: impressionsData, color: '#4479e1' },
                  { label: 'Engagements', data: engagementsData, color: '#1a2332' },
                ]}
              />
            </div>
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Engagement Breakdown</h3>
              <BarChart
                labels={['Likes', 'Reposts', 'Comments', 'Shares']}
                datasets={[
                  { label: 'Current Period', data: [
                    metrics.reduce((s, m) => s + (m.likes || 0), 0),
                    metrics.reduce((s, m) => s + (m.reposts || 0), 0),
                    metrics.reduce((s, m) => s + (m.replies || 0), 0),
                    metrics.reduce((s, m) => s + (m.shares || 0), 0),
                  ], color: '#4479e1' },
                  { label: 'Previous Period', data: [0, 0, 0, 0], color: '#6b8cae' },
                ]}
                title="Engagement Types"
              />
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg font-medium text-navy mb-4">Report Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-navy/5">
                <span className="text-text-secondary">Report Type</span>
                <span className="font-medium text-navy capitalize">{selectedType} Report</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-navy/5">
                <span className="text-text-secondary">Period</span>
                <span className="font-medium text-navy">{format(start, 'MMM d')} — {format(end, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-navy/5">
                <span className="text-text-secondary">Total Posts</span>
                <span className="font-medium text-navy">{totalPosts}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-navy/5">
                <span className="text-text-secondary">Avg Engagement Rate</span>
                <span className="font-medium text-navy">{avgEngagementRate}%</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">Net Follower Growth</span>
                <span className="font-medium text-green-600">+{metrics[metrics.length - 1]?.net_followers || 0}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
