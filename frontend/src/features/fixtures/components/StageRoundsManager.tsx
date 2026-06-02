import { useMemo, useState } from 'react'
import { Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ApiError } from '@/lib/apiClient'
import type { Stage } from '@/features/tournaments/types'
import type { Match, Round } from '../types'
import { useRounds } from '../api/useRounds'
import { useMatches } from '../api/useMatches'
import { useTeamNameMap } from '../api/useTeamNameMap'
import { useDeleteMatch, useDeleteRound } from '../api/useManualFixtures'
import { CreateRoundDialog } from './CreateRoundDialog'
import { CreateMatchDialog } from './CreateMatchDialog'
import { MatchStatusBadge } from './MatchStatusBadge'

interface StageRoundsManagerProps {
  tournamentId: number
  stage: Stage
}

/**
 * Organizer-only manual management of a stage's rounds and matches:
 * create rounds, create (repeated) matches per round, and delete either.
 * Mounted under each stage card on the StageFixturesPage.
 */
export function StageRoundsManager({
  tournamentId,
  stage,
}: StageRoundsManagerProps) {
  const rounds = useRounds(tournamentId)
  const matches = useMatches(tournamentId, {})
  const { nameOf } = useTeamNameMap(tournamentId)

  const deleteRound = useDeleteRound(tournamentId)
  const deleteMatch = useDeleteMatch(tournamentId)

  const [roundToDelete, setRoundToDelete] = useState<Round | null>(null)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null)

  const stageRounds = useMemo(
    () =>
      (rounds.data ?? [])
        .filter((r) => r.stage_id === stage.id)
        .sort((a, b) => a.number - b.number),
    [rounds.data, stage.id],
  )

  const matchesByRound = useMemo(() => {
    const m = new Map<number, Match[]>()
    for (const match of matches.data ?? []) {
      if (match.round_id == null) continue
      const list = m.get(match.round_id) ?? []
      list.push(match)
      m.set(match.round_id, list)
    }
    return m
  }, [matches.data])

  const onConfirmDeleteRound = async () => {
    if (!roundToDelete) return
    try {
      await deleteRound.mutateAsync(roundToDelete.id)
      toast.success('Fecha eliminada')
      setRoundToDelete(null)
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar la fecha',
      )
    }
  }

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Gestión manual de fechas</h3>
        <CreateRoundDialog tournamentId={tournamentId} stageId={stage.id} />
      </div>

      {rounds.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : stageRounds.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Esta fase aún no tiene fechas. Crea una manualmente o genera el
          calendario automáticamente.
        </p>
      ) : (
        <div className="space-y-2">
          {stageRounds.map((round) => {
            const roundMatches = matchesByRound.get(round.id) ?? []
            return (
              <div key={round.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">
                    {round.name?.trim() || `Fecha ${round.number}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <CreateMatchDialog
                      tournamentId={tournamentId}
                      stageId={stage.id}
                      roundId={round.id}
                      groupId={round.group_id}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRoundToDelete(round)}
                    >
                      <Trash2 className="size-4" />
                      Eliminar fecha
                    </Button>
                  </div>
                </div>

                {roundMatches.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Sin partidos en esta fecha.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {roundMatches.map((match) => (
                      <li
                        key={match.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="truncate">
                          {nameOf(match.home_team_id)}
                          {match.status === 'finished'
                            ? ` ${match.home_score ?? 0} - ${match.away_score ?? 0} `
                            : ' vs '}
                          {nameOf(match.away_team_id)}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <MatchStatusBadge status={match.status} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive size-7"
                            aria-label="Eliminar partido"
                            onClick={() => setMatchToDelete(match)}
                          >
                            <X className="size-4" />
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

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

      {deleteRound.isPending || deleteMatch.isPending ? (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <Loader2 className="size-3 animate-spin" />
          Procesando…
        </p>
      ) : null}
    </div>
  )
}
