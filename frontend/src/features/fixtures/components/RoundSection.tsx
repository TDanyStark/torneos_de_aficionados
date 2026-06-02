import type { Match, Round } from '../types'
import { MatchRow } from './MatchRow'

interface RoundSectionProps {
  round: Round | undefined
  /** Fallback label when the round entity is unknown (e.g. number only). */
  fallbackNumber: number
  matches: Match[]
  nameOf: (teamId: number | null | undefined) => string
}

function formatRoundDate(value: string | null | undefined): string | null {
  if (!value) return null
  const d = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

/** A jornada header followed by its matches. */
export function RoundSection({
  round,
  fallbackNumber,
  matches,
  nameOf,
}: RoundSectionProps) {
  const title =
    round?.name?.trim() || `Jornada ${round?.number ?? fallbackNumber}`
  const date = formatRoundDate(round?.scheduled_date)

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {date ? (
          <span className="text-muted-foreground text-xs capitalize">
            {date}
          </span>
        ) : null}
      </div>
      <div className="space-y-2">
        {matches.map((m) => (
          <MatchRow key={m.id} match={m} nameOf={nameOf} />
        ))}
      </div>
    </section>
  )
}
