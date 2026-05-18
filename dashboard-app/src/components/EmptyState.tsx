import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-16">
      {Icon && (
        <div className="inline-flex items-center justify-center w-14 h-14 bg-cream rounded-2xl mb-5">
          <Icon className="w-7 h-7 text-text-muted" />
        </div>
      )}
      <h3 className="font-display text-lg font-medium text-navy mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-md mx-auto">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
