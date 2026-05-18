import { cn } from '@/lib/utils'

const PLATFORM_LABELS: Record<string, string> = {
  twitter: '𝕏 Twitter',
  instagram: '📸 Instagram',
  telegram: '✈️ Telegram',
}

const PLATFORM_COLOR_CLASSES: Record<string, string> = {
  twitter: 'bg-blue-50 text-blue-700',
  instagram: 'bg-pink-50 text-pink-700',
  telegram: 'bg-sky-50 text-sky-700',
}

interface PlatformBadgeProps {
  platform: string
  className?: string
}

export default function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        PLATFORM_COLOR_CLASSES[platform.toLowerCase()] || 'bg-gray-100 text-gray-700',
        className
      )}
    >
      {PLATFORM_LABELS[platform.toLowerCase()] || platform}
    </span>
  )
}

export { PLATFORM_LABELS }
