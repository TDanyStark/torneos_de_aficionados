import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, LinkIcon, Pencil, Settings2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { TournamentLogo } from '@/features/tournaments/components/TournamentLogo'
import type { Tournament } from '@/features/tournaments/types'
import {
  useRegistrations,
  useDecideRegistration,
} from '@/features/teams/api/useRegistrations'
import { useRegistrationFilters } from '@/features/teams/hooks/useRegistrationFilters'
import { RegistrationStatusBadge } from '@/features/teams/components/RegistrationStatusBadge'
import { DeleteTeamDialog } from '@/features/teams/components/DeleteTeamDialog'
import type {
  Registration,
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

interface AdminTeamsPanelProps {
  tournament: Tournament
}

/**
 * Unified organizer teams panel. Replaces the separate "Equipos" and
 * "Inscripciones" surfaces with a single league-style list. When the
 * tournament's `registration_open` flag is true, each row exposes the
 * inscription actions (approve / reject / delete); when closed it is a plain
 * team list with manage + delete. Data is sourced from
 * GET /tournaments/{id}/registrations, which carries both the registration and
 * team status plus the `tournament_team_id` used by the delete action.
 */
export function AdminTeamsPanel({ tournament }: AdminTeamsPanelProps) {
  const tournamentId = tournament.id
  const slug = tournament.slug
  const inscriptionMode = tournament.registration_open

  const { filters, setFilters } = useRegistrationFilters()
  const { data, isLoading, isError, error } = useRegistrations(
    tournamentId,
    filters,
  )
  const decide = useDecideRegistration()

  const [pendingId, setPendingId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<Registration | null>(null)

  // Channel is filtered client-side: the data already carries `channel`.
  const items = (data?.items ?? []).filter((r) =>
    filters.channel ? r.channel === filters.channel : true,
  )

  const onDecide = async (
    registrationId: number,
    status: 'approved' | 'rejected',
  ) => {
    setPendingId(registrationId)
    try {
      await decide.mutateAsync({ registrationId, status })
      toast.success(
        status === 'approved' ? 'Inscripción aprobada' : 'Inscripción rechazada',
      )
    } catch {
      toast.error('No se pudo procesar la inscripción')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <ReactSelect<SelectOption<RegistrationChannel | ''>>
          options={CHANNEL_OPTIONS}
          value={
            CHANNEL_OPTIONS.find((o) => o.value === (filters.channel ?? '')) ??
            CHANNEL_OPTIONS[0]
          }
          onChange={(opt) =>
            setFilters({
              channel: (opt?.value || undefined) as
                | RegistrationChannel
                | undefined,
            })
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
            setFilters({
              status: (opt?.value || undefined) as
                | RegistrationStatus
                | undefined,
            })
          }
          isSearchable={false}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin equipos"
          description={
            inscriptionMode
              ? 'Aún no hay inscripciones. Comparte el enlace del torneo para que los delegados inscriban sus equipos.'
              : 'Aún no hay equipos inscritos con estos filtros.'
          }
        />
      ) : (
        <>
          <ul className="divide-y rounded-md border">
            {items.map((registration) => {
              const isDecidable =
                registration.status === 'submitted' ||
                registration.status === 'pending'
              return (
                <li
                  key={registration.id}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <TournamentLogo
                      name={registration.team_name}
                      seed={registration.tournament_team_id}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {registration.team_name}
                        </span>
                        <RegistrationStatusBadge
                          status={registration.status}
                        />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
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
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={`/t/${slug}/teams/${registration.tournament_team_id}/manage`}
                      >
                        <Settings2 className="size-4" />
                        Gestionar
                      </Link>
                    </Button>

                    {inscriptionMode && isDecidable ? (
                      <>
                        <Button
                          size="sm"
                          disabled={pendingId === registration.id}
                          onClick={() => onDecide(registration.id, 'approved')}
                        >
                          <Check className="size-4" />
                          Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pendingId === registration.id}
                          onClick={() => onDecide(registration.id, 'rejected')}
                        >
                          <X className="size-4" />
                          Rechazar
                        </Button>
                      </>
                    ) : null}

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar equipo"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setToDelete(registration)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>

          {data ? (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.total_pages}
              onChange={(page) => setFilters({ page })}
            />
          ) : null}
        </>
      )}

      <DeleteTeamDialog
        teamId={toDelete?.tournament_team_id ?? 0}
        teamName={toDelete?.team_name}
        open={toDelete != null}
        onOpenChange={(next) => {
          if (!next) setToDelete(null)
        }}
        onDeleted={() => setToDelete(null)}
      />
    </div>
  )
}
