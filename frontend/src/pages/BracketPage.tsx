import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/shared/StateMessage'
import { useTournamentDetail } from '@/features/tournaments/api/useTournaments'
import { useStages } from '@/features/tournaments/api/useStages'
import { useRounds } from '@/features/fixtures/api/useRounds'
import { useMatches } from '@/features/fixtures/api/useMatches'
import { useTeamNameMap } from '@/features/fixtures/api/useTeamNameMap'
import { BracketView } from '@/features/fixtures/components/BracketView'

export function BracketPage() {
  const { slug } = useParams<{ slug: string }>()
  const tournament = useTournamentDetail(slug)
  const tournamentId = tournament.data?.id ?? 0

  const stages = useStages(tournamentId || undefined)
  const rounds = useRounds(tournamentId || undefined)
  const matches = useMatches(tournamentId || undefined, {})
  const { nameOf } = useTeamNameMap(tournamentId || undefined)

  // Bracket is derived from knockout-stage matches/rounds (no dedicated
  // bracket-slot list endpoint). Restrict to stages of type 'knockout'.
  const knockoutStageIds = useMemo(
    () =>
      new Set(
        (stages.data ?? [])
          .filter((s) => s.type === 'knockout')
          .map((s) => s.id),
      ),
    [stages.data],
  )

  const knockoutRounds = useMemo(
    () => (rounds.data ?? []).filter((r) => knockoutStageIds.has(r.stage_id)),
    [rounds.data, knockoutStageIds],
  )

  const knockoutMatches = useMemo(
    () => (matches.data ?? []).filter((m) => knockoutStageIds.has(m.stage_id)),
    [matches.data, knockoutStageIds],
  )

  if (tournament.isError) {
    return <ErrorState message="Torneo no encontrado." />
  }

  const loading =
    tournament.isLoading ||
    (tournamentId > 0 &&
      (stages.isLoading || rounds.isLoading || matches.isLoading))

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/tournaments/${slug}`}>
          <ArrowLeft className="size-4" />
          {tournament.data?.name ?? 'Torneo'}
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <GitBranch className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Cuadro de eliminación</h1>
      </div>

      {loading ? (
        <div className="flex gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-44" />
          ))}
        </div>
      ) : matches.isError ? (
        <ErrorState message={matches.error?.message} />
      ) : knockoutStageIds.size === 0 ? (
        <EmptyState
          title="Sin fase de eliminación"
          description="Este torneo no tiene una fase de eliminación directa."
        />
      ) : knockoutMatches.length === 0 ? (
        <EmptyState
          title="Cuadro vacío"
          description="Aún no se ha generado el fixture de la fase de eliminación."
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
