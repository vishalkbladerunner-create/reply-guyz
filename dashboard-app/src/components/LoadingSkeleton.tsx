export default function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-3 bg-cream-dark rounded w-1/3 mb-4" />
            <div className="h-7 bg-cream-dark rounded w-2/3 mb-2" />
            <div className="h-3 bg-cream-dark rounded w-1/2" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-4 bg-cream-dark rounded w-1/4 mb-6" />
          <div className="h-64 bg-cream-dark rounded" />
        </div>
      ))}
    </div>
  )
}
