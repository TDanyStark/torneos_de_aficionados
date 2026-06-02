import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TopScorer } from '../types'

interface TopScorersTableProps {
  rows: TopScorer[]
  /** 1-based offset of the first row on this page (for the rank column). */
  startIndex: number
}

/** Goleadores table — player, team, goals (goals DESC; own_goal excluded). */
export function TopScorersTable({ rows, startIndex }: TopScorersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8 text-center">#</TableHead>
          <TableHead className="text-left">Jugador</TableHead>
          <TableHead className="text-left">Equipo</TableHead>
          <TableHead className="text-center">Goles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={row.player_id}>
            <TableCell className="text-center font-medium tabular-nums">
              {startIndex + i}
            </TableCell>
            <TableCell className="font-medium">{row.player_name}</TableCell>
            <TableCell className="text-muted-foreground">
              {row.team_name ?? '—'}
            </TableCell>
            <TableCell className="text-center font-semibold tabular-nums">
              {row.goals}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
