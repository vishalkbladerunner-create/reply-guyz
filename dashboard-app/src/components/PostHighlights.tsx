import { ExternalLink } from 'lucide-react'
import { formatNumber, formatDateShort } from '@/lib/utils'
import PlatformBadge from './PlatformBadge'
import { PLATFORM_COLORS } from './StatCard'
import type { Post } from '@/lib/supabase'

interface PostHighlightsProps {
  posts: Post[]
}

export default function PostHighlights({ posts }: PostHighlightsProps) {
  if (posts.length === 0) return null

  const topByEngagement = [...posts].sort((a, b) => (b.engagements || 0) - (a.engagements || 0))[0]
  const topByComments = [...posts].sort((a, b) => (b.comments || 0) - (a.comments || 0))[0]
  const topByReposts = [...posts].sort((a, b) => (b.reposts || 0) - (a.reposts || 0))[0]
  const topEngValue = [...posts].sort((a, b) => (b.engagements || 0) - (a.engagements || 0))[0]

  const truncate = (text: string | null, len = 60) => {
    if (!text) return 'No text'
    return text.length > len ? text.slice(0, len) + '…' : text
  }

  const cards = [
    { label: 'Top Post', post: topByEngagement, metric: topByEngagement?.engagements, metricLabel: 'engagements' },
    { label: 'Most Commented', post: topByComments, metric: topByComments?.comments, metricLabel: 'comments' },
    { label: 'Most Reposted', post: topByReposts, metric: topByReposts?.reposts, metricLabel: 'reposts' },
    { label: 'Top Engagement Score', post: topEngValue, metric: topEngValue?.engagements, metricLabel: 'score' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const post = card.post
        if (!post) return null
        const borderColor = PLATFORM_COLORS[post.platform] || '#1a2332'

        return (
          <div key={i} className="card p-4" style={{ borderLeft: `4px solid ${borderColor}` }}>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{card.label}</p>
            <p className="text-sm text-text-primary mb-2 line-clamp-2 min-h-[2.5rem]">
              {truncate(post.post_text)}
            </p>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <PlatformBadge platform={post.platform} />
              <span className="text-xs text-text-muted">{formatDateShort(post.post_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-medium text-navy">
                {formatNumber(card.metric || 0)}
              </span>
              {post.post_url && (
                <a
                  href={post.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-blue-accent transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
