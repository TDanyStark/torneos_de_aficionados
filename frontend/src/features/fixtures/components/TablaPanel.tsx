import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { GitBranch } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useStages } from '@/features/tournaments/api/useStages'
import { useAdvancementRules } from '@/features/tournaments/api/useAdvancementRules'
import { useFixtureFilters } from '@/features/fixtures/hooks/useFixtureFilters'
import { useStandings } from '@/features/fixtures/api/useStandings'
import { useRounds } from '@/features/fixtures/api/useRounds'
import { useMatches } from '@/features/fixtures/api/useMatches'
import { useTeamNameMap } from '@/features/fixtures/api/useTeamNameMap'
import { useTournamentGroups } from '@/features/fixtures/api/useTournamentGroups'
import { GroupSelect } from '@/features/fixtures/components/GroupSelect'
import { StandingsTable } from '@/features/fixtures/components/StandingsTable'
import { StandingsSkeleton } from '@/features/fixtures/components/StandingsSkeleton'
import { BracketView } from '@/features/fixtures/components/BracketView'
import type { Stage, Tournament } from '@/features/tournaments/types'

interface TablaPanelProps {
  tournament: Tournament
  /**
   * Optional active phase (stage). When provided, the standings/bracket view is
   * scoped to that stage and rendered by its type:
   *   - `knockout` → BracketView,
   *   - `groups`   → group-scoped StandingsTable (GroupSelect for that stage),
   *   - `league`   → StandingsTable for the stage's single group.
   * When absent, falls back to the legacy all-groups behaviour (Fase 8/9/10).
   */
  stageId?: number
}

/**
 * Standings panel for the tournament hub. Phase-aware (Fase 11): when a
 * `stageId` is supplied it scopes groups to that single stage and switches the
 * rendered view by the stage's `type`. Standings rows are coloured by the
 * stage's advancement rule (green = qualifies, red = eliminated).
 */
export function TablaPanel({ tournament, stageId }: TablaPanelProps) {
  const tournamentId = tournament.id

  const { filters, setFilters } = useFixtureFilters()
  const stages = useStages(tournamentId || undefined)

  const activeStage: Stage | undefined = useMemo(() => {
    if (stageId == null) return undefined
    return (stages.data ?? []).find((s) => s.id === stageId)
  }, [stages.data, stageId])

  // When a phase is selected, scope the group flat-list to that single stage;
  // otherwise keep the legacy all-stages behaviour.
  const scopedStages = useMemo(
    () => (activeStage ? [activeStage] : stages.data),
    [activeStage, stages.data],
  )
  const { groups, isLoading: groupsLoading } = useTournamentGroups(scopedStages)

  const isKnockout = activeStage?.type === 'knockout'

  // Default the selected group to the first available one (standings views).
  const activeGroupId =
    filters.group ?? (groups.length > 0 ? groups[0].id : undefined)

  useEffect(() => {
    if (isKnockout) return
    if (groups.length === 0) return
    const valid = groups.some((g) => g.id === filters.group)
    if (!valid) {
      setFilters({ group: groups[0].id })
    }
  }, [isKnockout, filters.group, groups, setFilters])

  const standings = useStandings(isKnockout ? undefined : activeGroupId)

  // Advancement rule for the active stage + selected group (or group-agnostic).
  const advancement = useAdvancementRules(activeStage?.id)
  const rule = useMemo(() => {
    if (!activeStage) return undefined
    const rules = advancement.data ?? []
    return (
      rules.find(
        (r) =>
          r.stage_id === activeStage.id && r.group_id === activeGroupId,
      ) ?? rules.find((r) => r.stage_id === activeStage.id && r.group_id === null)
    )
  }, [advancement.data, activeStage, activeGroupId])

  /* --- Knockout (bracket) data, only fetched/used when needed. --- */
  const rounds = useRounds(isKnockout ? tournamentId || undefined : undefined)
  const matches = useMatches(
    isKnockout ? tournamentId || undefined : undefined,
    {},
  )
  const { nameOf } = useTeamNameMap(
    isKnockout ? tournamentId || undefined : undefined,
  )

  const knockoutRounds = useMemo(
    () =>
      activeStage
        ? (rounds.data ?? []).filter((r) => r.stage_id === activeStage.id)
        : [],
    [rounds.data, activeStage],
  )
  const knockoutMatches = useMemo(
    () =>
      activeStage
        ? (matches.data ?? []).filter((m) => m.stage_id === activeStage.id)
        : [],
    [matches.data, activeStage],
  )

  const loading = groupsLoading || stages.isLoading

  /* ---------------------- Render-by-type ---------------------- */
  if (loading) {
    return <StandingsSkeleton />
  }

  if (isKnockout) {
    const knockoutLoading = rounds.isLoading || matches.isLoading
    return (
      <div className="space-y-5">
        {knockoutLoading ? (
          <StandingsSkeleton />
        ) : matches.isError ? (
          <ErrorState message={matches.error?.message} />
        ) : knockoutMatches.length === 0 ? (
          <EmptyState
            title="Cuadro vacío"
            description="Aún no se ha generado el fixture de esta fase de eliminación."
          />
        ) : (
          <BracketView
            rounds={knockoutRounds}
            matches={knockoutMatches}
            nameOf={nameOf}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {groups.length > 0 ? (
        <GroupSelect
          groups={groups}
          value={activeGroupId}
          clearable={false}
          onChange={(group) => setFilters({ group })}
        />
      ) : null}

      {groups.length === 0 ? (
        <EmptyState
          title="Sin grupos"
          description="Aún no se han configurado grupos en este torneo."
        />
      ) : standings.isLoading ? (
        <StandingsSkeleton />
      ) : standings.isError ? (
        <ErrorState message={standings.error?.message} />
      ) : !standings.data || standings.data.standings.length === 0 ? (
        <EmptyState
          title="Tabla vacía"
          description="Aún no hay resultados para calcular la tabla de este grupo."
        />
      ) : (
        <StandingsTable
          rows={standings.data.standings}
          qualifiesCount={rule?.qualifies_count}
          eliminatesCount={rule?.eliminates_count}
        />
      )}

      {/* Knockout bracket stays reachable from the hub via this link. */}
      <Link
        to={`/tournaments/${tournament.slug}/bracket`}
        className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <GitBranch className="size-4" />
        Ver cuadro de eliminación
      </Link>
    </div>
  )
}
