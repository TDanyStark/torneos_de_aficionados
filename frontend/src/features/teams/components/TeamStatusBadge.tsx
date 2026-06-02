import { Badge } from '@/components/ui/badge'
import type { TeamStatus } from '../types'

const LABELS: Record<TeamStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  withdrawn: 'Retirado',
}

const VARIANTS: Record<
  TeamStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
  withdrawn: 'secondary',
}

export function TeamStatusBadge({ status }: { status: TeamStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
}

export const TEAM_STATUS_LABELS = LABELS
