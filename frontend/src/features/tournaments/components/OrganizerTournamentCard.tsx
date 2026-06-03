import { Link } from 'react-router-dom'
import { Eye, Pencil, Share2 } from 'lucide-react'
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
import { TournamentLogo } from './TournamentLogo'

export function OrganizerTournamentCard({
  tournament,
}: {
  tournament: Tournament
}) {
  const copyShareLink = async () => {
    // Single shareable link: the public tournament hub. Anyone with it can see
    // the tournament and (if registrations are open) inscribe their team.
    const link = `${window.location.origin}/t/${tournament.slug}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Enlace del torneo copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <TournamentLogo
              name={tournament.name}
              logoUrl={tournament.logo_url}
              seed={tournament.id}
            />
            <CardTitle className="text-base">{tournament.name}</CardTitle>
          </div>
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
          <Link to={`/t/${tournament.slug}`}>
            <Eye className="size-4" />
            Ver torneo
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/t/${tournament.slug}/edit`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={copyShareLink}>
          <Share2 className="size-4" />
          Compartir
        </Button>
      </CardFooter>
    </Card>
  )
}
