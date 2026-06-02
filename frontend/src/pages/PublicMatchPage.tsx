import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/StateMessage'
import { useTeamNameMap } from '@/features/fixtures/api/useTeamNameMap'
import { useLiveMatch } from '@/features/live/api/useLiveMatch'
import { LiveScoreboard } from '@/features/live/components/LiveScoreboard'
import { LiveTimeline } from '@/features/live/components/LiveTimeline'
import { RefreshButton } from '@/features/live/components/RefreshButton'
import { AdSlot } from '@/components/shared/ads/AdSlot'

export function PublicMatchPage() {
  const { id } = useParams<{ id: string }>()
  const matchId = Number(id)

  const live = useLiveMatch(matchId)
  const tournamentId = live.data?.match.tournament_id
  const { nameOf } = useTeamNameMap(tournamentId)

  if (live.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (live.isError || !live.data) {
    return <ErrorState message={live.error?.message ?? 'Partido no encontrado.'} />
  }

  const snapshot = live.data

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <RefreshButton
          onRefresh={() => live.refetch()}
          isFetching={live.isFetching}
        />
      </div>

      <LiveScoreboard snapshot={snapshot} nameOf={nameOf} />

      {/* In-match ad between scoreboard and timeline (renders nothing if unsold). */}
      <AdSlot
        placement="match_live"
        tournamentId={snapshot.match.tournament_id}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="text-brand size-5" />
            Línea de tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LiveTimeline events={snapshot.events} nameOf={nameOf} />
        </CardContent>
      </Card>
    </div>
  )
}
