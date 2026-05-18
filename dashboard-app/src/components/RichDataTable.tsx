import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  render?: (value: any, row: Record<string, any>, index?: number) => React.ReactNode
}

interface RichDataTableProps {
  columns: Column[]
  rows: Record<string, any>[]
  searchable?: boolean
  searchKey?: string
  pageSize?: number
  topN?: number
  emptyMessage?: string
}

export default function RichDataTable({
  columns,
  rows,
  searchable = false,
  searchKey = 'post_text',
  pageSize = 25,
  topN,
  emptyMessage = 'No data available',
}: RichDataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!search || !searchable) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const val = r[searchKey]
      return val ? String(val).toLowerCase().includes(q) : false
    })
  }, [rows, search, searchable, searchKey])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? 0
      const bVal = b[sortKey] ?? 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div>
      {(searchable || topN) && (
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          {topN && (
            <p className="text-sm text-text-muted">
              Top <span className="font-medium text-navy">{Math.min(topN, sorted.length)}</span> of{' '}
              <span className="font-medium text-navy">{sorted.length}</span> total
            </p>
          )}
          {searchable && (
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                className="input-field pl-9 py-1.5 text-sm w-64"
              />
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        {paged.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">{emptyMessage}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy/5">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'text-xs font-semibold text-text-muted uppercase tracking-wider pb-3 px-2',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      !col.align && 'text-left',
                      col.sortable && 'cursor-pointer hover:text-navy select-none'
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {paged.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-cream/50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'py-3 px-2 text-sm',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row, page * pageSize + i)
                        : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-navy/5 mt-4">
          <p className="text-xs text-text-muted">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-cream disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-cream disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
