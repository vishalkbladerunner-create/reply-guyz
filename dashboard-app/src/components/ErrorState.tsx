import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="card text-center py-16">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-5">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="font-display text-lg font-medium text-navy mb-1">Something went wrong</h3>
      <p className="text-sm text-text-muted max-w-md mx-auto mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  )
}
