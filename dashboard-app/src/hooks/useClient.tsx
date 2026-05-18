import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

interface ClientContextType {
  selectedClientId: string | null
  clients: { id: string; name: string; slug: string; platform: string | null; twitter_handle: string | null; instagram_handle: string | null; telegram_handle: string | null; website: string | null; description: string | null; active_platforms: string[] | null }[]
  loading: boolean
  error: string | null
  setSelectedClientId: (id: string | null) => void
  refreshClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase.from('clients').select('*').order('name')
      if (fetchErr) {
        console.error('useClient fetch error:', fetchErr.message)
        setError(fetchErr.message)
        setClients([])
      } else {
        setClients((data || []) as any)
        setError(null)
      }
    } catch (err: any) {
      console.error('useClient fetch exception:', err)
      setError(err?.message || 'Failed to load clients')
      setClients([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authLoading) {
      fetchClients()
    }
  }, [authLoading, fetchClients])

  useEffect(() => {
    if (user && !isAdmin && user.client_id) {
      setSelectedClientId(user.client_id)
    }
  }, [user, isAdmin])

  return (
    <ClientContext.Provider
      value={{
        selectedClientId,
        clients,
        loading,
        error,
        setSelectedClientId,
        refreshClients: fetchClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error('useClient must be used within ClientProvider')
  }
  return context
}
