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
}

/** Standings table for a single group, with tiebreaker tooltips on headers. */
export function StandingsTable({ rows }: StandingsTableProps) {
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
          {rows.map((row) => (
            <TableRow key={row.team_id}>
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
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}
