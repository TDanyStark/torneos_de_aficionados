import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Tournament } from '../types'
import { TournamentStatusBadge } from './TournamentStatusBadge'

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString()
}

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const startsAt = formatDate(tournament.starts_at)

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{tournament.name}</CardTitle>
          <TournamentStatusBadge status={tournament.status} />
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        {tournament.description ? (
          <p className="line-clamp-2">{tournament.description}</p>
        ) : (
          <p className="italic">Sin descripción</p>
        )}
        {startsAt ? (
          <p className="mt-2 flex items-center gap-1.5">
            <Calendar className="size-4" />
            {startsAt}
          </p>
        ) : null}
      </CardContent>
      <CardFooter>
        <Link
          to={`/t/${tournament.slug}`}
          className="text-primary text-sm font-medium hover:underline"
        >
          Ver detalle →
        </Link>
      </CardFooter>
    </Card>
  )
}
