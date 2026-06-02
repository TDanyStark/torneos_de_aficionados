import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/StateMessage'
import type { MatchEvent } from '../types'
import { EVENT_LABELS, eventIcon, isMarker } from './eventMeta'

interface LiveTimelineProps {
  events: MatchEvent[]
  /** Resolve teamId → display name for events whose team_name is null. */
  nameOf: (teamId: number | null | undefined) => string
  /** When provided, goal/card rows show a delete button (referee view). */
  onDelete?: (eventId: number) => void
  /** Event id currently being deleted (disables its button). */
  deletingId?: number | null
}

/** Ordered event timeline. Markers render as period dividers. */
export function LiveTimeline({
  events,
  nameOf,
  onDelete,
  deletingId,
}: LiveTimelineProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="Sin eventos"
        description="Aún no se han registrado acciones en este partido."
      />
    )
  }

  return (
    <ol className="space-y-1.5">
      {events.map((event) => {
        if (isMarker(event.type)) {
          return (
            <li
              key={event.id}
              className="text-muted-foreground flex items-center gap-2 py-1 text-xs uppercase tracking-wide"
            >
              <span className="bg-border h-px flex-1" />
              <span className="flex items-center gap-1">
                {eventIcon(event.type, 'size-3.5')}
                {EVENT_LABELS[event.type]}
              </span>
              <span className="bg-border h-px flex-1" />
            </li>
          )
        }

        const teamName = event.team_name ?? nameOf(event.team_id)
        const deletable =
          onDelete &&
          (event.type === 'goal' ||
            event.type === 'own_goal' ||
            event.type === 'yellow_card' ||
            event.type === 'red_card') &&
          event.id > 0

        return (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground w-8 text-right tabular-nums">
              {event.minute != null ? `${event.minute}'` : '—'}
            </span>
            <span className="shrink-0">{eventIcon(event.type)}</span>
            <span className="flex-1">
              <span className="font-medium">{EVENT_LABELS[event.type]}</span>
              {event.player_name ? (
                <span className="text-muted-foreground"> · {event.player_name}</span>
              ) : null}
              <span className="text-muted-foreground"> · {teamName}</span>
            </span>
            {deletable ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive size-7 shrink-0"
                disabled={deletingId === event.id}
                onClick={() => onDelete?.(event.id)}
                aria-label="Eliminar evento"
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
