import { Badge } from '@/components/ui/badge'
import type { RegistrationStatus } from '../types'

const LABELS: Record<RegistrationStatus, string> = {
  submitted: 'Enviada',
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const VARIANTS: Record<
  RegistrationStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  submitted: 'outline',
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
}

export function RegistrationStatusBadge({
  status,
}: {
  status: RegistrationStatus
}) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
}

export const REGISTRATION_STATUS_LABELS = LABELS
