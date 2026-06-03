import { Badge } from '@/components/ui/badge'
import type { TournamentStatus } from '../types'

const LABELS: Record<TournamentStatus, string> = {
  registration: 'Inscripciones',
  in_progress: 'En curso',
  finished: 'Finalizado',
  archived: 'Archivado',
}

const VARIANTS: Record<
  TournamentStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  registration: 'default',
  in_progress: 'default',
  finished: 'secondary',
  archived: 'destructive',
}

export function TournamentStatusBadge({
  status,
}: {
  status: TournamentStatus
}) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
}

export const TOURNAMENT_STATUS_LABELS = LABELS
