import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface KpiData {
  label: string
  value: number
  change?: number
  prefix?: string
  suffix?: string
}

interface KpiCardsProps {
  kpis: KpiData[]
}

export default function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const isPositive = kpi.change && kpi.change > 0
        const isNegative = kpi.change && kpi.change < 0
        const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

        return (
          <div key={index} className="card card-hover">
            <p className="text-sm text-text-muted mb-1">{kpi.label}</p>
            <p className="text-2xl font-display font-medium text-navy">
              {kpi.prefix}{formatNumber(kpi.value)}{kpi.suffix}
            </p>
            {kpi.change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-text-muted'}`}>
                <Icon className="w-4 h-4" />
                <span>{isPositive ? '+' : ''}{kpi.change}%</span>
                <span className="text-text-muted ml-1">vs last period</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
