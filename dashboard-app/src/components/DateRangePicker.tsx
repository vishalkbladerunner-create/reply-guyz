import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { cn } from '@/lib/utils'

export type DateRange =
  | { preset: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' }
  | { preset: 'custom'; start: string; end: string }

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const presets = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
] as const

export function getDateRangeValue(range: DateRange): { start: Date; end: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (range.preset) {
    case 'today':
      return { start: today, end: now }
    case 'yesterday':
      return { start: subDays(today, 1), end: today }
    case 'last7':
      return { start: subDays(today, 7), end: now }
    case 'last30':
      return { start: subDays(today, 30), end: now }
    case 'thisMonth':
      return { start: startOfMonth(today), end: now }
    case 'lastMonth': {
      const lastMonth = subMonths(today, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    }
    case 'custom':
      return { start: new Date(range.start), end: new Date(range.end) }
  }
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const { start, end } = getDateRangeValue(value)

  const handlePresetClick = (preset: typeof presets[number]['key']) => {
    onChange({ preset })
    setIsOpen(false)
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({ preset: 'custom', start: customStart, end: customEnd })
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-navy/10 rounded-xl text-sm font-medium text-text-primary hover:bg-cream transition-colors"
      >
        <Calendar className="w-4 h-4 text-text-muted" />
        <span>
          {value.preset === 'custom'
            ? `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
            : presets.find((p) => p.key === value.preset)?.label}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-card-hover border border-navy/5 z-50 p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Presets</p>
            <div className="space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset.key)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    value.preset === preset.key
                      ? 'bg-blue-accent/10 text-blue-accent font-medium'
                      : 'text-text-primary hover:bg-cream'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-navy/5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Custom Range</p>
              <div className="space-y-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="input-field text-sm py-2"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="input-field text-sm py-2"
                />
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="btn-primary w-full text-sm py-2 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
