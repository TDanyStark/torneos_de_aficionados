import { Crown, Shield, Trash2, UserCog } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmptyState } from '@/components/shared/StateMessage'
import type { TeamPlayer } from '../types'

interface RosterTableProps {
  players: TeamPlayer[]
  /** When provided, renders a remove action per row (management view). */
  onRemove?: (teamPlayerId: number) => void
  removingId?: number | null
}

export function RosterTable({ players, onRemove, removingId }: RosterTableProps) {
  if (players.length === 0) {
    return (
      <EmptyState
        title="Plantilla vacía"
        description="Aún no hay jugadores en este equipo."
      />
    )
  }

  return (
    <ul className="divide-y rounded-md border">
      {players.map((p) => (
        <li key={p.id} className="flex items-center gap-3 p-3">
          <Avatar className="size-9">
            {p.photo_url ? <AvatarImage src={p.photo_url} alt={p.full_name} /> : null}
            <AvatarFallback>
              {p.full_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{p.full_name}</span>
              {p.is_captain === 1 ? (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="size-3" />
                  Capitán
                </Badge>
              ) : null}
              {p.is_delegate === 1 ? (
                <Badge variant="outline" className="gap-1">
                  <UserCog className="size-3" />
                  Delegado
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs">
              Cédula {p.document_id}
              {p.position ? ` · ${p.position}` : ''}
              {` · Alias: ${p.alias ?? '—'}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {p.shirt_number != null ? (
              <span className="bg-muted flex size-8 items-center justify-center rounded-full text-sm font-semibold">
                {p.shirt_number}
              </span>
            ) : (
              <Shield className="text-muted-foreground size-4" />
            )}
            {onRemove ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Quitar jugador"
                disabled={removingId === p.id}
                onClick={() => onRemove(p.id)}
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
