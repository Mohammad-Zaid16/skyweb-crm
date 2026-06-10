import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer bg-zinc-800/80 rounded', className)} />
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-zinc-900/50">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-6 rounded-md" />
          <Skeleton className="w-16 h-6 rounded-md" />
          <Skeleton className="w-20 h-4" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0f0f10] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="w-20 h-7" />
      <Skeleton className="w-16 h-3" />
    </div>
  )
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0f0f10] p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-20 h-6 rounded-md" />
      </div>
      <div style={{ height }} className="shimmer bg-zinc-800/50 rounded-lg" />
    </div>
  )
}
