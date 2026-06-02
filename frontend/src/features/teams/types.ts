/**
 * Teams / Players / Registrations domain types — mirror the backend JSON
 * shapes exactly (snake_case). Booleans may arrive as 0 | 1 tinyints.
 */
import type { BackendBool } from '@/features/tournaments/types'

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

export type TeamStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

/** Tournament team entity. */
export interface Team {
  id: number
  tournament_id: number
  name: string
  short_name: string | null
  logo_url: string | null
  coach_name: string | null
  delegate_user_id: number | null
  status: TeamStatus
  created_at: string
  updated_at: string
}

export interface CreateTeamPayload {
  name: string
  short_name?: string | null
  logo_url?: string | null
  coach_name?: string | null
}

export type UpdateTeamPayload = Partial<CreateTeamPayload> & {
  status?: TeamStatus
}

/** URL-driven team list filters. */
export interface TeamFilters {
  page: number
  q?: string
  status?: TeamStatus
}

/* ------------------------------------------------------------------ */
/* Players (organizer pool) + roster                                   */
/* ------------------------------------------------------------------ */

/** Player entity — the organizer-private pool (identity = document_id). */
export interface Player {
  id: number
  organizer_user_id: number
  user_id: number | null
  document_id: string
  full_name: string
  birthdate: string | null
  photo_url: string | null
  phone: string | null
  alias: string | null
  created_at: string
  updated_at: string
}

/** Roster entry: a player attached to a specific team. */
export interface TeamPlayer {
  id: number
  tournament_team_id: number
  player_id: number
  shirt_number: number | null
  position: string | null
  is_captain: BackendBool
  is_delegate: BackendBool
  status: string
  /** Flattened player columns embedded by the backend for display. */
  document_id: string
  full_name: string
  birthdate: string | null
  photo_url: string | null
  phone: string | null
  alias: string | null
  created_at: string
  updated_at: string
}

/**
 * Add-player payload. `document_id` is always required; personal fields are
 * only needed when the player does not yet exist in the organizer pool.
 */
export interface AddPlayerPayload {
  document_id: string
  shirt_number?: number | null
  position?: string | null
  is_captain?: boolean
  is_delegate?: boolean
  /** Required only when creating a brand-new player. */
  full_name?: string
  birthdate?: string | null
  photo_url?: string | null
  phone?: string | null
  alias?: string | null
}

export interface UpdateTeamPlayerPayload {
  shirt_number?: number | null
  position?: string | null
  is_captain?: boolean
  is_delegate?: boolean
}

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */

export type RegistrationChannel = 'manual' | 'self_link'

export type RegistrationStatus =
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'rejected'

/** Registration entity. */
export interface Registration {
  id: number
  tournament_id: number
  tournament_team_id: number
  channel: RegistrationChannel
  status: RegistrationStatus
  is_late: BackendBool
  joined_at_round: number | null
  team_name: string
  team_status: TeamStatus
  created_at: string
  updated_at: string
}

/** A roster player in the self-registration payload. */
export interface RegistrationPlayerInput {
  document_id: string
  full_name: string
  birthdate?: string | null
  phone?: string | null
  alias?: string | null
  shirt_number?: number | null
  position?: string | null
  photo_url?: string | null
  is_captain?: boolean
}

/** Self-registration payload (POST /tournaments/{id}/registrations). */
export interface CreateRegistrationPayload {
  registration_code: string
  team_name: string
  short_name?: string | null
  logo_url?: string | null
  coach_name?: string | null
  players: RegistrationPlayerInput[]
  joined_at_round?: number | null
}

/** Response of the self-registration logo upload helper. */
export interface UploadRegistrationLogoResponse {
  logo_url: string
}

/** Response of the self-registration player-photo upload helper. */
export interface UploadRegistrationPhotoResponse {
  photo_url: string
}

/** Response of PATCH /registrations/{id}. */
export interface RegistrationDecisionResult {
  registration: Registration
  team: Team
}

/** URL-driven registrations inbox filters. */
export interface RegistrationFilters {
  page: number
  status?: RegistrationStatus
  channel?: RegistrationChannel
}

/**
 * Read-model row for the "Mis inscripciones" view (GET /me/registrations):
 * one row per team the current user enrolled as delegate.
 */
export interface MyRegistration {
  registration_id: number
  registration_status: RegistrationStatus
  channel: RegistrationChannel
  is_late: BackendBool
  team_id: number
  team_name: string
  team_status: TeamStatus
  tournament_id: number
  tournament_name: string
  tournament_slug: string
  tournament_logo_url: string | null
  tournament_state: string
}

/* ------------------------------------------------------------------ */
/* Player history (derived, organizer-owner only)                      */
/* ------------------------------------------------------------------ */

export interface PlayerHistoryEntry {
  tournament_id: number
  tournament_name: string
  tournament_slug: string
  tournament_status: string
  team_id: number
  team_name: string
  shirt_number: number | null
  position: string | null
  is_captain: BackendBool
  is_delegate: BackendBool
  goals: number
  cards: number
}

export interface PlayerHistory {
  player: Player
  history: PlayerHistoryEntry[]
  note: string | null
}
