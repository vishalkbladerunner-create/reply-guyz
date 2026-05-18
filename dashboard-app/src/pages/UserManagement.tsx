import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase, type Profile, type Client } from '@/lib/supabase'
import { CheckCircle, XCircle, AlertCircle, Users, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function UserManagement() {
  const { user: _currentUser } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: profilesData }, { data: clientsData }] = await Promise.all([
      (supabase.from('profiles').select('*') as any).order('created_at', { ascending: false }),
      supabase.from('clients').select('*'),
    ])
    setProfiles(profilesData || [])
    setClients(clientsData || [])
    setLoading(false)
  }

  const updateProfile = async (id: string, updates: Record<string, any>) => {
    setSavingId(id)
    const { error } = await (supabase as any).from('profiles').update(updates).eq('id', id)
    if (error) {
      showMessage('error', error.message)
    } else {
      showMessage('success', 'User updated successfully')
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    }
    setSavingId(null)
  }

  const filteredProfiles = profiles.filter((p) => {
    if (filter === 'all') return true
    return p.status === filter
  })

  const statusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800')}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-navy">User Management</h1>
        <p className="text-text-secondary mt-1">Approve, reject, and manage user accounts</p>
      </div>

      {message && (
        <div className={`card ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: profiles.length, color: 'bg-navy text-white' },
          { label: 'Pending', count: profiles.filter((p) => p.status === 'pending').length, color: 'bg-amber-500 text-white' },
          { label: 'Approved', count: profiles.filter((p) => p.status === 'approved').length, color: 'bg-green-500 text-white' },
          { label: 'Rejected', count: profiles.filter((p) => p.status === 'rejected').length, color: 'bg-red-500 text-white' },
        ].map((stat) => (
          <div key={stat.label} className={cn('card flex items-center justify-between', stat.color)}>
            <div>
              <p className="text-sm opacity-80">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.count}</p>
            </div>
            <Users className="w-6 h-6 opacity-50" />
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
              filter === f ? 'bg-navy text-white' : 'bg-white text-text-secondary hover:bg-cream border border-navy/10'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-accent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/5">
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3 pr-4">User</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3 pr-4">Role</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3 pr-4">Organization</th>
                  <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="group">
                    <td className="py-4 pr-4">
                      <div>
                        <p className="font-medium text-navy">{profile.full_name || '—'}</p>
                        <p className="text-xs text-text-muted">{profile.email}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4">{statusBadge(profile.status)}</td>
                    <td className="py-4 pr-4">
                      <select
                        value={profile.role || ''}
                        onChange={(e) => updateProfile(profile.id, { role: e.target.value || null })}
                        disabled={savingId === profile.id}
                        className="input-field text-xs py-1.5"
                      >
                        <option value="">—</option>
                        <option value="admin">Admin</option>
                        <option value="client">Client</option>
                      </select>
                    </td>
                    <td className="py-4 pr-4">
                      <select
                        value={profile.client_id || ''}
                        onChange={(e) => updateProfile(profile.id, { client_id: e.target.value || null })}
                        disabled={savingId === profile.id}
                        className="input-field text-xs py-1.5"
                      >
                        <option value="">—</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {profile.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateProfile(profile.id, { status: 'approved' })}
                              disabled={savingId === profile.id}
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateProfile(profile.id, { status: 'rejected' })}
                              disabled={savingId === profile.id}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {profile.status === 'rejected' && (
                          <button
                            onClick={() => updateProfile(profile.id, { status: 'approved' })}
                            disabled={savingId === profile.id}
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {profile.status === 'approved' && (
                          <button
                            onClick={() => updateProfile(profile.id, { status: 'pending' })}
                            disabled={savingId === profile.id}
                            className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                            title="Revoke approval"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        )}
                        {savingId === profile.id && <Loader2 className="w-4 h-4 text-blue-accent animate-spin" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProfiles.length === 0 && (
              <div className="text-center py-8 text-text-muted">No users found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
