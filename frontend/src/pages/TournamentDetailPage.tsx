import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  GitBranch,
  ListOrdered,
  Users,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/StateMessage'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'
import { TournamentStatusBadge } from '@/features/tournaments/components/TournamentStatusBadge'

export function TournamentDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError, error } = useTournamentDetail(slug)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return <ErrorState message={error?.message ?? 'Torneo no encontrado.'} />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Torneos
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-2xl">{data.name}</CardTitle>
            <TournamentStatusBadge status={data.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.description ? (
            <p className="text-muted-foreground">{data.description}</p>
          ) : null}

          {data.starts_at ? (
            <p className="flex items-center gap-2 text-sm">
              <Calendar className="size-4" />
              Inicia: {new Date(data.starts_at).toLocaleString()}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Periodos</dt>
              <dd className="font-medium">{data.periods_count}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Victoria</dt>
              <dd className="font-medium">{data.points_win} pts</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Empate</dt>
              <dd className="font-medium">{data.points_draw} pts</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Derrota</dt>
              <dd className="font-medium">{data.points_loss} pts</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/tournaments/${data.slug}/teams`}>
                <Users className="size-4" />
                Equipos
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/tournaments/${data.slug}/fixtures`}>
                <CalendarDays className="size-4" />
                Calendario
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/tournaments/${data.slug}/standings`}>
                <ListOrdered className="size-4" />
                Posiciones
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/tournaments/${data.slug}/bracket`}>
                <GitBranch className="size-4" />
                Cuadro
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
