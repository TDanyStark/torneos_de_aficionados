import type { ReactNode } from 'react'
import {
  CircleDot,
  Flag,
  RectangleVertical,
  ShieldAlert,
  Volleyball,
} from 'lucide-react'
import type { EventType, RecordableEventType } from '../types'

/** Spanish labels for every event type (markers included). */
export const EVENT_LABELS: Record<EventType, string> = {
  goal: 'Gol',
  own_goal: 'Autogol',
  yellow_card: 'Amarilla',
  red_card: 'Roja',
  period_start: 'Inicio de período',
  period_end: 'Fin de período',
}

/** Short labels for the referee action buttons. */
export const RECORDABLE_LABELS: Record<RecordableEventType, string> = {
  goal: 'Gol',
  own_goal: 'Autogol',
  yellow_card: 'Amarilla',
  red_card: 'Roja',
}

/** Icon for a timeline event. */
export function eventIcon(type: EventType, className = 'size-4'): ReactNode {
  switch (type) {
    case 'goal':
      return <Volleyball className={className} />
    case 'own_goal':
      return <CircleDot className={className} />
    case 'yellow_card':
      return (
        <RectangleVertical className={`${className} fill-yellow-400 text-yellow-500`} />
      )
    case 'red_card':
      return (
        <RectangleVertical className={`${className} fill-red-500 text-red-600`} />
      )
    case 'period_start':
    case 'period_end':
      return <Flag className={className} />
    default:
      return <ShieldAlert className={className} />
  }
}

/** True for the markers rendered as timeline dividers (null team/player). */
export function isMarker(type: EventType): boolean {
  return type === 'period_start' || type === 'period_end'
}
