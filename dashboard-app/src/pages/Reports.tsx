import { useState } from 'react'
import { Download, FileText, Calendar, ChevronRight } from 'lucide-react'
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

const weeklyData = [
  { date: '2026-04-28', impressions: 125000, engagements: 18500, likes: 3200, reposts: 4100, followers: 3520, posts: 180 },
  { date: '2026-05-05', impressions: 132000, engagements: 19800, likes: 3450, reposts: 4350, followers: 3661, posts: 195 },
]

const monthlyData = [
  { date: '2026-04-01', impressions: 520000, engagements: 78000, likes: 13500, reposts: 17200, followers: 3200, posts: 750 },
  { date: '2026-05-01', impressions: 145000, engagements: 21800, likes: 3800, reposts: 4800, followers: 3661, posts: 210 },
]

export default function Reports() {
  const [selectedType, setSelectedType] = useState('custom')
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'last7' })

  const { start, end } = getDateRangeValue(dateRange)
  const isWeekly = selectedType === 'weekly'
  const isMonthly = selectedType === 'monthly'

  let reportData = weeklyData
  if (isMonthly) reportData = monthlyData
  if (selectedType === 'custom') {
    reportData = [
      { date: format(start, 'yyyy-MM-dd'), impressions: 21646, engagements: 3288, likes: 520, reposts: 622, followers: 3661, posts: 34 },
      { date: format(end, 'yyyy-MM-dd'), impressions: 11599, engagements: 2992, likes: 410, reposts: 658, followers: 3669, posts: 41 },
    ]
  }

  const totalImpressions = reportData.reduce((sum, d) => sum + d.impressions, 0)
  const totalEngagements = reportData.reduce((sum, d) => sum + d.engagements, 0)
  const totalPosts = reportData.reduce((sum, d) => sum + d.posts, 0)
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
      ['Date', 'Impressions', 'Engagements', 'Likes', 'Reposts', 'Followers', 'Posts'].join(','),
      ...reportData.map((d) => [d.date, d.impressions, d.engagements, d.likes, d.reposts, d.followers, d.posts].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${selectedType}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
              { label: 'Current Period', data: [3200, 1500, 450, 320], color: '#4479e1' },
              { label: 'Previous Period', data: [2800, 1200, 380, 280], color: '#6b8cae' },
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
            <span className="font-medium text-green-600">+{reportData[reportData.length - 1]?.followers || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
