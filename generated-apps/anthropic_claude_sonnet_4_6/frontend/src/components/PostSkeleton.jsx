export default function PostSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="flex gap-4 mt-2">
            <div className="skeleton h-4 w-12 rounded" />
            <div className="skeleton h-4 w-12 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
