import { Card, CardContent } from '@/components/ui/card'
import type { LiveMatch } from '../types'
import { LiveIndicator } from './LiveIndicator'

interface LiveScoreboardProps {
  snapshot: LiveMatch
  nameOf: (teamId: number | null | undefined) => string
}

/** Big public scoreboard: team names, derived score, status + active minute. */
export function LiveScoreboard({ snapshot, nameOf }: LiveScoreboardProps) {
  const { match, score, active_period } = snapshot
  const periodLabel =
    active_period != null
      ? `Período ${active_period.number}`
      : match.status === 'finished'
        ? 'Final'
        : null

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div className="flex items-center justify-center gap-3">
          <LiveIndicator status={match.status} />
          {periodLabel ? (
            <span className="text-muted-foreground text-xs font-medium">
              {periodLabel}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span className="text-right text-sm font-semibold sm:text-base">
            {nameOf(match.home_team_id)}
          </span>
          <span className="bg-muted rounded-lg px-4 py-2 text-2xl font-bold tabular-nums sm:text-3xl">
            {score.home} <span className="text-muted-foreground">-</span> {score.away}
          </span>
          <span className="text-left text-sm font-semibold sm:text-base">
            {nameOf(match.away_team_id)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
