import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/apiClient'
import { useStages } from '@/features/tournaments/api/useStages'
import { useAuthStore } from '@/stores/authStore'
import { useFixtureFilters } from '@/features/fixtures/hooks/useFixtureFilters'
import { useRounds } from '@/features/fixtures/api/useRounds'
import { useMatches } from '@/features/fixtures/api/useMatches'
import { useTeamNameMap } from '@/features/fixtures/api/useTeamNameMap'
import { useTournamentGroups } from '@/features/fixtures/api/useTournamentGroups'
import {
  useDeleteMatch,
  useDeleteRound,
} from '@/features/fixtures/api/useManualFixtures'
import { GroupSelect } from '@/features/fixtures/components/GroupSelect'
import { RoundSection } from '@/features/fixtures/components/RoundSection'
import { CreateRoundDialog } from '@/features/fixtures/components/CreateRoundDialog'
import { CreateMatchDialog } from '@/features/fixtures/components/CreateMatchDialog'
import { FixtureSkeleton } from '@/features/fixtures/components/FixtureSkeleton'
import { AdSlot } from '@/components/shared/ads/AdSlot'
import type { Tournament } from '@/features/tournaments/types'
import type { Match, Round } from '@/features/fixtures/types'

interface FixturesPanelProps {
  tournament: Tournament
  /**
   * Optional active phase (stage). When provided, the calendar is scoped to
   * that stage: the group selector lists only that stage's groups and the
   * round/match lists are filtered by `stage_id` (client-side). When absent,
   * falls back to the legacy all-stages behaviour.
   */
  stageId?: number
}

/**
 * Fixtures/calendar panel for the tournament hub. The rounds (jornadas) are
 * rendered as tabs: visitors switch between dates and see that date's matches.
 * Organizers get inline management — create a date, create a match inside the
 * selected date, and delete matches or dates — without leaving the hub.
 */
