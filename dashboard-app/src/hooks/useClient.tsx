import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

interface ClientContextType {
  selectedClientId: string | null
  clients: { id: string; name: string; slug: string; platform: string | null; twitter_handle: string | null; instagram_handle: string | null; telegram_handle: string | null; website: string | null; description: string | null; active_platforms: string[] | null }[]
  loading: boolean
  setSelectedClientId: (id: string | null) => void
  refreshClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients((data as any) || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!authLoading) {
      fetchClients()
    }
  }, [authLoading])

  // Auto-select client for non-admin users
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
