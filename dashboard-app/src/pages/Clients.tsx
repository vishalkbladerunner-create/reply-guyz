import { useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { supabase, type Client } from '@/lib/supabase'
import { Building2, Plus, Twitter, Instagram, Send, Globe, CheckCircle, AlertCircle, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLATFORM_OPTIONS = ['twitter', 'instagram', 'telegram'] as const

const platformIcons = {
  twitter: Twitter,
  instagram: Instagram,
  telegram: Send,
}

const platformColors = {
  twitter: 'bg-sky-50 text-sky-700 border-sky-200',
  instagram: 'bg-pink-50 text-pink-700 border-pink-200',
  telegram: 'bg-blue-50 text-blue-700 border-blue-200',
}

const emptyForm = {
  name: '',
  slug: '',
  twitter_handle: '',
  instagram_handle: '',
  telegram_handle: '',
  website: '',
  description: '',
  active_platforms: ['twitter'] as string[],
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function Clients() {
  const { clients, refreshClients } = useClient()
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState(emptyForm)

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingClient(null)
    setShowForm(false)
  }

  const startEdit = (client: Client) => {
    setForm({
      name: client.name || '',
      slug: client.slug || '',
      twitter_handle: client.twitter_handle || '',
      instagram_handle: client.instagram_handle || '',
      telegram_handle: client.telegram_handle || '',
      website: client.website || '',
      description: client.description || '',
      active_platforms: client.active_platforms || ['twitter'],
    })
    setEditingClient(client)
    setShowForm(true)
  }

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      active_platforms: prev.active_platforms.includes(platform)
        ? prev.active_platforms.filter((p) => p !== platform)
        : [...prev.active_platforms, platform],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showMsg('error', 'Company name is required')
      return
    }
    if (form.active_platforms.length === 0) {
      showMsg('error', 'Select at least one platform')
      return
    }

    setLoading(true)
    const slug = form.slug.trim() || generateSlug(form.name)

    const payload = {
      name: form.name.trim(),
      slug,
      twitter_handle: form.twitter_handle.trim() || null,
      instagram_handle: form.instagram_handle.trim() || null,
      telegram_handle: form.telegram_handle.trim() || null,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      active_platforms: form.active_platforms,
      platform: form.active_platforms[0],
    }

    if (editingClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('clients') as any).update(payload).eq('id', editingClient.id)

      if (error) {
        showMsg('error', error.message)
      } else {
        showMsg('success', 'Company updated successfully!')
        resetForm()
        refreshClients()
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('clients') as any).insert(payload)

      if (error) {
        showMsg('error', error.message)
      } else {
        showMsg('success', 'Company created successfully!')
        resetForm()
        refreshClients()
      }
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deletingClient) return
    setLoading(true)
    const { error } = await supabase.from('clients').delete().eq('id', deletingClient.id)
    if (error) {
      showMsg('error', error.message)
    } else {
      showMsg('success', `${deletingClient.name} deleted successfully!`)
      refreshClients()
    }
    setDeletingClient(null)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">Manage Clients</h1>
          <p className="text-text-secondary mt-1">Add, edit, and manage companies & their analytics platforms</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="btn-primary"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Company'}
        </button>
      </div>

      {message && (
        <div className={`card ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2 className="font-display text-lg font-medium text-navy mb-6">
            {editingClient ? `Edit ${editingClient.name}` : 'Add New Company'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value, slug: editingClient ? form.slug : generateSlug(e.target.value) })
                  }}
                  className="input-field"
                  placeholder="Sandmark"
                />
              </div>

              <div>
                <label className="label">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="input-field"
                  placeholder="sandmark"
                />
              </div>

              <div>
                <label className="label">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="input-field"
                  placeholder="https://company.com"
                />
              </div>

              <div>
                <label className="label">Twitter / X Handle</label>
                <input
                  type="text"
                  value={form.twitter_handle}
                  onChange={(e) => setForm({ ...form, twitter_handle: e.target.value })}
                  className="input-field"
                  placeholder="@company"
                />
              </div>

              <div>
                <label className="label">Instagram Handle</label>
                <input
                  type="text"
                  value={form.instagram_handle}
                  onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                  className="input-field"
                  placeholder="@company"
                />
              </div>

              <div>
                <label className="label">Telegram Handle</label>
                <input
                  type="text"
                  value={form.telegram_handle}
                  onChange={(e) => setForm({ ...form, telegram_handle: e.target.value })}
                  className="input-field"
                  placeholder="@company"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[60px] resize-none"
                  placeholder="Brief description of the company..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Active Platforms *</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PLATFORM_OPTIONS.map((platform) => {
                    const isActive = form.active_platforms.includes(platform)
                    const Icon = platformIcons[platform]
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                          isActive ? platformColors[platform] : 'bg-white text-text-muted border-navy/10 hover:bg-cream'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="capitalize">{platform}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                {editingClient ? 'Update Company' : 'Create Company'}
              </button>
              {editingClient && (
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="card hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg font-medium text-navy truncate">{client.name}</h3>
                <p className="text-xs text-text-muted">@{client.slug}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="flex gap-1">
                  {client.active_platforms?.map((platform: string) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons]
                    return Icon ? (
                      <span key={platform} className={cn('p-1.5 rounded-lg border', platformColors[platform as keyof typeof platformColors])}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                    ) : null
                  })}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(client as Client)}
                    className="p-1.5 rounded-lg bg-cream hover:bg-blue-accent/10 hover:text-blue-accent text-text-muted transition-colors"
                    title="Edit company"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingClient(client as Client)}
                    className="p-1.5 rounded-lg bg-cream hover:bg-red-50 hover:text-red-600 text-text-muted transition-colors"
                    title="Delete company"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {client.description && (
              <p className="text-sm text-text-secondary mb-3 line-clamp-2">{client.description}</p>
            )}

            <div className="space-y-1.5 text-sm">
              {client.twitter_handle && (
                <div className="flex items-center gap-2 text-text-muted">
                  <Twitter className="w-3.5 h-3.5" />
                  <span>{client.twitter_handle}</span>
                </div>
              )}
              {client.instagram_handle && (
                <div className="flex items-center gap-2 text-text-muted">
                  <Instagram className="w-3.5 h-3.5" />
                  <span>{client.instagram_handle}</span>
                </div>
              )}
              {client.telegram_handle && (
                <div className="flex items-center gap-2 text-text-muted">
                  <Send className="w-3.5 h-3.5" />
                  <span>{client.telegram_handle}</span>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2 text-text-muted">
                  <Globe className="w-3.5 h-3.5" />
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-accent truncate">{client.website}</a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-navy mb-2">No clients yet</h3>
          <p className="text-text-secondary mb-4">Add your first company to get started</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={() => setDeletingClient(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="font-display text-lg font-medium text-navy mb-2">Delete Company</h3>
            <p className="text-text-secondary mb-1">
              Are you sure you want to delete <strong className="text-navy">{deletingClient.name}</strong>?
            </p>
            <p className="text-sm text-red-500 mb-6">
              This will permanently remove the company and all associated data (posts, metrics, orders, profiles). This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingClient(null)} className="btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
