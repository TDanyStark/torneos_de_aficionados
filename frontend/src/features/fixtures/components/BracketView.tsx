import type { Match, Round } from '../types'

interface BracketViewProps {
  /** Knockout-stage rounds, ascending by number. */
  rounds: Round[]
  /** All knockout-stage matches. */
  matches: Match[]
  nameOf: (teamId: number | null | undefined) => string
}

/**
 * Human label for a knockout round based on how many matches it has.
 * Falls back to the round's own name/number when the heuristic is ambiguous.
 */
function roundLabel(round: Round, matchCount: number): string {
  if (round.name?.trim()) return round.name
  const byCount: Record<number, string> = {
    1: 'Final',
    2: 'Semifinales',
    4: 'Cuartos de final',
    8: 'Octavos de final',
    16: 'Dieciseisavos',
  }
  return byCount[matchCount] ?? `Ronda ${round.number}`
}

/** A single matchup card inside a bracket column. */
function BracketMatch({
  match,
  nameOf,
}: {
  match: Match
  nameOf: (teamId: number | null | undefined) => string
}) {
  const isFinished = match.status === 'finished'
  const homeWon = match.winner_team_id === match.home_team_id
  const awayWon = match.winner_team_id === match.away_team_id

  return (
    <div className="bg-card w-44 rounded-md border text-sm shadow-sm">
      <Side
        name={nameOf(match.home_team_id)}
        score={isFinished ? match.home_score : null}
        winner={homeWon}
      />
      <div className="border-t" />
      <Side
        name={nameOf(match.away_team_id)}
        score={isFinished ? match.away_score : null}
        winner={awayWon}
      />
    </div>
  )
}

function Side({
  name,
  score,
  winner,
}: {
  name: string
  score: number | null
  winner: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-2 py-1.5 ${
        winner ? 'font-semibold' : ''
      }`}
    >
      <span className="truncate">{name}</span>
      <span className="text-muted-foreground tabular-nums">
        {score ?? '-'}
      </span>
    </div>
  )
}

/**
 * Custom knockout bracket. Renders each round as a column (Octavos → … →
 * Final), derived purely from the knockout-stage matches grouped by their
 * round. Horizontal scroll on small screens.
 */
export function BracketView({ rounds, matches, nameOf }: BracketViewProps) {
  const ordered = [...rounds].sort((a, b) => a.number - b.number)

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-6">
        {ordered.map((round) => {
          const roundMatches = matches
            .filter((m) => m.round_id === round.id)
            .sort((a, b) => a.id - b.id)
          if (roundMatches.length === 0) return null
          return (
            <div
              key={round.id}
              className="flex flex-col justify-around gap-4"
            >
              <h3 className="text-muted-foreground text-center text-xs font-semibold tracking-wide uppercase">
                {roundLabel(round, roundMatches.length)}
              </h3>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {roundMatches.map((m) => (
                  <BracketMatch key={m.id} match={m} nameOf={nameOf} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
