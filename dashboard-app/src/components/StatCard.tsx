import { cn, formatNumber } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1a2332',
  instagram: '#4479e1',
  telegram: '#6b8cae',
}

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '𝕏',
  instagram: '📸',
  telegram: '✈️',
}

interface StatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  change?: { value: number; positive: boolean }
  subtitle?: string
  platformSubtitle?: string
  platform?: string
  variant?: 'default' | 'highlight' | 'compact'
  suffix?: string
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  change,
  subtitle,
  platformSubtitle,
  platform,
  variant = 'default',
  suffix,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'card card-hover relative overflow-hidden',
        variant === 'compact' && 'p-4'
      )}
      style={
        platform
          ? { borderLeft: `4px solid ${PLATFORM_COLORS[platform] || '#1a2332'}` }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn(
            'font-display font-medium text-navy mt-1',
            variant === 'compact' ? 'text-lg' : 'text-2xl'
          )}>
            {typeof value === 'number' && value < 1000 && !suffix ? value.toLocaleString() : typeof value === 'number' ? formatNumber(value) : value}
            {suffix}
          </p>
          {platformSubtitle && (
            <p className="text-xs text-text-muted mt-1 truncate">{platformSubtitle}</p>
          )}
          {subtitle && (
            <p className="text-xs text-text-muted mt-1 truncate">{subtitle}</p>
          )}
          {change && (
            <div className={cn(
              'flex items-center gap-1 mt-1.5 text-xs font-medium',
              change.positive ? 'text-green-600' : 'text-red-500'
            )}>
              <span>{change.positive ? '↑' : '↓'}</span>
              <span>{Math.abs(change.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 ml-3">
            <Icon className="w-5 h-5 text-text-muted" />
          </div>
        )}
      </div>
    </div>
  )
}

export { PLATFORM_COLORS, PLATFORM_ICONS }
