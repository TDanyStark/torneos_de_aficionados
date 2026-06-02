import { z } from 'zod'

/**
 * Numeric fields are kept as STRINGS (controlled number inputs always yield a
 * string) and converted in the submit handlers — mirrors the tournaments
 * schema convention so z.input === z.output and RHF infers cleanly.
 */
const optionalPositiveIntString = z
  .string()
  .optional()
  .refine(
    (v) => v === undefined || v === '' || /^\d+$/.test(v),
    'Debe ser un número entero',
  )

/** Team create / edit form. */
export const teamSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  short_name: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  coach_name: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
})

export type TeamFormValues = z.infer<typeof teamSchema>

export const DEFAULT_TEAM_FORM: TeamFormValues = {
  name: '',
  short_name: '',
  logo_url: '',
  coach_name: '',
}

/** Add-player form. Personal fields are validated conditionally in the UI. */
export const addPlayerSchema = z.object({
  document_id: z.string().min(3, 'La cédula es obligatoria'),
  full_name: z.string().optional().or(z.literal('')),
  birthdate: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  photo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  alias: z.string().max(60, 'Máximo 60 caracteres').optional().or(z.literal('')),
  shirt_number: optionalPositiveIntString,
  position: z.string().optional().or(z.literal('')),
  is_captain: z.boolean(),
  is_delegate: z.boolean(),
})

export type AddPlayerFormValues = z.infer<typeof addPlayerSchema>

export const DEFAULT_ADD_PLAYER_FORM: AddPlayerFormValues = {
  document_id: '',
  full_name: '',
  birthdate: '',
  phone: '',
  photo_url: '',
  alias: '',
  shirt_number: '',
  position: '',
  is_captain: false,
  is_delegate: false,
}

/** Self-registration form (team + optional delegate-player). */
export const selfRegistrationSchema = z.object({
  team_name: z.string().min(2, 'El nombre del equipo es obligatorio'),
  short_name: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  coach_name: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  is_player: z.boolean(),
  document_id: z.string().optional().or(z.literal('')),
  full_name: z.string().optional().or(z.literal('')),
  birthdate: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  alias: z.string().max(60, 'Máximo 60 caracteres').optional().or(z.literal('')),
  shirt_number: optionalPositiveIntString,
  position: z.string().optional().or(z.literal('')),
  is_captain: z.boolean(),
})

export type SelfRegistrationFormValues = z.infer<typeof selfRegistrationSchema>

export const DEFAULT_SELF_REGISTRATION_FORM: SelfRegistrationFormValues = {
  team_name: '',
  short_name: '',
  logo_url: '',
  coach_name: '',
  is_player: false,
  document_id: '',
  full_name: '',
  birthdate: '',
  phone: '',
  alias: '',
  shirt_number: '',
  position: '',
  is_captain: false,
}
