import { CalendarClock, MapPin } from 'lucide-react'
import type { Match } from '../types'
import { MatchStatusBadge } from './MatchStatusBadge'

interface MatchRowProps {
  match: Match
  /** Resolver for teamId → display name. */
  nameOf: (teamId: number | null | undefined) => string
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const d = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** A single match line: home vs away with score, status and metadata. */
export function MatchRow({ match, nameOf }: MatchRowProps) {
  const isFinished = match.status === 'finished'
  const date = formatDate(match.scheduled_at)

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <span className="flex-1 text-right text-sm font-medium">
          {nameOf(match.home_team_id)}
        </span>
        <span className="bg-muted min-w-14 rounded px-2 py-1 text-center text-sm font-semibold tabular-nums">
          {isFinished
            ? `${match.home_score ?? 0} - ${match.away_score ?? 0}`
            : 'vs'}
        </span>
        <span className="flex-1 text-left text-sm font-medium">
          {nameOf(match.away_team_id)}
        </span>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs sm:justify-end">
        {date ? (
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {date}
          </span>
        ) : null}
        {match.venue ? (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {match.venue}
          </span>
        ) : null}
        <MatchStatusBadge status={match.status} />
      </div>
    </div>
  )
}
