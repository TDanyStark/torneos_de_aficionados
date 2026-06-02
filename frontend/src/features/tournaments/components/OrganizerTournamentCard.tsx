import { Link } from 'react-router-dom'
import { CalendarDays, Copy, Inbox, Pencil, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Tournament } from '../types'
import { TournamentStatusBadge } from './TournamentStatusBadge'

export function OrganizerTournamentCard({
  tournament,
}: {
  tournament: Tournament
}) {
  const copyRegistrationLink = async () => {
    if (!tournament.registration_code) {
      toast.error(
        'Abre las inscripciones del torneo para generar el enlace de inscripción.',
      )
      return
    }
    const link = `${window.location.origin}/inscripcion/${tournament.id}/${tournament.registration_code}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Enlace de inscripción copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{tournament.name}</CardTitle>
          <TournamentStatusBadge status={tournament.status} />
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        <p className="line-clamp-2">
          {tournament.description ?? 'Sin descripción'}
        </p>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/tournaments/${tournament.id}/edit`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/tournaments/${tournament.id}/roles`}>
            <Users className="size-4" />
            Roles
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/tournaments/${tournament.id}/registrations`}>
            <Inbox className="size-4" />
            Inscripciones
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/tournaments/${tournament.id}/fixtures`}>
            <CalendarDays className="size-4" />
            Fixtures
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={copyRegistrationLink}>
          <Copy className="size-4" />
          Copiar enlace
        </Button>
      </CardFooter>
    </Card>
  )
}
