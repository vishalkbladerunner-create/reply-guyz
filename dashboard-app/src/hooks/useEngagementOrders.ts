import { useState, useEffect, useRef } from 'react'
import { supabase, type EngagementOrder } from '@/lib/supabase'

interface OrdersData {
  orders: EngagementOrder[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useEngagementOrders(clientId: string | null, filters?: {
  platform?: string
  status?: string
  week?: string
}): OrdersData {
  const [orders, setOrders] = useState<EngagementOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const refresh = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    if (!clientId) {
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    let query = supabase
      .from('engagement_orders')
      .select('*')
      .eq('client_id', clientId)

    if (filters?.platform && filters.platform !== 'All') {
      query = query.eq('platform', filters.platform.toLowerCase())
    }
    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status)
    }

    ;(query as any)
      .order('order_date', { ascending: false })
      .then(({ data, error: err }: { data: any; error: any }) => {
        if (controller.signal.aborted) return
        if (err) {
          setError(err.message)
        } else {
          setOrders((data || []) as EngagementOrder[])
        }
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [clientId, filters?.platform, filters?.status, refreshKey])

  return { orders, loading, error, refresh }
}
