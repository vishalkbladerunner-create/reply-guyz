import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { Post } from '@/lib/supabase'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const PLATFORM_COLORS_MAP: Record<string, { likes: string; reposts: string; comments: string; reactions: string }> = {
  twitter: { likes: '#4479e1', reposts: '#1a2332', comments: '#6b8cae', reactions: '#1a2332' },
  instagram: { likes: '#4479e1', reposts: '#1a2332', comments: '#6b8cae', reactions: '#1a2332' },
  telegram: { likes: '#6b8cae', reposts: '#6b8cae', comments: '#6b8cae', reactions: '#6b8cae' },
}

interface EngagementCompositionChartProps {
  posts: Post[]
  platform: string
  title?: string
}

export default function EngagementCompositionChart({ posts, platform, title }: EngagementCompositionChartProps) {
  const colors = PLATFORM_COLORS_MAP[platform] || PLATFORM_COLORS_MAP.twitter

  const isTelegram = platform === 'telegram'

  const labels = posts.map((p) => {
    const d = new Date(p.post_date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const datasets = isTelegram
    ? [
        {
          label: 'Reactions',
          data: posts.map((p) => p.reactions || 0),
          backgroundColor: colors.reactions,
          borderRadius: 6,
          borderSkipped: false as const,
        },
      ]
    : [
        {
          label: 'Likes',
          data: posts.map((p) => p.likes || 0),
          backgroundColor: colors.likes,
          borderRadius: { topLeft: 6, topRight: 6 },
          borderSkipped: false as const,
        },
        {
          label: 'Reposts',
          data: posts.map((p) => p.reposts || 0),
          backgroundColor: colors.reposts,
          borderSkipped: false as const,
        },
        {
          label: 'Comments',
          data: posts.map((p) => p.comments || 0),
          backgroundColor: colors.comments,
          borderRadius: { bottomLeft: 6, bottomRight: 6 },
          borderSkipped: false as const,
        },
      ]

  const data = { labels, datasets }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: 'Inter', size: 12 },
        },
      },
      title: {
        display: !!title,
        text: title,
        font: { family: 'Playfair Display', size: 16, weight: 'bold' as const },
        padding: { bottom: 20 },
        color: '#1a2332',
      },
      tooltip: {
        backgroundColor: '#1a2332',
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 10 }, color: '#8b95a5' },
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(26, 35, 50, 0.06)' },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#8b95a5' },
      },
    },
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}
