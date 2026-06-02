import { useMemo } from 'react'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useStages } from '@/features/tournaments/api/useStages'
import { useAuthStore } from '@/stores/authStore'
import { useFixtureFilters } from '@/features/fixtures/hooks/useFixtureFilters'
import { useRounds } from '@/features/fixtures/api/useRounds'
import { useMatches } from '@/features/fixtures/api/useMatches'
import { useTeamNameMap } from '@/features/fixtures/api/useTeamNameMap'
import { useTournamentGroups } from '@/features/fixtures/api/useTournamentGroups'
import { GroupSelect } from '@/features/fixtures/components/GroupSelect'
import { RoundNavigator } from '@/features/fixtures/components/RoundNavigator'
import { RoundSection } from '@/features/fixtures/components/RoundSection'
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
   * falls back to the legacy all-stages behaviour (Fase 8/9/10).
   */
  stageId?: number
}

/**
 * Fixtures/calendar panel for the tournament hub. Phase-aware (Fase 11): when a
 * `stageId` is supplied the groups, rounds and matches are scoped to that
 * single stage. Behaviour is otherwise unchanged (RoundSection list,
 * `between_matches` ad scoped to the tournament).
 */
export function FixturesPanel({ tournament, stageId }: FixturesPanelProps) {
  const tournamentId = tournament.id

  const roles = useAuthStore((s) => s.roles)
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
        <RoundNavigator
          roundNumbers={roundNumbers}
          value={filters.round}
          onChange={(round) => setFilters({ round })}
        />
      </div>

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
    </div>
  )
}
