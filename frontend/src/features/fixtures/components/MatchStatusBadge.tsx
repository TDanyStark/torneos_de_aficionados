import { Badge } from '@/components/ui/badge'
import type { MatchStatus } from '../types'

const LABELS: Record<MatchStatus, string> = {
  scheduled: 'Programado',
  live: 'En vivo',
  paused: 'Pausado',
  finished: 'Finalizado',
  postponed: 'Aplazado',
  walkover: 'W.O.',
}

const VARIANTS: Record<
  MatchStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  scheduled: 'outline',
  live: 'default',
  paused: 'secondary',
  finished: 'secondary',
  postponed: 'outline',
  walkover: 'destructive',
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
}

export const MATCH_STATUS_LABELS = LABELS