export function FixturesPanel({ tournament, stageId }: FixturesPanelProps) {
  const tournamentId = tournament.id

  const roles = useAuthStore((s) => s.roles)
  const isOrganizer = roles.some(
    (r) => r.tournament_id === tournamentId && r.role === 'organizer',
  )
  // Show the referee entry-point to organizers and referees of this tournament.
  const canReferee = roles.some(
    (r) =>
      r.tournament_id === tournamentId &&
      (r.role === 'organizer' || r.role === 'referee'),
  )

  const { filters, setFilters } = useFixtureFilters()
  const stages = useStages(tournamentId || undefined)

  // When a phase is selected, scope the group flat-list to that single stage.
  const scopedStages = useMemo(
    () =>
      stageId != null
        ? (stages.data ?? []).filter((s) => s.id === stageId)
        : stages.data,
    [stages.data, stageId],
  )
  const { groups } = useTournamentGroups(scopedStages)

  const rounds = useRounds(tournamentId || undefined)
  const matches = useMatches(tournamentId || undefined, filters)
  const { nameOf } = useTeamNameMap(tournamentId || undefined)

  const deleteMatch = useDeleteMatch(tournamentId)
  const deleteRound = useDeleteRound(tournamentId)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null)
  const [roundToDelete, setRoundToDelete] = useState<Round | null>(null)

  // Client-side stage scoping: rounds and matches carry `stage_id`.
  const scopedRounds = useMemo(
    () =>
      stageId != null
        ? (rounds.data ?? []).filter((r) => r.stage_id === stageId)
        : (rounds.data ?? []),
    [rounds.data, stageId],
  )
  const scopedMatches = useMemo(
    () =>
      stageId != null
        ? (matches.data ?? []).filter((m) => m.stage_id === stageId)
        : (matches.data ?? []),
    [matches.data, stageId],
  )

  const roundById = useMemo(() => {
    const m = new Map<number, Round>()
    for (const r of scopedRounds) m.set(r.id, r)
    return m
  }, [scopedRounds])

  // Distinct round numbers available (optionally scoped to the selected group).
  const roundNumbers = useMemo(() => {
    const source = scopedRounds.filter((r) =>
      filters.group ? r.group_id === filters.group : true,
    )
    const nums = Array.from(new Set(source.map((r) => r.number)))
    return nums.sort((a, b) => a - b)
  }, [scopedRounds, filters.group])

  // Group the (already server-filtered) matches by their round number.
  const grouped = useMemo(() => {
    const byNumber = new Map<number, Match[]>()
    for (const match of scopedMatches) {
      const round =
        match.round_id != null ? roundById.get(match.round_id) : undefined
      const number = round?.number ?? 0
      const list = byNumber.get(number) ?? []
      list.push(match)
      byNumber.set(number, list)
    }
    return Array.from(byNumber.entries()).sort((a, b) => a[0] - b[0])
  }, [scopedMatches, roundById])

  // Stage to attach a new round to: the active phase, else the first stage.
  const effectiveStageId = stageId ?? stages.data?.[0]?.id ?? null

  // The round entity for the currently selected date (organizer match-create).
  const activeRound = useMemo(() => {
    if (filters.round == null) return undefined
    return scopedRounds.find(
      (r) =>
        r.number === filters.round &&
        (filters.group ? r.group_id === filters.group : true),
    )
  }, [scopedRounds, filters.round, filters.group])

  const onConfirmDeleteMatch = async () => {
    if (!matchToDelete) return
    try {
      await deleteMatch.mutateAsync(matchToDelete.id)
      toast.success('Partido eliminado')
      setMatchToDelete(null)
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar el partido',
      )
    }
  }

  const onConfirmDeleteRound = async () => {
    if (!roundToDelete) return
    try {
      await deleteRound.mutateAsync(roundToDelete.id)
      toast.success('Fecha eliminada')
      setRoundToDelete(null)
      setFilters({ round: undefined })
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar la fecha',
      )
    }
  }

  const loading = rounds.isLoading || matches.isLoading

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {groups.length > 0 ? (
          <GroupSelect
            groups={groups}
            value={filters.group}
            onChange={(group) => setFilters({ group, round: undefined })}
          />
        ) : (
          <span />
        )}
        {isOrganizer ? (
          <div className="flex flex-wrap items-center gap-2">
            {effectiveStageId != null ? (
              <CreateRoundDialog
                tournamentId={tournamentId}
                stageId={effectiveStageId}
                groupId={filters.group ?? null}
              />
            ) : null}
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/t/${tournament.slug}/fixtures`}>
                <Settings2 className="size-4" />
                Gestión avanzada
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {/* Date tabs — one per jornada, plus an "all dates" toggle. */}
      {roundNumbers.length > 0 ? (
        <div
          role="tablist"
          aria-label="Fechas del torneo"
          className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={filters.round == null}
            onClick={() => setFilters({ round: undefined })}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              filters.round == null
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            Todas
          </button>
          {roundNumbers.map((number) => {
            const active = filters.round === number
            const round = scopedRounds.find((r) => r.number === number)
            const label = round?.name?.trim() || `Fecha ${number}`
            return (
              <button
                key={number}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilters({ round: number })}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-brand text-brand-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      ) : null}

      {/* Organizer toolbar for the selected date: add/delete actions. */}
      {isOrganizer && activeRound ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
          <span className="text-muted-foreground text-xs">
            Gestión de {activeRound.name?.trim() || `Fecha ${activeRound.number}`}:
          </span>
          <CreateMatchDialog
            tournamentId={tournamentId}
            stageId={activeRound.stage_id}
            roundId={activeRound.id}
            groupId={activeRound.group_id}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setRoundToDelete(activeRound)}
          >
            <Trash2 className="size-4" />
            Eliminar fecha
          </Button>
        </div>
      ) : null}

      {loading ? (
        <FixtureSkeleton />
      ) : matches.isError ? (
        <ErrorState message={matches.error?.message} />
      ) : grouped.length === 0 ? (
        <EmptyState
          title="Sin partidos"
          description="Aún no se ha generado el fixture de este torneo."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([number, roundMatches], index) => {
            const round = scopedRounds.find((r) => r.number === number)
            // Insert one between-matches ad roughly mid-list (after the first
            // round when there's more than one). Renders nothing if unsold.
            const showAd = index === 0 && grouped.length > 1
            return (
              <div key={number} className="space-y-6">
                <RoundSection
                  round={round}
                  fallbackNumber={number}
                  matches={roundMatches}
                  nameOf={nameOf}
                  showRefereeLink={canReferee}
                  onDeleteMatch={isOrganizer ? setMatchToDelete : undefined}
                />
                {showAd && tournamentId > 0 ? (
                  <AdSlot
                    placement="between_matches"
                    tournamentId={tournamentId}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={matchToDelete != null}
        onOpenChange={(next) => {
          if (!next) setMatchToDelete(null)
        }}
        title="Eliminar partido"
        description="Se eliminará el partido. No es posible eliminar partidos en vivo, pausados, finalizados o por W.O."
        confirmLabel="Eliminar"
        destructive
        loading={deleteMatch.isPending}
        onConfirm={onConfirmDeleteMatch}
      />

      <ConfirmDialog
        open={roundToDelete != null}
        onOpenChange={(next) => {
          if (!next) setRoundToDelete(null)
        }}
        title="Eliminar fecha"
        description="Se eliminará la fecha y sus partidos no jugados. Si tiene partidos en curso o finalizados, la operación será rechazada."
        confirmLabel="Eliminar"
        destructive
        loading={deleteRound.isPending}
        onConfirm={onConfirmDeleteRound}
      />
    </div>
  )
}
