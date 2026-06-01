import { z } from 'zod'
import type { StageLegs, StageType } from './types'

/** Step 1 — basics. */
export const basicsSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  sport_id: z
    .number({ message: 'Selecciona un deporte' })
    .int()
    .positive('Selecciona un deporte'),
  description: z.string().max(1000).optional().or(z.literal('')),
  logo_url: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
})

export type BasicsValues = z.infer<typeof basicsSchema>

/** Step 2 — configuration. */
export const configSchema = z.object({
  periods_count: z.coerce.number().int().min(1, 'Mínimo 1 periodo'),
  points_win: z.coerce.number().int().min(0),
  points_draw: z.coerce.number().int().min(0),
  points_loss: z.coerce.number().int().min(0),
  allow_late_registration: z.boolean(),
  registration_open: z.boolean(),
  starts_at: z.string().optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
})

export type ConfigValues = z.infer<typeof configSchema>

/** Full tournament create form = basics + config. */
export const tournamentFormSchema = basicsSchema.merge(configSchema)
export type TournamentFormValues = z.infer<typeof tournamentFormSchema>

/** Stage form (step 3). */
const STAGE_TYPES: [StageType, ...StageType[]] = [
  'league',
  'groups',
  'knockout',
]
const STAGE_LEGS: [StageLegs, ...StageLegs[]] = [1, 2]

export const stageSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  type: z.enum(STAGE_TYPES),
  position: z.coerce.number().int().min(1),
  legs: z
    .union([z.literal(1), z.literal(2)])
    .refine((v): v is StageLegs => STAGE_LEGS.includes(v as StageLegs)),
})

export type StageFormValues = z.infer<typeof stageSchema>

/** Group form (step 4). */
export const groupSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  position: z.coerce.number().int().min(1),
})

export type GroupFormValues = z.infer<typeof groupSchema>

/** Advancement rule form (step 5). */
export const advancementRuleSchema = z.object({
  group_id: z.coerce.number().int().positive().optional().nullable(),
  qualifies_count: z.coerce.number().int().min(0),
  eliminates_count: z.coerce.number().int().min(0),
  target_stage_id: z.coerce.number().int().positive().optional().nullable(),
})

export type AdvancementRuleFormValues = z.infer<typeof advancementRuleSchema>
