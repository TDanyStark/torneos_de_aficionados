import { useCallback, useMemo } from 'react'
import { ReactSelect, type SelectOption } from '@/components/shared/ReactSelect'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { Pagination } from '@/components/shared/Pagination'
import { useTopScorers } from '@/features/live/api/useStats'
import { usePageParam } from '@/features/live/hooks/usePageParam'
import { usePhaseParam } from '@/features/live/hooks/usePhaseParam'
import { TopScorersTable } from '@/features/live/components/TopScorersTable'
import { StatsSkeleton } from '@/features/live/components/StatsSkeleton'
import { useStages } from '@/features/tournaments/api/useStages'
import type { Tournament } from '@/features/tournaments/types'

interface GoleadoresPanelProps {
  tournament: Tournament
}

/**
 * Top-scorers panel for the tournament hub — paginated TopScorersTable with a
 * multi-select phase filter (`?phase=1,2`) backed by the tournament's stages.
 */
export function GoleadoresPanel({ tournament }: GoleadoresPanelProps) {
  const tournamentId = tournament.id

  const { page, setPage } = usePageParam()
  const { stageIds, setStageIds } = usePhaseParam()
  const stages = useStages(tournamentId)
  const scorers = useTopScorers(tournamentId, page, stageIds)

  const phaseOptions = useMemo<SelectOption<number>[]>(
    () => (stages.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [stages.data],
  )
  const selectedPhases = useMemo<SelectOption<number>[]>(
    () => phaseOptions.filter((o) => stageIds.includes(o.value)),
    [phaseOptions, stageIds],
  )

  const handlePhaseChange = useCallback(
    (opts: readonly SelectOption<number>[]) => {
      setStageIds(opts.map((o) => o.value))
      setPage(1)
    },
    [setStageIds, setPage],
  )

  const pagination = scorers.data?.pagination
  const startIndex = pagination
    ? (pagination.page - 1) * pagination.per_page + 1
    : 1

  return (
    <div className="space-y-5">
      <div className="w-full sm:w-72">
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Filtrar por fase
        </label>
        <ReactSelect<SelectOption<number>, true>
          isMulti
          isLoading={stages.isLoading}
          placeholder="Todas las fases"
          options={phaseOptions}
          value={selectedPhases}
          onChange={(opts) => handlePhaseChange(opts ?? [])}
        />
      </div>
      {scorers.isLoading ? (
        <StatsSkeleton />
      ) : scorers.isError ? (
        <ErrorState message={scorers.error?.message} />
      ) : (scorers.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="Sin goleadores"
          description="Aún no se han registrado goles en este torneo."
        />
      ) : (
        <>
          <TopScorersTable
            rows={scorers.data?.items ?? []}
            startIndex={startIndex}
          />
          {pagination ? (
            <Pagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              onChange={setPage}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
