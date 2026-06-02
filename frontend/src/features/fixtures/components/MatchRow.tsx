import { Link } from 'react-router-dom'
import { CalendarClock, MapPin, Radio, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Match } from '../types'
import { MatchStatusBadge } from './MatchStatusBadge'

interface MatchRowProps {
  match: Match
  /** Resolver for teamId → display name. */
  nameOf: (teamId: number | null | undefined) => string
  /** Show a referee entry-point button (organizer/referee context). */
  showRefereeLink?: boolean
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
export function MatchRow({ match, nameOf, showRefereeLink }: MatchRowProps) {
  const isFinished = match.status === 'finished'
  const date = formatDate(match.scheduled_at)
  const isLive = match.status === 'live' || match.status === 'paused'

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        to={`/partido/${match.id}`}
        className="hover:bg-muted/50 -m-1 flex flex-1 items-center gap-3 rounded p-1 transition-colors"
      >
        <span className="flex-1 text-right text-sm font-medium">
          {nameOf(match.home_team_id)}
        </span>
        <span className="bg-muted min-w-14 rounded px-2 py-1 text-center text-sm font-semibold tabular-nums">
          {isFinished || isLive
            ? `${match.home_score ?? 0} - ${match.away_score ?? 0}`
            : 'vs'}
        </span>
        <span className="flex-1 text-left text-sm font-medium">
          {nameOf(match.away_team_id)}
        </span>
      </Link>

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
        {isLive ? (
          <Button asChild variant="ghost" size="icon" className="size-7">
            <Link to={`/partido/${match.id}`} aria-label="Ver en vivo">
              <Radio className="text-destructive size-4" />
            </Link>
          </Button>
        ) : null}
        {showRefereeLink && !isFinished ? (
          <Button asChild variant="outline" size="sm" className="h-7">
            <Link to={`/arbitro/partido/${match.id}`}>
              <Timer className="size-3.5" />
              Dirigir
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
