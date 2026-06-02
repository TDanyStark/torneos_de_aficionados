import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CardRow } from '../types'

interface DisciplineTableProps {
  rows: CardRow[]
  /** 1-based offset of the first row on this page. */
  startIndex: number
}

/** Disciplina table — player, team, yellow/red counts (reds then yellows DESC). */
export function DisciplineTable({ rows, startIndex }: DisciplineTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8 text-center">#</TableHead>
          <TableHead className="text-left">Jugador</TableHead>
          <TableHead className="text-left">Equipo</TableHead>
          <TableHead className="text-center">
            <span className="text-yellow-500">Amarillas</span>
          </TableHead>
          <TableHead className="text-center">
            <span className="text-red-600">Rojas</span>
          </TableHead>
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
            <TableCell className="text-center tabular-nums">
              {row.yellow_cards}
            </TableCell>
            <TableCell className="text-center font-semibold tabular-nums">
              {row.red_cards}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
