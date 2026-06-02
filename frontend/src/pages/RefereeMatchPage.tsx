import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/StateMessage'
import { ApiError } from '@/lib/apiClient'
import { useTeamNameMap } from '@/features/fixtures/api/useTeamNameMap'
import { useTournamentList } from '@/features/tournaments/api/useTournaments'
import { useLiveMatch } from '@/features/live/api/useLiveMatch'
import {
  useStartPeriod,
  useEndPeriod,
  useFinishMatch,
} from '@/features/live/api/usePeriodMutations'
import {
  useRecordEvent,
  useDeleteEvent,
} from '@/features/live/api/useEventMutations'
import { LiveScoreboard } from '@/features/live/components/LiveScoreboard'
import { PeriodTimer } from '@/features/live/components/PeriodTimer'
import { EventButtons } from '@/features/live/components/EventButtons'
import { LiveTimeline } from '@/features/live/components/LiveTimeline'
import { FinishMatchButton } from '@/features/live/components/FinishMatchButton'
import type { RecordEventPayload } from '@/features/live/types'

export function RefereeMatchPage() {
  const { id } = useParams<{ id: string }>()
  const matchId = Number(id)

  const live = useLiveMatch(matchId)
  const tournamentId = live.data?.match.tournament_id
  const { nameOf } = useTeamNameMap(tournamentId)

  // The /live endpoint doesn't expose periods_count; pull it from the tournament
  // list cache (small public list) — fall back to 2 (the default) if absent.
  const tournaments = useTournamentList({ page: 1 })
  const periodsCount =
    tournaments.data?.items.find((t) => t.id === tournamentId)?.periods_count ??
    2

  const startPeriod = useStartPeriod(matchId)
  const endPeriod = useEndPeriod(matchId)
  const finishMatch = useFinishMatch(matchId)
  const recordEvent = useRecordEvent(matchId)
  const deleteEvent = useDeleteEvent(matchId)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleStart = async () => {
    try {
      await startPeriod.mutateAsync()
      toast.success('Período iniciado')
    } catch (error) {
      toast.error(refereeError(error, 'No se pudo iniciar el período'))
    }
  }

  const handleEnd = async () => {
    try {
      await endPeriod.mutateAsync()
      toast.success('Período cerrado')
    } catch (error) {
      toast.error(refereeError(error, 'No se pudo cerrar el período'))
    }
  }

  const handleRecord = async (payload: RecordEventPayload) => {
    // Errors are re-thrown so the dialog can map field errors.
    await recordEvent.mutateAsync(payload)
    toast.success('Evento registrado')
  }

  const handleDelete = async (eventId: number) => {
    setDeletingId(eventId)
    try {
      await deleteEvent.mutateAsync(eventId)
      toast.success('Evento eliminado')
    } catch (error) {
      toast.error(refereeError(error, 'No se pudo eliminar el evento'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleFinish = async () => {
    await finishMatch.mutateAsync()
  }

  if (live.isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (live.isError || !live.data) {
    return <ErrorState message={live.error?.message ?? 'Partido no encontrado.'} />
  }

  const snapshot = live.data
  const finished = snapshot.match.status === 'finished'
  const hasRunningPeriod = snapshot.active_period != null

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          Panel
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <Timer className="text-brand size-6" />
        <h1 className="text-xl font-semibold">Control del partido</h1>
      </div>

      <LiveScoreboard snapshot={snapshot} nameOf={nameOf} />

      {!finished ? (
        <PeriodTimer
          snapshot={snapshot}
          periodsCount={periodsCount}
          onStart={handleStart}
          onEnd={handleEnd}
          starting={startPeriod.isPending}
          ending={endPeriod.isPending}
        />
      ) : null}

      {!finished ? (
        <EventButtons
          snapshot={snapshot}
          nameOf={nameOf}
          onRecord={handleRecord}
          recording={recordEvent.isPending}
          disabled={!hasRunningPeriod}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveTimeline
            events={snapshot.events}
            nameOf={nameOf}
            onDelete={finished ? undefined : handleDelete}
            deletingId={deletingId}
          />
        </CardContent>
      </Card>

      {!finished ? (
        <FinishMatchButton
          onFinish={handleFinish}
          finishing={finishMatch.isPending}
        />
      ) : null}
    </div>
  )
}

/** Map an action error to a referee-friendly message (403 = not the referee). */
function refereeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'No tienes permiso para controlar este partido (solo el árbitro designado u organizador).'
    }
    return error.message
  }
  return fallback
}
