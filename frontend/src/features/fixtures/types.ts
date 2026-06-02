/**
 * Fixtures domain types — mirror the Fase 4 backend JSON shapes EXACTLY
 * (snake_case). Field names verified against the live API contract
 * (engram sdd/fase-4/apply-backend-b). Booleans may arrive as 0 | 1.
 */

/* ------------------------------------------------------------------ */
/* Rounds (jornadas)                                                   */
/* ------------------------------------------------------------------ */

export type RoundStatus = 'pending' | 'in_progress' | 'finished'

/** Round (jornada) entity — GET /tournaments/{id}/rounds (number ASC). */
export interface Round {
  id: number
  stage_id: number
  group_id: number | null
  number: number
  name: string | null
  scheduled_date: string | null
  status: RoundStatus
  created_at: string
  updated_at: string
}

/* ------------------------------------------------------------------ */
/* Matches                                                             */
/* ------------------------------------------------------------------ */

export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'finished'
  | 'postponed'
  | 'walkover'

/** Match entity — GET /tournaments/{id}/matches (round.number ASC). */
export interface Match {
  id: number
  tournament_id: number
  stage_id: number
  group_id: number | null
  round_id: number | null
  home_team_id: number | null
  away_team_id: number | null
  home_score: number | null
  away_score: number | null
  winner_team_id: number | null
  status: MatchStatus
  venue: string | null
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  referee_user_id: number | null
  /** Fase 13 — assigned referee (directory entity), separate from referee_user_id (live-control user). */
  referee_id: number | null
  leg: number | null
  bracket_slot_id: number | null
  created_at: string
  updated_at: string
}

/** URL-driven fixtures (calendar) filters. */
export interface FixtureFilters {
  /** Group id (numeric) currently selected, or undefined for all groups. */
  group?: number
  /** Round number currently selected, or undefined for all rounds. */
  round?: number
  /** Optional match-status filter. */
  status?: MatchStatus
}

/** Editable fields for PUT /matches/{id} (scores NOT editable in Fase 4). */
export interface UpdateMatchPayload {
  venue?: string | null
  scheduled_at?: string | null
  referee_user_id?: number | null
}

/* ------------------------------------------------------------------ */
/* Manual fixtures CRUD (Fase 14, organizer mutations)                 */
/* ------------------------------------------------------------------ */

/** POST /stages/{id}/rounds — `number` auto-assigns (max+1) when omitted. */
export interface CreateRoundPayload {
  number?: number
  name?: string | null
  group_id?: number | null
  scheduled_date?: string | null
  status?: RoundStatus
}

/** PUT /rounds/{id} — partial update of a round. */
export type UpdateRoundPayload = Partial<CreateRoundPayload>

/**
 * POST /rounds/{id}/matches — manual match creation. Teams are nullable (TBD),
 * repeated pairings are allowed, but home === away is rejected server-side.
 */
export interface CreateMatchPayload {
  home_team_id?: number | null
  away_team_id?: number | null
  group_id?: number | null
  leg?: number
  venue?: string | null
  scheduled_at?: string | null
  referee_user_id?: number | null
}

/* ------------------------------------------------------------------ */
/* Standings (tabla de posiciones)                                     */
/* ------------------------------------------------------------------ */

/** A single row of the standings table — GET /groups/{id}/standings. */
export interface StandingRow {
  position: number
  team_id: number
  team_name: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

/** Standings response envelope (data) — GET /groups/{id}/standings. */
export interface StandingsResponse {
  group_id: number
  stage_id: number
  standings: StandingRow[]
}

/* ------------------------------------------------------------------ */
/* Generate / Regenerate fixtures (organizer mutations)               */
/* ------------------------------------------------------------------ */

/** Result of POST /stages/{id}/generate-fixtures. */
export interface GenerateResult {
  stage_id: number
  type: string
  rounds_created: number
  matches_created: number
  bracket_slots_created: number
}

/** Per-scope impact detail inside a regenerate result. */
export interface RegenerateScope {
  group_id: number | null
  new_team_id: number
  joined_at_round: number | null
  preserved_round_numbers: number[]
  removed_round_ids: number[]
  affected_round_count: number
  matches_created: number
  rounds_removed: number
}

/** Result of POST /stages/{id}/regenerate-fixtures. */
export interface RegenerateResult {
  stage_id: number
  affected_round_count: number
  matches_created: number
  rounds_removed: number
  scopes: RegenerateScope[]
}
