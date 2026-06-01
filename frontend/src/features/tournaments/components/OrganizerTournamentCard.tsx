import { Link } from 'react-router-dom'
import { Pencil, Users } from 'lucide-react'
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
      <CardFooter className="gap-2">
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
      </CardFooter>
    </Card>
  )
}
