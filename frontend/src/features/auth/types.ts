/**
 * Auth domain types — mirror the backend JSON shapes exactly (snake_case).
 */

export type TournamentRoleName = 'organizer' | 'referee' | 'delegate'

/** A role the current user holds within a specific tournament. */
export interface UserTournamentRole {
  tournament_id: number
  role: TournamentRoleName
  /** Present when the role is scoped to a team (e.g. delegate). Null otherwise. */
  team_id: number | null
}

/** Authenticated user as returned by GET /api/v1/me (data.user). */
export interface AuthUser {
  id: number
  name: string
  email: string
  created_at?: string
  updated_at?: string
}

/** Full payload of GET /api/v1/me → { user, roles }. */
export interface MeResponse {
  user: AuthUser
  roles: UserTournamentRole[]
}

/** Login request payload. NOTE: assumed shape email+password (Fase 1 contract). */
export interface LoginPayload {
  email: string
  password: string
}

/** Login response (data). NOTE: assumed to contain a JWT token + user. */
export interface LoginResponse {
  token: string
  user: AuthUser
}
