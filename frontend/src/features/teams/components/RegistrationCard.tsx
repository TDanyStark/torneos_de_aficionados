import { Link } from 'react-router-dom'
import { Check, Clock, LinkIcon, Pencil, Users, X } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Registration } from '../types'
import { RegistrationStatusBadge } from './RegistrationStatusBadge'

interface RegistrationCardProps {
  registration: Registration
  /** Tournament slug — builds the link to the team management view. */
  slug: string
  onApprove: (id: number) => void
  onReject: (id: number) => void
  pending?: boolean
}

const CHANNEL_LABEL: Record<Registration['channel'], string> = {
  manual: 'Manual',
  self_link: 'Autoinscripción',
}

export function RegistrationCard({
  registration,
  slug,
  onApprove,
  onReject,
  pending,
}: RegistrationCardProps) {
  const isDecidable =
    registration.status === 'submitted' || registration.status === 'pending'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{registration.team_name}</CardTitle>
          <RegistrationStatusBadge status={registration.status} />
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary" className="gap-1">
          {registration.channel === 'self_link' ? (
            <LinkIcon className="size-3" />
          ) : (
            <Pencil className="size-3" />
          )}
          {CHANNEL_LABEL[registration.channel]}
        </Badge>
        {registration.is_late === 1 ? (
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" />
            Tardía
            {registration.joined_at_round != null
              ? ` · jornada ${registration.joined_at_round}`
              : ''}
          </Badge>
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link
            to={`/t/${slug}/teams/${registration.tournament_team_id}/manage`}
          >
            <Users className="size-4" />
            Ver equipo y jugadores
          </Link>
        </Button>
        {isDecidable ? (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => onApprove(registration.id)}
            >
              <Check className="size-4" />
              Aprobar
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => onReject(registration.id)}
            >
              <X className="size-4" />
              Rechazar
            </Button>
          </>
        ) : null}
      </CardFooter>
    </Card>
  )
}
