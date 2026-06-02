import { Skeleton } from '@/components/ui/skeleton'

/** Loading placeholder for the standings table. */
export function StandingsSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}
