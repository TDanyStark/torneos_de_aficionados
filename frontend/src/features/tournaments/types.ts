/**
 * Tournaments domain types — mirror the backend JSON shapes exactly (snake_case).
 */

export type TournamentStatus =
  | 'draft'
  | 'registration'
  | 'in_progress'
  | 'finished'
  | 'archived'

export type StageType = 'league' | 'groups' | 'knockout'

/** Stage lifecycle status (backend enum, default `pending`). */
export type StageStatus = 'pending' | 'in_progress' | 'finished'

/** 1 = single leg, 2 = home & away (ida/vuelta). */
export type StageLegs = 1 | 2

/** Backend booleans are emitted as 0 | 1 tinyints. */
export type BackendBool = 0 | 1

/** Sport.default_config JSON column. */
export interface SportDefaultConfig {
  periods: number
  points_win: number
  points_draw: number
  points_loss: number
  allows_draws: boolean
}

/** Sport entity — GET /api/v1/sports. */
export interface Sport {
  id: number
  module_key: string
  name: string
  slug: string
  variant: string | null
  players_per_side: number
  default_config: SportDefaultConfig
  is_active: BackendBool
}

/**
 * Prize map (JSON column on the backend). Each placement is an optional free
 * text label; the backend strips empty strings and stores `null` when empty.
 */
export interface Prizes {
  first?: string | null
  second?: string | null
  third?: string | null
  others?: string | null
}

/** Tournament entity. */
export interface Tournament {
  id: number
  sport_id: number
  owner_user_id: number
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  status: TournamentStatus
  periods_count: number
  points_win: number
  points_draw: number
  points_loss: number
  allow_late_registration: BackendBool
  registration_open: BackendBool
  registration_code: string | null
  starts_at: string | null
  /** Fase 9 — datetime string (YYYY-MM-DD or with time) or null. */
  ends_at: string | null
  timezone: string | null
  /** Fase 9 — free-text reglamento. */
  rules: string | null
  /** Fase 9 — prize map; null when no prizes configured. */
  prizes: Prizes | null
  /** Fase 9 — booleans emitted as JSON true/false (not tinyint). */
  suspension_red_card: boolean
  suspension_double_yellow: boolean
  /** Fase 9 — null = sin límite (UI deferred to Fase 15). */
  roster_limit: number | null
  /** Fase 9 — información para inscritos. */
  registration_info: string | null
  created_at: string
  updated_at: string
}

/** Stage entity. */
export interface Stage {
  id: number
  tournament_id: number
  name: string
  type: StageType
  position: number
  legs: StageLegs
  /** JSON column — tiebreaker keys ordered by priority. */
  tiebreakers: string[] | null
  status: StageStatus
  /** Knockout bracket size (4/8/16/32/64/128); null for league/groups. */
  bracket_size: number | null
}

/** Group entity. */
export interface Group {
  id: number
  stage_id: number
  name: string
  position: number
}

/**
 * Group-team assignment entity — GET /groups/{id}/teams.
 * `team_name` is embedded by the backend for display (may be null).
 */
export interface GroupTeam {
  id: number
  group_id: number
  tournament_team_id: number
  seed: number | null
  team_name: string | null
  created_at?: string
  updated_at?: string
}

/** Advancement rule entity. */
export interface AdvancementRule {
  id: number
  stage_id: number
  group_id: number | null
  qualifies_count: number
  eliminates_count: number
  target_stage_id: number | null
}

/* ------------------------------------------------------------------ */
/* Request payloads (write operations)                                 */
/* ------------------------------------------------------------------ */

export interface CreateTournamentPayload {
  sport_id: number
  name: string
  description?: string | null
  logo_url?: string | null
  periods_count: number
  points_win: number
  points_draw: number
  points_loss: number
  allow_late_registration: BackendBool
  registration_open: BackendBool
  starts_at?: string | null
  timezone?: string | null
}

/**
 * Minimal payload for low-friction creation. Only the sport and name are sent;
 * the backend seeds points/periods from `sport.default_config` and leaves the
 * rest at sensible defaults (configured later in the edit view).
 */
