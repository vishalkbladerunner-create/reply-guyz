import { useState, useCallback } from 'react'
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle, X, Plus, Link2, BarChart3, FileJson } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface FilePreview {
  file: File
  rows: Record<string, any>[]
  columns: string[]
  platform: string
  type: 'daily_metrics' | 'posts' | 'engagement_orders'
}

type Tab = 'upload' | 'daily-metrics' | 'posts' | 'engagement-orders' | 'import-json'

export default function Upload() {
  const [activeTab, setActiveTab] = useState<Tab>('daily-metrics')
  const [isDragging, setIsDragging] = useState(false)
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonPreview, setJsonPreview] = useState<any[]>([])
  const [jsonPlatform, setJsonPlatform] = useState<'twitter' | 'instagram' | 'telegram'>('twitter')

  const [dailyMetric, setDailyMetric] = useState({
    platform: 'twitter',
    metric_date: '',
    impressions: '',
    likes: '',
    engagements: '',
    bookmarks: '',
    shares: '',
    new_follows: '',
    unfollows: '',
    replies: '',
    reposts: '',
    profile_visits: '',
    posts_created: '',
  })

  const [post, setPost] = useState({
    platform: 'twitter',
    post_date: '',
    post_time: '',
    post_text: '',
    post_url: '',
    likes: '',
    reposts: '',
    comments: '',
    shares: '',
    reactions: '',
    impressions: '',
  })

  const [order, setOrder] = useState({
    platform: 'twitter',
    link: '',
    post_url: '',
    order_date: '',
    followers_ordered: '',
    comments_ordered: '',
    reposts_ordered: '',
    likes_ordered: '',
    views_ordered: '',
    status: 'Done',
  })

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Flexible field extractors for different JSON formats
  const getField = (item: any, ...names: string[]) => {
    for (const name of names) {
      if (item[name] !== undefined) return item[name]
    }
    return undefined
  }

  const parseJsonInput = () => {
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) {
        showMessage('error', 'JSON must be an array of post objects')
        setJsonPreview([])
        return
      }
      setJsonPreview(data.slice(0, 5))
      showMessage('success', `Parsed ${data.length} posts for ${jsonPlatform}. Showing first 5 preview.`)
    } catch (err: any) {
      showMessage('error', 'Invalid JSON: ' + err.message)
      setJsonPreview([])
    }
  }

  const importJsonPosts = async () => {
    setLoading(true)
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('JSON must be a non-empty array')
      }

      const clientId = await getClientId()
      if (!clientId) throw new Error('Client not found')

      const posts = data.map((item: any) => {
        const rawDate = getField(item, 'date', 'timestamp', 'created_at', 'published_at')
        const dateObj = rawDate ? new Date(rawDate) : new Date()
        const postDate = dateObj.toISOString().split('T')[0]
        const postTime = dateObj.toISOString().split('T')[1].replace('Z', '').substring(0, 8)

        const postUrl = getField(item, 'link', 'url', 'post_url', 'permalink') || null
        const likes = Number(getField(item, 'like', 'likes', 'favorites')) || 0
        const comments = Number(getField(item, 'reply', 'replies', 'comments')) || 0

        // Platform-specific mappings
        let reposts = 0
        let shares = 0
        let reactions = 0
        let impressions = 0

        if (jsonPlatform === 'twitter') {
          reposts = Number(getField(item, 'retweet', 'reposts', 'shares')) || 0
          impressions = Number(getField(item, 'impressions', 'views')) || 0
        } else if (jsonPlatform === 'instagram') {
          shares = Number(getField(item, 'shares', 'sends')) || 0
          impressions = Number(getField(item, 'impressions', 'views', 'reach')) || 0
        } else if (jsonPlatform === 'telegram') {
          reactions = Number(getField(item, 'reactions', 'emoji_reactions')) || 0
          shares = Number(getField(item, 'shares', 'forwards')) || 0
          impressions = Number(getField(item, 'views', 'impressions')) || 0
        }

        const engagements = likes + reposts + comments + shares + reactions
        const engagementRate = impressions > 0 ? ((engagements / impressions) * 100).toFixed(2) : null

        return {
          client_id: clientId,
          platform: jsonPlatform,
          post_date: postDate,
          post_time: postTime,
          post_url: postUrl,
          post_text: getField(item, 'text', 'caption', 'message') || null,
          media_type: null,
          likes,
          reposts,
          comments,
          shares,
          reactions,
          impressions,
          engagements,
          engagement_rate: engagementRate ? Number(engagementRate) : null,
        }
      })

      // Insert in batches of 50 to avoid request size limits
      const batchSize = 50
      let inserted = 0
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize)
        const { error } = await supabase.from('posts').insert(batch as any)
        if (error) throw error
        inserted += batch.length
      }

      showMessage('success', `Successfully imported ${inserted} ${jsonPlatform} posts!`)
      setJsonInput('')
      setJsonPreview([])
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to import posts')
    }
    setLoading(false)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files || []))
  }, [])

  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter((l) => l.trim())
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim())
          const rows = lines.slice(1, 6).map((line) => {
            const values = line.split(',')
            const row: Record<string, any> = {}
            headers.forEach((h, i) => { row[h] = values[i]?.trim() })
            return row
          })
          const headerStr = headers.join(' ').toLowerCase()
          let type: FilePreview['type'] = 'posts'
          let platform = 'twitter'
          if (headerStr.includes('impressions') && headerStr.includes('engagements')) type = 'daily_metrics'
          else if (headerStr.includes('views') || headerStr.includes('followers_ordered')) type = 'engagement_orders'
          if (headerStr.includes('instagram') || file.name.toLowerCase().includes('ig')) platform = 'instagram'
          else if (headerStr.includes('telegram') || file.name.toLowerCase().includes('tg')) platform = 'telegram'
          setPreviews((prev) => [...prev, { file, rows, columns: headers, platform, type }])
        }
      }
      reader.readAsText(file)
    })
  }

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFileUpload = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
    showMessage('success', 'Files processed! (Connect Supabase to save to database)')
    setPreviews([])
  }

  const getClientId = async () => {
    const { data } = await supabase.from('clients').select('id').eq('slug', 'sandmark').single()
    return (data as any)?.id
  }

  const submitDailyMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const clientId = await getClientId()
      if (!clientId) throw new Error('Client not found')
      const payload = {
        client_id: clientId,
        platform: dailyMetric.platform,
        metric_date: dailyMetric.metric_date,
        impressions: Number(dailyMetric.impressions) || 0,
        likes: Number(dailyMetric.likes) || 0,
        engagements: Number(dailyMetric.engagements) || 0,
        bookmarks: Number(dailyMetric.bookmarks) || 0,
        shares: Number(dailyMetric.shares) || 0,
        new_follows: Number(dailyMetric.new_follows) || 0,
        unfollows: Number(dailyMetric.unfollows) || 0,
        replies: Number(dailyMetric.replies) || 0,
        reposts: Number(dailyMetric.reposts) || 0,
        profile_visits: Number(dailyMetric.profile_visits) || 0,
        posts_created: Number(dailyMetric.posts_created) || 0,
        net_followers: (Number(dailyMetric.new_follows) || 0) - (Number(dailyMetric.unfollows) || 0),
      }
      const { error } = await supabase.from('daily_metrics').insert(payload as any)
      if (error) throw error
      showMessage('success', 'Daily metric added successfully!')
      setDailyMetric({ platform: 'twitter', metric_date: '', impressions: '', likes: '', engagements: '', bookmarks: '', shares: '', new_follows: '', unfollows: '', replies: '', reposts: '', profile_visits: '', posts_created: '' })
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to add metric')
    }
    setLoading(false)
  }

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const clientId = await getClientId()
      if (!clientId) throw new Error('Client not found')
      const totalEngagement = (Number(post.likes) || 0) + (Number(post.reposts) || 0) + (Number(post.comments) || 0) + (Number(post.shares) || 0) + (Number(post.reactions) || 0)
      const engagementRate = post.impressions ? ((totalEngagement / Number(post.impressions)) * 100).toFixed(2) : null
      const payload = {
        client_id: clientId,
        platform: post.platform,
        post_date: post.post_date,
        post_time: post.post_time || null,
        post_text: post.post_text || null,
        post_url: post.post_url || null,
        likes: Number(post.likes) || 0,
        reposts: Number(post.reposts) || 0,
        comments: Number(post.comments) || 0,
        shares: Number(post.shares) || 0,
        reactions: Number(post.reactions) || 0,
        impressions: Number(post.impressions) || 0,
        engagements: totalEngagement,
        engagement_rate: engagementRate ? Number(engagementRate) : null,
      }
      const { error } = await supabase.from('posts').insert(payload as any)
      if (error) throw error
      showMessage('success', 'Post added successfully!')
      setPost({ platform: 'twitter', post_date: '', post_time: '', post_text: '', post_url: '', likes: '', reposts: '', comments: '', shares: '', reactions: '', impressions: '' })
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to add post')
    }
    setLoading(false)
  }

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const clientId = await getClientId()
      if (!clientId) throw new Error('Client not found')
      const payload = {
        client_id: clientId,
        platform: order.platform,
        link: order.link,
        post_url: order.post_url || null,
        order_date: order.order_date || null,
        followers_ordered: Number(order.followers_ordered) || 0,
        comments_ordered: Number(order.comments_ordered) || 0,
        reposts_ordered: Number(order.reposts_ordered) || 0,
        likes_ordered: Number(order.likes_ordered) || 0,
        views_ordered: Number(order.views_ordered) || 0,
        status: order.status,
      }
      const { error } = await supabase.from('engagement_orders').insert(payload as any)
      if (error) throw error
      showMessage('success', 'Engagement order added successfully!')
      setOrder({ platform: 'twitter', link: '', post_url: '', order_date: '', followers_ordered: '', comments_ordered: '', reposts_ordered: '', likes_ordered: '', views_ordered: '', status: 'Done' })
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to add order')
    }
    setLoading(false)
  }

  const tabs = [
    { key: 'daily-metrics' as Tab, label: 'Daily Metrics', icon: BarChart3 },
    { key: 'posts' as Tab, label: 'Add Post', icon: Plus },
    { key: 'engagement-orders' as Tab, label: 'Engagement Order', icon: Link2 },
    { key: 'import-json' as Tab, label: 'Import JSON', icon: FileJson },
    { key: 'upload' as Tab, label: 'Upload CSV/Excel', icon: UploadCloud },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-navy">Data Entry</h1>
        <p className="text-text-secondary mt-1">Add analytics data manually or upload files</p>
      </div>

      {message && (
        <div className={`card ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.key ? 'bg-navy text-white' : 'bg-white text-text-secondary hover:bg-cream border border-navy/10'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'daily-metrics' && (
        <div className="card">
          <h3 className="font-display text-lg font-medium text-navy mb-6">Add Daily Metrics</h3>
          <form onSubmit={submitDailyMetric} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Platform</label>
                <select value={dailyMetric.platform} onChange={(e) => setDailyMetric({...dailyMetric, platform: e.target.value})} className="input-field">
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              <div>
                <label className="label">Date *</label>
                <input type="date" required value={dailyMetric.metric_date} onChange={(e) => setDailyMetric({...dailyMetric, metric_date: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="label">Impressions</label>
                <input type="number" min="0" value={dailyMetric.impressions} onChange={(e) => setDailyMetric({...dailyMetric, impressions: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Likes</label>
                <input type="number" min="0" value={dailyMetric.likes} onChange={(e) => setDailyMetric({...dailyMetric, likes: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Engagements</label>
                <input type="number" min="0" value={dailyMetric.engagements} onChange={(e) => setDailyMetric({...dailyMetric, engagements: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Bookmarks</label>
                <input type="number" min="0" value={dailyMetric.bookmarks} onChange={(e) => setDailyMetric({...dailyMetric, bookmarks: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Shares</label>
                <input type="number" min="0" value={dailyMetric.shares} onChange={(e) => setDailyMetric({...dailyMetric, shares: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">New Follows</label>
                <input type="number" min="0" value={dailyMetric.new_follows} onChange={(e) => setDailyMetric({...dailyMetric, new_follows: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Unfollows</label>
                <input type="number" min="0" value={dailyMetric.unfollows} onChange={(e) => setDailyMetric({...dailyMetric, unfollows: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Replies</label>
                <input type="number" min="0" value={dailyMetric.replies} onChange={(e) => setDailyMetric({...dailyMetric, replies: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Reposts</label>
                <input type="number" min="0" value={dailyMetric.reposts} onChange={(e) => setDailyMetric({...dailyMetric, reposts: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Profile Visits</label>
                <input type="number" min="0" value={dailyMetric.profile_visits} onChange={(e) => setDailyMetric({...dailyMetric, profile_visits: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Posts Created</label>
                <input type="number" min="0" value={dailyMetric.posts_created} onChange={(e) => setDailyMetric({...dailyMetric, posts_created: e.target.value})} className="input-field" placeholder="0" />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Daily Metric
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="card">
          <h3 className="font-display text-lg font-medium text-navy mb-6">Add Post</h3>
          <form onSubmit={submitPost} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Platform</label>
                <select value={post.platform} onChange={(e) => setPost({...post, platform: e.target.value})} className="input-field">
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              <div>
                <label className="label">Post Date *</label>
                <input type="date" required value={post.post_date} onChange={(e) => setPost({...post, post_date: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="label">Post Time (optional)</label>
                <input type="time" value={post.post_time} onChange={(e) => setPost({...post, post_time: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="label">Post URL (optional)</label>
                <input type="url" value={post.post_url} onChange={(e) => setPost({...post, post_url: e.target.value})} className="input-field" placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Post Text</label>
                <textarea value={post.post_text} onChange={(e) => setPost({...post, post_text: e.target.value})} className="input-field min-h-[80px] resize-none" placeholder="Enter post content..." />
              </div>
              <div>
                <label className="label">Likes</label>
                <input type="number" min="0" value={post.likes} onChange={(e) => setPost({...post, likes: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Reposts</label>
                <input type="number" min="0" value={post.reposts} onChange={(e) => setPost({...post, reposts: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Comments</label>
                <input type="number" min="0" value={post.comments} onChange={(e) => setPost({...post, comments: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Shares</label>
                <input type="number" min="0" value={post.shares} onChange={(e) => setPost({...post, shares: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Reactions (Telegram)</label>
                <input type="number" min="0" value={post.reactions} onChange={(e) => setPost({...post, reactions: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Impressions</label>
                <input type="number" min="0" value={post.impressions} onChange={(e) => setPost({...post, impressions: e.target.value})} className="input-field" placeholder="0" />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Post
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'engagement-orders' && (
        <div className="card">
          <h3 className="font-display text-lg font-medium text-navy mb-6">Add Engagement Order</h3>
          <form onSubmit={submitOrder} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Platform</label>
                <select value={order.platform} onChange={(e) => setOrder({...order, platform: e.target.value})} className="input-field">
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              <div>
                <label className="label">Order Date</label>
                <input type="date" value={order.order_date} onChange={(e) => setOrder({...order, order_date: e.target.value})} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Link *</label>
                <input type="url" required value={order.link} onChange={(e) => setOrder({...order, link: e.target.value})} className="input-field" placeholder="https://x.com/... or https://t.me/..." />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Post URL (optional)</label>
                <input type="url" value={order.post_url} onChange={(e) => setOrder({...order, post_url: e.target.value})} className="input-field" placeholder="https://x.com/.../status/..." />
              </div>
              <div>
                <label className="label">Views Ordered</label>
                <input type="number" min="0" value={order.views_ordered} onChange={(e) => setOrder({...order, views_ordered: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Followers Ordered</label>
                <input type="number" min="0" value={order.followers_ordered} onChange={(e) => setOrder({...order, followers_ordered: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Likes Ordered</label>
                <input type="number" min="0" value={order.likes_ordered} onChange={(e) => setOrder({...order, likes_ordered: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Reposts Ordered</label>
                <input type="number" min="0" value={order.reposts_ordered} onChange={(e) => setOrder({...order, reposts_ordered: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Comments Ordered</label>
                <input type="number" min="0" value={order.comments_ordered} onChange={(e) => setOrder({...order, comments_ordered: e.target.value})} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Status</label>
                <select value={order.status} onChange={(e) => setOrder({...order, status: e.target.value})} className="input-field">
                  <option value="Done">Done</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Order
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'import-json' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-display text-lg font-medium text-navy mb-2">Import Posts from JSON</h3>
            <p className="text-sm text-text-secondary mb-4">
              Paste your JSON array here. Supports Twitter, Instagram, and Telegram data.
            </p>

            <div className="mb-4">
              <label className="label">Platform</label>
              <select
                value={jsonPlatform}
                onChange={(e) => setJsonPlatform(e.target.value as 'twitter' | 'instagram' | 'telegram')}
                className="input-field"
              >
                <option value="twitter">Twitter / X</option>
                <option value="instagram">Instagram</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={jsonPlatform === 'twitter'
                ? `[\n  {\n    "link": "https://x.com/sandmark_news/status/...",\n    "date": "2026-05-15T02:58:04.000Z",\n    "reply": 0,\n    "retweet": 0,\n    "like": 3\n  }\n]`
                : jsonPlatform === 'instagram'
                ? `[\n  {\n    "url": "https://instagram.com/p/...",\n    "timestamp": "2026-05-15T02:58:04.000Z",\n    "comments": 5,\n    "shares": 2,\n    "likes": 10\n  }\n]`
                : `[\n  {\n    "link": "https://t.me/sandmark/123",\n    "date": "2026-05-15T02:58:04.000Z",\n    "views": 100,\n    "reactions": 5,\n    "forwards": 3\n  }\n]`
              }
              className="input-field min-h-[200px] font-mono text-xs resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={parseJsonInput}
                disabled={!jsonInput.trim() || loading}
                className="btn-secondary disabled:opacity-50"
              >
                Preview
              </button>
              <button
                onClick={importJsonPosts}
                disabled={jsonPreview.length === 0 || loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileJson className="w-4 h-4" />}
                Import {jsonPreview.length > 0 ? `All ${jsonPlatform.charAt(0).toUpperCase() + jsonPlatform.slice(1)} Posts` : 'Posts'}
              </button>
            </div>
          </div>

          {jsonPreview.length > 0 && (
            <div className="card">
              <h3 className="font-display text-lg font-medium text-navy mb-4">Preview (first 5)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy/5">
                      <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">Date</th>
                      <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">Likes</th>
                      {jsonPlatform === 'twitter' && <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">Reposts</th>}
                      {jsonPlatform === 'instagram' && <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">Shares</th>}
                      {jsonPlatform === 'telegram' && <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">Reactions</th>}
                      <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">Comments</th>
                      <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {jsonPreview.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 text-text-primary whitespace-nowrap">
                          {new Date(getField(item, 'date', 'timestamp', 'created_at') || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-4 text-text-primary">{getField(item, 'like', 'likes') || 0}</td>
                        {jsonPlatform === 'twitter' && <td className="py-2 pr-4 text-text-primary">{getField(item, 'retweet', 'reposts', 'shares') || 0}</td>}
                        {jsonPlatform === 'instagram' && <td className="py-2 pr-4 text-text-primary">{getField(item, 'shares', 'sends') || 0}</td>}
                        {jsonPlatform === 'telegram' && <td className="py-2 pr-4 text-text-primary">{getField(item, 'reactions', 'emoji_reactions') || 0}</td>}
                        <td className="py-2 pr-4 text-text-primary">{getField(item, 'reply', 'replies', 'comments') || 0}</td>
                        <td className="py-2 text-text-primary truncate max-w-[200px]">{getField(item, 'link', 'url', 'post_url') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn('border-2 border-dashed rounded-2xl p-12 text-center transition-all', isDragging ? 'border-blue-accent bg-blue-accent/5' : 'border-navy/10 bg-white hover:border-navy/20')}
          >
            <UploadCloud className={cn('w-12 h-12 mx-auto mb-4', isDragging ? 'text-blue-accent' : 'text-text-muted')} />
            <h3 className="text-lg font-medium text-navy mb-2">Drop your files here</h3>
            <p className="text-sm text-text-secondary mb-4">or click to browse</p>
            <p className="text-xs text-text-muted">Supports CSV and Excel (.xlsx) files</p>
            <input type="file" accept=".csv,.xlsx" multiple onChange={handleFileInput} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="btn-primary mt-6 cursor-pointer inline-flex">
              <FileSpreadsheet className="w-4 h-4" />
              Select Files
            </label>
          </div>

          {previews.length > 0 && (
            <div className="space-y-6">
              <h3 className="font-display text-lg font-medium text-navy">Preview ({previews.length} files)</h3>
              {previews.map((preview, index) => (
                <div key={index} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-blue-accent" />
                      <div>
                        <p className="font-medium text-navy">{preview.file.name}</p>
                        <p className="text-xs text-text-muted">{preview.platform} · {preview.type.replace('_', ' ')} · {(preview.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => removePreview(index)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-navy/5">
                          {preview.columns.slice(0, 6).map((col) => (
                            <th key={col} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/5">
                        {preview.rows.map((row, i) => (
                          <tr key={i}>
                            {preview.columns.slice(0, 6).map((col) => (
                              <td key={col} className="py-2 pr-4 text-text-primary truncate max-w-[150px]">{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-text-muted mt-2">Showing first 5 rows</p>
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={handleFileUpload} disabled={loading} className="btn-primary disabled:opacity-50">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  Confirm & Upload
                </button>
                <button onClick={() => setPreviews([])} className="btn-secondary">Clear All</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
