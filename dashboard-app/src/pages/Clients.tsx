import { useState } from 'react'
import { useClient } from '@/hooks/useClient'
import { supabase } from '@/lib/supabase'
import { Building2, Plus, Twitter, Instagram, Send, Globe, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Clients() {
  const { clients, refreshClients } = useClient()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    twitter_handle: '',
    instagram_handle: '',
    telegram_handle: '',
    website: '',
    description: '',
    active_platforms: ['twitter'] as string[],
  })

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
    const { error } = await supabase.from('clients').insert({
      name: form.name.trim(),
      slug,
      twitter_handle: form.twitter_handle.trim() || null,
      instagram_handle: form.instagram_handle.trim() || null,
      telegram_handle: form.telegram_handle.trim() || null,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      active_platforms: form.active_platforms,
      platform: form.active_platforms[0],
    } as any)

    if (error) {
      showMsg('error', error.message)
    } else {
      showMsg('success', 'Company created successfully!')
      setForm({
        name: '',
        slug: '',
        twitter_handle: '',
        instagram_handle: '',
        telegram_handle: '',
        website: '',
        description: '',
        active_platforms: ['twitter'],
      })
      setShowForm(false)
      refreshClients()
    }
    setLoading(false)
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-navy">Manage Clients</h1>
          <p className="text-text-secondary mt-1">Add and manage companies & their analytics platforms</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
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
          <h2 className="font-display text-lg font-medium text-navy mb-6">Add New Company</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })
                  }}
                  className="input-field"
                  placeholder="Sandmark"
                />
              </div>

              <div>
                <label className="label">Slug (auto-generated)</label>
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
                  {(['twitter', 'instagram', 'telegram'] as const).map((platform) => {
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

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                Create Company
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display text-lg font-medium text-navy">{client.name}</h3>
                <p className="text-xs text-text-muted">@{client.slug}</p>
              </div>
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
    </div>
  )
}
