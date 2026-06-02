import { Calendar } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AdSlot } from '@/components/shared/ads/AdSlot'
import type { Tournament } from '../types'

interface ResumenPanelProps {
  tournament: Tournament
}

/**
 * Summary panel for the tournament hub — extracted from the legacy
 * TournamentDetailPage body. Shows status/scoring/start info WITHOUT the old
 * navigation buttons (the hub tabs replace them) and surfaces the `header`
 * advertising slot scoped to this tournament (acceptance criterion 3).
 */
export function ResumenPanel({ tournament }: ResumenPanelProps) {
  return (
    <div className="space-y-5">
      <AdSlot placement="header" tournamentId={tournament.id} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del torneo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tournament.description ? (
            <p className="text-muted-foreground">{tournament.description}</p>
          ) : null}

          {tournament.starts_at ? (
            <p className="flex items-center gap-2 text-sm">
              <Calendar className="size-4" />
              Inicia: {new Date(tournament.starts_at).toLocaleString()}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Periodos</dt>
              <dd className="font-medium">{tournament.periods_count}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Victoria</dt>
              <dd className="font-medium">{tournament.points_win} pts</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Empate</dt>
              <dd className="font-medium">{tournament.points_draw} pts</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Derrota</dt>
              <dd className="font-medium">{tournament.points_loss} pts</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
