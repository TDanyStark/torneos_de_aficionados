import { z } from 'zod'
import type { RecordableEventType } from './types'

/**
 * Record-event form. Numeric fields are kept as STRINGS (controlled inputs /
 * react-select always yield strings) and coerced in the submit handler — same
 * convention as features/teams/schemas.ts so z.input === z.output.
 */

export const RECORDABLE_EVENT_TYPES: RecordableEventType[] = [
  'goal',
  'own_goal',
  'yellow_card',
  'red_card',
]

export const recordEventSchema = z.object({
  type: z.enum(['goal', 'own_goal', 'yellow_card', 'red_card']),
  /** tournament_teams.id — must be the match home or away team. */
  team_id: z
    .string()
    .min(1, 'Selecciona el equipo')
    .refine((v) => /^\d+$/.test(v), 'Equipo inválido'),
  /** players.id — must belong to the selected team's roster. */
  player_id: z
    .string()
    .min(1, 'Selecciona el jugador')
    .refine((v) => /^\d+$/.test(v), 'Jugador inválido'),
  minute: z
    .string()
    .min(1, 'Indica el minuto')
    .refine((v) => /^\d+$/.test(v) && Number(v) <= 200, 'Minuto inválido'),
})

export type RecordEventFormValues = z.infer<typeof recordEventSchema>

export const DEFAULT_RECORD_EVENT_FORM: RecordEventFormValues = {
  type: 'goal',
  team_id: '',
  player_id: '',
  minute: '',
}
