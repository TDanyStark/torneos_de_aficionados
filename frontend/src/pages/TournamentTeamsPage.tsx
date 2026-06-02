import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, LinkIcon, Pencil, Settings2, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { TournamentLogo } from '@/features/tournaments/components/TournamentLogo'
import { useRegistrations } from '@/features/teams/api/useRegistrations'
import { useRegistrationFilters } from '@/features/teams/hooks/useRegistrationFilters'
import { RegistrationStatusBadge } from '@/features/teams/components/RegistrationStatusBadge'
import type {
  RegistrationChannel,
  RegistrationStatus,
} from '@/features/teams/types'

const CHANNEL_LABEL: Record<RegistrationChannel, string> = {
  manual: 'Inscrito por mí',
  self_link: 'Por enlace',
}

const CHANNEL_OPTIONS: SelectOption<RegistrationChannel | ''>[] = [
  { value: '', label: 'Todos los canales' },
  { value: 'manual', label: 'Inscritos por mí' },
  { value: 'self_link', label: 'Por enlace' },
]

const STATUS_OPTIONS: SelectOption<RegistrationStatus | ''>[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
]

export function TournamentTeamsPage() {
  const { id } = useParams<{ id: string }>()
  const tournamentId = Number(id)
  const { filters, setFilters } = useRegistrationFilters()
  const { data, isLoading, isError, error } = useRegistrations(
    tournamentId,
    filters,
  )

  // Channel is filtered client-side: the data already carries `channel`.
  const items = useMemo(() => {
    const all = data?.items ?? []
    return filters.channel
      ? all.filter((r) => r.channel === filters.channel)
      : all
  }, [data, filters.channel])

  if (!Number.isFinite(tournamentId) || tournamentId <= 0) {
    return <ErrorState message="Torneo inválido." />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <Users className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Equipos del torneo</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReactSelect<SelectOption<RegistrationChannel | ''>>
          options={CHANNEL_OPTIONS}
          value={
            CHANNEL_OPTIONS.find(
              (o) => o.value === (filters.channel ?? ''),
            ) ?? CHANNEL_OPTIONS[0]
          }
          onChange={(opt) =>
            setFilters({ channel: (opt?.value || undefined) as RegistrationChannel | undefined })
          }
          isSearchable={false}
        />
        <ReactSelect<SelectOption<RegistrationStatus | ''>>
          options={STATUS_OPTIONS}
          value={
            STATUS_OPTIONS.find((o) => o.value === (filters.status ?? '')) ??
            STATUS_OPTIONS[0]
          }
          onChange={(opt) =>
            setFilters({ status: (opt?.value || undefined) as RegistrationStatus | undefined })
          }
          isSearchable={false}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin equipos"
          description="Aún no hay equipos inscritos con estos filtros. Comparte el enlace de inscripción para que los delegados inscriban sus equipos."
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((registration) => (
              <Card key={registration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <TournamentLogo
                        name={registration.team_name}
                        seed={registration.tournament_team_id}
                      />
                      <CardTitle className="text-base">
                        {registration.team_name}
                      </CardTitle>
                    </div>
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
                    <Badge variant="outline">Tardía</Badge>
                  ) : null}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`/tournaments/${tournamentId}/teams/${registration.tournament_team_id}/manage`}
                    >
                      <Settings2 className="size-4" />
                      Gestionar
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {data ? (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.total_pages}
              onChange={(page) => setFilters({ page })}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
