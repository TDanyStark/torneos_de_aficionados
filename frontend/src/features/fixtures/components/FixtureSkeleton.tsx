import { Skeleton } from '@/components/ui/skeleton'

/** Loading placeholder for the calendar (a couple of jornadas of matches). */
export function FixtureSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}
