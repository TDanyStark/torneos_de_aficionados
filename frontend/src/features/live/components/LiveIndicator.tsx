import { Badge } from '@/components/ui/badge'
import type { MatchStatus } from '../types'

const STATUS_META: Record<
  MatchStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; pulse?: boolean }
> = {
  scheduled: { label: 'PROGRAMADO', variant: 'outline' },
  live: { label: 'EN VIVO', variant: 'destructive', pulse: true },
  paused: { label: 'DESCANSO', variant: 'secondary' },
  finished: { label: 'FINALIZADO', variant: 'secondary' },
  postponed: { label: 'APLAZADO', variant: 'outline' },
  walkover: { label: 'W.O.', variant: 'destructive' },
}

/** Big status pill for the public scoreboard, with a pulsing dot when live. */
export function LiveIndicator({ status }: { status: MatchStatus }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant={meta.variant} className="gap-1.5 px-3 py-1 text-xs tracking-wide">
      {meta.pulse ? (
        <span className="relative flex size-2">
          <span className="bg-background absolute inline-flex size-full animate-ping rounded-full opacity-75" />
          <span className="bg-background relative inline-flex size-2 rounded-full" />
        </span>
      ) : null}
      {meta.label}
    </Badge>
  )
}
