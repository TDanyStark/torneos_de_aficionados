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
  short_name: z.string().max(3, 'Máximo 3 caracteres').optional().or(z.literal('')),
  // Relative upload path (e.g. /uploads/teams/<hex>.jpg) — not an absolute URL.
  logo_url: z.string().max(2048).optional().or(z.literal('')),
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
  // Relative upload path (e.g. /uploads/players/<hex>.jpg) — not an absolute URL.
  photo_url: z.string().max(2048).optional().or(z.literal('')),
  alias: z.string().max(60, 'Máximo 60 caracteres').optional().or(z.literal('')),
  shirt_number: optionalPositiveIntString,
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
  is_captain: false,
  is_delegate: false,
}

/**
 * Per-player roster edit form (organizer/delegate). Only roster fields the
 * backend `PUT /team-players/{id}` accepts are editable here; the player's core
 * identity (name, cédula) is read-only because no backend endpoint mutates it.
 */
export const editTeamPlayerSchema = z.object({
  shirt_number: optionalPositiveIntString,
  position: z.string().max(40, 'Máximo 40 caracteres').optional().or(z.literal('')),
  is_captain: z.boolean(),
  is_delegate: z.boolean(),
})

export type EditTeamPlayerFormValues = z.infer<typeof editTeamPlayerSchema>

/** A single roster player inside the self-registration form. */
export const selfRegistrationPlayerSchema = z.object({
  document_id: z.string().min(3, 'La cédula es obligatoria'),
  full_name: z.string().min(2, 'El nombre del jugador es obligatorio'),
  birthdate: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  alias: z.string().max(60, 'Máximo 60 caracteres').optional().or(z.literal('')),
  shirt_number: optionalPositiveIntString,
  position: z.string().optional().or(z.literal('')),
  /** Photo URL set after uploading via the registration-photo endpoint. */
  photo_url: z.string().optional().or(z.literal('')),
  is_captain: z.boolean(),
})

export type SelfRegistrationPlayerValues = z.infer<
  typeof selfRegistrationPlayerSchema
>

export const DEFAULT_SELF_REGISTRATION_PLAYER: SelfRegistrationPlayerValues = {
  document_id: '',
  full_name: '',
  birthdate: '',
  phone: '',
  alias: '',
  shirt_number: '',
  position: '',
  photo_url: '',
  is_captain: false,
}

/** Self-registration form: team data + a roster of at least one player. */
export const selfRegistrationSchema = z.object({
  team_name: z.string().min(2, 'El nombre del equipo es obligatorio'),
  short_name: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  /** Logo URL set after uploading via the registration-logo endpoint. */
  logo_url: z.string().optional().or(z.literal('')),
  coach_name: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  players: z
    .array(selfRegistrationPlayerSchema)
    .min(1, 'Debes inscribir al menos un jugador'),
})

export type SelfRegistrationFormValues = z.infer<typeof selfRegistrationSchema>

export const DEFAULT_SELF_REGISTRATION_FORM: SelfRegistrationFormValues = {
  team_name: '',
  short_name: '',
  logo_url: '',
  coach_name: '',
  players: [{ ...DEFAULT_SELF_REGISTRATION_PLAYER }],
}
