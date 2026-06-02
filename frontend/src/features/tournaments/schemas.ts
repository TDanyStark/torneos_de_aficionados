import { z } from 'zod'
import type { StageType } from './types'

/**
 * Numeric form fields are kept as STRINGS in the schema because controlled
 * `<input type="number">` + `{...field}` always yields a string. We validate
 * that the string is a valid integer and convert to a number in the mappers.
 * This keeps z.input === z.output, so RHF infers types cleanly (no coercion
 * input/output mismatch).
 */
const intString = (opts?: { min?: number; message?: string }) =>
  z
    .string()
    .min(1, opts?.message ?? 'Requerido')
    .refine((v) => /^-?\d+$/.test(v), 'Debe ser un número entero')
    .refine(
      (v) => opts?.min === undefined || Number(v) >= opts.min,
      opts?.min !== undefined ? `Mínimo ${opts.min}` : 'Valor inválido',
    )

/** Step 1 — basics. */
export const basicsSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  sport_id: z
    .number({ message: 'Selecciona un deporte' })
    .int()
    .positive('Selecciona un deporte'),
  description: z.string().max(1000).optional().or(z.literal('')),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

export type BasicsValues = z.infer<typeof basicsSchema>

/**
 * Minimal create schema — sport + name only. The backend seeds points/periods
 * from `sport.default_config`; everything else is configured later in the edit
 * view. Kept dedicated (not derived from the shared schemas) so the create flow
 * stays decoupled from the full edit form.
 */
export const createTournamentSchema = z.object({
  sport_id: z
    .number({ message: 'Selecciona un deporte' })
    .int()
    .positive('Selecciona un deporte'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
})

export type CreateTournamentValues = z.infer<typeof createTournamentSchema>

/** Step 2 — configuration. */
export const configSchema = z.object({
  periods_count: intString({ min: 1, message: 'Mínimo 1 periodo' }),
  points_win: intString({ min: 0 }),
  points_draw: intString({ min: 0 }),
  points_loss: intString({ min: 0 }),
  allow_late_registration: z.boolean(),
  registration_open: z.boolean(),
  starts_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
    .optional()
    .or(z.literal('')),
  /** Fase 9 — fecha de finalización (mismo formato que starts_at). */
  ends_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
    .optional()
    .or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
  /** Fase 9 — reglamento e información de inscripción (texto libre). */
  rules: z.string().max(5000).optional().or(z.literal('')),
  registration_info: z.string().max(5000).optional().or(z.literal('')),
  /** Fase 9 — premios por posición (texto libre opcional). */
  prize_first: z.string().max(255).optional().or(z.literal('')),
  prize_second: z.string().max(255).optional().or(z.literal('')),
  prize_third: z.string().max(255).optional().or(z.literal('')),
  prize_others: z.string().max(255).optional().or(z.literal('')),
  /** Fase 9 — disciplina (suspensiones). */
  suspension_red_card: z.boolean(),
  suspension_double_yellow: z.boolean(),
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

/** Knockout bracket sizes accepted by the backend (as select strings). */
export const BRACKET_SIZES = ['4', '8', '16', '32', '64', '128'] as const

export const stageSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  type: z.enum(STAGE_TYPES),
  /** Stored as '1' | '2' from the select. */
  legs: z.enum(['1', '2']),
  /** Only used when type === 'knockout'; stored as a select string. */
  bracket_size: z.enum(BRACKET_SIZES).optional(),
})

export type StageFormValues = z.infer<typeof stageSchema>

/** Group form (step 4). */
export const groupSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
})

export type GroupFormValues = z.infer<typeof groupSchema>

/**
 * Advancement rule form (step 5). `group_id`/`target_stage_id` come from
 * ReactSelect components, so they hold a numeric id or `null` (cleared).
 */
export const advancementRuleSchema = z.object({
  group_id: z.number().int().positive().nullable(),
  qualifies_count: intString({ min: 0 }),
  eliminates_count: intString({ min: 0 }),
  target_stage_id: z.number().int().positive().nullable(),
})

export type AdvancementRuleFormValues = z.infer<typeof advancementRuleSchema>
