import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { StandingRow } from '../types'

interface Column {
  key: string
  label: string
  /** Optional tiebreaker explanation shown as a header tooltip. */
  tooltip?: string
  className?: string
}

const COLUMNS: Column[] = [
  { key: 'position', label: '#', className: 'w-8' },
  { key: 'team', label: 'Equipo', className: 'text-left' },
  { key: 'played', label: 'PJ', tooltip: 'Partidos jugados' },
  { key: 'won', label: 'PG', tooltip: 'Partidos ganados' },
  { key: 'drawn', label: 'PE', tooltip: 'Partidos empatados' },
  { key: 'lost', label: 'PP', tooltip: 'Partidos perdidos' },
  { key: 'goals_for', label: 'GF', tooltip: 'Goles a favor' },
  { key: 'goals_against', label: 'GC', tooltip: 'Goles en contra' },
  {
    key: 'goal_difference',
    label: 'DG',
    tooltip: 'Diferencia de gol — desempate tras los puntos',
  },
  {
    key: 'points',
    label: 'Pts',
    tooltip:
      'Puntos — criterio principal de orden. Los empates se resuelven por los desempates configurados (DG, GF, enfrentamiento directo).',
  },
]

interface StandingsTableProps {
  rows: StandingRow[]
  /**
   * Number of top positions that qualify (advance). Rows with
   * `position <= qualifiesCount` are tinted green. 0 / undefined = none.
   */
  qualifiesCount?: number
  /**
   * Number of bottom positions that are eliminated/relegated. Rows in the
   * last `eliminatesCount` positions are tinted red. 0 / undefined = none.
   */
  eliminatesCount?: number
}

/**
 * Standings table for a single group, with tiebreaker tooltips on headers and
 * optional advancement coloring (green = qualifies, red = eliminated). The
 * component stays presentational — qualify/eliminate counts are computed by the
 * caller from the stage's advancement rule and passed as props.
 */
export function StandingsTable({
  rows,
  qualifiesCount = 0,
  eliminatesCount = 0,
}: StandingsTableProps) {
  const total = rows.length
  const showLegend = qualifiesCount > 0 || eliminatesCount > 0

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={
                  col.key === 'team'
                    ? 'text-left'
                    : `text-center ${col.className ?? ''}`
                }
              >
                {col.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
                      {col.label}
                    </TooltipTrigger>
                    <TooltipContent>{col.tooltip}</TooltipContent>
                  </Tooltip>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const qualifies =
              qualifiesCount > 0 && row.position <= qualifiesCount
            const eliminated =
              eliminatesCount > 0 && row.position > total - eliminatesCount
            return (
            <TableRow
              key={row.team_id}
              className={cn(
                qualifies &&
                  'bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60',
                eliminated &&
                  'bg-red-50 hover:bg-red-100/70 dark:bg-red-950/40 dark:hover:bg-red-950/60',
              )}
            >
              <TableCell className="text-center font-medium">
                {row.position}
              </TableCell>
              <TableCell className="font-medium">{row.team_name}</TableCell>
              <TableCell className="text-center tabular-nums">
                {row.played}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {row.won}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {row.drawn}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {row.lost}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {row.goals_for}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {row.goals_against}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {row.goal_difference > 0
                  ? `+${row.goal_difference}`
                  : row.goal_difference}
              </TableCell>
              <TableCell className="text-center font-semibold tabular-nums">
                {row.points}
              </TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {showLegend ? (
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {qualifiesCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-800" />
              Clasifica
            </span>
          ) : null}
          {eliminatesCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-red-200 dark:bg-red-800" />
              Eliminado
            </span>
          ) : null}
        </div>
      ) : null}
    </TooltipProvider>
  )
}