export interface CreateTournamentMinimalPayload {
  sport_id: number
  name: string
}

export type UpdateTournamentPayload = Partial<CreateTournamentPayload> & {
  status?: TournamentStatus
  /** Fase 9 — editable enrichment fields (partial-update friendly). */
  ends_at?: string | null
  rules?: string | null
  prizes?: Prizes | null
  suspension_red_card?: boolean
  suspension_double_yellow?: boolean
  registration_info?: string | null
  /** Fase 15 — null = sin límite. */
  roster_limit?: number | null
}

/** Fase 9 — response of POST /tournaments/{id}/logo. */
export interface UploadLogoResponse {
  logo_url: string
  tournament: Tournament
}

export interface CreateStagePayload {
  name: string
  type: StageType
  legs: StageLegs
  tiebreakers?: string[] | null
  /** Only meaningful for knockout stages; backend validates the value set. */
  bracket_size?: number | null
}

export type UpdateStagePayload = Partial<CreateStagePayload>

export interface CreateGroupPayload {
  name: string
}

export type UpdateGroupPayload = Partial<CreateGroupPayload>

/** Assign a team to a group — POST /groups/{id}/teams. */
export interface AssignGroupTeamPayload {
  tournament_team_id: number
  seed?: number | null
}

/** Auto-distribute payload — POST /stages/{id}/groups/distribute. */
export interface DistributeGroupsPayload {
  count: number
  random?: boolean
}

/** Response of POST /stages/{id}/groups/distribute. */
export interface DistributeGroupsResult {
  stage_id: number
  groups_created: number
  teams_distributed: number
}

export interface CreateAdvancementRulePayload {
  group_id?: number | null
  qualifies_count: number
  eliminates_count: number
  target_stage_id?: number | null
}

export type UpdateAdvancementRulePayload = Partial<CreateAdvancementRulePayload>

/* ------------------------------------------------------------------ */
/* Roles (designate referee/delegate by email)                         */
/* ------------------------------------------------------------------ */

/** Roles assignable through the roles endpoint (organizer is set at creation). */
export type DesignableRole = 'referee' | 'delegate'

/** Every role value that can appear on a role row. */
export type TournamentRoleValue = DesignableRole | 'organizer' | 'player'

/** A role row as listed by GET /tournaments/{id}/roles. */
export interface TournamentRole {
  id: number
  tournament_id: number
  user_id: number
  role: TournamentRoleValue
  team_id: number | null
  /** Backend embeds the user's name/email as flat columns for display. */
  user_name?: string | null
  user_email?: string | null
}

export interface CreateRolePayload {
  email: string
  role: DesignableRole
  team_id?: number | null
}

/* ------------------------------------------------------------------ */
/* Referees (Fase 13 — tournament-level referee directory)             */
/* ------------------------------------------------------------------ */

/** Referee entity — GET /tournaments/{id}/referees. */
export interface Referee {
  id: number
  tournament_id: number
  name: string
  created_at?: string
  updated_at?: string
}

/** POST /tournaments/{id}/referees and PUT /referees/{id}. */
export interface RefereePayload {
  name: string
}

/** POST /matches/{id}/referee — `null` clears the assignment. */
export interface AssignMatchRefereePayload {
  referee_id: number | null
}

/**
 * POST /stages/{id}/assign-referee — bulk assignment. Omitting `round_id`
 * (or sending null) applies to every match of the stage; a `round_id` scopes
 * the bulk update to that round only. `referee_id: null` clears the referee.
 */
export interface AssignStageRefereePayload {
  referee_id: number | null
  round_id?: number | null
}

/** Result of POST /stages/{id}/assign-referee. */
export interface AssignStageRefereeResult {
  stage_id: number
  referee_id: number | null
  round_id: number | null
  matches_updated: number
}

/* ------------------------------------------------------------------ */
/* List filters (URL-driven)                                           */
/* ------------------------------------------------------------------ */

export interface TournamentFilters {
  page: number
  q?: string
  sport?: number
  status?: TournamentStatus
}
